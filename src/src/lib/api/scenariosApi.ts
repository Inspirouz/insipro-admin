import { getToken, handleUnauthorizedStatus } from '../auth';
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
  handleUnauthorizedStatus(res.status);
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

/** Image from scenario response */
export interface ScenarioImage {
  id: string;
  path?: string;
  file_name?: string;
  [key: string]: unknown;
}

/** Scenario item inside category (has images) */
export interface ScenarioWithImages {
  id: string;
  scenario_category_id?: string;
  images?: ScenarioImage[];
  [key: string]: unknown;
}

/** Category item from GET ?project_id= (has tag.name and scenarios[]) */
export interface ScenarioCategoryWithScenarios {
  id: string;
  tag_id?: string;
  project_id?: string;
  parent_id?: string | null;
  tag?: { id?: string; name?: string; type?: string };
  scenarios?: ScenarioWithImages[];
  [key: string]: unknown;
}

/**
 * GET /api/admin/scenarios?project_id=<projectId>
 * Returns data[]: each item has tag.name (title) and scenarios[].images (flatten for display).
 */
export async function fetchAdminScenariosByProject(
  projectId: string
): Promise<ScenarioCategoryWithScenarios[]> {
  const baseUrl = scenariosUrl();
  const params = new URLSearchParams();
  params.set('project_id', projectId);
  const url = `${baseUrl}?${params.toString()}`;

  const res = await fetch(url, { method: 'GET', headers: headers() });
  handleUnauthorizedStatus(res.status);
  const json: { success?: boolean; data?: unknown; message?: string } = await res.json();

  if (!res.ok) {
    const msg = typeof json?.message === 'string' ? json.message : `Request failed: ${res.status}`;
    throw new Error(msg);
  }

  const data = json.data;
  const raw: ScenarioCategoryWithScenarios[] = Array.isArray(data) ? data : [];
  return raw;
}

export interface CreateScenarioBody {
  project_id: string;
  scenario_category_id: string;
  imageIds: string[];
}

/**
 * POST /api/admin/scenarios
 */
export async function createScenario(body: CreateScenarioBody): Promise<ScenarioItem> {
  const url = scenariosUrl();
  const res = await fetch(url, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify(body),
  });
  handleUnauthorizedStatus(res.status);
  const json = await res.json();
  if (!res.ok) {
    const msg = typeof json?.message === 'string' ? json.message : `Request failed: ${res.status}`;
    throw new Error(msg);
  }
  const data = json?.data ?? json;
  return {
    id: data?.id ?? '',
    name: data?.name ?? '',
    parent_id: data?.parent_id ?? null,
    ...data,
  };
}

