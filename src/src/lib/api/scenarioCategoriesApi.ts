import { getToken, handleUnauthorizedStatus } from '../auth';

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
  tag_id?: string;
  sort_order?: number;
  parent_id?: string | null;
  scenarios_count?: number;
  is_active?: boolean;
  is_deleted?: boolean;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;
}

/** Project-scoped GET response item: data.items[] with tag, parent_id, children */
interface ApiScenarioCategoryProjectItem {
  id: string;
  tag_id?: string;
  project_id?: string;
  parent_id?: string | null;
  parent?: unknown;
  children?: ApiScenarioCategoryProjectItem[];
  tag?: { id?: string; name?: string; type?: string };
  project?: unknown;
  scenarios_count?: number;
  [key: string]: unknown;
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
    items?: ScenarioCategoryItem[] | ApiScenarioCategoryProjectItem[];
    total?: number;
  };
  message?: string;
}

function mapProjectItemToCategory(item: ApiScenarioCategoryProjectItem): ScenarioCategoryItem {
  return {
    id: item.id,
    name: (item.tag && typeof item.tag.name === 'string') ? item.tag.name : '',
    tag_id: typeof item.tag_id === 'string' ? item.tag_id : undefined,
    parent_id: item.parent_id ?? null,
    scenarios_count: typeof item.scenarios_count === 'number' ? item.scenarios_count : undefined,
  };
}

function isProjectScopedItem(item: unknown): item is ApiScenarioCategoryProjectItem {
  return (
    typeof item === 'object' &&
    item !== null &&
    'id' in item &&
    ('tag' in item || 'tag_id' in item)
  );
}

/**
 * GET /api/admin/scenarios-categories
 * @param search optional search
 * @param projectId optional project_id for filtering by project (returns data.items with tag, parent_id, children)
 */
export async function fetchScenarioCategories(
  search?: string,
  projectId?: string,
): Promise<ScenarioCategoryItem[]> {
  const baseUrl = scenariosCategoriesUrl();
  const params = new URLSearchParams();
  if (search && search.trim()) params.set('search', search.trim());
  if (projectId) params.set('project_id', projectId);
  const query = params.toString();
  const url = query ? `${baseUrl}?${query}` : baseUrl;

  const res = await fetch(url, { method: 'GET', headers: headers() });
  handleUnauthorizedStatus(res.status);
  const json: ListResponse | ScenarioCategoryItem[] = await res.json();

  if (!res.ok) {
    const msg = typeof (json as { message?: string }).message === 'string'
      ? (json as { message: string }).message
      : `Request failed: ${res.status}`;
    throw new Error(msg);
  }

  const list = json as ListResponse;
  const rawItems = Array.isArray(json)
    ? json
    : Array.isArray(list.data)
      ? list.data
      : list.data?.items ?? [];

  if (rawItems.length > 0 && isProjectScopedItem(rawItems[0])) {
    return (rawItems as ApiScenarioCategoryProjectItem[]).map(mapProjectItemToCategory);
  }
  return rawItems as ScenarioCategoryItem[];
}

/**
 * POST /api/admin/scenarios-categories (project-scoped: link tag to project)
 * Body: { tag_id, project_id, parent_id? }
 */
export async function createProjectScenarioCategory(
  projectId: string,
  tagId: string,
  tagParentId?: string | null,
): Promise<ScenarioCategoryItem> {
  const res = await fetch(scenariosCategoriesUrl(), {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({
      tag_id: tagId,
      project_id: projectId,
      ...(tagParentId ? { parent_id: tagParentId } : {}),
    }),
  });

  const json = (await res.json()) as { data?: ScenarioCategoryItem; message?: string } & ScenarioCategoryItem;

  if (!res.ok) {
    const msg = typeof json.message === 'string' ? json.message : `Request failed: ${res.status}`;
    throw new Error(msg);
  }

  const item = json.data ?? (json.id ? (json as ScenarioCategoryItem) : null);
  if (item) return item;
  return { id: '', name: '', parent_id: tagParentId ?? null };
}

/**
 * POST /api/admin/scenarios-categories (legacy: name + sort_order + parent_id)
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
 * PATCH /api/admin/scenarios-categories/:id (project-scoped: update tag_id)
 * Body: { tag_id: "uuid" }
 */
export async function updateProjectScenarioCategory(
  id: string,
  tagId: string,
): Promise<ScenarioCategoryItem> {
  const res = await fetch(scenariosCategoriesUrl(encodeURIComponent(id)), {
    method: 'PATCH',
    headers: headers(),
    body: JSON.stringify({ tag_id: tagId.trim() }),
  });

  handleUnauthorizedStatus(res.status);
  const json = (await res.json()) as { data?: ScenarioCategoryItem; message?: string } & ScenarioCategoryItem;

  if (!res.ok) {
    const msg = typeof json.message === 'string' ? json.message : `Request failed: ${res.status}`;
    throw new Error(msg);
  }

  const item = json.data ?? (json.id ? (json as ScenarioCategoryItem) : null);
  if (item) return item;
  return { id, name: '' };
}

/**
 * PATCH /api/admin/scenarios-categories/:id (legacy: name, sort_order, parent_id)
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

  handleUnauthorizedStatus(res.status);
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

  handleUnauthorizedStatus(res.status);
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

