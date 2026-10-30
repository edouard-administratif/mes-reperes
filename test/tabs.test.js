import test from 'node:test';
import assert from 'node:assert/strict';
import { createTabs } from '../src/js/tabs.js';

test('onglets : un seul panneau visible, sélection clavier et focus', context => {
  const previous = globalThis.document;
  context.after(() => { globalThis.document = previous; });
  const nodes = new Map();
  globalThis.document = { getElementById(id) {
    if (!nodes.has(id)) nodes.set(id, { id, setAttribute(name, value) { this[name] = value; }, focus() { this.focused = true; } });
    return nodes.get(id);
  } };
  const changes = [];
  const tabs = createTabs('test', ['a', 'b', 'c'], { onChange: key => changes.push(key) });
  assert.equal(nodes.get('test-panel-a').hidden, false);
  assert.equal(nodes.get('test-panel-b').hidden, true);
  assert.equal(nodes.get('test-tab-a').tabIndex, 0);
  nodes.get('test-tab-a').onkeydown({ key: 'ArrowLeft', preventDefault() {} });
  assert.equal(tabs.active(), 'c');
  assert.equal(nodes.get('test-tab-c').focused, true);
  assert.equal(nodes.get('test-tab-a')['aria-selected'], 'false');
  nodes.get('test-tab-c').onkeydown({ key: 'Home', preventDefault() {} });
  assert.equal(tabs.active(), 'a');
  nodes.get('test-tab-b').onclick();
  assert.equal(tabs.active(), 'b');
  assert.deepEqual(changes, ['a', 'c', 'a', 'b']);
});
