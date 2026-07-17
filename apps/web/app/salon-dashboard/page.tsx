"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { api, ApiError } from "@/lib/api";
import { getAccessToken } from "@/lib/auth";
import { formatDuration, formatToman, weekdayName } from "@/lib/format";
import type { Salon, SalonPhoto, Service, WorkingHour } from "@/lib/types";

const WEEKDAYS = [0, 1, 2, 3, 4, 5, 6];

interface WorkingHourRow {
  enabled: boolean;
  startTime: string;
  endTime: string;
}

function defaultRows(existing: WorkingHour[]): WorkingHourRow[] {
  return WEEKDAYS.map((weekday) => {
    const found = existing.find((wh) => wh.weekday === weekday);
    return found
      ? { enabled: true, startTime: found.startTime, endTime: found.endTime }
      : { enabled: false, startTime: "09:00", endTime: "18:00" };
  });
}

type SalonDetail = Salon & { workingHours: WorkingHour[]; photos: SalonPhoto[] };

export default function SalonDashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [salon, setSalon] = useState<SalonDetail | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [rows, setRows] = useState<WorkingHourRow[]>(defaultRows([]));
  const [message, setMessage] = useState<string | null>(null);

  // create-salon form state
  const [name, setName] = useState("");
  const [city, setCity] = useState("");
  const [address, setAddress] = useState("");
  const [bio, setBio] = useState("");

  // profile-info edit state (populated once the salon loads)
  const [phone, setPhone] = useState("");
  const [instagram, setInstagram] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");

  // add-service form state
  const [svcTitle, setSvcTitle] = useState("");
  const [svcPrice, setSvcPrice] = useState("");
  const [svcDuration, setSvcDuration] = useState("");
  const [svcCategoryId, setSvcCategoryId] = useState("");

  async function load() {
    const token = getAccessToken();
    if (!token) {
      router.push("/login");
      return;
    }

    try {
      const mine = await api.get<SalonDetail>("/salons/me", token);
      setSalon(mine);
      setRows(defaultRows(mine.workingHours));
      setPhone(mine.phone ?? "");
      setInstagram(mine.instagram ?? "");
      setLatitude(mine.latitude !== null ? String(mine.latitude) : "");
      setLongitude(mine.longitude !== null ? String(mine.longitude) : "");
      const myServices = await api.get<Service[]>("/services/mine", token);
      setServices(myServices);
    } catch (err) {
      if (!(err instanceof ApiError && err.status === 404)) {
        setMessage("خطا در دریافت اطلاعات سالن");
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch-on-mount, setState happens after the awaited request resolves, not synchronously
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function createSalon(event: FormEvent) {
    event.preventDefault();
    const token = getAccessToken();
    if (!token) return;

    try {
      await api.post("/salons", { name, city, address, bio: bio || undefined }, token);
      await load();
    } catch {
      setMessage("ثبت سالن انجام نشد");
    }
  }

  async function saveProfile(event: FormEvent) {
    event.preventDefault();
    const token = getAccessToken();
    if (!token) return;

    try {
      await api.patch(
        "/salons/me",
        {
          phone: phone || undefined,
          instagram: instagram || undefined,
          latitude: latitude ? Number(latitude) : undefined,
          longitude: longitude ? Number(longitude) : undefined,
        },
        token,
      );
      setMessage("اطلاعات سالن ذخیره شد");
      await load();
    } catch {
      setMessage("ذخیره‌ی اطلاعات سالن انجام نشد");
    }
  }

  async function addPhoto(event: FormEvent) {
    event.preventDefault();
    const token = getAccessToken();
    if (!token || !photoUrl) return;

    try {
      await api.post("/salons/me/photos", { url: photoUrl }, token);
      setPhotoUrl("");
      await load();
    } catch {
      setMessage("افزودن عکس انجام نشد");
    }
  }

  async function removePhoto(photoId: number) {
    const token = getAccessToken();
    if (!token) return;

    await api.delete(`/salons/me/photos/${photoId}`, token);
    await load();
  }

  async function saveWorkingHours(event: FormEvent) {
    event.preventDefault();
    const token = getAccessToken();
    if (!token) return;

    const hours = rows
      .map((row, weekday) => ({ weekday, ...row }))
      .filter((row) => row.enabled)
      .map(({ weekday, startTime, endTime }) => ({ weekday, startTime, endTime }));

    if (hours.length === 0) {
      setMessage("حداقل یک روز کاری را انتخاب کنید");
      return;
    }

    try {
      await api.post("/salons/me/working-hours", { hours }, token);
      setMessage("ساعات کاری ذخیره شد");
      await load();
    } catch {
      setMessage("ذخیره‌ی ساعات کاری انجام نشد");
    }
  }

  async function addService(event: FormEvent) {
    event.preventDefault();
    const token = getAccessToken();
    if (!token) return;

    try {
      await api.post(
        "/services",
        {
          title: svcTitle,
          price: Number(svcPrice),
          durationMin: Number(svcDuration),
          categoryId: Number(svcCategoryId),
        },
        token,
      );
      setSvcTitle("");
      setSvcPrice("");
      setSvcDuration("");
      setSvcCategoryId("");
      await load();
    } catch {
      setMessage("افزودن خدمت انجام نشد");
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16">
        <p className="text-zinc-500">در حال بارگذاری...</p>
      </div>
    );
  }

  if (!salon) {
    return (
      <div className="mx-auto max-w-sm px-4 py-16">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
          ثبت سالن
        </h1>
        <form onSubmit={createSalon} className="mt-8 flex flex-col gap-4">
          <label className="flex flex-col gap-1 text-sm">
            نام سالن
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="rounded border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            شهر
            <input
              required
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="rounded border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            آدرس
            <input
              required
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="rounded border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            درباره‌ی سالن (اختیاری)
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="rounded border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
            />
          </label>
          {message && <p className="text-sm text-red-600">{message}</p>}
          <button
            type="submit"
            className="mt-2 rounded bg-rose-600 py-2 text-white hover:bg-rose-700"
          >
            ثبت سالن
          </button>
          <p className="text-xs text-zinc-500">
            پس از ثبت، سالن شما توسط ادمین بررسی و تأیید می‌شود تا در فهرست
            عمومی نمایش داده شود. شماره تماس، اینستاگرام، موقعیت روی نقشه و
            گالری عکس را بعد از ثبت می‌توانید اضافه کنید.
          </p>
        </form>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
        {salon.name}
      </h1>
      <p className="mt-1 text-sm text-zinc-500">
        {salon.verified ? "تأیید شده ✓" : "در انتظار تأیید ادمین"}
      </p>

      <section className="mt-8">
        <h2 className="font-semibold text-zinc-900 dark:text-zinc-50">
          اطلاعات تماس و موقعیت
        </h2>
        <form onSubmit={saveProfile} className="mt-3 grid gap-3 sm:grid-cols-2">
          <input
            placeholder="شماره تماس (مثلاً +989121234567)"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="rounded border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
          />
          <input
            placeholder="آیدی اینستاگرام"
            value={instagram}
            onChange={(e) => setInstagram(e.target.value)}
            className="rounded border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
          />
          <input
            placeholder="عرض جغرافیایی (latitude)"
            value={latitude}
            onChange={(e) => setLatitude(e.target.value)}
            className="rounded border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
          />
          <input
            placeholder="طول جغرافیایی (longitude)"
            value={longitude}
            onChange={(e) => setLongitude(e.target.value)}
            className="rounded border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
          />
          <button
            type="submit"
            className="sm:col-span-2 rounded bg-zinc-900 py-2 text-sm text-white dark:bg-zinc-50 dark:text-zinc-900"
          >
            ذخیره
          </button>
          <p className="text-xs text-zinc-500 sm:col-span-2">
            برای گرفتن مختصات: در Google Maps روی محل سالن راست‌کلیک کنید،
            عددها را کپی کنید.
          </p>
        </form>
      </section>

      <section className="mt-10">
        <h2 className="font-semibold text-zinc-900 dark:text-zinc-50">
          گالری عکس
        </h2>
        {salon.photos.length > 0 && (
          <div className="mt-3 grid grid-cols-4 gap-2">
            {salon.photos.map((photo) => (
              <div key={photo.id} className="group relative">
                {/* eslint-disable-next-line @next/next/no-img-element -- external, owner-pasted URLs */}
                <img
                  src={photo.url}
                  alt=""
                  className="aspect-square w-full rounded object-cover"
                />
                <button
                  type="button"
                  onClick={() => void removePhoto(photo.id)}
                  className="absolute inset-0 hidden items-center justify-center rounded bg-black/50 text-xs text-white group-hover:flex"
                >
                  حذف
                </button>
              </div>
            ))}
          </div>
        )}
        <form onSubmit={addPhoto} className="mt-3 flex gap-2">
          <input
            placeholder="لینک عکس (https://...)"
            value={photoUrl}
            onChange={(e) => setPhotoUrl(e.target.value)}
            className="flex-1 rounded border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
          />
          <button
            type="submit"
            className="rounded bg-zinc-900 px-4 py-2 text-sm text-white dark:bg-zinc-50 dark:text-zinc-900"
          >
            افزودن
          </button>
        </form>
        <p className="mt-2 text-xs text-zinc-500">
          فعلاً آپلود مستقیم فایل پشتیبانی نمی‌شود؛ لینک عکسی که جایی آپلود
          کرده‌اید (اینستاگرام، گوگل درایو عمومی و غیره) را وارد کنید.
        </p>
      </section>

      <section className="mt-10">
        <h2 className="font-semibold text-zinc-900 dark:text-zinc-50">
          ساعات کاری
        </h2>
        <form onSubmit={saveWorkingHours} className="mt-3 space-y-2">
          {WEEKDAYS.map((weekday) => (
            <div key={weekday} className="flex items-center gap-3 text-sm">
              <label className="flex w-28 items-center gap-2">
                <input
                  type="checkbox"
                  checked={rows[weekday].enabled}
                  onChange={(e) =>
                    setRows((prev) =>
                      prev.map((row, index) =>
                        index === weekday
                          ? { ...row, enabled: e.target.checked }
                          : row,
                      ),
                    )
                  }
                />
                {weekdayName(weekday)}
              </label>
              <input
                type="time"
                disabled={!rows[weekday].enabled}
                value={rows[weekday].startTime}
                onChange={(e) =>
                  setRows((prev) =>
                    prev.map((row, index) =>
                      index === weekday
                        ? { ...row, startTime: e.target.value }
                        : row,
                    ),
                  )
                }
                className="rounded border border-zinc-300 px-2 py-1 disabled:opacity-40 dark:border-zinc-700 dark:bg-zinc-900"
              />
              <span className="text-zinc-400">تا</span>
              <input
                type="time"
                disabled={!rows[weekday].enabled}
                value={rows[weekday].endTime}
                onChange={(e) =>
                  setRows((prev) =>
                    prev.map((row, index) =>
                      index === weekday
                        ? { ...row, endTime: e.target.value }
                        : row,
                    ),
                  )
                }
                className="rounded border border-zinc-300 px-2 py-1 disabled:opacity-40 dark:border-zinc-700 dark:bg-zinc-900"
              />
            </div>
          ))}
          <button
            type="submit"
            className="mt-2 rounded bg-zinc-900 px-4 py-2 text-sm text-white dark:bg-zinc-50 dark:text-zinc-900"
          >
            ذخیره‌ی ساعات کاری
          </button>
        </form>
      </section>

      <section className="mt-10">
        <h2 className="font-semibold text-zinc-900 dark:text-zinc-50">
          خدمات
        </h2>
        {services.length > 0 && (
          <ul className="mt-3 space-y-2">
            {services.map((service) => (
              <li
                key={service.id}
                className="flex justify-between rounded border border-zinc-200 px-3 py-2 text-sm dark:border-zinc-800"
              >
                <span>{service.title}</span>
                <span className="text-zinc-500">
                  {formatToman(service.price)} ·{" "}
                  {formatDuration(service.durationMin)}
                </span>
              </li>
            ))}
          </ul>
        )}

        <form onSubmit={addService} className="mt-4 grid gap-3 sm:grid-cols-2">
          <input
            required
            placeholder="عنوان خدمت"
            value={svcTitle}
            onChange={(e) => setSvcTitle(e.target.value)}
            className="rounded border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
          />
          <input
            required
            type="number"
            placeholder="شناسه‌ی دسته‌بندی"
            value={svcCategoryId}
            onChange={(e) => setSvcCategoryId(e.target.value)}
            className="rounded border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
          />
          <input
            required
            type="number"
            placeholder="قیمت (ریال)"
            value={svcPrice}
            onChange={(e) => setSvcPrice(e.target.value)}
            className="rounded border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
          />
          <input
            required
            type="number"
            placeholder="مدت زمان (دقیقه)"
            value={svcDuration}
            onChange={(e) => setSvcDuration(e.target.value)}
            className="rounded border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
          />
          <button
            type="submit"
            className="sm:col-span-2 rounded bg-rose-600 py-2 text-sm text-white hover:bg-rose-700"
          >
            افزودن خدمت
          </button>
        </form>
      </section>

      {message && (
        <p className="mt-4 text-sm text-zinc-700 dark:text-zinc-300">{message}</p>
      )}
    </div>
  );
}
