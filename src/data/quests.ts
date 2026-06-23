// Quest definitions — static data

export const QUEST_TYPES = ['catch_x', 'defeat_x', 'earn_money', 'explore', 'use_item', 'collect_items'];

export const QUEST_CONFIGS = [
  // Original 8
  { id: 'catch_5', type: 'catch_x', target: 5, desc: 'Поймайте 5 покемонов', rewardMoney: 500, rewardItem: 'pokeBall', rewardQty: 3 },
  { id: 'defeat_10', type: 'defeat_x', target: 10, desc: 'Победите 10 диких покемонов', rewardMoney: 800, rewardItem: 'potion', rewardQty: 2 },
  { id: 'earn_1000', type: 'earn_money', target: 1000, desc: 'Заработайте $1000', rewardMoney: 300, rewardItem: 'rareCandy', rewardQty: 2 },
  { id: 'explore_5', type: 'explore', target: 5, desc: 'Посетите 5 разных локаций', rewardMoney: 400, rewardItem: 'superPotion', rewardQty: 1 },
  { id: 'use_3', type: 'use_item', target: 3, desc: 'Используйте 3 предмета в бою', rewardMoney: 200, rewardItem: 'rareCandy', rewardQty: 1 },
  { id: 'collect_hair', type: 'collect_items', targetItem: 'venonatHair', target: 3, desc: 'Соберите 3 Волоска Веноната', rewardMoney: 300, rewardItem: 'rareCandy', rewardQty: 1 },
  { id: 'collect_bone', type: 'collect_items', targetItem: 'cuboneBone', target: 2, desc: 'Соберите 2 Кости Кьюбона', rewardMoney: 400, rewardItem: 'greatBall', rewardQty: 2 },
  { id: 'collect_coals', type: 'collect_items', targetItem: 'coals', target: 4, desc: 'Соберите 4 Уголька', rewardMoney: 350, rewardItem: 'potion', rewardQty: 3 },
  // New quests based on wiki references
  { id: 'catch_10', type: 'catch_x', target: 10, desc: 'Поймайте 10 покемонов', rewardMoney: 1200, rewardItem: 'greatBall', rewardQty: 5 },
  { id: 'catch_15', type: 'catch_x', target: 15, desc: 'Поймайте 15 покемонов', rewardMoney: 2000, rewardItem: 'ultraBall', rewardQty: 3 },
  { id: 'defeat_20', type: 'defeat_x', target: 20, desc: 'Победите 20 диких покемонов', rewardMoney: 1500, rewardItem: 'superPotion', rewardQty: 3 },
  { id: 'defeat_5', type: 'defeat_x', target: 5, desc: 'Победите 5 диких покемонов', rewardMoney: 400, rewardItem: 'pokeBall', rewardQty: 3 },
  { id: 'earn_5000', type: 'earn_money', target: 5000, desc: 'Заработайте $5000', rewardMoney: 1000, rewardItem: 'hpUp', rewardQty: 2 },
  { id: 'earn_10000', type: 'earn_money', target: 10000, desc: 'Заработайте $10000', rewardMoney: 2000, rewardItem: 'evolutionStone', rewardQty: 1 },
  { id: 'explore_10', type: 'explore', target: 10, desc: 'Посетите 10 разных локаций', rewardMoney: 800, rewardItem: 'fullRestore', rewardQty: 1 },
  { id: 'use_8', type: 'use_item', target: 8, desc: 'Используйте 8 предметов в бою', rewardMoney: 500, rewardItem: 'superPotion', rewardQty: 3 },
  { id: 'collect_fire', type: 'collect_items', targetItem: 'lavaCore', target: 3, desc: 'Соберите 3 Лавовых Ядра', rewardMoney: 900, rewardItem: 'fireStone', rewardQty: 1 },
  { id: 'collect_water', type: 'collect_items', targetItem: 'crystalShard', target: 3, desc: 'Соберите 3 Кристалла', rewardMoney: 600, rewardItem: 'waterStone', rewardQty: 1 },
  { id: 'collect_plant', type: 'collect_items', targetItem: 'plantSample', target: 4, desc: 'Соберите 4 Образца Растений', rewardMoney: 700, rewardItem: 'leafStone', rewardQty: 1 },
  { id: 'collect_venom', type: 'collect_items', targetItem: 'seviperVenom', target: 2, desc: 'Соберите 2 Яда Севайпера', rewardMoney: 800, rewardItem: 'fullRestore', rewardQty: 2 },
];
