import { HttpErrorResponse } from "@angular/common/http";
import { Injectable } from "@angular/core";
import catalogJson from "./catalog.json";
import { AppUser, AuthResponse, Booking, Pandit, Puja } from "../core/models";

type CatalogItem = {
  slug: string;
  name: string;
  category: string;
  description: string;
  basePrice: number;
  includedHours: number;
  extraHourRate: number;
  ingredients: string[];
};

type StoredUser = {
  id: string;
  email: string;
  password: string;
  name: string;
  phone: string;
  role: "FAMILY" | "PANDIT";
  profile: {
    id: string;
    qualification: string;
    experienceYears: number;
    languages: string;
    bio: string;
    city: string;
    rating: number;
    reviewCount: number;
    seedRating: number;
    seedReviewCount: number;
    pujaIds: string[];
  } | null;
};

type StoredBooking = {
  id: string;
  familyId: string;
  panditId: string;
  pujaId: string;
  date: string;
  startTime: string;
  hours: number;
  address: string;
  notes: string;
  basePrice: number;
  extraHours: number;
  extraHourRate: number;
  amountDue: number;
  status: string;
  paid: boolean;
  createdAt: string;
  review: { id: string; rating: number; comment: string } | null;
};

type Database = {
  users: StoredUser[];
  bookings: StoredBooking[];
};

const STORAGE_KEY = "bp_demo_db_v1";
const catalog = catalogJson as CatalogItem[];

const CATEGORY_ORDER = [
  "Daily worship",
  "Deity-specific puja",
  "Weekly puja and vrata",
  "Festival puja",
  "Family occasion puja",
  "Special-purpose rituals",
];

@Injectable({ providedIn: "root" })
export class DemoStore {
  private pujasCache = this.buildPujas();

  login(email: string, password: string): AuthResponse {
    const user = this.db().users.find((item) => item.email === email.trim().toLowerCase());
    if (!user || user.password !== password) this.fail("Email or password is incorrect", 401);
    return { token: user.id, user: this.publicUser(user) };
  }

  register(body: Record<string, unknown>): AuthResponse {
    const db = this.db();
    const email = String(body["email"] ?? "").trim().toLowerCase();
    const role = body["role"] === "PANDIT" ? "PANDIT" : "FAMILY";
    if (!String(body["name"] ?? "").trim()) this.fail("Enter your name", 400);
    if (!email.includes("@")) this.fail("Enter a valid email", 400);
    if (String(body["password"] ?? "").length < 6) this.fail("Use at least 6 characters", 400);
    if (String(body["phone"] ?? "").trim().length < 8) this.fail("Enter a phone number", 400);
    if (db.users.some((item) => item.email === email)) {
      this.fail("An account with this email already exists", 409);
    }

    const pujaIds = Array.isArray(body["pujaIds"]) ? (body["pujaIds"] as string[]) : [];
    if (role === "PANDIT") {
      if (String(body["qualification"] ?? "").trim().length < 2) this.fail("Enter your qualification", 400);
      if (String(body["languages"] ?? "").trim().length < 2) this.fail("Enter the languages you perform in", 400);
      if (String(body["city"] ?? "").trim().length < 2) this.fail("Enter your city", 400);
      if (!pujaIds.length) this.fail("Choose at least one puja you can perform.", 400);
    }

    const id = this.nextId("user");
    const user: StoredUser = {
      id,
      email,
      password: String(body["password"]),
      name: String(body["name"]).trim(),
      phone: String(body["phone"]).trim(),
      role,
      profile:
        role === "PANDIT"
          ? {
              id: this.nextId("pandit"),
              qualification: String(body["qualification"]).trim(),
              experienceYears: Number(body["experienceYears"] ?? 0),
              languages: String(body["languages"]).trim(),
              bio: String(body["bio"] ?? "").trim(),
              city: String(body["city"]).trim(),
              rating: 0,
              reviewCount: 0,
              seedRating: 0,
              seedReviewCount: 0,
              pujaIds,
            }
          : null,
    };
    db.users.push(user);
    this.save(db);
    return { token: user.id, user: this.publicUser(user) };
  }

  me(token: string | null): AppUser | null {
    if (!token) return null;
    const user = this.db().users.find((item) => item.id === token);
    return user ? this.publicUser(user) : null;
  }

  pujas() {
    return this.sortedPujas();
  }

  puja(id: string) {
    const puja = this.pujasCache.find((item) => item.id === id);
    if (!puja) this.fail("Puja not found", 404);
    return puja;
  }

  pandits(filters: { pujaId?: string; minRating?: string; qualification?: string }): Pandit[] {
    const minRating = filters.minRating ? Number(filters.minRating) : 0;
    const qualification = (filters.qualification ?? "").trim().toLowerCase();
    return this.db()
      .users.filter((user) => user.role === "PANDIT" && user.profile)
      .map((user) => this.publicPandit(user))
      .filter((pandit) => (filters.pujaId ? pandit.pujaIds.includes(filters.pujaId) : true))
      .filter((pandit) => (minRating > 0 ? pandit.rating >= minRating : true))
      .filter((pandit) => (qualification ? pandit.qualification.toLowerCase().includes(qualification) : true))
      .sort((a, b) => b.rating - a.rating);
  }

  bookings(token: string | null): Booking[] {
    const user = this.requireUser(token);
    const db = this.db();
    const rows = db.bookings.filter((booking) =>
      user.role === "PANDIT" ? booking.panditId === user.profile?.id : booking.familyId === user.id,
    );
    if (user.role === "PANDIT") {
      const rank: Record<string, number> = { PENDING: 0, ACCEPTED: 1, COMPLETED: 2, DECLINED: 3, CANCELLED: 4 };
      rows.sort(
        (a, b) =>
          (rank[a.status] ?? 9) - (rank[b.status] ?? 9) ||
          a.date.localeCompare(b.date) ||
          a.startTime.localeCompare(b.startTime),
      );
    } else {
      rows.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    }
    return rows.map((booking) => this.publicBooking(db, booking));
  }

  createBooking(
    token: string | null,
    body: {
      pujaId: string;
      panditId: string;
      date: string;
      startTime: string;
      hours: number;
      address: string;
      notes: string;
    },
  ): Booking {
    const user = this.requireUser(token);
    if (user.role !== "FAMILY") this.fail("Family sign-in required", 401);
    const hours = Number(body.hours);
    if (!(hours >= 0.5 && hours <= 12) || Math.abs(hours * 2 - Math.round(hours * 2)) > 0.001) {
      this.fail("Choose hours in half-hour steps", 400);
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(body.date) || body.date < this.today()) {
      this.fail("Choose today or a future date", 400);
    }
    if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(body.startTime)) this.fail("Choose a start time", 400);
    if (body.address.trim().length < 8) this.fail("Enter the full address", 400);

    const puja = this.puja(body.pujaId);
    const db = this.db();
    const pandit = db.users.find((item) => item.profile?.id === body.panditId);
    if (!pandit?.profile?.pujaIds.includes(puja.id)) this.fail("This pandit does not perform that puja", 400);

    const extraHours = Math.round(Math.max(0, hours - puja.includedHours) * 2) / 2;
    const booking: StoredBooking = {
      id: this.nextId("booking"),
      familyId: user.id,
      panditId: pandit.profile.id,
      pujaId: puja.id,
      date: body.date,
      startTime: body.startTime,
      hours,
      address: body.address.trim(),
      notes: body.notes.trim(),
      basePrice: puja.basePrice,
      extraHours,
      extraHourRate: puja.extraHourRate,
      amountDue: puja.basePrice + Math.round(extraHours * puja.extraHourRate),
      status: "PENDING",
      paid: false,
      createdAt: new Date().toISOString(),
      review: null,
    };
    db.bookings.push(booking);
    this.save(db);
    return this.publicBooking(db, booking);
  }

  bookingAction(token: string | null, id: string, action: string, body?: unknown): Booking {
    const user = this.requireUser(token);
    const db = this.db();
    const booking = db.bookings.find((item) => item.id === id);
    if (!booking) this.fail("Booking not found", 404);
    const isFamily = user.role === "FAMILY" && booking.familyId === user.id;
    const isPandit = user.role === "PANDIT" && booking.panditId === user.profile?.id;

    if (action === "accept" || action === "decline" || action === "complete") {
      if (!isPandit) this.fail("Only the assigned pandit can do this", 403);
    }
    if (action === "accept") {
      if (booking.status !== "PENDING") this.fail("Only a pending request can be accepted", 400);
      const clash = db.bookings.some(
        (other) =>
          other.id !== booking.id &&
          other.panditId === booking.panditId &&
          other.date === booking.date &&
          other.status === "ACCEPTED" &&
          this.overlaps(booking.startTime, booking.hours, other.startTime, other.hours),
      );
      if (clash) this.fail("You already have an accepted visit at that time", 409);
      booking.status = "ACCEPTED";
    } else if (action === "decline") {
      if (booking.status !== "PENDING") this.fail("Only a pending request can be declined", 400);
      booking.status = "DECLINED";
    } else if (action === "complete") {
      if (booking.status !== "ACCEPTED") this.fail("Accept the visit before marking it complete", 400);
      booking.status = "COMPLETED";
    } else if (action === "cancel") {
      const familyCan = isFamily && (booking.status === "PENDING" || booking.status === "ACCEPTED");
      const panditCan = isPandit && booking.status === "ACCEPTED";
      if (!familyCan && !panditCan) this.fail("This visit can no longer be cancelled", 400);
      booking.status = "CANCELLED";
    } else if (action === "mark-paid") {
      if (!isFamily) this.fail("Only the family can mark payment", 403);
      if (booking.status !== "ACCEPTED" && booking.status !== "COMPLETED") {
        this.fail("Payment can be marked after the pandit accepts", 400);
      }
      booking.paid = true;
    } else if (action === "review") {
      if (!isFamily) this.fail("Only the family can leave a rating", 403);
      if (booking.status !== "COMPLETED") this.fail("Rate the pandit after the visit is complete", 400);
      if (booking.review) this.fail("This visit is already rated", 400);
      const rating = Number((body as { rating?: number } | undefined)?.rating);
      const comment = String((body as { comment?: string } | undefined)?.comment ?? "").trim();
      if (!Number.isInteger(rating) || rating < 1 || rating > 5) this.fail("Choose a rating from 1 to 5", 400);
      booking.review = { id: this.nextId("review"), rating, comment };
      const pandit = db.users.find((item) => item.profile?.id === booking.panditId);
      if (pandit?.profile) {
        const reviews = db.bookings
          .filter((item) => item.panditId === pandit.profile!.id && item.review)
          .map((item) => item.review!.rating);
        const totalCount = pandit.profile.seedReviewCount + reviews.length;
        const total =
          pandit.profile.seedRating * pandit.profile.seedReviewCount +
          reviews.reduce((sum, value) => sum + value, 0);
        pandit.profile.reviewCount = totalCount;
        pandit.profile.rating = Math.round((total / totalCount) * 10) / 10;
      }
    } else {
      this.fail("Unknown action", 400);
    }

    this.save(db);
    return this.publicBooking(db, booking);
  }

  saveProfile(
    token: string | null,
    body: {
      qualification: string;
      experienceYears: number;
      languages: string;
      bio: string;
      city: string;
      pujaIds: string[];
    },
  ): { user: AppUser } {
    const user = this.requireUser(token);
    if (user.role !== "PANDIT" || !user.profile) this.fail("Pandit sign-in required", 401);
    if (body.qualification.trim().length < 2) this.fail("Enter your qualification", 400);
    if (body.languages.trim().length < 2) this.fail("Enter the languages you perform in", 400);
    if (body.city.trim().length < 2) this.fail("Enter your city", 400);
    const db = this.db();
    const stored = db.users.find((item) => item.id === user.id);
    if (!stored?.profile) this.fail("Pandit sign-in required", 401);
    stored.profile.qualification = body.qualification.trim();
    stored.profile.experienceYears = Number(body.experienceYears);
    stored.profile.languages = body.languages.trim();
    stored.profile.bio = body.bio.trim();
    stored.profile.city = body.city.trim();
    stored.profile.pujaIds = [...new Set(body.pujaIds)];
    this.save(db);
    return { user: this.publicUser(stored) };
  }

  private requireUser(token: string | null) {
    const user = this.db().users.find((item) => item.id === token);
    if (!user) this.fail("Sign in required", 401);
    return user;
  }

  private publicUser(user: StoredUser): AppUser {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      panditProfile: user.profile ? { ...user.profile, pujaIds: [...user.profile.pujaIds] } : null,
    };
  }

  private publicPandit(user: StoredUser): Pandit {
    const profile = user.profile!;
    return {
      id: profile.id,
      name: user.name,
      qualification: profile.qualification,
      experienceYears: profile.experienceYears,
      languages: profile.languages,
      bio: profile.bio,
      city: profile.city,
      rating: profile.rating,
      reviewCount: profile.reviewCount,
      pujaIds: [...profile.pujaIds],
    };
  }

  private publicBooking(db: Database, booking: StoredBooking): Booking {
    const puja = this.puja(booking.pujaId);
    const pandit = db.users.find((item) => item.profile?.id === booking.panditId);
    const family = db.users.find((item) => item.id === booking.familyId);
    return {
      id: booking.id,
      date: booking.date,
      startTime: booking.startTime,
      endTime: this.endTime(booking.startTime, booking.hours),
      hours: booking.hours,
      address: booking.address,
      notes: booking.notes,
      basePrice: booking.basePrice,
      extraHours: booking.extraHours,
      extraHourRate: booking.extraHourRate,
      amountDue: booking.amountDue,
      status: booking.status,
      paid: booking.paid,
      puja,
      pandit: {
        id: pandit?.profile?.id ?? "",
        name: pandit?.name ?? "",
        phone: pandit?.phone ?? "",
        qualification: pandit?.profile?.qualification ?? "",
        rating: pandit?.profile?.rating ?? 0,
        city: pandit?.profile?.city ?? "",
        languages: pandit?.profile?.languages ?? "",
        experienceYears: pandit?.profile?.experienceYears ?? 0,
      },
      family: { id: family?.id ?? "", name: family?.name ?? "", phone: family?.phone ?? "" },
      review: booking.review,
    };
  }

  private buildPujas(): Puja[] {
    return catalog.map((item) => ({
      id: `puja-${item.slug}`,
      slug: item.slug,
      name: item.name,
      category: item.category,
      description: item.description,
      basePrice: item.basePrice,
      includedHours: item.includedHours,
      extraHourRate: item.extraHourRate,
      ingredients: item.ingredients.map((name, sortOrder) => ({
        id: `${item.slug}-${sortOrder}`,
        name,
        sortOrder,
      })),
    }));
  }

  private sortedPujas() {
    return [...this.pujasCache].sort((a, b) => {
      const category = CATEGORY_ORDER.indexOf(a.category) - CATEGORY_ORDER.indexOf(b.category);
      return category === 0 ? a.name.localeCompare(b.name) : category;
    });
  }

  private db(): Database {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as Database;
    const seeded = this.seed();
    this.save(seeded);
    return seeded;
  }

  private save(db: Database) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
  }

  private seed(): Database {
    const ids = (slugs: string[]) => slugs.map((slug) => `puja-${slug}`);
    const pandits: Array<Omit<StoredUser, "password" | "role"> & { password?: string }> = [
      {
        id: "user-raghunath",
        email: "raghunath@bookpandit.local",
        name: "Raghunath Mishra",
        phone: "9876543210",
        profile: {
          id: "pandit-raghunath",
          qualification: "Shastri, Vedapathi",
          experienceYears: 18,
          languages: "Sanskrit, Odia, Hindi",
          bio: "Performs Griha Pravesh, Satyanarayan, and Jagannath puja for families in Bhubaneswar.",
          city: "Bhubaneswar",
          rating: 4.8,
          reviewCount: 5,
          seedRating: 4.8,
          seedReviewCount: 5,
          pujaIds: ids([
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
          ]),
        },
      },
      {
        id: "user-suresh",
        email: "suresh@bookpandit.local",
        name: "Suresh Panda",
        phone: "9876543211",
        profile: {
          id: "pandit-suresh",
          qualification: "Acharya",
          experienceYears: 12,
          languages: "Odia, Hindi",
          bio: "Leads weekly vratas and deity pujas, including Satyanarayan katha.",
          city: "Cuttack",
          rating: 4.5,
          reviewCount: 4,
          seedRating: 4.5,
          seedReviewCount: 4,
          pujaIds: ids([
            "shiva-puja",
            "vishnu-puja",
            "lakshmi-puja",
            "ganesha-puja",
            "durga-puja",
            "monday-shiva-puja",
            "tuesday-hanuman-puja",
            "thursday-lakshmi-vrata",
            "satyanarayan-puja",
          ]),
        },
      },
      {
        id: "user-debendra",
        email: "debendra@bookpandit.local",
        name: "Debendra Sharma",
        phone: "9876543212",
        profile: {
          id: "pandit-debendra",
          qualification: "Purohit",
          experienceYears: 8,
          languages: "Hindi, Sanskrit",
          bio: "Available for daily worship, vehicle puja, and Ayudha Puja.",
          city: "Puri",
          rating: 3.5,
          reviewCount: 4,
          seedRating: 3.5,
          seedReviewCount: 4,
          pujaIds: ids([
            "diya-and-aarti",
            "family-deity-puja",
            "vehicle-puja",
            "ayudha-puja",
            "satyanarayan-puja",
            "tuesday-hanuman-puja",
          ]),
        },
      },
      {
        id: "user-laxmidhar",
        email: "laxmidhar@bookpandit.local",
        name: "Laxmidhar Das",
        phone: "9876543213",
        profile: {
          id: "pandit-laxmidhar",
          qualification: "Shastri",
          experienceYears: 22,
          languages: "Sanskrit, Odia",
          bio: "Takes festival pujas, weddings, Navagraha shanti, and Griha Pravesh.",
          city: "Bhubaneswar",
          rating: 5,
          reviewCount: 5,
          seedRating: 5,
          seedReviewCount: 5,
          pujaIds: ids([
            "sharadiya-durga-puja",
            "diwali-puja",
            "saraswati-puja",
            "kumar-purnima",
            "wedding-rituals",
            "navagraha-puja",
            "griha-pravesh",
            "satyanarayan-puja",
            "jagannath-puja",
          ]),
        },
      },
    ];

    return {
      users: [
        {
          id: "user-family",
          email: "family@bookpandit.local",
          password: "password123",
          name: "Anita Das",
          phone: "9000000001",
          role: "FAMILY",
          profile: null,
        },
        ...pandits.map((pandit) => ({ ...pandit, password: "password123", role: "PANDIT" as const })),
      ],
      bookings: [],
    };
  }

  private nextId(prefix: string) {
    return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
  }

  private today() {
    const now = new Date();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    return `${now.getFullYear()}-${month}-${day}`;
  }

  private endTime(startTime: string, hours: number) {
    const [hourText, minuteText] = startTime.split(":");
    const total = Number(hourText) * 60 + Number(minuteText) + Math.round(hours * 60);
    const hour = Math.floor(total / 60) % 24;
    const minute = total % 60;
    return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
  }

  private overlaps(startA: string, hoursA: number, startB: string, hoursB: number) {
    const toMinutes = (time: string) => {
      const [hour, minute] = time.split(":").map(Number);
      return hour * 60 + minute;
    };
    const a0 = toMinutes(startA);
    const b0 = toMinutes(startB);
    return a0 < b0 + hoursB * 60 && b0 < a0 + hoursA * 60;
  }

  private fail(message: string, status: number): never {
    throw new HttpErrorResponse({ status, error: { error: message } });
  }
}
