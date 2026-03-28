import { getToken } from '../auth';
import type { App } from '../types';

const getApiBase = (): string => {
  try {
    const env = (import.meta as { env?: { VITE_API_URL?: string } }).env;
    return env?.VITE_API_URL ?? '';
  } catch {
    return '';
  }
};

const getProjectImageBase = (): string => {
  try {
    const env = (import.meta as { env?: { VITE_API_URL?: string } }).env;
    const apiBase = (env?.VITE_API_URL ?? '').trim();
    if (apiBase) {
      // Example: https://dev.api.inspiro.uz/api -> https://dev.api.inspiro.uz/images
      const urlWithoutTrailingSlash = apiBase.replace(/\/+$/, '');
      const withoutApiSuffix = urlWithoutTrailingSlash.replace(/\/api$/, '');
      const originBase = withoutApiSuffix || urlWithoutTrailingSlash;
      const normalizedOrigin = originBase.replace(/\/+$/, '');
      return `${normalizedOrigin}/images`;
    }
    return 'https://dev.api.inspiro.uz/images';
  } catch {
    return 'https://dev.api.inspiro.uz/images';
  }
};

/** Full URL for a project image. Use for logo and preview images. */
export function getProjectImageUrl(path: string | null | undefined): string {
  if (!path || typeof path !== 'string') return '';
  const trimmed = path.trim();
  if (!trimmed) return '';
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return trimmed;
  // Handle malformed URLs with single slash (e.g. "https:/example.com/...")
  if (/^https?:\/[^/]/.test(trimmed)) return trimmed.replace(/^(https?:)\/([^/])/, '$1//$2');
  const base = getProjectImageBase().replace(/\/$/, '');
  return `${base}/${trimmed.replace(/^\//, '')}`;
}

/** API category object inside project */
interface ApiCategory {
  id: string;
  name?: string;
  [key: string]: unknown;
}

/** API image object inside project */
interface ApiImage {
  id?: string;
  path: string;
  file_name?: string;
  [key: string]: unknown;
}

/** Raw project item from API (data.items[]) */
interface ApiProjectItem {
  id: string;
  name?: string;
  description?: string;
  platforms?: string[];
  logo?: string | null;
  categories?: ApiCategory[];
  images?: ApiImage[];
  created_at?: string;
  [key: string]: unknown;
}

/** Full API response: { success, data: { items, total, page, page_size }, status_code, message } */
export interface ProjectsApiResponse {
  success?: boolean;
  status_code?: number;
  message?: string;
  data?: {
    items?: ApiProjectItem[];
    total?: number;
    page?: number;
    page_size?: number;
  };
}

const PLATFORM_MAP: Record<string, 'ios' | 'android' | 'web'> = {
  ios: 'ios',
  IOS: 'ios',
  android: 'android',
  Android: 'android',
  web: 'web',
  Web: 'web',
};

function mapProject(p: ApiProjectItem): App {
  const id = typeof p.id === 'string' ? p.id : '';
  const name = typeof p.name === 'string' ? p.name : '';
  const description = typeof p.description === 'string' ? p.description : '';
  const iconUrl = getProjectImageUrl(p.logo);

  const previewUrls = Array.isArray(p.images)
    ? p.images
        .map((img) => getProjectImageUrl(typeof img.path === 'string' ? img.path : ''))
        .filter(Boolean)
    : [];

  const categoryId = Array.isArray(p.categories) && p.categories.length > 0 && p.categories[0]?.id
    ? p.categories[0].id
    : '';

  const platformsRaw = Array.isArray(p.platforms) ? p.platforms : [];
  const platforms = platformsRaw
    .map((x) => PLATFORM_MAP[String(x)])
    .filter((x): x is 'ios' | 'android' | 'web' => x != null);

  const createdAt = p.created_at;
  const date = typeof createdAt === 'string' ? new Date(createdAt) : new Date();

  return {
    id,
    name,
    description,
    iconUrl,
    previewUrls,
    categoryId,
    platforms,
    createdAt: date,
  };
}

/**
 * GET /api/admin/projects?search=search_value
 * Base URL (VITE_API_URL) may already include /api, so we use /admin/projects when base is set.
 */
export async function fetchProjects(search?: string): Promise<App[]> {
  const base = getApiBase();
  const path = base ? '/admin/projects' : '/api/admin/projects';
  const url = base ? `${base.replace(/\/$/, '')}${path}` : path;
  const params = new URLSearchParams();
  if (search && search.trim()) params.set('search', search.trim());
  const query = params.toString();
  const fullUrl = query ? `${url}?${query}` : url;

  const token = getToken();
  const headers: HeadersInit = { 'Content-Type': 'application/json' };
  if (token) (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;

  const res = await fetch(fullUrl, { method: 'GET', headers });
  const json: ProjectsApiResponse = await res.json();

  if (!res.ok) {
    const msg = typeof json.message === 'string' ? json.message : `Request failed: ${res.status}`;
    throw new Error(msg);
  }

  const items = json.data?.items ?? [];
  return items.map(mapProject);
}

/** Single project API response: { success, data: <project>, status_code, message } */
interface ProjectDetailApiResponse {
  success?: boolean;
  status_code?: number;
  message?: string;
  data?: ApiProjectItem;
}

/**
 * GET /api/admin/projects/{id}
 */
export async function fetchProject(id: string): Promise<App | null> {
  const base = getApiBase();
  const path = base ? '/admin/projects' : '/api/admin/projects';
  const url = base ? `${base.replace(/\/$/, '')}${path}` : path;
  const fullUrl = `${url}/${encodeURIComponent(id)}`;

  const token = getToken();
  const headers: HeadersInit = { 'Content-Type': 'application/json' };
  if (token) (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;

  const res = await fetch(fullUrl, { method: 'GET', headers });
  const json: ProjectDetailApiResponse = await res.json();

  if (!res.ok) {
    const msg = typeof json.message === 'string' ? json.message : `Request failed: ${res.status}`;
    throw new Error(msg);
  }

  const item = json.data;
  if (!item) return null;
  return mapProject(item);
}

/** Create project request body */
export interface CreateProjectBody {
  name: string;
  description: string;
  logo?: string | null;
  images?: string[];
  platforms: string[];
  categoryIds: string[];
}

/**
 * POST /api/admin/projects
 */
export async function createProject(body: CreateProjectBody): Promise<App> {
  const base = getApiBase();
  const path = base ? '/admin/projects' : '/api/admin/projects';
  const url = base ? `${base.replace(/\/$/, '')}${path}` : path;

  const token = getToken();
  const headers: HeadersInit = { 'Content-Type': 'application/json' };
  if (token) (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;

  const res = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      name: body.name,
      description: body.description,
      logo: body.logo || null,
      images: body.images ?? [],
      platforms: body.platforms,
      categoryIds: body.categoryIds,
    }),
  });

  const json: ProjectDetailApiResponse = await res.json();

  if (!res.ok) {
    const msg = typeof json.message === 'string' ? json.message : `Request failed: ${res.status}`;
    throw new Error(msg);
  }

  const item = json.data;
  if (!item) throw new Error('No project data in response');
  return mapProject(item);
}

/** Update project request body (same shape as create) */
export interface UpdateProjectBody {
  name: string;
  description: string;
  logo?: string | null;
  images?: string[];
  platforms: string[];
  categoryIds: string[];
}

/**
 * PATCH /api/admin/projects/{id}
 */
export async function updateProject(id: string, body: UpdateProjectBody): Promise<App> {
  const base = getApiBase();
  const path = base ? '/admin/projects' : '/api/admin/projects';
  const url = base ? `${base.replace(/\/$/, '')}${path}` : path;
  const fullUrl = `${url}/${encodeURIComponent(id)}`;

  const token = getToken();
  const headers: HeadersInit = { 'Content-Type': 'application/json' };
  if (token) (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;

  const res = await fetch(fullUrl, {
    method: 'PATCH',
    headers,
    body: JSON.stringify({
      name: body.name,
      description: body.description,
      logo: body.logo || null,
      images: body.images ?? [],
      platforms: body.platforms,
      categoryIds: body.categoryIds,
    }),
  });

  const json: ProjectDetailApiResponse = await res.json();

  if (!res.ok) {
    const msg = typeof json.message === 'string' ? json.message : `Request failed: ${res.status}`;
    throw new Error(msg);
  }

  const item = json.data;
  if (!item) throw new Error('No project data in response');
  return mapProject(item);
}

/**
 * DELETE /api/admin/projects/{id}
 */
export async function deleteProject(id: string): Promise<void> {
  const base = getApiBase();
  const path = base ? '/admin/projects' : '/api/admin/projects';
  const url = base ? `${base.replace(/\/$/, '')}${path}` : path;
  const fullUrl = `${url}/${encodeURIComponent(id)}`;

  const token = getToken();
  const headers: HeadersInit = { 'Content-Type': 'application/json' };
  if (token) (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;

  const res = await fetch(fullUrl, { method: 'DELETE', headers });

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
