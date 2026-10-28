// Touch-only day navigation; leave controls, scrolling and zoom gestures alone.
export function installDaySwipe(root, navigate) {
  let start = null;
  const reset = () => { start = null; };
  const blocked = target => target?.closest('input, textarea, select, button, a, summary, [contenteditable], [role="slider"], [data-no-swipe]');

  function begin(event) {
    start = null;
    if (root.inert || event.touches.length !== 1 || blocked(event.target)) return;
    const touch = event.touches[0];
    start = { id: touch.identifier, x: touch.clientX, y: touch.clientY };
  }

  function move(event) {
    if (!start) return;
    if (root.inert || event.touches.length !== 1) { reset(); return; }
    const touch = event.touches[0];
    const dx = Math.abs(touch.clientX - start.x);
    const dy = Math.abs(touch.clientY - start.y);
    if (dy > 24 && dy > dx) reset();
  }

  function end(event) {
    const origin = start;
    reset();
    if (!origin || root.inert || event.touches.length) return;
    const touch = [...event.changedTouches].find(touch => touch.identifier === origin.id);
    if (!touch) return;
    const dx = touch.clientX - origin.x;
    const dy = touch.clientY - origin.y;
    if (Math.abs(dx) >= 64 && Math.abs(dx) > Math.abs(dy) * 1.5) navigate(dx < 0 ? 1 : -1);
  }

  const listeners = { touchstart: begin, touchmove: move, touchend: end, touchcancel: reset };
  for (const [name, handler] of Object.entries(listeners)) root.addEventListener(name, handler, { passive: true });
  return () => {
    for (const [name, handler] of Object.entries(listeners)) root.removeEventListener(name, handler);
  };
}
