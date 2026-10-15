import { NextRequest } from "next/server";
import { error, json } from "@/lib/http";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const puja = await prisma.puja.findUnique({
    where: { id },
    include: { ingredients: { orderBy: { sortOrder: "asc" } } },
  });
  if (!puja) return error("Puja not found", 404);
  return json(puja);
}
