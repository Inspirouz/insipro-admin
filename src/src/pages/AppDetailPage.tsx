import { useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useSearchParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, Circle, GripVertical, Pencil, Plus, Trash2, X } from 'lucide-react';
import { fetchProject } from '../lib/api/projectsApi';
import { fetchScreensCategories } from '../lib/api/screensCategoriesApi';
import { fetchScenarioCategories, deleteScenarioCategory, updateScenarioCategory, type ScenarioCategoryItem } from '../lib/api/scenarioCategoriesApi';
import { fetchAdminScreens, updateAdminScreen } from '../lib/api/adminScreensApi';
import { fetchAdminScenariosByProject, type ScenarioCategoryWithScenarios } from '../lib/api/scenariosApi';
import { getProjectImageUrl } from '../lib/api/projectsApi';
import { AddScenarioCategoryModal } from '../components/AddScenarioCategoryModal';
import { AddScenarioModal } from '../components/AddScenarioModal';
import { AddScreensToScenarioModal } from '../components/AddScreensToScenarioModal';
import { ConfirmDialog } from '../components/ConfirmDialog';
import type { App, Screen, TaxonomyItem } from '../lib/types';

const VIDEO_EXT = /\.(mp4|webm|mov|m4v|ogg|quicktime|avi|mkv)(\?|$)/i;
function isVideoUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  // Uploaded videos are stored with a "video__" filename prefix; also fall back to extension.
  return url.toLowerCase().includes("video__") || VIDEO_EXT.test(url);
}
function ScreenMedia({ src, className, alt = "" }: { src: string; className?: string; alt?: string }) {
  if (isVideoUrl(src)) {
    return (
      <video
        src={src}
        className={className}
        muted
        loop
        playsInline
        controls
        preload="metadata"
        onClick={(e) => e.stopPropagation()}
      />
    );
  }
  return <img src={src} alt={alt} className={className} />;
}

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

function collectNodeIds(node: ScenarioCategoryNode): Set<string> {
  const ids = new Set<string>([node.id]);
  for (const child of node.children) {
    for (const id of collectNodeIds(child)) ids.add(id);
  }
  return ids;
}

function findInTree(nodes: ScenarioCategoryNode[], id: string): ScenarioCategoryNode | null {
  for (const n of nodes) {
    if (n.id === id) return n;
    const f = findInTree(n.children, id);
    if (f) return f;
  }
  return null;
}

function InsertLine() {
  return (
    <div className="flex items-center pointer-events-none py-0.5">
      <div className="w-2.5 h-2.5 rounded-full bg-[#a3e635] flex-shrink-0" />
      <div className="flex-1 h-0.5 bg-[#a3e635]" />
    </div>
  );
}

function ScenarioCategoryTreeItem({
  node,
  parentId,
  depth,
  selectedId,
  onSelect,
  onAddChild,
  onEdit,
  onDelete,
  screenCountsMap,
  draggingId,
  insertPos,
  onRowMouseDown,
}: {
  node: ScenarioCategoryNode;
  parentId: string | null;
  depth: number;
  selectedId: string | null;
  onSelect: (id: string) => void;
  onAddChild: (id: string, name: string) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  screenCountsMap: Record<string, number>;
  isLast?: boolean;
  draggingId: string | null;
  insertPos: { targetId: string; mode: 'before' | 'after' | 'inside'; parentId: string | null } | null;
  onRowMouseDown: (id: string, e: React.MouseEvent) => void;
}) {
  const isSelected = selectedId === node.id;
  const hasChildren = node.children.length > 0;
  const count = screenCountsMap[node.id] ?? 0;
  const isDragging = draggingId === node.id;
  const isBefore = insertPos?.targetId === node.id && insertPos.mode === 'before';
  const isAfter  = insertPos?.targetId === node.id && insertPos.mode === 'after';
  const isInside = insertPos?.targetId === node.id && insertPos.mode === 'inside';

  return (
    <div style={{ paddingLeft: depth > 0 ? 12 + depth * 16 : 0 }}>
      {isBefore && <InsertLine />}

      <div
        data-cat-id={node.id}
        data-cat-parent-id={parentId ?? ''}
        onMouseDown={(e) => {
          const t = e.target as HTMLElement;
          if (!t.closest('button')) onRowMouseDown(node.id, e);
        }}
        className={[
          'flex items-center rounded-md text-sm select-none',
          isDragging ? 'opacity-30 cursor-grabbing' : 'cursor-grab',
          isInside
            ? 'bg-[#a3e635]/20 ring-1 ring-[#a3e635]'
            : isSelected
            ? 'bg-[#a3e635] text-black font-medium'
            : 'text-[#e5e5e5] hover:bg-[#1f1f1f]',
        ].filter(Boolean).join(' ')}
      >
        <div className="flex-shrink-0 px-1 text-[#555] pointer-events-none">
          <GripVertical className="h-3.5 w-3.5" />
        </div>

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
          {depth < 3 && (
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

      {isAfter && !hasChildren && <InsertLine />}

      {hasChildren && (
        <div className="border-l border-[#404040] ml-2 pl-2 mt-0.5">
          {node.children.map((child) => (
            <ScenarioCategoryTreeItem
              key={child.id}
              node={child}
              parentId={node.id}
              depth={depth + 1}
              selectedId={selectedId}
              onSelect={onSelect}
              onAddChild={onAddChild}
              onEdit={onEdit}
              onDelete={onDelete}
              screenCountsMap={screenCountsMap}
              draggingId={draggingId}
              insertPos={insertPos}
              onRowMouseDown={onRowMouseDown}
            />
          ))}
          {isAfter && <InsertLine />}
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

export function AppDetailPage() {
  const { id: appId } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // Restore scroll after returning from screen detail
  useEffect(() => {
    const key = `app-detail-scroll-${appId}`;
    const saved = sessionStorage.getItem(key);
    if (saved) {
      requestAnimationFrame(() => window.scrollTo({ top: Number(saved), behavior: 'instant' }));
      sessionStorage.removeItem(key);
    }
  }, [appId]);
  const [searchParams, setSearchParams] = useSearchParams();

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
  const [filterUnmarked, setFilterUnmarked] = useState(false);
  const [filterNoPattern, setFilterNoPattern] = useState(false);
  const [filterNoScenario, setFilterNoScenario] = useState(false);
  const [filterNoUI, setFilterNoUI] = useState(false);
  const [sidebarSearch, setSidebarSearch] = useState('');
  const [scenarioScreensOrder, setScenarioScreensOrder] = useState<Record<string, string[]>>({});
  const [editingScreenId, setEditingScreenId] = useState<string | null>(null);
  const [editCategoryId, setEditCategoryId] = useState<string>('');
  const [savingScreenId, setSavingScreenId] = useState<string | null>(null);
  const [scenariosList, setScenariosList] = useState<ScenarioCategoryWithScenarios[]>([]);
  const [scenariosLoading, setScenariosLoading] = useState(false);
  const [scenarioModalOpen, setScenarioModalOpen] = useState(false);
  const [scenarioModalCategoryId, setScenarioModalCategoryId] = useState<string | null>(null);
  const [addScreensModalOpen, setAddScreensModalOpen] = useState(false);
  const [removeScreenConfirmId, setRemoveScreenConfirmId] = useState<string | null>(null);
  const [removingScreen, setRemovingScreen] = useState(false);
  const scenarioSectionRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const [draggingCatId, setDraggingCatId] = useState<string | null>(null);
  // mode: 'before'/'after' = insert line at same level; 'inside' = become child of targetId
  const [insertPos, setInsertPos] = useState<{ targetId: string; mode: 'before' | 'after' | 'inside'; parentId: string | null } | null>(null);
  const [movingCategory, setMovingCategory] = useState(false);
  const insertPosRef = useRef<{ targetId: string; mode: 'before' | 'after' | 'inside'; parentId: string | null } | null>(null);
  const scenarioCategoryFlatRef = useRef<ScenarioCategoryFlat[]>([]);

  useEffect(() => {
    if (appId) loadData();
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
    if (!appId) return;
    try {
      const [appData, screensData, categoriesData, scenarioCategoriesData] = await Promise.all([
        fetchProject(appId),
        fetchAdminScreens(appId),
        fetchScreensCategories(undefined, appId),
        fetchScenarioCategories(undefined, appId),
      ]);
      setApp(appData ?? null);
      setScreens(screensData);
      setScreenCategories(
        categoriesData.map((c) => ({ id: c.id, name: c.name, type: 'screenCategory' as const }))
      );
      setScenarioCategoriesRaw(scenarioCategoriesData.filter((c) => !c.project_id || c.project_id === appId));
    } finally {
      setLoading(false);
    }
  };

  const getCategory = (categoryId: string) => {
    return screenCategories.find(c => c.id === categoryId);
  };

  const getCategoryCounts = () => {
    const counts: Record<string, number> = {};
    screens.forEach(screen => {
      counts[screen.categoryId] = (counts[screen.categoryId] || 0) + 1;
    });
    return counts;
  };

  const filteredScreens = screens.filter(s => {
    if (categoryFilter && s.categoryId !== categoryFilter) return false;
    if (filterUnmarked && s.isMarked) return false;
    if (filterNoPattern && s.categoryId) return false;
    if (filterNoScenario && s.scenarioIds.length > 0) return false;
    if (filterNoUI && s.uiElementIds.length > 0) return false;
    return true;
  });

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

  const filteredScenarioCategoriesFlat = useMemo(() => {
    if (!sidebarSearch.trim()) return scenarioCategoriesFlat;
    const q = sidebarSearch.toLowerCase();
    return scenarioCategoriesFlat.filter((c) => c.name.toLowerCase().includes(q));
  }, [scenarioCategoriesFlat, sidebarSearch]);

  const filteredScenarioCategoryTree = useMemo(
    () => buildScenarioTree(filteredScenarioCategoriesFlat),
    [filteredScenarioCategoriesFlat]
  );

  // Keep ref in sync so mouse event closures always see latest flat list
  scenarioCategoryFlatRef.current = scenarioCategoriesFlat;

  const filterCategoriesByApp = (data: ScenarioCategoryItem[]) =>
    data.filter((c) => !c.project_id || c.project_id === appId);

  const refetchScenarioCategories = async () => {
    if (!appId) return;
    try {
      const data = await fetchScenarioCategories(undefined, appId);
      setScenarioCategoriesRaw(filterCategoriesByApp(data));
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

  const refetchScreens = async () => {
    if (!appId) return;
    try {
      const data = await fetchAdminScreens(appId);
      setScreens(data);
    } catch (e) {
      console.error(e);
    }
  };

  const scenarioScreenCountsMap = useMemo(() => {
    const counts: Record<string, number> = {};
    screens.forEach((screen) => {
      screen.scenarioIds.forEach((id) => {
        counts[id] = (counts[id] || 0) + 1;
      });
    });
    return counts;
  }, [screens]);

  const scenarioScreens = useMemo(() => {
    if (!scenarioCategoryFilter) return [];
    const filtered = screens.filter((s) => s.scenarioIds.includes(scenarioCategoryFilter));
    const order = scenarioScreensOrder[scenarioCategoryFilter];
    if (!order?.length) return [...filtered].reverse();
    const ordered = order.map((id) => filtered.find((s) => s.id === id)).filter(Boolean) as Screen[];
    const rest = [...filtered.filter((s) => !order.includes(s.id))].reverse();
    return [...ordered, ...rest];
  }, [screens, scenarioCategoryFilter, scenarioScreensOrder]);

  const selectedCategoryName = useMemo(
    () =>
      scenarioCategoryFilter
        ? scenarioCategoriesFlat.find((c) => c.id === scenarioCategoryFilter)?.name ?? ''
        : '',
    [scenarioCategoryFilter, scenarioCategoriesFlat]
  );

  const handleScreensAdded = (addedIds: string[]) => {
    if (!scenarioCategoryFilter) return;
    const catId = scenarioCategoryFilter;
    setScreens((prev) =>
      prev.map((s) =>
        addedIds.includes(s.id) && !s.scenarioIds.includes(catId)
          ? { ...s, scenarioIds: [...s.scenarioIds, catId] }
          : s
      )
    );
    setScenarioScreensOrder((prev) => ({
      ...prev,
      [catId]: [...addedIds, ...(prev[catId] ?? []).filter((id) => !addedIds.includes(id))],
    }));
  };

  const handleRemoveScreenConfirm = async () => {
    if (!removeScreenConfirmId || !scenarioCategoryFilter) return;
    setRemovingScreen(true);
    try {
      const screen = screens.find((s) => s.id === removeScreenConfirmId);
      if (screen) {
        const newIds = screen.scenarioIds.filter((id) => id !== scenarioCategoryFilter);
        await updateAdminScreen(removeScreenConfirmId, { senarys: newIds });
        setScreens((prev) =>
          prev.map((s) =>
            s.id === removeScreenConfirmId ? { ...s, scenarioIds: newIds } : s
          )
        );
      }
      setRemoveScreenConfirmId(null);
    } catch (e) {
      console.error(e);
    } finally {
      setRemovingScreen(false);
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

  const startCategoryDrag = (nodeId: string, e: React.MouseEvent) => {
    if (e.button !== 0) return;
    e.preventDefault();

    let dragStarted = false;
    const startX = e.clientX;
    const startY = e.clientY;

    // Compute ids of dragged node and all its descendants (can't drop inside self)
    const draggingNode = findInTree(scenarioCategoryTree, nodeId);
    const blockedIds = draggingNode ? collectNodeIds(draggingNode) : new Set<string>();

    const onMouseMove = (me: MouseEvent) => {
      if (!dragStarted) {
        if (Math.abs(me.clientX - startX) < 4 && Math.abs(me.clientY - startY) < 4) return;
        dragStarted = true;
        setDraggingCatId(nodeId);
      }

      const el = document.elementFromPoint(me.clientX, me.clientY) as HTMLElement | null;
      const catEl = el?.closest('[data-cat-id]') as HTMLElement | null;

      if (!catEl) {
        insertPosRef.current = null;
        setInsertPos(null);
        return;
      }

      const targetId = catEl.getAttribute('data-cat-id')!;
      const rawParentId = catEl.getAttribute('data-cat-parent-id') || null;

      // Can't drop onto self or own descendants
      if (blockedIds.has(targetId)) {
        insertPosRef.current = null;
        setInsertPos(null);
        return;
      }

      const rect = catEl.getBoundingClientRect();
      const relY = me.clientY - rect.top;
      const ratio = relY / rect.height;

      let mode: 'before' | 'after' | 'inside';
      let parentId: string | null;

      if (ratio < 0.3) {
        mode = 'before';
        parentId = rawParentId;           // same level as target
      } else if (ratio > 0.7) {
        mode = 'after';
        parentId = rawParentId;           // same level as target
      } else {
        mode = 'inside';
        parentId = targetId;              // become child of target
      }

      const next = { targetId, mode, parentId };
      insertPosRef.current = next;
      setInsertPos(next);
    };

    const onMouseUp = async () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
      document.body.style.cursor = '';

      const pos = insertPosRef.current;
      setDraggingCatId(null);
      setInsertPos(null);
      insertPosRef.current = null;

      if (!dragStarted || !pos) return;

      setMovingCategory(true);
      try {
        await updateScenarioCategory(nodeId, { parent_id: pos.parentId });
        await refetchScenarioCategories();
      } catch (err) {
        console.error('Move failed:', err);
      } finally {
        setMovingCategory(false);
      }
    };

    document.body.style.cursor = 'grabbing';
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  };

  const handleToggleMark = async (e: React.MouseEvent, screen: Screen) => {
    e.preventDefault();
    e.stopPropagation();
    const newMarked = !screen.isMarked;
    setScreens(prev => prev.map(s => s.id === screen.id ? { ...s, isMarked: newMarked } : s));
    try {
      await updateAdminScreen(screen.id, { is_marked: newMarked });
    } catch {
      setScreens(prev => prev.map(s => s.id === screen.id ? { ...s, isMarked: !newMarked } : s));
    }
  };

  const handleOpenEdit = (e: React.MouseEvent, screen: Screen) => {
    e.preventDefault();
    e.stopPropagation();
    setEditingScreenId(screen.id);
    setEditCategoryId(screen.categoryId);
  };

  const handleSaveEdit = async (screenId: string) => {
    setSavingScreenId(screenId);
    try {
      await updateAdminScreen(screenId, { screens_category_id: editCategoryId });
      setScreens(prev => prev.map(s => s.id === screenId ? { ...s, categoryId: editCategoryId } : s));
      setEditingScreenId(null);
    } catch (e) {
      console.error(e);
    } finally {
      setSavingScreenId(null);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-[#a1a1a1]">Загрузка...</div>;
  }

  if (!app) {
    return <div className="p-8 text-center text-[#a1a1a1]">Приложение не найдено</div>;
  }

  const categoryCounts = getCategoryCounts();

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
          <div className="w-72 flex-shrink-0">
            <div className="bg-[#141414] border border-[#2a2a2a] rounded-xl p-4">
              <div className="space-y-1 mb-4">
                <p className="text-xs text-[#6b6b6b] px-1 mb-2">Быстрые фильтры</p>
                <button
                  onClick={() => { setFilterUnmarked(f => !f); setCategoryFilter(null); }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors ${
                    filterUnmarked ? 'bg-blue-500/20 text-blue-300 font-medium' : 'text-[#a1a1a1] hover:bg-[#1a1a1a]'
                  }`}
                >
                  <span>Не размечены</span>
                  <span>{screens.filter(s => !s.isMarked).length}</span>
                </button>
                <button
                  onClick={() => { setFilterNoPattern(f => !f); setCategoryFilter(null); }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors ${
                    filterNoPattern ? 'bg-orange-500/20 text-orange-300 font-medium' : 'text-[#a1a1a1] hover:bg-[#1a1a1a]'
                  }`}
                >
                  <span>Без паттернов</span>
                  <span>{screens.filter(s => !s.categoryId).length}</span>
                </button>
                <button
                  onClick={() => { setFilterNoScenario(f => !f); setCategoryFilter(null); }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors ${
                    filterNoScenario ? 'bg-purple-500/20 text-purple-300 font-medium' : 'text-[#a1a1a1] hover:bg-[#1a1a1a]'
                  }`}
                >
                  <span>Без сценариев</span>
                  <span>{screens.filter(s => s.scenarioIds.length === 0).length}</span>
                </button>
                <button
                  onClick={() => { setFilterNoUI(f => !f); setCategoryFilter(null); }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors ${
                    filterNoUI ? 'bg-yellow-500/20 text-yellow-300 font-medium' : 'text-[#a1a1a1] hover:bg-[#1a1a1a]'
                  }`}
                >
                  <span>Без UI элементов</span>
                  <span>{screens.filter(s => s.uiElementIds.length === 0).length}</span>
                </button>
              </div>

              <div className="pt-4 border-t border-[#2a2a2a]">
                <h3 className="font-medium mb-3 text-sm text-[#a1a1a1]">Паттерны</h3>
                <div className="space-y-1">
                  <button
                    onClick={() => { setCategoryFilter(null); setFilterUnmarked(false); setFilterNoPattern(false); setFilterNoScenario(false); setFilterNoUI(false); }}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors ${
                      categoryFilter === null && !filterUnmarked && !filterNoPattern && !filterNoScenario && !filterNoUI
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
                      onClick={() => { setCategoryFilter(category.id); setFilterUnmarked(false); setFilterNoPattern(false); setFilterNoScenario(false); setFilterNoUI(false); }}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors ${
                        categoryFilter === category.id
                          ? 'bg-[#a3e635] text-black font-medium'
                          : 'text-[#a1a1a1] hover:bg-[#1a1a1a]'
                      }`}
                    >
                      <span className="truncate text-left">{category.name}</span>
                      <span className="flex-shrink-0 ml-2">{categoryCounts[category.id] || 0}</span>
                    </button>
                  ))}
                </div>
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
                  <div
                    key={screen.id}
                    className={`group bg-[#141414] border rounded-xl overflow-hidden transition-all hover:shadow-soft ${
                      screen.isMarked ? 'border-[#a3e635]/40' : 'border-[#2a2a2a] hover:border-[#3a3a3a]'
                    }`}
                  >
                    {/* Image — click to navigate */}
                    <div className="block relative bg-[#1a1a1a] cursor-pointer" onClick={() => { sessionStorage.setItem(`app-detail-scroll-${appId}`, String(window.scrollY)); navigate(`/screens/${screen.id}`); }}>
                      <ScreenMedia
                        src={screen.imageUrl}
                        alt="Screen"
                        className="w-full h-auto block"
                      />
                      {/* Mark toggle button */}
                      <button
                        type="button"
                        onClick={(e) => handleToggleMark(e, screen)}
                        title={screen.isMarked ? 'Снять отметку' : 'Отметить как размеченный'}
                        className="absolute top-2 right-2 p-1 rounded-full bg-black/60 hover:bg-black/80 transition-colors"
                      >
                        {screen.isMarked
                          ? <CheckCircle2 className="h-4 w-4 text-[#a3e635]" />
                          : <Circle className="h-4 w-4 text-white/40" />
                        }
                      </button>
                    </div>


                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Scenarios Tab */}
      {activeTab === 'scenarios' && (
        <div className="flex gap-6 items-start">
          {/* Left: tree sidebar */}
          <div className="w-72 flex-shrink-0">
            <div
              className={`sticky overflow-y-auto rounded-xl border border-[#2a2a2a] bg-[#141414] p-4 transition-opacity ${movingCategory ? 'opacity-60 pointer-events-none' : ''}`}
              style={{ top: 20, maxHeight: 'calc(100vh - 160px)' }}
            >
              <div className="flex items-center justify-between gap-2 mb-3">
                <h3 className="font-medium text-sm">Сценарии</h3>
                <button
                  type="button"
                  onClick={() => {
                    setScenarioCategoryParentId(null);
                    setScenarioCategoryParentName('');
                    setEditingScenarioCategoryId(null);
                    setScenarioCategoryModalOpen(true);
                  }}
                  className="flex items-center gap-1 px-2 py-1 rounded-lg bg-[#a3e635] text-black text-xs font-medium hover:bg-[#b8ec44] transition-colors"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Добавить
                </button>
              </div>

              {/* Search */}
              <div className="relative mb-3">
                <input
                  type="text"
                  value={sidebarSearch}
                  onChange={(e) => setSidebarSearch(e.target.value)}
                  placeholder="Поиск сценария..."
                  className="w-full pl-3 pr-8 py-2 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg text-xs focus:outline-none focus:border-[#a3e635] transition-colors placeholder:text-[#6b6b6b]"
                />
                {sidebarSearch && (
                  <button
                    type="button"
                    onClick={() => setSidebarSearch('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-[#6b6b6b] hover:text-white"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>


              {filteredScenarioCategoryTree.length === 0 ? (
                <p className="text-xs text-[#6b6b6b] text-center py-4">
                  {sidebarSearch ? 'Ничего не найдено' : 'Нет категорий'}
                </p>
              ) : (
                <div className="space-y-0.5">
                  {filteredScenarioCategoryTree.map((node) => (
                    <ScenarioCategoryTreeItem
                      key={node.id}
                      node={node}
                      parentId={null}
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
                      screenCountsMap={scenarioScreenCountsMap}
                      draggingId={draggingCatId}
                      insertPos={insertPos}
                      onRowMouseDown={startCategoryDrag}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right: screens in selected scenario */}
          <div className="flex-1 min-w-0">
            {!scenarioCategoryFilter ? (
              <div className="flex flex-col items-center justify-center py-20 text-[#a1a1a1]">
                <p className="text-sm">Выберите сценарий слева</p>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-medium">{selectedCategoryName}</h2>
                  <button
                    type="button"
                    onClick={() => setAddScreensModalOpen(true)}
                    className="flex items-center gap-2 px-4 py-2.5 bg-white text-black font-medium rounded-lg hover:bg-gray-100 transition-colors text-sm"
                  >
                    <Plus className="h-4 w-4" />
                    Добавить экраны
                  </button>
                </div>

                {scenariosLoading ? (
                  <div className="text-center py-12 text-[#a1a1a1] text-sm">Загрузка...</div>
                ) : scenarioScreens.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-[#a1a1a1]">
                    <p className="text-sm mb-3">В этом сценарии нет экранов</p>
                    <button
                      type="button"
                      onClick={() => setAddScreensModalOpen(true)}
                      className="flex items-center gap-2 px-4 py-2.5 bg-[#1a1a1a] border border-[#2a2a2a] text-white rounded-lg hover:bg-[#242424] transition-colors text-sm"
                    >
                      <Plus className="h-4 w-4" />
                      Добавить экраны
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-4">
                    {scenarioScreens.map((screen) => (
                      <div
                        key={screen.id}
                        style={{ width: 140, height: 248, flexShrink: 0 }}
                        className="group relative bg-[#141414] border border-[#2a2a2a] rounded-xl overflow-hidden hover:border-[#3a3a3a] transition-all"
                      >
                        <Link to={`/screens/${screen.id}`} className="block w-full h-full">
                          <div className="w-full h-full bg-[#1a1a1a]">
                            {screen.imageUrl && (
                              <ScreenMedia
                                src={screen.imageUrl}
                                className="w-full h-full object-cover"
                              />
                            )}
                          </div>
                        </Link>
                        <button
                          type="button"
                          onClick={() => setRemoveScreenConfirmId(screen.id)}
                          className="absolute top-2 right-2 w-6 h-6 bg-black/60 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500/80"
                          title="Убрать из сценария"
                        >
                          <X className="h-3.5 w-3.5 text-white" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </>
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
        projectId={appId ?? ''}
        parentId={scenarioCategoryParentId}
        parentName={scenarioCategoryParentName}
        editId={editingScenarioCategoryId}
        initialTagId={editingScenarioCategoryId ? scenarioCategoriesRaw.find((c) => c.id === editingScenarioCategoryId)?.tag_id : undefined}
        onSuccess={refetchScenarioCategories}
      />

      <AddScenarioModal
        isOpen={scenarioModalOpen}
        onClose={() => { setScenarioModalOpen(false); setScenarioModalCategoryId(null); }}
        projectId={appId ?? ''}
        scenarioCategories={scenarioCategoriesRaw.map((c) => ({ id: c.id, name: c.name }))}
        onSuccess={refetchScenarios}
        initialScenarioCategoryId={scenarioModalCategoryId}
      />

      <AddScreensToScenarioModal
        isOpen={addScreensModalOpen}
        onClose={() => setAddScreensModalOpen(false)}
        scenarioCategoryId={scenarioCategoryFilter ?? ''}
        appScreens={screens}
        onSuccess={handleScreensAdded}
      />

      <ConfirmDialog
        isOpen={!!removeScreenConfirmId}
        onClose={() => setRemoveScreenConfirmId(null)}
        onConfirm={handleRemoveScreenConfirm}
        title="Убрать экран из сценария?"
        description="Экран будет удалён из этого сценария, но останется в приложении."
        confirmLabel="Убрать"
        cancelLabel="Отмена"
        variant="danger"
        loading={removingScreen}
      />
    </div>
  );
}