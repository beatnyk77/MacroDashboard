export class SecClientError extends Error {
  readonly status?: number;
  readonly retryable: boolean;
  readonly retryAfterMs?: number;

  constructor(
    message: string,
    opts: {
      status?: number;
      retryable: boolean;
      retryAfterMs?: number;
      cause?: unknown;
    },
  ) {
    super(message);
    this.name = 'SecClientError';
    this.status = opts.status;
    this.retryable = opts.retryable;
    this.retryAfterMs = opts.retryAfterMs;
    if (opts.cause !== undefined) {
      (this as Error & { cause?: unknown }).cause = opts.cause;
    }
  }
}

const SEC_BASE_URL = 'https://data.sec.gov';
const DEFAULT_MAX_ATTEMPTS = 4;
const BASE_BACKOFF_MS = 500;
const MAX_BACKOFF_MS = 8_000;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function normalizePath(path: string): string {
  if (/^https?:\/\//i.test(path)) {
    const url = new URL(path);
    if (url.origin !== SEC_BASE_URL) {
      throw new SecClientError('SEC requests must target data.sec.gov', { retryable: false });
    }
    return `${url.pathname}${url.search}`;
  }
  return path.startsWith('/') ? path : `/${path}`;
}

function buildSecUrl(path: string): string {
  return `${SEC_BASE_URL}${normalizePath(path)}`;
}

function parseRetryAfter(value: string | null): number | undefined {
  if (!value) return undefined;

  const seconds = Number(value);
  if (Number.isFinite(seconds)) {
    return Math.max(0, Math.round(seconds * 1000));
  }

  const dateMs = Date.parse(value);
  if (Number.isNaN(dateMs)) return undefined;
  return Math.max(0, dateMs - Date.now());
}

function buildHeaders(userAgent: string): Headers {
  const trimmed = userAgent.trim();
  if (!trimmed) {
    throw new SecClientError('SEC User-Agent is required', { retryable: false });
  }

  return new Headers({
    'User-Agent': trimmed,
    Accept: 'application/json',
    'Accept-Encoding': 'gzip, deflate',
  });
}

function isRetryableStatus(status: number): boolean {
  return status === 429 || status >= 500;
}

function cappedBackoffMs(attempt: number): number {
  return Math.min(BASE_BACKOFF_MS * 2 ** (attempt - 1), MAX_BACKOFF_MS);
}

async function readJson(response: Response): Promise<unknown> {
  const text = await response.text();
  try {
    return JSON.parse(text) as unknown;
  } catch (cause) {
    throw new SecClientError('Malformed SEC JSON response', {
      status: response.status,
      retryable: false,
      cause,
    });
  }
}

async function readErrorMessage(response: Response): Promise<string> {
  try {
    const text = await response.text();
    return text.trim();
  } catch {
    return '';
  }
}

export async function fetchSecJson(
  path: string,
  userAgent: string,
  fetchImpl: typeof fetch = globalThis.fetch.bind(globalThis),
): Promise<unknown> {
  if (typeof fetchImpl !== 'function') {
    throw new SecClientError('No fetch implementation available', { retryable: false });
  }

  const headers = buildHeaders(userAgent);
  const url = buildSecUrl(path);

  let lastError: SecClientError | undefined;

  for (let attempt = 1; attempt <= DEFAULT_MAX_ATTEMPTS; attempt += 1) {
    let response: Response;
    try {
      response = await fetchImpl(url, { headers });
    } catch (cause) {
      lastError = new SecClientError('SEC request failed', {
        retryable: true,
        cause,
      });
      if (attempt < DEFAULT_MAX_ATTEMPTS) {
        await sleep(cappedBackoffMs(attempt));
        continue;
      }
      throw lastError;
    }

    if (response.ok) {
      return readJson(response);
    }

    const status = response.status;
    const message = await readErrorMessage(response);

    if (!isRetryableStatus(status)) {
      throw new SecClientError(
        message ? `SEC HTTP ${status}: ${message}` : `SEC HTTP ${status}`,
        {
          status,
          retryable: false,
        },
      );
    }

    lastError = new SecClientError(
      message ? `SEC HTTP ${status}: ${message}` : `SEC HTTP ${status}`,
      {
        status,
        retryable: true,
        retryAfterMs: parseRetryAfter(response.headers.get('Retry-After')),
      },
    );

    if (attempt >= DEFAULT_MAX_ATTEMPTS) {
      throw lastError;
    }

    const waitMs = lastError.retryAfterMs ?? cappedBackoffMs(attempt);
    await sleep(waitMs);
  }

  throw lastError ?? new SecClientError('SEC request failed', { retryable: true });
}
