import { NextRequest, NextResponse } from "next/server";
import { searchStocks } from "@/lib/mock-market";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q") ?? "";

  const results = searchStocks(query).slice(0, 20);
  return NextResponse.json({ results });
}
