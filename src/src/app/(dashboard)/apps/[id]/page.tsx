'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Pencil, Plus } from 'lucide-react';
import { apiClient } from '@/lib/api';
import type { App, Screen, TaxonomyItem } from '@/lib/types';

export default function AppDetailPage() {
  const params = useParams();
  const router = useRouter();
  const appId = params.id as string;

  const [app, setApp] = useState<App | null>(null);
  const [screens, setScreens] = useState<Screen[]>([]);
  const [screenCategories, setScreenCategories] = useState<TaxonomyItem[]>([]);
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'screens' | 'scenarios' | 'videos'>('screens');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [appId]);

  const loadData = async () => {
    try {
      const [appData, screensData, categoriesData] = await Promise.all([
        apiClient.getApp(appId),
        apiClient.listScreens({ appId }),
        apiClient.listTaxonomy('screenCategory'),
      ]);
      setApp(appData);
      setScreens(screensData);
      setScreenCategories(categoriesData);
    } finally {
      setLoading(false);
    }
  };

  const getCategory = (categoryId: string) => {
    return screenCategories.find(c => c.id === categoryId);
  };

  const getCategoryCounts = () => {
    const counts: Record<string, number> = {};
    screens.forEach(screen => {
      counts[screen.categoryId] = (counts[screen.categoryId] || 0) + 1;
    });
    return counts;
  };

  const filteredScreens = categoryFilter
    ? screens.filter(s => s.categoryId === categoryFilter)
    : screens;

  if (loading) {
    return <div className="p-8 text-center text-[#a1a1a1]">Загрузка...</div>;
  }

  if (!app) {
    return <div className="p-8 text-center text-[#a1a1a1]">Приложение не найдено</div>;
  }

  const categoryCounts = getCategoryCounts();

  return (
    <div className="p-8">
      <Link
        href="/apps"
        className="inline-flex items-center gap-2 text-[#a1a1a1] hover:text-white transition-colors mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        Назад к приложениям
      </Link>

      {/* App Header */}
      <div className="bg-[#141414] border border-[#2a2a2a] rounded-xl p-6 mb-6">
        <div className="flex items-start gap-6">
          <div className="w-20 h-20 rounded-xl overflow-hidden flex-shrink-0 bg-[#1a1a1a]">
            {app.iconUrl ? (
              <img src={app.iconUrl} alt={app.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-2xl text-[#6b6b6b]">
                {app.name[0]}
              </div>
            )}
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-semibold mb-2">{app.name}</h1>
            <p className="text-[#a1a1a1] mb-4">{app.description}</p>
            <div className="flex items-center gap-4 text-sm text-[#a1a1a1]">
              <div className="flex gap-2">
                {app.platforms.map((platform) => (
                  <span
                    key={platform}
                    className="px-2 py-1 bg-[#1a1a1a] rounded-md uppercase"
                  >
                    {platform}
                  </span>
                ))}
              </div>
              <span>•</span>
              <span>{new Date(app.createdAt).toLocaleDateString('ru-RU')}</span>
            </div>
          </div>
          <Link
            href={`/apps/${app.id}/edit`}
            className="flex items-center gap-2 px-4 py-2.5 bg-white text-black font-medium rounded-lg hover:bg-gray-100 transition-colors"
          >
            <Pencil className="h-4 w-4" />
            Редактировать
          </Link>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-[#2a2a2a] mb-6">
        <div className="flex gap-6">
          {[
            { id: 'screens', label: 'Экраны', count: screens.length },
            { id: 'scenarios', label: 'Сценарии' },
            { id: 'videos', label: 'Видео' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-1 py-3 font-medium transition-colors relative ${
                activeTab === tab.id
                  ? 'text-[#a3e635]'
                  : 'text-[#a1a1a1] hover:text-white'
              }`}
            >
              {tab.label}
              {tab.count !== undefined && (
                <span className="ml-2 text-sm">({tab.count})</span>
              )}
              {activeTab === tab.id && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#a3e635]" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Screens Tab */}
      {activeTab === 'screens' && (
        <div className="flex gap-6">
          {/* Sidebar Filter */}
          <div className="w-64 flex-shrink-0">
            <div className="bg-[#141414] border border-[#2a2a2a] rounded-xl p-4">
              <h3 className="font-medium mb-4">Категории</h3>
              <div className="space-y-1">
                <button
                  onClick={() => setCategoryFilter(null)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors ${
                    categoryFilter === null
                      ? 'bg-[#a3e635] text-black font-medium'
                      : 'text-[#a1a1a1] hover:bg-[#1a1a1a]'
                  }`}
                >
                  <span>Все</span>
                  <span>{screens.length}</span>
                </button>
                {screenCategories.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => setCategoryFilter(category.id)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors ${
                      categoryFilter === category.id
                        ? 'bg-[#a3e635] text-black font-medium'
                        : 'text-[#a1a1a1] hover:bg-[#1a1a1a]'
                    }`}
                  >
                    <span>{category.name}</span>
                    <span>{categoryCounts[category.id] || 0}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Screens Grid */}
          <div className="flex-1">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-medium">
                {categoryFilter
                  ? getCategory(categoryFilter)?.name
                  : 'Все экраны'}
              </h2>
              <Link
                href={`/apps/${app.id}/screens/new`}
                className="flex items-center gap-2 px-4 py-2.5 bg-white text-black font-medium rounded-lg hover:bg-gray-100 transition-colors"
              >
                <Plus className="h-4 w-4" />
                Добавить
              </Link>
            </div>

            {filteredScreens.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-[#a1a1a1] mb-4">Экраны не найдены</p>
                <Link
                  href={`/apps/${app.id}/screens/new`}
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-white text-black font-medium rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <Plus className="h-4 w-4" />
                  Добавить первый экран
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {filteredScreens.map((screen) => (
                  <Link
                    key={screen.id}
                    href={`/screens/${screen.id}`}
                    className="group bg-[#141414] border border-[#2a2a2a] rounded-xl overflow-hidden hover:border-[#3a3a3a] transition-all hover:shadow-soft"
                  >
                    <div className="aspect-[9/16] bg-[#1a1a1a]">
                      <img
                        src={screen.imageUrl}
                        alt="Screen"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="p-3">
                      <p className="text-xs text-[#a1a1a1]">
                        {getCategory(screen.categoryId)?.name}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Scenarios Tab */}
      {activeTab === 'scenarios' && (
        <div className="text-center py-12 text-[#a1a1a1]">
          Сценарии (в разработке)
        </div>
      )}

      {/* Videos Tab */}
      {activeTab === 'videos' && (
        <div className="text-center py-12 text-[#a1a1a1]">
          Soon
        </div>
      )}
    </div>
  );
}
