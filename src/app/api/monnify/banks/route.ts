import { NextResponse } from "next/server";

import { getBanks, MonnifyError } from "@/lib/monnify";

export async function GET() {
  try {
    const banks = await getBanks();
    return NextResponse.json({ banks });
  } catch (error) {
    console.error("Failed to fetch banks:", error);
    const message = error instanceof MonnifyError ? error.message : "Failed to fetch banks. Please try again.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
