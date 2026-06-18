import { useState, useEffect, useRef } from 'react';
import { X, Search, Plus, Check } from 'lucide-react';
import { fetchTags, createTag } from '../lib/api/tagsApi';
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
  const [newName, setNewName] = useState('');
  const [tagSearch, setTagSearch] = useState('');
  const [mode, setMode] = useState<'new' | 'existing'>('new');
  const [loading, setLoading] = useState(false);
  const [loadingTags, setLoadingTags] = useState(false);
  const [addingToDb, setAddingToDb] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const isEdit = !!editId;

  useEffect(() => {
    if (isOpen) {
      setTagId(isEdit && initialTagId ? initialTagId : '');
      setNewName('');
      setTagSearch('');
      setMode(isEdit ? 'existing' : 'new');
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

  useEffect(() => {
    if ((isEdit || mode === 'existing') && isOpen) {
      setTimeout(() => searchInputRef.current?.focus(), 50);
    }
  }, [mode, isOpen, isEdit]);

  const filteredOptions = tagOptions.filter((opt) =>
    opt.name.toLowerCase().includes(tagSearch.toLowerCase().trim())
  );

  const selectedOption = tagOptions.find((o) => o.id === tagId);

  const handleAddToDb = async () => {
    const name = tagSearch.trim();
    if (!name) return;
    const exists = tagOptions.find((o) => o.name.toLowerCase() === name.toLowerCase());
    if (exists) {
      setTagId(exists.id);
      return;
    }
    setAddingToDb(true);
    setError(null);
    try {
      const tag = await createTag(name, TAG_TYPE);
      const newOpt = { id: tag.id, name: tag.name || name };
      setTagOptions((prev) => [...prev, newOpt]);
      setTagId(newOpt.id);
      setTagSearch('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ошибка при создании тега');
    } finally {
      setAddingToDb(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      if (isEdit && editId) {
        if (!tagId.trim()) { setError('Выберите тег'); setLoading(false); return; }
        await updateProjectScenarioCategory(editId, tagId.trim());
      } else if (mode === 'new') {
        if (!newName.trim()) { setError('Введите название'); setLoading(false); return; }
        const tag = await createTag(newName.trim(), TAG_TYPE);
        await createProjectScenarioCategory(projectId, tag.id, parentId ?? undefined);
      } else {
        if (!tagId.trim()) { setError('Выберите тег из базы'); setLoading(false); return; }
        await createProjectScenarioCategory(projectId, tagId.trim(), parentId ?? undefined);
      }
      onSuccess();
      onClose();
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Ошибка при сохранении';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const showExisting = isEdit || mode === 'existing';

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

          {!isEdit && (
            <div className="flex gap-2 mb-4">
              <button
                type="button"
                onClick={() => setMode('new')}
                className={`flex-1 py-2 text-sm rounded-lg border transition-colors ${
                  mode === 'new'
                    ? 'bg-[#a3e635] text-black border-[#a3e635] font-medium'
                    : 'bg-[#1a1a1a] text-[#a1a1a1] border-[#2a2a2a] hover:text-white'
                }`}
              >
                Новый локальный
              </button>
              <button
                type="button"
                onClick={() => setMode('existing')}
                className={`flex-1 py-2 text-sm rounded-lg border transition-colors ${
                  mode === 'existing'
                    ? 'bg-[#a3e635] text-black border-[#a3e635] font-medium'
                    : 'bg-[#1a1a1a] text-[#a1a1a1] border-[#2a2a2a] hover:text-white'
                }`}
              >
                Из базы
              </button>
            </div>
          )}

          {showExisting ? (
            <div className="mb-4">
              <label className="block text-sm font-medium text-[#e5e5e5] mb-2">
                Тег (из базы) *
              </label>

              {/* Selected tag chip */}
              {selectedOption && (
                <div className="flex items-center gap-2 mb-2 px-3 py-1.5 bg-[#a3e635]/10 border border-[#a3e635]/30 rounded-lg text-sm">
                  <Check className="h-3.5 w-3.5 text-[#a3e635] shrink-0" />
                  <span className="text-[#a3e635] font-medium truncate">{selectedOption.name}</span>
                  <button
                    type="button"
                    onClick={() => setTagId('')}
                    className="ml-auto text-[#a3e635]/60 hover:text-[#a3e635] transition-colors"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}

              {/* Search input */}
              <div className="relative mb-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#6b6b6b] pointer-events-none" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={tagSearch}
                  onChange={(e) => setTagSearch(e.target.value)}
                  placeholder="Поиск..."
                  disabled={loadingTags}
                  className="w-full pl-9 pr-4 py-2.5 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg focus:outline-none focus:border-[#a3e635] text-white placeholder:text-[#6b6b6b] text-sm disabled:opacity-50"
                />
              </div>

              {/* Options list */}
              <div className="max-h-44 overflow-y-auto rounded-lg border border-[#2a2a2a] bg-[#1a1a1a]">
                {loadingTags ? (
                  <div className="px-4 py-3 text-sm text-[#6b6b6b]">Загрузка...</div>
                ) : filteredOptions.length === 0 ? (
                  <div className="px-4 py-3 text-sm text-[#6b6b6b]">
                    {tagSearch ? `Не найдено "${tagSearch}"` : 'Список пуст'}
                  </div>
                ) : (
                  filteredOptions.map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => { setTagId(opt.id); setTagSearch(''); }}
                      className={`w-full text-left px-4 py-2.5 text-sm transition-colors flex items-center gap-2 ${
                        tagId === opt.id
                          ? 'bg-[#a3e635]/10 text-[#a3e635]'
                          : 'text-white hover:bg-[#242424]'
                      }`}
                    >
                      {tagId === opt.id && <Check className="h-3.5 w-3.5 shrink-0" />}
                      <span className={tagId === opt.id ? '' : 'pl-[18px]'}>{opt.name}</span>
                    </button>
                  ))
                )}
              </div>

              {/* Add to DB button */}
              <button
                type="button"
                onClick={handleAddToDb}
                disabled={!tagSearch.trim() || addingToDb || loadingTags}
                className="mt-2 w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-[#1a1a1a] border border-dashed border-[#3a3a3a] rounded-lg text-sm text-[#a1a1a1] hover:border-[#a3e635] hover:text-[#a3e635] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <Plus className="h-4 w-4" />
                {addingToDb
                  ? 'Добавление...'
                  : tagSearch.trim()
                    ? `Добавить «${tagSearch.trim()}» в базу`
                    : 'Добавить в базу'}
              </button>
            </div>
          ) : (
            <div className="mb-4">
              <label htmlFor="new_name" className="block text-sm font-medium text-[#e5e5e5] mb-2">
                Название *
              </label>
              <input
                id="new_name"
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Введите название сценария..."
                autoFocus
                className="w-full px-4 py-2.5 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg focus:outline-none focus:border-[#a3e635] text-white placeholder:text-[#6b6b6b]"
              />
            </div>
          )}

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
