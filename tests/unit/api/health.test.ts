import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from '@/app/api/health/route';
import { pool } from '@/db/client';

vi.mock('@/db/client', () => ({
  pool: {
    query: vi.fn(),
  },
}));

vi.mock('@/lib/env', () => ({
  getEnv: vi.fn(() => ({ DATABASE_URL: 'postgres://localhost' })),
}));

describe('GET /api/health', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('returns ok and db up when db query succeeds', async () => {
    vi.mocked(pool.query).mockResolvedValueOnce({ rows: [{ '?column?': 1 }] } as never);

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(response.headers.get('Cache-Control')).toBe('no-store');
    expect(data.status).toBe('ok');
    expect(data.db).toBe('up');
    expect(data.time).toBeDefined();
  });

  it('returns degraded and db down when db query fails', async () => {
    vi.mocked(pool.query).mockRejectedValueOnce(new Error('DB connection failed'));

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.status).toBe('degraded');
    expect(data.db).toBe('down');
  });

  it('returns degraded and db down when db query timeouts', async () => {
    vi.useFakeTimers();
    vi.mocked(pool.query).mockImplementationOnce(
      () => new Promise((resolve) => setTimeout(resolve, 3000))
    );

    // Start the promise
    const promise = GET();
    // Fast-forward time to trigger timeout
    await vi.runAllTimersAsync();
    
    const response = await promise;
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.status).toBe('degraded');
    expect(data.db).toBe('down');
    
    vi.useRealTimers();
  });
});
