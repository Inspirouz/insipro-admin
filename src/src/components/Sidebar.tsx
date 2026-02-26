import { useLocation, useNavigate, Link } from 'react-router-dom';
import { LayoutGrid, Monitor, Tags, Users, ShieldCheck, Settings, LogOut } from 'lucide-react';
import { logout } from '../lib/auth';

const navigation = [
  { name: 'Приложения', href: '/apps', icon: LayoutGrid },
  { name: 'Экраны', href: '/screens', icon: Monitor },
  { name: 'Категории', href: '/categories', icon: Tags },
  { name: 'Пользователи', href: '/users', icon: Users },
  { name: 'Администраторы', href: '/admins', icon: ShieldCheck },
  { name: 'Настройки', href: '/settings', icon: Settings },
];

export function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="flex h-screen w-64 flex-col bg-[#141414] border-r border-[#2a2a2a]">
      {/* Logo */}
      <div className="flex h-16 items-center px-6 border-b border-[#2a2a2a]">
        <h1 className="text-xl font-bold">AdminPanel</h1>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3 py-4">
        {navigation.map((item) => {
          const isActive = location.pathname.startsWith(item.href);
          return (
            <Link
              key={item.name}
              to={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-all ${
                isActive
                  ? 'bg-[#a3e635] text-black'
                  : 'text-[#a1a1a1] hover:bg-[#1a1a1a] hover:text-white'
              }`}
            >
              <item.icon className="h-5 w-5" />
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* Logout button */}
      <div className="border-t border-[#2a2a2a] p-3">
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 px-3 py-2.5 text-sm font-medium text-[#a1a1a1] hover:bg-[#1a1a1a] hover:text-white rounded-lg transition-all"
        >
          <LogOut className="h-5 w-5" />
          Выйти
        </button>
      </div>
    </div>
  );
}
