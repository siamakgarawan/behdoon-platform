"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api, ApiError } from "@/lib/api";
import { getAccessToken } from "@/lib/auth";
import { formatDuration, formatSlotTime, formatToman } from "@/lib/format";
import type { Service } from "@/lib/types";

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

export function SalonServices({
  salonId,
  services,
}: {
  salonId: number;
  services: Service[];
}) {
  const router = useRouter();
  const [openServiceId, setOpenServiceId] = useState<number | null>(null);
  const [date, setDate] = useState(todayIso());
  const [slots, setSlots] = useState<string[] | null>(null);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [booking, setBooking] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function loadSlots(serviceId: number, forDate: string) {
    setLoadingSlots(true);
    setMessage(null);
    try {
      const result = await api.get<string[]>(
        `/salons/${salonId}/availability?serviceId=${serviceId}&date=${forDate}`,
      );
      setSlots(result);
    } catch {
      setSlots([]);
    } finally {
      setLoadingSlots(false);
    }
  }

  function openService(serviceId: number) {
    setOpenServiceId(serviceId);
    setMessage(null);
    void loadSlots(serviceId, date);
  }

  async function book(serviceId: number, startAt: string) {
    const token = getAccessToken();
    if (!token) {
      router.push("/login");
      return;
    }

    setBooking(startAt);
    setMessage(null);
    try {
      await api.post("/appointments", { serviceId, startAt }, token);
      setMessage("نوبت شما با موفقیت ثبت شد. برای مشاهده به «نوبت‌های من» بروید.");
      setSlots((current) => current?.filter((slot) => slot !== startAt) ?? null);
    } catch (err) {
      setMessage(
        err instanceof ApiError && err.status === 409
          ? "این ساعت همین الان توسط شخص دیگری رزرو شد. لطفاً ساعت دیگری انتخاب کنید."
          : "ثبت نوبت انجام نشد، دوباره تلاش کنید.",
      );
    } finally {
      setBooking(null);
    }
  }

  return (
    <div className="mt-6 space-y-3">
      {services.map((service) => {
        const isOpen = openServiceId === service.id;
        return (
          <div
            key={service.id}
            className="rounded-lg border border-zinc-200 dark:border-zinc-800"
          >
            <button
              type="button"
              onClick={() => (isOpen ? setOpenServiceId(null) : openService(service.id))}
              className="flex w-full items-center justify-between gap-4 p-4 text-right"
            >
              <span>
                <span className="block font-medium text-zinc-900 dark:text-zinc-50">
                  {service.title}
                </span>
                {service.description && (
                  <span className="mt-0.5 block text-sm text-zinc-500">
                    {service.description}
                  </span>
                )}
              </span>
              <span className="whitespace-nowrap text-left text-sm">
                <span className="block font-medium text-zinc-900 dark:text-zinc-50">
                  {formatToman(service.price)}
                </span>
                <span className="block text-zinc-500">
                  {formatDuration(service.durationMin)}
                </span>
              </span>
            </button>

            {isOpen && (
              <div className="border-t border-zinc-200 p-4 dark:border-zinc-800">
                <label className="flex flex-col gap-1 text-sm">
                  تاریخ
                  <input
                    type="date"
                    value={date}
                    min={todayIso()}
                    onChange={(event) => {
                      setDate(event.target.value);
                      void loadSlots(service.id, event.target.value);
                    }}
                    className="w-fit rounded border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
                  />
                </label>

                <div className="mt-4">
                  {loadingSlots && (
                    <p className="text-sm text-zinc-500">در حال دریافت زمان‌های خالی...</p>
                  )}
                  {!loadingSlots && slots?.length === 0 && (
                    <p className="text-sm text-zinc-500">
                      برای این روز زمان خالی‌ای موجود نیست.
                    </p>
                  )}
                  {!loadingSlots && slots && slots.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {slots.map((slot) => (
                        <button
                          key={slot}
                          type="button"
                          disabled={booking === slot}
                          onClick={() => void book(service.id, slot)}
                          className="rounded border border-rose-300 px-3 py-1.5 text-sm text-rose-700 hover:bg-rose-50 disabled:opacity-50 dark:border-rose-900 dark:text-rose-300 dark:hover:bg-rose-950/30"
                        >
                          {booking === slot ? "در حال رزرو..." : formatSlotTime(slot)}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {message && (
                  <p className="mt-3 text-sm text-zinc-700 dark:text-zinc-300">{message}</p>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
