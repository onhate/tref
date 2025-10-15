import { describe, expect, it } from 'vitest';
import { isEmptyObject } from './isEmptyObject';

describe('isEmptyUpdate', () => {
  it('should return true for empty object', () => {
    const result = isEmptyObject({});
    expect(result).toBe(true);
  });

  it('should return true when all values are undefined', () => {
    const result = isEmptyObject({
      name: undefined,
      email: undefined,
      age: undefined
    });
    expect(result).toBe(true);
  });

  it('should return false when at least one value is defined', () => {
    const result = isEmptyObject({
      name: 'John',
      email: undefined,
      age: undefined
    });
    expect(result).toBe(false);
  });

  it('should return false for null values (null is a valid update)', () => {
    const result = isEmptyObject({
      name: undefined,
      email: null,
      age: undefined
    });
    expect(result).toBe(false);
  });

  it('should return false for falsy values that are not undefined', () => {
    const result = isEmptyObject({
      name: '',
      age: 0,
      active: false
    });
    expect(result).toBe(false);
  });

  it('should return false for mixed defined and undefined values', () => {
    const result = isEmptyObject({
      name: 'John',
      email: 'john@example.com',
      age: undefined,
      phone: null
    });
    expect(result).toBe(false);
  });

  it('should handle objects with only null values', () => {
    const result = isEmptyObject({
      name: null,
      email: null
    });
    expect(result).toBe(false);
  });
});
