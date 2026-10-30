import test from 'node:test';
import assert from 'node:assert/strict';
import { emptyNotebook } from '../src/js/notebook.js';
import { weeklyStatus } from '../src/js/nutrition.js';
import { food } from './helpers.js';

test('bilan hebdomadaire : restes, dépassements, zéros et catégories masquées', () => {
  const notebook = { ...emptyNotebook(), hidden: ['meat'], targets: { meat: 1, charcuterie: 0 }, entries: [
    food('1', 'meat', { portions: 2 }), food('2', 'charcuterie'), food('3', 'meat', { date: '2026-10-26', portions: 8 }),
  ] };
  const rows = weeklyStatus(notebook, '2026-10-25');
  assert.equal(rows.find(row => row.id === 'meat').exceeded, 1);
  assert.equal(rows.find(row => row.id === 'animalTotal').remaining, 4);
  assert.equal(rows.find(row => row.id === 'charcuterie').exceeded, 1);
  assert(!rows.some(row => row.id === 'fruit'));
  notebook.entries = [];
  assert(!weeklyStatus(notebook, '2026-10-25').some(row => row.id === 'charcuterie'));
});

test('plafond journalier : ne pas compenser un dépassement par les jours sans consommation', () => {
  const notebook = { ...emptyNotebook(), targets: { fruit: 2 }, entries: [food('1', 'fruit', { portions: 3 })] };
  const row = weeklyStatus(notebook, '2026-10-25').find(row => row.id === 'fruit');
  assert.equal(row.count, 3);
  assert.equal(row.exceeded, 1);
  assert.equal(row.remaining, null);
  assert.equal(row.days.length, 7);
  assert.equal(row.days.at(-1).exceeded, 1);
  assert.equal(row.days[0].remaining, 2);
});
