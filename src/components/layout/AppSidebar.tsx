/**
 * AppSidebar - Sidebar de navegación global
 * Navegación lateral colapsable para todas las páginas de la aplicación
 */
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

interface AppSidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
}

interface NavItem {
  path: string;
  icon: string;
  label: string;
  roles: string[];
}

export const AppSidebar = ({ isCollapsed, onToggle }: AppSidebarProps) => {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const navItems: NavItem[] = [
    {
      path: '/',
      icon: '🏠',
      label: 'Inicio',
      roles: ['all'],
    },
    {
      path: '/admin',
      icon: '👨‍💼',
      label: 'Panel Admin',
      roles: ['super-admin', 'university-admin', 'faculty-admin', 'professor-admin'],
    },
    {
      path: '/professor',
      icon: '🏛️',
      label: user?.role === 'super-admin' ? 'Ver Comisiones' : 'Mis Comisiones',
      roles: ['super-admin', 'professor', 'professor-admin'],
    },
    {
      path: '/consolidator',
      icon: '📦',
      label: 'Consolidador',
      roles: ['all'],
    },
  ];

  // Filtrar items según rol del usuario
  const visibleItems = navItems.filter((item) => {
    if (item.roles.includes('all')) return true;
    if (!user) return false;

    // Verificar directamente si el rol del usuario está en la lista de roles permitidos
    return item.roles.includes(user.role);
  });

  // Función para verificar si una ruta está activa
  const isActive = (path: string): boolean => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <aside
      className={`
        fixed left-0 top-16 h-[calc(100vh-4rem)]
        bg-bg-secondary border-r border-border-primary
        transition-all duration-300 ease-in-out z-40
        ${isCollapsed ? 'w-16' : 'w-60'}
        overflow-hidden
      `}
    >
      {/* Header con botón de colapsar */}
      <div className="flex items-center justify-between p-4 border-b border-border-primary">
        {!isCollapsed && (
          <h3 className="font-semibold text-text-primary text-sm">Navegación</h3>
        )}
        <button
          onClick={onToggle}
          className="p-2 rounded-lg hover:bg-bg-tertiary transition-colors text-text-primary flex-shrink-0"
          title={isCollapsed ? 'Expandir menú' : 'Colapsar menú'}
        >
          {isCollapsed ? (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          ) : (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          )}
        </button>
      </div>

      {/* Lista de navegación */}
      <nav className="p-2 overflow-y-auto h-[calc(100%-5rem)]">
        {visibleItems.map((item) => {
          const active = isActive(item.path);
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`
                w-full flex items-center gap-3 p-3 rounded-xl mb-1
                transition-all duration-200
                ${
                  active
                    ? 'bg-accent-1 text-white shadow-lg'
                    : 'hover:bg-bg-tertiary text-text-primary'
                }
                ${isCollapsed ? 'justify-center' : ''}
              `}
              title={isCollapsed ? item.label : undefined}
            >
              <span className="text-xl flex-shrink-0">{item.icon}</span>
              {!isCollapsed && (
                <span className="font-medium text-sm truncate">{item.label}</span>
              )}
              {!isCollapsed && active && (
                <div className="ml-auto w-2 h-2 rounded-full bg-white"></div>
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer con información de usuario (clickeable para ir a perfil) */}
      {user && (
        <button
          onClick={() => navigate('/profile')}
          className={`
            absolute bottom-0 left-0 right-0 p-4 border-t border-border-primary bg-bg-secondary
            hover:bg-bg-tertiary transition-colors cursor-pointer
            ${isCollapsed ? 'flex justify-center' : ''}
          `}
          title={isCollapsed ? 'Mi Perfil' : undefined}
        >
          {isCollapsed ? (
            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-accent-1 to-accent-2 flex items-center justify-center text-white font-bold flex-shrink-0">
              {user.username.charAt(0).toUpperCase()}
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-r from-accent-1 to-accent-2 flex items-center justify-center text-white font-bold flex-shrink-0">
                {user.username.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-text-primary truncate">
                  {user.username}
                </p>
                <p className="text-xs text-text-disabled truncate capitalize">
                  {user.role}
                </p>
              </div>
              <svg
                className="w-4 h-4 text-text-disabled flex-shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
            </div>
          )}
        </button>
      )}
    </aside>
  );
};

export default AppSidebar;
