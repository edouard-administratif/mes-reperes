import test from 'node:test';
import assert from 'node:assert/strict';
import { stepNumber } from '../src/js/number-control.js';

test('maximum : incrémenter par portion, conserver les décimales et respecter les bornes', () => {
  assert.equal(stepNumber('2.5', 1), 3.5);
  assert.equal(stepNumber('0', -1), 0);
  assert.equal(stepNumber('-3', -1), 0);
  assert.equal(stepNumber('', 1), 1);
  assert.equal(stepNumber('10000', 1), 10000);
});
