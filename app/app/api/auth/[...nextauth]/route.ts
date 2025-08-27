import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { email, password } = await req.json();

  // Here you check against your DB, Firebase, or any auth provider
  if (email === "ngeforcasey@gmail.com" && password === "200600") {
    return NextResponse.json({ success: true, token: "jwt-token" });
  }

  return NextResponse.json(
    { success: false, error: "Invalid credentials" },
    { status: 401 }
  );
}
