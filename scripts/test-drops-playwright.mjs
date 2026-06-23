/**
 * Playwright test: автоматизация охоты, боя и проверка дропа в инвентаре.
 *
 * Стратегия: инжектим готовый сейв в localStorage (с командой покемонов),
 * чтобы пропустить регистрацию и стартового — сразу переходим к охоте.
 *
 * Запуск (из папки проекта D:\pokematrix\league17):
 *   node scripts/test-drops-playwright.mjs
 */

import { chromium } from 'playwright';
import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { resolve } from 'path';

const BASE_URL = 'http://localhost:5173';
const RESULTS = [];

// ── Генерация валидного сейва ──────────────────────────────
function generateSave(trainerId = '0') {
  return {
    currentLocationId: 'pallet_town',
    currentRegion: 'kanto',
    inventory: {
      credit: 5000,
      potion: 5,
      candy: 0,
      pokeBall: 99,
      greatBall: 10,
    },
    badges: [],
    trainerNickname: 'TestBot',
    avatar: '🤖',
    myTeam: [{
      uid: 'testuid_001',
      originalTrainer: trainerId,
      createdAt: Date.now(),
      caughtLocation: 'pallet_town',
      apiData: {
        name: 'pikachu',
        id: 25,
        stats: [
          { base_stat: 35, stat: { name: 'hp' } },
          { base_stat: 55, stat: { name: 'attack' } },
          { base_stat: 40, stat: { name: 'defense' } },
          { base_stat: 50, stat: { name: 'special-attack' } },
          { base_stat: 50, stat: { name: 'special-defense' } },
          { base_stat: 90, stat: { name: 'speed' } },
        ],
        types: [{ type: { name: 'electric' } }, { type: { name: 'electric' } }],
        abilities: [{ ability: { name: 'static' } }],
        moves: [
          { move: { name: 'thunder-shock', url: 'https://pokeapi.co/api/v2/move/84/' } },
        ],
        base_experience: 112,
        species: { name: 'pikachu', url: 'https://pokeapi.co/api/v2/pokemon-species/25/' }
      },
      maxHp: 150,
      currentHp: 150,
      ivs: { hp: 31, atk: 31, def: 31, spa: 31, spd: 31, spe: 31 },
      evs: { hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0 },
      baseLevel: 50,
      exp: 125000,
      expToNext: 132651,
      candiesEaten: 0,
      vitaminsEaten: 0,
      training: null,
      trainingStage: 0,
      trainingStat: null,
      happiness: 70,
      natureIdx: 0,
      breedLetter: 'M',
      gender: 'male',
      status: null,
      sleepTurns: 0,
      statStages: { atk: 0, def: 0, spa: 0, spd: 0, spe: 0 },
      abilityName: 'static',
      heldItem: null,
      berries: { sitrusBerry: 0, oranBerry: 0, lumBerry: 0, chestoBerry: 0, rawstBerry: 0 },
      movesPP: [{ current: 40, max: 40 }],
      learnableMoves: [],
      lastMoveCheckLevel: 50,
    }],
    pokedexSeen: ['pikachu'],
    pokedexCaught: ['pikachu'],
    visitedLocations: ['pallet_town'],
    currentPokemonIndex: null,
    quests: [],
    questProgress: {},
    completedQuests: [],
    pcBoxes: [[]],
    tutorialStep: 999,
    saveVersion: 1,
    _ts: Date.now()
  };
}

// ── Запуск одного теста для одной локации ──────────────────
async function runDropTest(locationId, testIndex) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`🧪 ТЕСТ #${testIndex}: Локация "${locationId}"`);
  console.log(`${'='.repeat(60)}`);

  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    locale: 'ru-RU',
  });

  const page = await context.newPage();
  const results = {
    location: locationId,
    battlesFought: 0,
    dropsFound: [],
    errors: [],
    wildEncounters: [],
  };

  // ── Ловим ошибки в браузере ─────────────────────────────
  page.on('console', msg => {
    if (msg.type() === 'error') {
      const text = msg.text();
      if (text.includes('favicon') || text.includes('manifest')) return;
      console.log(`  [browser:error] ${text.slice(0, 200)}`);
    }
  });
  page.on('pageerror', err => {
    console.log(`  [page error] ${err.message.slice(0, 200)}`);
    results.errors.push(err.message);
  });

  try {
    // ── 1. Инжектим сейв в localStorage (до загрузки) ────
    const trainerId = '0';
    const saveData = generateSave(trainerId);
    const lsSaveKey = `league17_save_${trainerId}`;
    const lsTsKey = `league17_save_ts_${trainerId}`;
    const lsVKey = `league17_save_v_${trainerId}`;
    const lsTutorialKey = `league17_tutorial_${trainerId}`;

    // Записываем в localStorage через evaluate после загрузки,
    // но до того как init.ts прочитает
    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });

    // Инжектим данные
    await page.evaluate(({ saveJson, lsSaveKey, lsTsKey, lsVKey, lsTutorialKey }) => {
      localStorage.setItem(lsSaveKey, saveJson);
      localStorage.setItem(lsTsKey, String(Date.now()));
      localStorage.setItem(lsVKey, '1');
      localStorage.setItem(lsTutorialKey, '');
      // Mock Telegram WebApp for localhost
      window.Telegram = {
        WebApp: {
          initData: 'test',
          ready: () => {},
          sendData: () => {},
          close: () => {},
        }
      };
    }, {
      saveJson: JSON.stringify(saveData),
      lsSaveKey,
      lsTsKey,
      lsVKey,
      lsTutorialKey
    });

    // Перезагружаем — на этот раз init.ts прочитает сейв
    await page.reload({ waitUntil: 'networkidle', timeout: 30000 });
    console.log('  📡 Игра загружена...');
    await page.waitForTimeout(3000);

    // Скрываем оверлей логина, если есть
    await page.evaluate(() => {
      const overlay = document.getElementById('login-overlay');
      if (overlay) overlay.style.display = 'none';
    });

    await page.screenshot({ path: `test-output/screenshot-${testIndex}-01-load.png`, fullPage: true });

    // ── 2. Навигация на локацию ────────────────────────────
    console.log(`  🗺️ Переход на локацию: ${locationId}...`);

    // Пробуем найти кнопку навигации
    const navBtns = await page.$$('.btn-nav');
    let foundNav = false;
    for (const btn of navBtns) {
      const text = await btn.textContent();
      if (!text) continue;
      const locKey = locationId.replace(/_/g, ' ');
      if (text.toLowerCase().includes(locKey.toLowerCase())) {
        await btn.click();
        await page.waitForTimeout(2000);
        foundNav = true;
        console.log(`  ✅ Нашли кнопку: "${text.trim()}"`);
        break;
      }
    }

    if (!foundNav) {
      // Не нашли кнопку — возможно мы уже на этой локации
      const currentName = await page.textContent('#loc-name').catch(() => '');
      console.log(`  📍 Текущая локация: ${currentName}`);

      // Пробуем прямой переход через window.__renderLocation
      const directNav = await page.evaluate((locId) => {
        try {
          // Экспортируем renderLocation из модуля
          // @ts-ignore
          if (typeof renderLocation !== 'undefined') {
            renderLocation(locId);
            return true;
          }
          return false;
        } catch (e) { return false; }
      }, locationId);

      if (directNav) {
        console.log(`  ✅ Прямой переход на ${locationId}`);
        await page.waitForTimeout(2000);
      } else {
        console.log(`  ⚠️ Не удалось перейти на ${locationId}, пробуем Pallet Town...`);
        await page.evaluate(() => {
          try {
            // @ts-ignore
            if (typeof renderLocation !== 'undefined') renderLocation('pallet_town');
          } catch(e) {}
        });
        await page.waitForTimeout(2000);
      }
    }

    await page.screenshot({ path: `test-output/screenshot-${testIndex}-02-location.png`, fullPage: true });

    // ── 3. Смотрим дикую природу ────────────────────────────
    // Кликаем на вкладку "Дикая природа"
    const wildTab = await page.$('.loc-tab[data-tab="wild"]');
    if (wildTab) {
      const tabText = await wildTab.textContent();
      console.log(`  🔍 Вкладка: "${tabText}"`);
      await wildTab.click();
      await page.waitForTimeout(500);

      const wildlifeText = await page.textContent('#loc-wildlife').catch(() => 'нет');
      console.log(`  🐾 Дикая природа: ${wildlifeText.slice(0, 200)}`);
    }

    // ── 4. Охота ────────────────────────────────────────────
    console.log('  🎯 Начинаем охоту...');

    // Жмём кнопку охоты
    const huntBtn = await page.$('#btn-hunt-toggle');
    if (!huntBtn) {
      console.log('  ❌ Кнопка охоты (#btn-hunt-toggle) не найдена!');
      results.errors.push('Hunt button not found');
    } else {
      await huntBtn.click();
      console.log('  🔴 Охота активирована!');
      await page.waitForTimeout(1500);

      // ── 5. Цикл боёв ────────────────────────────────────
      for (let battleNum = 1; battleNum <= 5; battleNum++) {
        console.log(`\n  ⚔️ Бой #${battleNum}: ждём встречи...`);

        // Ждём появления модалки боя
        const encounterAppeared = await waitForEncounter(page, 35000);
        if (!encounterAppeared) {
          console.log('  ⏰ Таймаут: встреча не произошла');
          if (battleNum === 1) {
            results.errors.push('No encounters at this location');
            // Попробуем перезапустить охоту
            const btn = await page.$('#btn-hunt-toggle');
            if (btn) {
              await btn.click();
              await page.waitForTimeout(1000);
              await btn.click();
              await page.waitForTimeout(2000);
            }
          }
          continue;
        }

        // Имя дикого покемона
        const wildName = await page.textContent('#wild-name').catch(() => '?');
        const wildLvl = await page.textContent('#wild-lvl').catch(() => '?');
        console.log(`  🐾 Противник: ${wildName} ${wildLvl}`);
        results.wildEncounters.push(`${wildName} ${wildLvl}`);

        // ── Бой: атакуем ─────────────────────────────────────
        await fightWildPokemon(page);

        // Дроп в логе
        await page.waitForTimeout(300);
        const logText = await page.textContent('#battle-log').catch(() => '');
        const dropMatches = [...logText.matchAll(/Добыча:\s*([^\n]+)/g)];
        if (dropMatches.length > 0) {
          for (const dm of dropMatches) {
            console.log(`  🎁 ${dm[0]}`);
            results.dropsFound.push({ battle: battleNum, pokemon: wildName, text: dm[1] });
          }
        } else {
          console.log(`  ❓ Дропа нет в логе`);
        }

        // ── Уход с поля боя ─────────────────────────────────
        await page.waitForTimeout(800);
        const leaveBtn = await page.$('#btn-leave-battle');
        if (leaveBtn && await leaveBtn.isVisible()) {
          await leaveBtn.click();
          await page.waitForTimeout(2000);
          results.battlesFought++;
          console.log(`  ✅ Бой #${battleNum} завершён`);
        } else {
          // Возможно, меню боя всё ещё открыто — пробуем ещё раз атаковать
          console.log(`  ⚠️ Кнопка ухода не видна, атакуем ещё...`);
          const movesLeft = await page.$$('#move-btn-0, #move-btn-1, #move-btn-2, #move-btn-3');
          if (movesLeft.length > 0) {
            // Если есть атаки — противник ещё жив, атакуем
            await fightWildPokemon(page);
            await page.waitForTimeout(500);
            const lBtn = await page.$('#btn-leave-battle');
            if (lBtn && await lBtn.isVisible()) {
              await lBtn.click();
              await page.waitForTimeout(2000);
              results.battlesFought++;
            }
          }
        }
      }

      // ── 6. Останавливаем охоту ────────────────────────────
      const huntBtnFinal = await page.$('#btn-hunt-toggle');
      if (huntBtnFinal) {
        const btnText = await huntBtnFinal.textContent();
        if (btnText && btnText.includes('🔴')) {
          await huntBtnFinal.click();
          console.log('  ⚪ Охота остановлена');
        }
      }
    }

    // ── 7. Инвентарь ────────────────────────────────────────
    console.log('\n  📦 Проверяем инвентарь...');

    // Переходим в рюкзак
    await page.evaluate(() => {
      const navItems = document.querySelectorAll('.nav-item');
      for (const item of navItems) {
        if (item.getAttribute('data-target') === 'view-backpack') {
          item.click();
          break;
        }
      }
    });
    await page.waitForTimeout(1500);

    // Снимаем скриншот инвентаря
    await page.screenshot({ path: `test-output/screenshot-${testIndex}-99-inventory.png`, fullPage: true });

    // Читаем предметы
    const invItems = await page.evaluate(() => {
      const items = document.querySelectorAll('#inventory-items .inventory-item, #inventory-items > div');
      return Array.from(items).map(el => ({
        text: el.textContent?.trim() || '',
        html: el.innerHTML?.slice(0, 200) || '',
      }));
    });
    console.log(`  📊 Элементов в инвентаре: ${invItems.length}`);
    invItems.slice(0, 20).forEach(item => {
      if (item.text) console.log(`    ${item.text.slice(0, 80)}`);
    });

    // Пробуем прочитать напрямую из store
    const storeInv = await page.evaluate(() => {
      try {
        // @ts-ignore
        return window.__POKEMATRIX_STORE__?.getState()?.inventory ||
               window.__POKEMATRIX_STATE__?.inventory || 'not_found';
      } catch(e) { return 'error: ' + e.message; }
    });
    if (storeInv !== 'not_found' && typeof storeInv === 'object') {
      console.log(`  🏪 Store инвентарь:`);
      const entries = Object.entries(storeInv);
      const sorted = entries.sort((a, b) => (typeof b[1] === 'number' ? b[1] : 0) - (typeof a[1] === 'number' ? a[1] : 0));
      sorted.slice(0, 15).forEach(([id, qty]) => {
        if (qty > 0) console.log(`    ${id}: ${qty}`);
      });
    }

  } catch (e) {
    console.log(`  ❌ ОШИБКА: ${e.message}`);
    results.errors.push(e.message);
  }

  // ── Скриншот на прощание ─────────────────────────────────
  await page.screenshot({ path: `test-output/screenshot-${testIndex}-final.png`, fullPage: true });
  await browser.close();

  console.log(`\n📊 ИТОГ ТЕСТА #${testIndex} (${results.location}):`);
  console.log(`  Боёв: ${results.battlesFought}/${results.wildEncounters.length} встреч`);
  console.log(`  Дропов: ${results.dropsFound.length}`);
  console.log(`  Ошибок: ${results.errors.length}`);
  if (results.dropsFound.length > 0) {
    console.log(`  🎁 Дропы:`);
    results.dropsFound.forEach(d => console.log(`    • Бой #${d.battle}: ${d.pokemon} → ${d.text}`));
  }

  return results;
}

// ── Боевая функция ─────────────────────────────────────────
async function fightWildPokemon(page) {
  for (let round = 0; round < 50; round++) {
    // Проверяем, не закончился ли бой
    const endMenu = await page.$('#battle-end-menu');
    if (endMenu && await endMenu.isVisible()) return;

    // Нажимаем на доступную атаку
    for (let i = 0; i < 4; i++) {
      const btn = await page.$(`#move-btn-${i}`);
      if (!btn) continue;
      const visible = await btn.isVisible().catch(() => false);
      if (!visible) continue;
      const text = await btn.textContent();
      if (text && text !== '-' && text.trim()) {
        await btn.click();
        await page.waitForTimeout(2000);
        break;
      }
    }

    // Если бой закончился после атаки
    if (endMenu && await endMenu.isVisible()) return;
  }
}

// ── Ожидание встречи ──────────────────────────────────────
async function waitForEncounter(page, timeout = 35000) {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    try {
      const modal = await page.$('#encounter-modal');
      if (modal) {
        const display = await page.evaluate(() => {
          return document.getElementById('encounter-modal')?.style?.display;
        });
        if (display === 'flex') return true;
      }
    } catch(e) {}
    await page.waitForTimeout(500);
  }
  return false;
}

// ── Main ───────────────────────────────────────────────────
async function main() {
  // Создаём output папку
  try { mkdirSync(resolve('test-output'), { recursive: true }); } catch(e) {}

  // Локации для теста
  const testLocations = [
    'pallet_town',      // Pidgey, Rattata
    'viridian_forest',  // Caterpie, Weedle
    'mt_moon',          // Zubat, Clefairy
    'route_2',          // Pidgey, Rattata
    'viridian_city',    // Various Kanto
    'pewter_city',      // Geodude
    'cerulean_city',    // Various water
    'vermilion_city',   // Water/Electric
    'route_40',         // Johto
    'goldenrod',        // Johto hub
  ];

  for (let i = 0; i < testLocations.length; i++) {
    const result = await runDropTest(testLocations[i], i + 1);
    RESULTS.push(result);
  }

  // ── ИТОГОВАЯ СВОДКА ──────────────────────────────────────
  console.log('\n\n' + '='.repeat(60));
  console.log('📊 ИТОГОВАЯ СВОДКА ПО ВСЕМ ТЕСТАМ');
  console.log('='.repeat(60));

  let totalBattles = 0;
  let totalDrops = 0;
  let totalErrors = 0;
  const allDrops = [];

  for (const r of RESULTS) {
    totalBattles += r.battlesFought;
    totalDrops += r.dropsFound.length;
    totalErrors += r.errors.length;
    allDrops.push(...r.dropsFound);
    console.log(`\n📍 ${r.location}: ${r.battlesFought} боёв | ${r.dropsFound.length} дропов | ${r.errors.length} ошибок`);
    if (r.wildEncounters.length > 0) {
      console.log(`  🐾 Встречи: ${r.wildEncounters.join(', ')}`);
    }
    if (r.dropsFound.length > 0) {
      r.dropsFound.forEach(d => console.log(`  🎁 ${d.pokemon}: ${d.text}`));
    }
    if (r.errors.length > 0) {
      r.errors.forEach(e => console.log(`  ❌ ${e}`));
    }
  }

  console.log(`\n${'='.repeat(60)}`);
  console.log(`📈 Всего боёв: ${totalBattles}`);
  console.log(`📈 Всего дропов: ${totalDrops}`);
  console.log(`❌ Всего ошибок: ${totalErrors}`);

  if (totalDrops === 0 && totalBattles > 0) {
    console.log('\n⚠️ ВАЖНО: Бои были, но дроп не обнаружен!');
    console.log('   Это может означать:');
    console.log('   1. Дроп не выпал из-за рандома (шансы < 5-50%)');
    console.log('   2. Дроп не отображается в логе боя');
    console.log('   3. Дроп не доходит до инвентаря');
  } else if (totalDrops > 0) {
    console.log('\n✅ Дроп обнаружен! Проверьте test-output/results.json');
  }

  // Сохраняем детальные результаты
  try {
    writeFileSync(resolve('test-output', 'results.json'), JSON.stringify(RESULTS, null, 2), 'utf8');
    console.log('\n📝 Результаты сохранены в test-output/results.json');
  } catch(e) {
    console.log(`\n⚠️ Не удалось сохранить results.json: ${e.message}`);
  }

  process.exit(totalErrors > 5 ? 1 : 0);
}

main();
