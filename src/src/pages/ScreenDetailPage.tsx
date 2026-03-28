import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Trash2 } from 'lucide-react';
import { fetchTags } from '../lib/api/tagsApi';
import { fetchScreensCategories } from '../lib/api/screensCategoriesApi';
import { fetchAdminScreen, updateAdminScreen, deleteAdminScreen } from '../lib/api/adminScreensApi';
import type { TaxonomyItem, Scenario } from '../lib/types';
import { PageHeader } from '../components/PageHeader';
import { MultiSelectField } from '../components/MultiSelectField';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { ImageUploadSlot } from '../components/ImageUploadSlot';
import { Toast } from '../components/Toast';

function tagToTaxonomy(tag: { id: string; name: string }, type: TaxonomyItem['type']): TaxonomyItem {
  return { id: tag.id, name: tag.name, type };
}

export function ScreenDetailPage() {
  const { id: screenId } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [imageUrl, setImageUrl] = useState('');
  const [imageIds, setImageIds] = useState<string[]>([]);
  const [appId, setAppId] = useState('');
  const [screenCategories, setScreenCategories] = useState<TaxonomyItem[]>([]);
  const [uiElements, setUiElements] = useState<TaxonomyItem[]>([]);
  const [patterns, setPatterns] = useState<TaxonomyItem[]>([]);
  const [scenarios, setScenarios] = useState<Scenario[]>([]);

  const [formData, setFormData] = useState({
    categoryId: '',
    scenarioIds: [] as string[],
    uiElementIds: [] as string[],
    patternIds: [] as string[],
  });

  useEffect(() => {
    if (screenId) loadData();
  }, [screenId]);

  const loadData = async () => {
    if (!screenId) return;
    try {
      const [screen, screenCategoriesData, uiData, patternsData, scenarioCategories] = await Promise.all([
        fetchAdminScreen(screenId),
        fetchScreensCategories(),
        fetchTags('ui').then((tags) => tags.map((t) => tagToTaxonomy(t, 'uiElement'))),
        fetchTags('patterns').then((tags) => tags.map((t) => tagToTaxonomy(t, 'pattern'))),
        fetchTags('senary-category'),
      ]);

      setImageUrl(screen.imageUrl);
      setImageIds(screen.imageIds ?? []);
      setAppId(screen.appId);
      setScreenCategories(
        screenCategoriesData.map((c) => ({ id: c.id, name: c.name, type: 'screenCategory' as const }))
      );
      setUiElements(uiData);
      setPatterns(patternsData);
      setScenarios(
        scenarioCategories.map((c) => ({ id: c.id, name: c.name, parentId: undefined }))
      );
      setFormData({
        categoryId: screen.categoryId,
        scenarioIds: screen.scenarioIds,
        uiElementIds: screen.uiElementIds,
        patternIds: screen.patternIds,
      });
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!screenId) return;
    setSaving(true);
    try {
      await updateAdminScreen(screenId, {
        screens_category_id: formData.categoryId,
        ...(imageIds.length > 0 && { imageIds }),
        senarys: formData.scenarioIds,
        ui_elements: formData.uiElementIds,
        patterns: formData.patternIds,
      });
      setToast({ message: 'Изменения сохранены', type: 'success' });
      setTimeout(() => navigate(appId ? `/apps/${appId}` : '/screens'), 1000);
    } catch (error) {
      console.error('Failed to update screen:', error);
      setToast({ message: 'Не удалось сохранить', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!screenId) return;
    setDeleting(true);
    try {
      await deleteAdminScreen(screenId);
      setDeleteModalOpen(false);
      navigate(appId ? `/apps/${appId}` : '/screens');
    } catch (error) {
      console.error('Failed to delete screen:', error);
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-[#a1a1a1]">Загрузка...</div>;
  }

  return (
    <div className="p-8">
      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}
      <Link
        to={appId ? `/apps/${appId}` : '/screens'}
        className="inline-flex items-center gap-2 text-[#a1a1a1] hover:text-white transition-colors mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        {appId ? 'Назад к приложению' : 'Назад к экранам'}
      </Link>

      <PageHeader
        title="Редактировать экран"
        actions={
          <button
            type="button"
            onClick={() => setDeleteModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-red-500/10 text-red-400 border border-red-500/50 font-medium rounded-lg hover:bg-red-500/20 transition-colors"
          >
            <Trash2 className="h-4 w-4" />
            Удалить
          </button>
        }
      />

      <ConfirmDialog
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Удалить экран?"
        description="Вы уверены, что хотите удалить этот экран? Это действие нельзя отменить."
        confirmLabel="Удалить"
        cancelLabel="Отмена"
        variant="danger"
        loading={deleting}
      />

      <div className="flex gap-6 max-w-6xl">
        {/* Image */}
        <div className="w-80 flex-shrink-0">
          <ImageUploadSlot
            value={imageUrl}
            fileId={imageIds[0] ?? null}
            onChange={(url) => setImageUrl(url ?? '')}
            onUploaded={(meta) => { if (meta.id) setImageIds([meta.id]); }}
            label="Изображение экрана"
            aspectRatio="9/16"
          />
        </div>

        {/* Form */}
        <div className="flex-1">
          <div className="bg-[#141414] border border-[#2a2a2a] rounded-xl p-6 space-y-6">
            {/* Screen Category */}
            <div>
              <label htmlFor="category" className="block text-sm font-medium mb-2">
                Категория экрана
              </label>
              <select
                id="category"
                value={formData.categoryId}
                onChange={(e) => setFormData((prev) => ({ ...prev, categoryId: e.target.value }))}
                className="w-full px-4 py-2.5 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg focus:outline-none focus:border-[#a3e635] transition-colors"
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
              onChange={(ids) => setFormData((prev) => ({ ...prev, scenarioIds: ids }))}
            />

            {/* UI Elements */}
            <MultiSelectField
              label="UI элементы"
              items={uiElements}
              selectedIds={formData.uiElementIds}
              onChange={(ids) => setFormData((prev) => ({ ...prev, uiElementIds: ids }))}
            />

            {/* Patterns */}
            <MultiSelectField
              label="Паттерны"
              items={patterns}
              selectedIds={formData.patternIds}
              onChange={(ids) => setFormData((prev) => ({ ...prev, patternIds: ids }))}
            />
          </div>

          {/* Actions */}
          <div className="mt-6 flex gap-3">
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-6 py-2.5 bg-white text-black font-medium rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Сохранение...' : 'Сохранить'}
            </button>
            <Link
              to={appId ? `/apps/${appId}` : '/screens'}
              className="px-6 py-2.5 bg-[#1a1a1a] border border-[#2a2a2a] text-white font-medium rounded-lg hover:bg-[#242424] transition-colors"
            >
              Отмена
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
