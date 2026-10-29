export const cats = [
  
['starter','ri-bowl-line','Entrée',7,'max','week','portion(s)'],
  ['appetizer','ri-cake-line','Biscuits apéritifs',null,'track','week','portion(s)'],
  ['wine','ri-goblet-line','Verre de vin',null,'track','week','verre(s)'],
  ['beer','ri-beer-line','Verre de bière',null,'track','week','verre(s)'],
  ['alcohol','ri-cup-line','Verre d’alcool',null,'track','week','verre(s)'],
  ['animalTotal','ri-restaurant-line','Total viandes / poissons',7,'max','week','portion(s)'],
  ['meat','ri-restaurant-2-line','Viande hors volaille',2,'max','week','portion(s)'],
  ['poultry','ri-restaurant-line','Volaille',3,'max','week','portion(s)'],
  ['charcuterie','ri-knife-line','Charcuterie',0,'max','week','portion(s)'],
['fish','ri-water-flash-line','Poisson',2,'goal','week','portion(s)'],
  ['oilyfish','ri-water-flash-line','Poisson gras',1,'goal','week','portion(s)'],
  ['eggs','ri-seedling-line','Œufs',null,'track','week','portion(s)'],
  ['pulses','ri-seedling-line','Légumes secs',2,'min','week','portion(s)'],
['salad','ri-leaf-line','Légumes / salade',null,'track','day','portion(s)'],
  ['fruit','ri-plant-line','Fruit',null,'track','day','portion(s)'],
  ['wholegrain','ri-seedling-line','Féculents complets',null,'track','day','portion(s)'],
  ['starch','ri-bowl-line','Autres féculents',null,'track','day','portion(s)'],
  ['nuts','ri-seedling-line','Fruits à coque non salés',1,'goal','day','poignée(s)'],
  ['unsweetenedDairy','ri-cup-line','Laitage sans sucre',4,'max','week','portion(s)'],
  ['cheese','ri-restaurant-2-line','Fromage',3,'max','week','portion(s)'],
  ['dessert','ri-cake-3-line','Dessert / produit sucré',null,'track','week','portion(s)'],
  ['fried','ri-temp-hot-line','Friture',null,'track','week','portion(s)'],
  ['richsauce','ri-bowl-line','Sauce riche',null,'track','week','portion(s)']
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
export const personalCategories = ["starter", "animalTotal", "meat", "poultry", "unsweetenedDairy", "cheese", "charcuterie"];
export const preparations = [["ri-leaf-line", "Nature"], ["ri-fire-line", "Grillé"], ["ri-blaze-line", "Vapeur"], ["ri-bowl-line", "En sauce"]
];
export const meals = [["ri-sun-foggy-line", "Petit-déjeuner"], ["ri-sun-line", "Déjeuner"], ["ri-moon-line", "Dîner"], ["ri-apple-line", "Collation"]
];
