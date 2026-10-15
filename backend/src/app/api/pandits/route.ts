import { NextRequest } from "next/server";
import { json } from "@/lib/http";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const pujaId = searchParams.get("pujaId") || undefined;
  const qualification = (searchParams.get("qualification") || "").trim().toLowerCase();
  const minRatingRaw = searchParams.get("minRating");
  const minRating = minRatingRaw ? Number(minRatingRaw) : 0;

  const pandits = await prisma.panditProfile.findMany({
    where: {
      ...(pujaId ? { pujas: { some: { pujaId } } } : {}),
      ...(minRating > 0 ? { rating: { gte: minRating } } : {}),
    },
    include: {
      user: { select: { name: true } },
      pujas: { select: { pujaId: true } },
    },
    orderBy: { rating: "desc" },
  });

  const filtered = pandits.filter((pandit) =>
    qualification
      ? pandit.qualification.toLowerCase().includes(qualification)
      : true,
  );

  return json(
    filtered.map((pandit) => ({
      id: pandit.id,
      name: pandit.user.name,
      qualification: pandit.qualification,
      experienceYears: pandit.experienceYears,
      languages: pandit.languages,
      bio: pandit.bio,
      city: pandit.city,
      rating: pandit.rating,
      reviewCount: pandit.reviewCount,
      pujaIds: pandit.pujas.map((link) => link.pujaId),
    })),
  );
}
