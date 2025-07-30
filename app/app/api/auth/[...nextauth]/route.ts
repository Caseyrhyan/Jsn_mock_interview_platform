// app/api/sign-in/route.ts
import router from "next/router";
import { NextResponse } from "next/server";
import { toast } from "sonner";

export async function POST(req: Request) {
  const { email, password } = await req.json();
  // Validate user in DB
  return NextResponse.json({ success: true, token: "jwt-token" });
}
const onSubmit = async (values: any) => {
  const res = await fetch('/api/sign-in', {
    method: 'POST',
    body: JSON.stringify(values)
  });
  const data = await res.json();
  if (data.success) {
    toast.success("Signed in!");
    router.push('/');
  }
};
