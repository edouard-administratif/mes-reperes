import { animalCategories, cats, foodGroups, meals, preparations } from './catalog.js';
import { labelDate, shiftDate, today, weekRange, weekdayLabel } from './dates.js';
import { foodEntries, removeEntries, categoryCount, produceCount, formatPortions } from './nutrition.js';
import { chocolateBalance } from './chocolate.js';
import { readNotebook, importInfo } from './notebook.js';
import { installDaySwipe } from './day-swipe.js';

const $ = id => document.getElementById(id);

function element(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function icon(name) {
  const node = element('i', name);
  node.setAttribute('aria-hidden', 'true');
  return node;
}

function button(label, onClick, iconName, primary = false) {
  const node = element('button', `fr-btn fr-btn--sm${primary ? '' : ' fr-btn--secondary'}`);
  node.type = 'button';
  node.setAttribute('aria-label', label);
  node.title = label;
  if (iconName) node.append(icon(iconName));
  else node.textContent = label;
  node.onclick = onClick;
  return node;
}

function downloadNotebook(notebook) {
  const url = URL.createObjectURL(new Blob([JSON.stringify(notebook, null, 2)], { type: 'application/json' }));
  const link = element('a');
  link.href = url;
  link.download = `mes-reperes-${today()}.json`;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function mountUI(store, { exportNotebook = downloadNotebook, native = false } = {}) {
  let notebook = store.snapshot();
  let selectedMeal = 'Déjeuner';
  const selectedPreparations = {};
  let expandedGroup = null;
  let expandedSettingsGroup = null;
  let lastDeleted = [];
  $('day').value = today();

  function status(message, error = false) {
    $('storageStatus').textContent = message;
    $('storageStatus').className = `storage-status${error ? ' storage-error' : ''}`;
  }

  async function change(update, message = 'Carnet enregistré.') {
    $('app').inert = true;
    status('Enregistrement…');
    try {
      const value = await store.update(update);
      notebook = store.snapshot();
      render();
      status(message);
      return { ok: true, value };
    } catch (error) {
      status(`Modification non enregistrée : ${error.message}`, true);
      return { ok: false };
    } finally {
      $('app').inert = false;
    }
  }

  function preparationFor(categoryId) {
    const group = foodGroups.find(group => group[3].includes(categoryId));
    return group && group[0] !== 'dairy' ? selectedPreparations[group[0]] ?? 'Nature' : 'Nature';
  }

  function preparationPicker(groupId, label) {
    const picker = element('div', 'prep-picker');
    picker.setAttribute('role', 'group');
    picker.setAttribute('aria-label', `Préparation : ${label}`);
    for (const [iconName, name] of preparations) {
      const choice = button(`${name} · ${label}`, () => {
        selectedPreparations[groupId] = name;
        for (const node of picker.children) node.setAttribute('aria-pressed', String(node === choice));
      }, iconName);
      choice.setAttribute('aria-pressed', String(name === (selectedPreparations[groupId] ?? 'Nature')));
      picker.append(choice);
    }
    return picker;
  }

  async function remove(entry) {
    const result = await change(draft => removeEntries(draft, entry.id));
    if (result.ok) {
      lastDeleted = result.value;
      renderUndo();
    }
  }

  function renderUndo() {
    $('undoDelete').hidden = !lastDeleted.length;
  }

  function renderList(id, entries) {
    const container = $(id);
    container.replaceChildren();
    if (!entries.length) {
      container.append(element('p', 'empty', id === 'journal' ? 'Aucun repas enregistré pour cette journée.' : 'Rien de noté pour le moment.'));
    }
    for (const entry of entries) {
      const row = element('div', 'entry');
      const description = entry.type === 'food' ?
        `${entry.meal} · ${entry.text} · ${formatPortions(entry.portions)} portion(s)${entry.preparation !== 'Nature' ? ` · ${entry.preparation}` : ''}` : entry.text;
      row.append(element('span', '', description), button(`Supprimer ${entry.text}`, () => remove(entry), 'ri-close-line'));
      container.append(row);
    }
  }

  function categoryRow(category, day) {
    const [id, iconName, name, base, kind, period, unit] = category;
    const target = base === null ? null : notebook.targets[id] ?? base;
    const count = categoryCount(notebook, category, day);
    const row = element('div', 'category');
    const content = element('div');
    const title = element('div', 'name');
    title.append(icon(iconName), document.createTextNode(`Masquer : ${name}`));
    const label = kind === 'max' ? 'maximum' : kind === 'min' ? 'minimum' : 'objectif';
    let text = target === null ? `${formatPortions(count)} ${unit} · suivi sans plafond` :
      `${formatPortions(count)} / ${formatPortions(target)} ${unit} · ${label}`;
    text += period === 'day' ? ' / jour' : ' / semaine';
    if (Object.hasOwn(notebook.targets, id)) text += ' · personnalisé';
    if (target !== null && count >= target) text += kind === 'max' && count > target ? ' · dépassé' : ' · atteint';
    content.append(title, element('div', `detail${kind === 'max' && count > target ? ' over' : ''}`, text));
    if (target !== null) {
      const bar = element('div', 'bar');
      const fill = element('div', 'fill');
      fill.style.width = `${target === 0 ? (count ? 100 : 0) : Math.min(100, count / target * 100)}%`;
      if (kind === 'max' && count > target) fill.style.background = '#c88e65';
      bar.append(fill);
      content.append(bar);
    }
    const actions = element('div', 'category-actions');
    if (id === 'animalTotal') {
      actions.append(element('span', 'pill', 'Total automatique'));
    } else {
      const add = button(`Ajouter : ${name}`, () => {
        const entries = foodEntries(category, { day, meal: selectedMeal, preparation: preparationFor(id) });
        return change(draft => { draft.entries.push(...entries); });
      }, 'ri-add-line');
      const matching = notebook.entries.filter(entry => entry.type === 'food' && entry.cat === id && entry.date === day && entry.meal === selectedMeal);
      const subtract = button(`Retirer : ${name} du repas ${selectedMeal}`, () => remove(matching.at(-1)), 'ri-subtract-line');
      subtract.disabled = !matching.length;
      actions.append(add, subtract);
    }
    row.append(content, actions);
    return row;
  }

  function openFamily(id, settings) {
    if (settings) {
      expandedSettingsGroup = id;
      $('categoryManagement').open = true;
      renderSettings();
    } else {
      expandedGroup = id;
      renderCategories($('day').value);
    }
    const toggle = $(`${settings ? 'settings-' : ''}group-toggle-${id}`);
    toggle?.scrollIntoView?.({ block: 'center', behavior: 'smooth' });
    toggle?.focus?.({ preventScroll: true });
  }

  function familySection([id, label, iconName], settings) {
    const prefix = settings ? 'settings-' : '';
    const expanded = settings ? expandedSettingsGroup : expandedGroup;
    const section = element('section', 'food-group');
    const heading = element('h3');
    const toggle = element('button', 'food-group-toggle');
    toggle.type = 'button';
    toggle.id = `${prefix}group-toggle-${id}`;
    toggle.setAttribute('aria-expanded', String(expanded === id));
    toggle.setAttribute('aria-controls', `${prefix}group-panel-${id}`);
    toggle.append(icon(iconName), element('span', '', label));
    const panel = element('div', 'food-group-panel');
    panel.id = `${prefix}group-panel-${id}`;
    panel.hidden = expanded !== id;
    panel.setAttribute('role', 'region');
    panel.setAttribute('aria-labelledby', toggle.id);
    toggle.onclick = () => {
      if (settings) { expandedSettingsGroup = expanded === id ? null : id; renderSettings(); }
      else { expandedGroup = expanded === id ? null : id; renderCategories($('day').value); }
      $(`${prefix}group-toggle-${id}`)?.focus?.({ preventScroll: true });
    };
    heading.append(toggle);
    const link = button(settings ? `Saisir · ${label}` : `Gérer · ${label}`, () => openFamily(id, !settings));
    link.className += ' family-link';
    section.setAttribute('aria-labelledby', toggle.id);
    section.append(heading, link, panel);
    return { section, panel };
  }

  function renderCategories(day) {
    $('categories').replaceChildren();
    for (const group of foodGroups) {
      const [id, label, , ids] = group;
      const categories = ids.map(id => cats.find(category => category[0] === id))
        .filter(category => !notebook.hidden.includes(category[0]) && notebook.entries.some(entry =>
          entry.type === 'food' && (entry.cat === category[0] || category[0] === 'animalTotal' && animalCategories.includes(entry.cat))));
      const { section, panel } = familySection(group, false);
      if (categories.length) {
        if (!['dairy', 'drinks'].includes(id)) panel.append(preparationPicker(id, label));
        for (const category of categories) panel.append(categoryRow(category, day));
      } else panel.append(element('p', 'detail', 'Aucune catégorie déjà consommée et visible. Utilise « Gérer » pour noter une première portion.'));
      $('categories').append(section);
    }
  }

  function renderSettings() {
    $('settings').replaceChildren();
    $('categorySettings').replaceChildren();
    for (const group of foodGroups) {
      const { section, panel } = familySection(group, true);
      for (const categoryId of group[3]) {
        const [id, iconName, name, base, kind, period, unit] = cats.find(category => category[0] === categoryId);
        const row = element('div', 'category-setting');
        const label = element('label', 'category-choice');
        const input = element('input');
        input.type = 'checkbox';
        input.checked = notebook.hidden.includes(id);
        input.setAttribute('aria-label', `Masquer : ${name}`);
        input.onchange = () => change(draft => {
          draft.hidden = input.checked ? [...new Set([...draft.hidden, id])] : draft.hidden.filter(value => value !== id);
        });
        label.append(input, icon(iconName), document.createTextNode(`Masquer : ${name}`));
        row.append(label);
        if (id !== 'animalTotal') row.append(button(`Noter une portion : ${name}`, () => {
          const entries = foodEntries(cats.find(category => category[0] === id), {
            day: $('day').value, meal: selectedMeal, preparation: preparationFor(id),
          });
          return change(draft => { draft.entries.push(...entries); });
        }, 'ri-add-line'));
        if (base !== null) {
          const targetLabel = element('label', 'setting', `${kind === 'max' ? 'Maximum' : kind === 'min' ? 'Minimum' : 'Objectif'} · ${unit}/${period === 'day' ? 'jour' : 'semaine'}`);
          const target = element('input', 'fr-input');
          Object.assign(target, { type: 'number', min: 0, max: 10000, step: 0.01, value: notebook.targets[id] ?? base });
          target.setAttribute('aria-label', `Repère : ${name}`);
          target.onchange = () => {
            if (!target.validity.valid || target.value === '') { renderSettings(); return; }
            const value = Number(target.value);
            return change(draft => { draft.targets[id] = value; });
          };
          targetLabel.append(target);
          row.append(targetLabel);
        }
        panel.append(row);
      }
      $('categorySettings').append(section);
    }
    $('categorySettings').append(element('p', 'detail', 'La saisie propose les catégories déjà consommées. Coche « Masquer » pour en exclure une sans effacer son historique. Le bouton + note une première portion pour le jour et le repas sélectionnés.'));
  }

  function renderMeasurements(week) {
    $('weight').value = notebook.measurements[week]?.weight ?? '';
    $('fat').value = notebook.measurements[week]?.fat ?? '';
    $('deleteMeasure').disabled = !notebook.measurements[week];
    const history = $('measureHistory');
    history.replaceChildren();
    if (!Object.keys(notebook.measurements).length) return;
    const table = element('table');
    const head = element('tr');
    for (const text of ['Semaine du', 'kg', 'Masse grasse']) head.append(element('th', '', text));
    table.append(head);
    for (const [day, measure] of Object.entries(notebook.measurements).sort((a, b) => b[0].localeCompare(a[0]))) {
      const row = element('tr');
      for (const text of [`${labelDate(day)} ${day.slice(0, 4)}`, measure.weight ?? '—', measure.fat === null ? '—' : `${measure.fat} %`]) row.append(element('td', '', text));
      table.append(row);
    }
    history.append(table);
  }

  function render() {
    const day = $('day').value;
    const [start, end] = weekRange(day);
    $('dayLabel').textContent = weekdayLabel(day);
    $('week').textContent = `${labelDate(start)} – ${labelDate(end)}`;
    $('produceSummary').textContent = `Fruits + légumes aujourd’hui : ${formatPortions(produceCount(notebook, day))} / 5 portions minimum`;
    renderCategories(day);
    const daily = notebook.entries.filter(entry => entry.date === day);
    renderList('journal', daily.filter(entry => entry.type === 'food'));
    renderList('efforts', daily.filter(entry => entry.type === 'physical'));
    renderList('treats', daily.filter(entry => entry.type === 'chocolate'));
    const balance = chocolateBalance(notebook.entries, day);
    $('balance').textContent = `${balance.total} carré(s) disponible(s)`;
    $('creditDetail').textContent = `${balance.carried} d’hier (expirent ce soir) · ${balance.fresh} du jour.${balance.shortfall ? ` ${balance.shortfall} carré(s) consommé(s) au-delà du solde après modification.` : ''}`;
    $('chocolate').disabled = balance.total < 1;
    renderMeasurements(start);
    renderSettings();
    renderUndo();
  }

  for (const [iconName, name] of meals) {
    const choice = button(name, () => {
      selectedMeal = name;
      for (const node of $('meals').children) node.setAttribute('aria-pressed', String(node === choice));
      render();
    }, iconName);
    choice.setAttribute('aria-pressed', String(name === selectedMeal));
    $('meals').append(choice);
  }

  $('day').onchange = () => { if ($('day').validity.valid && $('day').value) render(); };
  function navigateDay(offset) {
    $('day').value = shiftDate($('day').value, offset);
    render();
  }
  for (const [id, offset] of [['prev', -1], ['next', 1]]) $(id).onclick = () => navigateDay(offset);
  if (native) {
    $('app').classList.add('day-swipe');
    installDaySwipe($('app'), navigateDay);
  }
  $('today').onclick = () => { $('day').value = today(); render(); };
  $('export').onclick = async () => {
    $('app').inert = true;
    status('Préparation de l’export…');
    try {
      await exportNotebook(store.snapshot());
      status(native ? 'Carnet proposé au partage Android.' : 'Carnet exporté.');
    } catch (error) { status(`Export impossible : ${error.message}`, true); }
    finally { $('app').inert = false; }
  };
  $('undoDelete').onclick = async () => {
    const result = await change(draft => { draft.entries.push(...lastDeleted); });
    if (result.ok) { lastDeleted = []; renderUndo(); }
  };

  for (const choice of document.querySelectorAll('[data-effort]')) choice.onclick = () => {
    const entry = { id: crypto.randomUUID(), date: $('day').value, type: 'physical', level: choice.dataset.effort, text: `Effort physique ${choice.dataset.effort}` };
    return change(draft => { draft.entries.push(entry); });
  };
  $('chocolate').onclick = () => {
    const day = $('day').value;
    return change(draft => {
      if (chocolateBalance(draft.entries, day).total < 1) return;
      draft.entries.push({ id: crypto.randomUUID(), date: day, type: 'chocolate', text: 'Un carré de chocolat' });
    });
  };
  $('measureForm').onsubmit = async event => {
    event.preventDefault();
    if (!$('measureForm').reportValidity()) return;
    const weight = $('weight').value === '' ? null : Number($('weight').value);
    const fat = $('fat').value === '' ? null : Number($('fat').value);
    if (weight === null && fat === null) { $('measureStatus').textContent = 'Renseigne au moins une mesure.'; return; }
    const week = weekRange($('day').value)[0];
    const result = await change(draft => { draft.measurements[week] = { weight, fat }; });
    $('measureStatus').textContent = result.ok ? 'Mesures enregistrées.' : 'Mesures non enregistrées.';
  };
  $('deleteMeasure').onclick = () => {
    const week = weekRange($('day').value)[0];
    return change(draft => { delete draft.measurements[week]; }, 'Mesures supprimées.');
  };

  $('importButton').onclick = () => $('importFile').click();
  $('importFile').onchange = async event => {
    const file = event.target.files[0];
    if (!file) return;
    try {
      const result = readNotebook(JSON.parse(await file.text()));
      if (!confirm('Remplacer le carnet actuel par ce fichier ?')) return;
      const saved = await change(draft => { Object.assign(draft, result.notebook); }, 'Carnet importé.');
      if (saved.ok) {
        lastDeleted = [];
        renderUndo();
        $('importStatus').textContent = `Carnet importé.${importInfo(result)}`;
      } else $('importStatus').textContent = 'Import non enregistré. Le carnet actuel est conservé.';
    } catch (error) { $('importStatus').textContent = `Import impossible : ${error.message}`; }
    finally { event.target.value = ''; }
  };

  for (const node of document.querySelectorAll('button')) {
    if (!node.classList.contains('fr-btn')) node.className += ` fr-btn fr-btn--sm${node.classList.contains('primary') ? '' : ' fr-btn--secondary'}`;
  }
  for (const node of document.querySelectorAll('input:not([type="file"])')) node.classList.add('fr-input');
  render();
  $('app').inert = false;
  $('storageHelp').textContent = native ? 'Carnet SQLite enregistré dans l’espace privé de l’application Android. Pense à l’exporter pour en garder une copie.' : 'Carnet SQLite conservé dans ce navigateur. Pense à l’exporter pour en garder une copie.';
  status('Carnet prêt. Données enregistrées localement.');
}
