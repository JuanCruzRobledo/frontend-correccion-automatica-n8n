/**
 * AdminPanel - Panel de administración con tabs
 * Integra toda la gestión académica jerárquica
 * Versión 4.0 - Soporte para roles jerárquicos (faculty-admin, professor-admin)
 */
import { useState, useMemo, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { getAdminPanelTitle, getVisibleTabs } from '../../utils/roleHelper';
import type { TitleInfo } from '../../utils/roleHelper';
import courseService from '../../services/courseService';
import careerService from '../../services/careerService';
import type { Course, Career } from '../../types';
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
  const isProfessorAdmin = user?.role === 'professor-admin';
  const userCourseIds = user?.course_ids || [];

  // Estado para el título dinámico
  const [titleInfo, setTitleInfo] = useState<TitleInfo>({ title: 'Panel de Administración' });

  // Estados para professor-admin
  const [professorCourses, setProfessorCourses] = useState<Course[]>([]);
  const [careers, setCareers] = useState<Career[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<string>('');

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

  // Cargar cursos del profesor si es professor-admin
  useEffect(() => {
    if (isProfessorAdmin && userCourseIds.length > 0) {
      const loadProfessorCourses = async () => {
        try {
          const [coursesData, careersData] = await Promise.all([
            courseService.getCourses(),
            careerService.getCareers(),
          ]);

          // Filtrar solo los cursos del profesor
          const profCourses = coursesData.filter(c => userCourseIds.includes(c.course_id));
          setProfessorCourses(profCourses);
          setCareers(careersData);

          // Auto-seleccionar si solo tiene 1 curso
          if (profCourses.length === 1) {
            setSelectedCourse(profCourses[0].course_id);
          }
        } catch (err) {
          console.error('Error al cargar cursos del profesor:', err);
        }
      };
      loadProfessorCourses();
    }
  }, [isProfessorAdmin, userCourseIds]);

  return (
    <div className="min-h-[calc(100vh-5rem)]">
      {/* Layout diferente para professor-admin */}
      {isProfessorAdmin ? (
        <div className="space-y-6">
          {/* Selector de materia - Card principal arriba */}
          <div className="bg-gradient-to-br from-accent-1/10 via-accent-2/10 to-accent-3/10 border-2 border-accent-1/30 rounded-2xl p-6 shadow-lg">
            <div className="flex items-start gap-4">
              <div className="text-4xl">📚</div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-text-primary mb-2">
                  Paso 1: Selecciona la Materia a Gestionar
                </h3>
                <p className="text-sm text-text-tertiary mb-4">
                  Elige la materia que deseas administrar. Las opciones de gestión aparecerán una vez seleccionada.
                </p>
                <select
                  className="w-full px-4 py-3 bg-bg-secondary border-2 border-border-primary rounded-xl text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-1 focus:border-accent-1 transition-all"
                  value={selectedCourse}
                  onChange={(e) => setSelectedCourse(e.target.value)}
                >
                  <option value="">-- Selecciona una materia --</option>
                  {professorCourses.map((course) => {
                    const career = careers.find(c => c.career_id === course.career_id);
                    return (
                      <option key={course._id} value={course.course_id}>
                        {course.name} - {career?.name || course.career_id} (Año {course.year})
                      </option>
                    );
                  })}
                </select>
                {selectedCourse && (
                  <div className="mt-3 flex items-center gap-2 text-sm text-accent-1 font-medium bg-accent-1/10 rounded-lg px-3 py-2">
                    <span>✅</span>
                    <span>Materia seleccionada correctamente</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Área de gestión subordinada - Solo visible si hay materia seleccionada */}
          {selectedCourse ? (
            <div className="bg-bg-secondary/50 border border-border-primary/60 rounded-2xl p-6 ml-0 lg:ml-8">
              <div className="mb-6 flex items-center gap-3">
                <div className="w-1 h-8 bg-gradient-to-b from-accent-1 to-accent-2 rounded-full"></div>
                <div>
                  <h3 className="text-lg font-semibold text-text-primary">
                    Paso 2: Gestiona tu Materia
                  </h3>
                  <p className="text-sm text-text-disabled">
                    {professorCourses.find(c => c.course_id === selectedCourse)?.name}
                  </p>
                </div>
              </div>

              {/* Tabs horizontales subordinados */}
              <div className="flex flex-wrap gap-3 mb-6 p-4 bg-bg-tertiary/30 rounded-xl border border-border-secondary/50">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`
                      flex items-center gap-2 px-5 py-2.5 rounded-lg
                      transition-all duration-200 font-medium
                      ${
                        activeTab === tab.id
                          ? 'bg-gradient-to-r from-accent-1 via-accent-2 to-accent-3 text-white shadow-md scale-105'
                          : 'bg-bg-secondary/70 text-text-tertiary hover:bg-bg-secondary hover:text-text-primary hover:scale-102'
                      }
                    `}
                  >
                    <span className="text-xl">{tab.icon}</span>
                    <span className="text-sm">{tab.label}</span>
                  </button>
                ))}
              </div>

              {/* Contenido */}
              <div className="mt-6">
                {activeTab === 'commissions' && <CommissionsManager selectedProfessorCourse={selectedCourse} />}
                {activeTab === 'rubrics' && <RubricsManager selectedProfessorCourse={selectedCourse} />}
                {activeTab === 'users' && <UsersManager />}
              </div>
            </div>
          ) : (
            <div className="text-center py-20 bg-bg-secondary/30 rounded-2xl border-2 border-dashed border-border-primary/40 ml-0 lg:ml-8">
              <div className="mb-4 opacity-40">
                <span className="text-6xl">👆</span>
              </div>
              <h3 className="text-xl font-semibold text-text-primary mb-2">
                Selecciona una Materia Arriba
              </h3>
              <p className="text-text-tertiary">
                Las opciones de gestión aparecerán una vez que selecciones una materia
              </p>
            </div>
          )}
        </div>
      ) : (
        // Layout original para otros roles
        <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
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
      )}
    </div>
  );
};

export default AdminPanel;
