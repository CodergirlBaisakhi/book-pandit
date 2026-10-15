import { NextRequest } from "next/server";
import { runAction } from "@/lib/actions";

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  return runAction(request, id, "complete");
}
