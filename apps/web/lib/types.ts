export interface Category {
  id: number;
  name: string;
}

export interface RatingSummary {
  average: number | null;
  count: number;
}

export interface SalonPhoto {
  id: number;
  url: string;
}

export interface Review {
  id: number;
  rating: number;
  comment: string | null;
  createdAt: string;
  customer?: { name: string | null };
}

export interface Salon {
  id: number;
  userId: number;
  name: string;
  bio: string | null;
  city: string;
  address: string;
  phone: string | null;
  instagram: string | null;
  latitude: number | null;
  longitude: number | null;
  verified: boolean;
  rating?: RatingSummary;
}

export interface Service {
  id: number;
  title: string;
  description: string | null;
  price: number;
  durationMin: number;
  category?: Category;
  salon?: Salon;
}

export type AppointmentStatus =
  | "PENDING"
  | "CONFIRMED"
  | "COMPLETED"
  | "CANCELLED"
  | "NO_SHOW";

export interface Appointment {
  id: number;
  status: AppointmentStatus;
  startAt: string;
  endAt: string;
  service: Service;
  salon: Salon;
  review: Review | null;
}

export interface WorkingHour {
  id: number;
  weekday: number;
  startTime: string;
  endTime: string;
}

export interface Paginated<T> {
  data: T[];
  meta: { page: number; limit: number; total: number; totalPages: number };
}

export interface TokenPair {
  access_token: string;
  refresh_token: string;
}

export interface Profile {
  id: number;
  email: string;
  role: "CUSTOMER" | "PROVIDER" | "ADMIN";
}
