const PERSIAN_DIGITS = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];

export function toPersianDigits(input: string | number): string {
  return String(input).replace(
    /[0-9]/g,
    (digit) => PERSIAN_DIGITS[Number(digit)],
  );
}

// Money is stored as integer Rial everywhere (Phase 05); this is the one
// place it gets converted to Toman for display.
export function formatToman(rial: number): string {
  const toman = Math.round(rial / 10);
  return `${toPersianDigits(toman.toLocaleString("en-US"))} تومان`;
}

export function formatDuration(minutes: number): string {
  if (minutes < 60) {
    return `${toPersianDigits(minutes)} دقیقه`;
  }
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest === 0
    ? `${toPersianDigits(hours)} ساعت`
    : `${toPersianDigits(hours)} ساعت و ${toPersianDigits(rest)} دقیقه`;
}

const WEEKDAY_NAMES = [
  "یکشنبه",
  "دوشنبه",
  "سه‌شنبه",
  "چهارشنبه",
  "پنجشنبه",
  "جمعه",
  "شنبه",
];

export function weekdayName(weekday: number): string {
  return WEEKDAY_NAMES[weekday] ?? "";
}

export function formatSlotTime(isoString: string): string {
  const date = new Date(isoString);
  const hh = String(date.getUTCHours()).padStart(2, "0");
  const mm = String(date.getUTCMinutes()).padStart(2, "0");
  return toPersianDigits(`${hh}:${mm}`);
}

export function formatAppointmentDateTime(isoString: string): string {
  const date = new Date(isoString);
  const weekday = weekdayName(date.getUTCDay());
  const day = date.getUTCDate();
  const month = date.getUTCMonth() + 1;
  const time = formatSlotTime(isoString);
  return `${weekday} ${toPersianDigits(day)}/${toPersianDigits(month)} — ساعت ${time}`;
}

export function formatRating(average: number | null, count: number): string {
  if (average === null || count === 0) {
    return "هنوز امتیازی ثبت نشده";
  }
  const stars = "★".repeat(Math.round(average)) + "☆".repeat(5 - Math.round(average));
  return `${stars} ${toPersianDigits(average.toFixed(1))} (${toPersianDigits(count)} نظر)`;
}

export function instagramUrl(handle: string): string {
  const clean = handle.replace(/^@/, "").replace(/^https?:\/\/(www\.)?instagram\.com\//, "");
  return `https://instagram.com/${clean}`;
}

export function mapEmbedUrl(latitude: number, longitude: number): string {
  const delta = 0.01;
  const bbox = `${longitude - delta},${latitude - delta},${longitude + delta},${latitude + delta}`;
  return `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&marker=${latitude},${longitude}`;
}
