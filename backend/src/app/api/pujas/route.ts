import { json } from "@/lib/http";
import { prisma } from "@/lib/prisma";

const CATEGORY_ORDER = [
  "Daily worship",
  "Deity-specific puja",
  "Weekly puja and vrata",
  "Festival puja",
  "Family occasion puja",
  "Special-purpose rituals",
];

export async function GET() {
  const pujas = await prisma.puja.findMany({
    include: { ingredients: { orderBy: { sortOrder: "asc" } } },
  });

  pujas.sort((a, b) => {
    const category =
      CATEGORY_ORDER.indexOf(a.category) - CATEGORY_ORDER.indexOf(b.category);
    if (category !== 0) return category;
    return a.name.localeCompare(b.name);
  });

  return json(pujas);
}
