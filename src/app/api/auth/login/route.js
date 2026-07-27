
import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    {
      error: true,
      message: { global: ["Password login is disabled. Use Google login."] },
    },
    { status: 410 },
  );
}
