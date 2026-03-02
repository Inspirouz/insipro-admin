'use client';

import Link from 'next/link';
import { Tag, Grid3x3, FolderOpen, LayoutGrid } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';

const categories = [
  {
    id: 'ui',
    title: 'UI Элементы',
    description: 'Кнопки, формы, карточки и другие компоненты интерфейса',
    icon: Grid3x3,
    href: '/categories/ui',
    color: 'from-blue-500/20 to-purple-500/20',
  },
  {
    id: 'patterns',
    title: 'Паттерны',
    description: 'Повторяющиеся решения и практики проектирования',
    icon: Tag,
    href: '/categories/patterns',
    color: 'from-green-500/20 to-teal-500/20',
  },
  {
    id: 'app',
    title: 'Категории приложений',
    description: 'Типы и категории приложений',
    icon: FolderOpen,
    href: '/categories/app',
    color: 'from-orange-500/20 to-red-500/20',
  },
  {
    id: 'screens',
    title: 'Категория экрана',
    description: 'Категории экранов приложений',
    icon: LayoutGrid,
    href: '/categories/screens',
    color: 'from-cyan-500/20 to-blue-500/20',
  },
];

export default function CategoriesPage() {
  return (
    <div className="p-8">
      <PageHeader title="Категории" />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl">
        {categories.map((category) => (
          <Link
            key={category.id}
            href={category.href}
            className="group bg-[#141414] border border-[#2a2a2a] rounded-xl overflow-hidden hover:border-[#3a3a3a] transition-all hover:shadow-soft"
          >
            <div className={`aspect-video bg-gradient-to-br ${category.color} flex items-center justify-center`}>
              <category.icon className="h-16 w-16 text-white/80" />
            </div>
            <div className="p-6">
              <h3 className="text-lg font-medium mb-2 group-hover:text-[#a3e635] transition-colors">
                {category.title}
              </h3>
              <p className="text-sm text-[#a1a1a1]">
                {category.description}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
