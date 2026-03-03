import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { apiClient } from '../lib/api';
import { fetchTags } from '../lib/api/tagsApi';
import { fetchScreensCategories } from '../lib/api/screensCategoriesApi';
import { fetchScenarioCategories } from '../lib/api/scenarioCategoriesApi';
import { createAdminScreen } from '../lib/api/adminScreensApi';
import type { TaxonomyItem, Scenario } from '../lib/types';
import { PageHeader } from '../components/PageHeader';
import { ImageUploadSlot } from '../components/ImageUploadSlot';
import { MultiSelectField } from '../components/MultiSelectField';

function tagToTaxonomy(tag: { id: string; name: string }, type: TaxonomyItem['type']): TaxonomyItem {
  return { id: tag.id, name: tag.name, type };
}

export function NewScreenPage() {
  const { id: appId } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [screenCategories, setScreenCategories] = useState<TaxonomyItem[]>([]);
  const [uiElements, setUiElements] = useState<TaxonomyItem[]>([]);
  const [patterns, setPatterns] = useState<TaxonomyItem[]>([]);
  const [scenarios, setScenarios] = useState<Scenario[]>([]);

  const [formData, setFormData] = useState({
    imageUrl: null as string | null,
    imageId: null as string | null,
    categoryId: '',
    scenarioIds: [] as string[],
    uiElementIds: [] as string[],
    patternIds: [] as string[],
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const [screenCategoriesData, uiData, patternsData, scenarioCategories] = await Promise.all([
      fetchScreensCategories(),
      fetchTags('ui').then((tags) => tags.map((t) => tagToTaxonomy(t, 'uiElement'))),
      fetchTags('patterns').then((tags) => tags.map((t) => tagToTaxonomy(t, 'pattern'))),
      fetchScenarioCategories(),
    ]);
    const categoriesData: TaxonomyItem[] = screenCategoriesData.map((c) => ({
      id: c.id,
      name: c.name,
      type: 'screenCategory',
    }));
    setScreenCategories(categoriesData);
    setUiElements(uiData);
    setPatterns(patternsData);
    setScenarios(
      scenarioCategories.map((c) => ({
        id: c.id,
        name: c.name,
        parentId: (c.parent_id ?? undefined) as string | undefined,
      }))
    );
    if (categoriesData.length > 0) {
      setFormData(prev => ({ ...prev, categoryId: categoriesData[0].id }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!appId) return;
    if (!formData.imageUrl) {
      alert('Загрузите изображение экрана');
      return;
    }

    setLoading(true);
    try {
      await createAdminScreen({
        project_id: appId,
        screens_category_id: formData.categoryId,
        imageIds: formData.imageId ? [formData.imageId] : [],
        senarys: formData.scenarioIds,
        ui_elements: formData.uiElementIds,
        patterns: formData.patternIds,
      });
      navigate(`/apps/${appId}`);
    } catch (error) {
      console.error('Failed to create screen:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8">
      <Link
        to={`/apps/${appId}`}
        className="inline-flex items-center gap-2 text-[#a1a1a1] hover:text-white transition-colors mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        Назад к приложению
      </Link>

      <PageHeader title="Добавить экран" />

      <form onSubmit={handleSubmit} className="max-w-4xl">
        <div className="bg-[#141414] border border-[#2a2a2a] rounded-xl p-6 space-y-6">
          {/* Image */}
          <div className="max-w-xs">
            <ImageUploadSlot
              value={formData.imageUrl}
              onChange={(url) => setFormData(prev => ({ ...prev, imageUrl: url }))}
              onUploaded={(meta) => setFormData(prev => ({ ...prev, imageId: meta.id }))}
              label="Изображение экрана"
              aspectRatio="9/16"
            />
          </div>

          {/* Screen Category */}
          <div>
            <label htmlFor="category" className="block text-sm font-medium mb-2">
              Категория экрана
            </label>
            <select
              id="category"
              value={formData.categoryId}
              onChange={(e) => setFormData(prev => ({ ...prev, categoryId: e.target.value }))}
              className="w-full px-4 py-2.5 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg focus:outline-none focus:border-[#a3e635] transition-colors"
              required
            >
              {screenCategories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          {/* Scenarios */}
          <MultiSelectField
            label="Сценарии"
            items={scenarios}
            selectedIds={formData.scenarioIds}
            onChange={(ids) => setFormData(prev => ({ ...prev, scenarioIds: ids }))}
          />

          {/* UI Elements */}
          <MultiSelectField
            label="UI элементы"
            items={uiElements}
            selectedIds={formData.uiElementIds}
            onChange={(ids) => setFormData(prev => ({ ...prev, uiElementIds: ids }))}
          />

          {/* Patterns */}
          <MultiSelectField
            label="Паттерны"
            items={patterns}
            selectedIds={formData.patternIds}
            onChange={(ids) => setFormData(prev => ({ ...prev, patternIds: ids }))}
          />
        </div>

        {/* Actions */}
        <div className="mt-6 flex gap-3">
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2.5 bg-white text-black font-medium rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Сохранение...' : 'Сохранить'}
          </button>
          <Link
            to={`/apps/${appId}`}
            className="px-6 py-2.5 bg-[#1a1a1a] border border-[#2a2a2a] text-white font-medium rounded-lg hover:bg-[#242424] transition-colors"
          >
            Отмена
          </Link>
        </div>
      </form>
    </div>
  );
}