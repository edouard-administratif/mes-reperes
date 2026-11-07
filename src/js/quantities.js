const frenchPluralRules = new Intl.PluralRules('fr');

// Product rule: zero is plural, except when the quantity is capped at one or less.
export function pluralize(quantity, singular, { plural = `${singular}s`, maximum = null } = {}) {
  const one = quantity === 0 ? maximum !== null && maximum <= 1 : frenchPluralRules.select(quantity) === 'one';
  return one ? singular : plural;
}
