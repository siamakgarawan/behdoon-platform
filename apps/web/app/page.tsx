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
    <div className="mx-auto max-w-5xl px-4 py-12">
      <section className="text-center">
        <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50 sm:text-4xl">
          متخصص قابل‌اعتماد برای خانه‌تان
        </h1>
        <p className="mt-4 text-lg text-zinc-600 dark:text-zinc-400">
          تعمیرات، نشتی‌گیری، بازسازی، کاشی‌کاری، نقاشی، برق و لوله‌کشی — همه
          در یک‌جا
        </p>
        <Link
          href="/services"
          className="mt-8 inline-block rounded bg-zinc-900 px-6 py-3 text-white dark:bg-zinc-50 dark:text-zinc-900"
        >
          مشاهده‌ی خدمات
        </Link>
      </section>

      <section className="mt-16">
        <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
          دسته‌بندی‌ها
        </h2>
        {categories.length === 0 ? (
          <p className="mt-4 text-zinc-500">
            هنوز دسته‌بندی‌ای ثبت نشده است.
          </p>
        ) : (
          <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
            {categories.map((category) => (
              <Link
                key={category.id}
                href={`/services?categoryId=${category.id}`}
                className="rounded border border-zinc-200 p-4 text-center hover:border-zinc-400 dark:border-zinc-800"
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
