import test from 'node:test';
import assert from 'node:assert/strict';
import { installResumeRefresh } from '../src/js/resume.js';

test('rafraîchissement : retour navigateur visible, pageshow et reprise Android', () => {
  const document = new EventTarget();
  const window = new EventTarget();
  let count = 0;
  const stop = installResumeRefresh(() => count++, { document, window });
  document.hidden = true;
  document.dispatchEvent(new Event('visibilitychange'));
  assert.equal(count, 0);
  document.hidden = false;
  document.dispatchEvent(new Event('visibilitychange'));
  window.dispatchEvent(new Event('pageshow'));
  window.dispatchEvent(new Event('mes-reperes-resume'));
  assert.equal(count, 3);
  stop();
  window.dispatchEvent(new Event('mes-reperes-resume'));
  assert.equal(count, 3);
});
