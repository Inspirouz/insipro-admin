import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiClient } from '../lib/api';
import type { Screen, TaxonomyItem } from '../lib/types';
import { PageHeader } from '../components/PageHeader';
import { SearchInput } from '../components/SearchInput';

export function ScreensPage() {
  const [screens, setScreens] = useState<Screen[]>([]);
  const [screenCategories, setScreenCategories] = useState<TaxonomyItem[]>([]);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [screensData, categoriesData] = await Promise.all([
        apiClient.listAllScreens(),
        apiClient.listTaxonomy('screenCategory'),
      ]);
      setScreens(screensData);
      setScreenCategories(categoriesData);
    } finally {
      setLoading(false);
    }
  };

  const filteredScreens = screens.filter(screen => {
    if (categoryFilter && screen.categoryId !== categoryFilter) return false;
    return true;
  });

  const getCategoryName = (categoryId: string) => {
    return screenCategories.find(c => c.id === categoryId)?.name || '';
  };

  return (
    <div className="p-8">
      <PageHeader title="Библиотека экранов" />

      <div className="flex gap-4 mb-6">
        <div className="flex-1">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Поиск экранов..."
          />
        </div>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="px-4 py-2.5 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg focus:outline-none focus:border-[#a3e635] transition-colors"
        >
          <option value="">Все категории</option>
          {screenCategories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="text-center py-12 text-[#a1a1a1]">Загрузка...</div>
      ) : filteredScreens.length === 0 ? (
        <div className="text-center py-12 text-[#a1a1a1]">Экраны не найдены</div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {filteredScreens.map((screen) => (
            <Link
              key={screen.id}
              to={`/screens/${screen.id}`}
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
                  {getCategoryName(screen.categoryId)}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}