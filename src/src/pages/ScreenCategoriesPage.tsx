import { useEffect, useState } from 'react';
import { ArrowLeft, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  fetchScreensCategories,
  createScreenCategory,
  updateScreenCategory,
  deleteScreenCategory,
} from '../lib/api/screensCategoriesApi';
import type { ScreenCategoryItem } from '../lib/api/screensCategoriesApi';
import type { TaxonomyItem } from '../lib/types';
import { PageHeader } from '../components/PageHeader';
import { SearchInput } from '../components/SearchInput';
import { TaxonomyGrid } from '../components/TaxonomyGrid';
import { AddTaxonomyDialog } from '../components/AddTaxonomyDialog';
import { ConfirmDialog } from '../components/ConfirmDialog';

function toTaxonomyItem(item: ScreenCategoryItem): TaxonomyItem {
  return { id: item.id, name: item.name, type: 'screenCategory' };
}

export function ScreenCategoriesPage() {
  const [items, setItems] = useState<TaxonomyItem[]>([]);
  const [search, setSearch] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<TaxonomyItem | null>(null);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadData = async (searchTerm?: string) => {
    setLoading(true);
    try {
      const data = await fetchScreensCategories(searchTerm);
      setItems(data.map(toTaxonomyItem));
    } catch (e) {
      console.error(e);
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const t = setTimeout(() => loadData(search.trim() || undefined), 300);
    return () => clearTimeout(t);
  }, [search]);

  const handleSave = async (name: string) => {
    if (editingItem) {
      await updateScreenCategory(editingItem.id, { name: name.trim() });
    } else {
      await createScreenCategory(name);
    }
    setEditingItem(null);
    loadData(search.trim() || undefined);
  };

  const handleDeleteClick = (id: string) => setDeleteTargetId(id);

  const handleDeleteConfirm = async () => {
    if (!deleteTargetId) return;
    setDeleting(true);
    try {
      await deleteScreenCategory(deleteTargetId);
      setDeleteTargetId(null);
      loadData(search.trim() || undefined);
    } catch (e) {
      console.error(e);
    } finally {
      setDeleting(false);
    }
  };

  const filteredItems = items;

  return (
    <div className="p-8">
      <Link
        to="/categories"
        className="inline-flex items-center gap-2 text-[#a1a1a1] hover:text-white transition-colors mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        Назад к категориям
      </Link>

      <PageHeader
        title="Категория экрана"
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
          placeholder="Поиск категорий экрана..."
        />
      </div>

      {loading ? (
        <div className="text-center py-12 text-[#a1a1a1]">Загрузка...</div>
      ) : filteredItems.length === 0 ? (
        <div className="text-center py-12 text-[#a1a1a1]">
          {search ? 'Ничего не найдено' : 'Категории экрана не добавлены'}
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
        title="Удалить категорию?"
        description="Вы уверены, что хотите удалить эту категорию экрана? Это действие нельзя отменить."
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
        title={editingItem ? 'Редактировать категорию' : 'Добавить категорию экрана'}
        initialValue={editingItem?.name}
      />
    </div>
  );
}
