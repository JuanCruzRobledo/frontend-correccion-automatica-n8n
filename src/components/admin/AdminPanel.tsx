/**
 * AdminPanel - Panel de administración con tabs
 * Integra toda la gestión académica jerárquica
 * Versión 4.0 - Soporte para roles jerárquicos (faculty-admin, professor-admin)
 */
import { useState, useMemo, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { getAdminPanelTitle, getVisibleTabs } from '../../utils/roleHelper';
import type { TitleInfo } from '../../utils/roleHelper';
import { UniversitiesManager } from './UniversitiesManager';
import { FacultiesManager } from './FacultiesManager';
import { CareersManager } from './CareersManager';
import { CoursesManager } from './CoursesManager';
import { CommissionsManager } from './CommissionsManager';
import { RubricsManager } from './RubricsManager';
import { UsersManager } from './UsersManager';

type TabId = 'universities' | 'faculties' | 'careers' | 'courses' | 'commissions' | 'rubrics' | 'users';

interface Tab {
  id: TabId;
  label: string;
  icon: string;
  requiredRole?: 'super-admin'; // Solo visible para super-admin
}

const allTabs: Tab[] = [
  { id: 'universities', label: 'Universidades', icon: '🏫', requiredRole: 'super-admin' },
  { id: 'faculties', label: 'Facultades', icon: '🏛️' },
  { id: 'careers', label: 'Carreras', icon: '🎓' },
  { id: 'courses', label: 'Materias', icon: '📚' },
  { id: 'commissions', label: 'Comisiones', icon: '👥' },
  { id: 'rubrics', label: 'Rúbricas', icon: '📋' },
  { id: 'users', label: 'Usuarios', icon: '🔐' },
];

export const AdminPanel = () => {
  const { user } = useAuth();

  // Estado para el título dinámico
  const [titleInfo, setTitleInfo] = useState<TitleInfo>({ title: 'Panel de Administración' });

  // Cargar título dinámico según rol
  useEffect(() => {
    const loadTitle = async () => {
      const info = await getAdminPanelTitle(user);
      setTitleInfo(info);
    };

    loadTitle();
  }, [user]);

  // Filtrar tabs según rol del usuario usando el helper
  const tabs = useMemo(() => {
    const visibleTabIds = getVisibleTabs(user);
    return allTabs.filter(tab => visibleTabIds.includes(tab.id));
  }, [user]);

  // Tab inicial: primer tab disponible para el usuario
  const [activeTab, setActiveTab] = useState<TabId>(tabs[0]?.id || 'faculties');

  // Actualizar activeTab cuando cambien los tabs disponibles
  useEffect(() => {
    if (tabs.length > 0 && !tabs.find(t => t.id === activeTab)) {
      setActiveTab(tabs[0].id);
    }
  }, [tabs, activeTab]);

  return (
    <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 min-h-[calc(100vh-5rem)]">
      {/* Sidebar con tabs */}
      <aside className="w-full lg:w-64 flex-shrink-0">
        <div className="bg-bg-secondary/70 border border-border-primary/60 rounded-2xl p-4 lg:sticky lg:top-4">
          {/* Título dinámico según rol */}
          <div className="mb-4 px-2">
            <h2 className="text-lg font-semibold text-text-primary">
              {titleInfo.title}
            </h2>
            {titleInfo.subtitle && (
              <p className="text-xs text-text-disabled mt-1">
                {titleInfo.subtitle}
              </p>
            )}
          </div>
          <nav className="space-y-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  w-full flex items-center gap-3 px-4 py-3 rounded-xl
                  transition-all duration-200
                  ${
                    activeTab === tab.id
                      ? 'bg-gradient-to-r from-accent-1 via-accent-2 to-accent-3 text-white shadow-lg'
                      : 'bg-bg-tertiary/40 text-text-tertiary hover:bg-bg-tertiary hover:text-text-primary'
                  }
                `}
              >
                <span className="text-2xl">{tab.icon}</span>
                <span className="font-medium">{tab.label}</span>
              </button>
            ))}
          </nav>

          {/* Info adicional */}
          <div className="mt-6 pt-6 border-t border-border-primary/60">
            <p className="text-xs text-text-disabled px-2">
              Gestiona la jerarquía académica completa: Universidad → Facultad → Carrera → Materia → Comisión → Rúbrica
            </p>
          </div>
        </div>
      </aside>

      {/* Contenido principal */}
      <main className="flex-1 min-w-0">
        {activeTab === 'universities' && <UniversitiesManager />}
        {activeTab === 'faculties' && <FacultiesManager />}
        {activeTab === 'careers' && <CareersManager />}
        {activeTab === 'courses' && <CoursesManager />}
        {activeTab === 'commissions' && <CommissionsManager />}
        {activeTab === 'rubrics' && <RubricsManager />}
        {activeTab === 'users' && <UsersManager />}
      </main>
    </div>
  );
};

export default AdminPanel;
