import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { createScenario } from '../lib/api/scenariosApi';
import { ImageUploadSlot } from './ImageUploadSlot';
import type { UploadedFileMeta } from '../lib/api/fileApi';

const IMAGE_SLOTS = 5;

export interface ScenarioCategoryOption {
  id: string;
  name: string;
}

interface AddScenarioModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  scenarioCategories: ScenarioCategoryOption[];
  onSuccess: () => void;
  /** When set, this category is pre-selected when modal opens */
  initialScenarioCategoryId?: string | null;
}

type ImageSlot = { id: string | null; url: string | null };

export function AddScenarioModal({
  isOpen,
  onClose,
  projectId,
  scenarioCategories,
  onSuccess,
  initialScenarioCategoryId,
}: AddScenarioModalProps) {
  const [scenarioCategoryId, setScenarioCategoryId] = useState('');
  const [slots, setSlots] = useState<ImageSlot[]>(() =>
    Array.from({ length: IMAGE_SLOTS }, () => ({ id: null, url: null }))
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      const initialId =
        initialScenarioCategoryId && scenarioCategories.some((c) => c.id === initialScenarioCategoryId)
          ? initialScenarioCategoryId
          : scenarioCategories[0]?.id ?? '';
      setScenarioCategoryId(initialId);
      setSlots(Array.from({ length: IMAGE_SLOTS }, () => ({ id: null, url: null })));
      setError(null);
    }
  }, [isOpen, scenarioCategories, initialScenarioCategoryId]);

  const setSlot = (index: number, id: string | null, url: string | null) => {
    setSlots((prev) => {
      const next = [...prev];
      next[index] = { id, url };
      return next;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!scenarioCategoryId.trim()) return;
    const imageIds = slots.map((s) => s.id).filter((id): id is string => id != null);
    setLoading(true);
    setError(null);
    try {
      await createScenario({
        project_id: projectId,
        scenario_category_id: scenarioCategoryId.trim(),
        imageIds,
      });
      onSuccess();
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ошибка при создании сценария');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} aria-hidden />
      <div className="relative w-[480px] min-w-[400px] max-w-[95vw] h-[520px] min-h-0 max-h-[85vh] bg-[#141414] border border-[#2a2a2a] rounded-xl shadow-lg overflow-hidden flex flex-col shrink-0">
        <div className="flex items-center justify-between px-5 py-3 border-b border-[#2a2a2a] flex-shrink-0">
          <h2 className="text-base font-semibold">Добавить сценарий</h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 hover:bg-[#1a1a1a] rounded-lg transition-colors text-[#a1a1a1] hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 overflow-auto flex-1 min-h-0 flex flex-col">
          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
              {error}
            </div>
          )}

          <div className="mb-4">
            <label htmlFor="scenario_category_id" className="block text-sm font-medium text-[#e5e5e5] mb-2">
              Категория сценария *
            </label>
            <select
              id="scenario_category_id"
              value={scenarioCategoryId}
              onChange={(e) => setScenarioCategoryId(e.target.value)}
              required
              className="w-full px-4 py-2.5 text-sm bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg focus:outline-none focus:border-[#a3e635] text-white"
            >
              <option value="">Выберите категорию...</option>
              {scenarioCategories.map((opt) => (
                <option key={opt.id} value={opt.id}>
                  {opt.name}
                </option>
              ))}
            </select>
          </div>

          <div className="mb-4 flex-shrink-0">
            <label className="block text-sm font-medium text-[#e5e5e5] mb-2">Изображения</label>
            <div className="grid grid-cols-5 gap-2 h-20 grid-rows-1">
              {slots.map((slot, index) => (
                <div key={index} className="h-full min-w-0 overflow-hidden rounded-lg">
                  <ImageUploadSlot
                    value={slot.url}
                    onChange={(url) => setSlot(index, url ? slot.id : null, url)}
                    fileId={slot.id}
                    onUploaded={(meta: UploadedFileMeta) =>
                      setSlot(index, meta.id ?? null, meta.url ?? null)
                    }
                    aspectRatio="9/16"
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-3 justify-end mt-5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-[#a1a1a1] hover:text-white transition-colors rounded-lg"
            >
              Отмена
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-sm bg-[#a3e635] text-black font-medium rounded-lg hover:bg-[#b8ec44] disabled:opacity-50 transition-colors"
            >
              {loading ? 'Создание...' : 'Создать'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
