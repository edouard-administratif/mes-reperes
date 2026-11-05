import test from 'node:test';
import assert from 'node:assert/strict';
import { nextMeal } from '../src/js/meal-selection.js';
import { food } from './helpers.js';

test('repas proposé : suivre le dernier repas chronologique du jour', () => {
  const day = '2026-10-25';
  assert.equal(nextMeal([], day), 'Petit-déjeuner');
  assert.equal(nextMeal([food('1', 'fruit', { meal: 'Petit-déjeuner' })], day), 'Déjeuner');
  assert.equal(nextMeal([food('1')], day), 'Collation');
  assert.equal(nextMeal([food('1', 'fruit', { meal: 'Collation' })], day), 'Dîner');
  assert.equal(nextMeal([food('1', 'fruit', { meal: 'Dîner' })], day), 'Petit-déjeuner');
  assert.equal(nextMeal([food('1'), food('2', 'fruit', { meal: 'Petit-déjeuner' })], day), 'Collation');
});

test('repas proposé : ignorer les autres dates et les repas inconnus', () => {
  assert.equal(nextMeal([food('1'), food('2', 'fruit', { meal: 'Inconnu', date: '2026-10-26' })], '2026-10-26'), 'Petit-déjeuner');
  assert.equal(nextMeal([{ type: 'physical', date: '2026-10-25', meal: 'Dîner' }], '2026-10-25'), 'Petit-déjeuner');
});
