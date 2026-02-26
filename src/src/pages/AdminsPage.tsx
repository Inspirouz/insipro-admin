import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, X } from 'lucide-react';
import type { ExecuterItem } from '../lib/api/executerApi';
import {
  fetchExecuters,
  createExecuter,
  updateExecuter,
  deleteExecuter,
} from '../lib/api/executerApi';
import { PageHeader } from '../components/PageHeader';
import { SearchInput } from '../components/SearchInput';
import { ConfirmDialog } from '../components/ConfirmDialog';

export function AdminsPage() {
  const [items, setItems] = useState<ExecuterItem[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ExecuterItem | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [form, setForm] = useState({
    full_name: '',
    username: '',
    phone_number: '',
    password: '',
    role: 'USER',
    is_active: true,
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const data = await fetchExecuters();
      setItems(data);
    } catch (e) {
      console.error(e);
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  const openCreate = () => {
    setEditingItem(null);
    setForm({
      full_name: '',
      username: '',
      phone_number: '',
      password: '',
      role: 'USER',
      is_active: true,
    });
    setFormOpen(true);
  };

  const openEdit = (item: ExecuterItem) => {
    setEditingItem(item);
    setForm({
      full_name: item.full_name ?? '',
      username: item.username ?? '',
      phone_number: item.phone_number ?? '',
      password: '',
      role: item.role ?? 'USER',
      is_active: item.is_active ?? true,
    });
    setFormOpen(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingItem) {
        await updateExecuter(editingItem.id, {
          full_name: form.full_name || undefined,
          username: form.username || undefined,
          phone_number: form.phone_number || undefined,
          password: form.password || undefined,
          role: form.role || undefined,
        });
      } else {
        await createExecuter({
          full_name: form.full_name || undefined,
          username: form.username || undefined,
          phone_number: form.phone_number || undefined,
          password: form.password || undefined,
          role: form.role || undefined,
        });
      }
      setFormOpen(false);
      loadData();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTargetId) return;
    setDeleting(true);
    try {
      await deleteExecuter(deleteTargetId);
      setDeleteTargetId(null);
      loadData();
    } catch (e) {
      console.error(e);
    } finally {
      setDeleting(false);
    }
  };

  const filtered = items.filter((item) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      (item.full_name ?? '').toLowerCase().includes(q) ||
      (item.username ?? '').toLowerCase().includes(q) ||
      (item.phone_number ?? '').toLowerCase().includes(q) ||
      (item.role ?? '').toLowerCase().includes(q)
    );
  });

  return (
    <div className="p-8">
      <PageHeader
        title="Администраторы"
        actions={
          <button
            type="button"
            onClick={openCreate}
            className="flex items-center gap-2 px-4 py-2.5 bg-white text-black font-medium rounded-lg hover:bg-gray-100 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Добавить
          </button>
        }
      />

      <div className="mb-6">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Поиск по имени, username, телефону, роли..."
        />
      </div>

      {loading ? (
        <div className="text-center py-12 text-text-secondary">Загрузка...</div>
      ) : (
        <div className="bg-bg-secondary border border-border rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="px-6 py-4 text-left text-sm font-medium text-text-secondary">Имя</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-text-secondary">Username</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-text-secondary">Телефон</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-text-secondary">Роль</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-text-secondary">Активен</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-text-secondary">Создан</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-text-secondary">Действия</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((item) => (
                  <tr
                    key={item.id}
                    className="border-b border-border last:border-0 hover:bg-bg-tertiary transition-colors"
                  >
                    <td className="px-6 py-4 text-sm">{item.full_name ?? '—'}</td>
                    <td className="px-6 py-4 text-sm text-text-secondary">{item.username ?? '—'}</td>
                    <td className="px-6 py-4 text-sm text-text-secondary">{item.phone_number ?? '—'}</td>
                    <td className="px-6 py-4 text-sm text-text-secondary">{item.role ?? '—'}</td>
                    <td className="px-6 py-4 text-sm text-text-secondary">
                      {item.is_active ? 'Да' : 'Нет'}
                    </td>
                    <td className="px-6 py-4 text-sm text-text-secondary">
                      {item.created_at
                        ? new Date(item.created_at).toLocaleDateString('ru-RU')
                        : '—'}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => openEdit(item)}
                          className="p-2 rounded-lg bg-bg-tertiary border border-border hover:bg-bg-secondary transition-colors"
                          title="Изменить"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteTargetId(item.id)}
                          className="p-2 rounded-lg bg-red-500/10 border border-red-500/50 text-red-400 hover:bg-red-500/20 transition-colors"
                          title="Удалить"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filtered.length === 0 && (
            <div className="text-center py-12 text-text-secondary">
              {search ? 'Ничего не найдено' : 'Нет администраторов'}
            </div>
          )}
        </div>
      )}

      {/* Add/Edit form modal */}
      {formOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-transparent" onClick={() => !saving && setFormOpen(false)} aria-hidden />
          <div className="relative w-full max-w-md bg-bg-secondary border border-border rounded-xl shadow-soft-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-medium">
                {editingItem ? 'Редактировать администратора' : 'Добавить администратора'}
              </h2>
              <button
                type="button"
                onClick={() => !saving && setFormOpen(false)}
                className="p-1 hover:bg-bg-tertiary rounded transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleFormSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Полное имя</label>
                <input
                  type="text"
                  value={form.full_name}
                  onChange={(e) => setForm((p) => ({ ...p, full_name: e.target.value }))}
                  className="w-full px-4 py-2.5 bg-bg-tertiary border border-border rounded-lg focus:outline-none focus:border-lime transition-colors"
                  placeholder="Ahmadjon"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Username</label>
                <input
                  type="text"
                  value={form.username}
                  onChange={(e) => setForm((p) => ({ ...p, username: e.target.value }))}
                  className="w-full px-4 py-2.5 bg-bg-tertiary border border-border rounded-lg focus:outline-none focus:border-lime transition-colors"
                  placeholder="username"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Телефон</label>
                <input
                  type="text"
                  value={form.phone_number}
                  onChange={(e) => setForm((p) => ({ ...p, phone_number: e.target.value }))}
                  className="w-full px-4 py-2.5 bg-bg-tertiary border border-border rounded-lg focus:outline-none focus:border-lime transition-colors"
                  placeholder="+998901234567"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">
                  Пароль {editingItem && '(оставьте пустым, чтобы не менять)'}
                </label>
                <input
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
                  className="w-full px-4 py-2.5 bg-bg-tertiary border border-border rounded-lg focus:outline-none focus:border-lime transition-colors"
                  placeholder="••••••••"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Роль</label>
                <input
                  type="text"
                  value={form.role}
                  onChange={(e) => setForm((p) => ({ ...p, role: e.target.value }))}
                  className="w-full px-4 py-2.5 bg-bg-tertiary border border-border rounded-lg focus:outline-none focus:border-lime transition-colors"
                  placeholder="USER"
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={form.is_active}
                  onChange={(e) => setForm((p) => ({ ...p, is_active: e.target.checked }))}
                  className="rounded border-border bg-bg-tertiary"
                />
                <label htmlFor="is_active" className="text-sm font-medium">Активен</label>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 px-4 py-2.5 bg-white text-black font-medium rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50"
                >
                  {saving ? 'Сохранение...' : 'Сохранить'}
                </button>
                <button
                  type="button"
                  onClick={() => setFormOpen(false)}
                  disabled={saving}
                  className="flex-1 px-4 py-2.5 bg-bg-tertiary border border-border rounded-lg hover:bg-bg-secondary transition-colors disabled:opacity-50"
                >
                  Отмена
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmDialog
        isOpen={!!deleteTargetId}
        onClose={() => setDeleteTargetId(null)}
        onConfirm={handleDeleteConfirm}
        title="Удалить администратора?"
        description="Вы уверены, что хотите удалить этого администратора? Это действие нельзя отменить."
        confirmLabel="Удалить"
        cancelLabel="Отмена"
        variant="danger"
        loading={deleting}
      />
    </div>
  );
}
