"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api, ApiError } from "@/lib/api";
import { setTokens } from "@/lib/auth";
import type { TokenPair } from "@/lib/types";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await api.post("/auth/register", { name, email, password });
      const result = await api.post<TokenPair>("/auth/login", {
        email,
        password,
      });
      setTokens(result.access_token, result.refresh_token);
      router.push("/profile");
      router.refresh();
    } catch (err) {
      setError(
        err instanceof ApiError
          ? "امکان ثبت‌نام نبود — شاید این ایمیل قبلاً ثبت شده است"
          : "خطایی رخ داد، دوباره تلاش کنید",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-sm px-4 py-16">
      <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
        ثبت‌نام
      </h1>
      <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-4">
        <label className="flex flex-col gap-1 text-sm">
          نام
          <input
            type="text"
            required
            value={name}
            onChange={(event) => setName(event.target.value)}
            className="rounded border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          ایمیل
          <input
            type="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="rounded border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          رمز عبور
          <input
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="rounded border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
          />
        </label>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="mt-2 rounded bg-rose-600 py-2 text-white disabled:opacity-50 hover:bg-rose-700"
        >
          {loading ? "در حال ثبت‌نام..." : "ثبت‌نام"}
        </button>
      </form>
      <p className="mt-6 text-sm text-zinc-600 dark:text-zinc-400">
        قبلاً ثبت‌نام کرده‌اید؟{" "}
        <Link href="/login" className="font-medium text-zinc-900 dark:text-zinc-50">
          ورود
        </Link>
      </p>
    </div>
  );
}
