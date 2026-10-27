// Low-level HTTP helpers shared by the API service and the offline sync engine.
// Keeping the base URL and fetch logic here avoids a circular import between
// `api.ts` (which queues mutations) and `sync.ts` (which replays them).
import Constants from 'expo-constants';
import { Platform } from 'react-native';

function resolveApiBaseUrl() {
  const configured = process.env.EXPO_PUBLIC_API_URL?.trim();
  if (configured) return configured.replace(/\/$/, '');

  const hostUri =
    Constants.expoConfig?.hostUri ?? Constants.manifest2?.extra?.expoGo?.debuggerHost;
  if (hostUri) {
    const host = hostUri.split(':').slice(0, -1).join(':') || hostUri;
    return `http://${host}:3000`;
  }

  if (Platform.OS === 'android') return 'http://10.0.2.2:3000';
  return 'http://localhost:3000';
}

export const API_BASE_URL = resolveApiBaseUrl();

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
  const url = `${API_BASE_URL}${path}`;
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
