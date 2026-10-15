import { NextRequest } from "next/server";
import { hashPassword, publicUser, signToken } from "@/lib/auth";
import { error, json, readJson } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { registerSchema } from "@/lib/validators";
import { z } from "zod";

export async function POST(request: NextRequest) {
  const parsed = registerSchema.safeParse(await readJson(request));
  if (!parsed.success) {
    return error(parsed.error.issues[0]?.message ?? "Invalid input", 400);
  }

  const input = parsed.data;
  if (input.role === "PANDIT") {
    const profile = z
      .object({
        qualification: z.string().trim().min(2, "Enter your qualification"),
        experienceYears: z.number().int().min(0),
        languages: z.string().trim().min(2, "Enter the languages you perform in"),
        city: z.string().trim().min(2, "Enter your city"),
      })
      .safeParse(input);
    if (!profile.success) {
      return error(profile.error.issues[0]?.message ?? "Invalid input", 400);
    }
  }

  const email = input.email.toLowerCase();
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return error("An account with this email already exists", 409);
  }

  const pujaIds = [...new Set(input.pujaIds ?? [])];
  if (pujaIds.length) {
    const count = await prisma.puja.count({ where: { id: { in: pujaIds } } });
    if (count !== pujaIds.length) {
      return error("Choose pujas from the list", 400);
    }
  }

  const user = await prisma.user.create({
    data: {
      name: input.name,
      email,
      phone: input.phone,
      role: input.role,
      passwordHash: await hashPassword(input.password),
      panditProfile:
        input.role === "PANDIT"
          ? {
              create: {
                qualification: input.qualification!.trim(),
                experienceYears: input.experienceYears!,
                languages: input.languages!.trim(),
                bio: input.bio?.trim() || "",
                city: input.city!.trim(),
                pujas: { create: pujaIds.map((pujaId) => ({ pujaId })) },
              },
            }
          : undefined,
    },
    include: {
      panditProfile: { include: { pujas: { select: { pujaId: true } } } },
    },
  });

  return json({ token: signToken(user), user: publicUser(user) }, 201);
}
