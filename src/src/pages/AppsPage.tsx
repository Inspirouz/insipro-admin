import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { fetchProjects } from '../lib/api/projectsApi';
import { fetchCategories } from '../lib/api/categoriesApi';
import type { App } from '../lib/types';
import type { CategoryItem } from '../lib/api/categoriesApi';
import { PageHeader } from '../components/PageHeader';
import { SearchInput } from '../components/SearchInput';

const SEARCH_DEBOUNCE_MS = 300;

export function AppsPage() {
  const [apps, setApps] = useState<App[]>([]);
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCategories().then(setCategories).catch(() => setCategories([]));
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

  const filteredApps = apps;

  const getCategoryName = (categoryId: string) => {
    return categories.find(c => c.id === categoryId)?.name || 'Без категории';
  };

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

      <div className="mb-6">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Поиск приложений..."
        />
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
              className="group bg-bg-secondary border border-border rounded-xl overflow-hidden hover:border-border-hover transition-all hover:shadow-soft"
            >
              <div className="aspect-video bg-bg-tertiary relative overflow-hidden">
                {app.previewUrls[0] ? (
                  <img
                    src={app.previewUrls[0]}
                    alt={app.name}
                    className="w-full h-full object-cover"
                  />
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
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}