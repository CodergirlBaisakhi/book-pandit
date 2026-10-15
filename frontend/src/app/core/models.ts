export const API_URL = "http://localhost:3000/api";

export interface Ingredient {
  id: string;
  name: string;
  sortOrder: number;
}

export interface Puja {
  id: string;
  slug: string;
  name: string;
  category: string;
  description: string;
  basePrice: number;
  includedHours: number;
  extraHourRate: number;
  ingredients: Ingredient[];
}

export interface Pandit {
  id: string;
  name: string;
  qualification: string;
  experienceYears: number;
  languages: string;
  bio: string;
  city: string;
  rating: number;
  reviewCount: number;
  pujaIds: string[];
}

export interface PanditProfile {
  id: string;
  qualification: string;
  experienceYears: number;
  languages: string;
  bio: string;
  city: string;
  rating: number;
  reviewCount: number;
  pujaIds: string[];
}

export interface AppUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: "FAMILY" | "PANDIT";
  panditProfile: PanditProfile | null;
}

export interface Review {
  id: string;
  rating: number;
  comment: string;
}

export interface Booking {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  hours: number;
  address: string;
  notes: string;
  basePrice: number;
  extraHours: number;
  extraHourRate: number;
  amountDue: number;
  status: string;
  paid: boolean;
  puja: Puja;
  pandit: {
    id: string;
    name: string;
    phone: string;
    qualification: string;
    rating: number;
    city: string;
    languages: string;
    experienceYears: number;
  };
  family: {
    id: string;
    name: string;
    phone: string;
  };
  review: Review | null;
}

export interface AuthResponse {
  token: string;
  user: AppUser;
}

export const CATEGORY_ORDER = [
  "Daily worship",
  "Deity-specific puja",
  "Weekly puja and vrata",
  "Festival puja",
  "Family occasion puja",
  "Special-purpose rituals",
];
