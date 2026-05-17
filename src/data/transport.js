export const TRANSPORT_HUBS = {
  'olivine': [
    { label: '🚢 Паром в Канто (Вермилион)', targetRegion: 'kanto', targetLoc: 'vermilion', ticket: 'ticketBoatJK' },
    { label: '🚤 Катер на о.Селен (Остарон)', targetRegion: 'selen_island', targetLoc: 'ostaron', ticket: 'ticketBoatJS' },
  ],
  'vermilion_port': [
    { label: '🚢 Паром в Джото (Оливин)', targetRegion: 'east_johto', targetLoc: 'olivine', ticket: 'ticketBoatJK' },
  ],
  'warhall_bus_station': [
    { label: '🚌 Автобус в Зап.Джото (Саммер)', targetRegion: 'west_johto', targetLoc: 'summer', ticket: 'ticketBusJ' },
  ],
  'summer': [
    { label: '🚌 Автобус в Вост.Джото (Вархолл)', targetRegion: 'east_johto', targetLoc: 'warhall', ticket: 'ticketBusJ' },
  ],
  'saffron_east_station': [
    { label: '🚂 Поезд в Джото (Голденрод)', targetRegion: 'east_johto', targetLoc: 'goldenrod', ticket: 'ticketTrainJK' },
  ],
  'goldenrod': [
    { label: '🚂 Поезд в Канто (Шаффран)', targetRegion: 'kanto', targetLoc: 'saffron', ticket: 'ticketTrainJK' },
  ],
  'ostaron': [
    { label: '🚤 Катер в Джото (Оливин)', targetRegion: 'east_johto', targetLoc: 'olivine', ticket: 'ticketBoatJS' },
  ],
  'fuchsia_beach_pier': [
    { label: '⛴ Паром в Южн. Архипелаг (Иль де Фар)', targetRegion: 'southern_archipelago', targetLoc: 'il_de_far', ticket: 'ticketFerryKS' },
  ],
  'il_de_far': [
    { label: '⛴ Паром в Канто (Фуксия)', targetRegion: 'kanto', targetLoc: 'fuchsia_city', ticket: 'ticketFerryKS' },
  ],
};