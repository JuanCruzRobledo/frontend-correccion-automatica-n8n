/**
 * UserView - Vista simplificada para usuarios normales
 * Permite seleccionar universidad, curso, rúbrica y corregir archivos
 */
import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Card } from '../shared/Card';
import { Select } from '../shared/Select';
import { Input } from '../shared/Input';
import { Button } from '../shared/Button';
import universityService from '../../services/universityService';
import facultyService from '../../services/facultyService';
import careerService from '../../services/careerService';
import courseService from '../../services/courseService';
import commissionService from '../../services/commissionService';
import rubricService from '../../services/rubricService';
import profileService from '../../services/profileService';
import type { University, Faculty, Career, Course, Commission, Rubric, UserProfile } from '../../types';
import axios from 'axios';
import html2pdf from 'html2pdf.js';

export const UserView = () => {
  // Estado de perfil del usuario (para verificar API key)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);

  // Datos de catálogos
  const [universities, setUniversities] = useState<University[]>([]);
  const [faculties, setFaculties] = useState<Faculty[]>([]);
  const [careers, setCareers] = useState<Career[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [rubrics, setRubrics] = useState<Rubric[]>([]);

  // Selecciones
  const [selectedUniversityId, setSelectedUniversityId] = useState('');
  const [selectedFacultyId, setSelectedFacultyId] = useState('');
  const [selectedCareerId, setSelectedCareerId] = useState('');
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [selectedCommissionId, setSelectedCommissionId] = useState('');
  const [selectedRubricId, setSelectedRubricId] = useState('');

  // Estado para corrección automática masiva
  const [isBatchGrading, setIsBatchGrading] = useState(false);
  const [batchGradingResult, setBatchGradingResult] = useState('');
  const [batchGradingDriveLink, setBatchGradingDriveLink] = useState('');
  const [batchGradingError, setBatchGradingError] = useState('');

  // Archivo a corregir (para corrección manual)
  const [submissionFile, setSubmissionFile] = useState<File | null>(null);

  // Resultado de la corrección manual
  const [gradingResult, setGradingResult] = useState('');
  const [gradingError, setGradingError] = useState('');
  const [isGrading, setIsGrading] = useState(false);
  const resultRef = useRef<HTMLDivElement>(null);

  // Datos para subir a planilla
  const [spreadsheetUrl, setSpreadsheetUrl] = useState('');
  const [sheetName, setSheetName] = useState('');
  const [studentName, setStudentName] = useState('');
  const [grade, setGrade] = useState('');
  const [summaryByCriteria, setSummaryByCriteria] = useState('');
  const [strengths, setStrengths] = useState('');
  const [recommendations, setRecommendations] = useState('');
  const [isUploadingToSheet, setIsUploadingToSheet] = useState(false);

  // Cargar perfil del usuario al montar (para verificar API key)
  useEffect(() => {
    loadProfile();
  }, []);

  // Cargar universidades al montar
  useEffect(() => {
    loadUniversities();
  }, []);

  // Cargar facultades cuando cambia la universidad
  useEffect(() => {
    // Siempre limpiar primero
    setFaculties([]);
    setCareers([]);
    setCourses([]);
    setCommissions([]);
    setRubrics([]);
    setSelectedFacultyId('');
    setSelectedCareerId('');
    setSelectedCourseId('');
    setSelectedCommissionId('');
    setSelectedRubricId('');
    
    if (selectedUniversityId) {
      loadFaculties(selectedUniversityId);
    }
  }, [selectedUniversityId]);

  // Cargar carreras cuando cambia la facultad
  useEffect(() => {
    // Siempre limpiar primero
    setCareers([]);
    setCourses([]);
    setCommissions([]);
    setRubrics([]);
    setSelectedCareerId('');
    setSelectedCourseId('');
    setSelectedCommissionId('');
    setSelectedRubricId('');
    
    if (selectedFacultyId) {
      loadCareers(selectedFacultyId);
    }
  }, [selectedFacultyId]);

  // Cargar cursos cuando cambia la carrera
  useEffect(() => {
    // Siempre limpiar primero
    setCourses([]);
    setCommissions([]);
    setRubrics([]);
    setSelectedCourseId('');
    setSelectedCommissionId('');
    setSelectedRubricId('');
    
    if (selectedCareerId) {
      loadCourses(selectedCareerId);
    }
  }, [selectedCareerId]);

  // Cargar comisiones cuando cambia el curso
  useEffect(() => {
    // Siempre limpiar primero
    setCommissions([]);
    setSelectedCommissionId('');
    setSelectedRubricId('');
    
    if (selectedCourseId) {
      loadCommissions(selectedCourseId);
    }
  }, [selectedCourseId]);

  // Cargar rúbricas cuando cambia la comisión
  useEffect(() => {
    // Siempre limpiar primero
    setRubrics([]);
    setSelectedRubricId('');
    
    if (selectedCommissionId) {
      loadRubrics(selectedCommissionId);
    }
  }, [selectedCommissionId]);

  const loadProfile = async () => {
    try {
      setLoadingProfile(true);
      const data = await profileService.getProfile();
      setUserProfile(data);
    } catch (err) {
      console.error('Error al cargar perfil:', err);
      setUserProfile(null);
    } finally {
      setLoadingProfile(false);
    }
  };

  const loadUniversities = async () => {
    try {
      const data = await universityService.getUniversities();
      setUniversities(data);
    } catch (err) {
      console.error('Error al cargar universidades:', err);
    }
  };

  const loadFaculties = async (universityId: string) => {
    try {
      const data = await facultyService.getFaculties(universityId);
      setFaculties(data);
    } catch (err) {
      console.error('Error al cargar facultades:', err);
    }
  };

  const loadCareers = async (facultyId: string) => {
    try {
      const data = await careerService.getCareers(facultyId);
      setCareers(data);
    } catch (err) {
      console.error('Error al cargar carreras:', err);
    }
  };

  const loadCourses = async (careerId: string) => {
    try {
      const data = await courseService.getCourses({ career_id: careerId });
      setCourses(data);
    } catch (err) {
      console.error('Error al cargar cursos:', err);
    }
  };

  const loadCommissions = async (courseId: string) => {
    try {
      // Pasar también career_id para evitar duplicados entre carreras
      const data = await commissionService.getCommissions({ 
        course_id: courseId,
        career_id: selectedCareerId 
      });
      setCommissions(data);
    } catch (err) {
      console.error('Error al cargar comisiones:', err);
    }
  };

  const loadRubrics = async (commissionId: string) => {
    try {
      // Pasar toda la jerarquía académica para evitar duplicados
      const data = await rubricService.getRubrics({ 
        commission_id: commissionId,
        career_id: selectedCareerId,
        course_id: selectedCourseId 
      });
      setRubrics(data);
    } catch (err) {
      console.error('Error al cargar rúbricas:', err);
    }
  };

  const extractIframeContent = (text: string): string => {
    const iframeMatch = text.match(/<iframe[^>]*srcdoc=["']([^"']*)["'][^>]*>/i);
    if (iframeMatch && iframeMatch[1]) {
      let content = iframeMatch[1];
      content = content.replace(/&quot;/g, '"');
      content = content.replace(/&lt;/g, '<');
      content = content.replace(/&gt;/g, '>');
      content = content.replace(/&amp;/g, '&');
      content = content.replace(/\\n/g, '\n');
      return content;
    }
    return text.replace(/\\n/g, '\n');
  };

  const convertMarkdownToHtml = (text: string): string => {
    let html = text;
    
    // Convertir títulos
    html = html.replace(/^### (.+)$/gm, '<h3 style="font-size: 1.25rem; font-weight: 700; margin: 1.5rem 0 0.75rem 0;">$1</h3>');
    html = html.replace(/^## (.+)$/gm, '<h2 style="font-size: 1.5rem; font-weight: 700; margin: 2rem 0 1rem 0;">$1</h2>');
    html = html.replace(/^# (.+)$/gm, '<h1 style="font-size: 1.875rem; font-weight: 700; margin: 2rem 0 1rem 0;">$1</h1>');
    
    // Convertir negritas **texto**
    html = html.replace(/\*\*([^\*]+)\*\*/g, '<strong style="font-weight: 700;">$1</strong>');
    
    // Convertir cursivas *texto*
    html = html.replace(/\*([^\*]+)\*/g, '<em style="font-style: italic;">$1</em>');
    
    // Convertir saltos de línea dobles en párrafos
    const paragraphs = html.split(/\n\n+/);
    html = paragraphs.map(p => {
      if (p.trim().startsWith('<h') || p.trim().startsWith('<ul') || p.trim().startsWith('<ol')) {
        return p;
      }
      // Reemplazar saltos de línea simples por <br>
      const withBreaks = p.replace(/\n/g, '<br>');
      return `<p style="margin: 0.75rem 0; line-height: 1.6;">${withBreaks}</p>`;
    }).join('');
    
    return html;
  };

  const handleGrade = async () => {
    if (!selectedRubricId || !submissionFile) {
      alert('Por favor selecciona una rúbrica y un archivo a corregir');
      return;
    }

    // Verificar que tiene API key
    if (!hasApiKey || !userProfile) {
      setGradingError('Debes configurar tu API Key de Gemini en tu perfil antes de corregir.');
      return;
    }

    try {
      setIsGrading(true);
      setGradingError('');
      setGradingResult('');

      // Obtener la rúbrica seleccionada
      const rubric = rubrics.find((r) => r._id === selectedRubricId);
      if (!rubric) {
        throw new Error('Rúbrica no encontrada');
      }

      // Preparar FormData para enviar directamente a n8n
      const formData = new FormData();

      // JSON: rúbrica completa
      const rubricBlob = new Blob([JSON.stringify(rubric.rubric_json)], {
        type: 'application/json',
      });
      formData.append('rubric', rubricBlob, 'rubrica.json');

      // Archivo binario: examen a corregir
      formData.append('submission', submissionFile);

      // Llamar directamente al webhook de n8n
      const gradingWebhookUrl = import.meta.env.VITE_GRADING_WEBHOOK_URL || '';

      if (!gradingWebhookUrl) {
        throw new Error('Debes configurar la variable VITE_GRADING_WEBHOOK_URL en tu archivo .env');
      }

      const response = await axios.post(gradingWebhookUrl, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      // Extraer resultado
      const resultData = response.data;
      const result =
        typeof resultData === 'string' ? resultData : JSON.stringify(resultData);

      // Extraer contenido del iframe si existe
      let processedResult = extractIframeContent(result);
      // Convertir markdown a HTML
      processedResult = convertMarkdownToHtml(processedResult);
      setGradingResult(processedResult);

      // Intentar parsear secciones para auto-llenar planilla (usar el texto sin HTML)
      parseGradingSections(extractIframeContent(result));
    } catch (err: unknown) {
      setGradingError(
        err && typeof err === 'object' && 'message' in err
          ? String(err.message)
          : 'Error al corregir el archivo'
      );
    } finally {
      setIsGrading(false);
    }
  };

  const parseGradingSections = (text: string) => {
    // Intentar extraer nota
    const gradeMatch = text.match(/Tu nota final es\s*([^\.\n]+)(?:\.|$)/i);
    if (gradeMatch) {
      setGrade(gradeMatch[1].trim());
    }

    // Intentar extraer resumen por criterios
    const summaryMatch = text.match(/📌 Resumen por criterios([\s\S]*?)(?:💡 Fortalezas|$)/i);
    if (summaryMatch) {
      setSummaryByCriteria(summaryMatch[1].trim());
    }

    // Intentar extraer fortalezas
    const strengthsMatch = text.match(/💡 Fortalezas detectadas([\s\S]*?)(?:🛠️ Recomendaciones|$)/i);
    if (strengthsMatch) {
      setStrengths(strengthsMatch[1].trim());
    }

    // Intentar extraer recomendaciones
    const recommendationsMatch = text.match(/🛠️ Recomendaciones([\s\S]*?)$/i);
    if (recommendationsMatch) {
      setRecommendations(recommendationsMatch[1].trim());
    }
  };

  const handleUploadToSpreadsheet = async () => {
    if (!spreadsheetUrl || !sheetName || !studentName || !grade) {
      alert('Por favor completa todos los campos requeridos');
      return;
    }

    try {
      setIsUploadingToSheet(true);

      const webhookUrl =
        import.meta.env.VITE_SPREADSHEET_WEBHOOK_URL ||
        'https://tu-servidor.n8n.example/webhook/spreadsheet';

      const data = {
        spreadsheet_url: spreadsheetUrl,
        sheet_name: sheetName,
        alumno: studentName,
        nota: grade,
        resumen_por_criterios: summaryByCriteria,
        fortalezas: strengths,
        recomendaciones: recommendations,
      };

      await axios.post(webhookUrl, data);

      alert('Datos subidos exitosamente a la planilla');
    } catch (err: unknown) {
      alert(
        err && typeof err === 'object' && 'message' in err
          ? String(err.message)
          : 'Error al subir a la planilla'
      );
    } finally {
      setIsUploadingToSheet(false);
    }
  };

  const handleExportToPDF = () => {
    if (!resultRef.current || !gradingResult) return;

    // Crear un elemento temporal solo con el contenido
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = gradingResult;
    tempDiv.style.padding = '20px';
    tempDiv.style.fontFamily = 'Arial, sans-serif';
    tempDiv.style.fontSize = '14px';
    tempDiv.style.color = '#000';
    tempDiv.style.backgroundColor = '#fff';

    const opt = {
      margin: 15,
      filename: 'resultado-correccion.pdf',
      image: { type: 'jpeg' as const, quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'mm' as const, format: 'a4' as const, orientation: 'portrait' as const }
    };

    html2pdf().set(opt).from(tempDiv).save();
  };

  const handleBatchGrading = async () => {
    if (!selectedRubricId) {
      alert('Por favor selecciona una rúbrica');
      return;
    }

    // Verificar que tiene API key
    if (!hasApiKey || !userProfile?.gemini_api_key) {
      setBatchGradingError('Debes configurar tu API Key de Gemini en tu perfil antes de corregir.');
      return;
    }

    try {
      setIsBatchGrading(true);
      setBatchGradingError('');
      setBatchGradingResult('');
      setBatchGradingDriveLink('');

      // Obtener la rúbrica seleccionada
      const rubric = rubrics.find((r) => r._id === selectedRubricId);
      if (!rubric) {
        throw new Error('Rúbrica no encontrada');
      }

      // Llamar al webhook de corrección masiva
      const webhookUrl =
        import.meta.env.VITE_BATCH_GRADING_WEBHOOK_URL ||
        'https://tu-servidor.n8n.example/webhook/batch-grading';

      const response = await axios.post(webhookUrl, {
        university_id: selectedUniversityId,
        faculty_id: selectedFacultyId,
        career_id: selectedCareerId,
        course_id: selectedCourseId,
        commission_id: selectedCommissionId,
        rubric_id: selectedRubricId,
        rubric_json: rubric.rubric_json,
        gemini_api_key: userProfile.gemini_api_key, // Enviar API key del usuario
      });

      // Extraer resultado (esperamos { drive_link: "...", alumnos_corregidos: 2 })
      const { drive_link, alumnos_corregidos } = response.data;
      
      // Construir mensaje de éxito
      const resultMessage = `✅ Se corrigieron exitosamente ${alumnos_corregidos} estudiante${alumnos_corregidos !== 1 ? 's' : ''}.`;
      
      setBatchGradingResult(resultMessage);
      
      if (drive_link) {
        setBatchGradingDriveLink(drive_link);
      }
    } catch (err: unknown) {
      setBatchGradingError(
        err && typeof err === 'object' && 'message' in err
          ? String(err.message)
          : 'Error al ejecutar la corrección automática'
      );
    } finally {
      setIsBatchGrading(false);
    }
  };

  // Verificar si el usuario tiene API key configurada
  const hasApiKey = userProfile?.hasGeminiApiKey ?? false;

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Banner de advertencia si NO tiene API key */}
      {!loadingProfile && !hasApiKey && (
        <div className="bg-danger-1/10 border-2 border-danger-1/50 rounded-2xl p-6">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 rounded-full bg-danger-1/20 flex items-center justify-center">
                <span className="text-2xl">⚠️</span>
              </div>
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-danger-1 mb-2">API Key de Gemini requerida</h3>
              <p className="text-text-secondary mb-4">
                Para usar el sistema de corrección automática, debes configurar tu propia API Key de Gemini en tu perfil.
                Esta key se usa exclusivamente bajo tu cuota personal.
              </p>
              <Link to="/profile">
                <Button variant="primary" size="md">
                  🔑 Configurar API Key en mi Perfil
                </Button>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Banner de éxito si tiene API key */}
      {!loadingProfile && hasApiKey && (
        <div className="bg-accent-1/10 border border-accent-1/50 rounded-2xl p-4">
          <div className="flex items-center gap-3">
            <span className="text-2xl">✓</span>
            <div>
              <p className="text-accent-1 font-semibold">API Key configurada</p>
              <p className="text-sm text-text-secondary">
                Últimos 4 dígitos: <span className="font-mono font-bold">****{userProfile?.gemini_api_key_last_4}</span>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Sección 1: Contexto Académico */}
      <Card
        title="Contexto Académico"
        stepNumber="1"
        hover
        hoverColor="amber"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Select
            label="Universidad"
            options={universities.map((u) => ({ value: u.university_id, label: u.name }))}
            value={selectedUniversityId}
            onChange={(e) => setSelectedUniversityId(e.target.value)}
            placeholder="Selecciona universidad"
          />

          <Select
            label="Facultad"
            options={faculties.map((f) => ({ value: f.faculty_id, label: f.name }))}
            value={selectedFacultyId}
            onChange={(e) => setSelectedFacultyId(e.target.value)}
            placeholder="Selecciona facultad"
            disabled={!selectedUniversityId}
          />

          <Select
            label="Carrera"
            options={careers.map((c) => ({ value: c.career_id, label: c.name }))}
            value={selectedCareerId}
            onChange={(e) => setSelectedCareerId(e.target.value)}
            placeholder="Selecciona carrera"
            disabled={!selectedFacultyId}
          />

          <Select
            label="Materia"
            options={courses.map((c) => ({ value: c.course_id, label: `${c.name} (${c.year}° año)` }))}
            value={selectedCourseId}
            onChange={(e) => setSelectedCourseId(e.target.value)}
            placeholder="Selecciona materia"
            disabled={!selectedCareerId}
          />

          <Select
            label="Comisión"
            options={commissions.map((c) => ({ value: c.commission_id, label: c.name }))}
            value={selectedCommissionId}
            onChange={(e) => setSelectedCommissionId(e.target.value)}
            placeholder="Selecciona comisión"
            disabled={!selectedCourseId}
          />

          <Select
            label="Rúbrica"
            options={rubrics.map((r) => ({ value: r._id, label: r.name }))}
            value={selectedRubricId}
            onChange={(e) => setSelectedRubricId(e.target.value)}
            placeholder="Selecciona rúbrica"
            disabled={!selectedCommissionId}
          />
        </div>
      </Card>

      {/* Sección 2: Sistema de Corrección - Dos divs lado a lado */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Corrección Manual (Izquierda) */}
        <Card
          title="Corrección Manual"
          stepNumber="2"
          hover
          hoverColor="sky"
        >
          <div className="space-y-4">
            <div className="rounded-xl bg-bg-tertiary/40 border border-border-primary/40 p-4">
              <p className="text-sm text-text-secondary mb-2">
                <strong className="text-text-primary">📝 Corrección Individual</strong>
              </p>
              <p className="text-xs text-text-tertiary">
                Sube el archivo de un alumno para corregirlo individualmente con IA.
              </p>
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-medium text-text-tertiary mb-2">
                Archivo del Alumno
              </label>
              <input
                type="file"
                onChange={(e) => setSubmissionFile(e.target.files?.[0] || null)}
                className="block w-full cursor-pointer rounded-xl border border-border-primary/60 bg-bg-tertiary/60 px-3 py-2.5 text-xs text-text-primary shadow-inner transition focus:border-ring/70 focus:outline-none focus:ring-2 focus:ring-ring/40 file:mr-3 file:rounded-lg file:border-0 file:bg-gradient-to-r file:from-accent-1 file:to-accent-2 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-white hover:file:brightness-110 sm:rounded-2xl sm:px-4 sm:py-3 sm:text-sm file:sm:mr-4 file:sm:rounded-xl file:sm:px-4 file:sm:py-2 file:sm:text-sm"
              />
              <p className="mt-1.5 text-xs text-text-tertiary sm:text-sm">
                Sube el archivo que deseas corregir (código, PDF, documento, etc.)
              </p>
            </div>

            <Button
              onClick={handleGrade}
              loading={isGrading}
              disabled={!selectedRubricId || !submissionFile || !hasApiKey}
            >
              {isGrading ? 'Corrigiendo…' : 'Corregir Archivo'}
            </Button>

            {!hasApiKey && (
              <div className="rounded-xl border border-danger-1/40 bg-danger-1/10 p-3 text-sm text-danger-1">
                ⚠️ Debes configurar tu API Key de Gemini en tu perfil para poder corregir.
              </div>
            )}

            {gradingError && (
              <div className="rounded-2xl border border-danger-1/40 bg-danger-1/10 p-4 text-sm text-danger-1 shadow-inner">
                <strong className="block text-danger-1">{gradingError}</strong>
              </div>
            )}
          </div>
        </Card>

        {/* Corrección Automática (Derecha) */}
        <Card
          title="Corrección Automática"
          stepNumber="2"
          hover
          hoverColor="purple"
        >
          <div className="space-y-4">
            <div className="rounded-xl bg-bg-tertiary/40 border border-border-primary/40 p-4">
              <p className="text-sm text-text-secondary mb-2">
                <strong className="text-text-primary">⚡ Corrección Masiva</strong>
              </p>
              <p className="text-xs text-text-tertiary">
                Este proceso corregirá automáticamente TODOS los alumnos pendientes usando la rúbrica seleccionada.
                No se requiere subir archivos individuales.
              </p>
            </div>

            <div className="flex gap-3">
              <Button
                onClick={handleBatchGrading}
                loading={isBatchGrading}
                disabled={!selectedRubricId || !hasApiKey}
                variant="secondary"
                className="flex-1"
              >
                {isBatchGrading ? 'Corrigiendo todos los alumnos…' : 'Iniciar Corrección Automática'}
              </Button>

              {/* Botón para ir a Drive */}
              {selectedRubricId && (() => {
                const selectedRubric = rubrics.find((r) => r._id === selectedRubricId);
                const driveFolderId = selectedRubric?.drive_folder_id;

                if (driveFolderId) {
                  return (
                    <Button
                      onClick={() => window.open(`https://drive.google.com/drive/folders/${driveFolderId}`, '_blank')}
                      variant="primary"
                      className="whitespace-nowrap"
                    >
                      📂 Ir a Drive
                    </Button>
                  );
                }
                return null;
              })()}
            </div>

            {!hasApiKey && (
              <div className="rounded-xl border border-danger-1/40 bg-danger-1/10 p-3 text-sm text-danger-1">
                ⚠️ Debes configurar tu API Key de Gemini en tu perfil para poder corregir.
              </div>
            )}

            {batchGradingResult && (
              <div className="rounded-2xl border border-emerald-500/40 bg-emerald-500/10 p-4 text-sm text-emerald-400 shadow-inner">
                <strong className="block mb-2">{batchGradingResult}</strong>
                {batchGradingDriveLink && (
                  <a 
                    href={batchGradingDriveLink} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-emerald-300 hover:text-emerald-200 underline"
                  >
                    🔗 Link de google drive
                  </a>
                )}
              </div>
            )}

            {batchGradingError && (
              <div className="rounded-2xl border border-danger-1/40 bg-danger-1/10 p-4 text-sm text-danger-1 shadow-inner">
                <strong className="block text-danger-1">{batchGradingError}</strong>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Resultado de la Corrección (solo si hay resultado) */}
      {gradingResult && (
        <Card
          title="Resultado de la Corrección"
          hover
          hoverColor="indigo"
        >
          <div 
            ref={resultRef}
            className="max-h-[300px] max-w-full overflow-x-auto overflow-y-auto rounded-xl border border-border-primary/60 bg-white p-4 shadow-inner sm:max-h-[450px] sm:rounded-2xl sm:p-6 lg:max-h-[520px] lg:p-8"
            style={{ 
              fontFamily: 'system-ui, -apple-system, sans-serif',
              fontSize: '15px',
              lineHeight: '1.6',
              color: '#1f2937'
            }}
            dangerouslySetInnerHTML={{ __html: gradingResult }}
          />
          <div className="mt-4">
            <Button onClick={handleExportToPDF}>
              Exportar como PDF
            </Button>
          </div>
        </Card>
      )}

      {/* Sección 3: Subir Resultados a Planilla (solo si hay resultado de corrección manual) */}
      {gradingResult && (
        <Card
          title="Subir Resultados a Planilla"
          stepNumber="3"
          hover
          hoverColor="emerald"
        >
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="URL del Spreadsheet"
              type="url"
              placeholder="https://docs.google.com/spreadsheets/d/..."
              value={spreadsheetUrl}
              onChange={(e) => setSpreadsheetUrl(e.target.value)}
            />

            <Input
              label="Nombre de la Hoja"
              placeholder="Hoja1"
              value={sheetName}
              onChange={(e) => setSheetName(e.target.value)}
            />

            <Input
              label="Alumno según Moodle"
              placeholder="Apellido, Nombre"
              value={studentName}
              onChange={(e) => setStudentName(e.target.value)}
            />

            <Input
              label="Nota"
              placeholder="85/100"
              value={grade}
              onChange={(e) => setGrade(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-tertiary mb-2">
              Resumen por Criterios
            </label>
            <textarea
              rows={4}
              value={summaryByCriteria}
              onChange={(e) => setSummaryByCriteria(e.target.value)}
              className="w-full px-4 py-2.5 bg-bg-tertiary border border-border-primary/60 rounded-2xl text-text-primary placeholder-text-placeholder focus:outline-none focus:ring-2 focus:ring-ring/40 focus:border-ring/70"
              placeholder="Se completa automáticamente desde el resultado..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-tertiary mb-2">Fortalezas</label>
            <textarea
              rows={3}
              value={strengths}
              onChange={(e) => setStrengths(e.target.value)}
              className="w-full px-4 py-2.5 bg-bg-tertiary border border-border-primary/60 rounded-2xl text-text-primary placeholder-text-placeholder focus:outline-none focus:ring-2 focus:ring-ring/40 focus:border-ring/70"
              placeholder="Se completa automáticamente desde el resultado..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-tertiary mb-2">
              Recomendaciones
            </label>
            <textarea
              rows={3}
              value={recommendations}
              onChange={(e) => setRecommendations(e.target.value)}
              className="w-full px-4 py-2.5 bg-bg-tertiary border border-border-primary/60 rounded-2xl text-text-primary placeholder-text-placeholder focus:outline-none focus:ring-2 focus:ring-ring/40 focus:border-ring/70"
              placeholder="Se completa automáticamente desde el resultado..."
            />
          </div>

          <Button
            onClick={handleUploadToSpreadsheet}
            loading={isUploadingToSheet}
            disabled={!spreadsheetUrl || !sheetName || !studentName || !grade}
          >
            Subir a Planilla
          </Button>
        </div>
        </Card>
      )}
    </div>
  );
};

export default UserView;
