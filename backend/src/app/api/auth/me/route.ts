import { NextRequest } from "next/server";
import { getUser, publicUser } from "@/lib/auth";
import { error, json } from "@/lib/http";

export async function GET(request: NextRequest) {
  const user = await getUser(request);
  if (!user) return error("Sign in required", 401);
  return json({ user: publicUser(user) });
}
