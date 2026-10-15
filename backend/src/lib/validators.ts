import { z } from "zod";

export const registerSchema = z.object({
  name: z.string().trim().min(2, "Enter your name").max(80),
  email: z.string().trim().email("Enter a valid email"),
  password: z.string().min(6, "Use at least 6 characters").max(80),
  phone: z.string().trim().min(8, "Enter a phone number").max(20),
  role: z.enum(["FAMILY", "PANDIT"]),
  qualification: z.string().trim().max(120).optional(),
  experienceYears: z.number().int().min(0).max(70).optional(),
  languages: z.string().trim().max(120).optional(),
  bio: z.string().trim().max(500).optional(),
  city: z.string().trim().max(80).optional(),
  pujaIds: z.array(z.string()).optional(),
});

export const loginSchema = z.object({
  email: z.string().trim().email("Enter a valid email"),
  password: z.string().min(1, "Enter your password"),
});

export const bookingSchema = z.object({
  pujaId: z.string().min(1),
  panditId: z.string().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Choose a date"),
  startTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Choose a start time"),
  hours: z.number().min(0.5, "Book at least half an hour").max(12, "Book at most 12 hours"),
  address: z.string().trim().min(8, "Enter the full address").max(240),
  notes: z.string().trim().max(500).optional(),
});

export const profileSchema = z.object({
  qualification: z.string().trim().min(2, "Enter your qualification").max(120),
  experienceYears: z.number().int().min(0).max(70),
  languages: z.string().trim().min(2, "Enter the languages you perform in").max(120),
  bio: z.string().trim().max(500).optional(),
  city: z.string().trim().min(2, "Enter your city").max(80),
  pujaIds: z.array(z.string()),
});

export const reviewSchema = z.object({
  rating: z.number().int().min(1).max(5),
  comment: z.string().trim().max(400).optional(),
});

export function isHalfHour(hours: number) {
  return Math.abs(hours * 2 - Math.round(hours * 2)) < 0.001;
}
