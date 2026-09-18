import { RadioBrowserApi } from 'radio-browser-api';

const APP_NAME = 'My Radio App';
const ATTEMPT_TIMEOUT_MS = 15000;

// Mirrors used only to bootstrap the live server list. Never used for
// data directly, so a dead bootstrap entry is harmless (we try the next).
const BOOTSTRAP_BASE_URLS = [
  'https://de1.api.radio-browser.info',
  'https://de2.api.radio-browser.info',
  'https://nl1.api.radio-browser.info',
  'https://at1.api.radio-browser.info',
];

interface ServerInfo {
  name: string;
}

let cachedBaseUrls: string[] | null = null;

const withTimeout = <T>(promise: Promise<T>, label: string): Promise<T> =>
  Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(
        () => reject(new Error(`${label} timed out after ${ATTEMPT_TIMEOUT_MS}ms`)),
        ATTEMPT_TIMEOUT_MS
      )
    ),
  ]);

async function fetchServerList(bootstrapBaseUrl: string): Promise<string[]> {
  const response = await withTimeout(
    fetch(`${bootstrapBaseUrl}/json/servers`, { next: { revalidate: 3600 } }),
    `Server list from ${bootstrapBaseUrl}`
  );
  if (!response.ok) {
    throw new Error(`Server list request failed (${response.status})`);
  }
  const servers = (await response.json()) as ServerInfo[];
  const baseUrls = servers
    .map((s) => s?.name)
    .filter((name): name is string => typeof name === 'string' && name.length > 0)
    .map((name) => `https://${name}`);
  if (baseUrls.length === 0) {
    throw new Error('Server list was empty');
  }
  return baseUrls;
}

export async function getRadioBaseUrls(): Promise<string[]> {
  if (!cachedBaseUrls) {
    for (const bootstrap of BOOTSTRAP_BASE_URLS) {
      try {
        cachedBaseUrls = await fetchServerList(bootstrap);
        break;
      } catch {
        // Try the next bootstrap mirror.
      }
    }
    // Last resort: talk to the bootstrap mirrors directly.
    cachedBaseUrls ??= [...BOOTSTRAP_BASE_URLS];
  }
  return cachedBaseUrls;
}

// Runs fn against live mirrors in order, failing over to the next mirror
// on error. Fixes hardcoded-mirror outages (e.g. DNS ENOTFOUND).
export async function withRadioApi<T>(
  fn: (api: RadioBrowserApi) => Promise<T>
): Promise<T> {
  const baseUrls = await getRadioBaseUrls();
  let lastError: unknown = null;
  for (const baseUrl of baseUrls) {
    try {
      const api = new RadioBrowserApi(APP_NAME);
      api.setBaseUrl(baseUrl);
      return await withTimeout(fn(api), `Radio API call to ${baseUrl}`);
    } catch (error) {
      lastError = error;
      console.warn(`Radio API mirror failed (${baseUrl}), trying next...`);
    }
  }
  // Force a fresh server list on the next request.
  cachedBaseUrls = null;
  throw lastError instanceof Error
    ? lastError
    : new Error('All radio API mirrors failed');
}
