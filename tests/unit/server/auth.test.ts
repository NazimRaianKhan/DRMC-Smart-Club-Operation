import { describe, it, expect } from 'vitest';
import { sanitizeNextUrl } from '@/server/auth';

describe('Auth Sanitize Next URL', () => {
  it('should allow valid local paths', () => {
    expect(sanitizeNextUrl('/me')).toBe('/me');
    expect(sanitizeNextUrl('/me/registrations?tab=1')).toBe('/me/registrations?tab=1');
  });

  it('should reject open redirects', () => {
    expect(sanitizeNextUrl('http://example.com')).toBe(null);
    expect(sanitizeNextUrl('https://example.com')).toBe(null);
    expect(sanitizeNextUrl('//example.com')).toBe(null);
    expect(sanitizeNextUrl('/\\example.com')).toBe(null);
  });
  
  it('should return null for null/undefined/empty', () => {
    expect(sanitizeNextUrl(null)).toBe(null);
    expect(sanitizeNextUrl(undefined)).toBe(null);
    expect(sanitizeNextUrl('')).toBe(null);
  });
});

