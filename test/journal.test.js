import test from 'node:test';
import assert from 'node:assert/strict';
import { journalGroups } from '../src/js/journal.js';
import { removeEntries } from '../src/js/nutrition.js';
import { emptyNotebook } from '../src/js/notebook.js';
import { food } from './helpers.js';

test('journal : regrouper les portions identiques et suivre l’ordre des familles de saisie', () => {
  const entries = [food('1', 'fruit'), food('2', 'poultry'), food('3', 'starter'), food('4', 'poultry', { portions: 0.5 }),
    food('5', 'poultry', { meal: 'Dîner' }), food('6', 'poultry', { preparation: 'En sauce' })];
  const groups = journalGroups(entries);
  assert.deepEqual(groups.map(group => group.ids), [['3'], ['2', '4'], ['6'], ['1'], ['5']]);
  assert.equal(groups[1].portions, 1.5);
  assert.equal(entries.length, 6);
  const notebook = { ...emptyNotebook(), entries: structuredClone(entries) };
  const removed = removeEntries(notebook, groups[1].ids);
  assert.deepEqual(removed.map(entry => entry.id), ['2', '4']);
  assert.equal(notebook.entries.length, 4);
  notebook.entries.push(...removed);
  assert.equal(journalGroups(notebook.entries).find(group => group.ids.includes('2')).portions, 1.5);
});

test('journal : ne pas fusionner des jours, préparations ou descriptions différents', () => {
  const entries = [food('1'), food('2', 'meat', { date: '2026-10-26' }),
    food('3', 'meat', { preparation: 'Vapeur' }), food('4', 'meat', { text: 'Autre libellé' })];
  assert.equal(journalGroups(entries).length, 4);
});
