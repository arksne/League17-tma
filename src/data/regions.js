export const REGIONS = {
  kanto: {
    name: 'Канто',
    locations: {
      'pallet_town': {
        name: 'Алабастия (Pallet Town)', desc: 'Тихий городок на юге Канто. Здесь живёт профессор Оук — ведущий специалист по покемонам.',
        image: 'wiki_images/Vermilion.jpg', links: ['route_1', 'route_21'], encounters: [{ id: 'mel_albert_0', type: 'collect_items', targetItem: 'magnemiteNut', targetQty: 2, desc: 'Принесите 2 магнитные гайки для Альберта', rewardMoney: 500, rewardItem: 'superPotion', rewardQty: 2, prereqQuest: null }], hasHeal: true, hasWater: true, region: 'kanto'
      },
      'route_1': {
        name: 'Маршрут 1', desc: 'Первый маршрут тренера — дорога между Алабастией и Виридианом.',
        image: 'wiki_images/generic_route.png', links: ['pallet_town', 'viridian_city'], encounters: ['pidgey', 'rattata'], hasHeal: false, region: 'kanto'
      },
      'viridian_city': {
        name: 'Виридиан', desc: 'Город вечной зелени. Знаменит статуей Виридианского покемона.',
        image: '', links: ['route_1', 'route_2', 'route_22', 'viridian_stadium'], encounters: [], hasHeal: true, region: 'kanto'
      },
      'viridian_stadium': {
        name: 'Земляной Стадион', desc: 'Арена земляных покемонов Джованни.',
        image: '', links: ['viridian_city'], encounters: [],
        hasHeal: false, hasWater: false, region: 'kanto'
      },
      'route_22': {
        name: 'Маршрут 22', desc: 'Обходная дорога к Плато Индиго через Дорогу Победы.',
        image: 'wiki_images/generic_route.png', links: ['viridian_city', 'victory_road'], encounters: ['mankey', 'spearow', 'rattata'], hasHeal: false, region: 'kanto'
      },
      'route_2': {
        name: 'Маршрут 2', desc: 'Дорога через лес, ведущая в Виридианский Лес и Пещеру Диглеттов.',
        image: 'wiki_images/Doroga_2.jpg', links: ['viridian_city', 'viridian_forest', 'diglett_cave'], encounters: ['caterpie', 'weedle', 'pidgey'], hasHeal: false, region: 'kanto'
      },
      'viridian_forest': {
        name: 'Виридианский Лес', desc: 'Густой лес полный насекомых-покемонов. Естественный лабиринт для новичков.',
        image: 'wiki_images/generic_route.png', links: ['route_2', 'pewter_city'], encounters: ['caterpie', 'metapod', 'weedle', 'kakuna', 'pikachu'], hasHeal: false, region: 'kanto'
      },
      'pewter_city': {
        name: 'Пьютер', desc: 'Каменный город у подножия гор. Здесь находится музей ископаемых.',
        image: '', links: ['viridian_forest', 'route_3', 'pewter_stadium', 'pewter_pokecenter'], encounters: [], hasHeal: true, region: 'kanto'
      },
      'pewter_pokecenter': {
        name: 'Покецентр', desc: 'Центр лечения покемонов в Пьютере.',
        image: '', links: ['pewter_city'], encounters: [],
        hasHeal: true, hasWater: false, region: 'kanto'
      },
      'pewter_stadium': {
        name: 'Каменный Стадион', desc: 'Арена каменных покемонов Брока.',
        image: '', links: ['pewter_city'], encounters: [],
        hasHeal: false, hasWater: false, region: 'kanto'
      },
      'route_3': {
        name: 'Маршрут 3', desc: 'Горная тропа ведущая к Лунной Горе. Популярна у тренеров-альпинистов.',
        image: 'wiki_images/generic_route.png', links: ['pewter_city', 'mt_moon'], encounters: ['spearow', 'jigglypuff', 'nidoran-f', 'nidoran-m'], hasHeal: false, region: 'kanto'
      },
      'mt_moon': {
        name: 'Лунная Гора (Mt. Moon)', desc: 'Огромная пещера известная метеоритными дождями. Здесь обитают редкие Клефейри.',
        image: 'wiki_images/generic_route.png', links: ['route_3', 'route_4'], encounters: ['zubat', 'geodude', 'clefairy', 'paras'], hasHeal: false, hasWater: false, region: 'kanto'
      },
      'route_4': {
        name: 'Маршрут 4', desc: 'Крутой спуск с Лунной Горы к Церулину. Живописный вид на залив.',
        image: 'wiki_images/generic_route.png', links: ['mt_moon', 'cerulean_city'], encounters: ['rattata', 'spearow', 'ekans', 'sandshrew'], hasHeal: false, region: 'kanto'
      },
      'cerulean_city': {
        name: 'Церулин', desc: 'Водный город с знаменитым фонтаном. Здесь тренирует Мисти — мастер водных покемонов.',
        image: 'wiki_images/Serulin.jpeg', links: ['route_4', 'route_24', 'route_5', 'route_9', 'cerulean_pokecenter', 'cerulean_pokemarket', 'cerulean_bike_shop', 'cerulean_cafe_rain', 'cerulean_tavern', 'cerulean_stadium'], encounters: [], hasHeal: true, hasWater: true, region: 'kanto'
      },
      'cerulean_stadium': {
        name: 'Водный Стадион', desc: 'Арена водных покемонов Мисти.',
        image: '', links: ['cerulean_city'], encounters: [],
        hasHeal: false, hasWater: false, region: 'kanto'
      },
      'cerulean_pokecenter': {
        name: 'Покецентр', desc: 'Центр лечения покемонов в Церулине.',
        image: '', links: ['cerulean_city'], encounters: [],
        hasHeal: true, hasWater: false, region: 'kanto'
      },
      'cerulean_pokemarket': {
        name: 'Покемаркет', desc: 'Магазин товаров для тренеров.',
        image: '', links: ['cerulean_city'], encounters: [],
        hasHeal: false, hasWater: false, region: 'kanto'
      },
      'cerulean_bike_shop': {
        name: 'Веломагазин', desc: 'Магазин велосипедов.',
        image: '', links: ['cerulean_city'], encounters: [],
        hasHeal: false, hasWater: false, region: 'kanto'
      },
      'cerulean_cafe_rain': {
        name: 'Кафе «Rain»', desc: 'Уютное кафе в центре Церулина.',
        image: '', links: ['cerulean_city'], encounters: [],
        hasHeal: false, hasWater: false, region: 'kanto'
      },
      'cerulean_tavern': {
        name: 'Таверна', desc: 'Старая таверна Церулина.',
        image: '', links: ['cerulean_city'], encounters: [],
        hasHeal: false, hasWater: false, region: 'kanto'
      },
      'route_24': {
        name: 'Маршрут 24', desc: 'Живописный мост через реку. Знаменит тренерами-самородками.',
        image: 'wiki_images/generic_route.png', links: ['cerulean_city', 'route_25'], encounters: ['weedle', 'caterpie', 'abra', 'bellsprout'], hasHeal: false, region: 'kanto'
      },
      'route_25': {
        name: 'Маршрут 25', desc: 'Тупиковая дорога к мысу, где живёт исследователь Билл.',
        image: 'wiki_images/generic_route.png', links: ['route_24'], encounters: ['pidgey', 'oddish', 'venonat'], hasHeal: false, region: 'kanto'
      },
      'route_5': {
        name: 'Маршрут 5', desc: 'Короткая дорога от Церулина до мегаполиса Шаффран.',
        image: 'wiki_images/generic_route.png', links: ['cerulean_city', 'saffron'], encounters: ['meowth', 'mankey', 'pidgey'], hasHeal: false, region: 'kanto'
      },
      'saffron': {
        name: 'Шаффран', desc: 'Крупнейший мегаполис Канто. Здесь базируется штаб-квартира Лиги 17 и Академия Голденрода.',
        image: 'wiki_images/Vostochnyj_Shaffran.jpg', links: ['route_5', 'route_6', 'route_7', 'route_8', 'saffron_west_pokemarket', 'saffron_psychic_stadium', 'saffron_needle_house', 'saffron_swot_lab', 'saffron_east_station', 'saffron_east_pokecenter', 'saffron_silph_co', 'goldenrod_academy_branch'], encounters: [], hasHeal: true, region: 'kanto'
      },
      'saffron_west_pokemarket': {
        name: 'Покемаркет (Западный)', desc: 'Магазин в западной части Шаффрана.',
        image: '', links: ['saffron'], encounters: [],
        hasHeal: false, hasWater: false, region: 'kanto'
      },
      'saffron_psychic_stadium': {
        name: 'Психический Стадион', desc: 'Арена психических покемонов Сабрины.',
        image: '', links: ['saffron'], encounters: [],
        hasHeal: false, hasWater: false, region: 'kanto'
      },
      'saffron_needle_house': {
        name: 'Дом с иглой', desc: 'Загадочный дом в Западном Шаффране.',
        image: '', links: ['saffron'], encounters: [],
        hasHeal: false, hasWater: false, region: 'kanto'
      },
      'saffron_swot_lab': {
        name: 'Лаборатория Свота', desc: 'Исследовательская лаборатория.',
        image: '', links: ['saffron'], encounters: [],
        hasHeal: false, hasWater: false, region: 'kanto'
      },
      'saffron_east_station': {
        name: 'Вокзал (Восточный)', desc: 'Железнодорожный вокзал.',
        image: '', links: ['saffron'], encounters: [],
        hasHeal: false, hasWater: false, region: 'kanto'
      },
      'saffron_east_pokecenter': {
        name: 'Покецентр (Восточный)', desc: 'Центр лечения в восточном Шаффране.',
        image: '', links: ['saffron'], encounters: [],
        hasHeal: true, hasWater: false, region: 'kanto'
      },
      'saffron_silph_co': {
        name: 'Силф Ко', desc: 'Штаб-квартира корпорации Силф.',
        image: '', links: ['saffron'], encounters: [],
        hasHeal: false, hasWater: false, region: 'kanto'
      },
      'route_6': {
        name: 'Маршрут 6', desc: 'Южная дорога от Шаффрана к портовому Вермилиону.',
        image: 'wiki_images/generic_route.png', links: ['saffron', 'vermilion'], encounters: ['pidgey', 'rattata', 'meowth', 'psyduck', 'oddish'], hasHeal: false, hasWater: true, region: 'kanto'
      },
      'vermilion': {
        name: 'Вермилион', desc: 'Крупнейший порт Канто. Отсюда ходят паромы в другие регионы.',
        image: '', links: ['route_6', 'route_11', 'vermilion_pokecenter', 'vermilion_pokemarket', 'vermilion_stadium', 'vermilion_port', 'vermilion_fanclub', 'vermilion_library', 'vermilion_circus'], encounters: [], hasHeal: true, hasWater: true, region: 'kanto'
      },
      'vermilion_pokecenter': {
        name: 'Покецентр', desc: 'Центр лечения покемонов в Вермилионе.',
        image: '', links: ['vermilion'], encounters: [],
        hasHeal: true, hasWater: false, region: 'kanto'
      },
      'vermilion_pokemarket': {
        name: 'Покемаркет', desc: 'Магазин товаров для тренеров.',
        image: '', links: ['vermilion'], encounters: [],
        hasHeal: false, hasWater: false, region: 'kanto'
      },
      'vermilion_stadium': {
        name: 'Электрический Стадион', desc: 'Арена электрических покемонов Сёрджа.',
        image: '', links: ['vermilion'], encounters: [],
        hasHeal: false, hasWater: false, region: 'kanto'
      },
      'vermilion_port': {
        name: 'Порт', desc: 'Крупный порт Канто.',
        image: '', links: ['vermilion'], encounters: [],
        hasHeal: false, hasWater: true, region: 'kanto'
      },
      'vermilion_fanclub': {
        name: 'Фан-клуб покемонов', desc: 'Клуб фанатов покемонов.',
        image: '', links: ['vermilion'], encounters: [],
        hasHeal: false, hasWater: false, region: 'kanto'
      },
      'vermilion_library': {
        name: 'Библиотека', desc: 'Городская библиотека Вермилиона.',
        image: '', links: ['vermilion'], encounters: [],
        hasHeal: false, hasWater: false, region: 'kanto'
      },
      'vermilion_circus': {
        name: 'Цирковой шатёр', desc: 'Передвижной цирк с покемонами.',
        image: '', links: ['vermilion'], encounters: [],
        hasHeal: false, hasWater: false, region: 'kanto'
      },
      'route_11': {
        name: 'Маршрут 11', desc: 'Восточная дорога вдоль побережья, ведущая к Пещере Диглеттов.',
        image: 'wiki_images/generic_route.png', links: ['vermilion', 'diglett_cave', 'route_12'], encounters: ['spearow', 'ekans', 'sandshrew', 'drowzee'], hasHeal: false, hasWater: true, region: 'kanto'
      },
      'diglett_cave': {
        name: 'Пещера Диглеттов', desc: 'Подземный тоннель, прорытый Диглеттами. Соединяет Вермилион с Маршрутом 2.',
        image: 'wiki_images/Peshhera_Digletov.jpg', links: ['route_11', 'route_2'], encounters: ['diglett', 'dugtrio'], hasHeal: false, region: 'kanto'
      },
      'route_9': {
        name: 'Маршрут 9', desc: 'Скалистая дорога на восток от Церулина к реке и Каменному Тоннелю.',
        image: 'wiki_images/generic_route.png', links: ['cerulean_city', 'route_10'], encounters: ['rattata', 'spearow', 'ekans', 'sandshrew'], hasHeal: false, region: 'kanto'
      },
      'route_10': {
        name: 'Маршрут 10', desc: 'Берег реки у Каменного Тоннеля. Популярное место рыбалки.',
        image: 'wiki_images/generic_route.png', links: ['route_9', 'rock_tunnel', 'lavender_town'], encounters: ['voltorb', 'magnemite', 'machop'], hasHeal: false, hasWater: true, region: 'kanto'
      },
      'rock_tunnel': {
        name: 'Каменный Тоннель', desc: 'Тёмный и извилистый тоннель сквозь гору. Без фонарика не пройти.',
        image: '', links: ['route_10'], encounters: ['zubat', 'geodude', 'machop', 'onix'], hasHeal: false, region: 'kanto'
      },
      'lavender_town': {
        name: 'Лавандия', desc: 'Город упокоения покемонов. Здесь находится Башня Призраков.',
        image: 'wiki_images/Lavandia.jpg', links: ['route_10', 'route_8', 'route_11', 'lavender_pokecenter', 'lavender_pokemarket', 'lavender_radio_tower'], encounters: ['gastly', 'haunter', 'cubone'], hasHeal: true, region: 'kanto'
      },
      'lavender_pokecenter': {
        name: 'Покецентр', desc: 'Центр лечения покемонов в Лавандии.',
        image: '', links: ['lavender_town'], encounters: [],
        hasHeal: true, hasWater: false, region: 'kanto'
      },
      'lavender_pokemarket': {
        name: 'Покемаркет', desc: 'Магазин товаров для тренеров.',
        image: '', links: ['lavender_town'], encounters: [],
        hasHeal: false, hasWater: false, region: 'kanto'
      },
      'lavender_radio_tower': {
        name: 'Радиобашня', desc: 'Радиобашня Лавандии.',
        image: '', links: ['lavender_town'], encounters: [],
        hasHeal: false, hasWater: false, region: 'kanto'
      },
      'route_8': {
        name: 'Маршрут 8', desc: 'Западная дорога от Лавандии в Шаффран через холмы.',
        image: 'wiki_images/generic_route.png', links: ['lavender_town', 'saffron'], encounters: ['pidgey', 'meowth', 'growlithe', 'vulpix'], hasHeal: false, region: 'kanto'
      },
      'route_7': {
        name: 'Маршрут 7', desc: 'Короткая дорога между Селадоном и Шаффраном.',
        image: 'wiki_images/generic_route.png', links: ['celadon_city', 'saffron'], encounters: ['meowth', 'oddish', 'bellsprout'], hasHeal: false, region: 'kanto'
      },
      'celadon_city': {
        name: 'Селадон', desc: 'Город развлечений с крупнейшим универмагом и игровым центром.',
        image: 'wiki_images/Celadon.jpg', links: ['route_7', 'route_16', 'confectionery', 'celadon_stadium'], encounters: [], hasHeal: true, region: 'kanto'
      },
      'celadon_stadium': {
        name: 'Травяной Стадион', desc: 'Арена травяных покемонов Эрики.',
        image: '', links: ['celadon_city'], encounters: [],
        hasHeal: false, hasWater: false, region: 'kanto'
      },
      'confectionery': {
        name: 'Кондитерская', desc: 'Знаменитая кондитерская Селадона. Сладкие покемоны обожают это место.',
        image: '', links: ['celadon_city'], encounters: ['jigglypuff', 'clefairy', 'chansey'], hasHeal: false, region: 'kanto'
      },
      'route_16': {
        name: 'Маршрут 16', desc: 'Начало Велосипедной Дорожки. Соединяет Селадон с Фуксией.',
        image: 'wiki_images/generic_route.png', links: ['celadon_city', 'route_17'], encounters: ['spearow', 'doduo', 'rattata', 'grimer'], hasHeal: false, region: 'kanto'
      },
      'route_17': {
        name: 'Велосипедная дорожка (М17)', desc: 'Длинный вело-мост над морем. Популярна у байкеров.',
        image: 'wiki_images/generic_route.png', links: ['route_16', 'route_18'], encounters: ['doduo', 'fearow', 'grimer', 'ponyta'], hasHeal: false, region: 'kanto'
      },
      'route_18': {
        name: 'Маршрут 18', desc: 'Конец Велосипедной Дорожки у ворот Фуксии.',
        image: 'wiki_images/generic_route.png', links: ['route_17', 'fuchsia_city'], encounters: ['doduo', 'fearow', 'rattata'], hasHeal: false, region: 'kanto'
      },
      'fuchsia_city': {
        name: 'Фуксия', desc: 'Город ниндзя с Сафари-Зоной и древним зоопарком.',
        image: 'wiki_images/Fuksija.jpg', links: ['route_18', 'safari_zone', 'route_15', 'route_19', 'fuchsia_pokecenter', 'fuchsia_pokemarket', 'fuchsia_poison_stadium', 'fuchsia_beach'], encounters: [], hasHeal: true, hasWater: true, region: 'kanto'
      },
      'fuchsia_pokecenter': {
        name: 'Покецентр', desc: 'Центр лечения покемонов в Фуксии.',
        image: '', links: ['fuchsia_city'], encounters: [],
        hasHeal: true, hasWater: false, region: 'kanto'
      },
      'fuchsia_pokemarket': {
        name: 'Покемаркет', desc: 'Магазин товаров для тренеров.',
        image: '', links: ['fuchsia_city'], encounters: [],
        hasHeal: false, hasWater: false, region: 'kanto'
      },
      'fuchsia_poison_stadium': {
        name: 'Ядовитый Стадион', desc: 'Арена ядовитых покемонов Коги.',
        image: '', links: ['fuchsia_city'], encounters: [],
        hasHeal: false, hasWater: false, region: 'kanto'
      },
      'fuchsia_beach': {
        name: 'Пляж', desc: 'Пляж на окраине Фуксии.',
        image: '', links: ['fuchsia_city'], encounters: [],
        hasHeal: false, hasWater: true, region: 'kanto'
      },
      'fuchsia_beach_pier': {
        name: 'Пирс', desc: 'Пирс фуксийского пляжа.',
        image: '', links: ['fuchsia_city'], encounters: [],
        hasHeal: false, hasWater: true, region: 'kanto'
      },
      'safari_zone': {
        name: 'Сафари Зона', desc: 'Огромный заповедник, где обитают редчайшие покемоны Канто.',
        image: '', links: ['fuchsia_city'], encounters: ['nidoran-f', 'nidoran-m', 'exeggcute', 'rhyhorn', 'chansey', 'scyther', 'pinsir', 'tauros'], hasHeal: false, region: 'kanto'
      },
      'route_15': {
        name: 'Маршрут 15', desc: 'Восточный тракт от Фуксии на север.',
        image: 'wiki_images/generic_route.png', links: ['fuchsia_city', 'route_14'], encounters: ['oddish', 'bellsprout', 'venonat', 'ditto'], hasHeal: false, region: 'kanto'
      },
      'route_14': {
        name: 'Маршрут 14', desc: 'Прибрежная дорога с видом на море. Много диких уток.',
        image: 'wiki_images/generic_route.png', links: ['route_15', 'route_13'], encounters: ['pidgey', 'pidgeotto', 'ditto'], hasHeal: false, hasWater: true, region: 'kanto'
      },
      'route_13': {
        name: 'Маршрут 13', desc: 'Деревянный мост-лабиринт через залив. Проверка на терпение.',
        image: 'wiki_images/generic_route.png', links: ['route_14', 'route_12'], encounters: ['pidgey', 'oddish', 'bellsprout', 'venonat'], hasHeal: false, hasWater: true, region: 'kanto'
      },
      'route_12': {
        name: 'Маршрут 12', desc: 'Длинный мост рыбаков. Здесь когда-то спал гигантский Снорлакс.',
        image: 'wiki_images/generic_route.png', links: ['route_13', 'lavender_town', 'route_11'], encounters: ['tentacool', 'magikarp', 'snorlax'], hasHeal: false, hasWater: true, region: 'kanto'
      },
      'route_19': {
        name: 'Маршрут 19', desc: 'Морской маршрут от Фуксии к Островам Морской Пены.',
        image: 'wiki_images/generic_route.png', links: ['fuchsia_city', 'route_20'], encounters: ['tentacool', 'magikarp'], hasHeal: false, hasWater: true, region: 'kanto'
      },
      'route_20': {
        name: 'Маршрут 20', desc: 'Бурные воды вокруг Островов Морской Пены. Только на плав-покемоне.',
        image: 'wiki_images/generic_route.png', links: ['route_19', 'seafoam_islands', 'cinnabar_island'], encounters: ['tentacool', 'magikarp', 'lapras'], hasHeal: false, hasWater: true, region: 'kanto'
      },
      'seafoam_islands': {
        name: 'Острова Морской Пены', desc: 'Ледяные пещеры в сердце архипелага. Говорят, здесь обитает Артикуно.',
        image: '', links: ['route_20'], encounters: ['seel', 'slowpoke', 'zubat', 'golbat', 'jynx', 'articuno'], hasHeal: false, hasWater: true, region: 'kanto'
      },
      'cinnabar_island': {
        name: 'Синнабар', desc: 'Вулканический остров с покемон-лабораторией. Жаркий климат круглый год.',
        image: '', links: ['route_20', 'route_21', 'cinnabar_stadium'], encounters: ['grimer', 'muk', 'koffing', 'weezing'], hasHeal: true, hasWater: true, region: 'kanto'
      },
      'cinnabar_stadium': {
        name: 'Огненный Стадион', desc: 'Арена огненных покемонов Блейна.',
        image: '', links: ['cinnabar_island'], encounters: [],
        hasHeal: false, hasWater: false, region: 'kanto'
      },
      'route_21': {
        name: 'Маршрут 21', desc: 'Длинный морской путь от Синнабара до Алабастии.',
        image: 'wiki_images/generic_route.png', links: ['cinnabar_island', 'pallet_town'], encounters: ['tentacool', 'tangela'], hasHeal: false, hasWater: true, region: 'kanto'
      },
      'bicycle_road': {
        name: 'Велосипедная дорожка', desc: 'Скоростная трасса для велосипедистов через весь Канто.',
        image: 'wiki_images/generic_route.png', links: ['celadon_city', 'fuchsia_city'], encounters: ['doduo', 'ponyta', 'rattata'], hasHeal: false, region: 'kanto'
      },
      'brick_bridge': {
        name: 'Кирпичный мост', desc: 'Старинный кирпичный мост над рекой. Место встречи тренеров.',
        image: 'wiki_images/Kirpichnyj_most.jpg', links: ['route_11', 'route_12'], encounters: ['magikarp', 'poliwag', 'goldeen'], hasHeal: false, hasWater: true, region: 'kanto'
      },
      'labyrinth': {
        name: 'Лабиринт', desc: 'Запутанный природный лабиринт. Проверка на ориентирование для тренеров.',
        image: '', links: ['route_11'], encounters: ['gastly', 'haunter', 'drowzee', 'abra'], hasHeal: false, region: 'kanto'
      },
      'potato_cave': {
        name: 'Пещера Потатов', desc: 'Пещера, где обитают колонии покемонов-овощей.',
        image: 'wiki_images/generic_route.png', links: ['route_24'], encounters: ['oddish', 'bellsprout', 'exeggcute', 'paras'], hasHeal: false, region: 'kanto'
      },
      'goldenrod_academy_branch': {
        name: 'Филиал Академии Голденрода', desc: 'Кантоский филиал престижной Академии Голденрода.',
        image: 'wiki_images/Goldenrod_Place.jpg', links: ['saffron'], encounters: [], hasHeal: true, region: 'kanto'
      },
      'power_plant': {
        name: 'Электростанция', desc: 'Заброшенная электростанция у реки. Пристанище электрических покемонов.',
        image: '', links: ['route_10'], encounters: ['voltorb', 'magnemite', 'magneton', 'electabuzz', 'zapdos'], hasHeal: false, region: 'kanto'
      },
      'victory_road': {
        name: 'Дорога Победы', desc: 'Последнее и тяжелейшее испытание перед Плато Индиго. Элитные тренеры повсюду.',
        image: 'wiki_images/generic_route.png', links: ['route_22', 'indigo_plateau'], encounters: ['machop', 'geodude', 'zubat', 'onix'], hasHeal: false, region: 'kanto'
      },
      'indigo_plateau': {
        name: 'Плато Индиго', desc: 'Вершина Канто. Здесь заседает Элитная Четвёрка и Чемпион.',
        image: 'wiki_images/generic_route.png', links: ['victory_road'], encounters: [], hasHeal: true, region: 'kanto'
      },
      'pokecenter': {
        name: 'Покецентр', desc: 'Центр помощи покемонам. Сестра Джой и дневной питомник.',
        image: '', links: [], encounters: [], hasHeal: false, region: 'kanto'
      }
    }
  },
  east_johto: {
    name: 'Восточный Джото',
    locations: {
      'goldenrod': {
        name: 'Голденрод', desc: 'Столица Восточного Джото и крупнейший город мира Лиги 17. Здесь начинают путь все тренеры.',
        image: '',
        links: ['ej_route_1', 'ej_route_2', 'ej_route_3', 'ej_route_4', 'ej_route_8', 'goldenrod_prison', 'goldenrod_pokecenter', 'goldenrod_supermarket', 'goldenrod_institute', 'goldenrod_academy', 'goldenrod_bar', 'goldenrod_cityhall', 'goldenrod_stadium'],
        encounters: ['pidgey', 'zubat', 'grimer', 'murkrow'], hasHeal: true, region: 'east_johto'
      },
      'goldenrod_stadium': {
        name: 'Обычный Стадион', desc: 'Арена обычных покемонов Уитни.',
        image: '', links: ['goldenrod'], encounters: [],
        hasHeal: false, hasWater: false, region: 'east_johto'
      },
      'goldenrod_prison': {
        name: 'Тюрьма', desc: 'Городская тюрьма Голденрода.',
        image: '', links: ['goldenrod'], encounters: [],
        hasHeal: false, hasWater: false, region: 'east_johto'
      },
      'goldenrod_pokecenter': {
        name: 'Покецентр', desc: 'Центр лечения покемонов в Голденроде.',
        image: '', links: ['goldenrod'], encounters: [],
        hasHeal: true, hasWater: false, region: 'east_johto'
      },
      'goldenrod_supermarket': {
        name: 'Супермаркет', desc: 'Крупнейший супермаркет города.',
        image: '', links: ['goldenrod'], encounters: [],
        hasHeal: false, hasWater: false, region: 'east_johto'
      },
      'goldenrod_institute': {
        name: 'Научный институт', desc: 'Исследовательский институт.',
        image: '', links: ['goldenrod'], encounters: [],
        hasHeal: false, hasWater: false, region: 'east_johto'
      },
      'goldenrod_academy': {
        name: 'Академия Тренеров Покемонов', desc: 'Престижная академия подготовки тренеров.',
        image: '', links: ['goldenrod', 'goldenrod_academy_training', 'goldenrod_academy_aviary', 'goldenrod_academy_green', 'goldenrod_academy_lab'], encounters: [],
        hasHeal: false, hasWater: false, region: 'east_johto'
      },
      'goldenrod_academy_training': {
        name: 'Тренировочная зона', desc: 'Зона для тренировок в Академии.',
        image: '', links: ['goldenrod_academy'], encounters: [],
        hasHeal: false, hasWater: false, region: 'east_johto'
      },
      'goldenrod_academy_aviary': {
        name: 'Вольер', desc: 'Вольер с летающими покемонами. Временно закрыт.',
        image: '', links: ['goldenrod_academy'], encounters: [],
        hasHeal: false, hasWater: false, region: 'east_johto'
      },
      'goldenrod_academy_green': {
        name: 'Зелёная зона', desc: 'Парковая зона Академии. Доступ только для обучения.',
        image: '', links: ['goldenrod_academy'], encounters: [],
        hasHeal: false, hasWater: false, region: 'east_johto'
      },
      'goldenrod_academy_lab': {
        name: 'Лаборатория', desc: 'Научная лаборатория Академии.',
        image: '', links: ['goldenrod_academy'], encounters: [],
        hasHeal: false, hasWater: false, region: 'east_johto'
      },
      'goldenrod_bar': {
        name: 'Бар', desc: 'Популярный бар в центре.',
        image: '', links: ['goldenrod'], encounters: [],
        hasHeal: false, hasWater: false, region: 'east_johto'
      },
      'goldenrod_cityhall': {
        name: 'Мэрия', desc: 'Здание мэрии Голденрода.',
        image: '', links: ['goldenrod'], encounters: [],
        hasHeal: false, hasWater: false, region: 'east_johto'
      },
      'goldenrod_cityhall_admin': {
        name: 'Администраторская зона', desc: 'Административные помещения.',
        image: '', links: ['goldenrod'], encounters: [],
        hasHeal: false, hasWater: false, region: 'east_johto'
      },
      'ej_route_1': {
        name: 'Дорога №1', desc: 'Первый тракт от Голденрода. Оживлённая дорога для начинающих тренеров.',
        image: 'wiki_images/generic_route.png', links: ['goldenrod', 'ej_route_2', 'deserted_road_ej'],
        encounters: ['sentret', 'pidgey', 'rattata'], hasHeal: false, region: 'east_johto'
      },
      'ej_route_2': {
        name: 'Дорога №2', desc: 'Дорога к Мосту и Оливину. Развилка к Воздушному Стадиону.',
        image: 'wiki_images/generic_route.png', links: ['goldenrod', 'ej_route_1', 'bridge_ej', 'air_stadium_forest'],
        encounters: ['sentret', 'hoothoot', 'spinarak'], hasHeal: false, region: 'east_johto'
      },
      'bridge_ej': {
        name: 'Мост', desc: 'Кирпичный мост через пролив, соединяющий дороги с Оливином.',
        image: 'wiki_images/generic_route.png', links: ['ej_route_2', 'olivine'],
        encounters: ['magikarp', 'tentacool'], hasHeal: false, region: 'east_johto'
      },
      'olivine': {
        name: 'Оливин', desc: 'Портовый город с маяком. Отсюда ходят корабли в Канто и на остров Селен.',
        image: 'wiki_images/Olivin.jpg', links: ['bridge_ej', 'olivine_water_stadium', 'olivine_pokecenter', 'olivine_shop', 'olivine_bar_pirate', 'olivine_beach', 'olivine_aquapark', 'olivine_house_221'],
        encounters: ['shellder', 'wingull', 'krabby', 'magikarp'], hasHeal: true, hasWater: true, region: 'east_johto'
      },
      'olivine_water_stadium': {
        name: 'Стальной Стадион', desc: 'Арена стальных покемонов Жасмин.',
        image: '', links: ['olivine'], encounters: [],
        hasHeal: false, hasWater: true, region: 'east_johto'
      },
      'olivine_pokecenter': {
        name: 'Покецентр', desc: 'Центр лечения покемонов в Оливине.',
        image: '', links: ['olivine'], encounters: [],
        hasHeal: true, hasWater: false, region: 'east_johto'
      },
      'olivine_shop': {
        name: 'Магазин Воттэр', desc: 'Фирменный магазин товаров.',
        image: '', links: ['olivine'], encounters: [],
        hasHeal: false, hasWater: false, region: 'east_johto'
      },
      'olivine_bar_pirate': {
        name: 'Бар Пиратское убежище', desc: 'Бар в портовом районе.',
        image: '', links: ['olivine'], encounters: [],
        hasHeal: false, hasWater: false, region: 'east_johto'
      },
      'olivine_beach': {
        name: 'Пляж', desc: 'Городской пляж Оливина.',
        image: '', links: ['olivine'], encounters: [],
        hasHeal: false, hasWater: true, region: 'east_johto'
      },
      'olivine_beach_pier': {
        name: 'Причал', desc: 'Причал оливинского пляжа.',
        image: '', links: ['olivine'], encounters: [],
        hasHeal: false, hasWater: true, region: 'east_johto'
      },
      'olivine_beach_lighthouse': {
        name: 'Маяк', desc: 'Старый маяк на побережье.',
        image: '', links: ['olivine'], encounters: [],
        hasHeal: false, hasWater: true, region: 'east_johto'
      },
      'olivine_beach_malibu': {
        name: 'Бар Malibu', desc: 'Пляжный бар на побережье.',
        image: '', links: ['olivine'], encounters: [],
        hasHeal: false, hasWater: false, region: 'east_johto'
      },
      'olivine_aquapark': {
        name: 'Аквапарк', desc: 'Развлекательный водный комплекс.',
        image: '', links: ['olivine'], encounters: [],
        hasHeal: false, hasWater: true, region: 'east_johto'
      },
      'olivine_house_221': {
        name: 'Дом 221', desc: 'Жилой дом №221.',
        image: '', links: ['olivine'], encounters: [],
        hasHeal: false, hasWater: false, region: 'east_johto'
      },
      'ej_route_3': {
        name: 'Дорога №3', desc: 'Цветущая дорога из Голденрода в город цветов Флауренцию.',
        image: 'wiki_images/generic_route.png', links: ['goldenrod', 'flourence', 'overgrown_trail'],
        encounters: ['pidgey', 'spearow', 'mareep'], hasHeal: false, region: 'east_johto'
      },
      'flourence': {
        name: 'Флауренция', desc: 'Город цветов с тёплым климатом, оранжереями и первым гимом Джото.',
        image: '', links: ['ej_route_3', 'farm_ej', 'flourence_greenhouse', 'flourence_pokecenter', 'flourence_recycling', 'flourence_tech_shop', 'flourence_stadium'],
        encounters: [], hasHeal: true, region: 'east_johto'
      },
      'flourence_stadium': {
        name: 'Воздушный Стадион', desc: 'Арена летающих покемонов Фолкнера.',
        image: '', links: ['flourence'], encounters: [],
        hasHeal: false, hasWater: false, region: 'east_johto'
      },
      'flourence_greenhouse': {
        name: 'Оранжерея цветов', desc: 'Красивая оранжерея с редкими растениями.',
        image: '', links: ['flourence'], encounters: [],
        hasHeal: false, hasWater: false, region: 'east_johto'
      },
      'flourence_pokecenter': {
        name: 'Покецентр', desc: 'Центр лечения покемонов в Флауренции.',
        image: '', links: ['flourence'], encounters: [],
        hasHeal: true, hasWater: false, region: 'east_johto'
      },
      'flourence_recycling': {
        name: 'Пункт переработки', desc: 'Экологический пункт переработки.',
        image: '', links: ['flourence'], encounters: [],
        hasHeal: false, hasWater: false, region: 'east_johto'
      },
      'flourence_tech_shop': {
        name: 'Магазин техники', desc: 'Магазин технических устройств.',
        image: '', links: ['flourence'], encounters: [],
        hasHeal: false, hasWater: false, region: 'east_johto'
      },
      'farm_ej': {
        name: 'Ферма', desc: 'Сельская местность с пастбищами. Дом для Милтанков и Тауросов.',
        image: '', links: ['flourence', 'ej_route_8'],
        encounters: ['miltank', 'tauros', 'mareep'], hasHeal: false, region: 'east_johto'
      },
      'ej_route_4': {
        name: 'Дорога №4', desc: 'Дорога в новейший город Вархолл через скалистую местность.',
        image: 'wiki_images/generic_route.png', links: ['goldenrod', 'warhall', 'rocks_ej'],
        encounters: ['growlithe', 'spearow', 'ekans'], hasHeal: false, region: 'east_johto'
      },
      'warhall': {
        name: 'Вархолл', desc: 'Новейший город с автовокзалом. Отсюда ходят автобусы в Западное Джото.',
        image: 'wiki_images/Varholl.jpg', links: ['ej_route_4', 'ej_route_9', 'warhall_pokecenter', 'warhall_bill_shop', 'warhall_bill_pawnshop', 'warhall_samurai_house', 'warhall_samurai_gym', 'warhall_battle_stadium', 'warhall_museum', 'warhall_bus_station'],
        encounters: [], hasHeal: true, region: 'east_johto'
      },
      'warhall_pokecenter': {
        name: 'Покецентр', desc: 'Центр лечения покемонов в Вархолле.',
        image: '', links: ['warhall'], encounters: [],
        hasHeal: true, hasWater: false, region: 'east_johto'
      },
      'warhall_bill_shop': {
        name: 'Магазин Билла', desc: 'Магазин изобретателя Билла.',
        image: '', links: ['warhall'], encounters: [],
        hasHeal: false, hasWater: false, region: 'east_johto'
      },
      'warhall_bill_pawnshop': {
        name: 'Ломбард', desc: 'Ломбард при магазине Билла.',
        image: '', links: ['warhall'], encounters: [],
        hasHeal: false, hasWater: false, region: 'east_johto'
      },
      'warhall_samurai_house': {
        name: 'Дом самурая', desc: 'Традиционный дом мастера.',
        image: '', links: ['warhall'], encounters: [],
        hasHeal: false, hasWater: false, region: 'east_johto'
      },
      'warhall_samurai_gym': {
        name: 'Спортивный зал', desc: 'Тренировочный зал.',
        image: '', links: ['warhall'], encounters: [],
        hasHeal: false, hasWater: false, region: 'east_johto'
      },
      'warhall_battle_stadium': {
        name: 'Призрачный Стадион', desc: 'Арена призрачных покемонов Морти.',
        image: '', links: ['warhall'], encounters: [],
        hasHeal: false, hasWater: false, region: 'east_johto'
      },
      'warhall_museum': {
        name: 'Музей истории', desc: 'Музей истории Восточного Джото.',
        image: '', links: ['warhall'], encounters: [],
        hasHeal: false, hasWater: false, region: 'east_johto'
      },
      'warhall_museum_workshops': {
        name: 'Мастерские', desc: 'Реставрационные мастерские.',
        image: '', links: ['warhall'], encounters: [],
        hasHeal: false, hasWater: false, region: 'east_johto'
      },
      'warhall_bus_station': {
        name: 'Автовокзал', desc: 'Междугородний автовокзал.',
        image: '', links: ['warhall'], encounters: [],
        hasHeal: false, hasWater: false, region: 'east_johto'
      },
      'ej_route_8': {
        name: 'Дорога №8', desc: 'Прямая дорога от Голденрода к Ферме.',
        image: 'wiki_images/generic_route.png', links: ['goldenrod', 'farm_ej'],
        encounters: ['pidgey', 'spearow', 'rattata'], hasHeal: false, region: 'east_johto'
      },
      'ej_route_9': {
        name: 'Дорога №9', desc: 'Путь от Вархолла на север через предгорья.',
        image: 'wiki_images/generic_route.png', links: ['warhall', 'mountain_pass'],
        encounters: ['geodude', 'machop', 'onix'], hasHeal: false, region: 'east_johto'
      },
      'alston': {
        name: 'Олстон', desc: 'Городок бродячих артистов с цирком покемонов. Расположен в горах.',
        image: '', links: ['deserted_road_ej', 'mountain_pass', 'alston_circus', 'alston_pokecenter', 'alston_shop', 'alston_granny_house', 'alston_steel_stadium', 'alston_soul_stadium'],
        encounters: [], hasHeal: true, region: 'east_johto'
      },
      'alston_circus': {
        name: 'Цирк покемонов', desc: 'Знаменитый цирк с покемонами.',
        image: '', links: ['alston'], encounters: [],
        hasHeal: false, hasWater: false, region: 'east_johto'
      },
      'alston_pokecenter': {
        name: 'Покецентр', desc: 'Центр лечения покемонов в Олстоне.',
        image: '', links: ['alston'], encounters: [],
        hasHeal: true, hasWater: false, region: 'east_johto'
      },
      'alston_shop': {
        name: 'Магазин', desc: 'Местный магазин товаров.',
        image: '', links: ['alston'], encounters: [],
        hasHeal: false, hasWater: false, region: 'east_johto'
      },
      'alston_granny_house': {
        name: 'Дом старушки', desc: 'Дом пожилой женщины.',
        image: '', links: ['alston'], encounters: [],
        hasHeal: false, hasWater: false, region: 'east_johto'
      },
      'alston_steel_stadium': {
        name: 'Стадион Жуков', desc: 'Арена насекомых-покемонов Багси.',
        image: '', links: ['alston'], encounters: [],
        hasHeal: false, hasWater: false, region: 'east_johto'
      },
      'alston_soul_stadium': {
        name: 'Стадион Души', desc: 'Загадочная арена духовного типа.',
        image: '', links: ['alston'], encounters: [],
        hasHeal: false, hasWater: false, region: 'east_johto'
      },
      'deserted_road_ej': {
        name: 'Безлюдная дорога', desc: 'Пустынная дорога у Олстона. Ночью здесь появляются призрачные Коффинги.',
        image: 'wiki_images/Bezljudnaja_doroga.jpg', links: ['alston', 'ej_route_1'],
        encounters: ['koffing', 'rattata', 'meowth'], hasHeal: false, region: 'east_johto'
      },
      'rocks_ej': {
        name: 'Скалы', desc: 'Скалистая гряда Восточного Джото. Обитель каменных покемонов.',
        image: 'wiki_images/LOK_Восточный_Джото_Скалы.PNG', links: ['ej_route_4'],
        encounters: ['geodude', 'onix', 'machop'], hasHeal: false, region: 'east_johto'
      },
      'overgrown_trail': {
        name: 'Заросшая тропа', desc: 'Густо заросшая растениями тропа. Травяные покемоны процветают здесь.',
        image: 'wiki_images/generic_route.png', links: ['ej_route_3'],
        encounters: ['oddish', 'bellsprout', 'paras'], hasHeal: false, region: 'east_johto'
      },
      'air_stadium_forest': {
        name: 'Лес вокруг воздушного стадиона', desc: 'Густой лес с редкими летающими покемонами.',
        image: 'wiki_images/Les_vokrug_vozdushnogo_stadiona.jpg', links: ['ej_route_2'],
        encounters: ['caterpie', 'weedle', 'hoothoot', 'pineco'], hasHeal: false, region: 'east_johto'
      },
      'mountain_pass': {
        name: 'Горный перевал', desc: 'Высокогорный перевал через хребет. Путь к Олстону.',
        image: 'wiki_images/generic_route.png', links: ['alston', 'ej_route_9'],
        encounters: ['geodude', 'machop', 'zubat', 'clefairy'], hasHeal: false, region: 'east_johto'
      },
      'lowland_marshes': {
        name: 'Низинные болота', desc: 'Обширные болота с редкими ядовитыми и водными покемонами.',
        image: 'wiki_images/generic_route.png', links: ['overgrown_trail'],
        encounters: ['ekans', 'grimer', 'poliwag', 'wooper'], hasHeal: false, region: 'east_johto'
      },
      'new_district': {
        name: 'Новый район', desc: 'Современный район Голденрода с высотками и офисами Лиги.',
        image: '', links: ['goldenrod'],
        encounters: ['magnemite', 'voltorb', 'porygon'], hasHeal: true, region: 'east_johto'
      },
      'old_district': {
        name: 'Старый район', desc: 'Исторический центр Голденрода. Узкие улочки и старинные здания.',
        image: '', links: ['goldenrod'],
        encounters: ['gastly', 'meowth', 'rattata'], hasHeal: false, region: 'east_johto'
      }
    }
  },
  west_johto: {
    name: 'Западный Джото',
    locations: {
      'city_gates_wj': {
        name: 'Ворота перед городом', desc: 'Въездные ворота в Западное Джото. Контрольный пункт для путников.',
        image: '', links: ['summer'],
        encounters: [], hasHeal: false, region: 'west_johto'
      },
      'summer': {
        name: 'Саммер', desc: 'Столица Западного Джото. Здесь есть Покепарк и Научный институт.',
        image: 'wiki_images/Vozviwennost.jpg', links: ['city_gates_wj', 'elevation_wj', 'wj_route_1', 'wj_route_3', 'wj_route_4', 'summer_pokemarket', 'summer_fountain', 'summer_pub', 'summer_library', 'summer_pokepark', 'summer_police', 'summer_institute', 'summer_pokecenter', 'summer_mountain_road', 'summer_mountain_fork', 'summer_nursery'],
        encounters: [], hasHeal: true, region: 'west_johto'
      },
      'summer_pokemarket': {
        name: 'Покемаркет', desc: 'Магазин товаров для тренеров.',
        image: '', links: ['summer'], encounters: [],
        hasHeal: false, hasWater: false, region: 'west_johto'
      },
      'summer_fountain': {
        name: 'Фонтан', desc: 'Центральный фонтан Саммера.',
        image: '', links: ['summer'], encounters: [],
        hasHeal: false, hasWater: false, region: 'west_johto'
      },
      'summer_pub': {
        name: 'Паб Хаус', desc: 'Уютный паб в районе фонтана.',
        image: '', links: ['summer'], encounters: [],
        hasHeal: false, hasWater: false, region: 'west_johto'
      },
      'summer_library': {
        name: 'Библиотека', desc: 'Городская библиотека Саммера.',
        image: '', links: ['summer'], encounters: [],
        hasHeal: false, hasWater: false, region: 'west_johto'
      },
      'summer_pokepark': {
        name: 'Поке-парк', desc: 'Парк для прогулок с покемонами.',
        image: '', links: ['summer'], encounters: [],
        hasHeal: false, hasWater: false, region: 'west_johto'
      },
      'summer_police': {
        name: 'Полицейский участок', desc: 'Полицейский участок Саммера.',
        image: '', links: ['summer'], encounters: [],
        hasHeal: false, hasWater: false, region: 'west_johto'
      },
      'summer_institute': {
        name: 'Институт Саммера', desc: 'Научно-исследовательский институт.',
        image: '', links: ['summer'], encounters: [],
        hasHeal: false, hasWater: false, region: 'west_johto'
      },
      'summer_pokecenter': {
        name: 'Покецентр', desc: 'Центр лечения покемонов в Саммере.',
        image: '', links: ['summer'], encounters: [],
        hasHeal: true, hasWater: false, region: 'west_johto'
      },
      'summer_mountain_road': {
        name: 'Дорога к горе', desc: 'Дорога ведущая к горному перевалу.',
        image: '', links: ['summer'], encounters: [],
        hasHeal: false, hasWater: false, region: 'west_johto'
      },
      'summer_mountain_fork': {
        name: 'Развилка', desc: 'Развилка на дороге к горе.',
        image: '', links: ['summer'], encounters: [],
        hasHeal: false, hasWater: false, region: 'west_johto'
      },
      'summer_nursery': {
        name: 'Питомник Западного Джото', desc: 'Питомник для разведения покемонов.',
        image: '', links: ['summer'], encounters: [],
        hasHeal: false, hasWater: false, region: 'west_johto'
      },
      'elevation_wj': {
        name: 'Возвышенность', desc: 'Холмистая возвышенность над Саммером. Популярное место для тренировок.',
        image: '', links: ['summer', 'wj_route_1'],
        encounters: ['geodude', 'sandshrew'], hasHeal: false, region: 'west_johto'
      },
      'wj_route_1': {
        name: 'Маршрут №1', desc: 'Первый маршрут Западного Джото — саванна с дикими огненными покемонами.',
        image: 'wiki_images/generic_route.png', links: ['summer', 'elevation_wj', 'wj_route_2', 'rocks_wj'],
        encounters: ['growlithe', 'ekans', 'spearow'], hasHeal: false, region: 'west_johto'
      },
      'wj_route_2': {
        name: 'Маршрут №2', desc: 'Дорога через саванну в прибрежный Мелен.',
        image: 'wiki_images/generic_route.png', links: ['wj_route_1', 'melen'],
        encounters: ['growlithe', 'ponyta', 'sandshrew'], hasHeal: false, region: 'west_johto'
      },
      'melen': {
        name: 'Мелен', desc: 'Прибрежный пастуший городок с дайвинг-центром и мастерской масок.',
        image: 'wiki_images/Vulkan.jpg', links: ['wj_route_2', 'melen_craig_shop', 'melen_craig_director', 'melen_pier', 'melen_dive_center', 'melen_mask_workshop', 'melen_fiona_house', 'melen_albert_house'],
        encounters: ['poliwag', 'tentacool'], hasHeal: true, region: 'west_johto'
      },
      'melen_craig_shop': {
        name: 'Магазин Крейга', desc: 'Известный магазин коллекционера.',
        image: '', links: ['melen'], encounters: [],
        hasHeal: false, hasWater: false, region: 'west_johto'
      },
      'melen_craig_director': {
        name: 'Комната директора', desc: 'Кабинет директора магазина.',
        image: '', links: ['melen'], encounters: [],
        hasHeal: false, hasWater: false, region: 'west_johto'
      },
      'melen_pier': {
        name: 'Причал', desc: 'Причал в Мелене.',
        image: '', links: ['melen'], encounters: [],
        hasHeal: false, hasWater: true, region: 'west_johto'
      },
      'melen_dive_center': {
        name: 'Дайвинг-Центр', desc: 'Центр подводного плавания.',
        image: '', links: ['melen'], encounters: [],
        hasHeal: false, hasWater: true, region: 'west_johto'
      },
      'melen_mask_workshop': {
        name: 'Мастерская Масок', desc: 'Мастерская по изготовлению масок.',
        image: '', links: ['melen'], encounters: [],
        hasHeal: false, hasWater: false, region: 'west_johto'
      },
      'melen_fiona_house': {
        name: 'Дом Фионы', desc: 'Дом тренера Фионы.',
        image: '', links: ['melen'], encounters: [],
        hasHeal: false, hasWater: false, region: 'west_johto'
      },
      'melen_albert_house': {
        name: 'Дом Альберта', desc: 'Дом исследователя Альберта.',
        image: '', links: ['melen'], encounters: [],
        hasHeal: false, hasWater: false, region: 'west_johto'
      },
      'wj_route_3': {
        name: 'Маршрут №3', desc: 'Путь на восток от Саммера к каменным площадкам.',
        image: 'wiki_images/generic_route.png', links: ['summer', 'stone_platform_wj'],
        encounters: ['machop', 'geodude'], hasHeal: false, region: 'west_johto'
      },
      'stone_platform_wj': {
        name: 'Каменная площадка', desc: 'Ровная каменная платформа посреди саванны.',
        image: 'wiki_images/KamennayaPlowadka.jpg', links: ['wj_route_3', 'volcanic_plateau'],
        encounters: ['onix', 'geodude', 'rhyhorn'], hasHeal: false, region: 'west_johto'
      },
      'volcanic_plateau': {
        name: 'Вулканическое плато', desc: 'Жаркое плато у потухшего вулкана. Огненные покемоны повсюду.',
        image: 'wiki_images/generic_route.png', links: ['stone_platform_wj'],
        encounters: ['ponyta', 'magmar', 'growlithe'], hasHeal: false, region: 'west_johto'
      },
      'wj_route_4': {
        name: 'Маршрут №4', desc: 'Четвёртый маршрут — дорога на юг от Саммера к ручью.',
        image: 'wiki_images/generic_route.png', links: ['summer', 'stream_wj'],
        encounters: ['spearow', 'rattata'], hasHeal: false, region: 'west_johto'
      },
      'stream_wj': {
        name: 'Ручей', desc: 'Освежающий ручей в жаркой саванне. Оазис для водных покемонов.',
        image: 'wiki_images/Ru4ey.jpg', links: ['wj_route_4', 'abandoned_road_wj'],
        encounters: ['magikarp', 'poliwag', 'goldeen'], hasHeal: false, hasWater: true, region: 'west_johto'
      },
      'rocks_wj': {
        name: 'Скалы (З.Джото)', desc: 'Скалистая гряда в Западном Джото. Диглетты изрыли здесь всё.',
        image: 'wiki_images/SkaliZD.jpg', links: ['wj_route_1'],
        encounters: ['geodude', 'onix', 'diglett'], hasHeal: false, region: 'west_johto'
      },
      'small_rock_wj': {
        name: 'Небольшая скала', desc: 'Одинокая скала посреди саванны. Место обитания редких покемонов.',
        image: '', links: ['wj_route_1'],
        encounters: ['geodude', 'onix', 'aerodactyl'], hasHeal: false, region: 'west_johto'
      },
      'man_made_cave': {
        name: 'Рукотворная пещера', desc: 'Искусственная пещера, вырытая шахтёрами. Лабиринт с сокровищами.',
        image: 'wiki_images/generic_route.png', links: ['stone_platform_wj'],
        encounters: ['zubat', 'geodude', 'onix', 'golbat'], hasHeal: false, region: 'west_johto'
      },
      'abandoned_road_wj': {
        name: 'Заброшенная дорога (З.Джото)', desc: 'Старая дорога у ручья, ведущая в никуда.',
        image: 'wiki_images/Zabroshennaja_doroga.jpg', links: ['stream_wj'],
        encounters: ['rattata', 'spearow', 'mankey'], hasHeal: false, region: 'west_johto'
      },
      'empty_city': {
        name: 'Опустевший город (Flёr)', desc: 'Древний заброшенный город Флёр. Доступ только после квеста и с запасом воды.',
        image: 'wiki_images/Zabroshennoe_pomeste.jpg', links: ['wj_route_2'],
        encounters: ['gastly', 'haunter', 'gengar', 'misdreavus'], hasHeal: false, region: 'west_johto'
      },
      'arena_wj': {
        name: 'Арена Западного Джото', desc: 'Боевая арена под открытым небом. Место проведения турниров.',
        image: '', links: ['summer'],
        encounters: [], hasHeal: true, region: 'west_johto'
      }
    }
  },
  selen_island: {
    name: 'Остров Селен',
    locations: {
      'ostaron': {
        name: 'Остарон', desc: 'Столица Селена, благословлённая легендарным покемоном. Стадион Ледяных покемонов.',
        image: 'wiki_images/Ostaron.jpg', links: ['sel_route_4', 'sel_route_5', 'sel_route_8', 'ostaron_pokecenter', 'ostaron_pokemarket', 'ostaron_bar', 'ostaron_cityhall', 'ostaron_ice_stadium'],
        encounters: [], hasHeal: true, region: 'selen_island'
      },
      'ostaron_pokecenter': {
        name: 'Покецентр', desc: 'Центр лечения покемонов в Остароне.',
        image: '', links: ['ostaron'], encounters: [],
        hasHeal: true, hasWater: false, region: 'selen_island'
      },
      'ostaron_pokemarket': {
        name: 'Покемаркет', desc: 'Магазин товаров для тренеров.',
        image: '', links: ['ostaron'], encounters: [],
        hasHeal: false, hasWater: false, region: 'selen_island'
      },
      'ostaron_bar': {
        name: 'Бар Ледокол', desc: 'Популярный бар в портовом районе.',
        image: '', links: ['ostaron'], encounters: [],
        hasHeal: false, hasWater: false, region: 'selen_island'
      },
      'ostaron_cityhall': {
        name: 'Мэрия', desc: 'Здание мэрии Остарона.',
        image: '', links: ['ostaron'], encounters: [],
        hasHeal: false, hasWater: false, region: 'selen_island'
      },
      'ostaron_ice_stadium': {
        name: 'Боевой Стадион', desc: 'Арена боевых покемонов Чака.',
        image: '', links: ['ostaron'], encounters: [],
        hasHeal: false, hasWater: false, region: 'selen_island'
      },
      'sel_route_4': {
        name: 'Маршрут 4 (Селен)', desc: 'Дорога от столицы на юг острова.',
        image: 'wiki_images/generic_route.png', links: ['ostaron', 'sel_route_5'],
        encounters: ['swinub', 'snorunt', 'delibird'], hasHeal: false, region: 'selen_island'
      },
      'sel_route_5': {
        name: 'Маршрут 5 (Селен)', desc: 'Центральный путь к Перекрёстку.',
        image: 'wiki_images/generic_route.png', links: ['ostaron', 'sel_route_4', 'crossroads_sel', 'abandoned_estate'],
        encounters: ['swinub', 'bergmite'], hasHeal: false, region: 'selen_island'
      },
      'crossroads_sel': {
        name: 'Перекрёсток', desc: 'Центральный перекрёсток дорог Селена — сердце транспортной сети.',
        image: 'wiki_images/generic_route.png', links: ['sel_route_5', 'sel_route_10', 'abandoned_road_sel', 'selen_forest'],
        encounters: ['pidgey', 'spearow'], hasHeal: false, region: 'selen_island'
      },
      'sel_route_10': {
        name: 'Маршрут 10 (Селен)', desc: 'Южная дорога к Сайрефу через леса.',
        image: 'wiki_images/generic_route.png', links: ['crossroads_sel', 'sel_route_11', 'selen_forest'],
        encounters: ['swinub', 'delibird'], hasHeal: false, region: 'selen_island'
      },
      'sel_route_11': {
        name: 'Маршрут 11 (Селен)', desc: 'Подход к пригороду Сайрефа. Виднеются шпили города.',
        image: 'wiki_images/generic_route.png', links: ['sel_route_10', 'sayref_suburb'],
        encounters: ['swinub', 'pidgey'], hasHeal: false, region: 'selen_island'
      },
      'sayref_suburb': {
        name: 'Пригород Сайрефа', desc: 'Пригород с цифровым табло почёта тренеров.',
        image: 'wiki_images/Prigorod_Sajrefa.jpg', links: ['sel_route_11', 'sayref'],
        encounters: ['swinub'], hasHeal: false, region: 'selen_island'
      },
      'sayref': {
        name: 'Сайреф', desc: 'Второй по величине город Селена. Снеговик-символ города.',
        image: 'wiki_images/Sajref.jpg', links: ['sayref_suburb', 'sel_route_13', 'sel_route_16', 'sayref_pokemarket', 'sayref_pokecenter', 'sayref_air_stadium', 'sayref_cityhall'],
        encounters: [], hasHeal: true, region: 'selen_island'
      },
      'sayref_pokemarket': {
        name: 'Покемаркет', desc: 'Магазин товаров для тренеров.',
        image: '', links: ['sayref'], encounters: [],
        hasHeal: false, hasWater: false, region: 'selen_island'
      },
      'sayref_pokecenter': {
        name: 'Покецентр', desc: 'Центр лечения покемонов в Сайрефе.',
        image: '', links: ['sayref'], encounters: [],
        hasHeal: true, hasWater: false, region: 'selen_island'
      },
      'sayref_air_stadium': {
        name: 'Ледяной Стадион', desc: 'Арена ледяных покемонов Прайса.',
        image: '', links: ['sayref'], encounters: [],
        hasHeal: false, hasWater: false, region: 'selen_island'
      },
      'sayref_cityhall': {
        name: 'Мэрия', desc: 'Здание мэрии Сайрефа.',
        image: '', links: ['sayref'], encounters: [],
        hasHeal: false, hasWater: false, region: 'selen_island'
      },
      'sel_route_13': {
        name: 'Маршрут 13 (Селен)', desc: 'Путь к Восточному тракту и дальше к Эстайр сити.',
        image: 'wiki_images/generic_route.png', links: ['sayref', 'eastern_tract'],
        encounters: ['pidgey', 'spearow'], hasHeal: false, region: 'selen_island'
      },
      'eastern_tract': {
        name: 'Восточный тракт', desc: 'Главная восточная магистраль Селена.',
        image: 'wiki_images/generic_route.png', links: ['sayref', 'sel_route_14'],
        encounters: ['tauros', 'pidgeotto'], hasHeal: false, hasWater: false, region: 'selen_island'
      },
      'sel_route_14': {
        name: 'Маршрут 14 (Селен)', desc: 'Подъездная дорога к торговому центру — Эстайр сити.',
        image: 'wiki_images/generic_route.png', links: ['eastern_tract', 'estaire_city'],
        encounters: ['pidgey', 'rattata'], hasHeal: false, region: 'selen_island'
      },
      'estaire_city': {
        name: 'Эстайр сити', desc: 'Торговое сердце Селена с верфью, супермаркетом и аукционом.',
        image: 'wiki_images/Estajr_siti.jpg', links: ['sel_route_14', 'sel_route_15', 'sel_route_17', 'estaire_pokecenter', 'estaire_daycare_center', 'estaire_supermarket', 'estaire_water_stadium', 'estaire_south_pier', 'estaire_museum', 'estaire_private_shop'],
        encounters: [], hasHeal: true, region: 'selen_island'
      },
      'estaire_pokecenter': {
        name: 'Покецентр', desc: 'Центр лечения покемонов в Эстайр сити.',
        image: '', links: ['estaire_city'], encounters: [],
        hasHeal: true, hasWater: false, region: 'selen_island'
      },
      'estaire_daycare_center': {
        name: 'Центр передержки', desc: 'Центр временной передержки.',
        image: '', links: ['estaire_city'], encounters: [],
        hasHeal: false, hasWater: false, region: 'selen_island'
      },
      'estaire_supermarket': {
        name: 'Супермаркет', desc: 'Крупный супермаркет.',
        image: '', links: ['estaire_city'], encounters: [],
        hasHeal: false, hasWater: false, region: 'selen_island'
      },
      'estaire_supermarket_cozy': {
        name: 'Уютные товары', desc: 'Отдел товаров для дома.',
        image: '', links: ['estaire_city'], encounters: [],
        hasHeal: false, hasWater: false, region: 'selen_island'
      },
      'estaire_supermarket_upper': {
        name: 'Верхние этажи', desc: 'Верхние этажи супермаркета.',
        image: '', links: ['estaire_city'], encounters: [],
        hasHeal: false, hasWater: false, region: 'selen_island'
      },
      'estaire_water_stadium': {
        name: 'Стадион водных покемонов', desc: 'Неработающий стадион водного типа.',
        image: '', links: ['estaire_city'], encounters: [],
        hasHeal: false, hasWater: true, region: 'selen_island'
      },
      'estaire_south_pier': {
        name: 'Южный причал Селена', desc: 'Южный причал острова.',
        image: '', links: ['estaire_city'], encounters: [],
        hasHeal: false, hasWater: true, region: 'selen_island'
      },
      'estaire_museum': {
        name: 'Музей истории', desc: 'Музей истории острова Селен.',
        image: '', links: ['estaire_city'], encounters: [],
        hasHeal: false, hasWater: false, region: 'selen_island'
      },
      'estaire_private_shop': {
        name: 'Частный магазин', desc: 'Эксклюзивный частный магазин.',
        image: '', links: ['estaire_city'], encounters: [],
        hasHeal: false, hasWater: false, region: 'selen_island'
      },
      'sel_route_15': {
        name: 'Маршрут 15 (Селен)', desc: 'Живописная дорога у окраин Эстайра.',
        image: 'wiki_images/generic_route.png', links: ['estaire_city'],
        encounters: ['pidgey', 'spearow', 'tauros'], hasHeal: false, region: 'selen_island'
      },
      'sel_route_16': {
        name: 'Маршрут 16 (Селен)', desc: 'Дорога от Сайрефа к Древней горе.',
        image: 'wiki_images/generic_route.png', links: ['sayref', 'ancient_mountain', 'pasture'],
        encounters: ['snorunt', 'swinub', 'bergmite'], hasHeal: false, region: 'selen_island'
      },
      'sel_route_17': {
        name: 'Маршрут 17 (Селен)', desc: 'Дорога от Эстайра к мысу на север.',
        image: 'wiki_images/generic_route.png', links: ['estaire_city', 'cape_sel'],
        encounters: ['wingull', 'pidgeotto'], hasHeal: false, region: 'selen_island'
      },
      'sel_route_18': {
        name: 'Маршрут 18 (Селен)', desc: 'Северная дорога к причалу.',
        image: 'wiki_images/generic_route.png', links: ['cape_sel', 'north_pier_sel'],
        encounters: ['pidgey', 'rattata'], hasHeal: false, region: 'selen_island'
      },
      'sel_route_3': {
        name: 'Маршрут 3 (Селен)', desc: 'Западная дорога от Остарона к побережью.',
        image: 'wiki_images/generic_route.png', links: ['ostaron', 'shore_sel'],
        encounters: ['swinub', 'delibird', 'pidgey'], hasHeal: false, region: 'selen_island'
      },
      'sel_route_7': {
        name: 'Маршрут 7 (Селен)', desc: 'Путь к Прибрежью с живописными видами.',
        image: 'wiki_images/generic_route.png', links: ['crossroads_sel', 'coast_sel'],
        encounters: ['wingull', 'krabby', 'magikarp'], hasHeal: false, hasWater: true, region: 'selen_island'
      },
      'sel_route_8': {
        name: 'Маршрут 8 (Селен)', desc: 'Заснеженная дорога в ледяные горы.',
        image: 'wiki_images/generic_route.png', links: ['ostaron', 'ice_mountain'],
        encounters: ['snorunt', 'bergmite', 'cubchoo'], hasHeal: false, region: 'selen_island'
      },
      'ice_mountain': {
        name: 'Ледяная гора', desc: 'Величественная заснеженная гора с ледяными пещерами.',
        image: 'wiki_images/Ledjanaja_gora.jpg', links: ['sel_route_8', 'crystal_lake', 'mountain_village'],
        encounters: ['snorunt', 'bergmite', 'lapras', 'articuno'], hasHeal: false, region: 'selen_island'
      },
      'crystal_lake': {
        name: 'Кристальное озеро', desc: 'Замёрзшее кристально чистое озеро. Ледяные покемоны процветают.',
        image: 'wiki_images/Кристальная_пещера.jpg', links: ['ice_mountain'],
        encounters: ['seel', 'shellder', 'lapras'], hasHeal: false, hasWater: true, region: 'selen_island'
      },
      'mountain_village': {
        name: 'Горная деревушка', desc: 'Уютная деревня высоко в горах Селена.',
        image: 'wiki_images/generic_route.png', links: ['ice_mountain'],
        encounters: [], hasHeal: true, region: 'selen_island'
      },
      'abandoned_estate': {
        name: 'Заброшенное поместье', desc: 'Мрачное поместье, населённое призрачными покемонами.',
        image: '', links: ['sel_route_5'],
        encounters: ['gastly', 'haunter', 'misdreavus'], hasHeal: false, region: 'selen_island'
      },
      'abandoned_road_sel': {
        name: 'Заброшенная дорога', desc: 'Старая заброшенная дорога, заросшая травой.',
        image: 'wiki_images/generic_route.png', links: ['crossroads_sel'],
        encounters: ['rattata', 'grimer', 'koffing'], hasHeal: false, region: 'selen_island'
      },
      'selen_forest': {
        name: 'Лес Селена', desc: 'Густой лес в сердце острова. Огромное разнообразие травяных покемонов.',
        image: 'wiki_images/generic_route.png', links: ['crossroads_sel', 'sel_route_10'],
        encounters: ['caterpie', 'weedle', 'oddish', 'bellsprout'], hasHeal: false, region: 'selen_island'
      },
      'ancient_mountain': {
        name: 'Древняя гора', desc: 'Древняя гора с наскальными рисунками покемонов.',
        image: 'wiki_images/generic_route.png', links: ['sel_route_16', 'plateau_sel'],
        encounters: ['geodude', 'onix', 'aerodactyl', 'relicanth'], hasHeal: false, region: 'selen_island'
      },
      'plateau_sel': {
        name: 'Плато', desc: 'Высокогорное плато с разреженным воздухом.',
        image: 'wiki_images/generic_route.png', links: ['ancient_mountain'],
        encounters: ['fearow', 'skarmory', 'gligar'], hasHeal: false, region: 'selen_island'
      },
      'pasture': {
        name: 'Пастбище', desc: 'Зелёное пастбище с пасущимися покемонами.',
        image: '', links: ['sel_route_16'],
        encounters: ['mareep', 'tauros', 'miltank'], hasHeal: false, region: 'selen_island'
      },
      'antique_house': {
        name: 'Антикварный дом', desc: 'Старинный дом с редкими антикварными предметами для покемонов.',
        image: '', links: ['crossroads_sel'],
        encounters: [], hasHeal: false, region: 'selen_island'
      },
      'shore_sel': {
        name: 'Берег', desc: 'Живописный западный берег Селена с песчаными пляжами.',
        image: '', links: ['sel_route_3', 'azure_shoreline'],
        encounters: ['wingull', 'krabby', 'shellder'], hasHeal: false, hasWater: true, region: 'selen_island'
      },
      'azure_shoreline': {
        name: 'Лазурная заводь', desc: 'Красивейшая лазурная бухта с коралловыми рифами.',
        image: '', links: ['shore_sel', 'coast_sel'],
        encounters: ['magikarp', 'goldeen', 'staryu', 'corsola'], hasHeal: false, hasWater: true, region: 'selen_island'
      },
      'coast_sel': {
        name: 'Прибрежье', desc: 'Живописное прибрежье южного Селена.',
        image: '', links: ['sel_route_7', 'azure_shoreline'],
        encounters: ['tentacool', 'wingull', 'magikarp'], hasHeal: false, hasWater: true, region: 'selen_island'
      },
      'cape_sel': {
        name: 'Мыс', desc: 'Северный мыс Селена с маяком. Ветреное место.',
        image: '', links: ['sel_route_17', 'sel_route_18'],
        encounters: ['wingull', 'pelipper', 'fearow'], hasHeal: false, region: 'selen_island'
      },
      'north_pier_sel': {
        name: 'Северный причал Селена', desc: 'Причал на северной оконечности острова.',
        image: '', links: ['sel_route_18', 'speedboat_sel'],
        encounters: ['tentacool', 'magikarp', 'remoraid'], hasHeal: false, hasWater: true, region: 'selen_island'
      },
      'speedboat_sel': {
        name: 'Катер', desc: 'Скоростной катер до Оливина.',
        image: '', links: ['north_pier_sel'],
        encounters: [], hasHeal: false, region: 'selen_island'
      },
      'winding_trail': {
        name: 'Извилистая тропа', desc: 'Извилистая горная тропа с крутыми поворотами.',
        image: 'wiki_images/generic_route.png', links: ['ancient_mountain'],
        encounters: ['geodude', 'machop', 'meditite'], hasHeal: false, region: 'selen_island'
      },
      'chasm_sel': {
        name: 'Провал', desc: 'Глубокий провал в земле — вход в подземный мир покемонов.',
        image: '', links: ['abandoned_road_sel'],
        encounters: ['zubat', 'geodude', 'diglett', 'onix'], hasHeal: false, region: 'selen_island'
      },
      'old_road_sel': {
        name: 'Старая дорога', desc: 'Древняя каменная дорога неизвестного происхождения.',
        image: 'wiki_images/generic_route.png', links: ['chasm_sel', 'ancient_mountain'],
        encounters: ['rattata', 'spearow', 'sandshrew'], hasHeal: false, region: 'selen_island'
      }
    }
  },
  southern_archipelago: {
    name: 'Южный Архипелаг',
    locations: {
      'il_de_far': {
        name: 'Иль де Фар', desc: 'Главный портовый город Южного Архипелага на острове Сифам. Отсюда начинается исследование региона.',
        image: 'wiki_images/Маргарита.jpg', links: ['rocky_beach_sa', 'sandy_trail', 'ferry_sa', 'ilde_stadium'],
        encounters: [], hasHeal: true, hasWater: true, region: 'southern_archipelago'
      },
      'ilde_stadium': {
        name: 'Драконий Стадион', desc: 'Арена драконьих покемонов Клер.',
        image: '', links: ['il_de_far'], encounters: [],
        hasHeal: false, hasWater: false, region: 'southern_archipelago'
      },
      'sen_aspir': {
        name: 'Сен Аспир', desc: 'Город на острове Синнабар у подножия вулкана. Стадион для битв с покемонами.',
        image: '', links: ['foothills_sinnabung', 'rocky_bay'],
        encounters: [], hasHeal: true, region: 'southern_archipelago'
      },
      'rocky_beach_sa': {
        name: 'Каменистый пляж', desc: 'Пляж усыпанный галькой и ракушками. Водные покемоны прячутся в камнях.',
        image: 'wiki_images/Морская_дорога.jpg', links: ['il_de_far', 'strait_entre_iles', 'shallow_waters_sa'],
        encounters: ['shellder', 'krabby', 'staryu'], hasHeal: false, hasWater: true, region: 'southern_archipelago'
      },
      'sandy_trail': {
        name: 'Песчаная тропа', desc: 'Песчаная тропа через дюны вглубь острова Сифам.',
        image: 'wiki_images/Каменная_тропа.jpg', links: ['il_de_far', 'old_park_sa'],
        encounters: ['sandshrew', 'diglett', 'trapinch'], hasHeal: false, region: 'southern_archipelago'
      },
      'ferry_sa': {
        name: 'Паром', desc: 'Паромная переправа между островами архипелага.',
        image: 'wiki_images/Гавань.jpg', links: ['il_de_far', 'sen_aspir'],
        encounters: ['magikarp', 'tentacool', 'wingull'], hasHeal: false, hasWater: true, region: 'southern_archipelago'
      },
      'strait_entre_iles': {
        name: 'Пролив Антр-Иль', desc: 'Узкий пролив между островами архипелага.',
        image: '', links: ['rocky_beach_sa', 'coral_grove'],
        encounters: ['tentacool', 'magikarp', 'horsea', 'chinchou'], hasHeal: false, hasWater: true, region: 'southern_archipelago'
      },
      'coral_grove': {
        name: 'Коралловая роща', desc: 'Подводная коралловая роща с уникальными покемонами.',
        image: 'wiki_images/Мелководье.jpg', links: ['strait_entre_iles'],
        encounters: ['corsola', 'staryu', 'shellder', 'clamperl'], hasHeal: false, hasWater: true, region: 'southern_archipelago'
      },
      'shallow_waters_sa': {
        name: 'Мелководье', desc: 'Тёплые мелкие воды с большим разнообразием покемонов.',
        image: '', links: ['rocky_beach_sa', 'flooded_grotto'],
        encounters: ['magikarp', 'poliwag', 'goldeen', 'staryu'], hasHeal: false, hasWater: true, region: 'southern_archipelago'
      },
      'flooded_grotto': {
        name: 'Затопленный грот', desc: 'Полузатопленная пещера, куда можно попасть только во время отлива.',
        image: '', links: ['shallow_waters_sa'],
        encounters: ['zubat', 'wooper', 'quagsire', 'chinchou'], hasHeal: false, region: 'southern_archipelago'
      },
      'foothills_sinnabung': {
        name: 'Предгорье Синнабунга', desc: 'Предгорье вулкана Синнабунг на острове Синнабар.',
        image: '', links: ['sen_aspir', 'volcanic_caves'],
        encounters: ['growlithe', 'ponyta', 'geodude', 'rhyhorn'], hasHeal: false, region: 'southern_archipelago'
      },
      'volcanic_caves': {
        name: 'Вулканические пещеры', desc: 'Горячие пещеры в жерле потухшего вулкана.',
        image: 'wiki_images/generic_route.png', links: ['foothills_sinnabung'],
        encounters: ['magmar', 'slugma', 'torkoal', 'numel'], hasHeal: false, region: 'southern_archipelago'
      },
      'rocky_bay': {
        name: 'Скалистый залив', desc: 'Живописный залив со скалистыми берегами.',
        image: '', links: ['sen_aspir', 'orlua_estate'],
        encounters: ['tentacool', 'magikarp', 'krabby'], hasHeal: false, hasWater: true, region: 'southern_archipelago'
      },
      'old_park_sa': {
        name: 'Старый парк', desc: 'Заброшенный парк развлечений на Сифаме.',
        image: 'wiki_images/Золотой_лес.jpg', links: ['sandy_trail'],
        encounters: ['gastly', 'misdreavus', 'shuppet'], hasHeal: false, region: 'southern_archipelago'
      },
      'ice_cave_sa': {
        name: 'Ледяная пещера', desc: 'Аномально холодная пещера посреди тропического архипелага.',
        image: 'wiki_images/generic_route.png', links: ['foothills_sinnabung'],
        encounters: ['snorunt', 'spheal', 'sneasel', 'lapras'], hasHeal: false, region: 'southern_archipelago'
      },
      'orlua_estate': {
        name: 'Поместье Орлуа', desc: 'Роскошное поместье с привидениями. Мрачные тайны и редкие покемоны.',
        image: '', links: ['rocky_bay'],
        encounters: ['gastly', 'haunter', 'gengar', 'rotom'], hasHeal: false, region: 'southern_archipelago'
      }
    }
  }
};