'use client';

import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { fetchCategories } from '@/lib/api/categoriesApi';
import type { CategoryItem } from '@/lib/api/categoriesApi';
import { PageHeader } from '@/components/PageHeader';
import { ImageUploadSlot } from '@/components/ImageUploadSlot';
import { createProject } from '@/lib/api/projectsApi';

export default function NewAppPage() {
  const router = useNavigate();
  const [loading, setLoading] = useState(false);
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
    loadCategories();
  }, []);

  const loadCategories = async () => {
    const data = await fetchCategories();
    setCategories(data);
    if (data.length > 0) {
      setFormData(prev => ({ ...prev, categoryId: data[0].id }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const app = await createProject({
        name: formData.name,
        description: formData.description,
        logo: formData.iconUrl || null,
        images: formData.previewUrls.filter((u): u is string => u != null),
        platforms: formData.platforms.map((p) => p.toUpperCase()),
        categoryIds: formData.categoryId ? [formData.categoryId] : [],
      });
      router(`/apps/${app.id}`, { replace: true });
    } catch (error) {
      console.error('Failed to create app:', error);
    } finally {
      setLoading(false);
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

  return (
    <div className="p-8">
      <Link
        to="/apps"
        className="inline-flex items-center gap-2 text-[#a1a1a1] hover:text-white transition-colors mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        Назад к приложениям
      </Link>

      <PageHeader title="Добавить приложение" />

      <form onSubmit={handleSubmit} className="max-w-5xl">
        <div className="bg-[#111111] border border-[#2a2a2a] rounded-3xl p-8 space-y-10 !mb-10">
          {/* Preview block */}
          <div>
            <h2 className="text-lg font-semibold mb-4">Добавить превью</h2>
            <div className="rounded-2xl border border-[#2a2a2a] bg-[#141414] px-6 py-6">
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
          </div>

          {/* Logo + main info */}
          <div className="grid gap-6 md:grid-cols-[minmax(0,220px)_minmax(0,1fr)] items-stretch">
            <div className="flex md:block">
              <ImageUploadSlot
                value={formData.iconUrl}
                onChange={(url) => setFormData(prev => ({ ...prev, iconUrl: url }))}
                label="Добавить лого"
                aspectRatio="1"
              />
            </div>
            <div className="space-y-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium mb-2">
                  Название
                </label>
                <input
                  id="name"
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-4 py-3 bg-[#141414] border border-[#2a2a2a] rounded-xl focus:outline-none focus:border-[#a3e635] transition-colors"
                  placeholder="Введите название приложения"
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
                  className="w-full px-4 py-3 bg-[#141414] border border-[#2a2a2a] rounded-xl focus:outline-none focus:border-[#a3e635] transition-colors resize-none"
                  rows={4}
                  placeholder="Кратко опишите приложение"
                  required
                />
              </div>
            </div>
          </div>

          {/* Category */}
          <div className="space-y-4">
            <label htmlFor="category" className="block text-sm font-medium">
              Категория
            </label>
            <select
              id="category"
              value={formData.categoryId}
              onChange={(e) => setFormData(prev => ({ ...prev, categoryId: e.target.value }))}
              className="w-full px-4 py-3 bg-[#141414] border border-[#2a2a2a] rounded-xl focus:outline-none focus:border-[#a3e635] transition-colors"
              required
            >
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          {/* Platforms */}
          <div className="space-y-4">
            <label className="block text-sm font-medium">Платформа</label>
            <div className="inline-flex w-full items-center justify-between rounded-full bg-[#141414] border border-[#2a2a2a] px-2 py-1">
              {(['ios', 'android', 'web'] as const).map((platform) => {
                const active = formData.platforms.includes(platform);
                return (
                  <button
                    key={platform}
                    type="button"
                    onClick={() => togglePlatform(platform)}
                    className={`flex-1 mx-1 text-sm py-2 rounded-full transition-colors ${
                      active ? 'bg-white text-black font-medium' : 'text-[#a1a1a1] hover:text-white'
                    }`}
                  >
                    {platform.toUpperCase()}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-8 space-y-3 max-w-3xl">
          <button
            type="submit"
            disabled={loading}
            className="w-full px-6 py-3 bg-white text-black font-medium rounded-full hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Сохранение...' : 'Сохранить'}
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={() => router('/apps')}
            className="w-full text-sm text-[#a1a1a1] hover:text-white transition-colors"
          >
            Отмена
          </button>
        </div>
      </form>
    </div>
  );
}
