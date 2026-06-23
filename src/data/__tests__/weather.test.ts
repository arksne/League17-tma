import { describe, it, expect } from 'vitest';
import { WEATHERS, getDailyWeather, getWeatherMultiplier, WEATHER_ICONS, WEATHER_NAMES } from '../weather.js';

describe('weather constants', () => {
  it('has 5 weather types', () => {
    expect(WEATHERS).toEqual(['clear', 'rain', 'sun', 'sandstorm', 'hail']);
  });

  it('has icons for all weathers', () => {
    WEATHERS.forEach(w => expect(WEATHER_ICONS[w]).toBeDefined());
  });

  it('has names for all weathers', () => {
    WEATHERS.forEach(w => expect(WEATHER_NAMES[w]).toBeDefined());
  });
});

describe('getDailyWeather', () => {
  it('returns deterministic weather for same location each day', () => {
    const w1 = getDailyWeather('route-1');
    const w2 = getDailyWeather('route-1');
    expect(w1).toBe(w2);
  });

  it('can return different weather for different locations', () => {
    const w1 = getDailyWeather('route-1');
    const w2 = getDailyWeather('cerulean-city');
    // May be same or different — just ensure both are valid
    expect(WEATHERS).toContain(w1);
    expect(WEATHERS).toContain(w2);
  });

  it('always returns a valid weather', () => {
    const locations = ['route-1', 'viridian-forest', 'mt-moon', 'safari-zone', 'power-plant'];
    locations.forEach(loc => {
      expect(WEATHERS).toContain(getDailyWeather(loc));
    });
  });
});

describe('getWeatherMultiplier', () => {
  it('rain boosts water 1.5x, reduces fire 0.5x', () => {
    expect(getWeatherMultiplier('water', 'rain')).toBe(1.5);
    expect(getWeatherMultiplier('fire', 'rain')).toBe(0.5);
  });

  it('sun boosts fire 1.5x, reduces water 0.5x', () => {
    expect(getWeatherMultiplier('fire', 'sun')).toBe(1.5);
    expect(getWeatherMultiplier('water', 'sun')).toBe(0.5);
  });

  it('sandstorm boosts rock 1.5x', () => {
    expect(getWeatherMultiplier('rock', 'sandstorm')).toBe(1.5);
  });

  it('hail boosts ice 1.5x', () => {
    expect(getWeatherMultiplier('ice', 'hail')).toBe(1.5);
  });

  it('clear weather = 1x for all', () => {
    expect(getWeatherMultiplier('fire', 'clear')).toBe(1);
    expect(getWeatherMultiplier('water', 'clear')).toBe(1);
    expect(getWeatherMultiplier('grass', 'clear')).toBe(1);
  });

  it('unaffected types = 1x', () => {
    expect(getWeatherMultiplier('normal', 'rain')).toBe(1);
    expect(getWeatherMultiplier('psychic', 'sun')).toBe(1);
    expect(getWeatherMultiplier('dark', 'hail')).toBe(1);
  });
});
