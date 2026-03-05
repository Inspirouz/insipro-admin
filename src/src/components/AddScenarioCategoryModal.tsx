import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { fetchTags } from '../lib/api/tagsApi';
import { createProjectScenarioCategory, updateProjectScenarioCategory } from '../lib/api/scenarioCategoriesApi';

const TAG_TYPE = 'senary-category';

export interface ScenarioCategoryOption {
  id: string;
  name: string;
}

interface AddScenarioCategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  parentId?: string | null;
  parentName?: string;
  editId?: string | null;
  initialTagId?: string;
  onSuccess: () => void;
}

export function AddScenarioCategoryModal({
  isOpen,
  onClose,
  projectId,
  parentId,
  parentName,
  editId,
  initialTagId,
  onSuccess,
}: AddScenarioCategoryModalProps) {
  const [tagOptions, setTagOptions] = useState<ScenarioCategoryOption[]>([]);
  const [tagId, setTagId] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingTags, setLoadingTags] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isEdit = !!editId;

  useEffect(() => {
    if (isOpen) {
      setTagId(isEdit && initialTagId ? initialTagId : '');
      setError(null);
      setLoadingTags(true);
      fetchTags(TAG_TYPE)
        .then((tags) => setTagOptions(tags.map((t) => ({ id: t.id, name: t.name }))))
        .catch((e) => {
          console.error(e);
          setTagOptions([]);
        })
        .finally(() => setLoadingTags(false));
    }
  }, [isOpen, isEdit, initialTagId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tagId.trim()) return;
    setLoading(true);
    setError(null);
    try {
      if (isEdit && editId) {
        await updateProjectScenarioCategory(editId, tagId.trim());
      } else {
        await createProjectScenarioCategory(projectId, tagId.trim(), parentId ?? undefined);
      }
      onSuccess();
      onClose();
    } catch (e) {
      const msg = e instanceof Error ? e.message : (isEdit ? 'Ошибка при сохранении' : 'Ошибка при добавлении');
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} aria-hidden />
      <div className="relative w-full max-w-md bg-[#141414] border border-[#2a2a2a] rounded-xl shadow-lg">
        <div className="flex items-center justify-between p-6 border-b border-[#2a2a2a]">
          <h2 className="text-lg font-medium">
            {isEdit
              ? 'Редактировать категорию'
              : parentId && parentName
                ? `Добавить подкатегорию в "${parentName}"`
                : 'Добавить категорию сценариев'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1 hover:bg-[#1a1a1a] rounded transition-colors text-[#a1a1a1] hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
              {error}
            </div>
          )}

          <div className="mb-4">
            <label htmlFor="tag_id" className="block text-sm font-medium text-[#e5e5e5] mb-2">
              Тег (категория) *
            </label>
            <select
              id="tag_id"
              value={tagId}
              onChange={(e) => setTagId(e.target.value)}
              required
              disabled={loadingTags}
              className="w-full px-4 py-2.5 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg focus:outline-none focus:border-[#a3e635] text-white disabled:opacity-50"
            >
              <option value="">Выберите тег...</option>
              {tagOptions.map((opt) => (
                <option key={opt.id} value={opt.id}>
                  {opt.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex gap-3 justify-end mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-[#a1a1a1] hover:text-white transition-colors"
            >
              Отмена
            </button>
            <button
              type="submit"
              disabled={loading || loadingTags}
              className="px-4 py-2.5 bg-[#a3e635] text-black font-medium rounded-lg hover:bg-[#b8ec44] disabled:opacity-50 transition-colors"
            >
              {loading ? 'Сохранение...' : isEdit ? 'Сохранить' : 'Добавить'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
