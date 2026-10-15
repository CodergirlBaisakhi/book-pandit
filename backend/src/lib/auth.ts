import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { NextRequest } from "next/server";
import { prisma } from "./prisma";

const SECRET = process.env.JWT_SECRET || "book-pandit-dev-secret";

export type AuthToken = {
  sub: string;
  role: string;
  email: string;
};

export function signToken(user: { id: string; role: string; email: string }) {
  return jwt.sign(
    { sub: user.id, role: user.role, email: user.email },
    SECRET,
    { expiresIn: "7d" },
  );
}

export function verifyPassword(password: string, passwordHash: string) {
  return bcrypt.compare(password, passwordHash);
}

export function hashPassword(password: string) {
  return bcrypt.hash(password, 10);
}

export async function getUser(request: NextRequest) {
  const header = request.headers.get("authorization") || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  if (!token) return null;

  try {
    const payload = jwt.verify(token, SECRET) as AuthToken;
    return prisma.user.findUnique({
      where: { id: payload.sub },
      include: {
        panditProfile: {
          include: { pujas: { select: { pujaId: true } } },
        },
      },
    });
  } catch {
    return null;
  }
}

export function publicUser(user: {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  panditProfile: {
    id: string;
    qualification: string;
    experienceYears: number;
    languages: string;
    bio: string;
    city: string;
    rating: number;
    reviewCount: number;
    pujas: { pujaId: string }[];
  } | null;
}) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    role: user.role,
    panditProfile: user.panditProfile
      ? {
          id: user.panditProfile.id,
          qualification: user.panditProfile.qualification,
          experienceYears: user.panditProfile.experienceYears,
          languages: user.panditProfile.languages,
          bio: user.panditProfile.bio,
          city: user.panditProfile.city,
          rating: user.panditProfile.rating,
          reviewCount: user.panditProfile.reviewCount,
          pujaIds: user.panditProfile.pujas.map((link) => link.pujaId),
        }
      : null,
  };
}
