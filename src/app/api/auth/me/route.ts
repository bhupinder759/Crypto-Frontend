import { NextResponse } from "next/server";
import { getServerSession } from "@/lib/api/server-session";

export async function GET() {
  const session = await getServerSession();

  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json(session);
}
