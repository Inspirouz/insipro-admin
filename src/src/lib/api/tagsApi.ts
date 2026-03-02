import { getToken } from '../auth';

const getApiBase = (): string => {
  try {
    const env = (import.meta as { env?: { VITE_API_URL?: string } }).env;
    return env?.VITE_API_URL ?? '';
  } catch {
    return '';
  }
};

export interface TagItem {
  id: string;
  name: string;
  type: string;
  [key: string]: unknown;
}

function tagsUrl(pathSuffix?: string): string {
  const base = getApiBase();
  const path = base ? '/admin/tags' : '/api/admin/tags';
  const url = base ? `${base.replace(/\/$/, '')}${path}` : path;
  return pathSuffix ? `${url}/${pathSuffix}` : url;
}

function tagsHeaders(): HeadersInit {
  const token = getToken();
  const headers: HeadersInit = { 'Content-Type': 'application/json' };
  if (token) (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
  return headers;
}

/** List response: array or { data: [...] } / { items: [...] } */
interface ListResponse {
  data?: TagItem[];
  items?: TagItem[];
}

/**
 * GET /api/admin/tags
 * @param type optional filter e.g. "patterns"
 * @param search optional search query (backend filter)
 */
export async function fetchTags(type?: string, search?: string): Promise<TagItem[]> {
  const baseUrl = tagsUrl();
  const params = new URLSearchParams();
  if (type) params.set('type', type);
  if (search && search.trim()) params.set('search', search.trim());
  const query = params.toString();
  const url = query ? `${baseUrl}?${query}` : baseUrl;

  const res = await fetch(url, { method: 'GET', headers: tagsHeaders() });
  const json: ListResponse | TagItem[] = await res.json();

  if (!res.ok) {
    const msg = typeof (json as { message?: string }).message === 'string'
      ? (json as { message: string }).message
      : `Request failed: ${res.status}`;
    throw new Error(msg);
  }

  const raw = Array.isArray(json) ? json : (json as ListResponse).data ?? (json as ListResponse).items ?? [];
  return raw;
}

/**
 * POST /api/admin/tags
 * Body: { name: string, type: "patterns" }
 */
export async function createTag(name: string, type: string): Promise<TagItem> {
  const res = await fetch(tagsUrl(), {
    method: 'POST',
    headers: tagsHeaders(),
    body: JSON.stringify({ name: name.trim(), type }),
  });

  const json = (await res.json()) as { data?: TagItem; message?: string } & TagItem;

  if (!res.ok) {
    const msg = typeof json.message === 'string' ? json.message : `Request failed: ${res.status}`;
    throw new Error(msg);
  }

  const item = json.data ?? (json.id ? (json as TagItem) : null);
  if (item) return item;
  return { id: '', name: name.trim(), type };
}

/**
 * PATCH /api/admin/tags/:id
 */
export async function updateTag(id: string, body: { name?: string; type?: string }): Promise<TagItem> {
  const res = await fetch(tagsUrl(encodeURIComponent(id)), {
    method: 'PATCH',
    headers: tagsHeaders(),
    body: JSON.stringify(body),
  });

  const json = (await res.json()) as { data?: TagItem; message?: string } & TagItem;

  if (!res.ok) {
    const msg = typeof json.message === 'string' ? json.message : `Request failed: ${res.status}`;
    throw new Error(msg);
  }

  const item = json.data ?? (json.id ? (json as TagItem) : null);
  if (item) return item;
  return { id, name: body.name ?? '', type: body.type ?? 'patterns' };
}

/**
 * DELETE /api/admin/tags/:id
 */
export async function deleteTag(id: string): Promise<void> {
  const res = await fetch(tagsUrl(encodeURIComponent(id)), {
    method: 'DELETE',
    headers: tagsHeaders(),
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
