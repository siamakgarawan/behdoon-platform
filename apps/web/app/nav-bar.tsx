"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";
import { clearTokens, getAccessToken } from "@/lib/auth";

function subscribe(callback: () => void) {
  window.addEventListener("storage", callback);
  return () => window.removeEventListener("storage", callback);
}

function getSnapshot() {
  return !!getAccessToken();
}

function getServerSnapshot() {
  return false;
}

export function NavBar() {
  const loggedIn = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  );

  return (
    <header className="border-b border-zinc-200 dark:border-zinc-800">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
        <Link
          href="/"
          className="text-lg font-bold text-zinc-900 dark:text-zinc-50"
        >
          بهدون
        </Link>
        <nav className="flex items-center gap-4 text-sm">
          <Link
            href="/services"
            className="text-zinc-700 hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-zinc-50"
          >
            خدمات
          </Link>
          {loggedIn ? (
            <button
              type="button"
              onClick={() => {
                clearTokens();
                window.location.href = "/";
              }}
              className="text-zinc-700 hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-zinc-50"
            >
              خروج
            </button>
          ) : (
            <>
              <Link
                href="/login"
                className="text-zinc-700 hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-zinc-50"
              >
                ورود
              </Link>
              <Link
                href="/register"
                className="rounded bg-zinc-900 px-3 py-1.5 text-white dark:bg-zinc-50 dark:text-zinc-900"
              >
                ثبت‌نام
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
