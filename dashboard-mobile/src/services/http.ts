// Low-level HTTP helpers shared by the API service and the offline sync engine.
// Keeping the base URL and fetch logic here avoids a circular import between
// `api.ts` (which queues mutations) and `sync.ts` (which replays them).
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { getServerUrl } from '../config/serverUrl';

function resolveDevFallback(): string {
  const hostUri =
    Constants.expoConfig?.hostUri ?? Constants.manifest2?.extra?.expoGo?.debuggerHost;
  if (hostUri) {
    const host = hostUri.split(':').slice(0, -1).join(':') || hostUri;
    return `http://${host}:3000`;
  }
  if (Platform.OS === 'android') return 'http://10.0.2.2:3000';
  return 'http://localhost:3000';
}

// Resolution order:
//   1. EXPO_PUBLIC_API_URL baked into the build (production APK -> Vercel).
//   2. Standalone build with no baked URL (the LAN build): the runtime
//      address discovered/entered by the user, persisted in AsyncStorage.
//      If none is configured yet, NetworkError tells the caller to run the
//      server setup UI instead of silently hitting the wrong host.
//   3. Expo Go dev: the Metro host the bundle was loaded from.
export async function resolveApiBaseUrl(): Promise<string> {
  const configured = process.env.EXPO_PUBLIC_API_URL?.trim();
  if (configured) return configured.replace(/\/+$/, '');

  if (Constants.appOwnership !== 'expo') {
    const stored = await getServerUrl();
    if (stored) return stored;
    throw new NetworkError('Server address not configured yet');
  }

  return resolveDevFallback();
}

export class ApiError extends Error {
  status: number;
  body: unknown;

  constructor(message: string, status: number, body?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.body = body;
  }
}

export class NetworkError extends Error {
  constructor(message = 'Network request failed') {
    super(message);
    this.name = 'NetworkError';
  }
}

export function isNetworkError(error: unknown): boolean {
  return error instanceof NetworkError;
}

export function isAbortError(error: unknown): boolean {
  return error instanceof Error && error.name === 'AbortError';
}

const DEFAULT_TIMEOUT = 8000;

export async function rawRequest<T>(
  path: string,
  options?: RequestInit,
  timeoutMs = DEFAULT_TIMEOUT
): Promise<T> {
  const base = await resolveApiBaseUrl();
  const url = `${base}${path}`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  let response: Response;
  try {
    response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...(options?.headers ?? {}),
      },
      ...options,
      signal: controller.signal,
    });
  } catch (error) {
    throw new NetworkError(error instanceof Error ? error.message : 'Network request failed');
  } finally {
    clearTimeout(timer);
  }

  if (!response.ok) {
    const body = await response.json().catch(() => ({ message: 'Request failed' }));
    const message =
      (body && typeof body === 'object' && 'message' in body
        ? String((body as { message?: unknown }).message)
        : null) ?? `HTTP ${response.status}`;
    throw new ApiError(message, response.status, body);
  }

  return response.json();
}

export function makeClientOpId(): string {
  return `op-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}
