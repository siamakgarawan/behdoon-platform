import Link from "next/link";
import { notFound } from "next/navigation";
import { api, ApiError } from "@/lib/api";
import type { Salon, Service, WorkingHour } from "@/lib/types";
import { weekdayName } from "@/lib/format";
import { SalonServices } from "./salon-services";

type SalonDetail = Salon & { services: Service[]; workingHours: WorkingHour[] };

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
      <p className="mt-1 text-zinc-500">
        {salon.city} — {salon.address}
      </p>
      {salon.bio && (
        <p className="mt-4 text-zinc-700 dark:text-zinc-300">{salon.bio}</p>
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
    </div>
  );
}
