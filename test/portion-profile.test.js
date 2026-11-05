import test from 'node:test';
import assert from 'node:assert/strict';
import { emptyNotebook } from '../src/js/notebook.js';
import { portionProfiles, weeklyPortionProfile } from '../src/js/portion-profile.js';
import { food } from './helpers.js';

test('profil hebdomadaire : portions par catégories, sans compter les agrégats ni les autres dates', () => {
  const notebook = { ...emptyNotebook(), entries: [food('1', 'fruit', { portions: 2 }), food('2', 'pulses'),
    food('3', 'nuts', { portions: 0.5 }), food('4', 'oilyfish'), food('5', 'dessert', { date: '2026-10-26' }),
    food('6', 'starter'), food('7', 'alcohol'), { type: 'chocolate', date: '2026-10-25', text: 'Carré' }] };
  assert.deepEqual(weeklyPortionProfile(notebook, '2026-10-25').map(row => row.portions), [3, 2, 2, 1.5, 3.5]);
});

test('profil : cinq compteurs, sucres inclus dans glucides et aucun effet du qualificatif frit', () => {
  const sugars = portionProfiles.find(([id]) => id === 'sugars')[2];
  const carbohydrates = portionProfiles.find(([id]) => id === 'carbohydrates')[2];
  assert(sugars.every(id => carbohydrates.includes(id)));
  assert.equal(portionProfiles.length, 5);
  const notebook = { ...emptyNotebook(), entries: [food('1', 'poultry', { preparation: 'Frit' })] };
  assert.deepEqual(weeklyPortionProfile(notebook, '2026-10-25').map(row => row.portions), [0, 0, 1, 0, 0]);
});
