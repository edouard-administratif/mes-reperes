import test from 'node:test';
import assert from 'node:assert/strict';
import { pluralize } from '../src/js/quantities.js';

test('quantités : zéro au pluriel, un au singulier et exception du plafond un', () => {
  assert.equal(pluralize(0, 'portion'), 'portions');
  assert.equal(pluralize(1, 'portion'), 'portion');
  assert.equal(pluralize(2, 'portion'), 'portions');
  assert.equal(pluralize(0, 'portion', { maximum: 1 }), 'portion');
  assert.equal(pluralize(0, 'portion', { maximum: 0 }), 'portion');
  assert.equal(pluralize(0, 'portion', { maximum: 2 }), 'portions');
  assert.equal(pluralize(1, 'poignée'), 'poignée');
  assert.equal(pluralize(2, 'poignée'), 'poignées');
});

test('quantités : fractions françaises et accords irréguliers explicites', () => {
  assert.equal(pluralize(0.5, 'portion'), 'portion');
  assert.equal(pluralize(1.5, 'portion'), 'portion');
  assert.equal(pluralize(2.5, 'portion'), 'portions');
  assert.equal(pluralize(0, 'expire', { plural: 'expirent' }), 'expirent');
  assert.equal(pluralize(1, 'expire', { plural: 'expirent' }), 'expire');
});
