/**
 * Layout principal de la aplicación
 * Incluye navbar superior simplificado, sidebar lateral y aurora background
 */
import { ReactNode, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { Button } from '../shared/Button';
import { AppSidebar } from './AppSidebar';

interface LayoutProps {
  children: ReactNode;
  showNavbar?: boolean;
}

export const Layout = ({ children, showNavbar = true }: LayoutProps) => {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="relative w-full h-full bg-bg-primary text-text-primary">
      {/* Aurora Background - Fixed */}
      <div className="backdrop-aurora pointer-events-none fixed inset-0">
        <div className="aurora-1"></div>
        <div className="aurora-2"></div>
      </div>

      {/* Navbar Superior Simplificado */}
      {showNavbar && isAuthenticated && (
        <nav className="relative z-50 border-b border-border-primary/60 bg-bg-secondary/50 backdrop-blur-sm fixed top-0 left-0 right-0 h-16">
          <div className="h-full px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-full">
              {/* Logo */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-r from-accent-1 via-accent-2 to-accent-3 flex items-center justify-center flex-shrink-0">
                  <svg
                    className="w-6 h-6 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                </div>
                <div className="hidden sm:block">
                  <h1 className="text-lg font-semibold text-text-primary">
                    Sistema de Corrección Automática
                  </h1>
                </div>
              </div>

              {/* Usuario y Logout */}
              <div className="flex items-center gap-4">
                <div className="hidden md:block text-right">
                  <p className="text-sm font-medium text-text-primary">{user?.username}</p>
                  <p className="text-xs text-text-tertiary capitalize">{user?.role}</p>
                </div>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleLogout}
                  className="flex-shrink-0"
                >
                  <span className="sm:hidden">Salir</span>
                  <span className="hidden sm:inline">Cerrar Sesión</span>
                </Button>
              </div>
            </div>
          </div>
        </nav>
      )}

      {/* Sidebar Lateral */}
      {isAuthenticated && (
        <AppSidebar
          isCollapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        />
      )}

      {/* Main Content con padding ajustable según estado del sidebar */}
      <main
        className={`
          relative z-0 transition-all duration-300
          ${isAuthenticated ? 'pt-16' : 'pt-0'}
          ${
            isAuthenticated
              ? sidebarCollapsed
                ? 'ml-16'
                : 'ml-60'
              : 'ml-0'
          }
        `}
      >
        {children}
      </main>
    </div>
  );
};

export default Layout;
