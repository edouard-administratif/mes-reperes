import { meals } from './catalog.js';

// A meal is considered completed once food has been recorded for it.
// Use chronological meal order, not insertion order (which can be backdated).
export function nextMeal(entries, day) {
  const names = meals.map(([, name]) => name);
  const latest = entries.filter(entry => entry.type === 'food' && entry.date === day)
    .reduce((index, entry) => Math.max(index, names.indexOf(entry.meal)), -1);
  return names[(latest + 1) % names.length];
}
