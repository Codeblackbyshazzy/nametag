import type { CustomFieldType } from '@prisma/client';

export type ValidationResult = { ok: true } | { ok: false; error: string };

export function isEmptyRawValue(raw: string): boolean {
  return raw.trim() === '';
}

export function validateRawValue(
  type: CustomFieldType,
  raw: string,
  options: string[]
): ValidationResult {
  switch (type) {
    case 'TEXT':
      return { ok: true };
    case 'NUMBER': {
      const parsed = Number(raw);
      if (!Number.isFinite(parsed)) {
        return { ok: false, error: 'not a number' };
      }
      return { ok: true };
    }
    case 'BOOLEAN':
      if (raw === 'true' || raw === 'false') return { ok: true };
      return { ok: false, error: 'must be "true" or "false"' };
    case 'SELECT':
      if (options.includes(raw)) return { ok: true };
      return { ok: false, error: 'not in options' };
  }
}

export function formatValueForDisplay(type: CustomFieldType, raw: string): string {
  switch (type) {
    case 'TEXT':
    case 'NUMBER':
    case 'SELECT':
      return raw;
    case 'BOOLEAN':
      return raw === 'true' ? 'Yes' : 'No';
  }
}
