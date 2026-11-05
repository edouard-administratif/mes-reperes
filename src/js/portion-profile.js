import { weekRange } from './dates.js';

// Qualitative category membership, not an estimate of nutrient quantities.
// Groups overlap; sugar categories are a subset of carbohydrate categories.
export const portionProfiles = [
  ['carbohydrates', 'Glucides', ['appetizer', 'wholegrain', 'starch', 'pulses', 'fruit', 'dessert']],
  ['sugars', 'dont sucres', ['fruit', 'dessert']],
  ['proteins', 'Protides', ['meat', 'poultry', 'charcuterie', 'fish', 'oilyfish', 'eggs', 'pulses', 'unsweetenedDairy', 'cheese']],
  ['fats', 'Lipides', ['charcuterie', 'oilyfish', 'nuts', 'cheese', 'fried', 'richsauce']],
  ['fiber', 'Fibres', ['salad', 'fruit', 'wholegrain', 'pulses', 'nuts']],
];

export function weeklyPortionProfile(notebook, day) {
  const [start, end] = weekRange(day);
  const food = notebook.entries.filter(entry => entry.type === 'food' && entry.date >= start && entry.date <= end);
  return portionProfiles.map(([id, name, categories]) => ({ id, name,
    portions: food.filter(entry => categories.includes(entry.cat)).reduce((sum, entry) => sum + entry.portions, 0),
  }));
}
