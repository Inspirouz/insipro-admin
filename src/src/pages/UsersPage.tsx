import { useEffect, useState } from 'react';
import { fetchAdminUsers, fetchAdminUserStats } from '../lib/api/adminUsersApi';
import type { User } from '../lib/types';
import type { UserStats } from '../lib/api/adminUsersApi';
import { PageHeader } from '../components/PageHeader';
import { SearchInput } from '../components/SearchInput';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

function fillDailyGaps(data: Array<{ date: string; count: number }>): Array<{ date: string; count: number }> {
  const result: Array<{ date: string; count: number }> = [];
  const today = new Date();
  for (let i = 29; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const iso = d.toISOString().slice(0, 10);
    const found = data.find((x) => x.date === iso);
    result.push({ date: iso, count: found?.count ?? 0 });
  }
  return result;
}

const MONTH_SHORT = ['янв','фев','мар','апр','май','июн','июл','авг','сен','окт','ноя','дек'];
function fmtDate(iso: string) {
  const [, m, d] = iso.split('-');
  return parseInt(d) + ' ' + MONTH_SHORT[parseInt(m) - 1];
}

interface StatCardProps {
  label: string;
  value: string | number;
  sub?: string;
  accent?: boolean;
}
function StatCard({ label, value, sub, accent }: StatCardProps) {
  return (
    <div className="bg-[#141414] border border-[#2a2a2a] rounded-xl p-5 flex flex-col gap-1">
      <span className="text-[#a1a1a1] text-xs uppercase tracking-wider">{label}</span>
      <span className={`text-3xl font-semibold ${accent ? 'text-[#a3e635]' : 'text-white'}`}>{value}</span>
      {sub && <span className="text-xs text-[#666]">{sub}</span>}
    </div>
  );
}

export function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);

  useEffect(() => {
    loadUsers();
    loadStats();
  }, []);

  const loadUsers = async () => {
    try {
      const data = await fetchAdminUsers({});
      setUsers(data);
    } catch (e) {
      console.error(e);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const data = await fetchAdminUserStats();
      setStats(data);
    } catch (e) {
      console.error(e);
    } finally {
      setStatsLoading(false);
    }
  };

  const filteredUsers = users.filter((user) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return user.email.toLowerCase().includes(q) || (user.name?.toLowerCase().includes(q) ?? false);
  });

  const chartData = stats ? fillDailyGaps(stats.daily_registrations) : [];
  const googlePct = stats && stats.total > 0 ? Math.round((stats.google_count / stats.total) * 100) : 0;

  return (
    <div className="p-8 space-y-8">
      <PageHeader title="Пользователи" />

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Всего пользователей" value={statsLoading ? '—' : stats?.total ?? 0} accent />
        <StatCard
          label="Новых за неделю"
          value={statsLoading ? '—' : stats?.new_this_week ?? 0}
          sub="последние 7 дней"
        />
        <StatCard
          label="Новых за месяц"
          value={statsLoading ? '—' : stats?.new_this_month ?? 0}
          sub="последние 30 дней"
        />
        <StatCard
          label="Через Google"
          value={statsLoading ? '—' : `${googlePct}%`}
          sub={statsLoading ? '' : `${stats?.google_count ?? 0} Google · ${stats?.email_count ?? 0} Email`}
        />
      </div>

      {/* Daily registrations chart */}
      <div className="bg-[#141414] border border-[#2a2a2a] rounded-xl p-6">
        <h2 className="text-sm font-medium text-[#a1a1a1] uppercase tracking-wider mb-5">
          Регистрации за последние 30 дней
        </h2>
        {statsLoading ? (
          <div className="h-48 flex items-center justify-center text-[#a1a1a1]">Загрузка...</div>
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={chartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#a3e635" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#a3e635" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
              <XAxis
                dataKey="date"
                tickFormatter={fmtDate}
                tick={{ fill: '#666', fontSize: 11 }}
                interval={4}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: '#666', fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                allowDecimals={false}
              />
              <Tooltip
                contentStyle={{ background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: 8 }}
                labelStyle={{ color: '#a1a1a1', fontSize: 12 }}
                itemStyle={{ color: '#a3e635' }}
                labelFormatter={(v) => fmtDate(String(v))}
                formatter={(v) => [v, 'Регистрации']}
              />
              <Area
                type="monotone"
                dataKey="count"
                stroke="#a3e635"
                strokeWidth={2}
                fill="url(#colorCount)"
                dot={false}
                activeDot={{ r: 4, fill: '#a3e635' }}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Auth method breakdown */}
      {stats && !statsLoading && (
        <div className="bg-[#141414] border border-[#2a2a2a] rounded-xl p-6">
          <h2 className="text-sm font-medium text-[#a1a1a1] uppercase tracking-wider mb-4">
            Способ входа
          </h2>
          <div className="flex items-center gap-4">
            <div className="flex-1 h-3 bg-[#222] rounded-full overflow-hidden">
              <div
                className="h-full bg-[#a3e635] rounded-full transition-all"
                style={{ width: `${googlePct}%` }}
              />
            </div>
            <div className="flex gap-6 text-sm shrink-0">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#a3e635] inline-block" />
                Google — {stats.google_count} ({googlePct}%)
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#444] inline-block" />
                Email OTP — {stats.email_count} ({100 - googlePct}%)
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Users table */}
      <div>
        <div className="mb-4">
          <SearchInput value={search} onChange={setSearch} placeholder="Поиск по email или имени..." />
        </div>
        {loading ? (
          <div className="text-center py-12 text-[#a1a1a1]">Загрузка...</div>
        ) : (
          <div className="bg-[#141414] border border-[#2a2a2a] rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#2a2a2a]">
                    <th className="px-6 py-4 text-left text-sm font-medium text-[#a1a1a1]">Email</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-[#a1a1a1]">Имя</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-[#a1a1a1]">Дата регистрации</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user) => (
                    <tr
                      key={user.id}
                      className="border-b border-[#2a2a2a] last:border-0 hover:bg-[#1a1a1a] transition-colors"
                    >
                      <td className="px-6 py-4 text-sm">{user.email}</td>
                      <td className="px-6 py-4 text-sm text-[#a1a1a1]">{user.name || '—'}</td>
                      <td className="px-6 py-4 text-sm text-[#a1a1a1]">
                        {new Date(user.createdAt).toLocaleDateString('ru-RU')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {filteredUsers.length === 0 && (
              <div className="text-center py-12 text-[#a1a1a1]">
                {search ? 'Пользователи не найдены' : 'Нет пользователей'}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
