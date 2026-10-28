import { cats, meals, preparations } from './catalog.js';
import { isDate, weekRange } from './dates.js';

export const emptyNotebook = () => ({ entries: [], measurements: {}, hidden: [], targets: {} });

export function readNotebook(data) {
  if (!data || !Array.isArray(data.entries)) throw new Error('Format de carnet invalide.');
  const known = new Set(cats.filter(category => category[0] !== 'animalTotal').map(category => category[0]));
  const ignoredCategories = new Set();
  let ignoredCount = 0;
  const entries = data.entries.filter(entry => {
    if (entry?.type === 'food' && !known.has(entry.cat)) {
      ignoredCategories.add(String(entry.cat ?? '(sans catégorie)'));
      ignoredCount++;
      return false;
    }
    return true;
  }).map(entry => {
    if (!entry || typeof entry.id !== 'string' || !entry.id || typeof entry.text !== 'string' ||
        !isDate(entry.date) || !['food', 'physical', 'chocolate'].includes(entry.type)) {
      throw new Error('Entrée de carnet invalide.');
    }
    const result = { id: entry.id, date: entry.date, type: entry.type, text: entry.text };
    if (entry.type === 'food') {
      if (!Number.isFinite(entry.portions) || entry.portions <= 0) throw new Error('Les aliments doivent être exprimés en portions.');
      if (!meals.some(meal => meal[1] === entry.meal) || !preparations.some(preparation => preparation[1] === entry.preparation)) {
        throw new Error('Repas ou préparation invalide.');
      }
      Object.assign(result, { cat: entry.cat, portions: entry.portions, meal: entry.meal, preparation: entry.preparation });
      if (entry.linkedTo !== undefined) {
        if (typeof entry.linkedTo !== 'string' || entry.cat !== 'richsauce') throw new Error('Association de sauce invalide.');
        result.linkedTo = entry.linkedTo;
      }
    }
    if (entry.type === 'physical') {
      if (!['S', 'M', 'L'].includes(entry.level)) throw new Error('Effort physique invalide.');
      result.level = entry.level;
    }
    return result;
  });
  const ids = new Set(entries.map(entry => entry.id));
  if (ids.size !== entries.length) throw new Error('Identifiants d’entrées dupliqués.');
  const parents = new Map(entries.filter(entry => entry.type === 'food' && !entry.linkedTo).map(entry => [entry.id, entry]));
  const validEntries = entries.filter(entry => !entry.linkedTo || parents.get(entry.linkedTo)?.date === entry.date);
  const orphanCount = entries.length - validEntries.length;
  const notebook = emptyNotebook();
  notebook.entries = validEntries;
  for (const [id, value] of Object.entries(data.targets ?? {})) {
    if (cats.some(category => category[0] === id && category[3] !== null) && Number.isFinite(value) && value >= 0) {
      notebook.targets[id] = value;
    }
  }
  if (Array.isArray(data.hidden)) notebook.hidden = [...new Set(data.hidden.filter(id => cats.some(category => category[0] === id)))];
  for (const [day, measure] of Object.entries(data.measurements ?? {})) {
    if (!isDate(day) || weekRange(day)[0] !== day || !measure ||
        !(measure.weight === null || Number.isFinite(measure.weight) && measure.weight > 0 && measure.weight <= 500) ||
        !(measure.fat === null || Number.isFinite(measure.fat) && measure.fat > 0 && measure.fat < 100) ||
        measure.weight === null && measure.fat === null) {
      throw new Error('Mesure hebdomadaire invalide.');
    }
    notebook.measurements[day] = { weight: measure.weight, fat: measure.fat };
  }
  return { notebook, ignoredCategories: [...ignoredCategories], ignoredCount, orphanCount };
}

export function importInfo(result) {
  const ignored = result.ignoredCount ? ` ${result.ignoredCount} entrée(s) ignorée(s) : catégorie(s) inconnue(s) « ${result.ignoredCategories.join(', ')} ».` : '';
  const orphans = result.orphanCount ? ` ${result.orphanCount} sauce(s) associée(s) sans aliment ignorée(s).` : '';
  return ignored + orphans;
}
