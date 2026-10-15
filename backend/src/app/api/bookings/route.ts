import { NextRequest } from "next/server";
import { getUser } from "@/lib/auth";
import { bookingInclude, serializeBooking } from "@/lib/booking";
import { error, json, readJson } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { quote } from "@/lib/pricing";
import { todayISO } from "@/lib/time";
import { bookingSchema, isHalfHour } from "@/lib/validators";

export async function GET(request: NextRequest) {
  const user = await getUser(request);
  if (!user) return error("Sign in required", 401);

  const isPandit = user.role === "PANDIT" && user.panditProfile;
  const bookings = await prisma.booking.findMany({
    where: isPandit ? { panditId: user.panditProfile!.id } : { familyId: user.id },
    include: bookingInclude,
    orderBy: isPandit
      ? [{ date: "asc" }, { startTime: "asc" }]
      : [{ createdAt: "desc" }],
  });

  return json(bookings.map(serializeBooking));
}

export async function POST(request: NextRequest) {
  const user = await getUser(request);
  if (!user || user.role !== "FAMILY") {
    return error("Family sign-in required", 401);
  }

  const parsed = bookingSchema.safeParse(await readJson(request));
  if (!parsed.success) {
    return error(parsed.error.issues[0]?.message ?? "Invalid input", 400);
  }

  const input = parsed.data;
  if (!isHalfHour(input.hours)) {
    return error("Choose hours in half-hour steps", 400);
  }
  if (input.date < todayISO()) {
    return error("Choose today or a future date", 400);
  }

  const puja = await prisma.puja.findUnique({ where: { id: input.pujaId } });
  if (!puja) return error("Puja not found", 404);

  const pandit = await prisma.panditProfile.findUnique({
    where: { id: input.panditId },
    include: { pujas: { where: { pujaId: puja.id } } },
  });
  if (!pandit || pandit.pujas.length === 0) {
    return error("This pandit does not perform that puja", 400);
  }

  const price = quote(puja, input.hours);
  const booking = await prisma.booking.create({
    data: {
      familyId: user.id,
      panditId: pandit.id,
      pujaId: puja.id,
      date: input.date,
      startTime: input.startTime,
      hours: input.hours,
      address: input.address,
      notes: input.notes ?? "",
      basePrice: price.basePrice,
      extraHours: price.extraHours,
      extraHourRate: price.extraHourRate,
      amountDue: price.amountDue,
      status: "PENDING",
    },
    include: bookingInclude,
  });

  return json(serializeBooking(booking), 201);
}
