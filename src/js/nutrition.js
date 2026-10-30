import { animalCategories, cats } from './catalog.js';
import { shiftDate, weekRange } from './dates.js';

export function categoryCount(notebook, category, day) {
  const [id, , , , period] = category;
  const [start, end] = weekRange(day);
  return notebook.entries.filter(entry => {
    const matches = entry.cat === id || (id === 'fish' && entry.cat === 'oilyfish') ||
      (id === 'animalTotal' && animalCategories.includes(entry.cat));
    return entry.type === 'food' && matches &&
      (period === 'day' ? entry.date === day : entry.date >= start && entry.date <= end);
  }).reduce((sum, entry) => sum + entry.portions, 0);
}

export function produceCount(notebook, day) {
  return notebook.entries.filter(entry => entry.type === 'food' && entry.date === day &&
    ['salad', 'fruit'].includes(entry.cat)).reduce((sum, entry) => sum + entry.portions, 0);
}

export function foodEntries(category, { day, meal, preparation, id = () => crypto.randomUUID() }) {
  if (category[0] === 'animalTotal') throw new Error('Le total est calculé automatiquement.');
  const entry = {
    id: id(), date: day, type: 'food', cat: category[0], text: category[2],
    meal, preparation, portions: 1,
  };
  return [entry];
}

export function removeEntries(notebook, id) {
  const removed = notebook.entries.filter(entry => entry.id === id);
  const ids = new Set(removed.map(entry => entry.id));
  notebook.entries = notebook.entries.filter(entry => !ids.has(entry.id));
  return removed;
}

export const formatPortions = number => Number(number.toFixed(2)).toLocaleString('fr-FR');

// An explicit null means unlimited; an absent override uses the catalog default.
export const categoryLimit = (notebook, category) => Object.hasOwn(notebook.targets, category[0]) ? notebook.targets[category[0]] : category[3];


export function weeklyStatus(notebook, day) {
  const [start] = weekRange(day);
  return cats.flatMap(category => {
    const [id, , name, , period, unit] = category;
    const limit = categoryLimit(notebook, category);
    if (limit === null) return [];
    const days = period === 'day' ? Array.from({ length: 7 }, (_, index) => {
      const date = shiftDate(start, index);
      const count = categoryCount(notebook, category, date);
      return { date, count, remaining: Math.max(0, limit - count), exceeded: Math.max(0, count - limit) };
    }) : [];
    const count = days.length ? days.reduce((sum, item) => sum + item.count, 0) : categoryCount(notebook, category, day);
    if (limit === 0 && count === 0) return [];
    return [{ id, name, period, unit, limit, count, days,
      remaining: days.length ? null : Math.max(0, limit - count),
      exceeded: days.length ? days.reduce((sum, item) => sum + item.exceeded, 0) : Math.max(0, count - limit),
    }];
  });
}
