import Link from "next/link";
import { notFound } from "next/navigation";
import { api, ApiError } from "@/lib/api";
import type { Review, Salon, SalonPhoto, Service, WorkingHour } from "@/lib/types";
import { formatRating, instagramUrl, mapEmbedUrl, weekdayName } from "@/lib/format";
import { SalonServices } from "./salon-services";

type SalonDetail = Salon & {
  services: Service[];
  workingHours: WorkingHour[];
  photos: SalonPhoto[];
  reviews: Review[];
};

export default async function SalonPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  let salon: SalonDetail;
  try {
    salon = await api.get<SalonDetail>(`/salons/${id}`);
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) {
      notFound();
    }
    throw err;
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <Link href="/salons" className="text-sm text-zinc-500 hover:text-zinc-700">
        ← بازگشت به سالن‌ها
      </Link>

      <h1 className="mt-3 text-2xl font-bold text-zinc-900 dark:text-zinc-50">
        {salon.name}
      </h1>
      <p className="mt-1 text-sm text-amber-600 dark:text-amber-400">
        {formatRating(salon.rating?.average ?? null, salon.rating?.count ?? 0)}
      </p>
      <p className="mt-2 text-zinc-500">
        {salon.city} — {salon.address}
      </p>

      <div className="mt-2 flex flex-wrap gap-4 text-sm">
        {salon.phone && (
          <a
            href={`tel:${salon.phone}`}
            className="text-rose-600 hover:underline dark:text-rose-400"
          >
            {salon.phone}
          </a>
        )}
        {salon.instagram && (
          <a
            href={instagramUrl(salon.instagram)}
            target="_blank"
            rel="noreferrer"
            className="text-rose-600 hover:underline dark:text-rose-400"
          >
            اینستاگرام
          </a>
        )}
      </div>

      {salon.bio && (
        <p className="mt-4 text-zinc-700 dark:text-zinc-300">{salon.bio}</p>
      )}

      {salon.photos.length > 0 && (
        <div className="mt-6 grid grid-cols-3 gap-2">
          {salon.photos.map((photo) => (
            // eslint-disable-next-line @next/next/no-img-element -- external, owner-pasted URLs; next/image would require configuring remote patterns per host
            <img
              key={photo.id}
              src={photo.url}
              alt={salon.name}
              className="aspect-square w-full rounded-lg object-cover"
            />
          ))}
        </div>
      )}

      {salon.latitude !== null && salon.longitude !== null && (
        <div className="mt-6 overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-800">
          <iframe
            title="موقعیت سالن روی نقشه"
            src={mapEmbedUrl(salon.latitude, salon.longitude)}
            className="h-64 w-full"
          />
        </div>
      )}

      {salon.workingHours.length > 0 && (
        <div className="mt-6 text-sm text-zinc-500">
          <span className="font-medium text-zinc-700 dark:text-zinc-300">
            ساعات کاری:{" "}
          </span>
          {salon.workingHours
            .slice()
            .sort((a, b) => a.weekday - b.weekday)
            .map((wh) => `${weekdayName(wh.weekday)} ${wh.startTime}-${wh.endTime}`)
            .join("، ")}
        </div>
      )}

      <h2 className="mt-10 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
        خدمات و رزرو نوبت
      </h2>
      {salon.services.length === 0 ? (
        <p className="mt-4 text-zinc-500">این سالن هنوز خدمتی ثبت نکرده است.</p>
      ) : (
        <SalonServices salonId={salon.id} services={salon.services} />
      )}

      <h2 className="mt-10 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
        نظرات مشتریان
      </h2>
      {salon.reviews.length === 0 ? (
        <p className="mt-4 text-zinc-500">هنوز نظری برای این سالن ثبت نشده است.</p>
      ) : (
        <div className="mt-4 space-y-3">
          {salon.reviews.map((review) => (
            <div
              key={review.id}
              className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800"
            >
              <p className="text-amber-600 dark:text-amber-400">
                {"★".repeat(review.rating)}
                {"☆".repeat(5 - review.rating)}
              </p>
              {review.comment && (
                <p className="mt-2 text-sm text-zinc-700 dark:text-zinc-300">
                  {review.comment}
                </p>
              )}
              {review.customer?.name && (
                <p className="mt-2 text-xs text-zinc-500">
                  {review.customer.name}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
