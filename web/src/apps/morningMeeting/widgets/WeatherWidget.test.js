import { describe, expect, it } from 'vitest';
import {
  normalizeWeatherProps,
  weatherErrorMessage,
  weatherFromCode,
} from './WeatherWidget';

describe('WeatherWidget helpers', () => {
  it('maps clear and rain codes', () => {
    expect(weatherFromCode(0).label).toBe('Clear');
    expect(weatherFromCode(61).label).toBe('Rain');
  });

  it('normalizes weather props', () => {
    expect(normalizeWeatherProps({ place: ' Austin ', unit: 'c', lat: 30.2, lon: -97.7 })).toEqual({
      place: 'Austin',
      unit: 'c',
      lat: 30.2,
      lon: -97.7,
    });
    expect(normalizeWeatherProps({})).toMatchObject({
      place: '',
      unit: 'f',
    });
  });

  it('maps timeout errors to a clear teacher message', () => {
    const err = new Error('Timeout expired');
    err.name = 'TimeoutError';
    expect(weatherErrorMessage(err)).toMatch(/Edit board/i);
    expect(weatherErrorMessage(new Error('Add a place in Edit board'))).toMatch(/Add a city/i);
  });
});
