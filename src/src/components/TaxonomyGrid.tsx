import { useState } from 'react';
import { MoreVertical, Pencil, Trash2 } from 'lucide-react';
import type { TaxonomyItem } from '@/lib/types';

interface TaxonomyGridProps {
  items: TaxonomyItem[];
  onEdit: (item: TaxonomyItem) => void;
  onDelete: (id: string) => void;
}

export function TaxonomyGrid({ items, onEdit, onDelete }: TaxonomyGridProps) {
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
      {items.map((item) => (
        <div
          key={item.id}
          className="group bg-[#141414] border border-[#2a2a2a] rounded-xl p-4 hover:border-[#3a3a3a] transition-all hover:shadow-soft relative"
        >
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-medium truncate flex-1">{item.name}</h3>
            
            <div className="relative">
              <button
                onClick={() => setOpenMenuId(openMenuId === item.id ? null : item.id)}
                className="p-1 hover:bg-[#1a1a1a] rounded transition-colors opacity-0 group-hover:opacity-100"
              >
                <MoreVertical className="h-4 w-4 text-[#a1a1a1]" />
              </button>

              {openMenuId === item.id && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setOpenMenuId(null)}
                  />
                  <div className="absolute right-0 top-8 z-20 w-48 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg shadow-soft-lg overflow-hidden">
                    <button
                      onClick={() => {
                        onEdit(item);
                        setOpenMenuId(null);
                      }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-[#242424] transition-colors text-sm"
                    >
                      <Pencil className="h-4 w-4" />
                      Редактировать
                    </button>
                    <button
                      onClick={() => {
                        onDelete(item.id);
                        setOpenMenuId(null);
                      }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-[#242424] transition-colors text-sm text-red-400"
                    >
                      <Trash2 className="h-4 w-4" />
                      Удалить
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}