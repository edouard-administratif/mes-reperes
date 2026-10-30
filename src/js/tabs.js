// Shared ARIA tabs: click, arrow keys, Home/End, and one panel in the tab order.
export function createTabs(prefix, keys, { initial = keys[0], onChange } = {}) {
  let active = initial;
  const tab = key => document.getElementById(`${prefix}-tab-${key}`);
  const panel = key => document.getElementById(`${prefix}-panel-${key}`);
  function select(key, { focus = false } = {}) {
    if (!keys.includes(key)) return;
    active = key;
    for (const name of keys) {
      const selected = key === name;
      tab(name).setAttribute('role', 'tab');
      tab(name).setAttribute('aria-selected', String(selected));
      tab(name).setAttribute('aria-controls', panel(name).id || `${prefix}-panel-${name}`);
      tab(name).tabIndex = selected ? 0 : -1;
      panel(name).setAttribute('role', 'tabpanel');
      panel(name).setAttribute('aria-labelledby', `${prefix}-tab-${name}`);
      panel(name).hidden = !selected;
      panel(name).tabIndex = 0;
    }
    if (focus) tab(key).focus?.();
    onChange?.(key);
  }
  keys.forEach((key, index) => {
    tab(key).onclick = () => select(key);
    tab(key).onkeydown = event => {
      const next = event.key === 'Home' ? 0 : event.key === 'End' ? keys.length - 1 :
        event.key === 'ArrowRight' ? (index + 1) % keys.length :
        event.key === 'ArrowLeft' ? (index - 1 + keys.length) % keys.length : null;
      if (next === null) return;
      event.preventDefault();
      select(keys[next], { focus: true });
    };
  });
  select(initial);
  return { select, active: () => active };
}
