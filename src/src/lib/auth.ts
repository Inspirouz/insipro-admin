// Auth helpers

import { apiClient } from './api';

const TOKEN_KEY = 'admin_token';
const REFRESH_TOKEN_KEY = 'admin_refresh_token';

const getApiBase = (): string => {
  try {
    const env = (import.meta as { env?: { VITE_API_URL?: string } }).env;
    return env?.VITE_API_URL ?? '';
  } catch {
    return '';
  }
};

export function setToken(token: string) {
  if (typeof window !== 'undefined') {
    localStorage.setItem(TOKEN_KEY, token);
  }
}

export function getToken(): string | null {
  if (typeof window !== 'undefined') {
    return localStorage.getItem(TOKEN_KEY);
  }
  return null;
}

export function setRefreshToken(token: string) {
  if (typeof window !== 'undefined') {
    localStorage.setItem(REFRESH_TOKEN_KEY, token);
  }
}

export function getRefreshToken(): string | null {
  if (typeof window !== 'undefined') {
    return localStorage.getItem(REFRESH_TOKEN_KEY);
  }
  return null;
}

export function clearToken() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
  }
}

export function isAuthenticated(): boolean {
  return !!getToken();
}

export interface LoginResponse {
  status_code: number;
  data?: {
    access_token: string;
    refresh_token: string;
    role: string;
    id: string;
  };
  message?: string;
}

export async function login(username: string, password: string): Promise<void> {
  const base = getApiBase();
  const url = base ? `${base}/executer/login` : '/executer/login';
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });
  const json: LoginResponse = await res.json();

  if (json.status_code === 200 && json.data?.access_token) {
    setToken(json.data.access_token);
    if (json.data.refresh_token) {
      setRefreshToken(json.data.refresh_token);
    }
    return;
  }
  throw new Error(json.message || 'Login failed');
}

export async function logout() {
  try {
    await apiClient.logout();
  } catch {
    // ignore
  }
  clearToken();
}
