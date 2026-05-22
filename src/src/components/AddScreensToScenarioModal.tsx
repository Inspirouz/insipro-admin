import { useState, useMemo } from 'react';
import { X, Check, Search } from 'lucide-react';
import { updateAdminScreen } from '../lib/api/adminScreensApi';
import type { Screen } from '../lib/types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  scenarioCategoryId: string;
  appScreens: Screen[];
  onSuccess: (addedScreenIds: string[]) => void;
}

export function AddScreensToScenarioModal({
  isOpen,
  onClose,
  scenarioCategoryId,
  appScreens,
  onSuccess,
}: Props) {
  const [search, setSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const available = useMemo(
    () => appScreens.filter((s) => !s.scenarioIds.includes(scenarioCategoryId)),
    [appScreens, scenarioCategoryId]
  );

  const filtered = useMemo(() => {
    if (!search.trim()) return available;
    const q = search.toLowerCase();
    return available.filter((s) => s.id.toLowerCase().includes(q));
  }, [available, search]);

  if (!isOpen) return null;

  const toggle = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleClose = () => {
    setSelectedIds([]);
    setSearch('');
    setError('');
    onClose();
  };

  const handleSave = async () => {
    if (selectedIds.length === 0) return;
    setSaving(true);
    setError('');
    try {
      await Promise.all(
        selectedIds.map((screenId) => {
          const screen = appScreens.find((s) => s.id === screenId);
          if (!screen) return Promise.resolve();
          return updateAdminScreen(screenId, {
            senarys: [...screen.scenarioIds, scenarioCategoryId],
          });
        })
      );
      onSuccess(selectedIds);
      handleClose();
    } catch (e) {
      console.error(e);
      setError('Не удалось добавить экраны');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60" onClick={handleClose} aria-hidden />
      <div className="relative w-full max-w-3xl bg-[#141414] border border-[#2a2a2a] rounded-xl shadow-soft-lg flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[#2a2a2a]">
          <h2 className="text-lg font-medium">Добавить экраны в сценарий</h2>
          <button
            onClick={handleClose}
            className="p-1 hover:bg-[#1a1a1a] rounded transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-[#2a2a2a]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#6b6b6b]" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Поиск экранов..."
              className="w-full pl-10 pr-4 py-2.5 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg focus:outline-none focus:border-[#a3e635] transition-colors text-sm"
            />
          </div>
        </div>

        {/* Grid */}
        <div className="flex-1 overflow-y-auto p-4">
          {filtered.length === 0 ? (
            <div className="text-center py-12 text-[#a1a1a1] text-sm">
              {available.length === 0
                ? 'Все экраны уже добавлены в этот сценарий'
                : 'Ничего не найдено'}
            </div>
          ) : (
            <div className="flex flex-wrap gap-3">
              {filtered.map((screen) => {
                const selected = selectedIds.includes(screen.id);
                return (
                  <button
                    key={screen.id}
                    type="button"
                    onClick={() => toggle(screen.id)}
                    style={{ width: 110, height: 195, flexShrink: 0 }}
                    className={`relative rounded-lg overflow-hidden border-2 transition-all ${
                      selected
                        ? 'border-[#a3e635]'
                        : 'border-transparent hover:border-[#3a3a3a]'
                    }`}
                  >
                    <div className="w-full h-full bg-[#1a1a1a]">
                      {screen.imageUrl && (
                        <img
                          src={screen.imageUrl}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      )}
                    </div>
                    {selected && (
                      <div className="absolute top-2 right-2 w-5 h-5 bg-[#a3e635] rounded-full flex items-center justify-center">
                        <Check className="h-3 w-3 text-black" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#2a2a2a] flex items-center justify-between">
          <div>
            <span className="text-sm text-[#a1a1a1]">
              {selectedIds.length > 0
                ? `Выбрано: ${selectedIds.length}`
                : 'Выберите экраны'}
            </span>
            {error && <p className="text-xs text-red-400 mt-1">{error}</p>}
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleClose}
              className="px-4 py-2 bg-[#1a1a1a] border border-[#2a2a2a] text-white rounded-lg hover:bg-[#242424] transition-colors text-sm"
            >
              Отмена
            </button>
            <button
              onClick={handleSave}
              disabled={selectedIds.length === 0 || saving}
              className="px-4 py-2 bg-white text-black font-medium rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            >
              {saving ? 'Добавление...' : 'Добавить'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
