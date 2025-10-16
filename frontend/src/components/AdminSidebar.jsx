import { motion } from 'framer-motion';
import {
  LayoutDashboard,
  Settings,
  Music,
  Shield,
  TrendingUp,
  Lock,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Gift
} from 'lucide-react';
import clsx from 'clsx';
import { useAuthStore } from '../store/authStore';

const menuItems = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'configuracoes', label: 'Configurações', icon: Settings },
  { id: 'player', label: 'Player', icon: Music },
  { id: 'moderacao', label: 'Moderação', icon: Shield },
  { id: 'sugestoes', label: 'Sugestões', icon: TrendingUp },
  { id: 'giftcards', label: 'Gift Cards', icon: Gift },
  { id: 'senha', label: 'Alterar Senha', icon: Lock },
];

export default function AdminSidebar({ activeTab, onTabChange, collapsed, onToggle }) {
  const { admin, logout } = useAuthStore();

  return (
    <motion.aside
      className={clsx(
        'fixed left-0 top-0 h-full glass border-r border-dark-border z-40 transition-all duration-300',
        collapsed ? 'w-20' : 'w-64'
      )}
      initial={{ x: -100 }}
      animate={{ x: 0 }}
    >
      {/* Logo */}
      <div className="p-6 border-b border-dark-border">
        {collapsed ? (
          <div className="text-2xl font-bold gradient-text text-center">
            EM
          </div>
        ) : (
          <h1 className="text-2xl font-bold gradient-text">
            Espeto Music
          </h1>
        )}
      </div>

      {/* Menu Items */}
      <nav className="p-4 flex-1 overflow-y-auto">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <motion.button
              key={item.id}
              className={clsx(
                'w-full flex items-center gap-3 px-4 py-3 rounded-lg mb-2 transition-all',
                isActive
                  ? 'neon-border bg-neon-cyan/10 text-neon-cyan'
                  : 'text-gray-400 hover:bg-neon-cyan/5 hover:text-white',
                collapsed && 'justify-center'
              )}
              onClick={() => onTabChange(item.id)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              {!collapsed && (
                <span className="font-medium">{item.label}</span>
              )}
            </motion.button>
          );
        })}
      </nav>

      {/* User Info & Logout */}
      <div className="p-4 border-t border-dark-border">
        {!collapsed && admin && (
          <div className="mb-3 px-4 py-2 glass rounded-lg">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-neon-cyan to-neon-purple flex items-center justify-center text-white font-bold">
                {admin.nome?.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white truncate">
                  {admin.nome}
                </p>
                <p className="text-xs text-gray-400 truncate">
                  {admin.username}
                </p>
              </div>
            </div>
          </div>
        )}

        <button
          onClick={logout}
          className={clsx(
            'w-full flex items-center gap-3 px-4 py-3 rounded-lg text-red-400 hover:bg-red-500/10 transition-all',
            collapsed && 'justify-center'
          )}
        >
          <LogOut className="w-5 h-5" />
          {!collapsed && <span>Sair</span>}
        </button>

        {/* Collapse Toggle */}
        <button
          onClick={onToggle}
          className="mt-2 w-full flex items-center justify-center px-4 py-2 rounded-lg glass hover:bg-neon-cyan/10 transition-all"
        >
          {collapsed ? (
            <ChevronRight className="w-5 h-5 text-gray-400" />
          ) : (
            <ChevronLeft className="w-5 h-5 text-gray-400" />
          )}
        </button>
      </div>
    </motion.aside>
  );
}
