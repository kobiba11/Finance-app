export function isDateWithinDays(dateString?: string | null, days = 14) {
  if (!dateString) return false;

  const today = new Date();
  const target = new Date(dateString);

  today.setHours(0, 0, 0, 0);
  target.setHours(0, 0, 0, 0);

  const limit = new Date(today);
  limit.setDate(limit.getDate() + days);

  return target >= today && target <= limit;
}

export function isPastDate(dateString?: string | null) {
  if (!dateString) return false;

  const today = new Date();
  const target = new Date(dateString);

  today.setHours(0, 0, 0, 0);
  target.setHours(0, 0, 0, 0);

  return target < today;
}