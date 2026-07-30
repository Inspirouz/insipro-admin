import { authedFetch } from '../auth';
import { getProjectImageUrl } from './projectsApi';

const getApiBase = (): string => {
  try {
    const env = (import.meta as { env?: { VITE_API_URL?: string } }).env;
    return env?.VITE_API_URL ?? '';
  } catch {
    return '';
  }
};

function collectionsUrl(): string {
  const base = getApiBase();
  const path = base ? '/admin/collections' : '/api/admin/collections';
  return base ? `${base.replace(/\/$/, '')}${path}` : path;
}

type UnknownRecord = Record<string, unknown>;

interface ApiCollectionItem extends UnknownRecord {
  id?: unknown;
  name?: unknown;
  title?: unknown;
  created_at?: unknown;
  createdAt?: unknown;
  screens_count?: unknown;
  screen_count?: unknown;
  screens?: unknown;
  saved_screens?: unknown;
  collection_screens?: unknown;
  user?: unknown;
  owner?: unknown;
  user_id?: unknown;
  owner_id?: unknown;
  user_email?: unknown;
  owner_email?: unknown;
}

export interface AdminCollection {
  id: string;
  name: string;
  createdAt: Date | null;
  screensCount: number;
  previewUrls: string[];
  owner: {
    id: string;
    name: string;
    email: string;
  };
}

function asRecord(value: unknown): UnknownRecord | null {
  return value != null && typeof value === 'object' && !Array.isArray(value)
    ? value as UnknownRecord
    : null;
}

function stringValue(...values: unknown[]): string {
  const value = values.find((item) => typeof item === 'string' && item.trim());
  return typeof value === 'string' ? value.trim() : '';
}

function numberValue(...values: unknown[]): number | null {
  for (const value of values) {
    if (typeof value === 'number' && Number.isFinite(value)) return value;
    if (typeof value === 'string' && value.trim() && Number.isFinite(Number(value))) {
      return Number(value);
    }
  }
  return null;
}

function extractList(payload: unknown): ApiCollectionItem[] {
  if (Array.isArray(payload)) return payload.filter((item): item is ApiCollectionItem => asRecord(item) !== null);

  const record = asRecord(payload);
  if (!record) return [];

  const directCandidates = [record.collections, record.items];
  for (const candidate of directCandidates) {
    if (Array.isArray(candidate)) {
      return candidate.filter((item): item is ApiCollectionItem => asRecord(item) !== null);
    }
  }

  if (record.data !== undefined) return extractList(record.data);
  return [];
}

function extractScreens(item: ApiCollectionItem): unknown[] {
  const candidates = [item.screens, item.saved_screens, item.collection_screens];
  for (const candidate of candidates) {
    if (Array.isArray(candidate)) return candidate;
    const record = asRecord(candidate);
    if (record && Array.isArray(record.items)) return record.items;
  }
  return [];
}

function screenImageUrl(value: unknown): string {
  if (typeof value === 'string') return getProjectImageUrl(value);
  const record = asRecord(value);
  if (!record) return '';

  const nestedScreen = asRecord(record.screen);
  const image = asRecord(record.image);
  const nestedImage = nestedScreen ? asRecord(nestedScreen.image) : null;
  const images = Array.isArray(record.images)
    ? record.images
    : nestedScreen && Array.isArray(nestedScreen.images)
      ? nestedScreen.images
      : [];
  const firstImage = images.length > 0 ? asRecord(images[0]) : null;

  const raw = stringValue(
    record.image_url,
    record.imageUrl,
    record.url,
    record.path,
    typeof record.image === 'string' ? record.image : undefined,
    image?.url,
    image?.path,
    nestedScreen?.image_url,
    nestedScreen?.imageUrl,
    typeof nestedScreen?.image === 'string' ? nestedScreen.image : undefined,
    nestedImage?.url,
    nestedImage?.path,
    firstImage?.url,
    firstImage?.path,
  );

  return getProjectImageUrl(raw);
}

function mapCollection(item: ApiCollectionItem, index: number): AdminCollection {
  const owner = asRecord(item.user) ?? asRecord(item.owner);
  const screens = extractScreens(item);
  const rawDate = stringValue(item.created_at, item.createdAt);
  const createdAt = rawDate ? new Date(rawDate) : null;

  return {
    id: stringValue(item.id) || `collection-${index}`,
    name: stringValue(item.name, item.title) || 'Без названия',
    createdAt: createdAt && !Number.isNaN(createdAt.getTime()) ? createdAt : null,
    screensCount: numberValue(
      item.screens_count,
      item.screen_count,
      item.count,
      item.items_count,
    ) ?? screens.length,
    previewUrls: screens.map(screenImageUrl).filter(Boolean).slice(0, 4),
    owner: {
      id: stringValue(owner?.id, item.user_id, item.owner_id),
      name: stringValue(owner?.full_name, owner?.name, item.user_name, item.owner_name),
      email: stringValue(owner?.email, item.user_email, item.owner_email),
    },
  };
}

export async function fetchAdminCollections(): Promise<AdminCollection[]> {
  const res = await authedFetch(collectionsUrl(), { method: 'GET' });
  const payload = await res.json().catch(() => null) as unknown;

  if (!res.ok) {
    const record = asRecord(payload);
    const message = stringValue(record?.message, record?.error);
    throw new Error(message || `Не удалось загрузить коллекции (${res.status})`);
  }

  return extractList(payload).map(mapCollection);
}
