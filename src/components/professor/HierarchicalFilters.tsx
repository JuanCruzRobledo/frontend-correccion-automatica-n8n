/**
 * HierarchicalFilters - Componente de filtros jerárquicos en cascada
 * Permite filtrar por: Universidad → Facultad → Carrera → Materia
 * Solo visible para super-admin
 */
import { useState, useEffect } from 'react';
import universityService from '../../services/universityService';
import facultyService from '../../services/facultyService';
import careerService from '../../services/careerService';
import courseService from '../../services/courseService';
import type { University, Faculty, Career, Course } from '../../types';

export interface FilterState {
  universityId: string;
  facultyId: string;
  careerId: string;
  courseId: string;
}

interface HierarchicalFiltersProps {
  onFilterChange: (filters: FilterState) => void;
}

export const HierarchicalFilters = ({ onFilterChange }: HierarchicalFiltersProps) => {
  // Listas de opciones para cada nivel
  const [universities, setUniversities] = useState<University[]>([]);
  const [faculties, setFaculties] = useState<Faculty[]>([]);
  const [careers, setCareers] = useState<Career[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);

  // Estados de selección
  const [selectedUniversity, setSelectedUniversity] = useState('');
  const [selectedFaculty, setSelectedFaculty] = useState('');
  const [selectedCareer, setSelectedCareer] = useState('');
  const [selectedCourse, setSelectedCourse] = useState('');

  // Estados de carga
  const [loadingFaculties, setLoadingFaculties] = useState(false);
  const [loadingCareers, setLoadingCareers] = useState(false);
  const [loadingCourses, setLoadingCourses] = useState(false);

  // Cargar universidades al montar
  useEffect(() => {
    loadUniversities();
  }, []);

  // Cargar facultades cuando cambia universidad
  useEffect(() => {
    if (selectedUniversity) {
      loadFaculties(selectedUniversity);
      // Reset niveles inferiores
      setSelectedFaculty('');
      setSelectedCareer('');
      setSelectedCourse('');
      setFaculties([]);
      setCareers([]);
      setCourses([]);
    } else {
      setFaculties([]);
      setCareers([]);
      setCourses([]);
    }
  }, [selectedUniversity]);

  // Cargar carreras cuando cambia facultad
  useEffect(() => {
    if (selectedFaculty && selectedUniversity) {
      loadCareers(selectedFaculty, selectedUniversity);
      // Reset niveles inferiores
      setSelectedCareer('');
      setSelectedCourse('');
      setCareers([]);
      setCourses([]);
    } else {
      setCareers([]);
      setCourses([]);
    }
  }, [selectedFaculty]);

  // Cargar materias cuando cambia carrera
  useEffect(() => {
    if (selectedCareer && selectedFaculty && selectedUniversity) {
      loadCourses(selectedCareer, selectedFaculty, selectedUniversity);
      // Reset materia seleccionada
      setSelectedCourse('');
      setCourses([]);
    } else {
      setCourses([]);
    }
  }, [selectedCareer]);

  // Notificar cambios al componente padre
  useEffect(() => {
    onFilterChange({
      universityId: selectedUniversity,
      facultyId: selectedFaculty,
      careerId: selectedCareer,
      courseId: selectedCourse,
    });
  }, [selectedUniversity, selectedFaculty, selectedCareer, selectedCourse, onFilterChange]);

  const loadUniversities = async () => {
    try {
      const data = await universityService.getUniversities();
      setUniversities(data);
    } catch (error) {
      console.error('Error al cargar universidades:', error);
    }
  };

  const loadFaculties = async (universityId: string) => {
    try {
      setLoadingFaculties(true);
      const data = await facultyService.getFaculties(universityId);
      setFaculties(data);
    } catch (error) {
      console.error('Error al cargar facultades:', error);
    } finally {
      setLoadingFaculties(false);
    }
  };

  const loadCareers = async (facultyId: string, universityId: string) => {
    try {
      setLoadingCareers(true);
      const data = await careerService.getCareers(facultyId, universityId);
      setCareers(data);
    } catch (error) {
      console.error('Error al cargar carreras:', error);
    } finally {
      setLoadingCareers(false);
    }
  };

  const loadCourses = async (careerId: string, facultyId: string, universityId: string) => {
    try {
      setLoadingCourses(true);
      const data = await courseService.getCourses({
        career_id: careerId,
        faculty_id: facultyId,
        university_id: universityId,
      });
      setCourses(data);
    } catch (error) {
      console.error('Error al cargar materias:', error);
    } finally {
      setLoadingCourses(false);
    }
  };

  const handleClearFilters = () => {
    setSelectedUniversity('');
    setSelectedFaculty('');
    setSelectedCareer('');
    setSelectedCourse('');
    setFaculties([]);
    setCareers([]);
    setCourses([]);
  };

  const hasActiveFilters = selectedUniversity || selectedFaculty || selectedCareer || selectedCourse;

  return (
    <div className="bg-bg-tertiary/30 border-b border-border-primary p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-text-primary">
          🏛️ Filtrar por jerarquía
        </h3>
        {hasActiveFilters && (
          <button
            onClick={handleClearFilters}
            className="text-xs text-accent-1 hover:text-accent-2 transition-colors font-medium"
          >
            🗑️ Limpiar filtros
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 gap-3">
        {/* Select Universidad */}
        <div>
          <label className="text-xs text-text-disabled mb-1.5 block font-medium">
            1. Universidad
          </label>
          <select
            value={selectedUniversity}
            onChange={(e) => setSelectedUniversity(e.target.value)}
            className="w-full px-3 py-2 bg-bg-secondary border border-border-primary rounded-lg text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-accent-1 focus:border-accent-1 transition-all"
          >
            <option value="">Todas las universidades</option>
            {universities.map((uni) => (
              <option key={uni._id} value={uni.university_id}>
                {uni.name}
              </option>
            ))}
          </select>
        </div>

        {/* Select Facultad */}
        <div>
          <label className="text-xs text-text-disabled mb-1.5 block font-medium">
            2. Facultad {selectedUniversity ? '' : '(selecciona universidad primero)'}
          </label>
          <select
            value={selectedFaculty}
            onChange={(e) => setSelectedFaculty(e.target.value)}
            disabled={!selectedUniversity || loadingFaculties}
            className="w-full px-3 py-2 bg-bg-secondary border border-border-primary rounded-lg text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-accent-1 focus:border-accent-1 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <option value="">
              {loadingFaculties ? 'Cargando...' : 'Todas las facultades'}
            </option>
            {faculties.map((fac) => (
              <option key={fac._id} value={fac.faculty_id}>
                {fac.name}
              </option>
            ))}
          </select>
        </div>

        {/* Select Carrera */}
        <div>
          <label className="text-xs text-text-disabled mb-1.5 block font-medium">
            3. Carrera {selectedFaculty ? '' : '(selecciona facultad primero)'}
          </label>
          <select
            value={selectedCareer}
            onChange={(e) => setSelectedCareer(e.target.value)}
            disabled={!selectedFaculty || loadingCareers}
            className="w-full px-3 py-2 bg-bg-secondary border border-border-primary rounded-lg text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-accent-1 focus:border-accent-1 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <option value="">
              {loadingCareers ? 'Cargando...' : 'Todas las carreras'}
            </option>
            {careers.map((car) => (
              <option key={car._id} value={car.career_id}>
                {car.name}
              </option>
            ))}
          </select>
        </div>

        {/* Select Materia */}
        <div>
          <label className="text-xs text-text-disabled mb-1.5 block font-medium">
            4. Materia {selectedCareer ? '' : '(selecciona carrera primero)'}
          </label>
          <select
            value={selectedCourse}
            onChange={(e) => setSelectedCourse(e.target.value)}
            disabled={!selectedCareer || loadingCourses}
            className="w-full px-3 py-2 bg-bg-secondary border border-border-primary rounded-lg text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-accent-1 focus:border-accent-1 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <option value="">
              {loadingCourses ? 'Cargando...' : 'Todas las materias'}
            </option>
            {courses.map((course) => (
              <option key={course._id} value={course.course_id}>
                {course.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Indicador de filtros activos */}
      {hasActiveFilters && (
        <div className="mt-3 pt-3 border-t border-border-secondary">
          <div className="flex flex-wrap gap-2">
            {selectedUniversity && (
              <span className="text-xs px-2 py-1 bg-accent-1/20 text-accent-1 rounded-md">
                Universidad: {universities.find(u => u.university_id === selectedUniversity)?.name}
              </span>
            )}
            {selectedFaculty && (
              <span className="text-xs px-2 py-1 bg-accent-1/20 text-accent-1 rounded-md">
                Facultad: {faculties.find(f => f.faculty_id === selectedFaculty)?.name}
              </span>
            )}
            {selectedCareer && (
              <span className="text-xs px-2 py-1 bg-accent-1/20 text-accent-1 rounded-md">
                Carrera: {careers.find(c => c.career_id === selectedCareer)?.name}
              </span>
            )}
            {selectedCourse && (
              <span className="text-xs px-2 py-1 bg-accent-1/20 text-accent-1 rounded-md">
                Materia: {courses.find(c => c.course_id === selectedCourse)?.name}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default HierarchicalFilters;
