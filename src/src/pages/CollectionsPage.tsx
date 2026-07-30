import { useEffect, useMemo, useState } from 'react';
import {
  FolderHeart,
  Images,
  RefreshCw,
  SlidersHorizontal,
  UserRound,
} from 'lucide-react';
import {
  fetchAdminCollections,
  type AdminCollection,
} from '../lib/api/adminCollectionsApi';
import { SearchInput } from '../components/SearchInput';

type SortMode = 'newest' | 'largest';

const dateFormatter = new Intl.DateTimeFormat('ru-RU', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
});

function StatCard({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof FolderHeart;
  label: string;
  value: number;
}) {
  return (
    <div className="flex items-center gap-4 rounded-xl border border-border bg-bg-secondary p-5">
      <div
        className="flex h-10 w-10 items-center justify-center rounded-lg text-lime"
        style={{ backgroundColor: 'rgba(163, 230, 53, 0.1)' }}
      >
        <Icon className="h-5 w-5" aria-hidden="true" />
      </div>
      <div>
        <p className="text-2xl font-semibold tabular-nums text-white">{value}</p>
        <p className="text-xs text-text-secondary">{label}</p>
      </div>
    </div>
  );
}

function CollectionPreview({ collection }: { collection: AdminCollection }) {
  const previews = collection.previewUrls;

  if (previews.length === 0) {
    return (
      <div
        className="flex items-center justify-center bg-bg-tertiary text-text-tertiary"
        style={{ height: 176 }}
      >
        <div className="text-center">
          <Images className="mx-auto mb-2 h-7 w-7" aria-hidden="true" />
          <span className="text-xs">Нет превью</span>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-px overflow-hidden bg-border" style={{ height: 176 }}>
      {previews.map((url, index) => (
        <div
          key={`${url}-${index}`}
          className={`${previews.length === 1 ? 'col-span-2' : ''} ${
            previews.length === 3 && index === 0 ? 'row-span-2' : ''
          } min-h-0 overflow-hidden bg-bg-tertiary`}
        >
          <img
            src={url}
            alt=""
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          />
        </div>
      ))}
    </div>
  );
}

function CollectionCard({ collection }: { collection: AdminCollection }) {
  const ownerLabel = collection.owner.name || collection.owner.email || 'Неизвестный пользователь';
  const ownerDetail = collection.owner.name && collection.owner.email ? collection.owner.email : '';

  return (
    <article className="group overflow-hidden rounded-xl border border-border bg-bg-secondary transition-colors hover:border-border-hover">
      <CollectionPreview collection={collection} />
      <div className="p-5">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="truncate text-base font-semibold text-white" title={collection.name}>
              {collection.name}
            </h2>
            <p className="mt-1 text-xs text-text-tertiary">
              {collection.createdAt ? dateFormatter.format(collection.createdAt) : 'Дата не указана'}
            </p>
          </div>
          <span
            className="inline-flex shrink-0 items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium text-lime"
            style={{ backgroundColor: 'rgba(163, 230, 53, 0.1)' }}
          >
            <Images className="h-3.5 w-3.5" aria-hidden="true" />
            {collection.screensCount}
          </span>
        </div>

        <div className="flex items-center gap-3 border-t border-border pt-4">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-bg-tertiary text-text-secondary">
            <UserRound className="h-4 w-4" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm text-white" title={ownerLabel}>{ownerLabel}</p>
            {ownerDetail && (
              <p className="truncate text-xs text-text-tertiary" title={ownerDetail}>{ownerDetail}</p>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}

export function CollectionsPage() {
  const [collections, setCollections] = useState<AdminCollection[]>([]);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<SortMode>('newest');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadCollections = async () => {
    setLoading(true);
    setError(null);
    try {
      setCollections(await fetchAdminCollections());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось загрузить коллекции');
      setCollections([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadCollections();
  }, []);

  const filteredCollections = useMemo(() => {
    const query = search.trim().toLowerCase();
    const result = query
      ? collections.filter((collection) =>
          [collection.name, collection.owner.name, collection.owner.email]
            .some((value) => value.toLowerCase().includes(query)))
      : [...collections];

    return result.sort((a, b) => {
      if (sort === 'largest') return b.screensCount - a.screensCount;
      return (b.createdAt?.getTime() ?? 0) - (a.createdAt?.getTime() ?? 0);
    });
  }, [collections, search, sort]);

  const totalScreens = collections.reduce((sum, collection) => sum + collection.screensCount, 0);
  const uniqueOwners = new Set(
    collections
      .map((collection) => collection.owner.id || collection.owner.email)
      .filter(Boolean),
  ).size;

  return (
    <div className="mx-auto p-8" style={{ maxWidth: 1400 }}>
      <div className="mb-7 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-white">Коллекции пользователей</h1>
          <p className="mt-1 text-sm text-text-secondary">
            Что пользователи сохраняют и как организуют найденные экраны
          </p>
        </div>
        <button
          type="button"
          onClick={() => void loadCollections()}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-lg border border-border bg-bg-secondary px-4 py-2.5 text-sm font-medium text-white transition-colors hover:border-border-hover hover:bg-bg-tertiary disabled:cursor-wait disabled:opacity-60"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} aria-hidden="true" />
          Обновить
        </button>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
        <StatCard icon={FolderHeart} label="Всего коллекций" value={collections.length} />
        <StatCard icon={Images} label="Сохранённых экранов" value={totalScreens} />
        <StatCard icon={UserRound} label="Авторов коллекций" value={uniqueOwners} />
      </div>

      <div className="mb-6 flex flex-col gap-3 md:flex-row">
        <div className="flex-1">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Поиск по коллекции, имени или email..."
          />
        </div>
        <div className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-border bg-bg-secondary p-1">
          <SlidersHorizontal className="mx-2 h-4 w-4 text-text-tertiary" aria-hidden="true" />
          {([
            ['newest', 'Сначала новые'],
            ['largest', 'Больше экранов'],
          ] as const).map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => setSort(value)}
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                sort === value
                  ? 'bg-white text-black'
                  : 'text-text-secondary hover:text-white'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          <span>{error}</span>
          <button
            type="button"
            onClick={() => void loadCollections()}
            className="font-medium text-white underline decoration-red-300/50 underline-offset-4"
          >
            Повторить
          </button>
        </div>
      )}

      {loading && collections.length === 0 ? (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="overflow-hidden rounded-xl border border-border bg-bg-secondary">
              <div className="animate-pulse bg-bg-tertiary" style={{ height: 176 }} />
              <div className="space-y-3 p-5">
                <div className="h-5 w-2/3 animate-pulse rounded bg-bg-tertiary" />
                <div className="h-4 w-1/3 animate-pulse rounded bg-bg-tertiary" />
                <div className="mt-4 h-9 animate-pulse rounded bg-bg-tertiary" />
              </div>
            </div>
          ))}
        </div>
      ) : filteredCollections.length > 0 ? (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          {filteredCollections.map((collection) => (
            <CollectionCard key={collection.id} collection={collection} />
          ))}
        </div>
      ) : !error ? (
        <div className="rounded-xl border border-dashed border-border bg-bg-secondary px-6 py-16 text-center">
          <FolderHeart className="mx-auto mb-4 h-9 w-9 text-text-tertiary" aria-hidden="true" />
          <h2 className="text-base font-medium text-white">
            {search ? 'Ничего не найдено' : 'Коллекций пока нет'}
          </h2>
          <p className="mt-1 text-sm text-text-secondary">
            {search
              ? 'Попробуйте изменить поисковый запрос.'
              : 'Созданные пользователями коллекции появятся здесь.'}
          </p>
        </div>
      ) : null}
    </div>
  );
}
