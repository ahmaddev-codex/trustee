import { NextResponse } from "next/server";

import { getBanks } from "@/lib/monnify";

export async function GET() {
  const banks = await getBanks();
  return NextResponse.json({ banks });
}
