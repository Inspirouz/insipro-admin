import { useEffect, useState } from 'react';
import { fetchAdminUsers, updateAdminUser } from '../lib/api/adminUsersApi';
import type { User, SubscriptionStatus } from '../lib/types';
import { PageHeader } from '../components/PageHeader';
import { SearchInput } from '../components/SearchInput';

const statusColors: Record<SubscriptionStatus, string> = {
  trial: 'bg-blue-500/20 text-blue-400 border-blue-500/50',
  active: 'bg-green-500/20 text-green-400 border-green-500/50',
  past_due: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50',
  canceled: 'bg-gray-500/20 text-gray-400 border-gray-500/50',
  expired: 'bg-red-500/20 text-red-400 border-red-500/50',
};

const statusLabels: Record<SubscriptionStatus, string> = {
  trial: 'Триал',
  active: 'Активна',
  past_due: 'Просрочена',
  canceled: 'Отменена',
  expired: 'Истекла',
};

export function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const data = await fetchAdminUsers({ search: search || undefined, status: statusFilter || undefined });
      setUsers(data);
    } catch (e) {
      console.error(e);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (userId: string, status: SubscriptionStatus) => {
    await updateAdminUser(userId, { subscriptionStatus: status });
    setEditingUserId(null);
    loadData();
  };

  const filteredUsers = users.filter(user => {
    if (statusFilter && user.subscriptionStatus !== statusFilter) return false;
    if (search) {
      const searchLower = search.toLowerCase();
      return (
        user.email.toLowerCase().includes(searchLower) ||
        user.name?.toLowerCase().includes(searchLower)
      );
    }
    return true;
  });

  return (
    <div className="p-8">
      <PageHeader title="Пользователи" />

      <div className="flex gap-4 mb-6">
        <div className="flex-1">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Поиск по email или имени..."
          />
        </div>
        {/* <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2.5 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg focus:outline-none focus:border-[#a3e635] transition-colors"
        >
          <option value="">Все статусы</option>
          <option value="trial">Триал</option>
          <option value="active">Активна</option>
          <option value="past_due">Просрочена</option>
          <option value="canceled">Отменена</option>
          <option value="expired">Истекла</option>
        </select> */}
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
                  <th className="px-6 py-4 text-left text-sm font-medium text-[#a1a1a1]">Статус</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-[#a1a1a1]">План</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-[#a1a1a1]">Окончание</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-[#a1a1a1]">Создан</th>
                  {/* <th className="px-6 py-4 text-left text-sm font-medium text-[#a1a1a1]">Действия</th> */}
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="border-b border-[#2a2a2a] last:border-0 hover:bg-[#1a1a1a] transition-colors">
                    <td className="px-6 py-4 text-sm">{user.email}</td>
                    <td className="px-6 py-4 text-sm text-[#a1a1a1]">{user.name || '—'}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded border ${statusColors[user.subscriptionStatus]}`}>
                        {statusLabels[user.subscriptionStatus]}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-[#a1a1a1]">{user.plan || '—'}</td>
                    <td className="px-6 py-4 text-sm text-[#a1a1a1]">
                      {user.periodEnd ? new Date(user.periodEnd).toLocaleDateString('ru-RU') : '—'}
                    </td>
                    <td className="px-6 py-4 text-sm text-[#a1a1a1]">
                      {new Date(user.createdAt).toLocaleDateString('ru-RU')}
                    </td>
                    {/* <td className="px-6 py-4">
                      {editingUserId === user.id ? (
                        <div className="flex gap-2">
                          <select
                            value={user.subscriptionStatus}
                            onChange={(e) => handleStatusChange(user.id, e.target.value as SubscriptionStatus)}
                            className="px-3 py-1.5 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg text-sm focus:outline-none focus:border-[#a3e635]"
                            autoFocus
                          >
                            <option value="trial">Триал</option>
                            <option value="active">Активна</option>
                            <option value="past_due">Просрочена</option>
                            <option value="canceled">Отменена</option>
                            <option value="expired">Истекла</option>
                          </select>
                          <button
                            onClick={() => setEditingUserId(null)}
                            className="px-3 py-1.5 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg text-sm hover:bg-[#242424] transition-colors"
                          >
                            Отмена
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setEditingUserId(user.id)}
                          className="px-3 py-1.5 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg text-sm hover:bg-[#242424] transition-colors"
                        >
                          Изменить
                        </button>
                      )}
                    </td> */}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredUsers.length === 0 && (
            <div className="text-center py-12 text-[#a1a1a1]">
              {search || statusFilter ? 'Пользователи не найдены' : 'Нет пользователей'}
            </div>
          )}
        </div>
      )}
    </div>
  );
}