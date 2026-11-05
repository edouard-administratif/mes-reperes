import { foodGroups, meals, preparations } from './catalog.js';

const categoryOrder = new Map(foodGroups.flatMap(group => group[3]).map((id, index) => [id, index]));
const mealOrder = new Map(meals.map(([, name], index) => [name, index]));
const preparationOrder = new Map(preparations.map(([, name], index) => [name, index]));

// Group only genuinely identical records, preserving original IDs for delete/undo.
export function journalGroups(entries) {
  const groups = new Map();
  for (const entry of entries) {
    const key = JSON.stringify([entry.date, entry.meal, entry.cat, entry.preparation, entry.text]);
    if (!groups.has(key)) groups.set(key, { ...entry, portions: 0, ids: [] });
    const group = groups.get(key);
    group.portions += entry.portions;
    group.ids.push(entry.id);
  }
  const rank = (map, value) => map.get(value) ?? Number.MAX_SAFE_INTEGER;
  return [...groups.values()].sort((a, b) => a.date.localeCompare(b.date) ||
    rank(mealOrder, a.meal) - rank(mealOrder, b.meal) || a.meal.localeCompare(b.meal) ||
    rank(categoryOrder, a.cat) - rank(categoryOrder, b.cat) ||
    rank(preparationOrder, a.preparation) - rank(preparationOrder, b.preparation));
}
