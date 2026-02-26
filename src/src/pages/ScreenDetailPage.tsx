import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Trash2 } from 'lucide-react';
import { apiClient } from '../lib/api';
import type { Screen, TaxonomyItem, Scenario } from '../lib/types';
import { PageHeader } from '../components/PageHeader';
import { MultiSelectField } from '../components/MultiSelectField';
import { ConfirmDialog } from '../components/ConfirmDialog';

export function ScreenDetailPage() {
  const { id: screenId } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [screen, setScreen] = useState<Screen | null>(null);
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
      const [
        screenData,
        categoriesData,
        uiData,
        patternsData,
        scenariosData
      ] = await Promise.all([
        apiClient.getScreen(screenId),
        apiClient.listTaxonomy('screenCategory'),
        apiClient.listTaxonomy('uiElement'),
        apiClient.listTaxonomy('pattern'),
        apiClient.listScenarios(),
      ]);
      
      setScreen(screenData);
      setScreenCategories(categoriesData);
      setUiElements(uiData);
      setPatterns(patternsData);
      setScenarios(scenariosData);
      
      setFormData({
        categoryId: screenData.categoryId,
        scenarioIds: screenData.scenarioIds,
        uiElementIds: screenData.uiElementIds,
        patternIds: screenData.patternIds,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!screenId) return;
    setSaving(true);
    try {
      await apiClient.updateScreen(screenId, formData);
      alert('Изменения сохранены');
    } catch (error) {
      console.error('Failed to update screen:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!screenId) return;
    setDeleting(true);
    try {
      await apiClient.deleteScreen(screenId);
      setDeleteModalOpen(false);
      navigate('/screens');
    } catch (error) {
      console.error('Failed to delete screen:', error);
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-[#a1a1a1]">Загрузка...</div>;
  }

  if (!screen) {
    return <div className="p-8 text-center text-[#a1a1a1]">Экран не найден</div>;
  }

  return (
    <div className="p-8">
      <Link
        to="/screens"
        className="inline-flex items-center gap-2 text-[#a1a1a1] hover:text-white transition-colors mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        Назад к экранам
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
        {/* Preview */}
        <div className="w-80 flex-shrink-0">
          <div className="bg-[#141414] border border-[#2a2a2a] rounded-xl p-4 sticky top-8">
            <div className="aspect-[9/16] rounded-lg overflow-hidden">
              <img
                src={screen.imageUrl}
                alt="Screen preview"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
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
                onChange={(e) => setFormData(prev => ({ ...prev, categoryId: e.target.value }))}
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
              onClick={handleSave}
              disabled={saving}
              className="px-6 py-2.5 bg-white text-black font-medium rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Сохранение...' : 'Сохранить'}
            </button>
            <Link
              to="/screens"
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