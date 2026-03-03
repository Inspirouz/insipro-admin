import { getToken } from '../auth';

const getApiBase = (): string => {
  try {
    const env = (import.meta as { env?: { VITE_API_URL?: string } }).env;
    return env?.VITE_API_URL ?? '';
  } catch {
    return '';
  }
};

export interface ScenarioCategoryItem {
  id: string;
  name: string;
  sort_order?: number;
  parent_id?: string | null;
  is_active?: boolean;
  is_deleted?: boolean;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;
}

function scenariosCategoriesUrl(pathSuffix?: string): string {
  const base = getApiBase();
  const path = base ? '/admin/scenarios-categories' : '/api/admin/scenarios-categories';
  const url = base ? `${base.replace(/\/$/, '')}${path}` : path;
  return pathSuffix ? `${url}/${pathSuffix}` : url;
}

function headers(): HeadersInit {
  const token = getToken();
  const h: HeadersInit = { 'Content-Type': 'application/json' };
  if (token) (h as Record<string, string>)['Authorization'] = `Bearer ${token}`;
  return h;
}

/** GET response: { success, data: { items, total }, status_code, message } */
interface ListResponse {
  success?: boolean;
  data?: {
    items?: ScenarioCategoryItem[];
    total?: number;
  };
  message?: string;
}

/**
 * GET /api/admin/scenarios-categories
 */
export async function fetchScenarioCategories(search?: string): Promise<ScenarioCategoryItem[]> {
  const baseUrl = scenariosCategoriesUrl();
  const params = new URLSearchParams();
  if (search && search.trim()) params.set('search', search.trim());
  const query = params.toString();
  const url = query ? `${baseUrl}?${query}` : baseUrl;

  const res = await fetch(url, { method: 'GET', headers: headers() });
  const json: ListResponse | ScenarioCategoryItem[] = await res.json();

  if (!res.ok) {
    const msg = typeof (json as { message?: string }).message === 'string'
      ? (json as { message: string }).message
      : `Request failed: ${res.status}`;
    throw new Error(msg);
  }

  const list = json as ListResponse;
  const raw = Array.isArray(json) ? json : list.data?.items ?? [];
  return raw;
}

/**
 * POST /api/admin/scenarios-categories
 */
export async function createScenarioCategory(
  name: string,
  sort_order = 0,
  parent_id?: string | null,
): Promise<ScenarioCategoryItem> {
  const res = await fetch(scenariosCategoriesUrl(), {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({
      name: name.trim(),
      sort_order,
      ...(parent_id ? { parent_id } : {}),
    }),
  });

  const json = (await res.json()) as { data?: ScenarioCategoryItem; message?: string } & ScenarioCategoryItem;

  if (!res.ok) {
    const msg = typeof json.message === 'string' ? json.message : `Request failed: ${res.status}`;
    throw new Error(msg);
  }

  const item = json.data ?? (json.id ? (json as ScenarioCategoryItem) : null);
  if (item) return item;
  return { id: '', name: name.trim(), sort_order, parent_id: parent_id ?? null };
}

/**
 * PATCH /api/admin/scenarios-categories/:id
 */
export async function updateScenarioCategory(
  id: string,
  body: { name?: string; sort_order?: number; parent_id?: string | null },
): Promise<ScenarioCategoryItem> {
  const res = await fetch(scenariosCategoriesUrl(encodeURIComponent(id)), {
    method: 'PATCH',
    headers: headers(),
    body: JSON.stringify(body),
  });

  const json = (await res.json()) as { data?: ScenarioCategoryItem; message?: string } & ScenarioCategoryItem;

  if (!res.ok) {
    const msg = typeof json.message === 'string' ? json.message : `Request failed: ${res.status}`;
    throw new Error(msg);
  }

  const item = json.data ?? (json.id ? (json as ScenarioCategoryItem) : null);
  if (item) return item;
  return { id, name: body.name ?? '', sort_order: body.sort_order, parent_id: body.parent_id };
}

/**
 * DELETE /api/admin/scenarios-categories/:id
 */
export async function deleteScenarioCategory(id: string): Promise<void> {
  const res = await fetch(scenariosCategoriesUrl(encodeURIComponent(id)), {
    method: 'DELETE',
    headers: headers(),
  });

  if (!res.ok) {
    let msg = `Request failed: ${res.status}`;
    try {
      const json = (await res.json()) as { message?: string };
      if (typeof json.message === 'string') msg = json.message;
    } catch {
      // ignore
    }
    throw new Error(msg);
  }
}

