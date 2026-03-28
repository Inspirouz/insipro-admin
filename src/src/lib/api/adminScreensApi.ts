import { getToken } from '../auth';
import { getProjectImageUrl } from './projectsApi';
import type { Screen } from '../types';

const getApiBase = (): string => {
  try {
    const env = (import.meta as { env?: { VITE_API_URL?: string } }).env;
    return env?.VITE_API_URL ?? '';
  } catch {
    return '';
  }
};

export interface CreateAdminScreenBody {
  project_id: string;
  screens_category_id: string;
  imageIds: string[];
  senarys: string[];
  ui_elements: string[];
  patterns: string[];
}

function screensUrl(): string {
  const base = getApiBase();
  const path = base ? '/admin/screens' : '/api/admin/screens';
  return base ? `${base.replace(/\/$/, '')}${path}` : path;
}

function headers(): HeadersInit {
  const token = getToken();
  const h: HeadersInit = { 'Content-Type': 'application/json' };
  if (token) (h as Record<string, string>)['Authorization'] = `Bearer ${token}`;
  return h;
}

/** Raw screen item from GET /api/admin/screens */
interface ApiScreenItem {
  id: string;
  project_id?: string;
  screens_category_id?: string;
  image_url?: string;
  image?: string;
  images?: Array<{ url?: string; path?: string }>;
  image_ids?: string[];
  senarys?: Array<{ id: string }> | string[];
  ui_elements?: Array<{ id: string }> | string[];
  patterns?: Array<{ id: string }> | string[];
  created_at?: string;
  [key: string]: unknown;
}

interface ListResponse {
  success?: boolean;
  data?: ApiScreenItem[] | { items?: ApiScreenItem[]; total?: number };
  message?: string;
}

/**
 * GET /api/admin/screens?project_id=<id>
 */
export async function fetchAdminScreens(projectId: string): Promise<Screen[]> {
  const params = new URLSearchParams();
  params.set('projectId', projectId);
  const url = `${screensUrl()}?${params.toString()}`;
  const res = await fetch(url, { method: 'GET', headers: headers() });
  const json: ListResponse | ApiScreenItem[] = await res.json();

  if (!res.ok) {
    const msg = typeof (json as { message?: string }).message === 'string'
      ? (json as { message: string }).message
      : `Request failed: ${res.status}`;
    throw new Error(msg);
  }

  const list = json as ListResponse;
  let raw: ApiScreenItem[];
  if (Array.isArray(json)) {
    raw = json;
  } else if (Array.isArray(list.data)) {
    raw = list.data;
  } else {
    raw = (list.data as { items?: ApiScreenItem[] } | undefined)?.items ?? [];
  }

  return raw.map((s) => {
    const imageUrl =
      s.image_url ??
      s.image ??
      (Array.isArray(s.images) && s.images[0]
        ? (s.images[0].url ?? (s.images[0].path ? getProjectImageUrl(s.images[0].path) : ''))
        : '');
    const scenarioIds =
      Array.isArray(s.senarys)
        ? s.senarys
            .map((v) => (typeof v === 'string' ? v : v.id))
            .filter((v): v is string => typeof v === 'string' && !!v)
        : [];

    const uiElementIds =
      Array.isArray(s.ui_elements)
        ? s.ui_elements
            .map((v) => (typeof v === 'string' ? v : v.id))
            .filter((v): v is string => typeof v === 'string' && !!v)
        : [];

    const patternIds =
      Array.isArray(s.patterns)
        ? s.patterns
            .map((v) => (typeof v === 'string' ? v : v.id))
            .filter((v): v is string => typeof v === 'string' && !!v)
        : [];

    return {
      id: s.id,
      appId: projectId,
      imageUrl: typeof imageUrl === 'string' ? (imageUrl.startsWith('http') ? imageUrl : getProjectImageUrl(imageUrl)) : '',
      imageIds: Array.isArray(s.image_ids) ? s.image_ids : [],
      categoryId: s.screens_category_id ?? '',
      scenarioIds,
      uiElementIds,
      patternIds,
      createdAt: s.created_at ? new Date(s.created_at) : new Date(),
    };
  });
}

/**
 * GET /api/admin/screens/:id
 */
export async function fetchAdminScreen(id: string): Promise<Screen> {
  const url = `${screensUrl()}/${encodeURIComponent(id)}`;
  const res = await fetch(url, { method: 'GET', headers: headers() });
  const json = (await res.json()) as { data?: ApiScreenItem; message?: string } & ApiScreenItem;

  if (!res.ok) {
    const msg = typeof json.message === 'string' ? json.message : `Request failed: ${res.status}`;
    throw new Error(msg);
  }

  const s: ApiScreenItem = json.data ?? (json.id ? json : { id });
  const imageUrl =
    s.image_url ??
    s.image ??
    (Array.isArray(s.images) && s.images[0]
      ? (s.images[0].url ?? (s.images[0].path ? getProjectImageUrl(s.images[0].path) : ''))
      : '');

  const toIds = (arr: Array<{ id: string } | string> | undefined): string[] =>
    (arr ?? []).map((v) => (typeof v === 'string' ? v : v.id)).filter(Boolean);

  return {
    id: s.id,
    appId: s.project_id ?? '',
    imageUrl: typeof imageUrl === 'string' ? (imageUrl.startsWith('http') ? imageUrl : getProjectImageUrl(imageUrl)) : '',
    imageIds: Array.isArray(s.image_ids) ? s.image_ids : [],
    categoryId: s.screens_category_id ?? '',
    scenarioIds: toIds(s.senarys as Array<{ id: string } | string> | undefined),
    uiElementIds: toIds(s.ui_elements as Array<{ id: string } | string> | undefined),
    patternIds: toIds(s.patterns as Array<{ id: string } | string> | undefined),
    createdAt: s.created_at ? new Date(s.created_at) : new Date(),
  };
}

export interface UpdateAdminScreenBody {
  screens_category_id?: string;
  imageIds?: string[];
  senarys?: string[];
  ui_elements?: string[];
  patterns?: string[];
}

/**
 * PATCH /api/admin/screens/:id
 */
export async function updateAdminScreen(id: string, body: UpdateAdminScreenBody): Promise<void> {
  const url = `${screensUrl()}/${encodeURIComponent(id)}`;
  const res = await fetch(url, {
    method: 'PATCH',
    headers: headers(),
    body: JSON.stringify(body),
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

/**
 * DELETE /api/admin/screens/:id
 */
export async function deleteAdminScreen(id: string): Promise<void> {
  const url = `${screensUrl()}/${encodeURIComponent(id)}`;
  const res = await fetch(url, { method: 'DELETE', headers: headers() });

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

/**
 * POST /api/admin/screens
 */
export async function createAdminScreen(body: CreateAdminScreenBody): Promise<void> {
  const res = await fetch(screensUrl(), {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify(body),
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

