export const cats = [
  
['starter','ri-bowl-line','Entrée',7,'week','portion(s)'],
  ['appetizer','ri-cake-line','Biscuits apéritifs',null,'week','portion(s)'],
  ['wine','ri-goblet-line','Verre de vin',null,'week','verre(s)'],
  ['beer','ri-beer-line','Verre de bière',null,'week','verre(s)'],
  ['alcohol','ri-cup-line','Verre d’alcool',null,'week','verre(s)'],
  ['animalTotal','ri-restaurant-line','Total viandes / poissons',7,'week','portion(s)'],
  ['meat','ri-restaurant-2-line','Viande hors volaille',2,'week','portion(s)'],
  ['poultry','ri-restaurant-line','Volaille',3,'week','portion(s)'],
  ['charcuterie','ri-knife-line','Charcuterie',null,'week','portion(s)'],
['fish','ri-water-flash-line','Poisson',2,'week','portion(s)'],
  ['oilyfish','ri-water-flash-line','Poisson gras',1,'week','portion(s)'],
  ['eggs','ri-seedling-line','Œufs',null,'week','portion(s)'],
  ['pulses','ri-seedling-line','Légumes secs',2,'week','portion(s)'],
['salad','ri-leaf-line','Légumes / salade',null,'day','portion(s)'],
  ['fruit','ri-plant-line','Fruit',null,'day','portion(s)'],
  ['wholegrain','ri-seedling-line','Féculents complets',null,'day','portion(s)'],
  ['starch','ri-bowl-line','Autres féculents',null,'day','portion(s)'],
  ['nuts','ri-seedling-line','Fruits à coque non salés',1,'day','poignée(s)'],
  ['unsweetenedDairy','ri-cup-line','Laitage sans sucre',4,'week','portion(s)'],
  ['cheese','ri-restaurant-2-line','Fromage',3,'week','portion(s)'],
  ['dessert','ri-cake-3-line','Dessert / produit sucré',null,'week','portion(s)'],
  ['fried','ri-temp-hot-line','Friture',null,'week','portion(s)'],
  ['richsauce','ri-bowl-line','Sauce riche',null,'week','portion(s)']
];

export const foodGroups = [
['starters','Entrées','ri-bowl-line',['starter','appetizer']],
['animal','Viandes et poissons','ri-restaurant-line',['animalTotal','poultry','meat','fish','oilyfish','charcuterie','fried','richsauce']],
['alternatives','Œufs et légumineuses','ri-seedling-line',['eggs','pulses']],
['starches','Féculents et légumes','ri-leaf-line',['salad','wholegrain','starch']],
['dairy','Laitages et fromages','ri-cup-line',['unsweetenedDairy','cheese']],
['extras','Fruits et desserts','ri-cake-3-line',['fruit','nuts','dessert']],
['drinks','Boissons alcoolisées','ri-goblet-line',['wine','beer','alcohol']]
];

export const animalCategories = ["meat", "poultry", "charcuterie", "fish", "oilyfish"];
export const preparations = [["ri-leaf-line", "Nature"], ["ri-fire-line", "Grillé"], ["ri-temp-hot-line", "Frit"], ["ri-bowl-line", "En sauce"]
];
export const meals = [["ri-sun-foggy-line", "Petit-déjeuner"], ["ri-sun-line", "Déjeuner"], ["ri-moon-line", "Dîner"], ["ri-apple-line", "Collation"]
];
