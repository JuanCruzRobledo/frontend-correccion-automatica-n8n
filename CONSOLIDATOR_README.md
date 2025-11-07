# 📦 Consolidador de Proyectos

Sistema para convertir proyectos completos en un único archivo de texto formato Markdown, optimizado para análisis por IA (ChatGPT, Claude, etc.).

---

## ✨ Características

- ✅ **Universal**: Soporta Java, JavaScript, TypeScript, Python, C++, PHP, Ruby, Go, Rust y más
- ✅ **Público**: Accesible sin autenticación en `/consolidator`
- ✅ **Flexible**: 6 modos de conversión predefinidos + modo personalizado
- ✅ **Inteligente**: Excluye automáticamente `node_modules`, `.git`, `build`, etc.
- ✅ **Fácil de usar**: Interfaz drag & drop
- ✅ **Rápido**: Procesa proyectos de hasta 100MB en segundos

---

## 🚀 Uso

### Frontend

1. Navega a la ruta pública:
   ```
   http://localhost:5173/consolidator
   ```

2. **Sube tu proyecto**:
   - Arrastra un archivo `.zip` de tu proyecto
   - O haz clic en "Seleccionar archivo"

3. **Selecciona el modo de conversión**:
   - **Modo 1**: Solo código fuente Java (`.java`)
   - **Modo 2**: Solo código fuente JavaScript/TypeScript (`.js`, `.jsx`, `.ts`, `.tsx`)
   - **Modo 3**: Solo código fuente Python (`.py`)
   - **Modo 4**: Proyecto web completo (HTML, CSS, JS, JSON, etc.)
   - **Modo 5**: Proyecto completo universal (todos los lenguajes + config)
   - **Modo Personalizado**: Selecciona extensiones específicas

4. **Opciones adicionales**:
   - ✅ Incluir archivos de pruebas/tests
   - Si eliges modo personalizado, ingresa extensiones: `.java,.xml,.properties`

5. **Consolida**:
   - Haz clic en "Consolidar Proyecto"
   - Espera unos segundos mientras procesa

6. **Descarga o copia**:
   - Descarga el archivo `.txt` generado
   - O cópialo al portapapeles directamente

---

## 📡 API Backend

### Endpoint: `POST /api/consolidate`

**Ruta pública** (sin autenticación requerida)

#### Request

```http
POST http://localhost:5000/api/consolidate
Content-Type: multipart/form-data

Body:
- projectZip: archivo ZIP del proyecto (requerido)
- mode: modo de conversión (1-5, default: 5)
- customExtensions: extensiones separadas por comas (opcional)
- includeTests: true/false (default: true)
```

#### Response (Success)

```json
{
  "success": true,
  "content": "# Proyecto Consolidado\n\n**Generado:** 2025-01-15 10:30:00\n...",
  "stats": {
    "totalFiles": 45,
    "projectName": "mi-proyecto",
    "mode": "Proyecto completo (Universal)",
    "extensions": [".java", ".xml", ".properties", "..."]
  },
  "message": "Proyecto consolidado exitosamente"
}
```

#### Response (Error)

```json
{
  "success": false,
  "message": "Error al consolidar el proyecto",
  "error": "..."
}
```

#### Ejemplo con cURL

```bash
curl -X POST http://localhost:5000/api/consolidate \
  -F "projectZip=@/path/to/proyecto.zip" \
  -F "mode=5" \
  -F "includeTests=true"
```

#### Ejemplo con JavaScript (fetch)

```javascript
const formData = new FormData();
formData.append('projectZip', fileInput.files[0]);
formData.append('mode', '5');
formData.append('includeTests', 'true');

const response = await fetch('http://localhost:5000/api/consolidate', {
  method: 'POST',
  body: formData
});

const result = await response.json();
console.log(result.content); // Contenido consolidado
```

---

## 📁 Formato del Archivo Generado

El archivo generado sigue este formato:

```markdown
# Proyecto Consolidado

**Generado:** 2025-01-15 10:30:00

**Proyecto:** mi-proyecto

**Ruta:** `/path/to/proyecto`

**Modo de conversión:** Proyecto completo (Universal)

## 📋 Metadata del Proyecto

- **Tipo de proyecto:** React (JavaScript/TypeScript)
- **Total de archivos:** 45

## 📁 Estructura de Directorios

```
📁 src
  📁 components
    📄 App.tsx
    📄 Header.tsx
  📁 utils
    📄 helpers.js
📁 public
  📄 index.html
📄 package.json
```

## 📄 Contenido de Archivos

---

### 📄 `src/components/App.tsx`

**Líneas:** 50 | **Tipo:** .tsx

```tsx
import React from 'react';
// ...código completo del archivo...
```

---

### 📄 `package.json`

**Líneas:** 30 | **Tipo:** .json

```json
{
  "name": "mi-proyecto",
  // ...código completo del archivo...
}
```

---

## 📊 Estadísticas del Proyecto

- **Total de archivos procesados:** 45
- **Total de líneas de código:** 2,345

### Desglose por tipo de archivo:

- **.tsx:** 15 archivos
- **.ts:** 10 archivos
- **.json:** 5 archivos
- **.css:** 8 archivos
- **.md:** 3 archivos
```

---

## 🛠️ Configuración Técnica

### Backend

**Servicio**: `backend/src/services/consolidatorService.js`
- Escanea archivos recursivamente
- Filtra por extensión
- Excluye directorios innecesarios
- Detecta tipo de proyecto automáticamente

**Controlador**: `backend/src/controllers/consolidatorController.js`
- Maneja upload de archivos
- Extrae archivos ZIP
- Llama al servicio de consolidación
- Limpia archivos temporales

**Rutas**: `backend/src/routes/consolidatorRoutes.js`
- Endpoint: `POST /api/consolidate`
- Límite de archivo: 100MB
- Sin autenticación requerida

### Frontend

**Componente**: `frontend/src/components/shared/ProjectConsolidator.tsx`
- Drag & drop de archivos
- Selección de modos de conversión
- Validación de archivos
- Descarga automática del resultado
- Copia al portapapeles

**Ruta**: `/consolidator` (pública)

---

## 🚫 Archivos y Carpetas Excluidos Automáticamente

### Directorios

- `.git`, `.idea`, `.vscode`, `.settings`, `.vs`
- `node_modules`, `target`, `build`, `dist`, `out`, `bin`
- `.gradle`, `.mvn`, `__pycache__`, `.pytest_cache`
- `venv`, `env`, `.next`, `coverage`, `.nuxt`

### Extensiones binarias

- `.class`, `.jar`, `.war`, `.ear`
- `.zip`, `.tar`, `.gz`, `.7z`, `.rar`
- `.exe`, `.dll`, `.so`, `.dylib`
- `.png`, `.jpg`, `.jpeg`, `.gif`, `.ico`, `.svg`
- `.pdf`, `.doc`, `.docx`, `.xls`, `.xlsx`
- `.mp3`, `.mp4`, `.avi`, `.mov`, `.wav`

---

## 📋 Modos de Conversión Detallados

### Modo 1: Solo código fuente (Java)
**Extensiones**: `.java`
**Uso**: Análisis de lógica de negocio Java

### Modo 2: Solo código fuente (JavaScript/TypeScript)
**Extensiones**: `.js`, `.jsx`, `.ts`, `.tsx`, `.mjs`, `.cjs`
**Uso**: Análisis de código JavaScript/TypeScript

### Modo 3: Solo código fuente (Python)
**Extensiones**: `.py`
**Uso**: Análisis de código Python

### Modo 4: Proyecto web completo
**Extensiones**: `.html`, `.css`, `.scss`, `.sass`, `.less`, `.js`, `.jsx`, `.ts`, `.tsx`, `.vue`, `.svelte`, `.json`, `.yaml`, `.yml`, `.md`, `.txt`
**Uso**: Proyectos web frontend completos

### Modo 5: Proyecto completo (Universal)
**Extensiones**: Todas las anteriores + `.java`, `.py`, `.c`, `.cpp`, `.h`, `.hpp`, `.cs`, `.go`, `.rs`, `.rb`, `.php`, `.xml`, `.properties`, `.gradle`, `.kts`, `.sql`, `.sh`, `.bat`, `.cmd`
**Uso**: Proyectos de cualquier lenguaje con configuración

### Modo Personalizado
**Extensiones**: Las que tú definas
**Uso**: Casos específicos donde necesitas extensiones personalizadas

---

## 🎯 Casos de Uso

1. **Análisis por IA**: Subir proyectos completos a ChatGPT, Claude, etc.
2. **Code Review**: Generar snapshot del código para revisión
3. **Documentación**: Crear backup legible del proyecto
4. **Migración**: Facilitar transferencia de código entre equipos
5. **Educación**: Compartir proyectos completos con estudiantes

---

## 🐛 Solución de Problemas

### "Solo se permiten archivos ZIP"
- Asegúrate de comprimir tu proyecto en formato `.zip`
- No uses `.rar`, `.7z` u otros formatos

### "El archivo debe ser menor a 100MB"
- Elimina carpetas pesadas antes de comprimir: `node_modules`, `build`, `.git`
- O comprime solo las carpetas necesarias

### "No se encontraron archivos con las extensiones seleccionadas"
- Verifica que el modo seleccionado incluye las extensiones de tu proyecto
- Usa el modo personalizado para especificar extensiones exactas

### Error al procesar el proyecto
- Verifica que el ZIP no esté corrupto
- Asegúrate de que el backend esté corriendo en `http://localhost:5000`
- Revisa la consola del navegador para más detalles

---

## 📚 Dependencias

### Backend
- `express-fileupload`: Manejo de uploads
- `adm-zip`: Extracción de archivos ZIP
- `fs`, `path`: Operaciones de archivos (nativo Node.js)

### Frontend
- `axios`: Peticiones HTTP
- `react-router-dom`: Enrutamiento

---

## 🔧 Desarrollo

### Iniciar Backend
```bash
cd backend
npm install
npm run dev
```

### Iniciar Frontend
```bash
cd frontend-correccion-automatica-n8n
npm install
npm run dev
```

### Probar el endpoint manualmente

```bash
# 1. Comprime tu proyecto
zip -r proyecto.zip mi-proyecto/

# 2. Envía la petición
curl -X POST http://localhost:5000/api/consolidate \
  -F "projectZip=@proyecto.zip" \
  -F "mode=5" \
  -F "includeTests=true" \
  > resultado.txt
```

---

## 📝 Notas

- La consolidación es **no bloqueante**: el backend procesa y responde inmediatamente
- El contenido se devuelve como **texto plano** con formato Markdown
- El usuario puede **descargar como .txt** o **copiar al portapapeles**
- Los archivos temporales se limpian automáticamente después del procesamiento

---

## 🎉 ¡Listo para usar!

Accede a `http://localhost:5173/consolidator` y empieza a consolidar tus proyectos.
