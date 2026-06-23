// Tutorial system — onboarding, interactive lessons, help (Неделя 12)

// Tutorial steps definition
export interface TutorialStep {
  id: string;
  title: string;
  text: string;
  icon: string;
  targetSelector?: string;   // CSS selector to highlight
  action?: string;           // 'click_nav', 'click_button', 'wait'
  actionTarget?: string;     // selector or nav target
  lesson?: string;           // lesson id if part of a lesson
}

interface TutorialLesson {
  id: string;
  title: string;
  desc: string;
  icon: string;
  steps: TutorialStep[];
}

const TUTORIAL_LESSONS: TutorialLesson[] = [
  {
    id: 'basics',
    title: 'Основы игры',
    desc: 'Узнайте как играть в Pokemon TMA',
    icon: '🎓',
    steps: [
      { id: 'welcome', title: 'Добро пожаловать!', text: 'Это покемон-мир в Telegram. Начните своё приключение с выбора стартового покемона.', icon: '👋', action: 'wait' },
      { id: 'nav_team', title: 'Ваша команда', text: 'Во вкладке "Команда" вы видите своих покемонов. Нажмите на покемона чтобы выбрать его.', icon: '🐾', targetSelector: '.nav-item[data-target="view-team"]', action: 'click_nav', actionTarget: 'view-team' },
      { id: 'nav_world', title: 'Мир', text: 'На вкладке "Мир" вы видите текущую локацию. Здесь можно лечиться, искать диких покемонов и перемещаться.', icon: '🗺️', targetSelector: '.nav-item[data-target="view-world"]', action: 'click_nav', actionTarget: 'view-world' },
      { id: 'nav_backpack', title: 'Рюкзак', text: 'Во вкладке "Рюкзак" хранятся все ваши предметы: покеболы, зелья, эволюционные камни и многое другое.', icon: '🎒', targetSelector: '.nav-item[data-target="view-backpack"]', action: 'click_nav', actionTarget: 'view-backpack' },
      { id: 'nav_chat', title: 'Чат', text: 'Во вкладке "Чат" можно общаться с другими тренерами и задавать вопросы боту.', icon: '💬', targetSelector: '.nav-item[data-target="view-chat"]', action: 'click_nav', actionTarget: 'view-chat' },
    ]
  },
  {
    id: 'battles',
    title: 'Боевая система',
    desc: 'Как сражаться и побеждать',
    icon: '⚔️',
    steps: [
      { id: 'battle_intro', title: 'Битвы', text: 'Дикие покемоны встречаются на маршрутах. Нажмите "Искать" чтобы начать битву.', icon: '⚔️', action: 'wait' },
      { id: 'battle_moves', title: 'Атаки', text: 'У каждого покемона есть 4 атаки. Обращайте внимание на тип атаки — одни типы эффективнее других!', icon: '💥', action: 'wait' },
      { id: 'battle_types', title: 'Типы', text: 'Огонь силён против Травы, Вода против Огня, и так далее. Используйте таблицу типов в Пособии локации.', icon: '🔍', action: 'wait' },
      { id: 'battle_catch', title: 'Поимка', text: 'Ослабьте дикого покемона и используйте покебол. Чем ниже HP, тем выше шанс поимки!', icon: '🔴', action: 'wait' },
    ]
  },
  {
    id: 'breeding',
    title: 'Разведение',
    desc: 'Как получать яйца с лучшими IV',
    icon: '🥚',
    steps: [
      { id: 'breed_intro', title: 'Разведение', text: 'В питомнике (вкладка ПК) можно оставить двух совместимых покемонов для получения яйца.', icon: '🥚', action: 'wait' },
      { id: 'breed_ivs', title: 'IV и наследственность', text: 'IV (индивидуальные значения) ребёнка = среднее IV родителей ±2. Подбирайте пару с высокими IV!', icon: '📊', action: 'wait' },
      { id: 'breed_timer', title: 'Время инкубации', text: 'Яйца вылупляются через 3-8 дней. Если у родителей одинаковая природа — время сокращается.', icon: '⏱️', action: 'wait' },
    ]
  },
  {
    id: 'items',
    title: 'Предметы и Экипировка',
    desc: 'Использование предметов и холдеров',
    icon: '🎒',
    steps: [
      { id: 'items_use', title: 'Использование предметов', text: 'В рюкзаке нажмите на предмет чтобы использовать его. Зелья лечат, конфеты повышают уровень, витамины увеличивают EV.', icon: '💊', action: 'wait' },
      { id: 'items_held', title: 'Экипировка', text: 'Некоторые предметы можно дать покемону как холдер: Счастливое Яйцо (больше опыта), Распределитель Опыта и боевые предметы.', icon: '🎽', action: 'wait' },
      { id: 'items_ev', title: 'EV тренировки', text: 'EV (очки усилий) повышают статы. Максимум 510 суммарно, 252 на стат. Используйте витамины или тренируйтесь на диких покемонах.', icon: '💪', action: 'wait' },
    ]
  },
  {
    id: 'gyms',
    title: 'Гим Лидеры',
    desc: 'Как получать значки и проходить лигу',
    icon: '🏅',
    steps: [
      { id: 'gym_intro', title: 'Гим Лидеры', text: 'В каждом регионе есть лидеры гимов. Побеждайте их чтобы получать значки и продвигаться.', icon: '🏅', action: 'wait' },
      { id: 'gym_prep', title: 'Подготовка', text: 'Перед боем с лидером убедитесь что ваша команда готова: правильные типы, высокий уровень, хорошие предметы.', icon: '📋', action: 'wait' },
      { id: 'gym_elite', title: 'Элитная Четверка', text: 'После 8 значков вы можете бросить вызов Элитной Четверке. Победите всех четырёх и Чемпиона чтобы стать Легендой!', icon: '👑', action: 'wait' },
    ]
  },
  {
    id: 'pvp',
    title: 'PvP Битвы',
    desc: 'Как сражаться с другими тренерами',
    icon: '⚡',
    steps: [
      { id: 'pvp_intro', title: 'PvP режим', text: 'Вы можете сразиться с другими игроками в реальном времени. Нажмите "Поиск соперника" чтобы войти в очередь.', icon: '⚡', action: 'wait' },
      { id: 'pvp_rules', title: 'Правила', text: 'В PvP каждый выбирает атаку одновременно. Побеждает тот, кто лучше читает ходы соперника!', icon: '🧠', action: 'wait' },
    ]
  }
];

const TUTORIAL_KEY = 'league17_tutorial';
const HELP_SEEN_KEY = 'league17_help_seen';

let currentSteps: TutorialStep[] = [];
let currentStepIndex = 0;
let onComplete: (() => void) | null = null;
let highlightEl: HTMLElement | null = null;

// Check if tutorial has been completed
export function isTutorialComplete(): boolean {
  return localStorage.getItem(TUTORIAL_KEY) === 'complete';
}

export function markTutorialComplete() {
  localStorage.setItem(TUTORIAL_KEY, 'complete');
}

// Start a tutorial lesson
export function startLesson(lessonId: string, callback?: () => void) {
  const lesson = TUTORIAL_LESSONS.find(l => l.id === lessonId);
  if (!lesson) return;
  currentSteps = [...lesson.steps];
  currentStepIndex = 0;
  onComplete = callback || null;
  showCurrentStep();
}

// Start onboarding (first 3 lessons automatically)
export function startOnboarding(callback?: () => void) {
  if (isTutorialComplete()) {
    if (callback) callback();
    return;
  }

  // Show welcome
  currentSteps = TUTORIAL_LESSONS[0].steps.slice(0, 2); // Welcome + nav team
  currentStepIndex = 0;
  onComplete = () => {
    // After basics, start battles lesson
    startLesson('battles', () => {
      startLesson('items', () => {
        markTutorialComplete();
        if (callback) callback();
      });
    });
  };
  showCurrentStep();
}

function showCurrentStep() {
  if (currentStepIndex >= currentSteps.length) {
    finishTutorial();
    return;
  }

  const step = currentSteps[currentStepIndex];

  // Remove any existing overlay
  removeOverlay();

  const overlay = document.createElement('div');
  overlay.className = 'tutorial-overlay';
  overlay.id = 'tutorial-overlay';
  overlay.innerHTML = `
    <div class="tutorial-card">
      <div class="tutorial-icon">${step.icon}</div>
      <h3>${step.title}</h3>
      <p>${step.text}</p>
      <div class="tutorial-progress">
        ${currentSteps.map((s, i) =>
          `<span class="tutorial-dot ${i === currentStepIndex ? 'active' : ''} ${i < currentStepIndex ? 'completed' : ''}"></span>`
        ).join('')}
      </div>
      <div class="tutorial-buttons">
        <button class="tutorial-btn tutorial-btn-primary" id="tutorial-next">${currentStepIndex < currentSteps.length - 1 ? 'Далее →' : 'Готово!'}</button>
        <button class="tutorial-btn tutorial-btn-skip" id="tutorial-skip">Пропустить</button>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);

  // Highlight target element
  if (step.targetSelector) {
    const target = document.querySelector(step.targetSelector) as HTMLElement;
    if (target) {
      highlightEl = document.createElement('div');
      highlightEl.style.cssText = `
        position: fixed;
        pointer-events: none;
        border: 2px solid #4a9eff;
        border-radius: 8px;
        box-shadow: 0 0 0 9999px rgba(0,0,0,0.5), 0 0 12px rgba(74,158,255,0.5);
        z-index: 999;
        transition: all 0.3s ease;
      `;
      const rect = target.getBoundingClientRect();
      highlightEl.style.top = (rect.top - 4) + 'px';
      highlightEl.style.left = (rect.left - 4) + 'px';
      highlightEl.style.width = (rect.width + 8) + 'px';
      highlightEl.style.height = (rect.height + 8) + 'px';
      document.body.appendChild(highlightEl);
    }
  }

  // Event handlers
  document.getElementById('tutorial-next')?.addEventListener('click', () => {
    const s = currentSteps[currentStepIndex];
    if (s.action === 'click_nav' && s.actionTarget) {
      removeOverlay();
      navigateTo(s.actionTarget);
    }
    currentStepIndex++;
    // Clean up highlight
    if (highlightEl) { highlightEl.remove(); highlightEl = null; }
    showCurrentStep();
  });

  document.getElementById('tutorial-skip')?.addEventListener('click', () => {
    finishTutorial();
  });
}

function navigateTo(viewId: string) {
  // Trigger navigation by clicking the nav item
  const navItem = document.querySelector(`.nav-item[data-target="${viewId}"]`) as HTMLElement;
  if (navItem) navItem.click();
}

function finishTutorial() {
  removeOverlay();
  if (highlightEl) { highlightEl.remove(); highlightEl = null; }
  currentSteps = [];
  currentStepIndex = 0;
  if (onComplete) {
    const cb = onComplete;
    onComplete = null;
    cb();
  }
}

function removeOverlay() {
  const existing = document.getElementById('tutorial-overlay');
  if (existing) existing.remove();
  // Clean up any highlight from other lessons
  document.querySelectorAll('[style*="z-index: 999"]').forEach(el => {
    if (el !== highlightEl) el.remove();
  });
}

// ================================================================
// HELP SYSTEM
// ================================================================

const HELP_SECTIONS = [
  {
    title: '⚔️ Битвы',
    content: `<p>Дикие покемоны встречаются на маршрутах и в других локациях. Нажмите "Искать" чтобы начать битву.</p>
    <p><strong>Типы атак:</strong><br>
    🔴 Физические — зависят от ATK и DEF<br>
    🔵 Специальные — зависят от SPA и SPD<br>
    🟢 Статусные — накладывают эффекты</p>
    <p><strong>Шанс поимки:</strong> чем ниже HP и сильнее статус, тем выше шанс.</p>`
  },
  {
    title: '🎒 Предметы',
    content: `<p>Предметы можно купить в магазинах, получить за квесты или найти на диких покемонах (дроп).</p>
    <p><strong>Эволюционные камни:</strong> используются в инвентаре на подходящем покемоне.</p>
    <p><strong>Холдеры:</strong> Счастливое Яйцо (+50% опыта), Распределитель Опыта (50% опыта всей команде).</p>`
  },
  {
    title: '📊 IV и EV',
    content: `<p><strong>IV</strong> (0-31 на стат) — врождённые значения, не меняются. Выше = лучше.</p>
    <p><strong>EV</strong> (0-252 на стат, 510 макс) — тренируемые очки. Повышаются витаминами или боями.</p>
    <p>В профиле покемона: синие цифры = IV, зелёные = EV.</p>`
  },
  {
    title: '🥚 Разведение',
    content: `<p>Оставьте двух совместимых покемонов в одной ячейке питомника (вкладка ПК → Питомник).</p>
    <p>Время инкубации: 3-8 дней. Одинаковая природа ускоряет.</p>
    <p>IV ребёнка = среднее IV родителей ±2 (каждый IV независимо).</p>`
  },
  {
    title: '🏅 Гим Лидеры',
    content: `<p>В каждом регионе есть несколько гимов. Победите лидера чтобы получить значок.</p>
    <p>После 8 значков открывается доступ к Элитной Четверке и Чемпиону.</p>
    <p>Лиги: Канто (8 значков) → Джото (8 значков) → и так далее.</p>`
  },
  {
    title: '🗺️ Карта и Локации',
    content: `<p>Перемещайтесь между локациями через панель "Переходы". Некоторые локации требуют определённые предметы (билеты).</p>
    <p>На карте регионов отображаются все локации. Посещённые локации подсвечиваются синим.</p>`
  },
  {
    title: '💬 Чат и Тренеры',
    content: `<p>В чате можно общаться с другими игроками. Бот Claude AI отвечает на вопросы о покемонах.</p>
    <p>Во вкладке "Тренеры" можно увидеть всех зарегистрированных игроков и их профили.</p>`
  },
  {
    title: '⚡ PvP Битвы',
    content: `<p>Сражайтесь с другими игроками в реальном времени через Socket.IO.</p>
    <p>Каждый ход оба игрока выбирают атаку, сервер разрешает результат.</p>
    <p>Победы повышают ваш PvP рейтинг (ELO).</p>`
  },
];

export function openHelp() {
  // Remove existing help modal
  document.querySelectorAll('.help-modal').forEach(el => el.remove());

  const modal = document.createElement('div');
  modal.className = 'help-modal';
  modal.innerHTML = `
    <div class="help-card">
      <h2>📖 Справка</h2>
      ${HELP_SECTIONS.map(s =>
        `<div class="help-section" data-help="${s.title}">
          <h4>${s.title}</h4>
          ${s.content.slice(0, 60)}…
        </div>`
      ).join('')}
      <div style="text-align:center;margin-top:14px;">
        <button class="tutorial-btn tutorial-btn-secondary" id="help-close">Закрыть</button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);

  // Click section to expand
  modal.querySelectorAll('.help-section').forEach(el => {
    el.addEventListener('click', () => {
      const title = (el as HTMLElement).dataset.help;
      const section = HELP_SECTIONS.find(s => s.title === title);
      if (!section) return;
      el.innerHTML = `<h4>${section.title}</h4>${section.content}`;
      (el as HTMLElement).style.cursor = 'default';
    });
  });

  document.getElementById('help-close')?.addEventListener('click', () => modal.remove());

  // Mark help as seen
  localStorage.setItem(HELP_SEEN_KEY, 'true');
}

export function isHelpSeen(): boolean {
  return localStorage.getItem(HELP_SEEN_KEY) === 'true';
}

// ================================================================
// EXPLORATION PROGRESS (Неделя 11.4)
// ================================================================
import { REGIONS } from '../data/regions.js';

export function getExplorationProgress(): { total: number; visited: number; pct: number } {
  const visitedStr = localStorage.getItem('league17_explored_locs') || '[]';
  let visited: string[];
  try { visited = JSON.parse(visitedStr); } catch { visited = []; }

  let total = 0;
  for (const region of Object.values(REGIONS) as any[]) {
    total += Object.keys(region.locations || {}).length;
  }

  return {
    total,
    visited: visited.length,
    pct: total > 0 ? Math.round((visited.length / total) * 100) : 0,
  };
}

export function markLocationExplored(locId: string) {
  const visitedStr = localStorage.getItem('league17_explored_locs') || '[]';
  let visited: string[];
  try { visited = JSON.parse(visitedStr); } catch { visited = []; }
  if (!visited.includes(locId)) {
    visited.push(locId);
    localStorage.setItem('league17_explored_locs', JSON.stringify(visited));
  }
}

export function getExploredLocations(): string[] {
  const visitedStr = localStorage.getItem('league17_explored_locs') || '[]';
  try { return JSON.parse(visitedStr); } catch { return []; }
}
