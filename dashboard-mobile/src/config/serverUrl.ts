// Runtime server-address configuration for the standalone LAN build.
//
// The production APK gets its API URL baked in at build time
// (EXPO_PUBLIC_API_URL), but the local-network build must work on any LAN
// regardless of which PC runs the API and what IP it currently has. For that
// build the address is discovered at runtime (subnet scan against
// GET /api/health) or entered manually, and persisted in AsyncStorage so it
// survives app restarts.
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import * as Network from 'expo-network';

const STORAGE_KEY = '@dashboard/server_url';
const DISCOVERY_PORT = 3000;

let cachedUrl: string | null = null;
let cacheLoaded = false;

export function isExpoGo(): boolean {
  return Constants.appOwnership === 'expo';
}

export function isBakedUrlSet(): boolean {
  return !!process.env.EXPO_PUBLIC_API_URL?.trim();
}

// True only for the standalone LAN build (no baked URL, not Expo Go): that
// build must be told where the API lives before anything can be fetched.
export function requiresServerConfig(): boolean {
  return !isBakedUrlSet() && !isExpoGo();
}

export function normalizeUrl(input: string): string {
  let url = input.trim().replace(/\/+$/, '');
  if (url && !/^https?:\/\//i.test(url)) url = `http://${url}`;
  return url;
}

// Basic http(s) URL check without relying on Hermes' partial URL parser.
export function isValidServerUrl(input: string): boolean {
  const url = normalizeUrl(input);
  return /^https?:\/\/[a-z0-9.-]+(?::\d{1,5})?(?:[/?#]|$)/i.test(url);
}

export async function getServerUrl(): Promise<string | null> {
  if (cacheLoaded) return cachedUrl;
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    cachedUrl = raw && isValidServerUrl(raw) ? normalizeUrl(raw) : null;
  } catch {
    cachedUrl = null;
  }
  cacheLoaded = true;
  return cachedUrl;
}

export async function setServerUrl(input: string): Promise<string> {
  const url = normalizeUrl(input);
  if (!isValidServerUrl(url)) {
    throw new Error('Enter a valid address like http://192.168.1.10:3000');
  }
  await AsyncStorage.setItem(STORAGE_KEY, url);
  cachedUrl = url;
  cacheLoaded = true;
  return url;
}

export async function clearServerUrl(): Promise<void> {
  await AsyncStorage.removeItem(STORAGE_KEY);
  cachedUrl = null;
  cacheLoaded = true;
}

// Probes <base>/api/health and requires the response to identify this API, so
// a random service that happens to answer on :3000 is not mistaken for it.
export async function testServerUrl(input: string, timeoutMs = 3500): Promise<boolean> {
  const url = normalizeUrl(input);
  if (!isValidServerUrl(url)) return false;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(`${url}/api/health`, { signal: controller.signal });
    if (!res.ok) return false;
    const body = (await res.json().catch(() => null)) as
      | { ok?: boolean; service?: string }
      | null;
    return !!body && body.ok === true && body.service === 'dashboard-api';
  } catch {
    return false;
  } finally {
    clearTimeout(timer);
  }
}

// Scans the phone's own /24 subnet on port 3000 for a running API. Returns
// the address of the first instance that answers as this API and persists it.
export async function findServer(
  onProgress?: (tested: number, total: number) => void
): Promise<string | null> {
  let ip: string | null = null;
  try {
    const address = await Network.getIpAddressAsync();
    if (address && address !== '0.0.0.0') ip = address;
  } catch {
    ip = null;
  }
  if (!ip) return null;

  const parts = ip.split('.');
  if (parts.length !== 4) return null;
  const subnet = `${parts[0]}.${parts[1]}.${parts[2]}`;
  const ownHost = Number(parts[3]);

  const candidates: string[] = [];
  for (let host = 1; host <= 254; host++) {
    if (host === ownHost) continue;
    candidates.push(`http://${subnet}.${host}:${DISCOVERY_PORT}`);
  }

  const CONCURRENCY = 32;
  const TIMEOUT_PER_PROBE = 1200;
  let found: string | null = null;

  for (let i = 0; i < candidates.length && !found; i += CONCURRENCY) {
    const batch = candidates.slice(i, i + CONCURRENCY);
    const results = await Promise.all(
      batch.map(async (candidate) => ((await testServerUrl(candidate, TIMEOUT_PER_PROBE)) ? candidate : null))
    );
    found = results.find((r): r is string => r !== null) ?? null;
    onProgress?.(Math.min(i + CONCURRENCY, candidates.length), candidates.length);
  }

  if (found) await setServerUrl(found);
  return found;
}
