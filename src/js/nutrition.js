import { animalCategories } from './catalog.js';
import { weekRange } from './dates.js';

export function categoryCount(notebook, category, day) {
  const [id, , , , , period] = category;
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
