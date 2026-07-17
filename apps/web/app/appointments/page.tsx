"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { getAccessToken } from "@/lib/auth";
import { formatAppointmentDateTime, formatToman } from "@/lib/format";
import type { Appointment, Paginated, Profile } from "@/lib/types";

const STATUS_LABELS: Record<Appointment["status"], string> = {
  PENDING: "در انتظار تأیید",
  CONFIRMED: "تأیید شده",
  COMPLETED: "انجام شده",
  CANCELLED: "لغو شده",
  NO_SHOW: "عدم حضور",
};

export default function AppointmentsPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [appointments, setAppointments] = useState<Appointment[] | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);

  async function load() {
    const token = getAccessToken();
    if (!token) {
      router.push("/login");
      return;
    }

    const [profileResult, appointmentsResult] = await Promise.all([
      api.get<Profile>("/auth/profile", token),
      api.get<Paginated<Appointment>>("/appointments/me?limit=50", token),
    ]);

    setProfile(profileResult);
    setAppointments(appointmentsResult.data);
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch-on-mount, setState happens after the awaited request resolves, not synchronously
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function act(id: number, action: "confirm" | "complete" | "cancel") {
    const token = getAccessToken();
    if (!token) return;

    setBusyId(id);
    try {
      await api.post(`/appointments/${id}/${action}`, undefined, token);
      await load();
    } finally {
      setBusyId(null);
    }
  }

  if (!profile || !appointments) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12">
        <p className="text-zinc-500">در حال بارگذاری...</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
        نوبت‌های من
      </h1>

      {appointments.length === 0 ? (
        <p className="mt-6 text-zinc-500">هنوز نوبتی ثبت نکرده‌اید.</p>
      ) : (
        <div className="mt-6 space-y-3">
          {appointments.map((appt) => {
            const isSalonOwner = appt.salon.userId === profile.id;

            return (
              <div
                key={appt.id}
                className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-medium text-zinc-900 dark:text-zinc-50">
                      {appt.service.title}
                    </p>
                    <p className="mt-0.5 text-sm text-zinc-500">
                      {appt.salon.name}
                    </p>
                    <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                      {formatAppointmentDateTime(appt.startAt)}
                    </p>
                  </div>
                  <div className="text-left">
                    <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                      {STATUS_LABELS[appt.status]}
                    </span>
                    <p className="mt-2 text-sm font-medium text-zinc-900 dark:text-zinc-50">
                      {formatToman(appt.service.price)}
                    </p>
                  </div>
                </div>

                <div className="mt-3 flex gap-2">
                  {isSalonOwner && appt.status === "PENDING" && (
                    <button
                      type="button"
                      disabled={busyId === appt.id}
                      onClick={() => void act(appt.id, "confirm")}
                      className="rounded border border-rose-300 px-3 py-1 text-sm text-rose-700 hover:bg-rose-50 disabled:opacity-50 dark:border-rose-900 dark:text-rose-300"
                    >
                      تأیید نوبت
                    </button>
                  )}
                  {isSalonOwner && appt.status === "CONFIRMED" && (
                    <button
                      type="button"
                      disabled={busyId === appt.id}
                      onClick={() => void act(appt.id, "complete")}
                      className="rounded border border-zinc-300 px-3 py-1 text-sm hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-700 dark:hover:bg-zinc-900"
                    >
                      انجام شد
                    </button>
                  )}
                  {(appt.status === "PENDING" || appt.status === "CONFIRMED") && (
                    <button
                      type="button"
                      disabled={busyId === appt.id}
                      onClick={() => void act(appt.id, "cancel")}
                      className="rounded border border-zinc-300 px-3 py-1 text-sm text-zinc-600 hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-900"
                    >
                      لغو نوبت
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
