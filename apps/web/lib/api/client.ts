const DEFAULT_TIMEOUT_MS = 5000;

export class ApiError extends Error {
  status: number;
  code?: string;

  constructor(message: string, options: { status: number; code?: string }) {
    super(message);
    this.name = 'ApiError';
    this.status = options.status;
    this.code = options.code;
  }
}

export function getApiBaseUrl() {
  const value = process.env.PAWMAP_API_BASE_URL?.trim();
  return value ? value.replace(/\/$/, '') : null;
}

export async function apiGet<T>(path: string, init?: RequestInit): Promise<T> {
  const baseUrl = getApiBaseUrl();
  if (!baseUrl) {
    throw new ApiError('PAWMAP_API_BASE_URL is not configured.', { status: 0, code: 'API_NOT_CONFIGURED' });
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);

  try {
    const response = await fetch(`${baseUrl}${path}`, {
      ...init,
      headers: {
        Accept: 'application/json',
        ...(init?.headers ?? {}),
      },
      next: { revalidate: 0 },
      cache: 'no-store',
      signal: controller.signal,
    });

    const text = await response.text();
    const data = text ? JSON.parse(text) : null;

    if (!response.ok) {
      const error = data?.error;
      throw new ApiError(error?.message ?? `Request failed with status ${response.status}`, {
        status: response.status,
        code: error?.code,
      });
    }

    return data as T;
  } finally {
    clearTimeout(timeout);
  }
}
