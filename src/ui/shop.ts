import { state } from '../game/state.js';
import { getShopState, modifyMoney } from '../game/getters.js';
import { addItem, removeItem } from '../game/actions.js';
import { updateInventoryDisplay } from './inventory.js';
import { updateMoneyDisplay } from './location.js';
import { autoSave, getCloudAuthHeaders } from '../game/save.js';
import { API_BASE } from '../game/config.js';
import { showToast, showConfirmModal } from '../utils/dom.js';
import { getItemSpriteImg } from '../utils/sprite.js';
import { ITEMS } from '../data/items.js';

const shopPrices = {};
ITEMS.forEach(item => { if (item.price > 0) shopPrices[item.id] = item.price; });

function getShopItems(locId) {
  const shopStock = (getShopState() as any).locationShopStock || {};
  const stockList = shopStock[locId];
  return ITEMS
    .filter(item => item.price > 0 && item.implemented && (!stockList || stockList.includes(item.id)))
    .map(item => ({
      id: item.id,
      icon: getItemSpriteImg(item.id, 28),
      name: item.nameRu,
      price: item.price,
    }));
}

export function openShop(locId?) {
  const modal = document.getElementById('shop-modal');
  modal.dataset.shopLocId = locId || '';
  const itemsContainer = document.getElementById('shop-items');
  itemsContainer.innerHTML = '';

  getShopItems(locId).forEach(item => {
    const div = document.createElement('div');
    div.className = 'shop-item';
    div.innerHTML = `
      <div class="shop-item-icon">${item.icon}</div>
      <div class="shop-item-info">
        <div class="shop-item-name">${item.name}</div>
        <div class="shop-item-price">¥${item.price}</div>
      </div>
      <div class="shop-qty-wrap">
        <input type="number" class="shop-qty-input" value="1" min="1" max="99" data-item="${item.id}">
        <button class="btn-use shop-buy-btn" data-item="${item.id}">Купить</button>
      </div>
    `;
    itemsContainer.appendChild(div);
  });

  document.getElementById('shop-money-display').innerText = String(getShopState().money);
  modal.style.display = 'flex';
}

export function initShopEvents() {
  document.getElementById('btn-close-shop').addEventListener('click', () => {
    document.getElementById('shop-modal').style.display = 'none';
  });

  document.getElementById('shop-items').addEventListener('click', (e) => {
    const btn = (e.target as HTMLElement).closest('.shop-buy-btn');
    if (!btn) return;

    const itemId = btn.getAttribute('data-item');
    if (itemId === 'credit') return showToast('Нельзя купить кредиты!', true);
    const price = shopPrices[itemId];
    if (!price) return showToast('Товар недоступен!', true);
    const qtyInput = document.querySelector(`.shop-qty-input[data-item="${itemId}"]`);
    const qty = Math.max(1, Math.min(99, parseInt((qtyInput as HTMLInputElement)?.value) || 1));
    const total = price * qty;

    if (getShopState().money < total) return showToast('Недостаточно кредитов!', true);

    const btnEl = btn as HTMLButtonElement;
    btnEl.disabled = true;
    
    fetch(`${API_BASE}/economy/buy`, {
      method: 'POST',
      headers: { ...getCloudAuthHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify({ itemId, qty })
    })
    .then(r => r.json())
    .then(data => {
      btnEl.disabled = false;
      if (data.error) return showToast('Ошибка покупки: ' + data.error, true);

      state.inventory['credit'] = data.money;

      document.getElementById('shop-money-display').innerText = String(data.money);
      updateInventoryDisplay();
      updateMoneyDisplay();
      autoSave();
      
      showToast(qty > 1 ? `Куплено ${qty}x! Осталось: ¥${data.money}` : `Куплено! Осталось: ¥${data.money}`, false);
    })
    .catch(e => {
      btnEl.disabled = false;
      showToast('Сетевая ошибка', true);
    });
  });
}



export function initSellTab() {
  const sellTab = document.getElementById('shop-sell-tab');
  const buyTab = document.getElementById('shop-buy-tab');
  if (!sellTab || !buyTab) return;

  const renderSell = () => {
    const container = document.getElementById('shop-items');
    container.innerHTML = '';

    const sellables = ITEMS
      .filter(item => item.id !== 'credit' && (getShopState().inventory[item.id] || 0) > 0)
      .map(item => ({
        id: item.id,
        icon: getItemSpriteImg(item.id, 24),
        name: item.nameRu,
        qty: getShopState().inventory[item.id],
      }));

    sellables.forEach(item => {
      const div = document.createElement('div');
      div.className = 'shop-item';
      const sellPrice = Math.floor((shopPrices[item.id] || 100) / 2);
      div.innerHTML = `
        <div class="shop-item-icon">${item.icon}</div>
        <div class="shop-item-info">
          <div class="shop-item-name">${item.name} (x${item.qty})</div>
          <div class="shop-item-price">Продажа: ¥${sellPrice}/шт</div>
        </div>
        <div class="shop-qty-wrap">
          <input type="number" class="shop-qty-input shop-sell-qty" value="1" min="1" max="${item.qty}" data-item="${item.id}">
          <button class="btn-use shop-sell-btn" data-item="${item.id}" ${item.qty <= 0 ? 'disabled' : ''}>Продать</button>
        </div>
      `;
      container.appendChild(div);
    });
  };

  sellTab.addEventListener('click', () => {
    buyTab.classList.remove('active');
    sellTab.classList.add('active');
    renderSell();
  });

  buyTab.addEventListener('click', () => {
    sellTab.classList.remove('active');
    buyTab.classList.add('active');
    document.getElementById('shop-money-display').innerText = String(getShopState().money);
    const container = document.getElementById('shop-items');
    container.innerHTML = '';
    const locId = document.getElementById('shop-modal').dataset.shopLocId;
    getShopItems(locId).forEach(item => {
      const div = document.createElement('div');
      div.className = 'shop-item';
      div.innerHTML = `
        <div class="shop-item-icon">${item.icon}</div>
        <div class="shop-item-info">
          <div class="shop-item-name">${item.name}</div>
          <div class="shop-item-price">¥${item.price}</div>
        </div>
        <button class="btn-use shop-buy-btn" data-item="${item.id}">Купить</button>
      `;
      container.appendChild(div);
    });
  });

  // Sell button delegation
  document.getElementById('shop-items').addEventListener('click', (e) => {
    const btn = (e.target as HTMLElement).closest('.shop-sell-btn');
    if (!btn || (btn as HTMLButtonElement).disabled) return;

    const itemId = btn.getAttribute('data-item');
    const sellPrice = Math.floor((shopPrices[itemId] || 100) / 2);
    const itemData = ITEMS.find(i => i.id === itemId);
    const qtyInput = document.querySelector(`.shop-sell-qty[data-item="${itemId}"]`);
    const qty = Math.max(1, Math.min(getShopState().inventory[itemId] || 1, parseInt((qtyInput as HTMLInputElement)?.value) || 1));
    const total = sellPrice * qty;
    showConfirmModal('Продать предмет?', `Продать ${qty}x ${itemData ? itemData.nameRu : itemId} за ¥${total.toLocaleString()}?`, () => {
      const btnEl = btn as HTMLButtonElement;
      btnEl.disabled = true;
      fetch(`${API_BASE}/economy/sell`, {
        method: 'POST',
        headers: { ...getCloudAuthHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemId, qty })
      })
      .then(r => r.json())
      .then(data => {
        btnEl.disabled = false;
        if (data.error) return showToast('Ошибка продажи: ' + data.error, true);

        state.inventory['credit'] = data.money;

        document.getElementById('shop-money-display').innerText = String(data.money);
        updateInventoryDisplay();
        updateMoneyDisplay();
        autoSave();
        renderSell();
        showToast(`Продано ${qty}x! +¥${sellPrice * qty}`, false);
      })
      .catch(e => {
        btnEl.disabled = false;
        showToast('Сетевая ошибка', true);
      });
    });
  });
}
