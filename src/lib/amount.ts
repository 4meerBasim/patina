const digitMap: Record<string, string> = {};
for (let i = 0; i <= 9; i += 1) {
  digitMap[String.fromCharCode(0x0660 + i)] = String(i);
  digitMap[String.fromCharCode(0x06f0 + i)] = String(i);
}

export const MINUS = '−';

// A double carries about 15.95 significant decimal digits, so a total built by repeated
// addition can land a hair under a rounding tie and display a cent low. Snapping to 15
// digits drops that noise. Past 1e12 those 15 digits no longer reach the cents, so the
// raw value is the more accurate one.
const SNAP_LIMIT = 1e12;

export function snapDecimalNoise(magnitude: number): number {
  if (!Number.isFinite(magnitude) || magnitude >= SNAP_LIMIT) return magnitude;
  return Number(magnitude.toPrecision(15));
}

export function parseAmount(text: string): number | null {
  const cleaned = text
    .trim()
    .replace(/[$\s٬,]/g, '')
    .replace(/[٠-٩۰-۹]/g, (digit) => digitMap[digit])
    .replace(/٫/g, '.')
    .replace(/−/g, '-');
  if (cleaned === '') return null;
  const value = Number(cleaned);
  if (!Number.isFinite(value)) return null;
  return value === 0 ? 0 : value;
}

function groupDollars(magnitude: number, min: number, max: number): string {
  return magnitude.toLocaleString('en-US', {
    minimumFractionDigits: min,
    maximumFractionDigits: max,
  });
}

export function formatDollars(amount: number): string {
  const magnitude = snapDecimalNoise(Math.abs(amount));
  const loose = groupDollars(magnitude, 0, 2);
  const digits = loose.includes('.') ? groupDollars(magnitude, 2, 2) : loose;
  const body = `$${digits}`;
  return amount < 0 && /[1-9]/.test(digits) ? `${MINUS}${body}` : body;
}
