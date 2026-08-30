import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fetchSecJson, SecClientError } from './secClient.ts';

function mockResponse(status: number, body: string, headers: Record<string, string> = {}) {
  return {
    ok: status >= 200 && status < 300,
    status,
    statusText: String(status),
    headers: new Headers(headers),
    text: vi.fn().mockResolvedValue(body),
  } as unknown as Response;
}

describe('fetchSecJson', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('rejects an empty User-Agent before making any request', async () => {
    const fetchImpl = vi.fn();

    await expect(fetchSecJson('/submissions/CIK0000000000.json', '   ', fetchImpl)).rejects.toBeInstanceOf(
      SecClientError,
    );

    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('returns parsed SEC JSON and sends the required headers', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(
      mockResponse(200, JSON.stringify({ filing: 'ok' })),
    );

    const resultPromise = fetchSecJson(
      '/submissions/CIK0000000000.json',
      'GraphiQuestor sec-ingest bot sec@example.com',
      fetchImpl,
    );

    await vi.runAllTimersAsync();
    await expect(resultPromise).resolves.toEqual({ filing: 'ok' });

    expect(fetchImpl).toHaveBeenCalledTimes(1);
    const [, init] = fetchImpl.mock.calls[0];
    const headers = new Headers((init as RequestInit | undefined)?.headers);
    expect(headers.get('User-Agent')).toBe('GraphiQuestor sec-ingest bot sec@example.com');
    expect(headers.get('Accept-Encoding')).toBe('gzip, deflate');
    expect(headers.get('Accept')).toBe('application/json');
  });

  it('retries a 429 and honors Retry-After before the next attempt', async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(mockResponse(429, 'rate limited', { 'Retry-After': '1' }))
      .mockResolvedValueOnce(mockResponse(200, JSON.stringify({ ok: true })));

    const resultPromise = fetchSecJson(
      'submissions/CIK0000000000.json',
      'GraphiQuestor sec-ingest bot sec@example.com',
      fetchImpl,
    );

    expect(fetchImpl).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(999);
    expect(fetchImpl).toHaveBeenCalledTimes(1);

    await vi.advanceTimersByTimeAsync(1);
    await vi.runAllTimersAsync();

    await expect(resultPromise).resolves.toEqual({ ok: true });
    expect(fetchImpl).toHaveBeenCalledTimes(2);
  });

  it('retries a 503 with exponential backoff and succeeds on the next response', async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(mockResponse(503, 'service unavailable'))
      .mockResolvedValueOnce(mockResponse(200, JSON.stringify({ companyFacts: [] })));

    const resultPromise = fetchSecJson(
      '/api/xbrl/companyfacts/CIK0000000000.json',
      'GraphiQuestor sec-ingest bot sec@example.com',
      fetchImpl,
    );

    expect(fetchImpl).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(499);
    expect(fetchImpl).toHaveBeenCalledTimes(1);

    await vi.advanceTimersByTimeAsync(1);
    await vi.runAllTimersAsync();

    await expect(resultPromise).resolves.toEqual({ companyFacts: [] });
    expect(fetchImpl).toHaveBeenCalledTimes(2);
  });

  it('throws a typed error for malformed JSON and does not retry it', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(mockResponse(200, '{"broken": true'));

    await expect(
      fetchSecJson('/submissions/CIK0000000000.json', 'GraphiQuestor sec-ingest bot sec@example.com', fetchImpl),
    ).rejects.toMatchObject({
      name: 'SecClientError',
      message: 'Malformed SEC JSON response',
      retryable: false,
    });

    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it('does not retry non-retryable 4xx responses', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(mockResponse(404, 'not found'));

    await expect(
      fetchSecJson('/submissions/CIK0000000000.json', 'GraphiQuestor sec-ingest bot sec@example.com', fetchImpl),
    ).rejects.toMatchObject({
      name: 'SecClientError',
      message: 'SEC HTTP 404: not found',
      retryable: false,
      status: 404,
    });

    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it('rejects absolute URLs outside the SEC data host', async () => {
    const fetchImpl = vi.fn();

    await expect(fetchSecJson('https://example.com/private', 'GraphiQuestor sec-ingest bot sec@example.com', fetchImpl))
      .rejects.toMatchObject({ message: 'SEC requests must target data.sec.gov', retryable: false });
    expect(fetchImpl).not.toHaveBeenCalled();
  });
});
