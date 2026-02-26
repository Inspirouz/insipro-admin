import { useEffect, useState } from 'react';
import { ArrowLeft, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';
import { fetchAppCategories, createCategory, updateCategory, deleteCategory } from '../lib/api/categoriesApi';
import type { TaxonomyItem } from '../lib/types';
import { PageHeader } from '../components/PageHeader';
import { SearchInput } from '../components/SearchInput';
import { TaxonomyGrid } from '../components/TaxonomyGrid';
import { AddTaxonomyDialog } from '../components/AddTaxonomyDialog';
import { ConfirmDialog } from '../components/ConfirmDialog';

export function AppCategoriesPage() {
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
      const data = await fetchAppCategories();
      setItems(data.map((c) => ({ ...c, type: 'appCategory' as const })));
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (name: string) => {
    if (editingItem) {
      await updateCategory(editingItem.id, { name });
    } else {
      await createCategory({ name });
    }
    setEditingItem(null);
    loadData();
  };

  const handleDeleteClick = (id: string) => setDeleteTargetId(id);

  const handleDeleteConfirm = async () => {
    if (!deleteTargetId) return;
    setDeleting(true);
    try {
      await deleteCategory(deleteTargetId);
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
        to="/categories"
        className="inline-flex items-center gap-2 text-[#a1a1a1] hover:text-white transition-colors mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        Назад к категориям
      </Link>

      <PageHeader
        title="Категории приложений"
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
          placeholder="Поиск категорий..."
        />
      </div>

      {loading ? (
        <div className="text-center py-12 text-[#a1a1a1]">Загрузка...</div>
      ) : filteredItems.length === 0 ? (
        <div className="text-center py-12 text-[#a1a1a1]">
          {search ? 'Ничего не найдено' : 'Категории не добавлены'}
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
        description="Вы уверены, что хотите удалить эту категорию? Это действие нельзя отменить."
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
        title={editingItem ? 'Редактировать категорию' : 'Добавить категорию'}
        initialValue={editingItem?.name}
      />
    </div>
  );
}