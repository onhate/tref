import { describe, expect, it } from 'vitest';
import { onlyIf } from './onlyIf';

describe('onlyIf', () => {
  it('should transform value when truthy', () => {
    const result = onlyIf('hello', (str) => str.toUpperCase());
    expect(result).toBe('HELLO');
  });

  it('should return undefined when value is null', () => {
    const result = onlyIf(null as unknown as string, (str) => str.toUpperCase());
    expect(result).toBeUndefined();
  });

  it('should return undefined when value is undefined', () => {
    const result = onlyIf(undefined as unknown as string, (str) => str.toUpperCase());
    expect(result).toBeUndefined();
  });

  it('should return undefined when value is empty string', () => {
    const result = onlyIf('', (str) => str.toUpperCase());
    expect(result).toBeUndefined();
  });

  it('should return undefined when value is 0', () => {
    const result = onlyIf(0, (num) => num * 2);
    expect(result).toBeUndefined();
  });

  it('should return undefined when value is false', () => {
    const result = onlyIf(false, (bool) => !bool);
    expect(result).toBeUndefined();
  });

  it('should transform object when truthy', () => {
    const input = { name: 'John', age: 30 };
    const result = onlyIf(input, (obj) => JSON.stringify(obj));
    expect(result).toBe('{"name":"John","age":30}');
  });

  it('should transform array when truthy', () => {
    const input = [1, 2, 3];
    const result = onlyIf(input, (arr) => arr.map((n) => n * 2));
    expect(result).toEqual([2, 4, 6]);
  });

  it('should work with number transformation', () => {
    const result = onlyIf(42, (num) => num.toString());
    expect(result).toBe('42');
  });

  it('should work with complex transformations', () => {
    const preferences = { theme: 'dark', notifications: true };
    const result = onlyIf(preferences, (prefs) => JSON.stringify(prefs));
    expect(result).toBe('{"theme":"dark","notifications":true}');
  });
});
