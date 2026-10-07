import { describe, it, expect, vi } from 'vitest';
vi.mock('server-only', () => ({}));
import { t } from '@/i18n';

describe('i18n translation helper', () => {
  const dict = {
    common: {
      hello: 'Hello {name}',
      nested: {
        deep: 'Found me',
      }
    }
  };

  it('translates existing key', () => {
    expect(t(dict, 'common.nested.deep')).toBe('Found me');
  });

  it('interpolates parameters', () => {
    expect(t(dict, 'common.hello', { name: 'World' })).toBe('Hello World');
  });

  it('returns path if key is missing', () => {
    expect(t(dict, 'common.missing.key')).toBe('common.missing.key');
  });
});
