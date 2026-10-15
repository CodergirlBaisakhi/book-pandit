import { Prisma } from "@prisma/client";
import { endTime, rangesOverlap } from "./time";

export const bookingInclude = {
  puja: {
    include: {
      ingredients: { orderBy: { sortOrder: "asc" as const } },
    },
  },
  pandit: {
    include: {
      user: { select: { id: true, name: true, phone: true } },
    },
  },
  family: { select: { id: true, name: true, phone: true } },
  review: true,
} satisfies Prisma.BookingInclude;

export type BookingWithRelations = Prisma.BookingGetPayload<{
  include: typeof bookingInclude;
}>;

export function serializeBooking(booking: BookingWithRelations) {
  return {
    id: booking.id,
    date: booking.date,
    startTime: booking.startTime,
    endTime: endTime(booking.startTime, booking.hours),
    hours: booking.hours,
    address: booking.address,
    notes: booking.notes,
    basePrice: booking.basePrice,
    extraHours: booking.extraHours,
    extraHourRate: booking.extraHourRate,
    amountDue: booking.amountDue,
    status: booking.status,
    paid: booking.paid,
    createdAt: booking.createdAt,
    puja: booking.puja,
    pandit: {
      id: booking.pandit.id,
      name: booking.pandit.user.name,
      phone: booking.pandit.user.phone,
      qualification: booking.pandit.qualification,
      rating: booking.pandit.rating,
      city: booking.pandit.city,
      languages: booking.pandit.languages,
      experienceYears: booking.pandit.experienceYears,
    },
    family: booking.family,
    review: booking.review
      ? {
          id: booking.review.id,
          rating: booking.review.rating,
          comment: booking.review.comment,
        }
      : null,
  };
}

export async function assertNoOverlap(
  tx: Prisma.TransactionClient,
  panditId: string,
  date: string,
  startTime: string,
  hours: number,
  ignoreBookingId?: string,
) {
  const accepted = await tx.booking.findMany({
    where: {
      panditId,
      date,
      status: "ACCEPTED",
      ...(ignoreBookingId ? { id: { not: ignoreBookingId } } : {}),
    },
  });

  const clash = accepted.find((booking) =>
    rangesOverlap(startTime, hours, booking.startTime, booking.hours),
  );

  if (clash) {
    throw new Error("OVERLAP");
  }
}
