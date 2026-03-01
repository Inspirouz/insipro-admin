'use client';

import { useEffect, useState } from 'react';
import { ArrowLeft, Plus } from 'lucide-react';
import Link from 'next/link';
import { fetchTags, createTag, updateTag, deleteTag } from '@/lib/api/tagsApi';
import type { TagItem } from '@/lib/api/tagsApi';
import type { TaxonomyItem } from '@/lib/types';
import { PageHeader } from '@/components/PageHeader';
import { SearchInput } from '@/components/SearchInput';
import { TaxonomyGrid } from '@/components/TaxonomyGrid';
import { AddTaxonomyDialog } from '@/components/AddTaxonomyDialog';
import { ConfirmDialog } from '@/components/ConfirmDialog';

const TAG_TYPE = 'patterns';

function toTaxonomyItem(tag: TagItem): TaxonomyItem {
  return { id: tag.id, name: tag.name, type: 'pattern' };
}

export default function PatternsPage() {
  const [items, setItems] = useState<TaxonomyItem[]>([]);
  const [search, setSearch] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<TaxonomyItem | null>(null);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const data = await fetchTags(TAG_TYPE);
      setItems(data.map(toTaxonomyItem));
    } catch (e) {
      console.error(e);
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (name: string) => {
    if (editingItem) {
      await updateTag(editingItem.id, { name: name.trim(), type: TAG_TYPE });
    } else {
      await createTag(name, TAG_TYPE);
    }
    setEditingItem(null);
    loadData();
  };

  const handleDeleteClick = (id: string) => setDeleteTargetId(id);

  const handleDeleteConfirm = async () => {
    if (!deleteTargetId) return;
    setDeleting(true);
    try {
      await deleteTag(deleteTargetId);
      setDeleteTargetId(null);
      loadData();
    } catch (e) {
      console.error(e);
    } finally {
      setDeleting(false);
    }
  };

  const filteredItems = items.filter(item =>
    item.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-8">
      <Link
        href="/categories"
        className="inline-flex items-center gap-2 text-[#a1a1a1] hover:text-white transition-colors mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        Назад к категориям
      </Link>

      <PageHeader
        title="Паттерны"
        actions={
          <button
            onClick={() => {
              setEditingItem(null);
              setIsDialogOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2.5 bg-white text-black font-medium rounded-lg hover:bg-gray-100 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Добавить
          </button>
        }
      />

      <div className="mb-6">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Поиск паттернов..."
        />
      </div>

      {loading ? (
        <div className="text-center py-12 text-[#a1a1a1]">Загрузка...</div>
      ) : filteredItems.length === 0 ? (
        <div className="text-center py-12 text-[#a1a1a1]">
          {search ? 'Ничего не найдено' : 'Паттерны не добавлены'}
        </div>
      ) : (
        <TaxonomyGrid
          items={filteredItems}
          onEdit={(item) => {
            setEditingItem(item);
            setIsDialogOpen(true);
          }}
          onDelete={handleDeleteClick}
        />
      )}

      <ConfirmDialog
        isOpen={!!deleteTargetId}
        onClose={() => setDeleteTargetId(null)}
        onConfirm={handleDeleteConfirm}
        title="Удалить паттерн?"
        description="Вы уверены, что хотите удалить этот паттерн? Это действие нельзя отменить."
        confirmLabel="Удалить"
        cancelLabel="Отмена"
        variant="danger"
        loading={deleting}
      />

      <AddTaxonomyDialog
        isOpen={isDialogOpen}
        onClose={() => {
          setIsDialogOpen(false);
          setEditingItem(null);
        }}
        onSave={handleSave}
        title={editingItem ? 'Редактировать паттерн' : 'Добавить паттерн'}
        initialValue={editingItem?.name}
      />
    </div>
  );
}
