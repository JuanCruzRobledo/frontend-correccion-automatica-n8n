/**
 * AdminPanel - Panel de administración con tabs
 * Integra UniversitiesManager, CoursesManager y RubricsManager
 */
import { useState } from 'react';
import { UniversitiesManager } from './UniversitiesManager';
import { CoursesManager } from './CoursesManager';
import { RubricsManager } from './RubricsManager';
import { UsersManager } from './UsersManager';

type TabId = 'universities' | 'courses' | 'rubrics' | 'users';

interface Tab {
  id: TabId;
  label: string;
  icon: string;
}

const tabs: Tab[] = [
  { id: 'universities', label: 'Universidades', icon: '🏫' },
  { id: 'courses', label: 'Materias', icon: '📚' },
  { id: 'rubrics', label: 'Rúbricas', icon: '📋' },
  { id: 'users', label: 'Usuarios', icon: '👥' },
];

export const AdminPanel = () => {
  const [activeTab, setActiveTab] = useState<TabId>('universities');

  return (
    <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 min-h-[calc(100vh-5rem)]">
      {/* Sidebar con tabs */}
      <aside className="w-full lg:w-64 flex-shrink-0">
        <div className="bg-bg-secondary/70 border border-border-primary/60 rounded-2xl p-4 lg:sticky lg:top-4">
          <h2 className="text-lg font-semibold text-text-primary mb-4 px-2">
            Panel de Administración
          </h2>
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
              Gestiona universidades, materias, rúbricas y usuarios del sistema desde aquí.
            </p>
          </div>
        </div>
      </aside>

      {/* Contenido principal */}
      <main className="flex-1 min-w-0">
        {activeTab === 'universities' && <UniversitiesManager />}
        {activeTab === 'courses' && <CoursesManager />}
        {activeTab === 'rubrics' && <RubricsManager />}
        {activeTab === 'users' && <UsersManager />}
      </main>
    </div>
  );
};

export default AdminPanel;
