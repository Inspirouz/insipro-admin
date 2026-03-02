'use client';

import { useEffect, useState } from 'react';
import {Link} from 'react-router-dom';
import { Plus } from 'lucide-react';
import { apiClient } from '@/lib/api';
import type { App, TaxonomyItem } from '@/lib/types';
import { PageHeader } from '@/components/PageHeader';
import { SearchInput } from '@/components/SearchInput';

export default function AppsPage() {
  const [apps, setApps] = useState<App[]>([]);
  const [categories, setCategories] = useState<TaxonomyItem[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [appsData, categoriesData] = await Promise.all([
        apiClient.listApps(),
        apiClient.listTaxonomy('appCategory'),
      ]);
      setApps(appsData);
      setCategories(categoriesData);
    } finally {
      setLoading(false);
    }
  };

  const filteredApps = apps.filter(app =>
    app.name.toLowerCase().includes(search.toLowerCase()) ||
    app.description.toLowerCase().includes(search.toLowerCase())
  );

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
        <div className="text-center py-12 text-[#a1a1a1]">Загрузка...</div>
      ) : filteredApps.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-[#a1a1a1] mb-4">Приложения не найдены</p>
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
              className="group bg-[#141414] border border-[#2a2a2a] rounded-xl overflow-hidden hover:border-[#3a3a3a] transition-all hover:shadow-soft"
            >
              <div className="aspect-[16/9] bg-[#1a1a1a] relative overflow-hidden">
                {(app.previewUrls[0] || app.iconUrl) ? (
                  <img
                    src={app.previewUrls[0] || app.iconUrl || ''}
                    alt={app.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full text-[#6b6b6b]">
                    Нет превью
                  </div>
                )}
              </div>
              <div className="p-4">
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0 bg-[#1a1a1a]">
                    {app.iconUrl ? (
                      <img src={app.iconUrl} alt={app.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xs text-[#6b6b6b]">
                        {app.name[0]}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium mb-1 truncate group-hover:text-[#a3e635] transition-colors">
                      {app.name}
                    </h3>
                    <p className="text-xs text-[#a1a1a1]">{getCategoryName(app.categoryId)}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  {app.platforms.map((platform) => (
                    <span
                      key={platform}
                      className="px-2 py-1 bg-[#1a1a1a] text-xs rounded-md text-[#a1a1a1] uppercase"
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
