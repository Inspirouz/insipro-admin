import { useState } from 'react';
import { Check, ChevronDown, X } from 'lucide-react';

interface Item {
  id: string;
  name: string;
}

interface MultiSelectFieldProps {
  label: string;
  items: Item[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
}

export function MultiSelectField({ label, items, selectedIds, onChange }: MultiSelectFieldProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');

  const selectedItems = items.filter(item => selectedIds.includes(item.id));
  const filteredItems = items.filter(item =>
    item.name.toLowerCase().includes(search.toLowerCase())
  );

  const toggleItem = (id: string) => {
    if (selectedIds.includes(id)) {
      onChange(selectedIds.filter(i => i !== id));
    } else {
      onChange([...selectedIds, id]);
    }
  };

  const removeItem = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(selectedIds.filter(i => i !== id));
  };

  return (
    <div>
      <label className="block text-sm font-medium mb-2">{label}</label>
      
      {/* Selected items */}
      {selectedItems.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-2">
          {selectedItems.map((item) => (
            <span
              key={item.id}
              className="inline-flex items-center gap-1 px-2 py-1 bg-[#1a1a1a] border border-[#2a2a2a] rounded-md text-sm"
            >
              {item.name}
              <button
                onClick={(e) => removeItem(item.id, e)}
                className="hover:text-red-400 transition-colors"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Dropdown */}
      <div className="relative">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="w-full px-4 py-2.5 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg focus:outline-none focus:border-[#a3e635] transition-colors text-left flex items-center justify-between"
        >
          <span className="text-[#a1a1a1]">
            {selectedIds.length > 0 ? `Выбрано: ${selectedIds.length}` : 'Выберите...'}
          </span>
          <ChevronDown className="h-4 w-4 text-[#6b6b6b]" />
        </button>

        {isOpen && (
          <>
            <div
              className="fixed inset-0 z-10"
              onClick={() => setIsOpen(false)}
            />
            <div className="absolute z-20 w-full mt-2 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg shadow-soft-lg overflow-hidden">
              {/* Search */}
              <div className="p-2 border-b border-[#2a2a2a]">
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Поиск..."
                  className="w-full px-3 py-2 bg-[#141414] border border-[#2a2a2a] rounded-lg focus:outline-none focus:border-[#a3e635] transition-colors text-sm"
                  onClick={(e) => e.stopPropagation()}
                />
              </div>

              {/* Items */}
              <div className="max-h-60 overflow-y-auto">
                {filteredItems.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => toggleItem(item.id)}
                    className="w-full flex items-center gap-3 px-3 py-2 hover:bg-[#242424] transition-colors text-sm"
                  >
                    <div className={`w-4 h-4 rounded border flex items-center justify-center ${
                      selectedIds.includes(item.id)
                        ? 'bg-[#a3e635] border-[#a3e635]'
                        : 'border-[#2a2a2a]'
                    }`}>
                      {selectedIds.includes(item.id) && (
                        <Check className="h-3 w-3 text-black" />
                      )}
                    </div>
                    <span>{item.name}</span>
                  </button>
                ))}
                {filteredItems.length === 0 && (
                  <div className="px-3 py-4 text-sm text-center text-[#6b6b6b]">
                    Ничего не найдено
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}