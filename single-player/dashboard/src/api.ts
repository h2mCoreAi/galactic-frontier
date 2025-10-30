import type { DashboardBackup, GalacticFrontierConfig } from './types';

const JSON_HEADERS: HeadersInit = {
  'Content-Type': 'application/json',
};

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000;
const RETRIABLE_STATUS_CODES = [408, 500, 502, 503, 504]; // 429 removed - rate limits shouldn't retry immediately

const getAuthHeaders = (): HeadersInit => {
  try {
    const token = window.localStorage.getItem('gf_auth_token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  } catch (_err) {
    return {};
  }
};

const delay = (ms: number): Promise<void> => new Promise((resolve) => {
  setTimeout(resolve, ms);
});

const isRetriableError = (status: number, error: Error): boolean => {
  // Never retry rate limit errors (429) - they need manual intervention or longer waits
  if (status === 429) {
    return false;
  }
  if (RETRIABLE_STATUS_CODES.includes(status)) {
    return true;
  }
  if (error.message.includes('network') || error.message.includes('fetch')) {
    return true;
  }
  return false;
};

const retryFetch = async <T>(
  fn: () => Promise<T>,
  retries = MAX_RETRIES,
  attempt = 1,
): Promise<T> => {
  try {
    return await fn();
  } catch (error) {
    const isLastAttempt = attempt >= retries;
    const status = error instanceof Error && 'status' in error ? Number(error.status) : 0;
    const shouldRetry = !isLastAttempt && isRetriableError(status, error as Error);

    if (!shouldRetry) {
      throw error;
    }

    const delayMs = RETRY_DELAY_MS * attempt;
    console.warn(`[GF Dashboard] API request failed (attempt ${attempt}/${retries}), retrying in ${delayMs}ms...`, error);
    await delay(delayMs);
    return retryFetch(fn, retries, attempt + 1);
  }
};

const handleResponse = async <T>(response: Response): Promise<T> => {
  if (!response.ok) {
    const text = await response.text();
    const error = new Error(`Request failed: ${response.status} ${response.statusText} -> ${text}`);
    (error as Error & { status: number }).status = response.status;
    throw error;
  }
  return response.json() as Promise<T>;
};

export const fetchConfig = async (): Promise<GalacticFrontierConfig> => {
  return retryFetch(async () => {
    const response = await fetch('/api/config.json', {
      method: 'GET',
      headers: { ...JSON_HEADERS },
      credentials: 'include',
      cache: 'no-store',
    });
    return handleResponse<GalacticFrontierConfig>(response);
  });
};

export const persistConfig = async (config: GalacticFrontierConfig): Promise<void> => {
  return retryFetch(async () => {
    const response = await fetch('/api/config.json', {
      method: 'PUT',
      headers: { ...JSON_HEADERS, ...getAuthHeaders() },
      credentials: 'include',
      body: JSON.stringify(config),
    });
    await handleResponse<void>(response);
  });
};

export const fetchBackups = async (): Promise<DashboardBackup[]> => {
  return retryFetch(async () => {
    const response = await fetch('/api/config/backups', {
      method: 'GET',
      headers: { ...JSON_HEADERS, ...getAuthHeaders() },
      credentials: 'include',
      cache: 'no-store',
    });
    const payload = await handleResponse<{ backups: DashboardBackup[] }>(response);
    return payload.backups;
  });
};

export const restoreBackup = async (backupId: string): Promise<GalacticFrontierConfig> => {
  return retryFetch(async () => {
    const response = await fetch(`/api/config/backups/${backupId}/restore`, {
      method: 'POST',
      headers: { ...JSON_HEADERS, ...getAuthHeaders() },
      credentials: 'include',
    });
    return handleResponse<GalacticFrontierConfig>(response);
  });
};

export const deployConfig = async (): Promise<void> => {
  return retryFetch(async () => {
    const response = await fetch('/api/config/deploy', {
      method: 'POST',
      headers: { ...JSON_HEADERS, ...getAuthHeaders() },
      credentials: 'include',
    });
    await handleResponse<{ success: boolean; message: string }>(response);
  });
};

export const requestAuthentication = (): void => {
  window.location.href = '/auth/discord';
};

export const verifyAuthentication = async (): Promise<boolean> => {
  try {
    const response = await fetch('/api/profile', {
      method: 'GET',
      headers: { ...JSON_HEADERS, ...getAuthHeaders() },
      credentials: 'include',
      cache: 'no-store',
    });
    if (!response.ok) {
      return false;
    }
    await response.json();
    return true;
  } catch (error) {
    console.warn('[GF Dashboard] Authentication check failed', error);
    return false;
  }
};

export const checkHealth = async (): Promise<boolean> => {
  try {
    const response = await fetch('/api/health', {
      method: 'GET',
      headers: JSON_HEADERS,
      cache: 'no-store',
    });
    return response.ok;
  } catch (error) {
    return false;
  }
};
