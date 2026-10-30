export function stepNumber(value, direction, { min = 0, max = 10000 } = {}) {
  const number = value === '' || !Number.isFinite(Number(value)) ? min : Number(value);
  return Number(Math.min(max, Math.max(min, number + direction)).toFixed(2));
}

// Keep a native editable number input, adding touch-friendly decrement/increment actions.
export function numberControl(input, name) {
  const group = document.createElement('div');
  group.className = 'number-control';
  for (const [direction, label, icon] of [[-1, 'Diminuer', 'ri-subtract-line'], [1, 'Augmenter', 'ri-add-line']]) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'fr-btn fr-btn--sm fr-btn--secondary';
    button.setAttribute('aria-label', `${label} le maximum : ${name}`);
    button.title = `${label} le maximum : ${name}`;
    button.disabled = input.disabled;
    const image = document.createElement('i');
    image.className = icon;
    image.setAttribute('aria-hidden', 'true');
    button.append(image);
    button.onclick = () => {
      if (input.disabled) return;
      input.value = stepNumber(input.value, direction, { min: Number(input.min), max: Number(input.max) });
      return input.onchange?.();
    };
    group.append(button);
    if (direction === -1) group.append(input);
  }
  input.oninput = () => { if (input.value !== '' && Number(input.value) < 0) input.value = 0; };
  return group;
}
