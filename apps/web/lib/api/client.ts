const DEFAULT_TIMEOUT_MS = 5000;
const DEFAULT_DEV_ADMIN_USER_ID = '00000000-0000-4000-8000-000000000001';
const DEFAULT_DEV_ADMIN_ROLE = 'admin';

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

export function getDevAdminHeaders() {
  return {
    'X-User-Id': process.env.PAWMAP_DEV_ADMIN_USER_ID?.trim() || DEFAULT_DEV_ADMIN_USER_ID,
    'X-Role': process.env.PAWMAP_DEV_ADMIN_ROLE?.trim() || DEFAULT_DEV_ADMIN_ROLE,
  };
}

async function apiRequest<T>(path: string, init?: RequestInit): Promise<T> {
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
        ...(init?.body ? { 'Content-Type': 'application/json' } : {}),
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
      throw new ApiError(error?.message ?? error ?? `Request failed with status ${response.status}`, {
        status: response.status,
        code: error?.code,
      });
    }

    return data as T;
  } finally {
    clearTimeout(timeout);
  }
}

export async function apiGet<T>(path: string, init?: RequestInit): Promise<T> {
  return apiRequest<T>(path, init);
}

export async function apiPost<T>(path: string, body?: unknown, init?: RequestInit): Promise<T> {
  return apiRequest<T>(path, {
    method: 'POST',
    ...init,
    body: body === undefined ? init?.body : JSON.stringify(body),
  });
}
