import { state } from '../game/state.js';
import { store } from '../game/store.js';
import { API_BASE } from '../game/config.js';
import { getCloudAuthHeaders, autoSave } from '../game/save.js';
import { getShopState } from '../game/getters.js';
import { getItemQty } from '../game/state.js';
import { addItem, removeItem } from '../game/actions.js';
import { showToast } from '../utils/dom.js';
import { ITEMS } from '../data/items.js';

const CRAFTING_RECIPES = [
  // Metallurgy
  { id: 'metalIngot', name: 'Металлический слиток', category: 'Металлургия',
    ingredients: { 'ore': 3 }, result: 'metalIngot', qty: 1 },
  { id: 'glass', name: 'Стекло', category: 'Металлургия',
    ingredients: { 'mountainSand': 2, 'coal': 1 }, result: 'glass', qty: 1 },
  // Medicine
  { id: 'bandage', name: 'Бинт', category: 'Медицина',
    ingredients: { 'cotton': 3 }, result: 'bandage', qty: 1 },
  { id: 'healingPotionCraft', name: 'Лечебное зелье (Аптечка)', category: 'Медицина',
    ingredients: { 'healingHerbs': 2, 'wonderFlower': 1 }, result: 'potion', qty: 1 },
  // Alchemy
  { id: 'sparkles', name: 'Блёстки', category: 'Алхимия',
    ingredients: { 'shinyDust': 3, 'metalIngot': 1 }, result: 'sparkles', qty: 1 },
  { id: 'honeyJar', name: 'Баночка мёда', category: 'Алхимия',
    ingredients: { 'honeycomb': 2, 'woodenApricorn': 1 }, result: 'honeyJar', qty: 1 },
  // Fossils
  { id: 'fossilRevive', name: 'Оживить окаменелость', category: 'Окаменелости',
    ingredients: { 'suspiciousEgg': 1, 'ancientGenome': 1 }, result: 'fossil', qty: 1 },
  // Pokeballs
  { id: 'craftPokeball', name: 'Покебол (x3)', category: 'Покеболы',
    ingredients: { 'woodenApricorn': 1, 'metalIngot': 1 }, result: 'pokeBall', qty: 3 },
  { id: 'craftGreatBall', name: 'Гритбол (x2)', category: 'Покеболы',
    ingredients: { 'woodenApricorn': 2, 'metalIngot': 1, 'shinyDust': 1 }, result: 'greatBall', qty: 2 },
  // Vitamins
  { id: 'craftProtein', name: 'Протеин', category: 'Витамины',
    ingredients: { 'healingHerbs': 2, 'honeycomb': 1, 'ore': 1 }, result: 'protein', qty: 1 },
  { id: 'craftIron', name: 'Железо', category: 'Витамины',
    ingredients: { 'ore': 2, 'metalIngot': 1 }, result: 'iron', qty: 1 },
  // Berries
  { id: 'craftOran', name: 'Оран Ягода (x3)', category: 'Ягоды',
    ingredients: { 'cotton': 1, 'honeycomb': 1 }, result: 'oranBerry', qty: 3 },
  // PP recovery
  { id: 'craftWeakElixir', name: 'Слабый эликсир', category: 'Эликсиры',
    ingredients: { 'healingHerbs': 2, 'wonderFlower': 1 }, result: 'ether', qty: 1 },
  { id: 'craftElixir', name: 'Эликсир', category: 'Эликсиры',
    ingredients: { 'healingHerbs': 3, 'wonderFlower': 2, 'honeycomb': 1 }, result: 'elixir', qty: 1 },
];

export function openCrafting() {
  const modal = document.getElementById('crafting-modal');
  const tabsContainer = document.getElementById('crafting-tabs');
  const recipesContainer = document.getElementById('crafting-recipes');

  const categories = [...new Set(CRAFTING_RECIPES.map(r => r.category))];

  tabsContainer!.innerHTML = categories.map(cat =>
    `<span class="crafting-tab${state.activeCraftCategory === cat ? ' active' : ''}" data-cat="${cat}">${cat}</span>`
  ).join('');

  tabsContainer!.querySelectorAll('.crafting-tab').forEach(tab => {
    (tab as HTMLElement).onclick = () => {
      state.activeCraftCategory = (tab as HTMLElement).dataset.cat;
      openCrafting();
    };
  });

  const activeCat = state.activeCraftCategory || categories[0];
  const recipes = CRAFTING_RECIPES.filter(r => r.category === activeCat);

  recipesContainer!.innerHTML = recipes.map(recipe => {
    const canCraft = Object.entries(recipe.ingredients).every(([id, qty]) => getItemQty(id) >= qty);
    const ingText = Object.entries(recipe.ingredients)
      .map(([id, qty]) => {
        const item = ITEMS.find(i => i.id === id);
        return `${item?.nameRu || id} x${qty}`;
      }).join(', ');
    return `<div class="crafting-recipe">
      <div class="crafting-recipe-info">
        <div class="crafting-recipe-name">${recipe.name}</div>
        <div class="crafting-recipe-ingredients">${ingText}</div>
      </div>
      <button class="crafting-recipe-btn" data-recipe="${recipe.id}" ${canCraft ? '' : 'disabled'}>Создать</button>
    </div>`;
  }).join('');

  recipesContainer!.querySelectorAll('.crafting-recipe-btn').forEach(btn => {
    (btn as HTMLElement).onclick = () => craftItem((btn as HTMLElement).dataset.recipe);
  });

  const closeBtn = document.getElementById('btn-crafting-close');
  if (closeBtn) {
    closeBtn.onclick = () => {
      modal!.style.display = 'none';
      store.emit('save');
    };
  }

  modal!.style.display = 'flex';
}

function craftItem(recipeId: string) {
  const recipe = CRAFTING_RECIPES.find(r => r.id === recipeId);
  if (!recipe) return;

  const btnEl = document.querySelector(`.crafting-recipe-btn[data-recipe="${recipeId}"]`) as HTMLButtonElement;
  if (btnEl) btnEl.disabled = true;

  fetch(`${API_BASE}/economy/craft`, {
    method: 'POST',
    headers: { ...getCloudAuthHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify({ recipeId })
  })
  .then(r => r.json())
  .then(data => {
    if (btnEl) btnEl.disabled = false;
    if (data.error) return showToast('Ошибка крафта: ' + data.error, true);
    
    const shopState = getShopState() as any;
    shopState.inventory = data.inventory;
    
    const resultItem = ITEMS.find(i => i.id === recipe.result);
    showToast(`Создано: ${resultItem?.nameRu || recipe.result} x${recipe.qty}!`, false);
    store.emit('inventory:changed');
    autoSave();
    openCrafting();
  })
  .catch(e => {
    if (btnEl) btnEl.disabled = false;
    showToast('Сетевая ошибка', true);
  });
}
