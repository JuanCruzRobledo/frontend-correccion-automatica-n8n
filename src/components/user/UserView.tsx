/**
 * UserView - Vista simplificada para usuarios normales
 * Permite seleccionar universidad, curso, rúbrica y corregir archivos
 */
import { useState, useEffect, useRef } from 'react';
import { Card } from '../shared/Card';
import { Select } from '../shared/Select';
import { Input } from '../shared/Input';
import { Button } from '../shared/Button';
import universityService from '../../services/universityService';
import courseService from '../../services/courseService';
import rubricService from '../../services/rubricService';
import type { University, Course, Rubric } from '../../types';
import axios from 'axios';
import html2pdf from 'html2pdf.js';

export const UserView = () => {
  // Datos de catálogos
  const [universities, setUniversities] = useState<University[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [rubrics, setRubrics] = useState<Rubric[]>([]);

  // Selecciones
  const [selectedUniversityId, setSelectedUniversityId] = useState('');
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [selectedRubricId, setSelectedRubricId] = useState('');

  // Archivo a corregir
  const [submissionFile, setSubmissionFile] = useState<File | null>(null);

  // Resultado de la corrección
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

  // Cargar universidades al montar
  useEffect(() => {
    loadUniversities();
  }, []);

  // Cargar cursos cuando cambia la universidad
  useEffect(() => {
    if (selectedUniversityId) {
      loadCourses(selectedUniversityId);
    } else {
      setCourses([]);
    }
    setSelectedCourseId('');
    setSelectedRubricId('');
  }, [selectedUniversityId]);

  // Cargar rúbricas cuando cambia el curso
  useEffect(() => {
    if (selectedUniversityId && selectedCourseId) {
      loadRubrics(selectedUniversityId, selectedCourseId);
    } else {
      setRubrics([]);
    }
    setSelectedRubricId('');
  }, [selectedCourseId]);

  const loadUniversities = async () => {
    try {
      const data = await universityService.getUniversities();
      setUniversities(data);
    } catch (err) {
      console.error('Error al cargar universidades:', err);
    }
  };

  const loadCourses = async (universityId: string) => {
    try {
      const data = await courseService.getCourses(universityId);
      setCourses(data);
    } catch (err) {
      console.error('Error al cargar cursos:', err);
    }
  };

  const loadRubrics = async (universityId: string, courseId: string) => {
    try {
      const data = await rubricService.getRubrics(universityId, courseId);
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

    try {
      setIsGrading(true);
      setGradingError('');
      setGradingResult('');

      // Obtener la rúbrica seleccionada
      const rubric = rubrics.find((r) => r._id === selectedRubricId);
      if (!rubric) {
        throw new Error('Rúbrica no encontrada');
      }

      // Preparar FormData
      const formData = new FormData();

      // Crear archivo JSON temporal con la rúbrica
      const rubricBlob = new Blob([JSON.stringify(rubric.rubric_json)], {
        type: 'application/json',
      });
      formData.append('rubric', rubricBlob, 'rubric.json');

      // Agregar archivo a corregir
      formData.append('submission', submissionFile);

      // Llamar al webhook de n8n (directamente o a través del backend)
      const webhookUrl =
        import.meta.env.VITE_GRADING_WEBHOOK_URL ||
        'https://tu-servidor.n8n.example/webhook/grading';

      const response = await axios.post(webhookUrl, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      // Extraer resultado
      const result =
        typeof response.data === 'string' ? response.data : JSON.stringify(response.data);

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

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Sección 1: Contexto Académico */}
      <Card
        title="Contexto Académico"
        stepNumber="1"
        hover
        hoverColor="amber"
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Select
            label="Universidad"
            options={universities.map((u) => ({ value: u.university_id, label: u.name }))}
            value={selectedUniversityId}
            onChange={(e) => setSelectedUniversityId(e.target.value)}
            placeholder="Selecciona universidad"
          />

          <Select
            label="Materia"
            options={courses.map((c) => ({ value: c.course_id, label: c.name }))}
            value={selectedCourseId}
            onChange={(e) => setSelectedCourseId(e.target.value)}
            placeholder="Selecciona materia"
            disabled={!selectedUniversityId}
          />

          <Select
            label="Rúbrica"
            options={rubrics.map((r) => ({ value: r._id, label: r.name }))}
            value={selectedRubricId}
            onChange={(e) => setSelectedRubricId(e.target.value)}
            placeholder="Selecciona rúbrica"
            disabled={!selectedCourseId}
          />
        </div>
      </Card>

      {/* Sección 2: Subir Archivo a Corregir */}
      <Card
        title="Subir Archivo a Corregir"
        stepNumber="2"
        hover
        hoverColor="sky"
      >
        <div className="space-y-3 sm:space-y-4">
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

          <Button onClick={handleGrade} loading={isGrading} disabled={!selectedRubricId || !submissionFile}>
            {isGrading ? 'Corrigiendo…' : 'Corregir Archivo'}
          </Button>

          {gradingError && (
            <div className="rounded-2xl border border-danger-1/40 bg-danger-1/10 p-4 text-sm text-danger-1 shadow-inner">
              <strong className="block text-danger-1">{gradingError}</strong>
            </div>
          )}
        </div>
      </Card>

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

      {/* Sección 3: Subir Resultados a Planilla */}
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
    </div>
  );
};

export default UserView;
