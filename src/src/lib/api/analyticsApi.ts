import { authedFetch } from '../auth';

const getApiBase = (): string => {
  try {
    const env = (import.meta as { env?: { VITE_API_URL?: string } }).env;
    return env?.VITE_API_URL ?? '';
  } catch {
    return '';
  }
};

function url(path: string): string {
  const base = getApiBase();
  const full = base ? `/admin/analytics${path}` : `/api/admin/analytics${path}`;
  return base ? `${base.replace(/\/$/, '')}${full}` : full;
}

async function get<T>(path: string): Promise<T> {
  const res = await authedFetch(url(path), { method: 'GET' });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = (json as { message?: string })?.message ?? `Request failed: ${res.status}`;
    throw new Error(msg);
  }
  return json as T;
}

export type RangeDays = 7 | 30 | 90;

export interface OverviewResponse {
  days: number;
  series: Array<{ day: string; views: number; uniques: number }>;
  totals: { total_views: number; unique_sessions: number; total_events: number };
}

export interface TopPattern {
  pattern_id: string;
  name: string | null;
  views: number;
  uniques: number;
}

export interface SearchRow {
  query: string;
  count: number;
  avg_results: number | null;
  zero_count: number;
}

export interface TopTag {
  tag_id: string;
  tag_name: string | null;
  group_name: string | null;
  clicks: number;
}

export interface FunnelStage {
  stage: string;
  sessions: number;
}

export const analyticsApi = {
  overview: (days: RangeDays) => get<OverviewResponse>(`/overview?days=${days}`),
  topPatterns: (days: RangeDays, limit = 10) =>
    get<TopPattern[]>(`/top-patterns?days=${days}&limit=${limit}`),
  searches: (days: RangeDays, zeroOnly = false, limit = 50) =>
    get<SearchRow[]>(`/searches?days=${days}&limit=${limit}${zeroOnly ? '&zeroOnly=true' : ''}`),
  topTags: (days: RangeDays, limit = 20) =>
    get<TopTag[]>(`/top-tags?days=${days}&limit=${limit}`),
  funnel: (days: RangeDays) => get<FunnelStage[]>(`/funnel?days=${days}`),
};
