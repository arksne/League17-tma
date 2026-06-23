export function showItemInfoModal(item, qty) {
  if (!item) return;
  const priceInfo = item.price > 0 ? `\n💰 Цена: ${item.price.toLocaleString()} кр.` : '';
  const sellInfo = item.sellPrice > 0 ? `\n🏷️ Продажа: ${item.sellPrice.toLocaleString()} кр.` : '';
  const modal = document.createElement('div');
  modal.className = 'modal-overlay';
  modal.style.display = 'flex';
  modal.innerHTML = `
    <div class="item-info-card">
      <h3>📦 ${item.nameRu}</h3>
      <p>📝 ${item.desc}</p>
      <div class="item-info-details">📊 Кол-во: ${qty}${priceInfo}${sellInfo}</div>
      <button class="tma-btn w-full mt-12" id="btn-item-info-close">Закрыть</button>
    </div>
  `;
  document.body.appendChild(modal);
  const cleanup = () => {
    document.getElementById('btn-item-info-close').removeEventListener('click', cleanup);
    modal.removeEventListener('click', onOverlay);
    if (modal.parentNode) modal.parentNode.removeChild(modal);
  };
  const onOverlay = (e) => { if (e.target === modal) cleanup(); };
  document.getElementById('btn-item-info-close').addEventListener('click', cleanup);
  modal.addEventListener('click', onOverlay);
}
