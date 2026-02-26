import { getToken } from '../auth';

const getApiBase = (): string => {
  try {
    const env = (import.meta as { env?: { VITE_API_URL?: string } }).env;
    return env?.VITE_API_URL ?? '';
  } catch {
    return '';
  }
};

export interface ExecuterItem {
  id: string;
  full_name: string | null;
  username: string | null;
  phone_number: string | null;
  image: string | null;
  created_at: string;
  updated_at: string;
  is_active: boolean;
  role: string;
}

function executerUrl(pathSuffix?: string): string {
  const base = getApiBase();
  const path = base ? '/executer' : '/api/executer';
  const url = base ? `${base.replace(/\/$/, '')}${path}` : path;
  return pathSuffix ? `${url}/${pathSuffix}` : url;
}

function executerHeaders(): HeadersInit {
  const token = getToken();
  const headers: HeadersInit = { 'Content-Type': 'application/json' };
  if (token) (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
  return headers;
}

/** List response: array or { data: [...] } / { items: [...] } */
interface ListResponse {
  data?: ExecuterItem[];
  items?: ExecuterItem[];
}

/** Single response: { data: ExecuterItem } */
interface SingleResponse {
  data?: ExecuterItem;
  message?: string;
}

/**
 * GET /api/executer — list all
 */
export async function fetchExecuters(): Promise<ExecuterItem[]> {
  const res = await fetch(executerUrl(), { method: 'GET', headers: executerHeaders() });
  const json: ListResponse | ExecuterItem[] = await res.json();

  if (!res.ok) {
    const msg = typeof (json as { message?: string }).message === 'string'
      ? (json as { message: string }).message
      : `Request failed: ${res.status}`;
    throw new Error(msg);
  }

  if (Array.isArray(json)) return json;
  const data = (json as ListResponse).data ?? (json as ListResponse).items ?? [];
  return data;
}

/**
 * GET /api/executer/:id
 */
export async function fetchExecuter(id: string): Promise<ExecuterItem | null> {
  const res = await fetch(executerUrl(encodeURIComponent(id)), { method: 'GET', headers: executerHeaders() });
  const json: SingleResponse = await res.json();

  if (!res.ok) {
    const msg = typeof json.message === 'string' ? json.message : `Request failed: ${res.status}`;
    throw new Error(msg);
  }

  return json.data ?? null;
}

export interface CreateExecuterBody {
  full_name?: string;
  username?: string;
  phone_number?: string;
  password?: string;
  role?: string;
}

/**
 * POST /api/executer
 */
export async function createExecuter(body: CreateExecuterBody): Promise<ExecuterItem> {
  const res = await fetch(executerUrl(), {
    method: 'POST',
    headers: executerHeaders(),
    body: JSON.stringify(body),
  });

  const json = (await res.json()) as SingleResponse & ExecuterItem;

  if (!res.ok) {
    const msg = typeof json.message === 'string' ? json.message : `Request failed: ${res.status}`;
    throw new Error(msg);
  }

  if (json.data) return json.data;
  if (json.id && typeof json.id === 'string') return json as ExecuterItem;
  return {
    id: '',
    full_name: body.full_name ?? null,
    username: body.username ?? null,
    phone_number: body.phone_number ?? null,
    image: null,
    created_at: '',
    updated_at: '',
    is_active: true,
    role: body.role ?? 'USER',
  };
}

export interface UpdateExecuterBody {
  full_name?: string;
  username?: string;
  phone_number?: string;
  password?: string;
  role?: string;
}

/**
 * PATCH /api/executer/:id
 */
export async function updateExecuter(id: string, body: UpdateExecuterBody): Promise<ExecuterItem> {
  const res = await fetch(executerUrl(encodeURIComponent(id)), {
    method: 'PATCH',
    headers: executerHeaders(),
    body: JSON.stringify(body),
  });

  const json = (await res.json()) as SingleResponse & ExecuterItem;

  if (!res.ok) {
    const msg = typeof json.message === 'string' ? json.message : `Request failed: ${res.status}`;
    throw new Error(msg);
  }

  if (json.data) return json.data;
  if (json.id && typeof json.id === 'string') return json as ExecuterItem;
  return {
    id,
    full_name: body.full_name ?? null,
    username: body.username ?? null,
    phone_number: body.phone_number ?? null,
    image: null,
    created_at: '',
    updated_at: '',
    is_active: true,
    role: body.role ?? 'USER',
  };
}

/**
 * DELETE /api/executer/:id
 */
export async function deleteExecuter(id: string): Promise<void> {
  const res = await fetch(executerUrl(encodeURIComponent(id)), {
    method: 'DELETE',
    headers: executerHeaders(),
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
