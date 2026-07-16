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
