import Link from "next/link";
import { api } from "@/lib/api";
import type { Category, Paginated } from "@/lib/types";

export default async function Home() {
  let categories: Category[] = [];
  try {
    const result = await api.get<Paginated<Category>>("/categories?limit=20");
    categories = result.data;
  } catch {
    categories = [];
  }

  return (
    <div>
      <section className="bg-gradient-to-b from-rose-50 to-white px-4 py-16 text-center dark:from-rose-950/20 dark:to-zinc-950 sm:py-24">
        <div className="mx-auto max-w-3xl">
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50 sm:text-4xl">
            نوبت آنلاین از بهترین سالن‌ها و آرایشگاه‌ها
          </h1>
          <p className="mt-4 text-lg text-zinc-600 dark:text-zinc-400">
            کوتاهی مو، رنگ، میکاپ، ناخن، اصلاح صورت و بیشتر — پروفایل سالن‌ها
            را ببینید و در چند ثانیه نوبت رزرو کنید
          </p>
          <Link
            href="/salons"
            className="mt-8 inline-block rounded-full bg-rose-600 px-8 py-3 font-medium text-white shadow-sm hover:bg-rose-700"
          >
            مشاهده‌ی سالن‌ها
          </Link>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 py-16">
        <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
          دسته‌بندی خدمات
        </h2>
        {categories.length === 0 ? (
          <p className="mt-4 text-zinc-500">هنوز دسته‌بندی‌ای ثبت نشده است.</p>
        ) : (
          <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
            {categories.map((category) => (
              <Link
                key={category.id}
                href={`/services?categoryId=${category.id}`}
                className="rounded-lg border border-zinc-200 p-4 text-center transition hover:border-rose-300 hover:bg-rose-50 dark:border-zinc-800 dark:hover:border-rose-900 dark:hover:bg-rose-950/20"
              >
                {category.name}
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
