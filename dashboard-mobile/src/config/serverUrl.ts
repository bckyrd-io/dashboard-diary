// Runtime server configuration for the app.
//
// The Config screen (reached from the link at the bottom of the Landing page)
// lets the user choose how the app talks to its backend:
//
//   mode 'online'  -> use EXPO_PUBLIC_API_URL baked into the build
//                     (the Vercel URL on EAS builds, the .env value in dev).
//   mode 'local'   -> use the PC address the user typed, persisted here in
//                     AsyncStorage so it survives app restarts.
//
// There is deliberately NO automatic subnet scanning: the address is always
// entered by hand and verified against GET /api/health before it's trusted.
import AsyncStorage from '@react-native-async-storage/async-storage';

export type ServerMode = 'online' | 'local';

export interface ServerConfig {
  mode: ServerMode;
  /** Only meaningful for mode 'local'. */
  localAddress: string | null;
}

const STORAGE_KEY = '@dashboard/server_config';
// Key used by an earlier build that stored a single plain URL string.
const LEGACY_STORAGE_KEY = '@dashboard/server_url';

const DEFAULT_CONFIG: ServerConfig = { mode: 'online', localAddress: null };

let cachedConfig: ServerConfig | null = null;

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

// The address compiled into this build (EXPO_PUBLIC_API_URL): Vercel on EAS,
// the local PC address from dashboard-mobile/.env during development.
export function getDefaultUrl(): string | null {
  const env = process.env.EXPO_PUBLIC_API_URL?.trim();
  return env ? env.replace(/\/+$/, '') : null;
}

export async function getServerConfig(): Promise<ServerConfig> {
  if (cachedConfig) return cachedConfig;

  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<ServerConfig> | null;
      if (parsed && (parsed.mode === 'online' || parsed.mode === 'local')) {
        cachedConfig = {
          mode: parsed.mode,
          localAddress:
            typeof parsed.localAddress === 'string' && parsed.localAddress.trim()
              ? parsed.localAddress
              : null,
        };
        return cachedConfig;
      }
    }

    // Migrate installs from the pre-mode build: a plain saved URL means the
    // user had already pointed the app at their PC.
    const legacy = await AsyncStorage.getItem(LEGACY_STORAGE_KEY);
    if (legacy && isValidServerUrl(legacy)) {
      const migrated: ServerConfig = { mode: 'local', localAddress: normalizeUrl(legacy) };
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(migrated));
      await AsyncStorage.removeItem(LEGACY_STORAGE_KEY);
      cachedConfig = migrated;
      return cachedConfig;
    }
  } catch {
    // Unreadable storage: fall through to the default.
  }

  cachedConfig = { ...DEFAULT_CONFIG };
  return cachedConfig;
}

export async function setServerConfig(config: ServerConfig): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  cachedConfig = config;
}

// "Reset to default" on the Config screen: forget every override and go back
// to the build default (online mode -> EXPO_PUBLIC_API_URL).
export async function clearServerConfig(): Promise<void> {
  try {
    await AsyncStorage.removeItem(STORAGE_KEY);
    await AsyncStorage.removeItem(LEGACY_STORAGE_KEY);
  } catch {
    // Nothing we can do; the in-memory cache reset below still applies.
  }
  cachedConfig = { ...DEFAULT_CONFIG };
}

// The address the app will actually talk to right now, or null when there is
// nothing to use (no override and no build default).
export async function getEffectiveServerUrl(): Promise<string | null> {
  const config = await getServerConfig();
  if (config.mode === 'local') {
    const addr = config.localAddress ? normalizeUrl(config.localAddress) : '';
    if (addr && isValidServerUrl(addr)) return addr;
  }
  return getDefaultUrl();
}

// Probes <base>/api/health and requires the response to identify this API, so
// a random service that happens to answer on the same port is not mistaken
// for it.
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
