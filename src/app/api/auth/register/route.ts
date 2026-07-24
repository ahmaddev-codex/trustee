import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";

import { prisma } from "@/lib/prisma";
import { signupSchema } from "@/lib/validations/auth";
import { generateAvatarUrl, randomSeed, AVATAR_PALETTE } from "@/lib/avatar";

export async function POST(request: Request) {
  const json = await request.json().catch(() => null);
  const parsed = signupSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 },
    );
  }

  const { name, email, password } = parsed.data;

  try {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json(
        { error: "An account with this email already exists" },
        { status: 409 },
      );
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const defaultImage = generateAvatarUrl(
      randomSeed(),
      AVATAR_PALETTE[Math.floor(Math.random() * AVATAR_PALETTE.length)],
    );

    const user = await prisma.user.create({
      data: { name, email, passwordHash, image: defaultImage },
      select: { id: true, name: true, email: true },
    });

    return NextResponse.json({ user }, { status: 201 });
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "Failed to create account. Please try again." },
      { status: 500 },
    );
  }
}
