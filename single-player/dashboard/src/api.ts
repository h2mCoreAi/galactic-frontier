import type { DashboardBackup, GalacticFrontierConfig } from './types';

const JSON_HEADERS: HeadersInit = {
  'Content-Type': 'application/json',
};

const handleResponse = async <T>(response: Response): Promise<T> => {
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Request failed: ${response.status} ${response.statusText} -> ${text}`);
  }
  return response.json() as Promise<T>;
};

export const fetchConfig = async (): Promise<GalacticFrontierConfig> => {
  const response = await fetch('/api/config.json', {
    method: 'GET',
    headers: JSON_HEADERS,
    credentials: 'include',
    cache: 'no-store',
  });
  return handleResponse<GalacticFrontierConfig>(response);
};

export const persistConfig = async (config: GalacticFrontierConfig): Promise<void> => {
  const response = await fetch('/api/config.json', {
    method: 'PUT',
    headers: JSON_HEADERS,
    credentials: 'include',
    body: JSON.stringify(config),
  });
  await handleResponse<void>(response);
};

export const fetchBackups = async (): Promise<DashboardBackup[]> => {
  const response = await fetch('/api/config/backups', {
    method: 'GET',
    headers: JSON_HEADERS,
    credentials: 'include',
    cache: 'no-store',
  });
  const payload = await handleResponse<{ backups: DashboardBackup[] }>(response);
  return payload.backups;
};

export const restoreBackup = async (backupId: string): Promise<GalacticFrontierConfig> => {
  const response = await fetch(`/api/config/backups/${backupId}/restore`, {
    method: 'POST',
    headers: JSON_HEADERS,
    credentials: 'include',
  });
  return handleResponse<GalacticFrontierConfig>(response);
};

export const requestAuthentication = (): void => {
  window.location.href = '/auth/discord';
};

export const verifyAuthentication = async (): Promise<boolean> => {
  try {
    const response = await fetch('/api/profile', {
      method: 'GET',
      headers: JSON_HEADERS,
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
