import { NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { nameEnquiry, MonnifyError } from "@/lib/monnify";

const schema = z.object({
  accountNumber: z.string().regex(/^\d{10}$/, "Account number must be 10 digits"),
  bankCode: z.string().min(1, "Choose a bank"),
});

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { bankAccountNumber: true, bankCode: true, bankAccountName: true },
  });

  return NextResponse.json({
    bankAccountNumber: user?.bankAccountNumber ?? null,
    bankCode: user?.bankCode ?? null,
    bankAccountName: user?.bankAccountName ?? null,
  });
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const json = await request.json().catch(() => null);
  const parsed = schema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 },
    );
  }

  try {
    const { accountName } = await nameEnquiry(
      parsed.data.accountNumber,
      parsed.data.bankCode,
    );

    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        bankAccountNumber: parsed.data.accountNumber,
        bankCode: parsed.data.bankCode,
        bankAccountName: accountName,
      },
    });

    return NextResponse.json({ accountName });
  } catch (error) {
    const message =
      error instanceof MonnifyError ? error.message : "Could not verify that account";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
