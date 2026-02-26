import { getToken } from '../auth';
import type { User, SubscriptionStatus } from '../types';

const getApiBase = (): string => {
  try {
    const env = (import.meta as { env?: { VITE_API_URL?: string } }).env;
    return env?.VITE_API_URL ?? '';
  } catch {
    return '';
  }
};

function adminUsersUrl(pathSuffix?: string): string {
  const base = getApiBase();
  const path = base ? '/admin/users' : '/api/admin/users';
  const url = base ? `${base.replace(/\/$/, '')}${path}` : path;
  return pathSuffix ? `${url}/${pathSuffix}` : url;
}

function adminUsersHeaders(): HeadersInit {
  const token = getToken();
  const headers: HeadersInit = { 'Content-Type': 'application/json' };
  if (token) (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
  return headers;
}

/** Raw item from GET /api/admin/users */
interface ApiUserItem {
  id: string;
  is_active?: boolean;
  is_deleted?: boolean;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;
  full_name?: string | null;
  role?: string;
  username?: string | null;
  phone_number?: string | null;
  email?: string | null;
  image?: string | null;
  subscription_status?: string;
  plan?: string;
  period_end?: string | null;
  [key: string]: unknown;
}

/** List response: array or { data: [...] } / { items: [...] } */
interface ListResponse {
  data?: ApiUserItem[];
  items?: ApiUserItem[];
}

const VALID_STATUSES: SubscriptionStatus[] = ['trial', 'active', 'past_due', 'canceled', 'expired'];

function normalizeSubscriptionStatus(raw?: string): SubscriptionStatus {
  if (!raw) return 'trial';
  const lower = raw.toLowerCase();
  return (VALID_STATUSES.includes(lower as SubscriptionStatus) ? lower : 'trial') as SubscriptionStatus;
}

function mapToUser(item: ApiUserItem): User {
  const createdAt = item.created_at ?? '';
  const periodEnd = item.period_end ?? undefined;
  return {
    id: item.id,
    email: item.email ?? '',
    name: item.full_name ?? undefined,
    subscriptionStatus: normalizeSubscriptionStatus(item.subscription_status),
    plan: item.plan,
    periodEnd: periodEnd ? new Date(periodEnd) : undefined,
    createdAt: typeof createdAt === 'string' ? new Date(createdAt) : (createdAt as unknown as Date),
  };
}

/**
 * GET /api/admin/users
 * @param params optional search query
 */
export async function fetchAdminUsers(params?: { search?: string; status?: string }): Promise<User[]> {
  const url = new URL(adminUsersUrl());
  if (params?.search) url.searchParams.set('search', params.search);
  if (params?.status) url.searchParams.set('status', params.status);

  const res = await fetch(url.toString(), { method: 'GET', headers: adminUsersHeaders() });
  const json: ListResponse | ApiUserItem[] = await res.json();

  if (!res.ok) {
    const msg = typeof (json as { message?: string }).message === 'string'
      ? (json as { message: string }).message
      : `Request failed: ${res.status}`;
    throw new Error(msg);
  }

  const raw = Array.isArray(json) ? json : (json as ListResponse).data ?? (json as ListResponse).items ?? [];
  return raw.map(mapToUser);
}

/**
 * PATCH /api/admin/users/:id
 */
export async function updateAdminUser(
  id: string,
  data: Partial<Pick<User, 'name' | 'subscriptionStatus' | 'plan' | 'periodEnd'>>
): Promise<User> {
  const body: Record<string, unknown> = {};
  if (data.name !== undefined) body.name = data.name;
  if (data.subscriptionStatus !== undefined) body.subscription_status = data.subscriptionStatus;
  if (data.plan !== undefined) body.plan = data.plan;
  if (data.periodEnd !== undefined) body.period_end = data.periodEnd instanceof Date ? data.periodEnd.toISOString() : data.periodEnd;

  const res = await fetch(adminUsersUrl(encodeURIComponent(id)), {
    method: 'PATCH',
    headers: adminUsersHeaders(),
    body: JSON.stringify(body),
  });

  const json = (await res.json()) as { data?: ApiUserItem; message?: string } & ApiUserItem;

  if (!res.ok) {
    const msg = typeof json.message === 'string' ? json.message : `Request failed: ${res.status}`;
    throw new Error(msg);
  }

  const item = json.data ?? (json.id ? (json as ApiUserItem) : null);
  if (item) return mapToUser(item);
  return mapToUser({
    id,
    email: '',
    full_name: data.name,
    subscription_status: data.subscriptionStatus ?? 'trial',
    created_at: new Date().toISOString(),
  });
}
