import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Copy } from 'lucide-react';
import { apiClient } from '../lib/api';
import { fetchTags, createTag } from '../lib/api/tagsApi';
import { fetchScreensCategories, createScreenCategory } from '../lib/api/screensCategoriesApi';
import { fetchScenarioCategories } from '../lib/api/scenarioCategoriesApi';
import { createAdminScreen, fetchAdminScreens } from '../lib/api/adminScreensApi';
import type { TaxonomyItem, Scenario, Screen } from '../lib/types';
import { PageHeader } from '../components/PageHeader';
import { ImageUploadSlot } from '../components/ImageUploadSlot';
import { MultiSelectField } from '../components/MultiSelectField';
import { AddTaxonomyDialog } from '../components/AddTaxonomyDialog';
import { AddScenarioCategoryModal } from '../components/AddScenarioCategoryModal';

function tagToTaxonomy(tag: { id: string; name: string }, type: TaxonomyItem['type']): TaxonomyItem {
  return { id: tag.id, name: tag.name, type };
}

export function NewScreenPage() {
  const { id: appId } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [screenCategories, setScreenCategories] = useState<TaxonomyItem[]>([]);
  const [uiElements, setUiElements] = useState<TaxonomyItem[]>([]);
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [lastScreen, setLastScreen] = useState<Screen | null>(null);
  const [addPatternOpen, setAddPatternOpen] = useState(false);
  const [addUiElementOpen, setAddUiElementOpen] = useState(false);
  const [addScenarioOpen, setAddScenarioOpen] = useState(false);

  const [formData, setFormData] = useState({
    imageUrl: null as string | null,
    imageId: null as string | null,
    categoryIds: [] as string[],
    scenarioIds: [] as string[],
    uiElementIds: [] as string[],
    patternIds: [] as string[],
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const [screenCategoriesData, uiData, projectScenarios, allScenarios, screens] = await Promise.all([
      fetchScreensCategories(),
      fetchTags('ui').then((tags) => tags.map((t) => tagToTaxonomy(t, 'uiElement'))),
      fetchScenarioCategories(undefined, appId),
      fetchScenarioCategories(),
      appId ? fetchAdminScreens(appId) : Promise.resolve([] as Screen[]),
    ]);

    setScreenCategories(
      screenCategoriesData.map((c) => ({ id: c.id, name: c.name, type: 'screenCategory' as const }))
    );
    setUiElements(uiData);

    const localIds = new Set(projectScenarios.filter((c) => c.project_id === appId).map((c) => c.id));
    const local = projectScenarios
      .filter((c) => c.project_id === appId)
      .map((c) => ({ id: c.id, name: c.name, parentId: c.parent_id ?? undefined }));
    const base = allScenarios
      .filter((c) => !c.project_id && !localIds.has(c.id))
      .map((c) => ({ id: c.id, name: c.name, parentId: c.parent_id ?? undefined }));
    setScenarios([...local, ...base]);

    if (screens.length > 0) {
      const sorted = [...screens].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      setLastScreen(sorted[0]);
    }
  };

  const refreshScenarios = async () => {
    if (!appId) return;
    try {
      const [projectScenarios, allScenarios] = await Promise.all([
        fetchScenarioCategories(undefined, appId),
        fetchScenarioCategories(),
      ]);
      const localIds = new Set(projectScenarios.filter((c) => c.project_id === appId).map((c) => c.id));
      const local = projectScenarios
        .filter((c) => c.project_id === appId)
        .map((c) => ({ id: c.id, name: c.name, parentId: c.parent_id ?? undefined }));
      const base = allScenarios
        .filter((c) => !c.project_id && !localIds.has(c.id))
        .map((c) => ({ id: c.id, name: c.name, parentId: c.parent_id ?? undefined }));
      setScenarios([...local, ...base]);
    } catch (e) {
      console.error(e);
    }
  };

  const borrowTags = () => {
    if (!lastScreen) return;
    setFormData((prev) => ({
      ...prev,
      categoryIds: lastScreen.categoryId ? [lastScreen.categoryId] : [],
      scenarioIds: lastScreen.scenarioIds,
      uiElementIds: lastScreen.uiElementIds,
      patternIds: lastScreen.patternIds,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!appId) return;
    if (formData.scenarioIds.length === 0) {
      alert('Выберите хотя бы один сценарий');
      return;
    }
    if (!formData.imageUrl) {
      alert('Загрузите изображение экрана');
      return;
    }

    setLoading(true);
    try {
      await createAdminScreen({
        project_id: appId,
        ...(formData.categoryIds[0] ? { screens_category_id: formData.categoryIds[0] } : {}),
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

  const handleAddUiElement = async (name: string) => {
    try {
      const tag = await createTag(name, 'ui');
      const newItem = tagToTaxonomy(tag, 'uiElement');
      setUiElements((prev) => [...prev, newItem]);
      setFormData((prev) => ({ ...prev, uiElementIds: [...prev.uiElementIds, newItem.id] }));
    } catch (e) {
      console.error(e);
    }
  };

  const handleAddScreenCategory = async (name: string) => {
    try {
      const cat = await createScreenCategory(name);
      const newItem: TaxonomyItem = { id: cat.id, name: cat.name, type: 'screenCategory' };
      setScreenCategories((prev) => [...prev, newItem]);
      setFormData((prev) => ({ ...prev, categoryIds: [...prev.categoryIds, newItem.id] }));
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="p-8">
      <AddTaxonomyDialog
        isOpen={addPatternOpen}
        onClose={() => setAddPatternOpen(false)}
        onSave={handleAddScreenCategory}
        title="Добавить паттерн"
      />
      <AddTaxonomyDialog
        isOpen={addUiElementOpen}
        onClose={() => setAddUiElementOpen(false)}
        onSave={handleAddUiElement}
        title="Добавить UI элемент"
      />
      <AddScenarioCategoryModal
        isOpen={addScenarioOpen}
        onClose={() => setAddScenarioOpen(false)}
        projectId={appId ?? ''}
        onSuccess={refreshScenarios}
      />
      <Link
        to={`/apps/${appId}`}
        className="inline-flex items-center gap-2 text-[#a1a1a1] hover:text-white transition-colors mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        Назад к приложению
      </Link>

      <div className="flex items-center justify-between mb-6">
        <PageHeader title="Добавить экран" />
        {lastScreen && (
          <button
            type="button"
            onClick={borrowTags}
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#1a1a1a] border border-[#2a2a2a] text-sm text-[#a1a1a1] rounded-lg hover:text-white hover:border-[#a3e635] transition-colors"
          >
            <Copy className="h-4 w-4" />
            Заимствовать теги предыдущего экрана
          </button>
        )}
      </div>

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
dupCheckKey={appId}
              accept="image/*,video/*"
            />
          </div>

          {/* Screen Category / Паттерны */}
          <MultiSelectField
            label="Паттерны"
            items={screenCategories}
            selectedIds={formData.categoryIds}
            onChange={(ids) => setFormData(prev => ({ ...prev, categoryIds: ids }))}
            onAddNew={() => setAddPatternOpen(true)}
          />

          {/* Scenarios */}
          <MultiSelectField
            label="Сценарии"
            items={scenarios}
            selectedIds={formData.scenarioIds}
            onChange={(ids) => setFormData(prev => ({ ...prev, scenarioIds: ids }))}
            onAddNew={() => setAddScenarioOpen(true)}
          />

          {/* UI Elements */}
          <MultiSelectField
            label="UI элементы"
            items={uiElements}
            selectedIds={formData.uiElementIds}
            onChange={(ids) => setFormData(prev => ({ ...prev, uiElementIds: ids }))}
            onAddNew={() => setAddUiElementOpen(true)}
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
