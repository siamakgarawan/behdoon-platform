export interface Category {
  id: number;
  name: string;
}

export type PriceType = "FIXED" | "HOURLY" | "QUOTE";

export interface Service {
  id: number;
  title: string;
  description: string | null;
  priceType: PriceType;
  price: number | null;
  duration: number | null;
  category?: Category;
}

export interface Paginated<T> {
  data: T[];
  meta: { page: number; limit: number; total: number; totalPages: number };
}

export interface TokenPair {
  access_token: string;
  refresh_token: string;
}
