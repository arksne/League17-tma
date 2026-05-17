import { 
  getShopState, modifyMoney, getItemSpriteImg, showToast, 
  addItem, removeItem, updateInventoryDisplay, updateMoneyDisplay, 
  autoSave, showConfirmModal 
} from '../../main.js';
import { ITEMS } from '../data/items.js';

const shopPrices = {};
ITEMS.forEach(item => { if (item.price > 0) shopPrices[item.id] = item.price; });

function getShopItems() {
  return ITEMS
    .filter(item => item.price > 0 && item.implemented)
    .map(item => ({
      id: item.id,
      icon: getItemSpriteImg(item.id, 28),
      name: item.nameRu,
      price: item.price,
    }));
}

export function openShop() {
  const modal = document.getElementById('shop-modal');
  const itemsContainer = document.getElementById('shop-items');
  itemsContainer.innerHTML = '';

  getShopItems().forEach(item => {
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

  document.getElementById('shop-money-display').innerText = getShopState().money;
  modal.style.display = 'flex';
}

export function initShopEvents() {
  document.getElementById('btn-close-shop').addEventListener('click', () => {
    document.getElementById('shop-modal').style.display = 'none';
  });

  document.getElementById('shop-items').addEventListener('click', (e) => {
    const btn = e.target.closest('.shop-buy-btn');
    if (!btn) return;

    const itemId = btn.getAttribute('data-item');
    if (itemId === 'credit') return showToast('Нельзя купить кредиты!', true);
    const price = shopPrices[itemId];
    if (!price) return showToast('Товар недоступен!', true);
    const qtyInput = document.querySelector(`.shop-qty-input[data-item="${itemId}"]`);
    const qty = Math.max(1, Math.min(99, parseInt(qtyInput?.value) || 1));
    const total = price * qty;

    if (getShopState().money < total) return showToast('Недостаточно кредитов!', true);

    modifyMoney(-total);

    let bought = 0;
    for (let i = 0; i < qty; i++) {
      if (!addItem(itemId)) {
        modifyMoney(price);
        break;
      }
      bought++;
    }

    document.getElementById('shop-money-display').innerText = getShopState().money;
    updateInventoryDisplay();
    updateMoneyDisplay();
    autoSave();

    if (bought > 0) {
      showToast(bought > 1 ? `Куплено ${bought}x! Осталось: ¥${getShopState().money}` : `Куплено! Осталось: ¥${getShopState().money}`, false);
    }
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
    const origOpen = openShop;
    document.getElementById('shop-money-display').innerText = getShopState().money;
    const container = document.getElementById('shop-items');
    container.innerHTML = '';
    getShopItems().forEach(item => {
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
    const btn = e.target.closest('.shop-sell-btn');
    if (!btn || btn.disabled) return;

    const itemId = btn.getAttribute('data-item');
    const sellPrice = Math.floor((shopPrices[itemId] || 100) / 2);
    const itemData = ITEMS.find(i => i.id === itemId);
    const qtyInput = document.querySelector(`.shop-sell-qty[data-item="${itemId}"]`);
    const qty = Math.max(1, Math.min(getShopState().inventory[itemId] || 1, parseInt(qtyInput?.value) || 1));
    const total = sellPrice * qty;
    showConfirmModal('Продать предмет?', `Продать ${qty}x ${itemData ? itemData.nameRu : itemId} за ¥${total.toLocaleString()}?`, () => {
      let sold = 0;
      for (let i = 0; i < qty; i++) {
        if (!removeItem(itemId)) break;
        sold++;
      }
      modifyMoney(sellPrice * sold);
      document.getElementById('shop-money-display').innerText = getShopState().money;
      updateInventoryDisplay();
      updateMoneyDisplay();
      autoSave();
      renderSell();
      if (sold > 0) showToast(`Продано ${sold}x! +¥${sellPrice * sold}`, false);
    });
  });
}
