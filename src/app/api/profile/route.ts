import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { updateProfileSchema } from "@/lib/validations/profile";

export async function PATCH(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const json = await request.json().catch(() => null);
  const parsed = updateProfileSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 },
    );
  }

  try {
    const user = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        name: parsed.data.name,
        ...(parsed.data.image !== undefined ? { image: parsed.data.image } : {}),
      },
      select: { name: true, image: true },
    });

    return NextResponse.json({ name: user.name, image: user.image });
  } catch (error) {
    console.error("Failed to update profile:", error);
    return NextResponse.json(
      { error: "Failed to update profile. Please try again." },
      { status: 500 },
    );
  }
}
