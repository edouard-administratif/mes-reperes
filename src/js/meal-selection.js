import { meals } from './catalog.js';
import { isDate, shiftDate, today } from './dates.js';

// Suggest a day/meal pair from the latest recorded meal, including after a cold start.
// Backdated insertions do not move the selection behind a later recorded meal.
export function nextMealSelection(entries, fallbackDay = today()) {
  const names = meals.map(([, name]) => name);
  let latest = null;
  for (const entry of entries) {
    const index = names.indexOf(entry.meal);
    if (entry.type !== 'food' || !isDate(entry.date) || index < 0) continue;
    if (!latest || entry.date > latest.day || entry.date === latest.day && index > latest.index) {
      latest = { day: entry.date, index };
    }
  }
  if (!latest) return { day: fallbackDay, meal: names[0] };
  const next = latest.index + 1;
  return { day: next === names.length ? shiftDate(latest.day, 1) : latest.day, meal: names[next % names.length] };
}
