import Link from "next/link";
import { api } from "@/lib/api";
import { formatDuration, formatToman } from "@/lib/format";
import type { Paginated, Service } from "@/lib/types";

export default async function ServicesPage({
  searchParams,
}: {
  searchParams: Promise<{ categoryId?: string }>;
}) {
  const { categoryId } = await searchParams;
  const query = categoryId
    ? `?categoryId=${categoryId}&limit=50`
    : "?limit=50";

  let services: Service[] = [];
  try {
    const result = await api.get<Paginated<Service>>(`/services${query}`);
    services = result.data;
  } catch {
    services = [];
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-12">
      <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
        خدمات
      </h1>

      {services.length === 0 ? (
        <p className="mt-6 text-zinc-500">
          فعلاً خدمتی در این بخش ثبت نشده است.
        </p>
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {services.map((service) => (
            <Link
              key={service.id}
              href={`/salons/${service.salon?.id}`}
              className="rounded-lg border border-zinc-200 p-4 transition hover:border-rose-300 hover:shadow-sm dark:border-zinc-800 dark:hover:border-rose-900"
            >
              <h2 className="font-semibold text-zinc-900 dark:text-zinc-50">
                {service.title}
              </h2>
              {service.salon && (
                <p className="mt-1 text-sm text-zinc-500">
                  {service.salon.name} — {service.salon.city}
                </p>
              )}
              {service.description && (
                <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                  {service.description}
                </p>
              )}
              <p className="mt-3 flex items-center justify-between text-sm">
                <span className="font-medium text-zinc-900 dark:text-zinc-50">
                  {formatToman(service.price)}
                </span>
                <span className="text-zinc-500">
                  {formatDuration(service.durationMin)}
                </span>
              </p>
            </Link>
          ))}
        </div>
      )}

      <Link
        href="/"
        className="mt-8 inline-block text-sm text-zinc-600 dark:text-zinc-400"
      >
        ← بازگشت به صفحه‌ی اصلی
      </Link>
    </div>
  );
}
