import { NextResponse } from "next/server";

export function json(data: unknown, status = 200) {
  return NextResponse.json(data, { status });
}

export function error(message: string, status: number) {
  return json({ error: message }, status);
}

export async function readJson(request: Request) {
  try {
    return await request.json();
  } catch {
    return null;
  }
}
