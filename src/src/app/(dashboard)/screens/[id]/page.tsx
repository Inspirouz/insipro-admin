'use client';

import { useState, useEffect, type ChangeEvent } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { apiClient } from '@/lib/api';
import type { Screen, TaxonomyItem, Scenario } from '@/lib/types';
import { PageHeader } from '@/components/PageHeader';
import { MultiSelectField } from '@/components/MultiSelectField';
import { ConfirmDialog } from '@/components/ConfirmDialog';

type FormState = {
  categoryId: string;
  scenarioIds: string[];
  uiElementIds: string[];
  patternIds: string[];
};

export default function ScreenDetailPage() {
  const params = useParams();
  const router = useRouter();
  const screenId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [screen, setScreen] = useState<Screen | null>(null);
  const [screenCategories, setScreenCategories] = useState<TaxonomyItem[]>([]);
  const [uiElements, setUiElements] = useState<TaxonomyItem[]>([]);
  const [patterns, setPatterns] = useState<TaxonomyItem[]>([]);
  const [scenarios, setScenarios] = useState<Scenario[]>([]);

  const [formData, setFormData] = useState<FormState>({
    categoryId: '',
    scenarioIds: [],
    uiElementIds: [],
    patternIds: [],
  });

  useEffect(() => {
    loadData();
  }, [screenId]);

  const loadData = async () => {
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
    setDeleting(true);
    try {
      await apiClient.deleteScreen(screenId);
      setDeleteModalOpen(false);
      router.push('/screens');
    } catch (error) {
      console.error('Failed to delete screen:', error);
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-text-secondary">Загрузка...</div>;
  }

  if (!screen) {
    return <div className="p-8 text-center text-text-secondary">Экран не найден</div>;
  }

  return (
    <div className="p-8">
      <Link
        href="/screens"
        className="inline-flex items-center gap-2 text-text-secondary hover:text-white transition-colors mb-6"
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
        <div className="w-80 shrink-0">
          <div className="bg-bg-secondary border border-border rounded-xl p-4 sticky top-8">
            <div className="aspect-9/16 rounded-lg overflow-hidden">
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
          <div className="bg-bg-secondary border border-border rounded-xl p-6 space-y-6">
            {/* Screen Category */}
            <div>
              <label htmlFor="category" className="block text-sm font-medium mb-2">
                Категория экрана
              </label>
              <select
                id="category"
                value={formData.categoryId}
                onChange={(e: ChangeEvent<HTMLSelectElement>) => setFormData((prev: FormState) => ({ ...prev, categoryId: e.target.value }))}
                className="w-full px-4 py-2.5 bg-bg-tertiary border border-border rounded-lg focus:outline-none focus:border-lime transition-colors"
              >
                {screenCategories.map((category: TaxonomyItem) => (
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
              onChange={(ids: string[]) => setFormData((prev: FormState) => ({ ...prev, scenarioIds: ids }))}
            />

            {/* UI Elements */}
            <MultiSelectField
              label="UI элементы"
              items={uiElements}
              selectedIds={formData.uiElementIds}
              onChange={(ids: string[]) => setFormData((prev: FormState) => ({ ...prev, uiElementIds: ids }))}
            />

            {/* Patterns */}
            <MultiSelectField
              label="Паттерны"
              items={patterns}
              selectedIds={formData.patternIds}
              onChange={(ids: string[]) => setFormData((prev: FormState) => ({ ...prev, patternIds: ids }))}
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
              href="/screens"
              className="px-6 py-2.5 bg-bg-tertiary border border-border text-white font-medium rounded-lg hover:bg-bg-secondary transition-colors"
            >
              Отмена
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
