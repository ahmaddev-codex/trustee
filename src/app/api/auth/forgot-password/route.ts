import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { forgotPasswordSchema } from "@/lib/validations/auth";
import { generateResetToken } from "@/lib/password-reset";
import { sendEmail } from "@/lib/email";

// Always responds with the same generic message regardless of whether the
// email is registered, to prevent signup enumeration.
const GENERIC_MESSAGE =
  "If an account exists for that email, we've sent a password reset link.";

export async function POST(request: Request) {
  const json = await request.json().catch(() => null);
  const parsed = forgotPasswordSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 },
    );
  }

  try {
    const user = await prisma.user.findUnique({ where: { email: parsed.data.email } });

    if (user) {
      const { raw, hash, expiresAt } = generateResetToken();

      await prisma.$transaction([
        // Invalidate any outstanding reset links before issuing a new one.
        prisma.passwordResetToken.deleteMany({ where: { userId: user.id, usedAt: null } }),
        prisma.passwordResetToken.create({
          data: { userId: user.id, tokenHash: hash, expiresAt },
        }),
      ]);

      const resetUrl = `${process.env.NEXTAUTH_URL}/reset-password?token=${raw}`;

      try {
        await sendEmail({
          to: user.email,
          subject: "Reset your Trustee password",
          html: `<p>Someone requested a password reset for your Trustee account.</p>
<p><a href="${resetUrl}">Reset your password</a></p>
<p>This link expires in an hour. If you didn't request this, you can ignore this email.</p>`,
        });
      } catch (error) {
        // Don't leak the delivery failure to the client - same reasoning as
        // the generic response below - but log it so it's discoverable.
        console.error("Failed to send password reset email:", error);
      }
    }

    return NextResponse.json({ message: GENERIC_MESSAGE });
  } catch (error) {
    console.error("Failed to process forgot-password request:", error);
    return NextResponse.json({ message: GENERIC_MESSAGE });
  }
}
