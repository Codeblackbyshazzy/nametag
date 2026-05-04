import { describe, it, expect } from 'vitest';
import {
  validateRawValue,
  formatValueForDisplay,
  isEmptyRawValue,
} from '../../lib/customFields/values';

describe('isEmptyRawValue', () => {
  it('treats empty string and whitespace as empty', () => {
    expect(isEmptyRawValue('')).toBe(true);
    expect(isEmptyRawValue('   ')).toBe(true);
  });

  it('treats any non-blank string as non-empty', () => {
    expect(isEmptyRawValue('false')).toBe(false);
    expect(isEmptyRawValue('0')).toBe(false);
  });
});

describe('validateRawValue', () => {
  it('accepts any non-empty string for TEXT', () => {
    expect(validateRawValue('TEXT', 'anything', [])).toEqual({ ok: true });
  });

  it('rejects non-numeric strings for NUMBER', () => {
    expect(validateRawValue('NUMBER', 'abc', [])).toEqual({
      ok: false,
      error: 'not a number',
    });
  });

  it('accepts decimals and negatives for NUMBER', () => {
    expect(validateRawValue('NUMBER', '-3.14', [])).toEqual({ ok: true });
  });

  it('rejects Infinity / NaN for NUMBER', () => {
    expect(validateRawValue('NUMBER', 'Infinity', [])).toEqual({
      ok: false,
      error: 'not a number',
    });
  });

  it('accepts only "true" or "false" for BOOLEAN', () => {
    expect(validateRawValue('BOOLEAN', 'true', [])).toEqual({ ok: true });
    expect(validateRawValue('BOOLEAN', 'false', [])).toEqual({ ok: true });
    expect(validateRawValue('BOOLEAN', 'yes', [])).toEqual({
      ok: false,
      error: 'must be "true" or "false"',
    });
  });

  it('accepts SELECT values that are in the options list', () => {
    expect(validateRawValue('SELECT', 'vegan', ['vegan', 'omnivore'])).toEqual({
      ok: true,
    });
  });

  it('rejects SELECT values not in the options list', () => {
    expect(validateRawValue('SELECT', 'pescatarian', ['vegan', 'omnivore'])).toEqual({
      ok: false,
      error: 'not in options',
    });
  });
});

describe('formatValueForDisplay', () => {
  it('returns text as-is for TEXT', () => {
    expect(formatValueForDisplay('TEXT', 'hello')).toBe('hello');
  });

  it('returns the number string for NUMBER', () => {
    expect(formatValueForDisplay('NUMBER', '42')).toBe('42');
  });

  it('returns "Yes" / "No" for BOOLEAN', () => {
    expect(formatValueForDisplay('BOOLEAN', 'true')).toBe('Yes');
    expect(formatValueForDisplay('BOOLEAN', 'false')).toBe('No');
  });

  it('returns the option string for SELECT', () => {
    expect(formatValueForDisplay('SELECT', 'vegan')).toBe('vegan');
  });
});
