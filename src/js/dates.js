export function localDate(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export const today = () => localDate(new Date());

export function isDate(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T12:00:00`);
  return !Number.isNaN(date.getTime()) && localDate(date) === value;
}

export function shiftDate(day, days) {
  const date = new Date(`${day}T12:00:00`);
  date.setDate(date.getDate() + days);
  return localDate(date);
}

export function weekRange(day) {
  const date = new Date(`${day}T12:00:00`);
  const start = shiftDate(day, -((date.getDay() + 6) % 7));
  return [start, shiftDate(start, 6)];
}

export function labelDate(day) {
  return new Date(`${day}T12:00:00`).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
}
