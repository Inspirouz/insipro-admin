import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Plus, Trash2, Pencil } from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  fetchScenarioCategories,
  createScenarioCategory,
  updateScenarioCategory,
  deleteScenarioCategory,
} from '../lib/api/scenarioCategoriesApi';
import type { ScenarioCategoryItem } from '../lib/api/scenarioCategoriesApi';
import { PageHeader } from '../components/PageHeader';
import { SearchInput } from '../components/SearchInput';
import { AddTaxonomyDialog } from '../components/AddTaxonomyDialog';
import { ConfirmDialog } from '../components/ConfirmDialog';

type ScenarioNode = ScenarioCategoryItem & { children: ScenarioNode[] };

export function ScenarioCategoriesPage() {
  const [items, setItems] = useState<ScenarioCategoryItem[]>([]);
  const [search, setSearch] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ScenarioCategoryItem | null>(null);
  const [parentForNew, setParentForNew] = useState<ScenarioCategoryItem | null>(null);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadData = async (searchTerm?: string) => {
    setLoading(true);
    try {
      const data = await fetchScenarioCategories(searchTerm);
      setItems(data);
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
      await updateScenarioCategory(editingItem.id, { name: name.trim() });
    } else {
      await createScenarioCategory(name, 0, parentForNew?.id);
    }
    setEditingItem(null);
    setParentForNew(null);
    loadData(search.trim() || undefined);
  };

  const handleDeleteClick = (id: string) => setDeleteTargetId(id);

  const handleDeleteConfirm = async () => {
    if (!deleteTargetId) return;
    setDeleting(true);
    try {
      await deleteScenarioCategory(deleteTargetId);
      setDeleteTargetId(null);
      loadData(search.trim() || undefined);
    } catch (e) {
      console.error(e);
    } finally {
      setDeleting(false);
    }
  };

  const tree: ScenarioNode[] = useMemo(() => {
    const map = new Map<string, ScenarioNode>();
    const roots: ScenarioNode[] = [];

    items.forEach((item) => {
      map.set(item.id, { ...item, children: [] });
    });

    map.forEach((node) => {
      if (node.parent_id && map.has(node.parent_id)) {
        map.get(node.parent_id)!.children.push(node);
      } else {
        roots.push(node);
      }
    });

    const sortNodes = (list: ScenarioNode[]) => {
      list.sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
      list.forEach((n) => sortNodes(n.children));
    };
    sortNodes(roots);
    return roots;
  }, [items]);

  const filteredTree = tree; // серверда search bo‘lgani uchun shu yetarli

  return (
    <div className="p-8">
      <Link
        to="/categories"
        className="inline-flex items-center gap-2 text-[#a1a1a1] hover:text-white transition-colors mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        Назад к категориям
      </Link>

      <PageHeader title="Категории сценариев" />

      <div className="mb-6">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Поиск категорий сценариев..."
        />
      </div>

      <div className="bg-[#111111] border border-[#2a2a2a] rounded-3xl p-6 space-y-4">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-semibold">Структура сценариев</h2>
          <button
            onClick={() => {
              setEditingItem(null);
              setParentForNew(null);
              setIsDialogOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2.5 bg-white text-black font-medium rounded-lg hover:bg-gray-100 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Добавить корневую
          </button>
        </div>

        <div className="rounded-2xl bg-[#141414] border border-[#2a2a2a] max-h-[520px] overflow-auto p-4 space-y-1">
          {loading ? (
            <div className="text-center py-12 text-[#a1a1a1]">Загрузка...</div>
          ) : filteredTree.length === 0 ? (
            <div className="text-center py-12 text-[#a1a1a1]">
              {search ? 'Ничего не найдено' : 'Категории сценариев не добавлены'}
            </div>
          ) : (
            filteredTree.map((node, index) => (
              <ScenarioRow
                key={node.id}
                node={node}
                depth={0}
                indexPrefix={`${index + 1}.`}
                onAddChild={(n) => {
                  setParentForNew(n);
                  setEditingItem(null);
                  setIsDialogOpen(true);
                }}
                onEdit={(n) => {
                  setEditingItem(n);
                  setParentForNew(null);
                  setIsDialogOpen(true);
                }}
                onDelete={(id) => handleDeleteClick(id)}
              />
            ))
          )}
        </div>
      </div>

      <ConfirmDialog
        isOpen={!!deleteTargetId}
        onClose={() => setDeleteTargetId(null)}
        onConfirm={handleDeleteConfirm}
        title="Удалить категорию?"
        description="Вы уверены, что хотите удалить эту категорию сценариев? Это действие нельзя отменить."
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
          setParentForNew(null);
        }}
        onSave={handleSave}
        title={
          editingItem
            ? 'Редактировать категорию'
            : parentForNew
            ? `Добавить подкатегорию для "${parentForNew.name}"`
            : 'Добавить категорию сценариев'
        }
        initialValue={editingItem?.name}
      />
    </div>
  );
}

interface ScenarioRowProps {
  node: ScenarioNode;
  depth: number;
  indexPrefix: string;
  onAddChild: (node: ScenarioCategoryItem) => void;
  onEdit: (node: ScenarioCategoryItem) => void;
  onDelete: (id: string) => void;
}

function ScenarioRow({ node, depth, indexPrefix, onAddChild, onEdit, onDelete }: ScenarioRowProps) {
  const rowBox = (
    <div
      className={`flex items-center gap-3 rounded-xl transition-colors border border-[#242424] ${
        depth === 0
          ? 'px-4 py-3 bg-[#1b1b1b] hover:bg-[#222222]'
          : 'px-3 py-2 bg-[#191919] hover:bg-[#202020]'
      }`}
    >
      <div className="text-sm text-[#717171] min-w-[48px]">{indexPrefix}</div>
      <button
        type="button"
        onClick={() => onEdit(node)}
        className="flex-1 text-left text-sm text-white"
      >
        {node.name}
      </button>
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => onAddChild(node)}
          className="p-1.5 rounded-full bg-[#262626] hover:bg-[#333333] text-white transition-colors"
          title="Добавить подкатегорию"
        >
          <Plus className="h-3 w-3" />
        </button>
        <button
          type="button"
          onClick={() => onEdit(node)}
          className="p-1.5 rounded-full bg-[#262626] hover:bg-[#333333] text-white transition-colors"
          title="Редактировать"
        >
          <Pencil className="h-3 w-3" />
        </button>
        <button
          type="button"
          onClick={() => onDelete(node.id)}
          className="p-1.5 rounded-full bg-[#3b1111] hover:bg-[#4a1717] text-red-300 transition-colors"
          title="Удалить"
        >
          <Trash2 className="h-3 w-3" />
        </button>
      </div>
    </div>
  );

  if (node.children.length > 0) {
    return (
      <div className={`space-y-1.5 ${depth === 0 ? 'mt-1' : 'mt-0.5'}`}>
        <div className="rounded-xl border border-[#242424] bg-[#161616] p-2.5 space-y-1.5">
          {rowBox}
          <div className="pl-4 border-l-2 border-[#2a2a2a] ml-2 space-y-1">
            {node.children.map((child, idx) => (
              <ScenarioRow
                key={child.id}
                node={child}
                depth={depth + 1}
                indexPrefix={`${indexPrefix}${idx + 1}.`}
                onAddChild={onAddChild}
                onEdit={onEdit}
                onDelete={onDelete}
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={depth === 0 ? 'mt-1' : 'mt-0.5'}>
      {rowBox}
    </div>
  );
}

