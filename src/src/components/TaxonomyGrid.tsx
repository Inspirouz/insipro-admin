import { useState } from 'react';
import { Pencil, Trash2, CheckCircle2, AlertCircle } from 'lucide-react';
import type { TaxonomyItem } from '@/lib/types';

interface TaxonomyGridProps {
  items: TaxonomyItem[];
  onEdit: (item: TaxonomyItem) => void;
  onDelete: (id: string) => void;
}

type Tab = 'all' | 'no_uz' | 'no_en' | 'done';

const hasUz = (i: TaxonomyItem) => !!(i.name_uz?.trim());
const hasEn = (i: TaxonomyItem) => !!(i.name_en?.trim());

export function TaxonomyGrid({ items, onEdit, onDelete }: TaxonomyGridProps) {
  const [tab, setTab] = useState<Tab>('all');

  const total      = items.length;
  const uzDone     = items.filter(hasUz).length;
  const enDone     = items.filter(hasEn).length;
  const noUzCount  = total - uzDone;
  const noEnCount  = total - enDone;
  const doneCount  = items.filter(i => hasUz(i) && hasEn(i)).length;

  const uzPct = total ? Math.round((uzDone / total) * 100) : 0;
  const enPct = total ? Math.round((enDone / total) * 100) : 0;

  const visible =
    tab === 'no_uz' ? items.filter(i => !hasUz(i)) :
    tab === 'no_en' ? items.filter(i => !hasEn(i)) :
    tab === 'done'  ? items.filter(i => hasUz(i) && hasEn(i)) :
    items;

  const tabs: { key: Tab; label: string; count: number; variant: 'neutral' | 'warn' | 'success' }[] = [
    { key: 'all',   label: 'Все',     count: total,     variant: 'neutral' },
    { key: 'no_uz', label: 'Нет UZ',  count: noUzCount, variant: noUzCount > 0 ? 'warn' : 'neutral' },
    { key: 'no_en', label: 'Нет EN',  count: noEnCount, variant: noEnCount > 0 ? 'warn' : 'neutral' },
    { key: 'done',  label: 'Готово',  count: doneCount, variant: 'success' },
  ];

  return (
    <div className="space-y-5">

      {/* ── Translation stats ── */}
      {total > 0 && (
        <div className="grid grid-cols-2 gap-3">
          {[
            { lang: 'UZ', label: 'Узбекский', done: uzDone, pct: uzPct, missing: noUzCount },
            { lang: 'EN', label: 'Английский', done: enDone, pct: enPct, missing: noEnCount },
          ].map(({ lang, label, done, pct, missing }) => {
            const complete = pct === 100;
            return (
              <div
                key={lang}
                className={`rounded-xl border p-4 ${
                  complete
                    ? 'bg-emerald-950/20 border-emerald-900/40'
                    : missing > 0
                    ? 'bg-[#0f0f0f] border-amber-900/30'
                    : 'bg-[#0f0f0f] border-[#1e1e1e]'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-bold tracking-widest px-2 py-0.5 rounded-md ${
                      complete ? 'bg-emerald-500/15 text-emerald-400' : 'bg-[#1a1a1a] text-[#737373]'
                    }`}>
                      {lang}
                    </span>
                    <span className="text-sm text-[#737373]">{label}</span>
                  </div>
                  {complete
                    ? <CheckCircle2 className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                    : missing > 0
                    ? <AlertCircle className="h-4 w-4 text-amber-500/70 flex-shrink-0" />
                    : null
                  }
                </div>

                {/* Progress bar */}
                <div className="h-1.5 bg-[#1a1a1a] rounded-full overflow-hidden mb-2.5">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ease-out ${
                      complete ? 'bg-emerald-500' : 'bg-amber-500'
                    }`}
                    style={{ width: `${pct}%` }}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-xs text-[#555]">
                    {done} из {total}
                  </span>
                  <span className={`text-xs font-semibold ${
                    complete ? 'text-emerald-400' : missing > 0 ? 'text-amber-400' : 'text-[#737373]'
                  }`}>
                    {pct}%
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Filter tabs ── */}
      <div className="flex items-center gap-1 p-1 bg-[#0f0f0f] rounded-xl border border-[#1a1a1a] w-fit">
        {tabs.map(t => {
          const isActive = tab === t.key;
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`
                flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium
                transition-all duration-150 cursor-pointer select-none
                ${isActive
                  ? t.variant === 'warn'
                    ? 'bg-amber-500/10 text-amber-300 shadow-sm'
                    : t.variant === 'success'
                    ? 'bg-emerald-500/10 text-emerald-300 shadow-sm'
                    : 'bg-[#1f1f1f] text-white shadow-sm'
                  : t.variant === 'warn'
                  ? 'text-amber-500/60 hover:text-amber-400 hover:bg-amber-500/5'
                  : t.variant === 'success'
                  ? 'text-[#555] hover:text-emerald-400 hover:bg-emerald-500/5'
                  : 'text-[#555] hover:text-[#a1a1a1] hover:bg-[#141414]'
                }
              `}
            >
              {t.label}
              <span className={`
                min-w-[20px] text-center text-xs px-1.5 py-0.5 rounded-md font-semibold tabular-nums
                ${isActive
                  ? t.variant === 'warn'
                    ? 'bg-amber-500/20 text-amber-300'
                    : t.variant === 'success'
                    ? 'bg-emerald-500/20 text-emerald-300'
                    : 'bg-[#2a2a2a] text-[#a1a1a1]'
                  : t.variant === 'warn' && t.count > 0
                  ? 'bg-amber-500/10 text-amber-500/80'
                  : 'bg-[#1a1a1a] text-[#444]'
                }
              `}>
                {t.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* ── Grid ── */}
      {visible.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <CheckCircle2 className="h-8 w-8 text-emerald-500/40" />
          <p className="text-[#555] text-sm">
            {tab === 'done' ? 'Нет полностью переведённых' : 'Все элементы переведены'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
          {visible.map((item) => {
            const uz = hasUz(item);
            const en = hasEn(item);
            const full = uz && en;
            return (
              <div
                key={item.id}
                className={`
                  group flex bg-[#111] rounded-xl border transition-all duration-150
                  hover:bg-[#161616] overflow-hidden
                  ${full ? 'border-[#222] hover:border-[#2e2e2e]' : 'border-[#222] hover:border-amber-900/40'}
                  ${!full ? 'border-l-2 border-l-amber-600/40' : ''}
                `}
              >
                {/* Left: name + badges */}
                <div className="flex-1 min-w-0 p-4 flex flex-col gap-3">
                  <p className="font-medium text-[#e5e5e5] text-sm leading-snug line-clamp-2">
                    {item.name}
                  </p>
                  <div className="flex items-center gap-1.5 mt-auto">
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-[#1a1a1a] text-[#555] border border-[#222]">RU</span>
                    <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-md border ${uz ? 'bg-emerald-950/40 text-emerald-400 border-emerald-900/40' : 'bg-amber-950/20 text-amber-500/60 border-amber-900/20'}`}>UZ</span>
                    <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-md border ${en ? 'bg-emerald-950/40 text-emerald-400 border-emerald-900/40' : 'bg-amber-950/20 text-amber-500/60 border-amber-900/20'}`}>EN</span>
                  </div>
                </div>

                {/* Right: action buttons column */}
                <div className="flex flex-col border-l border-[#1a1a1a] divide-y divide-[#1a1a1a] flex-shrink-0">
                  <button
                    onClick={() => onEdit(item)}
                    aria-label="Редактировать"
                    className="flex-1 flex items-center justify-center w-12 text-[#444] hover:text-white hover:bg-[#1e1e1e] transition-colors duration-150 cursor-pointer"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => onDelete(item.id)}
                    aria-label="Удалить"
                    className="flex-1 flex items-center justify-center w-12 text-[#444] hover:text-red-400 hover:bg-red-950/30 transition-colors duration-150 cursor-pointer"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
