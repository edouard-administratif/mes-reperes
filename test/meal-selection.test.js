import test from 'node:test';
import assert from 'node:assert/strict';
import { nextMealSelection } from '../src/js/meal-selection.js';
import { food } from './helpers.js';

test('sélection après arrêt : retrouver jour et repas sans imposer aujourd’hui', () => {
  const now = '2026-11-07';
  assert.deepEqual(nextMealSelection([], now), { day: now, meal: 'Petit-déjeuner' });
  assert.deepEqual(nextMealSelection([food('1')], now), { day: '2026-10-25', meal: 'Collation' });
  assert.deepEqual(nextMealSelection([food('1', 'fruit', { meal: 'Collation' })], now), { day: '2026-10-25', meal: 'Dîner' });
  assert.deepEqual(nextMealSelection([food('1', 'fruit', { meal: 'Dîner' })], now), { day: '2026-10-26', meal: 'Petit-déjeuner' });
});

test('sélection : tenir compte du dîner déjà saisi malgré un petit-déjeuner ajouté après', () => {
  const entries = [food('dinner', 'fish', { meal: 'Dîner' }), food('lunch'), food('breakfast', 'fruit', { meal: 'Petit-déjeuner' })];
  assert.deepEqual(nextMealSelection(entries, '2026-11-07'), { day: '2026-10-26', meal: 'Petit-déjeuner' });
  const reopened = JSON.parse(JSON.stringify(entries));
  assert.deepEqual(nextMealSelection(reopened, '2026-12-01'), nextMealSelection(entries));
});

test('sélection : ignorer les repas inconnus et les efforts, franchir mois et année', () => {
  const entries = [food('1', 'meat', { date: '2026-12-31', meal: 'Dîner' }),
    food('2', 'fruit', { date: '2027-01-20', meal: 'Inconnu' }), { type: 'physical', date: '2027-02-01', meal: 'Dîner' }];
  assert.deepEqual(nextMealSelection(entries), { day: '2027-01-01', meal: 'Petit-déjeuner' });
});
