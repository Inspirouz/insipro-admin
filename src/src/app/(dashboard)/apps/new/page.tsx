'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { apiClient } from '@/lib/api';
import type { TaxonomyItem } from '@/lib/types';
import { PageHeader } from '@/components/PageHeader';
import { ImageUploadSlot } from '@/components/ImageUploadSlot';

export default function NewAppPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<TaxonomyItem[]>([]);

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
    const data = await apiClient.listTaxonomy('appCategory');
    setCategories(data);
    if (data.length > 0) {
      setFormData(prev => ({ ...prev, categoryId: data[0].id }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const app = await apiClient.createApp({
        name: formData.name,
        description: formData.description,
        iconUrl: formData.iconUrl || '',
        previewUrls: formData.previewUrls.filter((url): url is string => url !== null),
        categoryId: formData.categoryId,
        platforms: formData.platforms,
      });
      router.push(`/apps/${app.id}`);
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
        href="/apps"
        className="inline-flex items-center gap-2 text-[#a1a1a1] hover:text-white transition-colors mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        Назад к приложениям
      </Link>

      <PageHeader title="Добавить приложение" />

      <form onSubmit={handleSubmit} className="max-w-4xl">
        <div className="bg-[#141414] border border-[#2a2a2a] rounded-xl p-6 space-y-6">
          {/* Icon */}
          <div>
            <ImageUploadSlot
              value={formData.iconUrl}
              onChange={(url) => setFormData(prev => ({ ...prev, iconUrl: url }))}
              label="Иконка приложения"
              aspectRatio="1"
            />
          </div>

          {/* Preview Images */}
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

          {/* Name */}
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

          {/* Description */}
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

          {/* Category */}
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

          {/* Platforms */}
          <div>
            <label className="block text-sm font-medium mb-3">Платформы</label>
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

        {/* Actions */}
        <div className="mt-6 flex gap-3">
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2.5 bg-white text-black font-medium rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Сохранение...' : 'Сохранить'}
          </button>
          <Link
            href="/apps"
            className="px-6 py-2.5 bg-[#1a1a1a] border border-[#2a2a2a] text-white font-medium rounded-lg hover:bg-[#242424] transition-colors"
          >
            Отмена
          </Link>
        </div>
      </form>
    </div>
  );
}
