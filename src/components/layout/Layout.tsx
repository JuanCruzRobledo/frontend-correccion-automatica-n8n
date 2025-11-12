/**
 * Layout principal de la aplicación
 * Incluye navbar, aurora background y container
 */
import { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { Button } from '../shared/Button';

interface LayoutProps {
  children: ReactNode;
  showNavbar?: boolean;
}

export const Layout = ({ children, showNavbar = true }: LayoutProps) => {
  const { isAuthenticated, user, logout, isAdmin, hasRole } = useAuth();
  const navigate = useNavigate();

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

      {/* Navbar */}
      {showNavbar && isAuthenticated && (
        <nav className="relative z-50 border-b border-border-primary/60 bg-bg-secondary/50 backdrop-blur-sm sticky top-0">
          <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between py-3 sm:py-0 sm:h-16 gap-3 sm:gap-0">
              {/* Logo */}
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-r from-accent-1 via-accent-2 to-accent-3 flex items-center justify-center flex-shrink-0">
                  <svg
                    className="w-5 h-5 sm:w-6 sm:h-6 text-white"
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
                <div className="min-w-0 flex-1">
                  <h1 className="text-sm sm:text-lg font-semibold truncate text-text-primary">Sistema de Corrección Automática</h1>
                  <p className="text-xs text-text-tertiary hidden sm:block">
                    {isAdmin() && 'Panel de Administración'}
                    {hasRole('professor') && 'Panel del Profesor'}
                    {hasRole('user') && 'Vista de Usuario'}
                  </p>
                </div>
              </div>

              {/* Navigation & User info & Logout */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-4">
                {/* Botones de navegación */}
                <div className="flex items-center gap-2 sm:mr-2">
                  {/* Botón Consolidador - Visible para todos */}
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => navigate('/consolidator')}
                    className="flex-1 sm:flex-none"
                  >
                    <span className="sm:hidden">📦</span>
                    <span className="hidden sm:inline">📦 Consolidador</span>
                  </Button>

                  {/* Botones de navegación según rol */}
                  {isAdmin() && (
                    <>
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => navigate('/admin')}
                        className="flex-1 sm:flex-none"
                      >
                        <span className="sm:hidden">👨‍💼</span>
                        <span className="hidden sm:inline">👨‍💼 Admin Panel</span>
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => navigate('/')}
                        className="flex-1 sm:flex-none"
                      >
                        <span className="sm:hidden">🏠</span>
                        <span className="hidden sm:inline">🏠 Inicio</span>
                      </Button>
                    </>
                  )}

                  {hasRole('professor') && (
                    <>
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => navigate('/professor')}
                        className="flex-1 sm:flex-none"
                      >
                        <span className="sm:hidden">👨‍🏫</span>
                        <span className="hidden sm:inline">👨‍🏫 Mis Comisiones</span>
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => navigate('/')}
                        className="flex-1 sm:flex-none"
                      >
                        <span className="sm:hidden">🏠</span>
                        <span className="hidden sm:inline">🏠 Corrección</span>
                      </Button>
                    </>
                  )}

                  {hasRole('user') && (
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => navigate('/')}
                      className="flex-1 sm:flex-none"
                    >
                      <span className="sm:hidden">🏠</span>
                      <span className="hidden sm:inline">🏠 Inicio</span>
                    </Button>
                  )}
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-2 sm:gap-4">
                  <div className="text-left sm:text-right">
                    <p className="text-xs sm:text-sm font-medium truncate text-text-primary">{user?.username}</p>
                    <p className="text-xs text-text-tertiary capitalize">{user?.role}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="secondary" size="sm" onClick={() => navigate('/profile')} className="flex-shrink-0">
                      <span className="sm:hidden">👤</span>
                      <span className="hidden sm:inline">👤 Mi Perfil</span>
                    </Button>
                    <Button variant="secondary" size="sm" onClick={handleLogout} className="flex-shrink-0">
                      <span className="sm:hidden">Salir</span>
                      <span className="hidden sm:inline">Cerrar Sesión</span>
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </nav>
      )}

      {/* Main Content */}
      <main className="relative z-0">
        {children}
      </main>
    </div>
  );
};

export default Layout;
