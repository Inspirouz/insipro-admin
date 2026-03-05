'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import { ArrowLeft, Pencil, Plus, Trash2 } from 'lucide-react';
import { apiClient } from '@/lib/api';
import { fetchScreensCategories } from '@/lib/api/screensCategoriesApi';
import { fetchScenarioCategories, deleteScenarioCategory, type ScenarioCategoryItem } from '@/lib/api/scenarioCategoriesApi';
import { fetchAdminScreens } from '@/lib/api/adminScreensApi';
import { fetchAdminScenariosByProject, type ScenarioCategoryWithScenarios } from '@/lib/api/scenariosApi';
import { getProjectImageUrl } from '@/lib/api/projectsApi';
import { AddScenarioCategoryModal } from '@/components/AddScenarioCategoryModal';
import { AddScenarioModal } from '@/components/AddScenarioModal';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import type { App, Screen, TaxonomyItem } from '@/lib/types';

type ScenarioCategoryFlat = { id: string; name: string; parent_id?: string | null; scenarios_count?: number };
type ScenarioCategoryNode = { id: string; name: string; children: ScenarioCategoryNode[]; scenarios_count?: number };

function buildScenarioTree(items: ScenarioCategoryFlat[]): ScenarioCategoryNode[] {
  const byId = new Map<string, ScenarioCategoryNode>();
  items.forEach((item) => byId.set(item.id, { id: item.id, name: item.name, children: [], scenarios_count: item.scenarios_count }));
  const roots: ScenarioCategoryNode[] = [];
  items.forEach((item) => {
    const node = byId.get(item.id)!;
    const parentId = item.parent_id ?? null;
    if (parentId && byId.has(parentId)) {
      byId.get(parentId)!.children.push(node);
    } else {
      roots.push(node);
    }
  });
  return roots;
}

function ScenarioCategoryTreeItem({
  node,
  depth,
  selectedId,
  onSelect,
  onAddChild,
  onEdit,
  onDelete,
}: {
  node: ScenarioCategoryNode;
  depth: number;
  selectedId: string | null;
  onSelect: (id: string) => void;
  onAddChild: (id: string, name: string) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  isLast?: boolean;
}) {
  const isSelected = selectedId === node.id;
  const hasChildren = node.children.length > 0;
  const count = node.scenarios_count ?? 0;

  return (
    <div className="py-0.5">
      {/* Row: optional horizontal connector + content */}
      <div
        style={{ paddingLeft: depth > 0 ? 12 + depth * 16 : 0 }}
        className={`flex items-center rounded-md text-sm ${
          isSelected ? 'bg-[#a3e635] text-black font-medium' : 'text-[#e5e5e5] hover:bg-[#1f1f1f]'
        }`}
      >
        {depth > 0 && (
          <div className="flex-shrink-0 w-3 border-b border-[#404040] mr-1 self-center" aria-hidden />
        )}
        <button
          type="button"
          onClick={() => onSelect(node.id)}
          className={`flex-1 min-w-0 flex items-center gap-2 px-2 py-1.5 rounded-md text-left transition-colors ${
            isSelected ? 'hover:bg-[#b8ec44]/80' : ''
          }`}
        >
          <span className="truncate">{node.name}</span>
          <span className={`flex-shrink-0 text-xs tabular-nums ${isSelected ? 'text-black/80' : 'text-[#a1a1a1]'}`}>
            {count}
          </span>
        </button>
        <div className="flex items-center gap-0.5 flex-shrink-0 pr-1">
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onEdit(node.id); }}
            className="p-1 rounded hover:bg-black/20 transition-colors"
            title="Редактировать"
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
          {depth < 2 && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onAddChild(node.id, node.name); }}
              className="p-1 rounded hover:bg-black/20 transition-colors"
              title="Добавить подкатегорию"
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
          )}
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onDelete(node.id); }}
            className="p-1 rounded hover:bg-red-500/20 text-red-400 transition-colors"
            title="Удалить"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {hasChildren && (
        <div className="border-l border-[#404040] ml-2 pl-2 mt-0.5 space-y-0.5">
          {node.children.map((child) => (
            <ScenarioCategoryTreeItem
              key={child.id}
              node={child}
              depth={depth + 1}
              selectedId={selectedId}
              onSelect={onSelect}
              onAddChild={onAddChild}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}

const TAB_VALUES = ['screens', 'scenarios', 'videos'] as const;
type TabId = (typeof TAB_VALUES)[number];

function getTabFromSearchParams(searchParams: URLSearchParams): TabId {
  const t = searchParams.get('tab');
  return (TAB_VALUES.includes(t as TabId) ? t : 'screens') as TabId;
}

export default function AppDetailPage() {
  const params = useParams();
  const [searchParams, setSearchParams] = useSearchParams();

  const appId = params.id as string;
  const activeTab = getTabFromSearchParams(searchParams);
  const setActiveTab = (tab: TabId) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set('tab', tab);
      return next;
    });
  };

  const [app, setApp] = useState<App | null>(null);
  const [screens, setScreens] = useState<Screen[]>([]);
  const [screenCategories, setScreenCategories] = useState<TaxonomyItem[]>([]);
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const [scenarioCategoriesRaw, setScenarioCategoriesRaw] = useState<ScenarioCategoryItem[]>([]);
  const [scenarioCategoryFilter, setScenarioCategoryFilter] = useState<string | null>(null);
  const [scenarioCategoryModalOpen, setScenarioCategoryModalOpen] = useState(false);
  const [scenarioCategoryParentId, setScenarioCategoryParentId] = useState<string | null>(null);
  const [scenarioCategoryParentName, setScenarioCategoryParentName] = useState<string>('');
  const [editingScenarioCategoryId, setEditingScenarioCategoryId] = useState<string | null>(null);
  const [deleteScenarioCategoryId, setDeleteScenarioCategoryId] = useState<string | null>(null);
  const [deletingScenarioCategory, setDeletingScenarioCategory] = useState(false);
  const [loading, setLoading] = useState(true);
  const [scenariosList, setScenariosList] = useState<ScenarioCategoryWithScenarios[]>([]);
  const [scenariosLoading, setScenariosLoading] = useState(false);
  const [scenarioModalOpen, setScenarioModalOpen] = useState(false);
  const [scenarioModalCategoryId, setScenarioModalCategoryId] = useState<string | null>(null);
  const scenarioSectionRefs = useRef<Record<string, HTMLDivElement | null>>({});

  useEffect(() => {
    loadData();
  }, [appId]);

  useEffect(() => {
    if (activeTab === 'scenarios' && scenarioCategoryFilter) {
      const el = scenarioSectionRefs.current[scenarioCategoryFilter];
      el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [activeTab, scenarioCategoryFilter]);

  useEffect(() => {
    if (activeTab === 'scenarios' && appId) {
      setScenariosLoading(true);
      fetchAdminScenariosByProject(appId)
        .then(setScenariosList)
        .catch((e) => {
          console.error(e);
          setScenariosList([]);
        })
        .finally(() => setScenariosLoading(false));
    }
  }, [activeTab, appId]);

  const loadData = async () => {
    try {
      const [appData, screensData, categoriesData, scenarioCategoriesData] = await Promise.all([
        apiClient.getApp(appId),
        fetchAdminScreens(appId),
        fetchScreensCategories(undefined, appId),
        fetchScenarioCategories(undefined, appId),
      ]);
      setApp(appData);
      setScreens(screensData);
      setScreenCategories(
        categoriesData.map((c) => ({ id: c.id, name: c.name, type: 'screenCategory' as const, screens_count:c?.screens_count }))
      );
      setScenarioCategoriesRaw(scenarioCategoriesData);
    } finally {
      setLoading(false);
    }
  };

  const getCategory = (categoryId: string) => {
    return screenCategories.find(c => c.id === categoryId);
  };

  const filteredScreens = categoryFilter
    ? screens.filter(s => s.categoryId === categoryFilter)
    : screens;

  const scenarioCategoriesFlat = useMemo(
    () =>
      scenarioCategoriesRaw.map((c) => ({
        id: c.id,
        name: c.name,
        parent_id: c.parent_id ?? null,
        scenarios_count: c.scenarios_count,
      })),
    [scenarioCategoriesRaw]
  );

  const scenarioCategoryTree = useMemo(
    () => buildScenarioTree(scenarioCategoriesFlat),
    [scenarioCategoriesFlat]
  );

  const refetchScenarioCategories = async () => {
    try {
      const data = await fetchScenarioCategories(undefined, appId);
      setScenarioCategoriesRaw(data);
    } catch (e) {
      console.error(e);
    }
  };

  const refetchScenarios = async () => {
    if (!appId) return;
    try {
      const data = await fetchAdminScenariosByProject(appId);
      setScenariosList(data);
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteScenarioCategoryConfirm = async () => {
    if (!deleteScenarioCategoryId) return;
    setDeletingScenarioCategory(true);
    try {
      await deleteScenarioCategory(deleteScenarioCategoryId);
      setDeleteScenarioCategoryId(null);
      await refetchScenarioCategories();
    } catch (e) {
      console.error(e);
    } finally {
      setDeletingScenarioCategory(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-[#a1a1a1]">Загрузка...</div>;
  }

  if (!app) {
    return <div className="p-8 text-center text-[#a1a1a1]">Приложение не найдено</div>;
  }

  return (
    <div className="p-8">
      <Link
        to="/apps"
        className="inline-flex items-center gap-2 text-[#a1a1a1] hover:text-white transition-colors mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        Назад к приложениям
      </Link>

      {/* App Header */}
      <div className="bg-[#141414] border border-[#2a2a2a] rounded-xl p-6 mb-6">
        <div className="flex items-start gap-6">
          <div className="w-20 h-20 rounded-xl overflow-hidden flex-shrink-0 bg-[#1a1a1a]">
            {app.iconUrl ? (
              <img src={app.iconUrl} alt={app.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-2xl text-[#6b6b6b]">
                {app.name[0]}
              </div>
            )}
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-semibold mb-2">{app.name}</h1>
            <p className="text-[#a1a1a1] mb-4">{app.description}</p>
            <div className="flex items-center gap-4 text-sm text-[#a1a1a1]">
              <div className="flex gap-2">
                {app.platforms.map((platform) => (
                  <span
                    key={platform}
                    className="px-2 py-1 bg-[#1a1a1a] rounded-md uppercase"
                  >
                    {platform}
                  </span>
                ))}
              </div>
              <span>•</span>
              <span>{new Date(app.createdAt).toLocaleDateString('ru-RU')}</span>
            </div>
          </div>
          <Link
            to={`/apps/${app.id}/edit`}
            className="flex items-center gap-2 px-4 py-2.5 bg-white text-black font-medium rounded-lg hover:bg-gray-100 transition-colors"
          >
            <Pencil className="h-4 w-4" />
            Редактировать
          </Link>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-[#2a2a2a] mb-6">
        <div className="flex gap-6">
          {[
            { id: 'screens', label: 'Экраны', count: screens.length },
            { id: 'scenarios', label: 'Сценарии' },
            { id: 'videos', label: 'Видео' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabId)}
              className={`px-1 py-3 font-medium transition-colors relative ${
                activeTab === tab.id
                  ? 'text-[#a3e635]'
                  : 'text-[#a1a1a1] hover:text-white'
              }`}
            >
              {tab.label}
              {tab.count !== undefined && (
                <span className="ml-2 text-sm">({tab.count})</span>
              )}
              {activeTab === tab.id && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#a3e635]" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Screens Tab */}
      {activeTab === 'screens' && (
        <div className="flex gap-6">
          {/* Sidebar Filter */}
          <div className="w-64 flex-shrink-0">
            <div className="bg-[#141414] border border-[#2a2a2a] rounded-xl p-4">
              <h3 className="font-medium mb-4">Категории</h3>
              <div className="space-y-1">
                <button
                  onClick={() => setCategoryFilter(null)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors ${
                    categoryFilter === null
                      ? 'bg-[#a3e635] text-black font-medium'
                      : 'text-[#a1a1a1] hover:bg-[#1a1a1a]'
                  }`}
                >
                  <span>Все</span>
                  <span>{screens.length}</span>
                </button>
                {screenCategories.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => setCategoryFilter(category.id)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors ${
                      categoryFilter === category.id
                        ? 'bg-[#a3e635] text-black font-medium'
                        : 'text-[#a1a1a1] hover:bg-[#1a1a1a]'
                    }`}
                  >
                    <span>{category.name}</span>
                    <span>{category?.screens_count || 0}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Screens Grid */}
          <div className="flex-1">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-medium">
                {categoryFilter
                  ? getCategory(categoryFilter)?.name
                  : 'Все экраны'}
              </h2>
              <Link
                to={`/apps/${app.id}/screens/new`}
                className="flex items-center gap-2 px-4 py-2.5 bg-white text-black font-medium rounded-lg hover:bg-gray-100 transition-colors"
              >
                <Plus className="h-4 w-4" />
                Добавить
              </Link>
            </div>

            {filteredScreens.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-[#a1a1a1] mb-4">Экраны не найдены</p>
                <Link
                  to={`/apps/${app.id}/screens/new`}
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-white text-black font-medium rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <Plus className="h-4 w-4" />
                  Добавить первый экран
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {filteredScreens.map((screen) => (
                  <Link
                    key={screen.id}
                    to={`/screens/${screen.id}`}
                    className="group bg-[#141414] border border-[#2a2a2a] rounded-xl overflow-hidden hover:border-[#3a3a3a] transition-all hover:shadow-soft"
                  >
                    <div className="aspect-[9/16] bg-[#1a1a1a]">
                      <img
                        src={screen.imageUrl}
                        alt="Screen"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="p-3">
                      <p className="text-xs text-[#a1a1a1]">
                        {getCategory(screen.categoryId)?.name}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Scenarios Tab */}
      {activeTab === 'scenarios' && (
        <div className="flex flex-nowrap gap-4 w-full max-w-5xl items-start">
          <div className="w-1/3 flex-shrink-0 min-w-0">
            <div className="sticky overflow-y-auto rounded-xl border border-[#2a2a2a] bg-[#141414] p-4" style={{ top: 20, maxHeight: 'calc(100vh - 40px)' }}>
            <div className="flex items-center justify-between gap-2 mb-3">
              <h3 className="font-medium">Категории сценариев</h3>
              <button
                type="button"
                onClick={() => {
                  setScenarioCategoryParentId(null);
                  setScenarioCategoryParentName('');
                  setEditingScenarioCategoryId(null);
                  setScenarioCategoryModalOpen(true);
                }}
                className="flex items-center justify-center gap-2 px-3 py-1.5 rounded-lg bg-[#a3e635] text-black text-sm font-medium hover:bg-[#b8ec44] transition-colors flex-shrink-0"
                title="Добавить категорию"
              >
                <Plus className="h-4 w-4" />
                Добавить
              </button>
            </div>
            <div className="space-y-0.5 mb-4">
              {scenarioCategoryTree.map((node) => (
                <ScenarioCategoryTreeItem
                  key={node.id}
                  node={node}
                  depth={0}
                  selectedId={scenarioCategoryFilter}
                  onSelect={setScenarioCategoryFilter}
                  onAddChild={(id, name) => {
                    setScenarioCategoryParentId(id);
                    setScenarioCategoryParentName(name);
                    setEditingScenarioCategoryId(null);
                    setScenarioCategoryModalOpen(true);
                  }}
                  onEdit={(id) => {
                    setEditingScenarioCategoryId(id);
                    setScenarioCategoryParentId(null);
                    setScenarioCategoryParentName('');
                    setScenarioCategoryModalOpen(true);
                  }}
                  onDelete={setDeleteScenarioCategoryId}
                />
              ))}
            </div>
            <div className="pt-4 border-t border-[#2a2a2a]">
              <p className="text-xs font-medium text-[#a1a1a1] mb-2">Ответ API</p>
              {scenarioCategoriesRaw.length === 0 ? (
                <p className="text-[#a1a1a1] text-sm">Нет данных</p>
              ) : (
                <ul className="space-y-2 max-h-64 overflow-auto">
                  {scenarioCategoriesRaw.map((item) => (
                    <li
                      key={item.id}
                      className={`p-3 rounded-lg border text-sm ${
                        scenarioCategoryFilter === item.id
                          ? 'border-[#a3e635] bg-[#a3e635]/10'
                          : 'border-[#2a2a2a] bg-[#1a1a1a]'
                      }`}
                    >
                      <div className="font-medium text-white">{item.name}</div>
                      <div className="mt-1 text-[#a1a1a1] text-xs">
                        id: {item.id}
                        {item.parent_id != null && (
                          <> · parent_id: {item.parent_id}</>
                        )}
                        {item.scenarios_count != null && (
                          <> · scenarios_count: {item.scenarios_count}</>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            </div>
          </div>

          <div className="flex-1 min-w-0 bg-[#141414] border border-[#2a2a2a] rounded-xl box-border" style={{ padding: '1.25rem' }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Scenarios</h3>
              <button
                type="button"
                onClick={() => { setScenarioModalCategoryId(null); setScenarioModalOpen(true); }}
                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#a3e635] text-black text-sm font-medium hover:bg-[#b8ec44] transition-colors"
              >
                <Plus className="h-4 w-4" />
                Create
              </button>
            </div>
            {scenariosLoading ? (
              <p className="text-[#a1a1a1] text-sm py-8">Загрузка...</p>
            ) : scenariosList.length === 0 ? (
              <p className="text-[#a1a1a1] text-sm py-8">Нет данных</p>
            ) : (
              <div className="space-y-8 max-h-[calc(100vh-12rem)] overflow-auto box-border" style={{ paddingRight: '0.5rem' }}>
                {scenariosList.map((cat) => {
                  const title = cat.tag?.name ?? '—';
                  const allImages = (cat.scenarios ?? []).flatMap((s) => s.images ?? []);
                  const count = allImages.length;
                  return (
                    <div
                      key={cat.id}
                      ref={(el) => { scenarioSectionRefs.current[cat.id] = el; }}
                      className="rounded-xl bg-[#1a1a1a] border border-[#2a2a2a] box-border"
                      style={{ padding: '1rem' }}
                    >
                      <div className="flex items-center justify-between gap-3 mb-3">
                        <div className="min-w-0">
                          <h4 className="text-sm font-semibold text-white truncate">{title}</h4>
                          <p className="text-xs text-[#737373] mt-0.5">
                            {count} {count === 1 ? 'экран' : count < 5 ? 'экрана' : 'экранов'}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => { setScenarioModalCategoryId(cat.id); setScenarioModalOpen(true); }}
                          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#a3e635] text-black text-xs font-medium hover:bg-[#b8ec44] transition-colors flex-shrink-0"
                        >
                          <Plus className="h-3.5 w-3.5" />
                          Create
                        </button>
                      </div>
                      {allImages.length === 0 ? (
                        <p className="text-[#737373] text-xs py-6 text-center">Нет изображений</p>
                      ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                          {allImages.map((img) => (
                            <div
                              key={img.id}
                              className="w-full max-w-[180px] h-[320px] rounded-xl overflow-hidden bg-[#0d0d0d] border border-[#262626] hover:border-[#404040] transition-colors mx-auto"
                            >
                              <img
                                src={getProjectImageUrl(img.path)}
                                alt={img.file_name ?? ''}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Videos Tab */}
      {activeTab === 'videos' && (
        <div className="text-center py-12 text-[#a1a1a1]">
          Soon
        </div>
      )}

      <ConfirmDialog
        isOpen={!!deleteScenarioCategoryId}
        onClose={() => setDeleteScenarioCategoryId(null)}
        onConfirm={handleDeleteScenarioCategoryConfirm}
        title="Удалить категорию?"
        description="Вы уверены, что хотите удалить эту категорию сценариев? Это действие нельзя отменить."
        confirmLabel="Удалить"
        cancelLabel="Отмена"
        variant="danger"
        loading={deletingScenarioCategory}
      />

      <AddScenarioCategoryModal
        isOpen={scenarioCategoryModalOpen}
        onClose={() => {
          setScenarioCategoryModalOpen(false);
          setScenarioCategoryParentId(null);
          setScenarioCategoryParentName('');
          setEditingScenarioCategoryId(null);
        }}
        projectId={appId}
        parentId={scenarioCategoryParentId}
        parentName={scenarioCategoryParentName}
        editId={editingScenarioCategoryId}
        initialTagId={editingScenarioCategoryId ? scenarioCategoriesRaw.find((c) => c.id === editingScenarioCategoryId)?.tag_id : undefined}
        onSuccess={refetchScenarioCategories}
      />

      <AddScenarioModal
        isOpen={scenarioModalOpen}
        onClose={() => { setScenarioModalOpen(false); setScenarioModalCategoryId(null); }}
        projectId={appId}
        scenarioCategories={scenarioCategoriesRaw.map((c) => ({ id: c.id, name: c.name }))}
        onSuccess={refetchScenarios}
        initialScenarioCategoryId={scenarioModalCategoryId}
      />
    </div>
  );
}
