const digitMap: Record<string, string> = {};
for (let i = 0; i <= 9; i += 1) {
  digitMap[String.fromCharCode(0x0660 + i)] = String(i);
  digitMap[String.fromCharCode(0x06f0 + i)] = String(i);
}

export function parseAmount(text: string): number | null {
  const cleaned = text
    .trim()
    .replace(/[$\s٬]/g, '')
    .replace(/[٠-٩۰-۹]/g, (digit) => digitMap[digit])
    .replace(/[٫,]/g, '.');
  if (cleaned === '') return null;
  const value = Number(cleaned);
  return Number.isFinite(value) ? value : null;
}

export function formatDollars(amount: number): string {
  const rounded = Math.round(amount * 100) / 100;
  const isWhole = Number.isInteger(rounded);
  return `$${rounded.toLocaleString('en-US', {
    minimumFractionDigits: isWhole ? 0 : 2,
    maximumFractionDigits: 2,
  })}`;
}
