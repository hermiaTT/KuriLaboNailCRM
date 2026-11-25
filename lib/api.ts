import AsyncStorage from '@react-native-async-storage/async-storage';

const DEFAULT_API_BASE_URL = 'https://kurilabonailcrm-production.up.railway.app';
const API_BASE_URL = (process.env.EXPO_PUBLIC_API_BASE_URL || DEFAULT_API_BASE_URL).replace(/\/$/, '');

const ACCESS_TOKEN_KEY = 'kuri_mobile_access_token';
const REFRESH_TOKEN_KEY = 'kuri_mobile_refresh_token';

export type ApiUser = {
  id: string;
  clientId: string | null;
  email: string | null;
  role: 'USER' | 'ADMIN';
  name: string;
  phone: string | null;
  contactPhone: string | null;
  birthday: string | null;
  preferredLanguage?: 'en' | 'zh-CN';
};

export type AuthResponse = {
  accessToken: string;
  accessTokenExpiresAt: string;
  refreshToken: string;
  user: ApiUser;
};

export class ApiError extends Error {
  constructor(message: string, public readonly status: number) {
    super(message);
  }
}

async function parseError(response: Response) {
  try {
    const body = (await response.json()) as { message?: string; detail?: string };
    return body.message ?? body.detail ?? 'Something went wrong.';
  } catch {
    return 'Something went wrong.';
  }
}

export async function setAuthTokens(accessToken: string | null, refreshToken: string | null) {
  if (accessToken && refreshToken) {
    await AsyncStorage.multiSet([
      [ACCESS_TOKEN_KEY, accessToken],
      [REFRESH_TOKEN_KEY, refreshToken],
    ]);
    return;
  }
  await AsyncStorage.multiRemove([ACCESS_TOKEN_KEY, REFRESH_TOKEN_KEY]);
}

async function rawRequest<T>(path: string, init: RequestInit = {}, accessToken?: string | null): Promise<T> {
  const hasJsonBody = init.body != null && !(init.body instanceof FormData);
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      Accept: 'application/json',
      ...(hasJsonBody ? { 'Content-Type': 'application/json' } : {}),
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      ...init.headers,
    },
  });

  if (!response.ok) throw new ApiError(await parseError(response), response.status);
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

let refreshPromise: Promise<AuthResponse | null> | null = null;

export async function refreshMobileSession(): Promise<AuthResponse | null> {
  if (!refreshPromise) {
    refreshPromise = AsyncStorage.getItem(REFRESH_TOKEN_KEY)
      .then((refreshToken) => {
        if (!refreshToken) return null;
        return rawRequest<AuthResponse>('/api/v1/auth/refresh', {
          method: 'POST',
          body: JSON.stringify({
            clientType: 'MOBILE',
            deviceName: 'Kuri Labo iOS',
            refreshToken,
          }),
        });
      })
      .then(async (session) => {
        if (session) await setAuthTokens(session.accessToken, session.refreshToken);
        return session;
      })
      .catch(async () => {
        await setAuthTokens(null, null);
        return null;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
}

export async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  const accessToken = await AsyncStorage.getItem(ACCESS_TOKEN_KEY);
  try {
    return await rawRequest<T>(path, init, accessToken);
  } catch (error) {
    if (error instanceof ApiError && error.status === 401 && !path.includes('/auth/')) {
      const session = await refreshMobileSession();
      if (session) return rawRequest<T>(path, init, session.accessToken);
    }
    throw error;
  }
}

export async function authenticate(path: '/api/v1/auth/login' | '/api/v1/auth/register', body: object) {
  const session = await rawRequest<AuthResponse>(path, {
    method: 'POST',
    body: JSON.stringify({
      ...body,
      clientType: 'MOBILE',
      deviceName: 'Kuri Labo iOS',
    }),
  });
  await setAuthTokens(session.accessToken, session.refreshToken);
  return session;
}

export async function logoutMobileSession() {
  const refreshToken = await AsyncStorage.getItem(REFRESH_TOKEN_KEY);
  try {
    if (refreshToken) {
      await rawRequest<void>('/api/v1/auth/logout', {
        method: 'POST',
        body: JSON.stringify({ clientType: 'MOBILE', refreshToken }),
      });
    }
  } finally {
    await setAuthTokens(null, null);
  }
}

export { API_BASE_URL };

export function mediaUrl(value: string) {
  return value.startsWith('http://') || value.startsWith('https://') ? value : `${API_BASE_URL}${value}`;
}
