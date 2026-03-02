import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Trash2 } from 'lucide-react';
import { fetchProject, updateProject, deleteProject } from '../lib/api/projectsApi';
import { fetchCategories } from '../lib/api/categoriesApi';
import type { CategoryItem } from '../lib/api/categoriesApi';
import { PageHeader } from '../components/PageHeader';
import { ImageUploadSlot } from '../components/ImageUploadSlot';
import { ConfirmDialog } from '../components/ConfirmDialog';

export function EditAppPage() {
  const { id: appId } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    iconUrl: null as string | null,
    previewUrls: [null, null, null, null, null] as (string | null)[],
    categoryId: '',
    platforms: [] as ('ios' | 'android' | 'web')[],
  });

  useEffect(() => {
    if (appId) loadData();
  }, [appId]);

  const loadData = async () => {
    if (!appId) return;
    try {
      const [app, categoriesData] = await Promise.all([
        fetchProject(appId),
        fetchCategories(),
      ]);
      if (!app) return;
      setCategories(categoriesData);
      setFormData({
        name: app.name,
        description: app.description,
        iconUrl: app.iconUrl || null,
        previewUrls: [
          ...app.previewUrls.slice(0, 5),
          ...Array(5 - app.previewUrls.length).fill(null),
        ],
        categoryId: app.categoryId,
        platforms: app.platforms,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!appId) return;
    setSaving(true);

    try {
      await updateProject(appId, {
        name: formData.name,
        description: formData.description,
        logo: formData.iconUrl || null,
        images: formData.previewUrls.filter((u): u is string => u != null),
        platforms: formData.platforms.map((p) => p.toUpperCase()),
        categoryIds: formData.categoryId ? [formData.categoryId] : [],
      });
      navigate(`/apps/${appId}`);
    } catch (error) {
      console.error('Failed to update app:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!appId) return;
    setDeleting(true);
    try {
      await deleteProject(appId);
      navigate('/apps');
    } catch (error) {
      console.error('Failed to delete app:', error);
    } finally {
      setDeleting(false);
    }
  };

  const togglePlatform = (platform: 'ios' | 'android' | 'web') => {
    setFormData(prev => ({
      ...prev,
      platforms: prev.platforms.includes(platform)
        ? prev.platforms.filter(p => p !== platform)
        : [...prev.platforms, platform],
    }));
  };

  if (loading) {
    return <div className="p-8 text-center text-[#a1a1a1]">Загрузка...</div>;
  }

  return (
    <div className="p-8">
      <Link
        to={`/apps/${appId}`}
        className="inline-flex items-center gap-2 text-[#a1a1a1] hover:text-white transition-colors mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        Назад к приложению
      </Link>

      <PageHeader
        title="Редактировать приложение"
        actions={
          <button
            type="button"
            onClick={() => setDeleteModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-red-500/10 text-red-400 border border-red-500/50 font-medium rounded-lg hover:bg-red-500/20 transition-colors"
          >
            <Trash2 className="h-4 w-4" />
            Удалить
          </button>
        }
      />

      <ConfirmDialog
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Удалить приложение?"
        description="Вы уверены, что хотите удалить это приложение? Это действие нельзя отменить."
        confirmLabel="Удалить"
        cancelLabel="Отмена"
        variant="danger"
        loading={deleting}
      />

      <form onSubmit={handleSubmit} className="max-w-4xl">
        <div className="bg-[#141414] border border-[#2a2a2a] rounded-xl p-6 space-y-6">
          <div>
            <ImageUploadSlot
              value={formData.iconUrl}
              onChange={(url) => setFormData(prev => ({ ...prev, iconUrl: url }))}
              label="Иконка приложеня"
              aspectRatio="1"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-3">Превью (до 5 изображений)</label>
            <div className="grid grid-cols-5 gap-4">
              {formData.previewUrls.map((url, index) => (
                <ImageUploadSlot
                  key={index}
                  value={url}
                  onChange={(newUrl) => {
                    const newPreviews = [...formData.previewUrls];
                    newPreviews[index] = newUrl;
                    setFormData(prev => ({ ...prev, previewUrls: newPreviews }));
                  }}
                  aspectRatio="9/16"
                />
              ))}
            </div>
          </div>

          <div>
            <label htmlFor="name" className="block text-sm font-medium mb-2">
              Название
            </label>
            <input
              id="name"
              type="text"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className="w-full px-4 py-2.5 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg focus:outline-none focus:border-[#a3e635] transition-colors"
              required
            />
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium mb-2">
              Описание
            </label>
            <textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              className="w-full px-4 py-2.5 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg focus:outline-none focus:border-[#a3e635] transition-colors resize-none"
              rows={3}
              required
            />
          </div>

          <div>
            <label htmlFor="category" className="block text-sm font-medium mb-2">
              Категория
            </label>
            <select
              id="category"
              value={formData.categoryId}
              onChange={(e) => setFormData(prev => ({ ...prev, categoryId: e.target.value }))}
              className="w-full px-4 py-2.5 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg focus:outline-none focus:border-[#a3e635] transition-colors"
              required
            >
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-3">латформы</label>
            <div className="flex gap-4">
              {(['ios', 'android', 'web'] as const).map((platform) => (
                <label key={platform} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.platforms.includes(platform)}
                    onChange={() => togglePlatform(platform)}
                    className="w-4 h-4 rounded border-[#2a2a2a] bg-[#1a1a1a] text-[#a3e635] focus:ring-[#a3e635] focus:ring-offset-0"
                  />
                  <span className="text-sm capitalize">{platform}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-6 flex gap-3">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 bg-white text-black font-medium rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? 'Сохранение...' : 'Сохранить'}
          </button>
          <Link
            to={`/apps/${appId}`}
            className="px-6 py-2.5 bg-[#1a1a1a] border border-[#2a2a2a] text-white font-medium rounded-lg hover:bg-[#242424] transition-colors"
          >
            Отмена
          </Link>
        </div>
      </form>
    </div>
  );
}