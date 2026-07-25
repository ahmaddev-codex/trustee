import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import bcrypt from "bcryptjs";

import { prisma } from "@/lib/prisma";

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: {
    strategy: "jwt",
    maxAge: 24 * 60 * 60,
    updateAge: 60 * 60,
  },
  pages: {
    signIn: "/login",
  },
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        confirmGoogleLink: { label: "Confirm Google link", type: "text" },
      },
      authorize: async (credentials) => {
        const email = credentials?.email;
        const password = credentials?.password;
        if (typeof email !== "string" || typeof password !== "string") {
          return null;
        }

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user || !user.passwordHash) return null;

        const valid = await bcrypt.compare(password, user.passwordHash);
        if (!valid) return null;

        // Reached via the "confirm your password to link Google" redirect —
        // this successful password login is the proof of ownership that unblocks Google sign-in.
        if (credentials?.confirmGoogleLink === "true" && !user.googleLinkedAt) {
          await prisma.user.update({
            where: { id: user.id },
            data: { googleLinkedAt: new Date() },
          });
        }

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          image: user.image,
        };
      },
    }),
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
  ],
  callbacks: {
    signIn: async ({ account, profile }) => {
      if (account?.provider !== "google" || !profile?.email) return true;

      // A password-holding account must confirm ownership via password login
      // first — otherwise a pre-registered email could hijack the real owner's Google sign-in.
      const existing = await prisma.user.findUnique({
        where: { email: profile.email },
        select: { passwordHash: true, googleLinkedAt: true },
      });
      if (existing?.passwordHash && !existing.googleLinkedAt) {
        return `/login?linkEmail=${encodeURIComponent(profile.email)}`;
      }
      return true;
    },
    jwt: async ({ token, user, account, profile, trigger, session }) => {
      if (account?.provider === "google" && profile?.email) {
        // No Prisma adapter — found/created by hand, same pattern as
        // Credentials' own findUnique above. Google emails are pre-verified.
        let dbUser = await prisma.user.findUnique({ where: { email: profile.email } });
        if (!dbUser) {
          dbUser = await prisma.user.create({
            data: {
              email: profile.email,
              name: profile.name ?? "Trustee user",
              image: typeof profile.picture === "string" ? profile.picture : null,
              passwordHash: null,
            },
          });
        }
        // Only a brand-new account gets Google's picture — existing accounts
        // keep whatever image they already have.
        token.id = dbUser.id;
        token.role = dbUser.role;
        token.picture = dbUser.image;
      } else if (user) {
        token.id = user.id;
        token.role = user.role;
        token.picture = user.image;
      }
      // Lets the settings form push a fresh name/image into the session
      // immediately (via useSession().update()) instead of waiting to re-login.
      if (trigger === "update" && session?.name) {
        token.name = session.name;
      }
      if (trigger === "update" && session?.image !== undefined) {
        token.picture = session.image;
      }
      return token;
    },
    session: async ({ session, token }) => {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as "USER" | "ADMIN";
        session.user.image = (token.picture as string | null) ?? null;
      }
      return session;
    },
  },
  trustHost: true,
});
