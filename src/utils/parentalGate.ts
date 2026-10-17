const PERSIAN_DIGITS = '۰۱۲۳۴۵۶۷۸۹';
const ARABIC_DIGITS = '٠١٢٣٤٥٦٧٨٩';

/** Normalize Persian/Arabic numerals before validating the offline adult check. */
export function normalizeNumerals(value: string): string {
  return Array.from(value, (char) => {
    const persianIndex = PERSIAN_DIGITS.indexOf(char);
    if (persianIndex >= 0) return String(persianIndex);
    const arabicIndex = ARABIC_DIGITS.indexOf(char);
    if (arabicIndex >= 0) return String(arabicIndex);
    return char;
  }).join('').trim();
}

/** Adult gate challenge: 17 × 3 = 51. */
export function isAdultGateAnswerCorrect(value: string): boolean {
  return normalizeNumerals(value) === '51';
}
