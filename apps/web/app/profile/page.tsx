"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { getAccessToken } from "@/lib/auth";
import type { Profile } from "@/lib/types";

const ROLE_LABELS: Record<Profile["role"], string> = {
  CUSTOMER: "مشتری",
  PROVIDER: "صاحب سالن",
  ADMIN: "ادمین",
};

export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);

  useEffect(() => {
    const token = getAccessToken();
    if (!token) {
      router.push("/login");
      return;
    }
    void api.get<Profile>("/auth/profile", token).then(setProfile);
  }, [router]);

  if (!profile) {
    return (
      <div className="mx-auto max-w-sm px-4 py-16">
        <p className="text-zinc-500">در حال بارگذاری...</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-sm px-4 py-16">
      <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
        حساب کاربری
      </h1>

      <dl className="mt-6 space-y-3 text-sm">
        <div className="flex justify-between border-b border-zinc-100 pb-2 dark:border-zinc-800">
          <dt className="text-zinc-500">ایمیل</dt>
          <dd className="text-zinc-900 dark:text-zinc-50">{profile.email}</dd>
        </div>
        <div className="flex justify-between border-b border-zinc-100 pb-2 dark:border-zinc-800">
          <dt className="text-zinc-500">نوع حساب</dt>
          <dd className="text-zinc-900 dark:text-zinc-50">
            {ROLE_LABELS[profile.role]}
          </dd>
        </div>
      </dl>

      <div className="mt-8 flex flex-col gap-3">
        <Link
          href="/appointments"
          className="rounded border border-zinc-300 px-4 py-2 text-center text-sm hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-900"
        >
          نوبت‌های من
        </Link>
        {profile.role === "PROVIDER" ? (
          <Link
            href="/salon-dashboard"
            className="rounded bg-rose-600 px-4 py-2 text-center text-sm text-white hover:bg-rose-700"
          >
            مدیریت سالن
          </Link>
        ) : (
          <Link
            href="/salon-dashboard"
            className="rounded border border-rose-300 px-4 py-2 text-center text-sm text-rose-700 hover:bg-rose-50 dark:border-rose-900 dark:text-rose-300"
          >
            می‌خواهید سالن خود را ثبت کنید؟
          </Link>
        )}
      </div>
    </div>
  );
}
