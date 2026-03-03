import { getToken } from '../auth';
import type { Scenario } from '../types';

const getApiBase = (): string => {
  try {
    const env = (import.meta as { env?: { VITE_API_URL?: string } }).env;
    return env?.VITE_API_URL ?? '';
  } catch {
    return '';
  }
};

function scenariosUrl(pathSuffix?: string): string {
  const base = getApiBase();
  const path = base ? '/admin/scenarios' : '/api/admin/scenarios';
  const url = base ? `${base.replace(/\/$/, '')}${path}` : path;
  return pathSuffix ? `${url}/${pathSuffix}` : url;
}

function headers(): HeadersInit {
  const token = getToken();
  const h: HeadersInit = { 'Content-Type': 'application/json' };
  if (token) (h as Record<string, string>)['Authorization'] = `Bearer ${token}`;
  return h;
}

interface ScenarioItem {
  id: string;
  name: string;
  parent_id?: string | null;
  [key: string]: unknown;
}

/** GET response: { success, data: { items, total }, status_code, message } */
interface ListResponse {
  success?: boolean;
  data?: {
    items?: ScenarioItem[];
    total?: number;
  };
  message?: string;
}

/**
 * GET /api/admin/scenarios
 */
export async function fetchScenarios(search?: string): Promise<Scenario[]> {
  const baseUrl = scenariosUrl();
  const params = new URLSearchParams();
  if (search && search.trim()) params.set('search', search.trim());
  const query = params.toString();
  const url = query ? `${baseUrl}?${query}` : baseUrl;

  const res = await fetch(url, { method: 'GET', headers: headers() });
  const json: ListResponse | ScenarioItem[] = await res.json();

  if (!res.ok) {
    const msg = typeof (json as { message?: string }).message === 'string'
      ? (json as { message: string }).message
      : `Request failed: ${res.status}`;
    throw new Error(msg);
  }

  const list = json as ListResponse;
  const raw: ScenarioItem[] = Array.isArray(json) ? json : list.data?.items ?? [];

  return raw.map((item) => ({
    id: item.id,
    name: String(item.name ?? ''),
    parentId: (item.parent_id ?? undefined) as string | undefined,
  }));
}

