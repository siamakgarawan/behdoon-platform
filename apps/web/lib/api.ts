// Server Components run inside the Docker network and can reach the api
// container directly; the browser can't resolve that hostname, so client-side
// calls go through the relative /api path that next.config.ts rewrites to
// the same backend. Same code, two different base URLs depending on context.
const BASE =
  typeof window === "undefined"
    ? (process.env.INTERNAL_API_URL ?? "http://api:3000")
    : "/api";

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

interface RequestOptions {
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  body?: unknown;
  token?: string;
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method: options.method ?? "GET",
    headers: {
      "Content-Type": "application/json",
      ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
    cache: "no-store",
  });

  if (!res.ok) {
    const errorBody: unknown = await res.json().catch(() => ({}));
    const message =
      typeof errorBody === "object" &&
      errorBody !== null &&
      "message" in errorBody &&
      typeof (errorBody as { message: unknown }).message === "string"
        ? (errorBody as { message: string }).message
        : "خطایی رخ داد";
    throw new ApiError(res.status, message);
  }

  if (res.status === 204) {
    return undefined as T;
  }

  return res.json() as Promise<T>;
}

export const api = {
  get: <T>(path: string, token?: string) => request<T>(path, { token }),
  post: <T>(path: string, body?: unknown, token?: string) =>
    request<T>(path, { method: "POST", body, token }),
  patch: <T>(path: string, body?: unknown, token?: string) =>
    request<T>(path, { method: "PATCH", body, token }),
  delete: <T>(path: string, token?: string) =>
    request<T>(path, { method: "DELETE", token }),
};
