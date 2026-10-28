import test from 'node:test';
import assert from 'node:assert/strict';
import { installDaySwipe } from '../src/js/day-swipe.js';

function fixture() {
  const listeners = new Map();
  const navigations = [];
  const root = {
    inert: false,
    addEventListener: (name, handler) => listeners.set(name, handler),
    removeEventListener: name => listeners.delete(name),
  };
  const dispose = installDaySwipe(root, offset => navigations.push(offset));
  const touch = (x, y, identifier = 1) => ({ clientX: x, clientY: y, identifier });
  const send = (type, touches, changedTouches = [], blocked = false) => listeners.get(type)?.({
    touches, changedTouches, target: { closest: () => blocked },
  });
  const swipe = (x, y, endX, endY, blocked = false) => {
    send('touchstart', [touch(x, y)], [], blocked);
    send('touchmove', [touch(endX, endY)]);
    send('touchend', [], [touch(endX, endY)]);
  };
  return { root, navigations, touch, send, swipe, dispose, listeners };
}

test('swipe gauche vers le lendemain, droite vers la veille, un seul changement par geste', () => {
  const f = fixture();
  f.swipe(200, 100, 90, 110);
  f.swipe(90, 100, 200, 110);
  f.send('touchend', [], [f.touch(400, 100)]);
  assert.deepEqual(f.navigations, [1, -1]);
});

test('défilement vertical, petits mouvements, diagonales et gestes sur les contrôles ignorés', () => {
  const f = fixture();
  f.swipe(100, 100, 110, 240);
  f.swipe(100, 100, 140, 100);
  f.swipe(100, 100, 180, 180);
  f.swipe(100, 100, 240, 100, true);
  assert.deepEqual(f.navigations, []);
});

test('multi-touch, annulation et interface occupée ne changent pas la journée', () => {
  const f = fixture();
  f.send('touchstart', [f.touch(200, 100)]);
  f.send('touchmove', [f.touch(150, 100), f.touch(160, 100, 2)]);
  f.send('touchend', [], [f.touch(80, 100)]);
  f.send('touchstart', [f.touch(200, 100)]);
  f.send('touchcancel', []);
  f.send('touchend', [], [f.touch(80, 100)]);
  f.root.inert = true;
  f.swipe(200, 100, 80, 100);
  f.root.inert = false;
  f.send('touchstart', [f.touch(200, 100)]);
  f.root.inert = true;
  f.send('touchend', [], [f.touch(80, 100)]);
  assert.deepEqual(f.navigations, []);
  f.dispose();
  assert.equal(f.listeners.size, 0);
});
