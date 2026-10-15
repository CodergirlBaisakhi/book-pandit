import { NextRequest } from "next/server";
import { publicUser, signToken, verifyPassword } from "@/lib/auth";
import { error, json, readJson } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { loginSchema } from "@/lib/validators";

export async function POST(request: NextRequest) {
  const body = await readJson(request);
  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    return error(parsed.error.issues[0]?.message ?? "Invalid input", 400);
  }

  const email = parsed.data.email.toLowerCase();
  const user = await prisma.user.findUnique({
    where: { email },
    include: {
      panditProfile: { include: { pujas: { select: { pujaId: true } } } },
    },
  });

  if (!user || !(await verifyPassword(parsed.data.password, user.passwordHash))) {
    return error("Email or password is incorrect", 401);
  }

  return json({ token: signToken(user), user: publicUser(user) });
}
