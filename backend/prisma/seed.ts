import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";
import { catalog } from "./catalog";
import { quote } from "../src/lib/pricing";

const prisma = new PrismaClient();

const password = "password123";

const panditSeeds = [
  {
    email: "raghunath@bookpandit.local",
    name: "Raghunath Mishra",
    phone: "9876543210",
    qualification: "Shastri, Vedapathi",
    experienceYears: 18,
    languages: "Sanskrit, Odia, Hindi",
    bio: "Performs Griha Pravesh, Satyanarayan, and Jagannath puja for families in Bhubaneswar.",
    city: "Bhubaneswar",
    ratings: [5, 5, 5, 4, 5],
    slugs: [
      "diya-and-aarti",
      "family-deity-puja",
      "jagannath-puja",
      "shiva-puja",
      "vishnu-puja",
      "durga-puja",
      "lakshmi-puja",
      "ganesha-puja",
      "satyanarayan-puja",
      "griha-pravesh",
    ],
  },
  {
    email: "suresh@bookpandit.local",
    name: "Suresh Panda",
    phone: "9876543211",
    qualification: "Acharya",
    experienceYears: 12,
    languages: "Odia, Hindi",
    bio: "Leads weekly vratas and deity pujas, including Satyanarayan katha.",
    city: "Cuttack",
    ratings: [5, 4, 5, 4],
    slugs: [
      "shiva-puja",
      "vishnu-puja",
      "lakshmi-puja",
      "ganesha-puja",
      "durga-puja",
      "monday-shiva-puja",
      "tuesday-hanuman-puja",
      "thursday-lakshmi-vrata",
      "satyanarayan-puja",
    ],
  },
  {
    email: "debendra@bookpandit.local",
    name: "Debendra Sharma",
    phone: "9876543212",
    qualification: "Purohit",
    experienceYears: 8,
    languages: "Hindi, Sanskrit",
    bio: "Available for daily worship, vehicle puja, and Ayudha Puja.",
    city: "Puri",
    ratings: [4, 3, 4, 3],
    slugs: [
      "diya-and-aarti",
      "family-deity-puja",
      "vehicle-puja",
      "ayudha-puja",
      "satyanarayan-puja",
      "tuesday-hanuman-puja",
    ],
  },
  {
    email: "laxmidhar@bookpandit.local",
    name: "Laxmidhar Das",
    phone: "9876543213",
    qualification: "Shastri",
    experienceYears: 22,
    languages: "Sanskrit, Odia",
    bio: "Takes festival pujas, weddings, Navagraha shanti, and Griha Pravesh.",
    city: "Bhubaneswar",
    ratings: [5, 5, 5, 5, 5],
    slugs: [
      "sharadiya-durga-puja",
      "diwali-puja",
      "saraswati-puja",
      "kumar-purnima",
      "wedding-rituals",
      "navagraha-puja",
      "griha-pravesh",
      "satyanarayan-puja",
      "jagannath-puja",
    ],
  },
];

function dateOffset(start: string, offset: number) {
  const [year, month, day] = start.split("-").map(Number);
  const date = new Date(year, month - 1, day + offset);
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${mm}-${dd}`;
}

async function main() {
  await prisma.review.deleteMany();
  await prisma.booking.deleteMany();
  await prisma.panditPuja.deleteMany();
  await prisma.pujaIngredient.deleteMany();
  await prisma.puja.deleteMany();
  await prisma.panditProfile.deleteMany();
  await prisma.user.deleteMany();

  const passwordHash = await bcrypt.hash(password, 10);

  await prisma.user.create({
    data: {
      name: "Anita Das",
      email: "family@bookpandit.local",
      phone: "9000000001",
      role: "FAMILY",
      passwordHash,
    },
  });

  const reviewer = await prisma.user.create({
    data: {
      name: "Reviewer Family",
      email: "reviews@bookpandit.local",
      phone: "9000000002",
      role: "FAMILY",
      passwordHash,
    },
  });

  for (const item of catalog) {
    await prisma.puja.create({
      data: {
        slug: item.slug,
        name: item.name,
        category: item.category,
        description: item.description,
        basePrice: item.basePrice,
        includedHours: item.includedHours,
        extraHourRate: item.extraHourRate,
        ingredients: {
          create: item.ingredients.map((name, sortOrder) => ({ name, sortOrder })),
        },
      },
    });
  }

  const pujas = await prisma.puja.findMany();
  const bySlug = new Map(pujas.map((puja) => [puja.slug, puja]));
  const satyanarayan = bySlug.get("satyanarayan-puja");
  if (!satyanarayan) throw new Error("Missing Satyanarayan puja");

  let day = 0;
  for (const seed of panditSeeds) {
    const profile = await prisma.panditProfile.create({
      data: {
        qualification: seed.qualification,
        experienceYears: seed.experienceYears,
        languages: seed.languages,
        bio: seed.bio,
        city: seed.city,
        user: {
          create: {
            name: seed.name,
            email: seed.email,
            phone: seed.phone,
            role: "PANDIT",
            passwordHash,
          },
        },
        pujas: {
          create: seed.slugs.map((slug) => {
            const puja = bySlug.get(slug);
            if (!puja) throw new Error(`Missing puja ${slug}`);
            return { pujaId: puja.id };
          }),
        },
      },
    });

    for (const rating of seed.ratings) {
      const price = quote(satyanarayan, satyanarayan.includedHours);
      const booking = await prisma.booking.create({
        data: {
          familyId: reviewer.id,
          panditId: profile.id,
          pujaId: satyanarayan.id,
          date: dateOffset("2026-08-01", day),
          startTime: "09:00",
          hours: satyanarayan.includedHours,
          address: "Seed review visit, Bhubaneswar",
          notes: "",
          basePrice: price.basePrice,
          extraHours: price.extraHours,
          extraHourRate: price.extraHourRate,
          amountDue: price.amountDue,
          status: "COMPLETED",
          paid: true,
        },
      });
      await prisma.review.create({
        data: {
          bookingId: booking.id,
          familyId: reviewer.id,
          panditId: profile.id,
          rating,
          comment: "Completed visit.",
        },
      });
      day += 1;
    }

    const average = seed.ratings.reduce((sum, rating) => sum + rating, 0) / seed.ratings.length;
    await prisma.panditProfile.update({
      where: { id: profile.id },
      data: {
        rating: Math.round(average * 10) / 10,
        reviewCount: seed.ratings.length,
      },
    });
  }

  console.log("Seeded pujas, pandits, and demo logins.");
  console.log("Family: family@bookpandit.local / password123");
  console.log("Pandit: raghunath@bookpandit.local / password123");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
