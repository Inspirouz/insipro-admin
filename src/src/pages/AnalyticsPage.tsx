import { useEffect, useMemo, useState } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import {
  analyticsApi,
  type RangeDays,
  type OverviewResponse,
  type TopPattern,
  type SearchRow,
  type TopTag,
  type FunnelStage,
} from '../lib/api/analyticsApi';

const RANGES: RangeDays[] = [7, 30, 90];
const ACCENT = '#a3e635';
const ACCENT_2 = '#60a5fa';

const nf = new Intl.NumberFormat('ru-RU');
function fmtDay(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('ru-RU', { day: '2-digit', month: 'short' });
}

function Card({ title, subtitle, children, className = '' }: {
  title?: string; subtitle?: string; children: React.ReactNode; className?: string;
}) {
  return (
    <div className={`bg-[#141414] border border-[#2a2a2a] rounded-xl p-6 ${className}`}>
      {title && (
        <div className="mb-4">
          <h2 className="text-base font-semibold text-white">{title}</h2>
          {subtitle && <p className="text-xs text-[#7c7c7c] mt-0.5">{subtitle}</p>}
        </div>
      )}
      {children}
    </div>
  );
}

function Kpi({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-[#141414] border border-[#2a2a2a] rounded-xl p-6">
      <p className="text-sm text-[#a1a1a1]">{label}</p>
      <p className="text-3xl font-bold text-white mt-1 tabular-nums">{nf.format(value)}</p>
    </div>
  );
}

const tooltipStyle = {
  background: '#1a1a1a',
  border: '1px solid #2a2a2a',
  borderRadius: 8,
  color: '#fff',
  fontSize: 12,
};

export function AnalyticsPage() {
  const [days, setDays] = useState<RangeDays>(30);
  const [zeroOnly, setZeroOnly] = useState(false);

  const [overview, setOverview] = useState<OverviewResponse | null>(null);
  const [patterns, setPatterns] = useState<TopPattern[]>([]);
  const [searches, setSearches] = useState<SearchRow[]>([]);
  const [tags, setTags] = useState<TopTag[]>([]);
  const [funnel, setFunnel] = useState<FunnelStage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    Promise.all([
      analyticsApi.overview(days),
      analyticsApi.topPatterns(days, 10),
      analyticsApi.searches(days, zeroOnly, 50),
      analyticsApi.topTags(days, 20),
      analyticsApi.funnel(days),
    ])
      .then(([ov, pat, srch, tg, fn]) => {
        if (cancelled) return;
        setOverview(ov);
        setPatterns(pat);
        setSearches(srch);
        setTags(tg);
        setFunnel(fn);
      })
      .catch((e) => !cancelled && setError(e instanceof Error ? e.message : 'Ошибка загрузки'))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [days, zeroOnly]);

  const chartData = useMemo(
    () => (overview?.series ?? []).map((p) => ({ ...p, label: fmtDay(p.day) })),
    [overview],
  );
  const funnelMax = useMemo(() => Math.max(1, ...funnel.map((f) => f.sessions)), [funnel]);

  return (
    <div className="p-8 max-w-[1400px]">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Аналитика</h1>
          <p className="text-sm text-[#a1a1a1] mt-1">Просмотры, путь пользователя, поиск и популярность тегов</p>
        </div>
        {/* Date range */}
        <div className="inline-flex rounded-lg border border-[#2a2a2a] bg-[#141414] p-1">
          {RANGES.map((r) => (
            <button
              key={r}
              onClick={() => setDays(r)}
              className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${
                days === r ? 'bg-[#a3e635] text-black' : 'text-[#a1a1a1] hover:text-white'
              }`}
            >
              {r} дней
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="mb-6 rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      {loading && !overview ? (
        <div className="text-center py-20 text-[#a1a1a1]">Загрузка…</div>
      ) : (
        <div className="space-y-6">
          {/* KPIs */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Kpi label="Просмотры страниц" value={overview?.totals.total_views ?? 0} />
            <Kpi label="Уникальные сессии" value={overview?.totals.unique_sessions ?? 0} />
            <Kpi label="Всего событий" value={overview?.totals.total_events ?? 0} />
          </div>

          {/* Block 1: pageviews chart + top patterns */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card title="Просмотры по дням" subtitle="Страницы · уникальные сессии" className="lg:col-span-2">
              <div style={{ width: '100%', height: 280 }}>
                <ResponsiveContainer>
                  <LineChart data={chartData} margin={{ top: 8, right: 12, left: -12, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#242424" vertical={false} />
                    <XAxis dataKey="label" stroke="#7c7c7c" fontSize={11} tickLine={false} axisLine={{ stroke: '#2a2a2a' }} />
                    <YAxis stroke="#7c7c7c" fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} width={40} />
                    <Tooltip contentStyle={tooltipStyle} labelStyle={{ color: '#a1a1a1' }} />
                    <Line type="monotone" dataKey="views" name="Просмотры" stroke={ACCENT} strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="uniques" name="Уникальные" stroke={ACCENT_2} strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              {chartData.length === 0 && (
                <p className="text-center text-sm text-[#7c7c7c] -mt-32 pb-32">Пока нет данных за период</p>
              )}
            </Card>

            <Card title="Топ паттернов" subtitle="По просмотрам">
              {patterns.length === 0 ? (
                <p className="text-sm text-[#7c7c7c]">Нет данных</p>
              ) : (
                <ol className="space-y-2">
                  {patterns.map((p, i) => (
                    <li key={p.pattern_id} className="flex items-center gap-3 text-sm">
                      <span className="w-5 text-right text-[#7c7c7c] tabular-nums">{i + 1}</span>
                      <span className="flex-1 truncate text-white" title={p.name ?? p.pattern_id}>
                        {p.name ?? p.pattern_id}
                      </span>
                      <span className="tabular-nums font-medium text-[#a3e635]">{nf.format(p.views)}</span>
                    </li>
                  ))}
                </ol>
              )}
            </Card>
          </div>

          {/* Block 2: funnel */}
          <Card title="Путь пользователя" subtitle="Сессии по этапам">
            {funnel.every((f) => f.sessions === 0) ? (
              <p className="text-sm text-[#7c7c7c]">Нет данных</p>
            ) : (
              <div className="space-y-3">
                {funnel.map((f, i) => {
                  const pct = Math.round((f.sessions / funnelMax) * 100);
                  const conv =
                    i === 0 || funnel[i - 1].sessions === 0
                      ? null
                      : Math.round((f.sessions / funnel[i - 1].sessions) * 100);
                  return (
                    <div key={f.stage} className="flex items-center gap-4">
                      <div className="w-44 text-sm text-[#d4d4d4] shrink-0">{f.stage}</div>
                      <div className="flex-1 h-9 rounded-md bg-[#1a1a1a] overflow-hidden relative">
                        <div
                          className="h-full bg-[#a3e635]/80 rounded-md flex items-center px-3"
                          style={{ width: `${Math.max(pct, 6)}%` }}
                        >
                          <span className="text-xs font-semibold text-black tabular-nums">{nf.format(f.sessions)}</span>
                        </div>
                      </div>
                      <div className="w-16 text-right text-xs text-[#7c7c7c] tabular-nums shrink-0">
                        {conv === null ? '—' : `${conv}%`}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>

          {/* Blocks 3 & 4 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Searches */}
            <Card>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-base font-semibold text-white">Поисковые запросы</h2>
                  <p className="text-xs text-[#7c7c7c] mt-0.5">Что ищут · средн. число результатов</p>
                </div>
                <label className="flex items-center gap-2 text-xs text-[#a1a1a1] cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={zeroOnly}
                    onChange={(e) => setZeroOnly(e.target.checked)}
                    className="accent-[#a3e635] h-4 w-4"
                  />
                  Только 0 результатов
                </label>
              </div>
              {searches.length === 0 ? (
                <p className="text-sm text-[#7c7c7c]">{zeroOnly ? 'Нет запросов без результатов 🎉' : 'Нет данных'}</p>
              ) : (
                <div className="max-h-[360px] overflow-y-auto -mx-2">
                  <table className="w-full text-sm">
                    <thead className="text-[#7c7c7c] text-xs sticky top-0 bg-[#141414]">
                      <tr>
                        <th className="text-left font-normal px-2 py-2">Запрос</th>
                        <th className="text-right font-normal px-2 py-2">Раз</th>
                        <th className="text-right font-normal px-2 py-2">Ср. рез.</th>
                      </tr>
                    </thead>
                    <tbody>
                      {searches.map((s) => {
                        const zero = (s.avg_results ?? 0) === 0;
                        return (
                          <tr key={s.query} className="border-t border-[#222]">
                            <td className="px-2 py-2 text-white truncate max-w-[220px]" title={s.query}>{s.query}</td>
                            <td className="px-2 py-2 text-right tabular-nums text-[#d4d4d4]">{nf.format(s.count)}</td>
                            <td className={`px-2 py-2 text-right tabular-nums ${zero ? 'text-red-400 font-medium' : 'text-[#d4d4d4]'}`}>
                              {s.avg_results === null ? '—' : s.avg_results}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>

            {/* Top tags */}
            <Card title="Популярные теги" subtitle="Топ-20 по кликам">
              {tags.length === 0 ? (
                <p className="text-sm text-[#7c7c7c]">Нет данных</p>
              ) : (
                <div className="max-h-[360px] overflow-y-auto">
                  <ul className="space-y-1.5">
                    {tags.map((t) => {
                      const max = Math.max(1, ...tags.map((x) => x.clicks));
                      const pct = Math.round((t.clicks / max) * 100);
                      return (
                        <li key={t.tag_id} className="relative rounded-md overflow-hidden bg-[#1a1a1a]">
                          <div className="absolute inset-y-0 left-0 bg-[#a3e635]/15" style={{ width: `${pct}%` }} />
                          <div className="relative flex items-center justify-between px-3 py-2 text-sm">
                            <span className="truncate text-white" title={t.tag_name ?? t.tag_id}>
                              {t.tag_name ?? t.tag_id}
                              {t.group_name && <span className="text-[#7c7c7c] ml-2 text-xs">{t.group_name}</span>}
                            </span>
                            <span className="tabular-nums font-medium text-[#a3e635] ml-3">{nf.format(t.clicks)}</span>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
