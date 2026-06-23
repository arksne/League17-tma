// Weather data and utilities — pure functions, no side effects

export const WEATHERS = ['clear', 'rain', 'sun', 'sandstorm', 'hail'] as const;
export type WeatherType = (typeof WEATHERS)[number];

export const WEATHER_ICONS: Record<string, string> = {
  clear: '☀️', rain: '🌧️', sun: '☀️', sandstorm: '🌪️', hail: '❄️',
};

export const WEATHER_NAMES: Record<string, string> = {
  clear: 'Ясно', rain: 'Дождь', sun: 'Солнце', sandstorm: 'Песчаная буря', hail: 'Град',
};

/** Deterministic daily weather based on date + location */
export function getDailyWeather(locId: string): string {
  const dateStr = new Date().toISOString().slice(0, 10);
  let hash = 0;
  const str = dateStr + locId;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  const idx = (Math.abs(hash || 0) || 0) % WEATHERS.length;
  return WEATHERS[idx];
}

/** Weather damage modifier for a move type */
export function getWeatherMultiplier(moveType: string, weather: string): number {
  if (weather === 'rain') {
    if (moveType === 'water') return 1.5;
    if (moveType === 'fire') return 0.5;
  }
  if (weather === 'sun') {
    if (moveType === 'fire') return 1.5;
    if (moveType === 'water') return 0.5;
  }
  if (weather === 'sandstorm' && moveType === 'rock') return 1.5;
  if (weather === 'hail' && moveType === 'ice') return 1.5;
  return 1.0;
}
