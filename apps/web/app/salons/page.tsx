import Link from "next/link";
import { api } from "@/lib/api";
import { formatRating } from "@/lib/format";
import type { Paginated, Salon } from "@/lib/types";

export default async function SalonsPage({
  searchParams,
}: {
  searchParams: Promise<{ city?: string }>;
}) {
  const { city } = await searchParams;
  const query = city ? `?city=${encodeURIComponent(city)}&limit=50` : "?limit=50";

  let salons: Salon[] = [];
  try {
    const result = await api.get<Paginated<Salon>>(`/salons${query}`);
    salons = result.data;
  } catch {
    salons = [];
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-12">
      <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
        سالن‌ها
      </h1>

      {salons.length === 0 ? (
        <p className="mt-6 text-zinc-500">فعلاً سالنی ثبت نشده است.</p>
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {salons.map((salon) => (
            <Link
              key={salon.id}
              href={`/salons/${salon.id}`}
              className="rounded-lg border border-zinc-200 p-5 transition hover:border-rose-300 hover:shadow-sm dark:border-zinc-800 dark:hover:border-rose-900"
            >
              <h2 className="font-semibold text-zinc-900 dark:text-zinc-50">
                {salon.name}
              </h2>
              <p className="mt-1 text-sm text-zinc-500">{salon.city}</p>
              <p className="mt-1 text-xs text-amber-600 dark:text-amber-400">
                {formatRating(salon.rating?.average ?? null, salon.rating?.count ?? 0)}
              </p>
              {salon.bio && (
                <p className="mt-2 line-clamp-2 text-sm text-zinc-600 dark:text-zinc-400">
                  {salon.bio}
                </p>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
