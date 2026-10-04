export const MONTH_ABBREV = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
] as const;

export function monthAbbrevYear(iso: string): string {
  const [year, month] = iso.split('-');
  return `${MONTH_ABBREV[Number(month) - 1]} ${year}`;
}

export function monthAbbrev(iso: string): string {
  const [, month] = iso.split('-');
  return MONTH_ABBREV[Number(month) - 1];
}
