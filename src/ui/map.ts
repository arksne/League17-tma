// Interactive Region Map
import { REGIONS } from '../data/regions.js';

let mapCanvas: HTMLCanvasElement | null = null;
let mapCtx: CanvasRenderingContext2D | null = null;
let selectedRegion: string | null = null;
let selectedLoc: string | null = null;
let nodePositions: Record<string, { x: number; y: number }> = {};
let hoveredNode: string | null = null;
let offsetX = 0, offsetY = 0;
let isPanning = false;
let panStartX = 0, panStartY = 0;
let mapScale = 1;
let exploredLocs = new Set<string>();

export let onTravelTo: ((locId: string) => void) | null = null;

export function setTravelCallback(fn: (locId: string) => void) { onTravelTo = fn; }
export function setExploredLocs(locs: string[]) { exploredLocs = new Set(locs); }

/** Show location info popup — purely informational, no teleport */
export function showLocationInfo(locId: string) {
  if (!selectedRegion) return;
  const locs = (REGIONS as any)[selectedRegion]?.locations;
  if (!locs || !locs[locId]) return;
  const loc = locs[locId];

  // Remove any existing info modal
  const oldModal = document.getElementById('map-info-modal');
  if (oldModal) oldModal.remove();

  const imgPath = loc.image || '';
  // Connected location names
  const linkNames = (loc.links || [])
    .map((id: string) => locs[id]?.name || id)
    .join(', ');

  const modal = document.createElement('div');
  modal.id = 'map-info-modal';
  modal.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;z-index:999;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,0.65);backdrop-filter:blur(4px);';

  modal.innerHTML = `
    <div style="background:var(--tma-bg,#1a1a2e);border:1px solid var(--tma-border,rgba(255,255,255,0.1));border-radius:16px;max-width:380px;width:90%;max-height:85vh;overflow-y:auto;padding:0;box-shadow:0 8px 40px rgba(0,0,0,0.5);">
      ${imgPath ? `<img src="${imgPath}" alt="${loc.name}" style="width:100%;height:160px;object-fit:cover;border-radius:16px 16px 0 0;display:block;" onerror="this.style.display='none'">` : ''}
      <div style="padding:16px 18px 14px;">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:8px;">
          <h3 style="margin:0;font-size:1.1rem;color:#fff;">${loc.name}</h3>
          <button id="map-info-close" style="background:none;border:none;color:#999;font-size:1.4rem;cursor:pointer;padding:0 4px;line-height:1;">✕</button>
        </div>
        <p style="margin:0 0 12px;font-size:0.85rem;color:#bbb;line-height:1.5;">${loc.desc || 'Нет описания.'}</p>
        <div style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:10px;">
          <span style="background:rgba(74,158,255,0.15);color:#4a9eff;padding:3px 10px;border-radius:20px;font-size:0.7rem;">👾 ${(loc.encounters?.length || 0)} видов</span>
          ${loc.hasHeal ? '<span style="background:rgba(52,199,89,0.15);color:#34c759;padding:3px 10px;border-radius:20px;font-size:0.7rem;">✅ Покецентр</span>' : ''}
          ${loc.hasWater ? '<span style="background:rgba(90,200,250,0.15);color:#5ac8fa;padding:3px 10px;border-radius:20px;font-size:0.7rem;">🌊 Вода</span>' : ''}
        </div>
        ${linkNames ? `<div style="font-size:0.75rem;color:#888;"><span style="color:#666;">🔗 Связано с:</span> ${linkNames}</div>` : ''}
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  // Close handlers
  const closeBtn = document.getElementById('map-info-close');
  if (closeBtn) closeBtn.onclick = () => modal.remove();
  modal.addEventListener('click', (e) => { if (e.target === modal) modal.remove(); });
}

const REGION_META: Record<string, { name: string; icon: string; color: string }> = {
  kanto: { name: 'Канто', icon: '🗺️', color: '#4a9eff' },
  johto: { name: 'Джото', icon: '🗺️', color: '#facc15' },
};

// Generate positions using simple grid layout
function generatePositions(regionKey: string): Record<string, { x: number; y: number }> {
  const locs = (REGIONS as any)[regionKey]?.locations;
  if (!locs) return {};
  const ids = Object.keys(locs);
  const positions: Record<string, { x: number; y: number }> = {};
  const cols = Math.max(4, Math.ceil(Math.sqrt(ids.length)));
  const spacing = 130;

  // Identify hubs (cities)
  const hubs = ids.filter(id => locs[id].hasHeal);
  const nonHubs = ids.filter(id => !locs[id].hasHeal);

  // Place hubs on grid
  hubs.forEach((id, i) => {
    positions[id] = { x: (i % cols) * spacing + 80, y: Math.floor(i / cols) * spacing + 80 };
  });

  // Place remaining near linked hubs
  nonHubs.forEach(id => {
    const links = locs[id].links || [];
    let px = 300 + Math.random() * 200, py = 300 + Math.random() * 200;
    for (const link of links) {
      if (positions[link]) {
        px = positions[link].x + (Math.random() - 0.5) * 80;
        py = positions[link].y + (Math.random() - 0.5) * 80;
        break;
      }
    }
    positions[id] = { x: Math.max(30, Math.min(700, px)), y: Math.max(30, Math.min(700, py)) };
  });

  return positions;
}

export function updateLocList(regionKey: string) {
  const listEl = document.getElementById('map-loc-list');
  if (!listEl) return;
  const locs = (REGIONS as any)[regionKey]?.locations;
  if (!locs) return;

  listEl.innerHTML = Object.entries(locs)
    .sort(([a], [b]) => Number(exploredLocs.has(b)) - Number(exploredLocs.has(a)))
    .map(([id, loc]: [string, any]) =>
      `<div class="map-loc-item ${exploredLocs.has(id) ? 'explored' : ''} ${selectedLoc === id ? 'active' : ''}"
            data-loc="${id}">
        <span style="color:${exploredLocs.has(id) ? '#4a9eff' : 'rgba(255,255,255,0.4)'}">
          ${exploredLocs.has(id) ? '📍' : '❓'} ${loc.name}
        </span>
      </div>`
    ).join('');

  listEl.querySelectorAll('.map-loc-item').forEach(el => {
    el.addEventListener('click', () => {
      const locId = (el as HTMLElement).dataset.loc;
      if (locId) showLocationInfo(locId);
    });
  });
}

function drawMap() {
  if (!mapCtx || !mapCanvas || !selectedRegion) return;
  const canvas = mapCanvas;
  const ctx = mapCtx;
  const W = canvas.width;
  const H = canvas.height;

  ctx.clearRect(0, 0, W, H);
  ctx.save();
  ctx.translate(offsetX, offsetY);
  ctx.scale(mapScale, mapScale);

  const locs = (REGIONS as any)[selectedRegion]?.locations;
  if (!locs) { ctx.restore(); return; }
  const ids = Object.keys(locs);

  // Connection lines (unexplored)
  ctx.strokeStyle = 'rgba(255,255,255,0.1)';
  ctx.lineWidth = 1.5;
  ctx.setLineDash([4, 4]);
  ids.forEach(id => {
    const from = nodePositions[id];
    if (!from) return;
    (locs[id].links || []).forEach((linkId: string) => {
      const to = nodePositions[linkId];
      if (!to || id >= linkId) return;
      ctx.beginPath();
      ctx.moveTo(from.x, from.y);
      ctx.lineTo(to.x, to.y);
      ctx.stroke();
    });
  });
  ctx.setLineDash([]);

  // Visited connections
  ctx.strokeStyle = 'rgba(74, 158, 255, 0.35)';
  ctx.lineWidth = 2.5;
  ids.forEach(id => {
    if (!exploredLocs.has(id)) return;
    const from = nodePositions[id];
    if (!from) return;
    (locs[id].links || []).forEach((linkId: string) => {
      if (!exploredLocs.has(linkId)) return;
      const to = nodePositions[linkId];
      if (!to || id >= linkId) return;
      ctx.beginPath();
      ctx.moveTo(from.x, from.y);
      ctx.lineTo(to.x, to.y);
      ctx.stroke();
    });
  });

  // Draw nodes
  ids.forEach(id => {
    const pos = nodePositions[id];
    if (!pos) return;
    const loc = locs[id];
    const isCity = loc.hasHeal;
    const isHovered = hoveredNode === id;
    const isExplored = exploredLocs.has(id);
    const isSel = selectedLoc === id;
    const radius = isCity ? 11 : 7;

    // Glow for explored
    if (isExplored) {
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, radius + 5, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(74, 158, 255, 0.1)';
      ctx.fill();
    }

    // Circle
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, radius, 0, Math.PI * 2);
    ctx.fillStyle = isHovered ? '#fff' : (isExplored ? '#4a9eff' : 'rgba(255,255,255,0.25)');
    ctx.fill();

    if (isSel) { ctx.strokeStyle = '#ff9500'; ctx.lineWidth = 3; ctx.stroke(); }
    else if (isHovered) { ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.stroke(); }

    // Label
    const label = loc.name.length > 18 ? loc.name.slice(0, 16) + '…' : loc.name;
    ctx.fillStyle = isHovered ? '#fff' : (isExplored ? '#ccc' : 'rgba(255,255,255,0.4)');
    ctx.font = isHovered ? 'bold 11px sans-serif' : '10px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(label, pos.x, pos.y + radius + 13);
  });

  ctx.restore();

  // Tooltip for hovered
  if (hoveredNode && locs[hoveredNode]) {
    const pos = nodePositions[hoveredNode];
    if (pos) {
      const loc = locs[hoveredNode];
      const tx = Math.min(pos.x * mapScale + offsetX + 15, W - 200);
      const ty = Math.max(pos.y * mapScale + offsetY - 50, 10);
      ctx.save();
      ctx.fillStyle = 'rgba(15,15,25,0.93)';
      ctx.strokeStyle = 'rgba(255,255,255,0.15)';
      ctx.lineWidth = 1;
      roundRect(ctx, tx, ty, 190, 65, 8);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 11px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(loc.name, tx + 10, ty + 18);
      ctx.fillStyle = '#999';
      ctx.font = '9px sans-serif';
      ctx.fillText(`👾 ${(loc.encounters?.length || 0)} диких видов`, tx + 10, ty + 35);
      if (loc.hasHeal) { ctx.fillStyle = '#4a9eff'; ctx.fillText('✅ Покецентр', tx + 10, ty + 52); }
      ctx.restore();
    }
  }
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function setupCanvas() {
  if (mapCanvas) return;
  const wrap = document.getElementById('map-canvas-wrap');
  if (!wrap) return;

  mapCanvas = document.createElement('canvas');
  mapCanvas.id = 'map-canvas';
  mapCanvas.style.cssText = 'width:100%;height:380px;border-radius:12px;background:rgba(0,0,0,0.3);cursor:grab;display:block;';
  wrap.appendChild(mapCanvas);
  mapCtx = mapCanvas.getContext('2d')!;

  // Mouse events
  mapCanvas.addEventListener('mousemove', (e) => {
    const rect = mapCanvas!.getBoundingClientRect();
    const mx = (e.clientX - rect.left) * (mapCanvas!.width / rect.width);
    const my = (e.clientY - rect.top) * (mapCanvas!.height / rect.height);
    let closest: string | null = null;
    let closestDist = 18;
    for (const [id, pos] of Object.entries(nodePositions)) {
      const sx = pos.x * mapScale + offsetX;
      const sy = pos.y * mapScale + offsetY;
      const d = Math.sqrt((mx - sx) ** 2 + (my - sy) ** 2);
      if (d < closestDist) { closestDist = d; closest = id; }
    }
    hoveredNode = closest;
    mapCanvas!.style.cursor = closest ? 'pointer' : 'grab';
    if (!isPanning) drawMap();
  });

  mapCanvas.addEventListener('click', () => {
    if (!hoveredNode || !selectedRegion) return;
    selectedLoc = hoveredNode;
    drawMap();
    updateLocList(selectedRegion);
    showLocationInfo(hoveredNode);
  });

  mapCanvas.addEventListener('mousedown', (e) => {
    if (hoveredNode) return;
    isPanning = true;
    panStartX = e.clientX - offsetX;
    panStartY = e.clientY - offsetY;
    mapCanvas!.style.cursor = 'grabbing';
  });

  mapCanvas.addEventListener('mousemove', (e) => {
    if (!isPanning) return;
    offsetX = e.clientX - panStartX;
    offsetY = e.clientY - panStartY;
    drawMap();
  });

  const stopPan = () => { isPanning = false; if (mapCanvas) mapCanvas.style.cursor = 'grab'; };
  mapCanvas.addEventListener('mouseup', stopPan);
  mapCanvas.addEventListener('mouseleave', stopPan);

  // Touch
  let touchStartX = 0, touchStartY = 0;
  mapCanvas.addEventListener('touchstart', (e) => {
    if (e.touches.length === 1) {
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
      panStartX = offsetX;
      panStartY = offsetY;
    }
  }, { passive: true });

  mapCanvas.addEventListener('touchmove', (e) => {
    if (e.touches.length !== 1) return;
    const dx = e.touches[0].clientX - touchStartX;
    const dy = e.touches[0].clientY - touchStartY;
    if (Math.abs(dx) > 10 || Math.abs(dy) > 10) {
      offsetX = panStartX + dx * 2;
      offsetY = panStartY + dy * 2;
      drawMap();
    }
  }, { passive: true });

  mapCanvas.addEventListener('touchend', (e) => {
    // Check if it was a tap (not a pan)
    if (mapCanvas) {
      const touch = e.changedTouches[0];
      if (touch) {
        const dx = Math.abs(touch.clientX - touchStartX);
        const dy = Math.abs(touch.clientY - touchStartY);
        if (dx < 10 && dy < 10) {
          // Tap - find nearest node
          const rect = mapCanvas.getBoundingClientRect();
          const mx = (touch.clientX - rect.left) * (mapCanvas.width / rect.width);
          const my = (touch.clientY - rect.top) * (mapCanvas.height / rect.height);
          let closest: string | null = null;
          let closestDist = 25;
          for (const [id, pos] of Object.entries(nodePositions)) {
            const sx = pos.x * mapScale + offsetX;
            const sy = pos.y * mapScale + offsetY;
            const d = Math.sqrt((mx - sx) ** 2 + (my - sy) ** 2);
            if (d < closestDist) { closestDist = d; closest = id; }
          }
          if (closest && selectedRegion) {
            selectedLoc = closest;
            drawMap();
            updateLocList(selectedRegion);
            showLocationInfo(closest);
          }
        }
      }
    }
  }, { passive: true });
}

export function showRegionMap(regionKey: string) {
  selectedRegion = regionKey;
  selectedLoc = null;
  nodePositions = generatePositions(regionKey);
  offsetX = 0;
  offsetY = 0;
  mapScale = 1;

  const wrap = document.getElementById('map-canvas-wrap');
  if (!wrap) return;

  wrap.innerHTML = '';
  mapCanvas = null;
  mapCtx = null;
  setupCanvas();

  if (mapCanvas) {
    const cw = wrap.clientWidth || 400;
    mapCanvas.width = cw * 2;
    mapCanvas.height = 760;
    drawMap();
  }
  updateLocList(regionKey);
}

export function openMap() {
  const container = document.getElementById('map-container');
  if (!container) return;
  container.style.display = 'block';
  container.innerHTML = '';

  // Region selector tabs
  const tabs = document.createElement('div');
  tabs.style.cssText = 'display:flex;gap:6px;flex-wrap:wrap;margin-bottom:10px;';
  tabs.innerHTML = Object.entries(REGION_META).map(([key, meta]) =>
    `<button class="map-region-tab" data-region="${key}"
      style="padding:7px 12px;border-radius:8px;border:none;background:${meta.color};color:#fff;font-weight:600;font-size:0.8rem;cursor:pointer;opacity:0.5;transition:opacity 0.2s;">
      ${meta.icon} ${meta.name}
    </button>`
  ).join('');
  container.appendChild(tabs);

  tabs.querySelectorAll('.map-region-tab').forEach(btn => {
    btn.addEventListener('click', () => {
      tabs.querySelectorAll('.map-region-tab').forEach(b => (b as HTMLElement).style.opacity = '0.5');
      (btn as HTMLElement).style.opacity = '1';
      const region = (btn as HTMLElement).dataset.region;
      if (region) showRegionMap(region);
    });
  });

  // Location grid
  const locList = document.createElement('div');
  locList.id = 'map-loc-list';
  locList.style.cssText = 'margin-top:8px;max-height:260px;overflow-y:auto;display:grid;grid-template-columns:repeat(auto-fill,minmax(130px,1fr));gap:4px;';
  container.appendChild(locList);

  // Canvas wrapper
  const canvasWrap = document.createElement('div');
  canvasWrap.id = 'map-canvas-wrap';
  container.appendChild(canvasWrap);

  // Show first region
  const first = tabs.querySelector('.map-region-tab') as HTMLElement;
  if (first) { first.style.opacity = '1'; const r = first.dataset.region; if (r) showRegionMap(r); }
}

export function closeMap() {
  const c = document.getElementById('map-container');
  if (c) c.style.display = 'none';
}
