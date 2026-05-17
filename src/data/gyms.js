export const gymLeaders = {
  // === KANTO (8 gyms) Lv40 → Lv75 ===
  pewter_stadium: {
    name: 'Брок', title: 'Лидер Зала Пьютера', type: 'rock',
    badgeIcon: '🪨', trainingStage: 1,
    team: [
      { name: 'golem', level: 40 },
      { name: 'omastar', level: 40 },
      { name: 'aerodactyl', level: 40 },
      { name: 'tyranitar', level: 40 }
    ],
    badgeName: 'Boulder Badge', moneyReward: 4000,
    rewardItem: 'graphiteBell', rewardQty: 1
  },
  cerulean_stadium: {
    name: 'Мисти', title: 'Лидер Зала Церулина', type: 'water',
    badgeIcon: '💧', trainingStage: 1,
    team: [
      { name: 'starmie', level: 45 },
      { name: 'lapras', level: 45 },
      { name: 'gyarados', level: 45 },
      { name: 'poliwrath', level: 45 }
    ],
    badgeName: 'Cascade Badge', moneyReward: 5000,
    rewardItem: 'superStimulator', rewardQty: 1
  },
  vermilion_stadium: {
    name: 'Лейтенант Сёрдж', title: 'Лидер Зала Вермилиона', type: 'electric',
    badgeIcon: '⚡', trainingStage: 2,
    team: [
      { name: 'raichu', level: 50 },
      { name: 'magneton', level: 50 },
      { name: 'lanturn', level: 50 },
      { name: 'electabuzz', level: 50 }
    ],
    badgeName: 'Thunder Badge', moneyReward: 6000,
    rewardItem: 'cloneBall', rewardQty: 1
  },
  celadon_stadium: {
    name: 'Эрика', title: 'Лидер Зала Селадона', type: 'grass',
    badgeIcon: '🌿', trainingStage: 2,
    team: [
      { name: 'venusaur', level: 55 },
      { name: 'exeggutor', level: 55 },
      { name: 'jumpluff', level: 55 },
      { name: 'bellossom', level: 55 }
    ],
    badgeName: 'Rainbow Badge', moneyReward: 7000,
    rewardItem: 'centerBall', rewardQty: 1
  },
  saffron_psychic_stadium: {
    name: 'Сабрина', title: 'Лидер Зала Шаффрана', type: 'psychic',
    badgeIcon: '🔮', trainingStage: 2,
    team: [
      { name: 'alakazam', level: 60 },
      { name: 'espeon', level: 60 },
      { name: 'mr-mime', level: 60 },
      { name: 'hypno', level: 60 }
    ],
    badgeName: 'Marsh Badge', moneyReward: 8000,
    rewardItem: 'superStimulator', rewardQty: 1
  },
  fuchsia_poison_stadium: {
    name: 'Кога', title: 'Лидер Зала Фуксии', type: 'poison',
    badgeIcon: '☠️', trainingStage: 3,
    team: [
      { name: 'gengar', level: 65 },
      { name: 'crobat', level: 65 },
      { name: 'tentacruel', level: 65 },
      { name: 'muk', level: 65 }
    ],
    badgeName: 'Soul Badge', moneyReward: 9000,
    rewardItem: 'cloneBall', rewardQty: 1
  },
  cinnabar_stadium: {
    name: 'Блейн', title: 'Лидер Зала Синнабара', type: 'fire',
    badgeIcon: '🔥', trainingStage: 3,
    team: [
      { name: 'charizard', level: 70 },
      { name: 'arcanine', level: 70 },
      { name: 'houndoom', level: 70 },
      { name: 'magmar', level: 70 }
    ],
    badgeName: 'Volcano Badge', moneyReward: 10000,
    rewardItem: 'centerBall', rewardQty: 1
  },
  viridian_stadium: {
    name: 'Джованни', title: 'Босс Команды R', type: 'ground',
    badgeIcon: '🏜️', trainingStage: 3,
    team: [
      { name: 'nidoking', level: 75 },
      { name: 'rhydon', level: 75 },
      { name: 'dugtrio', level: 75 },
      { name: 'gligar', level: 75 }
    ],
    badgeName: 'Earth Badge', moneyReward: 11000,
    rewardItem: 'graphiteBell', rewardQty: 1
  },

  // === JOHTO (8 gyms) Lv80 → Lv115 ===
  flourence_stadium: {
    name: 'Фолкнер', title: 'Лидер Зала Флоренса', type: 'flying',
    badgeIcon: '🕊️', trainingStage: 4,
    team: [
      { name: 'pidgeot', level: 80 },
      { name: 'skarmory', level: 80 },
      { name: 'gligar', level: 80 },
      { name: 'aerodactyl', level: 80 }
    ],
    badgeName: 'Zephyr Badge', moneyReward: 12000,
    rewardItem: 'superStimulator', rewardQty: 1
  },
  alston_steel_stadium: {
    name: 'Багси', title: 'Лидер Зала Алстона', type: 'bug',
    badgeIcon: '🐛', trainingStage: 4,
    team: [
      { name: 'scizor', level: 85 },
      { name: 'heracross', level: 85 },
      { name: 'scyther', level: 85 },
      { name: 'beedrill', level: 85 }
    ],
    badgeName: 'Hive Badge', moneyReward: 13000,
    rewardItem: 'cloneBall', rewardQty: 1
  },
  goldenrod_stadium: {
    name: 'Уитни', title: 'Лидер Зала Голденрода', type: 'normal',
    badgeIcon: '⭐', trainingStage: 4,
    team: [
      { name: 'snorlax', level: 90 },
      { name: 'blissey', level: 90 },
      { name: 'kangaskhan', level: 90 },
      { name: 'tauros', level: 90 }
    ],
    badgeName: 'Plain Badge', moneyReward: 14000,
    rewardItem: 'centerBall', rewardQty: 1
  },
  warhall_battle_stadium: {
    name: 'Морти', title: 'Лидер Зала Вархолла', type: 'ghost',
    badgeIcon: '👻', trainingStage: 5,
    team: [
      { name: 'gengar', level: 95 },
      { name: 'misdreavus', level: 95 },
      { name: 'sableye', level: 95 },
      { name: 'banette', level: 95 }
    ],
    badgeName: 'Fog Badge', moneyReward: 15000,
    rewardItem: 'graphiteBell', rewardQty: 1
  },
  ostaron_ice_stadium: {
    name: 'Чак', title: 'Лидер Зала Остарона', type: 'fighting',
    badgeIcon: '👊', trainingStage: 5,
    team: [
      { name: 'machamp', level: 100 },
      { name: 'hitmonlee', level: 100 },
      { name: 'hitmonchan', level: 100 },
      { name: 'primeape', level: 100 }
    ],
    badgeName: 'Storm Badge', moneyReward: 16000,
    rewardItem: 'superStimulator', rewardQty: 1
  },
  olivine_water_stadium: {
    name: 'Жасмин', title: 'Лидер Зала Оливина', type: 'steel',
    badgeIcon: '⚙️', trainingStage: 5,
    team: [
      { name: 'steelix', level: 105 },
      { name: 'skarmory', level: 105 },
      { name: 'mawile', level: 105 },
      { name: 'aggron', level: 105 }
    ],
    badgeName: 'Mineral Badge', moneyReward: 17000,
    rewardItem: 'cloneBall', rewardQty: 1
  },
  sayref_air_stadium: {
    name: 'Прайс', title: 'Лидер Зала Сайрефа', type: 'ice',
    badgeIcon: '❄️', trainingStage: 6,
    team: [
      { name: 'dewgong', level: 110 },
      { name: 'cloyster', level: 110 },
      { name: 'jynx', level: 110 },
      { name: 'piloswine', level: 110 }
    ],
    badgeName: 'Glacier Badge', moneyReward: 18000,
    rewardItem: 'centerBall', rewardQty: 1
  },
  ilde_stadium: {
    name: 'Клер', title: 'Лидер Зала Иль де Фар', type: 'dragon',
    badgeIcon: '🐉', trainingStage: 6,
    team: [
      { name: 'dragonite', level: 115 },
      { name: 'salamence', level: 115 },
      { name: 'altaria', level: 115 },
      { name: 'flygon', level: 115 }
    ],
    badgeName: 'Rising Badge', moneyReward: 20000,
    rewardItem: 'graphiteBell', rewardQty: 1
  }
};
