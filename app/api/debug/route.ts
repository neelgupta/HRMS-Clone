import { NextResponse } from "next/server";
import { getDebugData } from "@/lib/server/debug";

export async function GET() {
  try {
    const data = await getDebugData();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
