import { NextRequest } from "next/server";
import { getUser, publicUser } from "@/lib/auth";
import { error, json, readJson } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { profileSchema } from "@/lib/validators";

export async function POST(request: NextRequest) {
  const user = await getUser(request);
  if (!user || user.role !== "PANDIT" || !user.panditProfile) {
    return error("Pandit sign-in required", 401);
  }

  const parsed = profileSchema.safeParse(await readJson(request));
  if (!parsed.success) {
    return error(parsed.error.issues[0]?.message ?? "Invalid input", 400);
  }

  const pujaIds = [...new Set(parsed.data.pujaIds)];
  if (pujaIds.length) {
    const count = await prisma.puja.count({ where: { id: { in: pujaIds } } });
    if (count !== pujaIds.length) {
      return error("Choose pujas from the list", 400);
    }
  }

  await prisma.$transaction([
    prisma.panditProfile.update({
      where: { id: user.panditProfile.id },
      data: {
        qualification: parsed.data.qualification,
        experienceYears: parsed.data.experienceYears,
        languages: parsed.data.languages,
        bio: parsed.data.bio?.trim() || "",
        city: parsed.data.city,
      },
    }),
    prisma.panditPuja.deleteMany({ where: { panditId: user.panditProfile.id } }),
    prisma.panditPuja.createMany({
      data: pujaIds.map((pujaId) => ({
        panditId: user.panditProfile!.id,
        pujaId,
      })),
    }),
  ]);

  const fresh = await prisma.user.findUniqueOrThrow({
    where: { id: user.id },
    include: {
      panditProfile: { include: { pujas: { select: { pujaId: true } } } },
    },
  });

  return json({ user: publicUser(fresh) });
}
