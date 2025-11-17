/**
 * Helper para gestión de roles y títulos dinámicos
 */
import type { User, University, Faculty, Course } from '../types';
import universityService from '../services/universityService';
import facultyService from '../services/facultyService';
import courseService from '../services/courseService';

export interface TitleInfo {
  title: string;
  subtitle?: string;
}

/**
 * Obtiene el título y subtítulo del panel de administración según el rol del usuario
 */
export const getAdminPanelTitle = async (user: User | null): Promise<TitleInfo> => {
  if (!user) {
    return { title: 'Panel de Administración' };
  }

  try {
    switch (user.role) {
      case 'super-admin':
        return {
          title: 'Panel de Administración Global',
        };

      case 'university-admin': {
        if (!user.university_id) {
          return { title: 'Gestión Universitaria' };
        }

        // Buscar nombre de la universidad
        const universitiesResponse = await universityService.getAll();
        const university = universitiesResponse.data?.find(
          (u: University) => u.university_id === user.university_id
        );

        return {
          title: `Gestión ${university?.name || user.university_id}`,
        };
      }

      case 'faculty-admin': {
        if (!user.faculty_id || !user.university_id) {
          return { title: 'Gestión de Facultad' };
        }

        // Buscar nombre de la facultad y universidad
        const [universitiesResponse, facultiesResponse] = await Promise.all([
          universityService.getAll(),
          facultyService.getAll(),
        ]);

        const university = universitiesResponse.data?.find(
          (u: University) => u.university_id === user.university_id
        );
        const faculty = facultiesResponse.data?.find(
          (f: Faculty) => f.faculty_id === user.faculty_id
        );

        return {
          title: `Gestión de ${faculty?.name || user.faculty_id}`,
          subtitle: `Universidad: ${university?.name || user.university_id}`,
        };
      }

      case 'professor-admin': {
        if (!user.course_ids || user.course_ids.length === 0) {
          return { title: 'Gestión de Cátedra' };
        }

        // Si tiene solo 1 curso, mostrar el nombre del curso
        if (user.course_ids.length === 1) {
          const coursesResponse = await courseService.getAll();
          const course = coursesResponse.data?.find(
            (c: Course) => c.course_id === user.course_ids![0]
          );

          return {
            title: `Gestión de ${course?.name || 'Cátedra'}`,
          };
        }

        // Si tiene múltiples cursos, mostrar título genérico
        return {
          title: 'Gestión de Cátedras',
          subtitle: `${user.course_ids.length} materias asignadas`,
        };
      }

      case 'professor':
        return {
          title: 'Gestión de Rúbricas',
        };

      case 'user':
        return {
          title: 'Corrección Automática',
        };

      default:
        return {
          title: 'Panel de Administración',
        };
    }
  } catch (error) {
    console.error('Error obteniendo título del panel:', error);
    return { title: 'Panel de Administración' };
  }
};

/**
 * Obtiene los tabs visibles según el rol del usuario
 */
export const getVisibleTabs = (user: User | null): string[] => {
  if (!user) return [];

  switch (user.role) {
    case 'super-admin':
      return [
        'universities',
        'faculties',
        'careers',
        'courses',
        'commissions',
        'rubrics',
        'users',
      ];

    case 'university-admin':
      return [
        'faculties',
        'careers',
        'courses',
        'commissions',
        'rubrics',
        'users',
      ];

    case 'faculty-admin':
      return [
        'careers',
        'courses',
        'commissions',
        'rubrics',
        'users',
      ];

    case 'professor-admin':
      return [
        'commissions',
        'rubrics',
      ];

    case 'professor':
      return [
        'rubrics',
      ];

    default:
      return [];
  }
};

/**
 * Verifica si el usuario puede crear usuarios
 */
export const canCreateUsers = (user: User | null): boolean => {
  if (!user) return false;

  return [
    'super-admin',
    'university-admin',
    'faculty-admin',
    'professor-admin',
  ].includes(user.role);
};

/**
 * Obtiene los roles que un usuario puede crear según su rol
 */
export const getCreatableRoles = (user: User | null): string[] => {
  if (!user) return [];

  switch (user.role) {
    case 'super-admin':
      return [
        'super-admin',
        'university-admin',
        'faculty-admin',
        'professor-admin',
        'professor',
        'user',
      ];

    case 'university-admin':
      return [
        'faculty-admin',
        'professor-admin',
        'professor',
        'user',
      ];

    case 'faculty-admin':
      return [
        'professor-admin',
        'professor',
        'user',
      ];

    case 'professor-admin':
      return [
        'professor',
        'user',
      ];

    default:
      return [];
  }
};

/**
 * Verifica si el usuario tiene acceso a una tab específica
 */
export const hasAccessToTab = (user: User | null, tab: string): boolean => {
  const visibleTabs = getVisibleTabs(user);
  return visibleTabs.includes(tab);
};

/**
 * Obtiene el nombre legible de un rol
 */
export const getRoleDisplayName = (role: string): string => {
  const roleNames: Record<string, string> = {
    'super-admin': 'Super Administrador',
    'university-admin': 'Administrador Universitario',
    'faculty-admin': 'Administrador de Facultad',
    'professor-admin': 'Jefe de Cátedra',
    'professor': 'Profesor',
    'user': 'Usuario',
    'admin': 'Administrador',
  };

  return roleNames[role] || role;
};

export default {
  getAdminPanelTitle,
  getVisibleTabs,
  canCreateUsers,
  getCreatableRoles,
  hasAccessToTab,
  getRoleDisplayName,
};
