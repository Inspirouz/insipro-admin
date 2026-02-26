import { getToken } from '../auth';

const getApiBase = (): string => {
  try {
    const env = (import.meta as { env?: { VITE_API_URL?: string } }).env;
    return env?.VITE_API_URL ?? '';
  } catch {
    return '';
  }
};

export interface CategoryItem {
  id: string;
  name: string;
}

/** API response: array or { data: [...] } / { items: [...] } */
interface CategoriesApiResponse {
  data?: CategoryItem[];
  items?: CategoryItem[];
}

/**
 * GET /api/categories
 * Base URL may include /api, so path is /categories when base is set.
 */
export async function fetchCategories(): Promise<CategoryItem[]> {
  const base = getApiBase();
  const path = base ? '/categories' : '/api/categories';
  const url = base ? `${base.replace(/\/$/, '')}${path}` : path;

  const token = getToken();
  const headers: HeadersInit = { 'Content-Type': 'application/json' };
  if (token) (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;

  const res = await fetch(url, { method: 'GET', headers });
  const json: CategoriesApiResponse | CategoryItem[] = await res.json();

  if (!res.ok) {
    const msg = typeof (json as { message?: string }).message === 'string'
      ? (json as { message: string }).message
      : `Request failed: ${res.status}`;
    throw new Error(msg);
  }

  if (Array.isArray(json)) return json;
  const data = (json as CategoriesApiResponse).data ?? (json as CategoriesApiResponse).items ?? [];
  return data;
}

/**
 * GET /categories/app
 * App categories list for /categories/app page.
 */
export async function fetchAppCategories(): Promise<CategoryItem[]> {
  const base = getApiBase();
  const path = base ? '/categories' : '/api/categories';
  const url = base ? `${base.replace(/\/$/, '')}${path}` : path;

  const token = getToken();
  const headers: HeadersInit = { 'Content-Type': 'application/json' };
  if (token) (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;

  const res = await fetch(url, { method: 'GET', headers });
  const json: CategoriesApiResponse | CategoryItem[] = await res.json();

  if (!res.ok) {
    const msg = typeof (json as { message?: string }).message === 'string'
      ? (json as { message: string }).message
      : `Request failed: ${res.status}`;
    throw new Error(msg);
  }

  if (Array.isArray(json)) return json;
  const data = (json as CategoriesApiResponse).data ?? (json as CategoriesApiResponse).items ?? [];
  return data;
}

function categoriesUrl(pathSuffix: string): string {
  const base = getApiBase();
  const path = base ? '/categories' : '/api/categories';
  const url = base ? `${base.replace(/\/$/, '')}${path}` : path;
  return pathSuffix ? `${url}/${pathSuffix}` : url;
}

function categoriesHeaders(): HeadersInit {
  const token = getToken();
  const headers: HeadersInit = { 'Content-Type': 'application/json' };
  if (token) (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
  return headers;
}

/**
 * POST /api/categories
 * Body: { name: string }
 */
export async function createCategory(body: { name: string }): Promise<CategoryItem> {
  const res = await fetch(categoriesUrl(''), {
    method: 'POST',
    headers: categoriesHeaders(),
    body: JSON.stringify(body),
  });

  const json = await res.json() as { message?: string; data?: CategoryItem };

  if (!res.ok) {
    const msg = typeof json.message === 'string' ? json.message : `Request failed: ${res.status}`;
    throw new Error(msg);
  }

  if (json.data && typeof json.data.id === 'string' && typeof json.data.name === 'string') {
    return json.data;
  }
  return { id: '', name: body.name };
}

/**
 * PATCH /api/categories/{id}
 */
export async function updateCategory(id: string, body: { name: string }): Promise<CategoryItem> {
  const res = await fetch(categoriesUrl(encodeURIComponent(id)), {
    method: 'PATCH',
    headers: categoriesHeaders(),
    body: JSON.stringify(body),
  });

  const json = await res.json() as { message?: string; data?: CategoryItem };

  if (!res.ok) {
    const msg = typeof json.message === 'string' ? json.message : `Request failed: ${res.status}`;
    throw new Error(msg);
  }

  if (json.data && typeof json.data.id === 'string' && typeof json.data.name === 'string') {
    return json.data;
  }
  return { id, name: body.name };
}

/**
 * DELETE /api/categories/{id}
 */
export async function deleteCategory(id: string): Promise<void> {
  const res = await fetch(categoriesUrl(encodeURIComponent(id)), {
    method: 'DELETE',
    headers: categoriesHeaders(),
  });

  if (!res.ok) {
    let msg = `Request failed: ${res.status}`;
    try {
      const json = await res.json() as { message?: string };
      if (typeof json.message === 'string') msg = json.message;
    } catch {
      // ignore
    }
    throw new Error(msg);
  }
}
