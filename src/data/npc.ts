export const NPC_DATA = {
  'oak_lab': {
    id: 'oak_lab', name: 'Профессор Оук', sprite: '👨‍🔬', location: 'cerulean_city',
    dialog: {
      greet: 'Привет! Я профессор Оук. Рад видеть тебя в мире покемонов!',
      default: 'Продолжай тренироваться и заполнять Покедекс!',
      quest_offer: 'Мне нужны образцы покемонов. Принеси мне {target} {item}, и я дам награду.',
      quest_complete: 'Отлично! Ты принёс всё что нужно. Вот твоя награда!',
      quest_incomplete: 'Ещё не всё собрано. Продолжай искать!',
    },
    quests: [
      { id: 'oak_research_1', type: 'collect_items', targetItem: 'venonatHair', targetQty: 3, desc: 'Принесите 3 Волоска Веноната', rewardMoney: 500, rewardItem: 'pokeBall', rewardQty: 5, prereqQuest: null },
      { id: 'oak_research_2', type: 'collect_items', targetItem: 'parasSpores', targetQty: 2, desc: 'Принесите 2 Спора Параса', rewardMoney: 800, rewardItem: 'candy', rewardQty: 3, prereqQuest: 'oak_research_1' },
    ],
  },
  // Nurse Joy in Pokemon Center
  'joy_pokecenter': {
    id: 'joy_pokecenter', name: 'Сестра Джой', sprite: '👩‍⚕️', location: 'pokecenter',
    dialog: {
      greet: 'Добро пожаловать в Покецентр! Я могу вылечить ваших покемонов.',
      default: 'Ваши покемоны в порядке? Заходите если нужна помощь.',
    },
    quests: [],
  },

  // Daycare in Pokemon Center
  'daycare_pokecenter': {
    id: 'daycare_pokecenter', name: 'Смотритель Питомника', sprite: '👴', location: 'pokecenter',
    dialog: {
      greet: 'Добро пожаловать в Питомник! Здесь ваши покемоны могут набираться опыта.',
      default: 'Покемоны растут пока вы путешествуете. Оставьте пару — они поднимут уровень!',
    },
    quests: [],
  },

  // Tutorial NPC at starting location
  // === EAST JOHTO NPCs ===
  'goldenrod_officer': {
    id: 'goldenrod_officer', name: 'Офицер Джес', sprite: '👮', location: 'goldenrod',
    dialog: { greet: 'Добро пожаловать в Голденрод — столицу Восточного Джото!', default: 'Если заметите нарушения правил Лиги-17, обращайтесь ко мне.', quest_offer: 'Новичкам нужно снаряжение. Принеси мне {target} {item}.', quest_complete: 'Отлично! Теперь ты экипирован.', quest_incomplete: 'Приходи когда соберёшь всё.' },
    quests: [{ id: 'gold_1', type: 'collect_items', targetItem: 'potion', targetQty: 3, desc: 'Принесите 3 Зелья', rewardMoney: 300, rewardItem: 'pokeBall', rewardQty: 5, prereqQuest: null }],
  },
  'goldenrod_michael': {
    id: 'goldenrod_michael', name: 'Майкл', sprite: '🕵️', location: 'goldenrod',
    dialog: { greet: 'Помогите! Похитили Батискафиш!', default: 'Квест "Похищение Батискафиш" ждёт тебя.', quest_offer: 'Найди похитителей! Принеси мне {target} {item} как улику.', quest_complete: 'Ты нашёл их! Спасибо!', quest_incomplete: 'Ищи улики в городе...' },
    quests: [{ id: 'gold_2', type: 'defeat_x', targetItem: null, targetQty: 5, desc: 'Победите 5 диких покемонов в поисках улик', rewardMoney: 800, rewardItem: 'greatBall', rewardQty: 3, prereqQuest: 'gold_1' }],
  },
  'goldenrod_phill': {
    id: 'goldenrod_phill', name: 'Филл', sprite: '🔬', location: 'goldenrod',
    dialog: { greet: 'Покемоны исчезают из Института Голденрода!', default: 'Это загадка, которую нужно разгадать.', quest_offer: 'Для расследования мне нужны {target} {item}.', quest_complete: 'Превосходная работа, тренер!', quest_incomplete: 'Нужно больше данных...' },
    quests: [{ id: 'gold_3', type: 'catch_x', targetItem: null, targetQty: 3, desc: 'Поймайте 3 покемонов для исследования института', rewardMoney: 600, rewardItem: 'candy', rewardQty: 3, prereqQuest: 'gold_2' }, { id: 'gold_4', type: 'explore', targetItem: null, targetQty: 3, desc: 'Посетите 3 исследовательских центра', rewardMoney: 1000, rewardItem: 'tm', rewardQty: 2, prereqQuest: 'gold_3' }],
  },
  'goldenrod_academy_soren': {
    id: 'goldenrod_academy_soren', name: 'Инструктор Сорен', sprite: '👨‍🏫', location: 'goldenrod_academy',
    dialog: { greet: 'Я инструктор Сорен из Академии Тренеров.', default: 'Практикум по Эволюции ждёт тебя! Обратись к Лаборанту на Тренировочной зоне.', quest_offer: 'Принеси мне {target} {item} для эволюционного эксперимента.', quest_complete: 'Отлично! Эволюция удалась!', quest_incomplete: 'Нужно больше покемонов для эксперимента.' },
    quests: [{ id: 'academy_evolve', type: 'catch_x', targetItem: null, targetQty: 3, desc: 'Поймайте 3 покемонов одной эволюционной цепочки для практикума', rewardMoney: 50000, rewardItem: 'candy', rewardQty: 5, prereqQuest: null }],
  },
  'goldenrod_academy_jack': {
    id: 'goldenrod_academy_jack', name: 'Инструктор Джек', sprite: '👨‍🏫', location: 'goldenrod_academy',
    dialog: { greet: 'Я инструктор Джек. Оливии на Дороге №2 нужна помощь.', default: 'Первый малыш — ответственный шаг для тренера.', quest_offer: 'Принеси мне {target} {item} для питомника Оливии.', quest_complete: 'Оливия будет довольна!', quest_incomplete: 'Яйцо ещё не доставлено...' },
    quests: [{ id: 'academy_first_baby', type: 'collect_items', targetItem: 'egg', targetQty: 1, desc: 'Принесите 1 яйцо покемона для питомника Оливии', rewardMoney: 50000, rewardItem: 'candy', rewardQty: 3, prereqQuest: null }],
  },
  'goldenrod_academy_olin': {
    id: 'goldenrod_academy_olin', name: 'Инструктор Олин', sprite: '👨‍🏫', location: 'goldenrod_academy',
    dialog: { greet: 'Инструктор Олин. Готовься к тренировкам в Вархолле!', default: 'Кевин в спортивном зале Вархолла ждёт тебя.', quest_offer: 'Подготовь {target} {item} для тренировки.', quest_complete: 'Отлично! Ты готов к настоящим боям!', quest_incomplete: 'Тренировка ещё не завершена.' },
    quests: [{ id: 'academy_gym', type: 'defeat_x', targetItem: null, targetQty: 6, desc: 'Подготовьте 6 покемонов 25+ уровня для боя с Кевином в Вархолле', rewardMoney: 30000, rewardItem: 'superPotion', rewardQty: 3, prereqQuest: null }],
  },
  'goldenrod_academy_lab_assistant': {
    id: 'goldenrod_academy_lab_assistant', name: 'Лаборант', sprite: '🔬', location: 'goldenrod_academy_training',
    dialog: { greet: 'Лаборант тренировочной зоны. Сорен прислал тебя?', default: 'Собирай эволюционные цепочки для экспериментов.', quest_offer: 'Принеси {target} {item} для лаборатории.', quest_complete: 'Прекрасный материал!', quest_incomplete: 'Нужны ещё образцы.' },
    quests: [{ id: 'academy_lab_assist', type: 'collect_items', targetItem: 'rockSample', targetQty: 3, desc: 'Принесите 3 образца для лаборатории Академии', rewardMoney: 10000, rewardItem: 'pokeBall', rewardQty: 5, prereqQuest: 'academy_evolve' }],
  },
  'olivine_cashier': {
    id: 'olivine_cashier', name: 'Кассир', sprite: '🎫', location: 'olivine_beach_pier',
    dialog: { greet: 'Билеты на корабль до Канто и Селена!', default: 'Расписание: 10, 14, 18, 22 часа.', quest_offer: 'Матросы просят {target} {item} для ремонта.', quest_complete: 'Корабль готов к плаванию!', quest_incomplete: 'Ремонт ещё не закончен...' },
    quests: [{ id: 'oli_1', type: 'collect_items', targetItem: 'crystalShard', targetQty: 3, desc: 'Принесите 3 осколка кристалла для порта', rewardMoney: 500, rewardItem: 'superPotion', rewardQty: 2, prereqQuest: null }, { id: 'oli_2', type: 'explore', targetItem: null, targetQty: 3, desc: 'Посетите 3 портовых города', rewardMoney: 800, rewardItem: 'waterStone', rewardQty: 1, prereqQuest: 'oli_1' }],
  },
  'olivine_secretary': { id: 'olivine_secretary', name: 'Секретарь Лидера', sprite: '📋', location: 'olivine_water_stadium', dialog: { greet: 'Водный Стадион Оливина.', default: 'Лидер ждёт смелых.' }, quests: [] },
  'flourence_gardener': {
    id: 'flourence_gardener', name: 'Садовник Флор', sprite: '🌸', location: 'flourence',
    dialog: { greet: 'Флауренция — город цветов! Хочешь помочь в оранжерее?', default: 'Цветы и травяные покемоны — идеальная пара.', quest_offer: 'Принеси мне {target} {item} для новых саженцев.', quest_complete: 'Чудесно! Приходи ещё.', quest_incomplete: 'Растениям нужна подкормка...' },
    quests: [{ id: 'flo_1', type: 'collect_items', targetItem: 'plantSample', targetQty: 4, desc: 'Принесите 4 Образца растений', rewardMoney: 400, rewardItem: 'leafStone', rewardQty: 1, prereqQuest: null }],
  },
  'warhall_mayor': {
    id: 'warhall_mayor', name: 'Мэр Вархолла', sprite: '🏛️', location: 'warhall',
    dialog: { greet: 'Вархолл — новый город с древней историей ниндзя.', default: 'Автовокзал работает по расписанию.', quest_offer: 'Для города нужны стройматериалы: {target} {item}.', quest_complete: 'Город растёт благодаря тебе!', quest_incomplete: 'Стройка продолжается...' },
    quests: [{ id: 'war_1', type: 'collect_items', targetItem: 'rockSample', targetQty: 5, desc: 'Принесите 5 Образцов породы', rewardMoney: 700, rewardItem: 'duskStone', rewardQty: 1, prereqQuest: null }],
  },
  'alston_circus': {
    id: 'alston_circus', name: 'Директор цирка', sprite: '🎪', location: 'alston',
    dialog: { greet: 'Добро пожаловать в цирк Олстона! Наши покемоны-артисты лучшие!', default: 'Цирк основан бродячими артистами.', quest_offer: 'Для нового номера нужны {target} {item}.', quest_complete: 'Браво! Потрясающее выступление!', quest_incomplete: 'Репетиции идут полным ходом...' },
    quests: [{ id: 'als_1', type: 'catch_x', targetItem: null, targetQty: 2, desc: 'Поймайте 2 покемонов для цирка', rewardMoney: 500, rewardItem: 'tm', rewardQty: 1, prereqQuest: null }],
  },
  // === WEST JOHTO NPCs ===
  'summer_institute': {
    id: 'summer_institute', name: 'Учёный Саммера', sprite: '🔬', location: 'summer',
    dialog: { greet: 'Научный институт Саммера исследует редких покемонов саванны.', default: 'Саванна полна загадок.', quest_offer: 'Принеси мне {target} {item} для исследований.', quest_complete: 'Отличный образец! Это продвинет науку.', quest_incomplete: 'Лаборатория ждёт образцов...' },
    quests: [{ id: 'sum_1', type: 'collect_items', targetItem: 'lavaCore', targetQty: 2, desc: 'Принесите 2 ядра магмы для института', rewardMoney: 800, rewardItem: 'fireStone', rewardQty: 1, prereqQuest: null }],
  },
  'summer_gibson': {
    id: 'summer_gibson', name: 'Мистер Гибсон', sprite: '🤠', location: 'summer',
    dialog: { greet: 'Я ищу Земли Прайда. Поможешь?', default: 'Земли Прайда ждут своего героя.', quest_offer: 'Подготовься: собери {target} {item} перед походом.', quest_complete: 'Ты готов! Отправляемся в Земли Прайда!', quest_incomplete: 'Снаряжение ещё не полное...' },
    quests: [{ id: 'sum_2', type: 'defeat_x', targetItem: null, targetQty: 4, desc: 'Победите 4 диких покемонов в саванне', rewardMoney: 600, rewardItem: 'superPotion', rewardQty: 3, prereqQuest: 'sum_1' }, { id: 'sum_3', type: 'explore', targetItem: null, targetQty: 4, desc: 'Исследуйте 4 локации Западного Джото', rewardMoney: 1000, rewardItem: 'sunStone', rewardQty: 1, prereqQuest: 'sum_2' }],
  },
  'melen_diver': {
    id: 'melen_diver', name: 'Дайвер Мелена', sprite: '🤿', location: 'melen',
    dialog: { greet: 'Дайвинг-центр Мелена — лучший в Джото!', default: 'Под водой скрываются редкие покемоны.', quest_offer: 'Нужен {target} {item} для нового снаряжения.', quest_complete: 'Снаряжение готово! Ныряем!', quest_incomplete: 'Мастерская масок поможет...' },
    quests: [{ id: 'mel_1', type: 'collect_items', targetItem: 'crystalShard', targetQty: 2, desc: 'Принесите 2 Осколка кристалла', rewardMoney: 500, rewardItem: 'waterStone', rewardQty: 1, prereqQuest: null }],
  },
  // === SELEN ISLAND NPCs ===
  'ostaron_sage': {
    id: 'ostaron_sage', name: 'Мудрец Остарона', sprite: '🧙', location: 'ostaron',
    dialog: { greet: 'Остарон благословлён легендарным покемоном.', default: 'Мудрость приходит с опытом.', quest_offer: 'Помоги найти пропавшего Меррипика: нужен {target} {item}.', quest_complete: 'Ты нашёл его! Благословляю тебя.', quest_incomplete: 'Меррипик где-то на острове...' },
    quests: [{ id: 'ost_1', type: 'explore', targetItem: null, targetQty: 5, desc: 'Посетите 5 локаций острова Селен', rewardMoney: 1000, rewardItem: 'iceStone', rewardQty: 1, prereqQuest: null }],
  },
  'ostaron_chris': {
    id: 'ostaron_chris', name: 'Крис-покемоновед', sprite: '📋', location: 'ostaron',
    dialog: { greet: 'Я перевоспитываю покемонов! 90% шанс сменить характер.', default: 'Характер влияет на статы.', quest_offer: 'Принеси {target} {item} для моих подопечных.', quest_complete: 'Покемоны счастливы! Спасибо!', quest_incomplete: 'Покемоны ждут угощения...' },
    quests: [{ id: 'ost_2', type: 'use_item', targetItem: null, targetQty: 3, desc: 'Используйте 3 предмета на покемонах', rewardMoney: 400, rewardItem: 'candy', rewardQty: 5, prereqQuest: 'ost_1' }],
  },
  'sayref_mayor': {
    id: 'sayref_mayor', name: 'Мэр Сайрефа', sprite: '🏛️', location: 'sayref',
    dialog: { greet: 'Сайреф соперничает с Остароном за звание столицы!', default: 'Наш снеговик — символ города.', quest_offer: 'Укрепи позиции города: принеси {target} {item}.', quest_complete: 'Сайреф процветает!', quest_incomplete: 'Город нуждается в ресурсах...' },
    quests: [{ id: 'say_1', type: 'collect_items', targetItem: 'rockSample', targetQty: 4, desc: 'Принесите 4 Образца породы', rewardMoney: 600, rewardItem: 'dawnStone', rewardQty: 1, prereqQuest: null }],
  },
  'estaire_shipyard': {
    id: 'estaire_shipyard', name: 'Мастер верфи', sprite: '🔧', location: 'estaire_city',
    dialog: { greet: 'Верфь Эстайра строит лучшие корабли!', default: 'Мы строим и чиним корабли.', quest_offer: 'Для заказа нужны {target} {item}.', quest_complete: 'Корабль готов к спуску!', quest_incomplete: 'Детали в дефиците...' },
    quests: [{ id: 'est_1', type: 'collect_items', targetItem: 'magnemiteNut', targetQty: 3, desc: 'Принесите 3 Магнитные гайки', rewardMoney: 700, rewardItem: 'shinyStone', rewardQty: 1, prereqQuest: null }],
  },
  'mountain_village_elder': {
    id: 'mountain_village_elder', name: 'Старейшина деревни', sprite: '👴', location: 'mountain_village',
    dialog: { greet: 'Добро пожаловать в нашу горную деревню, путник.', default: 'Горы хранят древние тайны.', quest_offer: 'Найди {target} {item} в ледяных пещерах.', quest_complete: 'Ты достоин уважения гор.', quest_incomplete: 'Горы испытают тебя...' },
    quests: [{ id: 'mv_1', type: 'defeat_x', targetItem: null, targetQty: 5, desc: 'Победите 5 покемонов в горах', rewardMoney: 900, rewardItem: 'iceStone', rewardQty: 1, prereqQuest: null }],
  },
  // === SOUTHERN ARCHIPELAGO NPCs ===
  'ilde_marcel': {
    id: 'ilde_marcel', name: 'Марсель де Фар', sprite: '🧭', location: 'il_de_far',
    dialog: { greet: 'Добро пожаловать в Иль де Фар — сердце Южного Архипелага!', default: 'Здесь вы найдёте редких покемонов и удивительные места.', quest_offer: 'Для исследования островов нужен {target} {item}.', quest_complete: 'Ты готов к приключениям! Исследуй архипелаг.', quest_incomplete: 'Подготовься получше...' },
    quests: [{ id: 'sa_1', type: 'explore', targetItem: null, targetQty: 3, desc: 'Посетите 3 локации Архипелага', rewardMoney: 800, rewardItem: 'masterBall', rewardQty: 1, prereqQuest: null }],
  },
  'sen_aspir_elder': {
    id: 'sen_aspir_elder', name: 'Старейшина Сен Аспира', sprite: '🧓', location: 'sen_aspir',
    dialog: { greet: 'Сен Аспир построен у подножия вулкана Синнабунг.', default: 'Вулкан даёт нам силу.', quest_offer: 'Принеси мне {target} {item} с вулканических склонов.', quest_complete: 'Вулкан благосклонен к тебе!', quest_incomplete: 'Вулкан ждёт подношений...' },
    quests: [{ id: 'sa_2', type: 'collect_items', targetItem: 'lavaCore', targetQty: 3, desc: 'Принесите 3 ядра магмы для старейшины', rewardMoney: 1000, rewardItem: 'fireStone', rewardQty: 1, prereqQuest: 'sa_1' }],
  },
  'orlua_ghost': {
    id: 'orlua_ghost', name: 'Призрак поместья', sprite: '👻', location: 'orlua_estate',
    dialog: { greet: 'Добро пожаловать в моё поместье... навсегда.', default: 'Здесь обитают духи покемонов.', quest_offer: 'Освободи меня: найди {target} {item}.', quest_complete: 'Спасибо... я свободен...', quest_incomplete: 'Я жду освобождения...' },
    quests: [{ id: 'sa_3', type: 'catch_x', targetItem: null, targetQty: 2, desc: 'Поймайте 2 призрачных покемонов для освобождения', rewardMoney: 1500, rewardItem: 'duskStone', rewardQty: 1, prereqQuest: 'sa_2' }],
  },
  // === EAST JOHTO QUEST NPCs (from wiki quests) ===
  'ej_storn': {
    id: 'ej_storn', name: 'Сторн', sprite: '🦸', location: 'goldenrod',
    dialog: { greet: 'Я Сторн! Собери Великолепную Пятёрку!', default: 'Великолепная Пятёрка ждёт тебя.', quest_offer: 'Принеси мне {target} {item} для команды.', quest_complete: 'Теперь мы непобедимы!', quest_incomplete: 'Пятёрка ещё не в сборе...' },
    quests: [{ id: 'ej_storn_1', type: 'catch_x', targetItem: null, targetQty: 5, desc: 'Поймайте 5 разных покемонов', rewardMoney: 1000, rewardItem: 'greatBall', rewardQty: 5, prereqQuest: null }],
  },
  'ej_bridge': {
    id: 'ej_bridge', name: 'Дядюшка Бридж', sprite: '👴', location: 'bridge_ej',
    dialog: { greet: 'Привет, путник! Я Дядюшка Бридж.', default: 'Мост соединяет судьбы.', quest_offer: 'Мне нужны материалы: {target} {item}.', quest_complete: 'Мост будет стоять вечно!', quest_incomplete: 'Мост требует ремонта...' },
    quests: [{ id: 'ej_bridge_1', type: 'collect_items', targetItem: 'rockSample', targetQty: 3, desc: 'Принесите 3 Образца породы', rewardMoney: 400, rewardItem: 'potion', rewardQty: 5, prereqQuest: null }],
  },
  'ej_palmer': {
    id: 'ej_palmer', name: 'Несчастный Пальмер', sprite: '😰', location: 'alston',
    dialog: { greet: 'Ох... всё пошло не так...', default: 'Моя жизнь — череда неудач.', quest_offer: 'Помоги мне: нужен {target} {item}.', quest_complete: 'Наконец-то удача! Спасибо!', quest_incomplete: 'Опять не везёт...' },
    quests: [{ id: 'ej_palmer_1', type: 'defeat_x', targetItem: null, targetQty: 3, desc: 'Победите 3 диких покемонов', rewardMoney: 500, rewardItem: 'luckyEgg', rewardQty: 1, prereqQuest: null }],
  },
  'ej_granny': {
    id: 'ej_granny', name: 'Старушка', sprite: '👵', location: 'flourence',
    dialog: { greet: 'Здравствуй, милок. Собираю камушки.', default: 'Камушки рассказывают истории.', quest_offer: 'Найди мне {target} {item}, будь добр.', quest_complete: 'Чудесные камушки! Держи награду.', quest_incomplete: 'Камушки где-то рядом...' },
    quests: [{ id: 'ej_granny_1', type: 'collect_items', targetItem: 'crystalShard', targetQty: 5, desc: 'Принесите 5 Осколков кристалла', rewardMoney: 300, rewardItem: 'shinyStone', rewardQty: 1, prereqQuest: null }],
  },
  'ej_richie': {
    id: 'ej_richie', name: 'Богатенький Ричи', sprite: '💰', location: 'goldenrod',
    dialog: { greet: 'Ха! Ещё один бедняк. Я Ричи — самый богатый в Джото!', default: 'Деньги решают всё.', quest_offer: 'Мне нужна редкая вещь: {target} {item}. Заплачу щедро!', quest_complete: 'Великолепно! Вот твоя награда, бедняк.', quest_incomplete: 'Где мой заказ?!' },
    quests: [{ id: 'ej_richie_1', type: 'collect_items', targetItem: 'lavaCore', targetQty: 2, desc: 'Принесите Ричи 2 Ядра магмы', rewardMoney: 3000, rewardItem: 'masterBall', rewardQty: 1, prereqQuest: null }],
  },
  'vermilion_richie': {
    id: 'vermilion_richie', name: 'Богатенький Ричи', sprite: '💰', location: 'vermilion',
    dialog: { greet: 'Ха! Ещё один бедняк. Я Ричи — самый богатый коллекционер!', default: 'Деньги решают всё.', quest_offer: 'Мне нужна редкая вещь: {target} {item}. Заплачу щедро!', quest_complete: 'Великолепно! Вот твоя награда, бедняк.', quest_incomplete: 'Где мой заказ?!' },
    quests: [{ id: 'vermilion_richie_1', type: 'collect_items', targetItem: 'lavaCore', targetQty: 2, desc: 'Принесите Ричи 2 Ядра магмы', rewardMoney: 3000, rewardItem: 'masterBall', rewardQty: 1, prereqQuest: null }],
  },
  'ostaron_richie': {
    id: 'ostaron_richie', name: 'Богатенький Ричи', sprite: '💰', location: 'ostaron',
    dialog: { greet: 'Ха! И здесь бедняки! Я Ричи — коллекционер редкостей!', default: 'Деньги решают всё.', quest_offer: 'Мне нужна редкая вещь: {target} {item}. Заплачу щедро!', quest_complete: 'Великолепно! Вот твоя награда, бедняк.', quest_incomplete: 'Где мой заказ?!' },
    quests: [{ id: 'ostaron_richie_1', type: 'collect_items', targetItem: 'lavaCore', targetQty: 2, desc: 'Принесите Ричи 2 Ядра магмы', rewardMoney: 3000, rewardItem: 'masterBall', rewardQty: 1, prereqQuest: null }],
  },
  'saffron_officer': {
    id: 'saffron_officer', name: 'Офицер Джес', sprite: '👮', location: 'saffron',
    dialog: { greet: 'Офицер Джес из Канто. Слежу за порядком.', default: 'Если заметите нарушения правил Лиги-17, обращайтесь ко мне.', quest_offer: 'Новичкам нужно снаряжение. Принеси мне {target} {item}.', quest_complete: 'Отлично! Теперь ты экипирован.', quest_incomplete: 'Приходи когда соберёшь всё.' },
    quests: [{ id: 'saffron_1', type: 'collect_items', targetItem: 'potion', targetQty: 3, desc: 'Принесите 3 Зелья', rewardMoney: 300, rewardItem: 'pokeBall', rewardQty: 5, prereqQuest: null }, { id: 'saffron_terror', type: 'explore', targetItem: null, targetQty: 3, desc: 'Разберитесь в причине нападений диких покемонов в Лавандии — посетите 3 локации', rewardMoney: 0, rewardItem: 'tm', rewardQty: 1, prereqQuest: null }],
  },
  // === WEST JOHTO QUEST NPCs ===
  'wj_mantej': {
    id: 'wj_mantej', name: 'Мантедж', sprite: '💪', location: 'volcanic_plateau',
    dialog: { greet: 'Я МАНТЕДЖ! Слышишь грохот?!', default: 'Вулкан — мой дом!', quest_offer: 'Докажи силу: принеси {target} {item}!', quest_complete: 'ХА! Ты достоин уважения!', quest_incomplete: 'Слабак! Приходи когда окрепнешь.' },
    quests: [{ id: 'wj_mantej_1', type: 'defeat_x', targetItem: null, targetQty: 6, desc: 'Победите 6 диких покемонов', rewardMoney: 1200, rewardItem: 'fireStone', rewardQty: 1, prereqQuest: null }],
  },
  'wj_maisho': {
    id: 'wj_maisho', name: 'Маишо', sprite: '🧪', location: 'melen',
    dialog: { greet: 'Я Маишо, алхимик Мелена. Нужно зелье?', default: 'Зелье Маишо — лучшее в Джото!', quest_offer: 'Для зелья нужен {target} {item}.', quest_complete: 'Зелье готово! Пользуйся с умом.', quest_incomplete: 'Ингредиенты ещё не собраны...' },
    quests: [{ id: 'wj_maisho_1', type: 'collect_items', targetItem: 'seviperVenom', targetQty: 2, desc: 'Принесите 2 Яда Сивайпера', rewardMoney: 600, rewardItem: 'fullRestore', rewardQty: 3, prereqQuest: null }],
  },
  'wj_pantir': {
    id: 'wj_pantir', name: 'Пантир', sprite: '🐾', location: 'empty_city',
    dialog: { greet: 'Мой Пантир... потерялся в руинах.', default: 'Пантир где-то здесь...', quest_offer: 'Найди Пантира! Ищи {target} {item} как след.', quest_complete: 'Пантир! Ты жив! Спасибо, тренер!', quest_incomplete: 'Следы ведут глубже в руины...' },
    quests: [{ id: 'wj_pantir_1', type: 'explore', targetItem: null, targetQty: 4, desc: 'Посетите 4 локации Западного Джото', rewardMoney: 800, rewardItem: 'duskStone', rewardQty: 1, prereqQuest: null }],
  },
  // === KANTO QUEST NPCs ===
  'kanto_lucy': {
    id: 'kanto_lucy', name: 'Люси', sprite: '🎀', location: 'lavender_town',
    dialog: { greet: 'Моя кукла... она потерялась...', default: 'Кукла Люси — всё что у меня есть.', quest_offer: 'Найди куклу! Нужен {target} {item} чтобы её найти.', quest_complete: 'Моя кукла! Ты нашёл её!', quest_incomplete: 'Кукла где-то в Лавандии...' },
    quests: [{ id: 'k_lucy_1', type: 'collect_items', targetItem: 'plantSample', targetQty: 3, desc: 'Принесите 3 Образца растений для поиска', rewardMoney: 400, rewardItem: 'candy', rewardQty: 3, prereqQuest: null }],
  },
  'kanto_swot': {
    id: 'kanto_swot', name: 'Профессор Свот', sprite: '📚', location: 'saffron_swot_lab',
    dialog: { greet: 'Я профессор Свот из Академии. Готов к исследованиям?', default: 'Академия ждёт твоих открытий.', quest_offer: 'Для диссертации нужен {target} {item}.', quest_complete: 'Превосходное исследование!', quest_incomplete: 'Данных недостаточно...' },
    quests: [{ id: 'k_swot_1', type: 'catch_x', targetItem: null, targetQty: 4, desc: 'Поймайте 4 покемонов для Академии', rewardMoney: 900, rewardItem: 'tm', rewardQty: 2, prereqQuest: null }],
  },
  'vermilion_mayor': {
    id: 'vermilion_mayor', name: 'Стивен Мейли', sprite: '👔', location: 'vermilion',
    dialog: { greet: 'Я Стивен Мейли, мэр Вермилиона. Нужна помощь!', default: 'Городские дела не ждут.', quest_offer: 'Передай {target} {item} — это срочно!', quest_complete: 'Работа сделана! Город благодарит тебя.', quest_incomplete: 'Документы ещё не доставлены...' },
    quests: [{ id: 'k_verm_1', type: 'explore', targetItem: null, targetQty: 2, desc: 'Посетите 2 локации Канто', rewardMoney: 600, rewardItem: 'superPotion', rewardQty: 3, prereqQuest: null }],
  },
  // === SELEN ISLAND QUEST NPCs ===
  'selen_mary': {
    id: 'selen_mary', name: 'Мери', sprite: '👧', location: 'ostaron',
    dialog: { greet: 'Мой Меррипик пропал! Помогите!', default: 'Меррипик — мой лучший друг.', quest_offer: 'Найди Меррипика! Понадобится {target} {item}.', quest_complete: 'Меррипик вернулся! Спасибо огромное!', quest_incomplete: 'Меррипик где-то на Селене...' },
    quests: [{ id: 'sel_mary_1', type: 'explore', targetItem: null, targetQty: 4, desc: 'Посетите 4 локации Селена', rewardMoney: 700, rewardItem: 'iceStone', rewardQty: 1, prereqQuest: null }],
  },
  'selen_museum': {
    id: 'selen_museum', name: 'Куратор музея', sprite: '🏺', location: 'estaire_city',
    dialog: { greet: 'Музей Эстайр сити ограблен!', default: 'Экспонаты всё ещё не найдены.', quest_offer: 'Найди похитителей! Нужен {target} {item}.', quest_complete: 'Экспонаты возвращены! Ты герой!', quest_incomplete: 'Расследование продолжается...' },
    quests: [{ id: 'sel_museum_1', type: 'defeat_x', targetItem: null, targetQty: 5, desc: 'Победите 5 покемонов Команды R', rewardMoney: 1200, rewardItem: 'duskStone', rewardQty: 1, prereqQuest: null }],
  },
  // === SOUTHERN ARCHIPELAGO QUEST NPCs ===
  'sa_pirate': {
    id: 'sa_pirate', name: 'Капитан пиратов', sprite: '🏴‍☠️', location: 'il_de_far',
    dialog: { greet: 'Свистать всех наверх! Хочешь в команду?', default: 'Море зовёт!', quest_offer: 'Принеси мне {target} {item} для корабля.', quest_complete: 'Йо-хо-хо! Ты принят в команду!', quest_incomplete: 'Корабль ждёт припасов...' },
    quests: [{ id: 'sa_pirate_1', type: 'collect_items', targetItem: 'crystalShard', targetQty: 4, desc: 'Принесите 4 Осколка кристалла', rewardMoney: 1000, rewardItem: 'waterStone', rewardQty: 1, prereqQuest: null }],
  },
  'sa_ice_cave': {
    id: 'sa_ice_cave', name: 'Исследователь пещер', sprite: '🥶', location: 'ice_cave_sa',
    dialog: { greet: 'Эта ледяная пещера... здесь скрыта тайна!', default: 'Холод не остановит науку!', quest_offer: 'Для экспедиции нужен {target} {item}.', quest_complete: 'Тайна раскрыта! Невероятно!', quest_incomplete: 'Пещера хранит свои секреты...' },
    quests: [{ id: 'sa_ice_1', type: 'catch_x', targetItem: null, targetQty: 3, desc: 'Поймайте 3 ледяных покемонов', rewardMoney: 800, rewardItem: 'iceStone', rewardQty: 1, prereqQuest: null }],
  },
  'cerulean_settler': { id: 'cerulean_settler', name: 'Местный поселенец', sprite: '👤', location: 'cerulean_city', dialog: { greet: 'Приветствую в Церулине! Наш город славится водой.', default: 'Церулин прекрасен в любое время года.' }, quests: [] },
  'cerulean_barman_al': { id: 'cerulean_barman_al', name: 'Бармен Аль', sprite: '🍺', location: 'cerulean_cafe_rain', dialog: { greet: 'Лучший бар в Церулине! Заходи.', default: 'Вечером у нас музыка.' }, quests: [] },
  'cerulean_jack': { id: 'cerulean_jack', name: 'Джек', sprite: '🧢', location: 'cerulean_cafe_rain', dialog: { greet: 'Я Джек, местный завсегдатай.', default: 'Всех тут знаю.' }, quests: [] },
  'cerulean_auctioneer': { id: 'cerulean_auctioneer', name: 'Аукционист', sprite: '🔨', location: 'cerulean_tavern', dialog: { greet: 'Аукцион начинается! Кто даст больше?', default: 'Редкие лоты ждут.' }, quests: [] },
  'cerulean_agent_james': { id: 'cerulean_agent_james', name: 'Агент Джеймс', sprite: '🕶️', location: 'cerulean_tavern', dialog: { greet: 'Агент Джеймс. Веду расследование.', default: 'Не видели ничего подозрительного?' }, quests: [] },
  'cerulean_agent_stace': { id: 'cerulean_agent_stace', name: 'Агент Стейс', sprite: '🕶️', location: 'cerulean_tavern', dialog: { greet: 'Агент Стейс, напарница Джеймса.', default: 'Мы работаем под прикрытием.' }, quests: [] },
  'cerulean_surfer': { id: 'cerulean_surfer', name: 'Сёрфингист', sprite: '🏄', location: 'cerulean_city', dialog: { greet: 'Волны Церулина — лучшие в Канто!', default: 'Сёрфинг — это свобода.' }, quests: [] },

  'vermilion_judith': { id: 'vermilion_judith', name: 'Джудит', sprite: '👩', location: 'vermilion_fanclub', dialog: { greet: 'Моя кукла Люси пропала...', default: 'Спасибо что помогаете искать!' }, quests: [{ id: 'k_lucy_doll', type: 'collect_items', targetItem: 'plantSample', targetQty: 3, desc: 'Найдите 3 образца растений для поисков куклы Люси', rewardMoney: 600, rewardItem: 'lumBerry', rewardQty: 3, prereqQuest: null }] },
  'vermilion_secretary': { id: 'vermilion_secretary', name: 'Секретарь Лидера', sprite: '📋', location: 'vermilion_stadium', dialog: { greet: 'Я секретарь стадиона. Лидер ждёт.', default: 'Запись на битву открыта.' }, quests: [] },
  'vermilion_librarian': { id: 'vermilion_librarian', name: 'Библиотекарь', sprite: '📚', location: 'vermilion_library', dialog: { greet: 'Добро пожаловать в библиотеку!', default: 'У нас богатая коллекция книг о покемонах.' }, quests: [] },
  'vermilion_kiosk': { id: 'vermilion_kiosk', name: 'Работник киоска', sprite: '🎫', location: 'vermilion_library', dialog: { greet: 'Могу сделать копии документов.', default: 'Библиотека — источник знаний.' }, quests: [] },
  'vermilion_ron': { id: 'vermilion_ron', name: 'Рон', sprite: '👨', location: 'vermilion_library', dialog: { greet: 'Я Рон, захаживаю в библиотеку.', default: 'Книги — мой досуг.' }, quests: [] },
  'vermilion_seller1': { id: 'vermilion_seller1', name: 'Продавец', sprite: '🛒', location: 'vermilion_pokemarket', dialog: { greet: 'Покупайте товары!', default: 'Свежий завоз!' }, quests: [] },
  'vermilion_cashier': { id: 'vermilion_cashier', name: 'Кассир', sprite: '🎫', location: 'vermilion_port', dialog: { greet: 'Билеты на паром!', default: 'Отправление каждый час.' }, quests: [] },

  'lavender_miss_trevis': { id: 'lavender_miss_trevis', name: 'Мисс Тревис', sprite: '👩‍🏫', location: 'lavender_town', dialog: { greet: 'Лавандия — город упокоения.', default: 'В окрестностях неспокойно... Дикие покемоны атакуют!', quest_offer: 'Офицер Джес из Западного Шаффрана просила помощи. Принеси {target} {item}.', quest_complete: 'Спасибо! Лавандия снова в безопасности!', quest_incomplete: 'Покемоны всё ещё атакуют...' }, quests: [{ id: 'lavender_terror', type: 'explore', targetItem: null, targetQty: 3, desc: 'Разберитесь в причине нападений диких покемонов в Лавандии — посетите 3 локации', rewardMoney: 0, rewardItem: 'tm', rewardQty: 1, prereqQuest: null }] },
  'lavender_medium': { id: 'lavender_medium', name: 'Медиум', sprite: '🔮', location: 'lavender_town', dialog: { greet: 'Лавандия — место упокоения покемонов.', default: 'Башня Призраков хранит множество тайн...' }, quests: [] },
  'lavender_guard': { id: 'lavender_guard', name: 'Охранник', sprite: '💂', location: 'lavender_radio_tower', dialog: { greet: 'Порядок под контролем.', default: 'Не шалите.' }, quests: [] },
  'lavender_seller': { id: 'lavender_seller', name: 'Продавец', sprite: '🛒', location: 'lavender_pokemarket', dialog: { greet: 'Товары для тренеров!', default: 'Заходите!' }, quests: [] },

  'celadon_arthur_wilford': { id: 'celadon_arthur_wilford', name: 'Артур Вилфорд', sprite: '🎩', location: 'celadon_city', dialog: { greet: 'Я Артур Вилфорд, старейшина Целадона.', default: 'Целадон — город изобилия.' }, quests: [] },
  'celadon_secretary': { id: 'celadon_secretary', name: 'Секретарь Лидера', sprite: '📋', location: 'celadon_stadium', dialog: { greet: 'Стадион Эрики открыт.', default: 'Лидер ждёт.' }, quests: [] },
  'celadon_little_girl': { id: 'celadon_little_girl', name: 'Маленькая девочка', sprite: '👧', location: 'celadon_city', dialog: { greet: 'Я люблю гулять по Целадону!', default: 'У меня есть покемон-друг!' }, quests: [] },
  'celadon_meteorologist': { id: 'celadon_meteorologist', name: 'Ведущий метеоролог', sprite: '🌤️', location: 'celadon_city', dialog: { greet: 'Прогноз погоды — наша работа.', default: 'Погода влияет на покемонов.' }, quests: [{ id: 'cel_weather', type: 'explore', targetItem: null, targetQty: 3, desc: 'Посетите 3 локации для сбора метеоданных', rewardMoney: 700, rewardItem: 'tm', rewardQty: 1, prereqQuest: null }] },
  'celadon_pharmacist': { id: 'celadon_pharmacist', name: 'Аптекарь', sprite: '💊', location: 'celadon_city', dialog: { greet: 'Аптека Целадона.', default: 'Здоровье команды — наш приоритет.' }, quests: [] },
  'celadon_tm_seller': { id: 'celadon_tm_seller', name: 'Продавец ТМ', sprite: '📀', location: 'celadon_city', dialog: { greet: 'Технические Машины!', default: 'Новинки каждую неделю!' }, quests: [] },
  'celadon_stone_seller': { id: 'celadon_stone_seller', name: 'Продавец камней', sprite: '💎', location: 'celadon_city', dialog: { greet: 'Камни эволюции!', default: 'Редкие камни со всего мира.' }, quests: [] },
  'celadon_barber': { id: 'celadon_barber', name: 'Парикмахер', sprite: '💇', location: 'celadon_city', dialog: { greet: 'Стильная стрижка для вас!', default: 'Новый образ — новые победы!' }, quests: [] },
  'celadon_tattoo': { id: 'celadon_tattoo', name: 'Татуировщик', sprite: '🎨', location: 'celadon_city', dialog: { greet: 'Лучшие тату в Канто!', default: 'Татуировка — это навсегда.' }, quests: [] },
  'celadon_electronics': { id: 'celadon_electronics', name: 'Продавец электроники', sprite: '📱', location: 'celadon_city', dialog: { greet: 'Техника для тренеров!', default: 'Новинки из Силф Ко!' }, quests: [] },
  'celadon_balls': { id: 'celadon_balls', name: 'Продавец покеболов', sprite: '⚽', location: 'celadon_city', dialog: { greet: 'Покеболы всех видов!', default: 'Ловите с комфортом!' }, quests: [] },
  'celadon_appliances': { id: 'celadon_appliances', name: 'Продавец техники', sprite: '🔌', location: 'celadon_city', dialog: { greet: 'Бытовая техника для дома.', default: 'Качество гарантирую.' }, quests: [] },
  'celadon_craftsman': { id: 'celadon_craftsman', name: 'Продавец-ремесленник', sprite: '🔧', location: 'celadon_city', dialog: { greet: 'Ручная работа!', default: 'Каждая вещь с душой.' }, quests: [] },

  'saffron_tailor': { id: 'saffron_tailor', name: 'Портниха', sprite: '🧵', location: 'saffron_needle_house', dialog: { greet: 'Шью лучшие костюмы!', default: 'Стиль важен даже в битве.' }, quests: [] },
  'saffron_secretary': { id: 'saffron_secretary', name: 'Секретарь Лидера', sprite: '📋', location: 'saffron_psychic_stadium', dialog: { greet: 'Стадион Сабрины — для сильных духом.', default: 'Психические покемоны чувствуют ауру.' }, quests: [] },
  'saffron_cashier': { id: 'saffron_cashier', name: 'Кассир', sprite: '💲', location: 'saffron_east_station', dialog: { greet: 'Билеты на поезд!', default: 'Счастливого пути!' }, quests: [] },
  'saffron_lottery': { id: 'saffron_lottery', name: 'Лотерейщик', sprite: '🎰', location: 'saffron_east_station', dialog: { greet: 'Лотерея Лиги-17!', default: 'Главный приз — редкий покемон!' }, quests: [] },

  'fuchsia_olan': { id: 'fuchsia_olan', name: 'Олан', sprite: '🧙', location: 'fuchsia_beach', dialog: { greet: 'Я Олан, хранитель традиций Фуксии.', default: 'Фуксия — город ниндзя.' }, quests: [] },
  'fuchsia_branzer_richard': { id: 'fuchsia_branzer_richard', name: 'Бранзер Ричард', sprite: '🔥', location: 'fuchsia_beach', dialog: { greet: 'Бранзеры — лучшие покемоны!', default: 'Мои Бранзеры — моя гордость.' }, quests: [] },
  'fuchsia_cashier': { id: 'fuchsia_cashier', name: 'Кассир', sprite: '🎫', location: 'fuchsia_beach_pier', dialog: { greet: 'Билеты на парусник до Архипелага!', default: 'Отправление каждый день.' }, quests: [] },

  'goldenrod_prof_nils': { id: 'goldenrod_prof_nils', name: 'Профессор Нилс', sprite: '🔬', location: 'goldenrod_academy', dialog: { greet: 'Я профессор Нилс из Академии.', default: 'Эволюция — удивительный процесс!' }, quests: [] },
  'goldenrod_prof_karmen': { id: 'goldenrod_prof_karmen', name: 'Профессор Кармен', sprite: '🔬', location: 'goldenrod_academy', dialog: { greet: 'Профессор Кармен.', default: 'Каждая атака имеет свою историю.' }, quests: [] },
  'goldenrod_trainer_ted': { id: 'goldenrod_trainer_ted', name: 'Тренер Тэд', sprite: '🎓', location: 'goldenrod_academy', dialog: { greet: 'Я Тренер Тэд, выпускник Академии.', default: 'Академия дала мне всё.' }, quests: [] },
  'goldenrod_barman': { id: 'goldenrod_barman', name: 'Бармен', sprite: '🍺', location: 'goldenrod_bar', dialog: { greet: 'Лучший бар в Голденроде!', default: 'После трудного дня — только сюда.' }, quests: [] },
  'goldenrod_secretary': { id: 'goldenrod_secretary', name: 'Секретарь Лидера', sprite: '📋', location: 'goldenrod_stadium', dialog: { greet: 'Стадион Уитни открыт.', default: 'Нормальные покемоны сильнее чем кажутся!' }, quests: [] },
  'goldenrod_kiosk': { id: 'goldenrod_kiosk', name: 'Работник киоска', sprite: '🎫', location: 'goldenrod_supermarket', dialog: { greet: 'Информация о городе!', default: 'Всё что нужно тренеру.' }, quests: [] },
  'goldenrod_clan_commander': { id: 'goldenrod_clan_commander', name: 'Командир штаба', sprite: '🛡️', location: 'goldenrod_cityhall', dialog: { greet: 'Кланы — сила Лиги.', default: 'Вступите в клан!' }, quests: [] },
  'goldenrod_clan_master': { id: 'goldenrod_clan_master', name: 'Клан-мастер', sprite: '👑', location: 'goldenrod_cityhall', dialog: { greet: 'Я Клан-мастер.', default: 'Клан — это семья.' }, quests: [] },
  'goldenrod_clan_secretary': { id: 'goldenrod_clan_secretary', name: 'Клан-секретарь', sprite: '📝', location: 'goldenrod_cityhall', dialog: { greet: 'Веду учёт кланов.', default: 'Бюрократия — двигатель порядка.' }, quests: [] },
  'goldenrod_editor': { id: 'goldenrod_editor', name: 'Главный редактор', sprite: '📰', location: 'new_district', dialog: { greet: 'Главный редактор газеты.', default: 'Свежий выпуск уже в печати!' }, quests: [] },

  'old_district_sergeant': { id: 'old_district_sergeant', name: 'Сержант', sprite: '👮', location: 'old_district', dialog: { greet: 'Сержант полиции.', default: 'Не нарушайте закон.' }, quests: [] },
  'old_district_veteran': { id: 'old_district_veteran', name: 'Ветеран', sprite: '🎖️', location: 'old_district', dialog: { greet: 'Я ветеран. Много битв за плечами.', default: 'Хочешь совет от старого бойца?' }, quests: [{ id: 'ej_memorable', type: 'defeat_x', targetItem: null, targetQty: 4, desc: 'Победите 4 покемонов в памятном бою', rewardMoney: 800, rewardItem: 'fullRestore', rewardQty: 2, prereqQuest: null }] },
  'old_district_stuart': { id: 'old_district_stuart', name: 'Стюарт', sprite: '👨', location: 'old_district', dialog: { greet: 'Стюарт, житель Старого района.', default: 'Тут тихо и спокойно.' }, quests: [] },
  'old_district_master_rob': { id: 'old_district_master_rob', name: 'Мастер Роб', sprite: '🔧', location: 'old_district', dialog: { greet: 'Мастер Роб. Чиню всё.', default: 'Приноси — починю.' }, quests: [] },

  'new_district_lieutenant': { id: 'new_district_lieutenant', name: 'Лейтенант', sprite: '👮', location: 'new_district', dialog: { greet: 'Лейтенант полиции.', default: 'Новый район под защитой.' }, quests: [] },
  'new_district_elen': { id: 'new_district_elen', name: 'Элен', sprite: '🦸', location: 'new_district', dialog: { greet: 'Я Элен из Великолепной Пятёрки.', default: 'Сторн собрал нас ради великой цели!' }, quests: [] },
  'new_district_guard': { id: 'new_district_guard', name: 'Охранник', sprite: '💂', location: 'new_district', dialog: { greet: 'Охраняю Новый район.', default: 'Без пропуска не пройти.' }, quests: [] },
  'new_district_mrs_booker': { id: 'new_district_mrs_booker', name: 'Миссис Букер', sprite: '👩', location: 'new_district', dialog: { greet: 'Миссис Букер.', default: 'Заходите на чай!' }, quests: [] },
  'new_district_mr_booker': { id: 'new_district_mr_booker', name: 'Мистер Букер', sprite: '👨', location: 'new_district', dialog: { greet: 'Мистер Букер к вашим услугам.', default: 'Новый район — лучшее место.' }, quests: [] },
  'new_district_richard': { id: 'new_district_richard', name: 'Ричард', sprite: '👨', location: 'new_district', dialog: { greet: 'Я Ричард. Работаю на радио.', default: 'Радиобашня вещает на всё Джото!' }, quests: [] },
  'new_district_kristen': { id: 'new_district_kristen', name: 'Кристен', sprite: '🏃', location: 'new_district', dialog: { greet: 'Я Кристен. Ветер зовёт вперёд!', default: 'Бег — это жизнь!' }, quests: [{ id: 'ej_wind', type: 'explore', targetItem: null, targetQty: 3, desc: 'Посетите 3 локации в поисках ветра', rewardMoney: 600, rewardItem: 'tm', rewardQty: 1, prereqQuest: null }] },
  'new_district_train': { id: 'new_district_train', name: 'Поезд', sprite: '🚂', location: 'new_district', dialog: { greet: 'Поезд до Шаффрана.', default: 'Занимайте места!' }, quests: [] },

  'olivine_glen': { id: 'olivine_glen', name: 'Глен', sprite: '👨', location: 'olivine', dialog: { greet: 'Я Глен, портовый рабочий.', default: 'Оливинский порт — лучший в Джото.' }, quests: [] },
  'olivine_evan': { id: 'olivine_evan', name: 'Эван', sprite: '👨', location: 'olivine_beach', dialog: { greet: 'Эван. Рыбачу 20 лет.', default: 'Рыбалка учит терпению.' }, quests: [] },
  'olivine_arina': { id: 'olivine_arina', name: 'Арина', sprite: '👩', location: 'olivine', dialog: { greet: 'Арина. Люблю наблюдать за кораблями.', default: 'Море бесконечно.' }, quests: [] },
  'olivine_barman_elvin': { id: 'olivine_barman_elvin', name: 'Бармен Элвин', sprite: '🍺', location: 'olivine_bar_pirate', dialog: { greet: 'Пиратское убежище открыто!', default: 'Лучший ром на побережье!' }, quests: [] },
  'olivine_lighthouse_keeper': { id: 'olivine_lighthouse_keeper', name: 'Смотритель маяка', sprite: '🔦', location: 'olivine_beach_lighthouse', dialog: { greet: 'Я смотритель маяка.', default: 'Браконьеры? Да, видел их...' }, quests: [{ id: 'oli_brakonier', type: 'defeat_x', targetItem: null, targetQty: 5, desc: 'Победите 5 браконьеров у маяка', rewardMoney: 1000, rewardItem: 'waterStone', rewardQty: 1, prereqQuest: null }] },
  'olivine_marta': { id: 'olivine_marta', name: 'Марта', sprite: '👩', location: 'olivine', dialog: { greet: 'Я Марта. У меня старая фотография.', default: 'На этой фотографии — моя молодость.' }, quests: [{ id: 'oli_photo', type: 'collect_items', targetItem: 'crystalShard', targetQty: 2, desc: 'Принесите 2 осколка кристалла для восстановления фотографии', rewardMoney: 400, rewardItem: 'oranBerry', rewardQty: 3, prereqQuest: null }] },
  'olivine_janet': { id: 'olivine_janet', name: 'Жанет', sprite: '👩', location: 'olivine_house_221', dialog: { greet: 'Жанет. Ищу рецепт зелья памяти.', default: 'Говорят оно помогает вспомнить прошлое.' }, quests: [{ id: 'oli_memory', type: 'collect_items', targetItem: 'plantSample', targetQty: 4, desc: 'Принесите 4 образца растений для зелья памяти', rewardMoney: 500, rewardItem: 'superPotion', rewardQty: 2, prereqQuest: null }] },

  'flourence_pretty_girl': { id: 'flourence_pretty_girl', name: 'Симпатичная девушка', sprite: '👩', location: 'flourence', dialog: { greet: 'Флауренция — город цветов!', default: 'Люблю этот город.' }, quests: [] },
  'flourence_trainer_jim': { id: 'flourence_trainer_jim', name: 'Тренер Джим', sprite: '🎒', location: 'flourence', dialog: { greet: 'Тренер Джим. Флауренция — мой дом.', default: 'Цветы и покемоны — идеально!' }, quests: [] },
  'flourence_florist_helper': { id: 'flourence_florist_helper', name: 'Помощник флориста', sprite: '🌸', location: 'flourence_greenhouse', dialog: { greet: 'Помогаю в оранжерее.', default: 'Приходите любоваться цветами!' }, quests: [] },
  'flourence_bulletin': { id: 'flourence_bulletin', name: 'Доска объявлений', sprite: '📌', location: 'flourence', dialog: { greet: 'Миссия: Флауренция!', default: 'Новые задания каждую неделю.' }, quests: [{ id: 'flo_mission', type: 'collect_items', targetItem: 'plantSample', targetQty: 5, desc: 'Принесите 5 образцов растений для города', rewardMoney: 500, rewardItem: 'leafStone', rewardQty: 1, prereqQuest: null }] },

  'alston_granny': { id: 'alston_granny', name: 'Старушка', sprite: '👵', location: 'alston_granny_house', dialog: { greet: 'Я старушка из Олстона.', default: 'Каждый камень рассказывает историю.' }, quests: [] },
  'alston_little_man': { id: 'alston_little_man', name: 'Маленький человек', sprite: '🎪', location: 'alston_circus', dialog: { greet: 'Цирк покемонов! Лучшее шоу!', default: 'Приходите всей семьёй!' }, quests: [{ id: 'als_circus_quest', type: 'catch_x', targetItem: null, targetQty: 2, desc: 'Поймайте 2 покемонов для циркового представления', rewardMoney: 500, rewardItem: 'tm', rewardQty: 1, prereqQuest: null }] },
  'alston_secretary1': { id: 'alston_secretary1', name: 'Секретарь Стального Стадиона', sprite: '📋', location: 'alston_steel_stadium', dialog: { greet: 'Стальной Стадион.', default: 'Лидер ждёт.' }, quests: [] },
  'alston_secretary2': { id: 'alston_secretary2', name: 'Секретарь Стадиона Души', sprite: '📋', location: 'alston_soul_stadium', dialog: { greet: 'Стадион Души.', default: 'Готовы к испытанию духа?' }, quests: [] },

  'summer_barman_miguel': { id: 'summer_barman_miguel', name: 'Бармен Мигель', sprite: '🍺', location: 'summer_pub', dialog: { greet: 'Паб Хаус — сердце Саммера!', default: 'Холодное пиво после жаркого дня!' }, quests: [] },
  'summer_librarian': { id: 'summer_librarian', name: 'Библиотекарь', sprite: '📚', location: 'summer_library', dialog: { greet: 'Библиотека Саммера.', default: 'У нас редкие книги о покемонах.' }, quests: [] },
  'summer_officer_jackie': { id: 'summer_officer_jackie', name: 'Офицер Джекки', sprite: '👮', location: 'summer_police', dialog: { greet: 'Офицер Джекки.', default: 'Порядок в городе — наша работа.' }, quests: [] },
  'summer_prof_niro': { id: 'summer_prof_niro', name: 'Профессор Ниро', sprite: '🔬', location: 'summer_institute', dialog: { greet: 'Профессор Ниро.', default: 'Исследуем покемонов саванны!' }, quests: [] },
  'summer_mary_research': { id: 'summer_mary_research', name: 'Мари', sprite: '👩', location: 'summer_institute', dialog: { greet: 'Я Мари, исследую вулканы.', default: 'Вулкан Синнабунг полон тайн.' }, quests: [{ id: 'sum_volcano', type: 'collect_items', targetItem: 'lavaCore', targetQty: 3, desc: 'Принесите 3 ядра магмы для исследований', rewardMoney: 800, rewardItem: 'fireStone', rewardQty: 1, prereqQuest: null }] },
  'summer_kylie': { id: 'summer_kylie', name: 'Кайли', sprite: '👧', location: 'summer', dialog: { greet: 'Моя Мурысь сбежала!', default: 'Мурысь, где ты?' }, quests: [{ id: 'sum_murys', type: 'catch_x', targetItem: null, targetQty: 1, desc: 'Найдите и поймайте сбежавшую Мурысь', rewardMoney: 500, rewardItem: 'candy', rewardQty: 3, prereqQuest: null }] },
  'summer_mila': { id: 'summer_mila', name: 'Мила', sprite: '👩', location: 'summer_pokepark', dialog: { greet: 'Я Мила.', default: 'Пантиры — удивительные покемоны.' }, quests: [{ id: 'sum_pantir_story', type: 'explore', targetItem: null, targetQty: 4, desc: 'Посетите 4 локации в поисках Пантира', rewardMoney: 700, rewardItem: 'duskStone', rewardQty: 1, prereqQuest: null }] },
  'summer_owner': { id: 'summer_owner', name: 'Владелец', sprite: '🏢', location: 'summer_pokepark', dialog: { greet: 'Владелец Поке-парка.', default: 'Новые аттракционы скоро!' }, quests: [{ id: 'sum_park', type: 'collect_items', targetItem: 'rockSample', targetQty: 5, desc: 'Принесите 5 образцов породы для строительства', rewardMoney: 900, rewardItem: 'sunStone', rewardQty: 1, prereqQuest: null }] },
  'summer_fisk': { id: 'summer_fisk', name: 'Фиск', sprite: '💎', location: 'summer', dialog: { greet: 'Фиск. Скупаю ониксы.', default: 'Ониксы — камень удачи.' }, quests: [{ id: 'sum_onyx', type: 'collect_items', targetItem: 'rockSample', targetQty: 5, desc: 'Принесите 5 образцов породы для скупщика', rewardMoney: 1000, rewardItem: 'dawnStone', rewardQty: 1, prereqQuest: null }] },

  'warhall_bill_char': { id: 'warhall_bill_char', name: 'Билл', sprite: '🔬', location: 'warhall_bill_shop', dialog: { greet: 'Я Билл, изобретатель.', default: 'Техника и покемоны — моя страсть.' }, quests: [] },
  'warhall_auctioneer': { id: 'warhall_auctioneer', name: 'Аукционист', sprite: '🔨', location: 'warhall', dialog: { greet: 'Аукцион Вархолла!', default: 'Кто даст больше?' }, quests: [] },
  'warhall_master_osaguro': { id: 'warhall_master_osaguro', name: 'Мастер Осагуро', sprite: '⚔️', location: 'warhall_samurai_house', dialog: { greet: 'Я Мастер Осагуро.', default: 'Тренируйся усердно.' }, quests: [] },
  'warhall_kensei': { id: 'warhall_kensei', name: 'Кэнсэй', sprite: '🥋', location: 'warhall_samurai_gym', dialog: { greet: 'Кэнсэй, ученик мастера.', default: 'Тренировка не заканчивается.' }, quests: [] },
  'warhall_kevin': { id: 'warhall_kevin', name: 'Кевин', sprite: '👨', location: 'warhall', dialog: { greet: 'Я Кевин, житель Вархолла.', default: 'Наш город славится историей.' }, quests: [] },
  'warhall_museum_director': { id: 'warhall_museum_director', name: 'Директор музея', sprite: '🏛️', location: 'warhall_museum', dialog: { greet: 'Директор музея.', default: 'Новая экспозиция уже открыта!' }, quests: [] },

  'melen_charlie': { id: 'melen_charlie', name: 'Чарли', sprite: '👨', location: 'melen', dialog: { greet: 'Чарли из Мелена.', default: 'Тишина и покой — вот что ценно.' }, quests: [] },
  'melen_mrs_craig': { id: 'melen_mrs_craig', name: 'Миссис Крейг', sprite: '👩', location: 'melen_craig_shop', dialog: { greet: 'Миссис Крейг.', default: 'Заходите за покупками!' }, quests: [] },
  'melen_old_fisherman': { id: 'melen_old_fisherman', name: 'Старый рыбак', sprite: '🎣', location: 'melen_pier', dialog: { greet: 'Рыбачу 40 лет.', default: 'Море — мой второй дом.' }, quests: [] },
  'melen_silvestr': { id: 'melen_silvestr', name: 'Сильвестр', sprite: '👨', location: 'melen', dialog: { greet: 'Сильвестр.', default: 'Древние тайны ждут.' }, quests: [] },
  'melen_mask_master': { id: 'melen_mask_master', name: 'Мастер масок', sprite: '🎭', location: 'melen_mask_workshop', dialog: { greet: 'Мастер масок.', default: 'Для карнавала или битвы?' }, quests: [] },
  'melen_fiona': { id: 'melen_fiona', name: 'Фиона', sprite: '👩', location: 'melen_fiona_house', dialog: { greet: 'Я Фиона.', default: 'Заходите отдохнуть.' }, quests: [] },
  'melen_albert': { id: 'melen_albert', name: 'Альберт', sprite: '👨', location: 'melen_albert_house', dialog: { greet: 'Альберт.', default: 'За пределами закона — там истина.' }, quests: [] },
  'melen_kristian': { id: 'melen_kristian', name: 'Кристиан', sprite: '👨', location: 'melen_pier', dialog: { greet: 'Кристиан.', default: 'Мечты сбываются у моря.' }, quests: [] },
  'melen_fisk': { id: 'melen_fisk', name: 'Фиск', sprite: '💎', location: 'melen', dialog: { greet: 'Фиск в Мелене.', default: 'Приносите ониксы — плачу хорошо.' }, quests: [{ id: 'mel_onyx', type: 'collect_items', targetItem: 'rockSample', targetQty: 3, desc: 'Принесите 3 оникса для Фиска', rewardMoney: 600, rewardItem: 'shinyStone', rewardQty: 1, prereqQuest: null }] },

  'ostaron_ralf': { id: 'ostaron_ralf', name: 'Ральф', sprite: '👨', location: 'ostaron', dialog: { greet: 'Ральф, житель Остарона.', default: 'Столица Селена прекрасна!' }, quests: [] },
  'ostaron_secretary': { id: 'ostaron_secretary', name: 'Секретарь Лидера', sprite: '📋', location: 'ostaron_ice_stadium', dialog: { greet: 'Стадион Чака ждёт.', default: 'Лидер Остарона непобедим!' }, quests: [] },

  'estaire_officer_jes': { id: 'estaire_officer_jes', name: 'Офицер Джес', sprite: '👮', location: 'estaire_city', dialog: { greet: 'Офицер Джес.', default: 'Соблюдайте закон!' }, quests: [] },
  'estaire_bill': { id: 'estaire_bill', name: 'Билл', sprite: '🔬', location: 'estaire_city', dialog: { greet: 'Билл в Эстайре.', default: 'Техника для всех регионов!' }, quests: [] },
  'estaire_mayor': { id: 'estaire_mayor', name: 'Мэр Эстайра', sprite: '🏛️', location: 'estaire_city', dialog: { greet: 'Мэр Эстайра.', default: 'Эстайр растёт и развивается.' }, quests: [] },
  'estaire_happy': { id: 'estaire_happy', name: 'Хэппи', sprite: '😊', location: 'estaire_city', dialog: { greet: 'Счастье есть!', default: 'Улыбайтесь чаще!' }, quests: [{ id: 'sel_happy', type: 'collect_items', targetItem: 'plantSample', targetQty: 3, desc: 'Принесите 3 образца растений для Хэппи', rewardMoney: 400, rewardItem: 'candy', rewardQty: 5, prereqQuest: null }] },
  'estaire_toby': { id: 'estaire_toby', name: 'Тоби', sprite: '👨', location: 'estaire_city', dialog: { greet: 'Тоби из Эстайра.', default: 'Море рядом — что ещё нужно?' }, quests: [] },
  'estaire_den': { id: 'estaire_den', name: 'Ден', sprite: '👨', location: 'estaire_city', dialog: { greet: 'Ден. Работаю в порту.', default: 'Корабли приходят и уходят.' }, quests: [] },
  'estaire_auctioneer': { id: 'estaire_auctioneer', name: 'Аукционист', sprite: '🔨', location: 'estaire_city', dialog: { greet: 'Аукцион Эстайра!', default: 'Кто предложит больше?' }, quests: [] },
  'estaire_appliances': { id: 'estaire_appliances', name: 'Продавец техники', sprite: '🔌', location: 'estaire_private_shop', dialog: { greet: 'Техника для острова.', default: 'Лучшие товары здесь!' }, quests: [] },
  'estaire_cashier': { id: 'estaire_cashier', name: 'Кассир', sprite: '💲', location: 'estaire_south_pier', dialog: { greet: 'Билеты на паром.', default: 'Счастливого плавания!' }, quests: [] },

  'sayref_keeper': { id: 'sayref_keeper', name: 'Смотритель покемонов', sprite: '🧹', location: 'sayref', dialog: { greet: 'Смотритель покемонов Сайрефа.', default: 'Покемоны — наши друзья.' }, quests: [] },
  'sayref_ray': { id: 'sayref_ray', name: 'Рей', sprite: '👨', location: 'sayref', dialog: { greet: 'Рей из Сайрефа.', default: 'Снеговик — символ города.' }, quests: [] },
  'sayref_fred_svarovski': { id: 'sayref_fred_svarovski', name: 'Фред Сваровски', sprite: '💎', location: 'sayref', dialog: { greet: 'Фред Сваровски.', default: 'Рипогиты — агрессивные покемоны.' }, quests: [{ id: 'sel_ripogit', type: 'defeat_x', targetItem: null, targetQty: 4, desc: 'Победите 4 Рипогитов', rewardMoney: 800, rewardItem: 'iceStone', rewardQty: 1, prereqQuest: null }] },
  'sayref_peiri': { id: 'sayref_peiri', name: 'Пэйри', sprite: '👩', location: 'sayref', dialog: { greet: 'Пэйри.', default: 'Ледяные скульптуры — искусство.' }, quests: [] },
  'sayref_ice_statue': { id: 'sayref_ice_statue', name: 'Снеговик', sprite: '⛄', location: 'sayref', dialog: { greet: 'Я — символ Сайрефа!', default: 'Приходите фотографироваться!' }, quests: [] },
  'sayref_secretary': { id: 'sayref_secretary', name: 'Секретарь Лидера', sprite: '📋', location: 'sayref_air_stadium', dialog: { greet: 'Воздушный Стадион.', default: 'Летающие покемоны не знают границ!' }, quests: [] },

  'sel_route8_nursery': { id: 'sel_route8_nursery', name: 'Работник питомника', sprite: '🥚', location: 'estaire_daycare_center', dialog: { greet: 'Оставляйте покемонов.', default: 'Покемоны растут пока вы путешествуете.' }, quests: [{ id: 'sel_nursery', type: 'catch_x', targetItem: null, targetQty: 2, desc: 'Поймайте 2 покемонов для питомника', rewardMoney: 500, rewardItem: 'candy', rewardQty: 3, prereqQuest: null }] },
  'sel_route8_prof_sten': { id: 'sel_route8_prof_sten', name: 'Профессор Стэн', sprite: '🔬', location: 'estaire_daycare_center', dialog: { greet: 'Профессор Стэн. Я изучаю легендарных покемонов.', default: 'Перо легендарного покемона — вот что мне нужно!', quest_offer: 'Найди доказательство существования легендарного покемона: принеси {target} {item}.', quest_complete: 'Это оно! Легенда реальна! Спасибо, исследователь!', quest_incomplete: 'Поиски продолжаются. Легендарный покемон где-то там...' }, quests: [{ id: 'sel_legend_feather', type: 'collect_items', targetItem: 'lavaCore', targetQty: 3, desc: 'Принесите 3 ядра магмы — возможные останки легендарного покемона', rewardMoney: 8000, rewardItem: 'dawnStone', rewardQty: 2, prereqQuest: 'ost_mayor_war' }] },
  'sel_route8_mad_scientist': { id: 'sel_route8_mad_scientist', name: 'Сумасшедший ученый', sprite: '🤪', location: 'estaire_daycare_center', dialog: { greet: 'Мои теории верны!', default: 'Наука не знает границ!' }, quests: [] },

  'goldenrod_academy_worker': { id: 'goldenrod_academy_worker', name: 'Работник филиала', sprite: '👨‍💼', location: 'goldenrod_academy_branch', dialog: { greet: 'Работник филиала Академии.', default: 'Исследования идут полным ходом.' }, quests: [{ id: 'sel_academy_branch', type: 'explore', targetItem: null, targetQty: 3, desc: 'Посетите 3 локации для исследования филиала', rewardMoney: 600, rewardItem: 'tm', rewardQty: 1, prereqQuest: null }] },
  'goldenrod_academy_miss_melani': { id: 'goldenrod_academy_miss_melani', name: 'Мисс Мелани', sprite: '👩‍🏫', location: 'goldenrod_academy_branch', dialog: { greet: 'Мисс Мелани.', default: 'Обучение — ключ к успеху.' }, quests: [{ id: 'academy_learn', type: 'catch_x', targetItem: null, targetQty: 3, desc: 'Поймайте 3 покемонов для учебной практики', rewardMoney: 400, rewardItem: 'pokeBall', rewardQty: 5, prereqQuest: null }] },
  'goldenrod_academy_doran': { id: 'goldenrod_academy_doran', name: 'Профессор Доран', sprite: '👨‍🔬', location: 'goldenrod_academy_branch', dialog: { greet: 'Профессор Доран, исследователь эволюции.', default: 'Академия Голденрода — лучшее место для начинающих тренеров. Советую обратиться к инструкторам Сорену, Джеку или Олину — у них есть полезные задания.' }, quests: [] },

  'ilde_guillaume': { id: 'ilde_guillaume', name: 'Гильом', sprite: '👨', location: 'il_de_far', dialog: { greet: 'Гильом.', default: 'Наш остров — лучший!' }, quests: [] },
  'ilde_ferryman': { id: 'ilde_ferryman', name: 'Паромщик Травэр', sprite: '⛴️', location: 'il_de_far', dialog: { greet: 'Паромщик Травэр.', default: 'Паром ходит по расписанию.' }, quests: [] },
  'ilde_cashier1': { id: 'ilde_cashier1', name: 'Кассир', sprite: '💲', location: 'il_de_far', dialog: { greet: 'Билеты на паром!', default: 'Места ограничены.' }, quests: [] },
  'ilde_cashier2': { id: 'ilde_cashier2', name: 'Кассир', sprite: '💲', location: 'il_de_far', dialog: { greet: 'Касса порта открыта.', default: 'Приятного путешествия!' }, quests: [] },
  'ilde_sailboat': { id: 'ilde_sailboat', name: 'Парусник', sprite: '⛵', location: 'il_de_far', dialog: { greet: 'Парусник до Канто!', default: 'Ветер попутный!' }, quests: [] },

  'sen_aspir_prof_quince': { id: 'sen_aspir_prof_quince', name: 'Профессор Квинс', sprite: '🔬', location: 'sen_aspir', dialog: { greet: 'Профессор Квинс.', default: 'Здесь уникальная экосистема.' }, quests: [] },
  'sen_aspir_passenger': { id: 'sen_aspir_passenger', name: 'Прохожий', sprite: '🚶', location: 'sen_aspir', dialog: { greet: 'Сен Аспир прекрасен.', default: 'Взгляд в прошлое — здесь история.' }, quests: [{ id: 'sa_past', type: 'explore', targetItem: null, targetQty: 2, desc: 'Посетите 2 исторические локации', rewardMoney: 500, rewardItem: 'dawnStone', rewardQty: 1, prereqQuest: null }] },
  'sen_aspir_madame_odeur': { id: 'sen_aspir_madame_odeur', name: 'Мадам де Одер', sprite: '👩‍🦰', location: 'sen_aspir', dialog: { greet: 'Мадам де Одер.', default: 'Ароматы Архипелага уникальны.' }, quests: [] },
  'sen_aspir_madame_chaber': { id: 'sen_aspir_madame_chaber', name: 'Мадам Шабэр', sprite: '👩', location: 'sen_aspir', dialog: { greet: 'Мадам Шабэр.', default: 'У вас есть что-то интересное?' }, quests: [] },
  'sen_aspir_madame_lacerte': { id: 'sen_aspir_madame_lacerte', name: 'Мадам Ласерте', sprite: '👩', location: 'sen_aspir', dialog: { greet: 'Мадам Ласерте.', default: 'Красота спасёт мир.' }, quests: [] },
  'sen_aspir_museum_worker': { id: 'sen_aspir_museum_worker', name: 'Работник музея', sprite: '🏺', location: 'sen_aspir', dialog: { greet: 'Работник музея.', default: 'Новый экспонат — древний покебол!' }, quests: [] },
  'sen_aspir_paleontologist': { id: 'sen_aspir_paleontologist', name: 'Палеонтолог', sprite: '🦴', location: 'sen_aspir', dialog: { greet: 'Палеонтолог.', default: 'Окаменелости рассказывают историю.' }, quests: [] },
  'sen_aspir_monsieur_korel': { id: 'sen_aspir_monsieur_korel', name: 'Месье Корэль', sprite: '🎩', location: 'sen_aspir', dialog: { greet: 'Месье Корэль.', default: 'Сен Аспир — город аристократов.' }, quests: [] },
  'sen_aspir_ferryman': { id: 'sen_aspir_ferryman', name: 'Паромщик Травэр', sprite: '⛴️', location: 'sen_aspir', dialog: { greet: 'Паромщик Травэр.', default: 'Переправа на Иль де Фар.' }, quests: [] },
  'sen_aspir_officer_jes': { id: 'sen_aspir_officer_jes', name: 'Офицер Джес', sprite: '👮', location: 'sen_aspir', dialog: { greet: 'Офицер Джес.', default: 'Порядок и на Архипелаге.' }, quests: [] },
  'sen_aspir_appliances': { id: 'sen_aspir_appliances', name: 'Продавец техники', sprite: '🔌', location: 'sen_aspir', dialog: { greet: 'Техника для Архипелага.', default: 'Доставка на любой остров.' }, quests: [] },
  'sen_aspir_cashier': { id: 'sen_aspir_cashier', name: 'Кассир', sprite: '💲', location: 'sen_aspir', dialog: { greet: 'Касса Сен Аспира.', default: 'Приятных покупок!' }, quests: [] },
  'sen_aspir_lottery': { id: 'sen_aspir_lottery', name: 'Лотерейщик', sprite: '🎰', location: 'sen_aspir', dialog: { greet: 'Лотерея Архипелага!', default: 'Удача любит смелых.' }, quests: [] },

  'ice_cave_aloha': { id: 'ice_cave_aloha', name: 'Алооха', sprite: '🥶', location: 'ice_cave_sa', dialog: { greet: 'Ледяная пещера полна тайн.', default: 'Холодно? Привыкай!' }, quests: [{ id: 'sel_ice_cave', type: 'catch_x', targetItem: null, targetQty: 3, desc: 'Поймайте 3 ледяных покемонов в пещере', rewardMoney: 900, rewardItem: 'iceStone', rewardQty: 1, prereqQuest: null }] },

  'air_stadium_forest_lenor': { id: 'air_stadium_forest_lenor', name: 'Ленор', sprite: '👧', location: 'air_stadium_forest', dialog: { greet: 'Я Ленор. Тренируюсь в лесу.', default: 'Хочешь битву?' }, quests: [{ id: 'ej_night', type: 'catch_x', targetItem: null, targetQty: 2, desc: 'Поймайте 2 покемонов ночью в лесу', rewardMoney: 500, rewardItem: 'duskStone', rewardQty: 1, prereqQuest: null }] },
  'air_stadium_forest_elder': { id: 'air_stadium_forest_elder', name: 'Старый лидер', sprite: '🧓', location: 'air_stadium_forest', dialog: { greet: 'Я бывший лидер стадиона.', default: 'Время летит...' }, quests: [] },
  'air_stadium_forest_guard': { id: 'air_stadium_forest_guard', name: 'Дежурный рейнджер', sprite: '🌲', location: 'air_stadium_forest', dialog: { greet: 'Лес патрулируется.', default: 'Рейнджеры всегда на страже.' }, quests: [{ id: 'ej_prutti', type: 'catch_x', targetItem: null, targetQty: 3, desc: 'Поймайте 3 покемонов Трико', rewardMoney: 600, rewardItem: 'greatBall', rewardQty: 5, prereqQuest: null }] },
  'air_stadium_forest_alice': { id: 'air_stadium_forest_alice', name: 'Алиса', sprite: '👧', location: 'air_stadium_forest', dialog: { greet: 'Алиса. Лепим с ребятами из грязи!', default: 'Принеси мне Чёрной грязи из Низинных болот!' }, quests: [{ id: 'ej_alice_clay', type: 'collect_items', targetItem: 'rockSample', targetQty: 3, desc: 'Принесите 3 комочка Чёрной грязи для Алисы (выбивается в Низинных болотах)', rewardMoney: 300, rewardItem: 'candy', rewardQty: 5, prereqQuest: null }] },
  'air_stadium_forest_farmer': { id: 'air_stadium_forest_farmer', name: 'Фермер', sprite: '👨‍🌾', location: 'air_stadium_forest', dialog: { greet: 'Моя пасека рядом с лесом.', default: 'Покемоны любят мой мёд!' }, quests: [{ id: 'ej_apiary', type: 'collect_items', targetItem: 'plantSample', targetQty: 4, desc: 'Принесите 4 образца растений для восстановления пасеки', rewardMoney: 400, rewardItem: 'sitrusBerry', rewardQty: 3, prereqQuest: null }] },

  'empty_city_shannon': { id: 'empty_city_shannon', name: 'Лидер Шэннон', sprite: '⚫', location: 'empty_city', dialog: { greet: 'Я Лидер Шэннон.', default: 'Тьма — это тоже сила.' }, quests: [] },
  'empty_city_silvestr': { id: 'empty_city_silvestr', name: 'Небритый Сильвестр', sprite: '🧔', location: 'empty_city', dialog: { greet: 'Тайна Потерянного города...', default: 'Город хранит секреты.' }, quests: [{ id: 'wj_lost_city', type: 'explore', targetItem: null, targetQty: 5, desc: 'Посетите 5 локаций в поисках Потерянного города', rewardMoney: 1000, rewardItem: 'duskStone', rewardQty: 1, prereqQuest: null }] },

  'volcanic_plateau_leonard': { id: 'volcanic_plateau_leonard', name: 'Леонард', sprite: '🧪', location: 'volcanic_plateau', dialog: { greet: 'Леонард.', default: 'Ингредиенты? Только вулканические.' }, quests: [{ id: 'wj_potion_quest', type: 'collect_items', targetItem: 'lavaCore', targetQty: 2, desc: 'Принесите 2 ядра магмы для зелья', rewardMoney: 600, rewardItem: 'fullRestore', rewardQty: 3, prereqQuest: null }] },
  'volcanic_plateau_paulo': { id: 'volcanic_plateau_paulo', name: 'Пауло', sprite: '👨', location: 'volcanic_plateau', dialog: { greet: 'Пауло. Живу у вулкана.', default: 'Вулкан даёт силу.' }, quests: [] },

  'rocks_wj_alvares': { id: 'rocks_wj_alvares', name: 'Альварес', sprite: '⛏️', location: 'rocks_wj', dialog: { greet: 'Альварес.', default: 'Стадион снова будет греметь!' }, quests: [{ id: 'wj_earth_stadium', type: 'collect_items', targetItem: 'rockSample', targetQty: 6, desc: 'Принесите 6 образцов породы для восстановления стадиона', rewardMoney: 1200, rewardItem: 'duskStone', rewardQty: 1, prereqQuest: null }] },
  'rocks_wj_hugo': { id: 'rocks_wj_hugo', name: 'Хьюго', sprite: '👨', location: 'rocks_wj', dialog: { greet: 'Хьюго.', default: 'Тишина скал успокаивает.' }, quests: [] },
  'rocks_wj_old_man': { id: 'rocks_wj_old_man', name: 'Дряхлый Старик', sprite: '🧓', location: 'rocks_wj', dialog: { greet: 'Я видел рождение этих скал...', default: 'Время не щадит никого.' }, quests: [] },
  'rocks_wj_pirate_char': { id: 'rocks_wj_pirate_char', name: 'Пират', sprite: '🏴‍☠️', location: 'rocks_wj', dialog: { greet: 'Пират на скалах!', default: 'Йо-хо-хо!' }, quests: [] },
  'rocks_wj_tourist': { id: 'rocks_wj_tourist', name: 'Турист', sprite: '📸', location: 'rocks_wj', dialog: { greet: 'Турист.', default: 'Говорят, это легендарное место.' }, quests: [{ id: 'wj_pride', type: 'explore', targetItem: null, targetQty: 3, desc: 'Посетите 3 локации в поисках Земель Прайда', rewardMoney: 700, rewardItem: 'sunStone', rewardQty: 1, prereqQuest: null }] },

  'deserted_road_blind': { id: 'deserted_road_blind', name: 'Незрячая', sprite: '🧑‍🦯', location: 'deserted_road_ej', dialog: { greet: 'Я не вижу, но чувствую мир.', default: 'Покемоны — мои глаза.' }, quests: [] },
  'deserted_road_bruce': { id: 'deserted_road_bruce', name: 'Брюс', sprite: '👨', location: 'deserted_road_ej', dialog: { greet: 'Брюс.', default: 'Одиночество — мой спутник.' }, quests: [] },

  'mountain_pass_scared_woman': { id: 'mountain_pass_scared_woman', name: 'Испуганная женщина', sprite: '😰', location: 'mountain_pass', dialog: { greet: 'Помогите! Здесь опасно!', default: 'Спасибо что помогли!' }, quests: [{ id: 'ej_scared', type: 'defeat_x', targetItem: null, targetQty: 3, desc: 'Победите 3 диких покемонов на горном перевале', rewardMoney: 500, rewardItem: 'potion', rewardQty: 3, prereqQuest: null }] },
  'mountain_pass_kris': { id: 'mountain_pass_kris', name: 'Крис', sprite: '👨', location: 'mountain_pass', dialog: { greet: 'Крис.', default: 'Готов к подъёму?' }, quests: [] },

  'mountain_village_archie': { id: 'mountain_village_archie', name: 'Арчи', sprite: '👨', location: 'mountain_village', dialog: { greet: 'Арчи из горной деревушки.', default: 'Горы хранят древние тайны.' }, quests: [] },
  'mountain_village_secretary': { id: 'mountain_village_secretary', name: 'Секретарь Лидера', sprite: '📋', location: 'ilde_stadium', dialog: { greet: 'Стадион драконьих покемонов.', default: 'Лидер ждёт смелых.' }, quests: [] },

  'wj_route3_kristi': { id: 'wj_route3_kristi', name: 'Жуколов Кристи', sprite: '🐛', location: 'wj_route_3', dialog: { greet: 'Жуколов Кристи.', default: 'Свадебный переполох? Я помогу!' }, quests: [{ id: 'wj_wedding', type: 'collect_items', targetItem: 'plantSample', targetQty: 3, desc: 'Принесите 3 образца растений для свадебного букета', rewardMoney: 500, rewardItem: 'lumBerry', rewardQty: 2, prereqQuest: null }] },
  'selen_adventurer': { id: 'selen_adventurer', name: 'Искатель приключений', sprite: '🧭', location: 'selen_forest', dialog: { greet: 'В этом лесу я нашёл следы легендарного покемона!', default: 'Логово дракона — моя цель. Но нужна помощь.', quest_offer: 'Помоги найти Око Мироздания: принеси {target} {item}.', quest_complete: 'Око Мироздания найдено! Легенда оживает!', quest_incomplete: 'Поиски продолжаются... Око где-то в мире.' }, quests: [{ id: 'sel_dragon_lair', type: 'explore', targetItem: null, targetQty: 6, desc: 'Отыщите Око Мироздания — посетите 6 локаций в разных регионах', rewardMoney: 10000, rewardItem: 'masterBall', rewardQty: 3, prereqQuest: null }] },
  'wj_richie': { id: 'wj_richie', name: 'Богатенький Ричи', sprite: '💰', location: 'summer', dialog: { greet: 'Ха! И в Западном Джото полно бедняков!', default: 'Деньги решают всё.', quest_offer: 'Мне нужна редкая вещь: {target} {item}. Заплачу щедро!', quest_complete: 'Великолепно! Вот твоя награда, бедняк.', quest_incomplete: 'Где мой заказ?!' }, quests: [{ id: 'wj_richie_1', type: 'collect_items', targetItem: 'rockSample', targetQty: 3, desc: 'Принесите Ричи 3 Образца породы', rewardMoney: 3000, rewardItem: 'fullRestore', rewardQty: 3, prereqQuest: null }] },
  'sa_richie': { id: 'sa_richie', name: 'Богатенький Ричи', sprite: '💰', location: 'il_de_far', dialog: { greet: 'Ха! И на Архипелаге есть бедняки!', default: 'Деньги решают всё.', quest_offer: 'Мне нужна редкая вещь: {target} {item}. Заплачу щедро!', quest_complete: 'Великолепно! Вот твоя награда, бедняк.', quest_incomplete: 'Где мой заказ?!' }, quests: [{ id: 'sa_richie_1', type: 'collect_items', targetItem: 'crystalShard', targetQty: 2, desc: 'Принесите Ричи 2 Осколка кристалла', rewardMoney: 3000, rewardItem: 'waterStone', rewardQty: 1, prereqQuest: null }] },

  'cross_alfred': { id: 'cross_alfred', name: 'Альфред', sprite: '💌', location: 'rocks_wj', dialog: { greet: 'Каждый день я смотрю на багровый закат...', default: 'Любовь не знает границ. Передай письмо моей возлюбленной в другом регионе.', quest_offer: 'Найди прекрасную незнакомку и передай ей {target} {item}.', quest_complete: 'Письмо доставлено! Спасибо, тренер!', quest_incomplete: 'Письмо ещё не доставлено...' }, quests: [{ id: 'wj_lovers', type: 'explore', targetItem: null, targetQty: 3, desc: 'Посетите 3 города разных регионов чтобы передать письмо Альфреда', rewardMoney: 5000, rewardItem: 'dawnStone', rewardQty: 1, prereqQuest: null }] },
  'cross_clown_freddy': { id: 'cross_clown_freddy', name: 'Клоун Фредди', sprite: '🤡', location: 'celadon_city', dialog: { greet: 'Цирк уехал, а клоуны остались!', default: 'Грустить нельзя!', quest_offer: 'Цирк переезжает! Посети {target} города, чтобы найти нас!', quest_complete: 'Ты нашёл цирк! Фредди счастлив!', quest_incomplete: 'Осталось ещё {target} городов...' }, quests: [{ id: 'cross_clown', type: 'explore', targetItem: null, targetQty: 3, desc: 'Посетите 3 города в поисках цирка', rewardMoney: 600, rewardItem: 'candy', rewardQty: 3, prereqQuest: null }] },
  'cross_lenart': { id: 'cross_lenart', name: 'Человек в тёмной накидке', sprite: '🥷', location: 'empty_city', dialog: { greet: 'Залечь на дно — мой план.', default: 'Не привлекайте внимания.' }, quests: [{ id: 'cross_hide', type: 'defeat_x', targetItem: null, targetQty: 3, desc: 'Победите 3 преследователей', rewardMoney: 700, rewardItem: 'fullRestore', rewardQty: 2, prereqQuest: null }] },
  'cross_dr_fins': { id: 'cross_dr_fins', name: 'Доктор Финс', sprite: '🧬', location: 'goldenrod_institute', dialog: { greet: 'Доктор Финс.', default: 'Генетика изменит мир покемонов.' }, quests: [{ id: 'cross_selection', type: 'catch_x', targetItem: null, targetQty: 4, desc: 'Поймайте 4 покемонов для исследований', rewardMoney: 1000, rewardItem: 'tm', rewardQty: 1, prereqQuest: null }] },
  'cross_journalist_erika': { id: 'cross_journalist_erika', name: 'Журналист Эрика', sprite: '🎤', location: 'new_district', dialog: { greet: 'Журналист Эрика.', default: 'Правда должна быть раскрыта.' }, quests: [{ id: 'cross_selection2', type: 'collect_items', targetItem: 'plantSample', targetQty: 3, desc: 'Принесите 3 образца для расследования', rewardMoney: 700, rewardItem: 'superPotion', rewardQty: 3, prereqQuest: 'cross_selection' }] },
  'cross_trainer_tanni': { id: 'cross_trainer_tanni', name: 'Тренер Танни', sprite: '🏃', location: 'route_19', dialog: { greet: 'Тренер Танни.', default: 'Я видел странные вещи на метеостанции.' }, quests: [{ id: 'k_meteo2', type: 'collect_items', targetItem: 'magnemiteNut', targetQty: 3, desc: 'Принесите 3 магнитные гайки для ремонта метеостанции', rewardMoney: 600, rewardItem: 'superPotion', rewardQty: 2, prereqQuest: null }] },
  'cross_pirate_captain': { id: 'cross_pirate_captain', name: 'Капитан пиратов', sprite: '🏴‍☠️', location: 'il_de_far', dialog: { greet: 'Свистать всех наверх!', default: 'Море зовёт!' }, quests: [{ id: 'sa_pirate_quest', type: 'explore', targetItem: null, targetQty: 3, desc: 'Посетите 3 острова Архипелага', rewardMoney: 800, rewardItem: 'waterStone', rewardQty: 1, prereqQuest: null }] },
  'cross_boy_fishing': { id: 'cross_boy_fishing', name: 'Мальчик с удочкой', sprite: '🎣', location: 'rocky_beach_sa', dialog: { greet: 'Рыбачу на пляже!', default: 'Клюёт! Ой, сорвалось...' }, quests: [{ id: 'sa_fishing', type: 'catch_x', targetItem: null, targetQty: 3, desc: 'Поймайте 3 водных покемонов', rewardMoney: 700, rewardItem: 'waterStone', rewardQty: 1, prereqQuest: null }] },
  'sa_surfer': { id: 'sa_surfer', name: 'Сёрфингист', sprite: '🏄', location: 'rocky_bay', dialog: { greet: 'Волны Архипелага — лучшие для гонок!', default: 'Хочешь принять участие в гонке? Обгони ветер!', quest_offer: 'Для гонки мне понадобится {target} {item}.', quest_complete: 'Невероятно! Ты обогнал ветер!', quest_incomplete: 'Гонка ещё не завершена.' }, quests: [{ id: 'sa_wind_race', type: 'explore', targetItem: null, targetQty: 4, desc: 'Примите участие в гонке — посетите 4 точки маршрута Архипелага', rewardMoney: 0, rewardItem: 'masterBall', rewardQty: 1, prereqQuest: 'sa_pirate_quest' }] },
  'cross_guide_sweets': { id: 'cross_guide_sweets', name: 'Провожатый', sprite: '🍬', location: 'confectionery', dialog: { greet: 'Провожатый в Сладкое царство.', default: 'Кондитерская — самое вкусное место!' }, quests: [{ id: 'k_sweets', type: 'collect_items', targetItem: 'plantSample', targetQty: 5, desc: 'Соберите 5 образцов растений для кондитерской', rewardMoney: 500, rewardItem: 'candy', rewardQty: 5, prereqQuest: null }] },
  'cross_trainer_derti': { id: 'cross_trainer_derti', name: 'Тренер Дёрти', sprite: '🥊', location: 'route_11', dialog: { greet: 'Тренер Дёрти.', default: 'Готов к сражению?' }, quests: [] },
  'cross_trainer_nambi': { id: 'cross_trainer_nambi', name: 'Тренер Намби', sprite: '🥊', location: 'route_8', dialog: { greet: 'Тренер Намби.', default: 'Битва — моя стихия.' }, quests: [] },
  'cross_trainer_vetti': { id: 'cross_trainer_vetti', name: 'Тренер Ветти', sprite: '🥊', location: 'route_12', dialog: { greet: 'Тренер Ветти.', default: 'Сразись со мной!' }, quests: [] },
  'cross_director_station': { id: 'cross_director_station', name: 'Директор станции', sprite: '⚡', location: 'power_plant', dialog: { greet: 'Директор электростанции.', default: 'Энергия для всего Канто!' }, quests: [{ id: 'k_power', type: 'defeat_x', targetItem: null, targetQty: 4, desc: 'Победите 4 покемонов на электростанции', rewardMoney: 800, rewardItem: 'thunderStone', rewardQty: 1, prereqQuest: null }] },
  'kanto_route18_tracy': { id: 'kanto_route18_tracy', name: 'Трейси', sprite: '📷', location: 'route_18', dialog: { greet: 'Трейси, фотограф.', default: 'Никак не поймаю удачный кадр!' }, quests: [{ id: 'k_photo', type: 'catch_x', targetItem: null, targetQty: 2, desc: 'Поймайте 2 покемонов для фотосессии', rewardMoney: 400, rewardItem: 'greatBall', rewardQty: 3, prereqQuest: null }] },
  'elite_lorelei': { id: 'elite_lorelei', name: 'Лорели', sprite: '❄️', location: 'goldenrod_stadium', dialog: { greet: 'Я Лорели, член Элитной Четвёрки. Ледяные покемоны не знают пощады.', default: 'Холод — это то, что ты почувствуешь, когда встретишь меня в бою.' }, quests: [] },
  'elite_bruno': { id: 'elite_bruno', name: 'Бруно', sprite: '💪', location: 'goldenrod_stadium', dialog: { greet: 'Я Бруно! Мои покемоны боевого типа сокрушат любого!', default: 'Тренировки делают нас сильнее. Ты готов?' }, quests: [] },
  'elite_agatha': { id: 'elite_agatha', name: 'Агата', sprite: '👻', location: 'goldenrod_stadium', dialog: { greet: 'Хе-хе... Я Агата. Призраки — мои верные спутники.', default: 'Смерть неизбежна, как и моя победа.' }, quests: [] },
  'elite_lance': { id: 'elite_lance', name: 'Лэнс', sprite: '🐉', location: 'goldenrod_stadium', dialog: { greet: 'Я Лэнс, мастер драконьих покемонов. Элитная Четвёрка — моя стихия.', default: 'Драконы — сильнейшие покемоны. Ты готов это проверить?' }, quests: [] },
  'elite_champion': { id: 'elite_champion', name: 'Чемпион Блю', sprite: '👑', location: 'goldenrod_stadium', dialog: { greet: 'Я Чемпион Лиги! Мой дед — профессор Оук. Докажи, что достоин.', default: 'Быть чемпионом — значит быть сильнейшим. Попробуй отобрать титул!' }, quests: [] },
  'summer_trainer_steve': { id: 'summer_trainer_steve', name: 'Тренер Стив', sprite: '🏄', location: 'azure_shoreline', dialog: { greet: 'Я Тренер Стив.', default: 'Расскажу интересные факты о побережье.' }, quests: [] },
  'summer_collector': { id: 'summer_collector', name: 'Коллекционер', sprite: '🎩', location: 'summer_fountain', dialog: { greet: 'Я известный коллекционер со всего региона! Моя коллекция уникальных предметов и редких покемонов ждет пополнения.', default: 'У вас есть что-то интересное для моей коллекции?', quest_offer: 'Для пополнения коллекции нужен {target} {item}.', quest_complete: 'Великолепное пополнение! Вот ваша награда.', quest_incomplete: 'Моя коллекция еще не полна...' }, quests: [{ id: 'sum_collect_1', type: 'collect_items', targetItem: 'rockSample', targetQty: 3, desc: 'Принесите 3 редких образца породы для коллекции', rewardMoney: 2000, rewardItem: 'dawnStone', rewardQty: 1, prereqQuest: 'sum_onyx' }, { id: 'sum_collect_2', type: 'catch_x', targetItem: null, targetQty: 2, desc: 'Поймайте 2 редких покемонов для коллекции', rewardMoney: 3000, rewardItem: 'shinyStone', rewardQty: 1, prereqQuest: 'sum_collect_1' }] },
  'summer_nursery_worker': { id: 'summer_nursery_worker', name: 'Работник питомника', sprite: '🥚', location: 'summer_nursery', dialog: { greet: 'Добро пожаловать в Питомник Западного Джото! Здесь вы можете получить случайных покемонов для тренировки.', default: 'Питомник всегда открыт для тренеров. Новые покемоны появляются регулярно.', quest_offer: 'Выберите набор покемонов для тренировки!', quest_complete: 'Отличная работа с питомцами! Держите награду.', quest_incomplete: 'Покемоны еще растут. Приходите позже.' }, quests: [{ id: 'sum_nursery_1', type: 'catch_x', targetItem: null, targetQty: 3, desc: 'Вырастите 3 покемонов из питомника (поймайте 3 разных вида)', rewardMoney: 1500, rewardItem: 'masterBall', rewardQty: 3, prereqQuest: null }] },
  'ostaron_mayor': { id: 'ostaron_mayor', name: 'Мэр Остарона', sprite: '🏛️', location: 'ostaron_cityhall', dialog: { greet: 'Я мэр Остарона! Наш великий город нуждается в вашей помощи в войне с Сайрефом.', default: 'Вы уже выбрали сторону? Остарон ждет вашей поддержки.', quest_offer: 'Для победы над Сайрефом нужен {target} {item}.', quest_complete: 'Остарон благодарит вас! Победа будет за нами!', quest_incomplete: 'Битва еще не выиграна...' }, quests: [{ id: 'ost_mayor_war', type: 'explore', targetItem: null, targetQty: 5, desc: 'Посетите 5 локаций Остарона для укрепления позиций', rewardMoney: 5000, rewardItem: 'duskStone', rewardQty: 1, prereqQuest: 'k_verm_1' }] },
  'melen_albert_quest': { id: 'melen_albert_quest', name: 'Альберт', sprite: '🕵️', location: 'melen_albert_house', dialog: { greet: 'Я Альберт. Моя племянница пропала! Банда захватила город... Нужно действовать за пределами закона.', default: 'Банда всё ещё там. Нужно больше подготовки.', quest_offer: 'Для спасения племянницы нужен {target} {item}.', quest_complete: 'Племянница спасена! Вы настоящий герой!', quest_incomplete: 'Племянница всё ещё в плену...' }, quests: [{ id: 'mel_albert_1', type: 'defeat_x', targetItem: null, targetQty: 5, desc: 'Победите 5 членов банды в Мелене', rewardMoney: 2000, rewardItem: 'fullRestore', rewardQty: 3, prereqQuest: 'sum_pantir_story' }, { id: 'mel_albert_2', type: 'collect_items', targetItem: 'crystalShard', targetQty: 3, desc: 'Принесите 3 осколка для взлома убежища банды', rewardMoney: 3000, rewardItem: 'waterStone', rewardQty: 2, prereqQuest: 'mel_albert_1' }] },
  'estaire_officer_jes_quest': { id: 'estaire_officer_jes_quest', name: 'Офицер Джес (расследование)', sprite: '👮‍♀️', location: 'estaire_city', dialog: { greet: 'Офицер Джес. Команда R похитила Батискафиш! Нужно расследование. У вас ранг выше 650?', default: 'Расследование продолжается. Команда R где-то рядом.', quest_offer: 'Для расследования нужен {target} {item}.', quest_complete: 'Дело раскрыто! Батискафиш в безопасности.', quest_incomplete: 'Расследование не закончено...' }, quests: [{ id: 'est_bati_1', type: 'explore', targetItem: null, targetQty: 4, desc: 'Посетите 4 локации для расследования похищения', rewardMoney: 3000, rewardItem: 'masterBall', rewardQty: 1, prereqQuest: null }] },

};