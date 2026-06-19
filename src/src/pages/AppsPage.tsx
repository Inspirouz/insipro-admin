import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { fetchProjects, fetchProjectsStats, toggleProjectStatus } from '../lib/api/projectsApi';
import type { ProjectScreenStats } from '../lib/api/projectsApi';
import { fetchCategories } from '../lib/api/categoriesApi';
import type { App } from '../lib/types';
import type { CategoryItem } from '../lib/api/categoriesApi';
import { PageHeader } from '../components/PageHeader';
import { SearchInput } from '../components/SearchInput';

const SEARCH_DEBOUNCE_MS = 300;
type StatusFilter = 'all' | 'active' | 'draft';

const VIDEO_EXTS = /\.(mp4|webm|mov|ogg)(\?.*)?$/i;
function isVideoUrl(url: string): boolean {
  if (!url) return false;
  if (/\/video__[^/]+$/i.test(url)) return true;
  return VIDEO_EXTS.test(url);
}

export function AppsPage() {
  const [apps, setApps] = useState<App[]>([]);
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [toggling, setToggling] = useState<string | null>(null);
  const [stats, setStats] = useState<Record<string, ProjectScreenStats>>({});

  useEffect(() => {
    fetchCategories().then(setCategories).catch(() => setCategories([]));
    fetchProjectsStats().then(setStats).catch(() => {});
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    const delay = search === '' ? 0 : SEARCH_DEBOUNCE_MS;
    const t = setTimeout(() => {
      fetchProjects(search)
        .then((data) => { if (!cancelled) setApps(data); })
        .catch((err) => { if (!cancelled) { console.error('Failed to load projects:', err); setApps([]); } })
        .finally(() => { if (!cancelled) setLoading(false); });
    }, delay);
    return () => { cancelled = true; clearTimeout(t); };
  }, [search]);

  const getCategoryName = (categoryId: string) => {
    return categories.find(c => c.id === categoryId)?.name || 'Без категории';
  };

  const handleToggleStatus = async (e: React.MouseEvent, app: App) => {
    e.preventDefault();
    e.stopPropagation();
    if (toggling === app.id) return;
    setToggling(app.id);
    try {
      await toggleProjectStatus(app.id, !app.isActive);
      setApps(prev => prev.map(a => a.id === app.id ? { ...a, isActive: !a.isActive } : a));
    } catch (err) {
      console.error('Failed to toggle status:', err);
    } finally {
      setToggling(null);
    }
  };

  const filteredApps = apps.filter(app => {
    if (statusFilter === 'active') return app.isActive;
    if (statusFilter === 'draft') return !app.isActive;
    return true;
  });

  const counts = {
    all: apps.length,
    active: apps.filter(a => a.isActive).length,
    draft: apps.filter(a => !a.isActive).length,
  };

  const filterTabs: { key: StatusFilter; label: string }[] = [
    { key: 'all', label: 'Все' },
    { key: 'active', label: 'В проде' },
    { key: 'draft', label: 'Черновик' },
  ];

  return (
    <div className="p-8">
      <PageHeader
        title="Приложения"
        actions={
          <Link
            to="/apps/new"
            className="flex items-center gap-2 px-4 py-2.5 bg-white text-black font-medium rounded-lg hover:bg-gray-100 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Добавить
          </Link>
        }
      />

      <div className="mb-4">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Поиск приложений..."
        />
      </div>

      {/* Status filter tabs */}
      <div className="flex gap-2 mb-6">
        {filterTabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setStatusFilter(tab.key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
              statusFilter === tab.key
                ? 'bg-white text-black'
                : 'bg-bg-secondary text-text-secondary hover:text-white border border-border'
            }`}
          >
            {tab.label}
            <span className={`text-xs px-1.5 py-0.5 rounded-md ${
              statusFilter === tab.key ? 'bg-black/10 text-black' : 'bg-bg-tertiary text-text-tertiary'
            }`}>
              {counts[tab.key]}
            </span>
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-12 text-text-secondary">Загрузка...</div>
      ) : filteredApps.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-text-secondary mb-4">Приложения не найдены</p>
          <Link
            to="/apps/new"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-white text-black font-medium rounded-lg hover:bg-gray-100 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Добавить первое приложение
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredApps.map((app) => (
            <Link
              key={app.id}
              to={`/apps/${app.id}`}
              className="group bg-bg-secondary border border-border rounded-xl overflow-hidden hover:border-border-hover transition-all hover:shadow-soft relative"
            >
              {/* Status badge */}
              <div className="absolute top-3 left-3 z-10">
                <span className={`px-2 py-1 rounded-md text-xs font-semibold ${
                  app.isActive
                    ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                    : 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                }`}>
                  {app.isActive ? 'В проде' : 'Черновик'}
                </span>
              </div>

              <div className="aspect-video bg-bg-tertiary relative overflow-hidden">
                {(app.previewUrls[0] || app.iconUrl) ? (
                  isVideoUrl(app.previewUrls[0] || '') ? (
                    <video
                      src={app.previewUrls[0]}
                      className="w-full h-full object-cover"
                      autoPlay
                      muted
                      loop
                      playsInline
                    />
                  ) : (
                    <img
                      src={app.previewUrls[0] || app.iconUrl || ''}
                      alt={app.name}
                      className="w-full h-full object-cover"
                    />
                  )
                ) : (
                  <div className="flex items-center justify-center h-full text-text-tertiary">
                    Нет превью
                  </div>
                )}
              </div>

              <div className="p-4">
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0 bg-bg-tertiary">
                    {app.iconUrl ? (
                      <img src={app.iconUrl} alt={app.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xs text-text-tertiary">
                        {app.name[0]}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium mb-1 truncate group-hover:text-lime transition-colors">
                      {app.name}
                    </h3>
                    <p className="text-xs text-text-secondary">{getCategoryName(app.categoryId)}</p>
                  </div>
                </div>

                {/* Stats chips */}
                {stats[app.id] && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '10px' }}>
                    {([
                      { label: 'Экр', value: stats[app.id].screens, bg: 'rgba(59,130,246,0.15)', border: 'rgba(59,130,246,0.35)', color: '#60a5fa' },
                      { label: 'Сцен', value: stats[app.id].scenarios, bg: 'rgba(168,85,247,0.15)', border: 'rgba(168,85,247,0.35)', color: '#c084fc' },
                      { label: 'Пат', value: stats[app.id].patterns, bg: 'rgba(16,185,129,0.15)', border: 'rgba(16,185,129,0.35)', color: '#34d399' },
                      { label: 'UI', value: stats[app.id].ui_elements, bg: 'rgba(249,115,22,0.15)', border: 'rgba(249,115,22,0.35)', color: '#fb923c' },
                    ] as const).map(({ label, value, bg, border, color }) => (
                      <span key={label} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '2px 7px', borderRadius: '5px', border: `1px solid ${border}`, background: bg, fontSize: '11px', fontWeight: 500, color, whiteSpace: 'nowrap' }}>
                        {label} <b style={{ fontWeight: 700 }}>{value}</b>
                      </span>
                    ))}
                  </div>
                )}

                <div className="flex items-center justify-between gap-2 mt-3">
                  <div className="flex gap-2">
                    {app.platforms.map((platform) => (
                      <span
                        key={platform}
                        className="px-2 py-1 bg-bg-tertiary text-xs rounded-md text-text-secondary uppercase"
                      >
                        {platform}
                      </span>
                    ))}
                  </div>

                  {/* Toggle button */}
                  <button
                    onClick={(e) => handleToggleStatus(e, app)}
                    disabled={toggling === app.id}
                    className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border ${
                      app.isActive
                        ? 'border-red-500/30 text-red-400 hover:bg-red-500/10'
                        : 'border-green-500/30 text-green-400 hover:bg-green-500/10'
                    } disabled:opacity-50`}
                  >
                    {toggling === app.id
                      ? '...'
                      : app.isActive ? 'Снять' : 'Опубл.'}
                  </button>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
