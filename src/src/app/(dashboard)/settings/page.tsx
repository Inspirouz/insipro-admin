'use client';

import { PageHeader } from '@/components/PageHeader';

export default function SettingsPage() {
  return (
    <div className="p-8">
      <PageHeader title="Настройки" />
      
      <div className="max-w-2xl">
        <div className="bg-[#141414] border border-[#2a2a2a] rounded-xl p-8 text-center">
          <p className="text-[#a1a1a1]">Страница настроек в разработке</p>
        </div>
      </div>
    </div>
  );
}
