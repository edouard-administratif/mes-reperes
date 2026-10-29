import test from 'node:test';
import assert from 'node:assert/strict';
import { cats, foodGroups } from '../src/js/catalog.js';
import { weekRange, shiftDate, isDate, weekdayLabel } from '../src/js/dates.js';
import { readNotebook, emptyNotebook, importInfo, entryIssues } from '../src/js/notebook.js';
import { categoryCount, categoryLimit, foodEntries, removeEntries } from '../src/js/nutrition.js';
import { chocolateBalance } from '../src/js/chocolate.js';
import { food } from './helpers.js';

const category = id => cats.find(category => category[0] === id);

test('semaines lundi–dimanche, changements de mois et dates invalides', () => {
  assert.deepEqual(weekRange('2026-10-25'), ['2026-10-19', '2026-10-25']);
  assert.deepEqual(weekRange('2026-10-26'), ['2026-10-26', '2026-11-01']);
  assert.equal(shiftDate('2026-12-31', 1), '2027-01-01');
  assert.equal(isDate('2026-02-30'), false);
});

test('chaque catégorie apparaît dans une seule famille', () => {
  const grouped = foodGroups.flatMap(group => group[3]);
  assert.equal(new Set(grouped).size, grouped.length);
  assert.deepEqual([...grouped].sort(), cats.map(category => category[0]).sort());
});

test('total animal sans double compte du poisson gras, compteurs indépendants', () => {
  const notebook = emptyNotebook();
  notebook.entries = [food('1'), food('2', 'oilyfish'), food('3', 'charcuterie'), food('4', 'pulses')];
  assert.equal(categoryCount(notebook, category('animalTotal'), '2026-10-25'), 3);
  assert.equal(categoryCount(notebook, category('fish'), '2026-10-25'), 1);
  assert.equal(categoryCount(notebook, category('animalTotal'), '2026-10-26'), 0);
  assert.equal(category('charcuterie')[3], null);
});

test('sauce indépendante du mode de préparation et du retrait de son aliment', () => {
  let id = 0;
  const context = { day: '2026-10-25', meal: 'Dîner', preparation: 'En sauce', id: () => String(++id) };
  const entries = foodEntries(category('poultry'), context);
  assert.equal(entries.length, 1);
  entries.push(...foodEntries(category('richsauce'), context));
  assert.equal(foodEntries(category('richsauce'), context).length, 1);
  const notebook = { ...emptyNotebook(), entries };
  const removed = removeEntries(notebook, entries[0].id);
  assert.equal(notebook.entries.length, 1);
  notebook.entries.push(...removed);
  assert.equal(notebook.entries.length, 2);
});

test('import partiel avec message et sauces indépendantes', () => {
  const source = { entries: [food('ok'), food('old', 'supprimee'), food('sauce', 'richsauce', { linkedTo: 'old' })] };
  const result = readNotebook(source);
  assert.deepEqual(result.notebook.entries, [food('ok'), food('sauce', 'richsauce')]);
  assert.equal(result.ignoredCount, 1);
  assert.match(importInfo(result), /supprimee/);
  assert.throws(() => readNotebook({ entries: [food('a'), food('a')] }), /dupliqués/);
  assert.throws(() => readNotebook({ entries: [food('a', 'meat', { portions: undefined, quantity: 100 })] }), /portions/);
  assert.throws(() => readNotebook({ entries: [food('a', 'meat', { date: '2026-02-30' })] }), /invalide/);
});

test('report du chocolat à J+1 seulement, crédits anciens consommés en premier', () => {
  const effort = (date, level) => ({ type: 'physical', date, level });
  const chocolate = date => ({ type: 'chocolate', date });
  const first = [effort('2026-10-25', 'L')];
  assert.equal(chocolateBalance(first, '2026-10-26').total, 2);
  assert.equal(chocolateBalance(first, '2026-10-27').total, 0);
  const mixed = [effort('2026-10-25', 'M'), effort('2026-10-26', 'M'), chocolate('2026-10-26')];
  assert.equal(chocolateBalance(mixed, '2026-10-26').carried, 0);
  assert.equal(chocolateBalance(mixed, '2026-10-27').total, 1);
  assert.equal(chocolateBalance([effort('2026-10-25', 'S'), effort('2026-10-26', 'S')], '2026-10-26').total, 0);
});


test('libellés français des sept jours, sans décalage aux changements de mois et d’année', () => {
  const names = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];
  for (let i = 0; i < 7; i++) assert.equal(weekdayLabel(shiftDate('2026-10-26', i)), names[i]);
  assert.equal(weekdayLabel('2027-01-01'), 'Vendredi');
});

test('plafonds numériques ou illimités pour toutes les catégories, import sans objectif particulier', () => {
  const source = { ...emptyNotebook(), targets: { fruit: 3, charcuterie: 0, starter: null } };
  const notebook = readNotebook(JSON.parse(JSON.stringify(source))).notebook;
  assert.deepEqual(notebook.targets, source.targets);
  assert.equal(categoryLimit(notebook, category('starter')), null);
  assert.equal(categoryLimit(notebook, category('fruit')), 3);
  assert.equal(categoryLimit(notebook, category('charcuterie')), 0);
  assert.equal(categoryLimit(notebook, category('meat')), 2);
  assert.throws(() => readNotebook({ entries: [], targets: { fruit: -1 } }), /Maximum/);
  const invalid = readNotebook({ entries: [food('old', 'meat', { meal: 'Ancien repas', preparation: 'Vapeur' })] }).notebook.entries[0];
  assert.equal(invalid.preparation, 'Vapeur');
  assert.equal(entryIssues(invalid).length, 2);
  assert.equal(readNotebook({ entries: [food('new', 'meat', { preparation: 'Frit' })] }).notebook.entries[0].preparation, 'Frit');
});
