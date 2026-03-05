import { getToken, handleUnauthorizedStatus } from '../auth';

const getApiBase = (): string => {
  try {
    const env = (import.meta as { env?: { VITE_API_URL?: string } }).env;
    return env?.VITE_API_URL ?? '';
  } catch {
    return '';
  }
};

export interface ScreenCategoryItem {
  id: string;
  name: string;
  screens_count?:number;
  is_active?: boolean;
  is_deleted?: boolean;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;
  sort_order?: number;
  [key: string]: unknown;
}

function screensCategoriesUrl(pathSuffix?: string): string {
  const base = getApiBase();
  const path = base ? '/admin/screens-categories' : '/api/admin/screens-categories';
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
    items?: ScreenCategoryItem[];
    total?: number;
  };
  message?: string;
}

/**
 * GET /api/admin/screens-categories
 * @param search optional search query
 * @param projectId optional project_id filter (e.g. for app detail page)
 */
export async function fetchScreensCategories(search?: string, projectId?: string): Promise<ScreenCategoryItem[]> {
  const baseUrl = screensCategoriesUrl();
  const params = new URLSearchParams();
  if (search && search.trim()) params.set('search', search.trim());
  if (projectId) params.set('project_id', projectId);
  const query = params.toString();
  const url = query ? `${baseUrl}?${query}` : baseUrl;

  const res = await fetch(url, { method: 'GET', headers: headers() });
  handleUnauthorizedStatus(res.status);
  const json: ListResponse | ScreenCategoryItem[] = await res.json();

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
 * POST /api/admin/screens-categories
 */
export async function createScreenCategory(name: string): Promise<ScreenCategoryItem> {
  const res = await fetch(screensCategoriesUrl(), {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({ name: name.trim() }),
  });

  const json = (await res.json()) as { data?: ScreenCategoryItem; message?: string } & ScreenCategoryItem;

  if (!res.ok) {
    const msg = typeof json.message === 'string' ? json.message : `Request failed: ${res.status}`;
    throw new Error(msg);
  }

  const item = json.data ?? (json.id ? (json as ScreenCategoryItem) : null);
  if (item) return item;
  return { id: '', name: name.trim() };
}

/**
 * PATCH /api/admin/screens-categories/:id
 */
export async function updateScreenCategory(id: string, body: { name?: string }): Promise<ScreenCategoryItem> {
  const res = await fetch(screensCategoriesUrl(encodeURIComponent(id)), {
    method: 'PATCH',
    headers: headers(),
    body: JSON.stringify(body),
  });

  const json = (await res.json()) as { data?: ScreenCategoryItem; message?: string } & ScreenCategoryItem;

  if (!res.ok) {
    const msg = typeof json.message === 'string' ? json.message : `Request failed: ${res.status}`;
    throw new Error(msg);
  }

  const item = json.data ?? (json.id ? (json as ScreenCategoryItem) : null);
  if (item) return item;
  return { id, name: body.name ?? '' };
}

/**
 * DELETE /api/admin/screens-categories/:id
 */
export async function deleteScreenCategory(id: string): Promise<void> {
  const res = await fetch(screensCategoriesUrl(encodeURIComponent(id)), {
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
