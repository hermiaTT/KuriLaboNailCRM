import type { AuthResponse } from '../types';

const ACCESS_TOKEN_KEY = 'kuri_web_access_token';

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
  }
}

export function getAccessToken() {
  return sessionStorage.getItem(ACCESS_TOKEN_KEY);
}

export function setAccessToken(token: string | null) {
  if (token) sessionStorage.setItem(ACCESS_TOKEN_KEY, token);
  else sessionStorage.removeItem(ACCESS_TOKEN_KEY);
}

async function parseError(response: Response) {
  try {
    const body = (await response.json()) as { message?: string; detail?: string };
    return body.message ?? body.detail ?? 'Something went wrong.';
  } catch {
    return 'Something went wrong.';
  }
}

async function rawRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = getAccessToken();
  const hasJsonBody = init.body != null && !(init.body instanceof FormData);
  const response = await fetch(path, {
    ...init,
    credentials: 'include',
    headers: {
      ...(hasJsonBody ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init.headers,
    },
  });

  if (!response.ok) throw new ApiError(await parseError(response), response.status);
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

let refreshPromise: Promise<boolean> | null = null;

async function refreshAccessToken() {
  if (!refreshPromise) {
    refreshPromise = rawRequest<AuthResponse>('/api/v1/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({ clientType: 'WEB', deviceName: 'Kuri Labo Web' }),
    })
      .then((session) => {
        setAccessToken(session.accessToken);
        return true;
      })
      .catch(() => {
        setAccessToken(null);
        return false;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
}

export async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  try {
    return await rawRequest<T>(path, init);
  } catch (error) {
    if (error instanceof ApiError && error.status === 401 && !path.includes('/auth/')) {
      if (await refreshAccessToken()) return rawRequest<T>(path, init);
    }
    throw error;
  }
}
