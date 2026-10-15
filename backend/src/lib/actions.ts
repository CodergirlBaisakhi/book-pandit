import { NextRequest } from "next/server";
import { getUser } from "@/lib/auth";
import { assertNoOverlap, bookingInclude, serializeBooking } from "@/lib/booking";
import { error, json, readJson } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { reviewSchema } from "@/lib/validators";

type Action = "accept" | "decline" | "cancel" | "complete" | "review" | "mark-paid";

async function loadBooking(id: string) {
  return prisma.booking.findUnique({ where: { id }, include: bookingInclude });
}

export async function runAction(request: NextRequest, id: string, action: Action) {
  const user = await getUser(request);
  if (!user) return error("Sign in required", 401);

  const booking = await loadBooking(id);
  if (!booking) return error("Booking not found", 404);

  const isFamily = user.role === "FAMILY" && booking.familyId === user.id;
  const isPandit =
    user.role === "PANDIT" &&
    user.panditProfile != null &&
    booking.panditId === user.panditProfile.id;

  try {
    if (action === "accept" || action === "decline" || action === "complete") {
      if (!isPandit) return error("Only the assigned pandit can do this", 403);
    }

    if (action === "accept") {
      if (booking.status !== "PENDING") {
        return error("Only a pending request can be accepted", 400);
      }
      const updated = await prisma.$transaction(async (tx) => {
        await assertNoOverlap(
          tx,
          booking.panditId,
          booking.date,
          booking.startTime,
          booking.hours,
          booking.id,
        );
        return tx.booking.update({
          where: { id: booking.id },
          data: { status: "ACCEPTED" },
          include: bookingInclude,
        });
      });
      return json(serializeBooking(updated));
    }

    if (action === "decline") {
      if (booking.status !== "PENDING") {
        return error("Only a pending request can be declined", 400);
      }
      const updated = await prisma.booking.update({
        where: { id: booking.id },
        data: { status: "DECLINED" },
        include: bookingInclude,
      });
      return json(serializeBooking(updated));
    }

    if (action === "complete") {
      if (booking.status !== "ACCEPTED") {
        return error("Accept the visit before marking it complete", 400);
      }
      const updated = await prisma.booking.update({
        where: { id: booking.id },
        data: { status: "COMPLETED" },
        include: bookingInclude,
      });
      return json(serializeBooking(updated));
    }

    if (action === "cancel") {
      const familyCan = isFamily && (booking.status === "PENDING" || booking.status === "ACCEPTED");
      const panditCan = isPandit && booking.status === "ACCEPTED";
      if (!familyCan && !panditCan) {
        return error("This visit can no longer be cancelled", 400);
      }
      const updated = await prisma.booking.update({
        where: { id: booking.id },
        data: { status: "CANCELLED" },
        include: bookingInclude,
      });
      return json(serializeBooking(updated));
    }

    if (action === "mark-paid") {
      if (!isFamily) return error("Only the family can mark payment", 403);
      if (booking.status !== "ACCEPTED" && booking.status !== "COMPLETED") {
        return error("Payment can be marked after the pandit accepts", 400);
      }
      const updated = await prisma.booking.update({
        where: { id: booking.id },
        data: { paid: true },
        include: bookingInclude,
      });
      return json(serializeBooking(updated));
    }

    if (!isFamily) return error("Only the family can leave a rating", 403);
    if (booking.status !== "COMPLETED") {
      return error("Rate the pandit after the visit is complete", 400);
    }
    if (booking.review) return error("This visit is already rated", 400);

    const parsed = reviewSchema.safeParse(await readJson(request));
    if (!parsed.success) {
      return error(parsed.error.issues[0]?.message ?? "Invalid input", 400);
    }

    await prisma.review.create({
      data: {
        bookingId: booking.id,
        familyId: user.id,
        panditId: booking.panditId,
        rating: parsed.data.rating,
        comment: parsed.data.comment ?? "",
      },
    });

    const reviews = await prisma.review.findMany({ where: { panditId: booking.panditId } });
    const average = reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length;
    await prisma.panditProfile.update({
      where: { id: booking.panditId },
      data: {
        rating: Math.round(average * 10) / 10,
        reviewCount: reviews.length,
      },
    });

    const updated = await loadBooking(booking.id);
    return json(serializeBooking(updated!));
  } catch (caught) {
    if (caught instanceof Error && caught.message === "OVERLAP") {
      return error("You already have an accepted visit at that time", 409);
    }
    throw caught;
  }
}
