# 🎨 Frontend - Sistema de Corrección Automática

Interfaz web completa con sistema de autenticación, panel de administración y vista de usuario para corrección automática de entregas con IA.

---

## 📋 Tabla de Contenidos

- [Descripción General](#-descripción-general)
- [Características Principales](#-características-principales)
- [Stack Tecnológico](#-stack-tecnológico)
- [Requisitos Previos](#-requisitos-previos)
- [Instalación](#-instalación)
- [Configuración](#-configuración)
- [Ejecución](#-ejecución)
- [Estructura del Proyecto](#-estructura-del-proyecto)
- [Flujo de Usuarios](#-flujo-de-usuarios)
- [Componentes Principales](#-componentes-principales)
- [Consolidador de Proyectos](#-consolidador-de-proyectos)
- [Personalización](#-personalización)

---

## 🎯 Descripción General

Frontend desarrollado en **React + TypeScript + Tailwind CSS** con arquitectura completa que incluye:

- **Sistema de autenticación** con JWT y roles (admin/user)
- **Admin Panel** con CRUD de universidades, materias, rúbricas y usuarios
- **Vista de usuario** simplificada para corrección de entregas
- **Integración con n8n** para generación de rúbricas y corrección con IA
- **Consolidador de proyectos** (herramienta pública)

### Vista General

```
┌─────────────────────────────────────────┐
│           LOGIN                         │
│  - Autenticación JWT                    │
│  - Roles: admin / user                  │
└─────────────────────────────────────────┘
            ↓
    ┌───────────┬───────────┐
    │   ADMIN   │   USER    │
    └───────────┴───────────┘
         ↓             ↓
┌────────────────┐  ┌─────────────────┐
│  Admin Panel   │  │   User View     │
│  + User View   │  │   (solo vista)  │
└────────────────┘  └─────────────────┘
```

---

## ✨ Características Principales

### 🔐 Sistema de Autenticación
- Login con username y password
- JWT tokens con expiración configurable
- Protección de rutas por autenticación y rol
- Logout con limpieza de sesión

### 👨‍💼 Admin Panel (solo para administradores)
- **CRUD de Universidades**: Crear, editar, eliminar (soft delete)
- **CRUD de Materias/Cursos**: Gestión completa con filtros por universidad
- **CRUD de Rúbricas**:
  - Crear desde JSON manual
  - Crear desde PDF con IA (Google Gemini)
  - Editar JSON existente
  - Descargar rúbricas
  - Ver rúbricas en modo solo lectura
- **CRUD de Usuarios**:
  - Crear usuarios con roles
  - Editar usuarios (username, password, rol)
  - Eliminar usuarios (soft delete)
  - Restaurar usuarios eliminados
  - Ver usuarios activos/eliminados

### 👤 Vista de Usuario (para todos los usuarios autenticados)
- **Sección 1: Contexto Académico**
  - Seleccionar universidad (desde BD)
  - Seleccionar materia (filtrado por universidad)
  - Seleccionar rúbrica (filtrado por universidad + materia)

- **Sección 2: Corrección de Entregas**
  - Subir archivo del alumno (.py, .java, .pdf, .docx, etc.)
  - Corrección automática con IA
  - Visualización de resultados (nota, resumen, fortalezas, recomendaciones)

- **Sección 3: Subida a Google Sheets**
  - Auto-llenado de resultados
  - Configuración de planilla destino
  - Subida directa a Google Sheets

### 🛠️ Consolidador de Proyectos
- Herramienta pública (sin autenticación)
- Convierte proyectos ZIP en un archivo de texto
- 6 modos predefinidos + modo personalizado
- Ver documentación completa en `CONSOLIDATOR_README.md`

---

## 🛠️ Stack Tecnológico

### Core
- **React 18.2.0** - Framework frontend
- **TypeScript 5.2.2** - Tipado estático
- **Vite 4.4.9** - Build tool y dev server

### UI/Styling
- **Tailwind CSS 3.4.13** - Utility-first CSS framework
- **Dark theme** - Tema oscuro con Aurora background animado
- **Gradientes personalizados** - Sky, Indigo, Purple
- **Animaciones suaves** - Motion-safe animations

### Routing y HTTP
- **React Router DOM 6.x** - Enrutamiento SPA
- **Axios** - Cliente HTTP para API REST

### State Management
- **Custom hooks** - useAuth, useApi
- **Local Storage** - Persistencia de JWT

---

## 📦 Requisitos Previos

- **Node.js** >= 18.0.0
- **npm** >= 9.0.0
- **Backend corriendo** en puerto 5000 (ver `../backend/README.md`)
- **n8n configurado** con webhooks activos (ver `../../n8n-flows/README.md`)

---

## 🚀 Instalación

```bash
# Navegar a la carpeta del frontend
cd frontend-correccion-automatica-n8n

# Instalar dependencias
npm install
```

---

## ⚙️ Configuración

### 1. Variables de entorno

Crear archivo `.env` en la raíz del frontend:

```bash
cp .env.example .env
```

### 2. Editar `.env`

```env
# URL del backend API
VITE_API_URL=http://localhost:5000

# Webhooks de n8n (llamados directamente desde frontend)
VITE_N8N_GRADING_WEBHOOK=https://tu-n8n.cloud/webhook/corregir
VITE_N8N_SPREADSHEET_WEBHOOK=https://tu-n8n.cloud/webhook/spreadsheet
```

**Nota importante**: Las variables deben tener el prefijo `VITE_` para ser accesibles en el código.

---

## 🚀 Ejecución

### Desarrollo

```bash
npm run dev
```

El frontend se iniciará en `http://localhost:5173/`

**Salida esperada:**
```
VITE v4.4.9  ready in XXX ms

➜  Local:   http://localhost:5173/
➜  Network: use --host to expose
```

### Producción

```bash
# Build de producción
npm run build

# Preview del build
npm run preview
```

Los archivos compilados estarán en la carpeta `dist/`.

---

## 📁 Estructura del Proyecto

```
frontend-correccion-automatica-n8n/
├── src/
│   ├── components/
│   │   ├── admin/                  # Componentes del Admin Panel
│   │   │   ├── AdminPanel.tsx      # Container del panel con tabs
│   │   │   ├── UniversitiesManager.tsx  # CRUD universidades
│   │   │   ├── CoursesManager.tsx       # CRUD materias
│   │   │   ├── RubricsManager.tsx       # CRUD rúbricas
│   │   │   └── UsersManager.tsx         # CRUD usuarios
│   │   │
│   │   ├── user/                   # Vista de usuario
│   │   │   └── UserView.tsx        # Vista simplificada (3 secciones)
│   │   │
│   │   ├── auth/                   # Autenticación
│   │   │   ├── Login.tsx           # Pantalla de login
│   │   │   └── ProtectedRoute.tsx  # HOC para proteger rutas
│   │   │
│   │   ├── shared/                 # Componentes reutilizables
│   │   │   ├── Button.tsx          # Botón con variants
│   │   │   ├── Input.tsx           # Input con label y validación
│   │   │   ├── Select.tsx          # Select estilizado
│   │   │   ├── Card.tsx            # Card container
│   │   │   ├── Modal.tsx           # Modal genérico
│   │   │   ├── Table.tsx           # Tabla genérica
│   │   │   └── ProjectConsolidator.tsx  # Consolidador
│   │   │
│   │   └── layout/
│   │       └── Layout.tsx          # Layout principal con navbar
│   │
│   ├── services/                   # Servicios API
│   │   ├── api.ts                  # Instancia de Axios configurada
│   │   ├── authService.ts          # Login, logout, getToken
│   │   ├── universityService.ts    # CRUD universidades
│   │   ├── courseService.ts        # CRUD materias
│   │   ├── rubricService.ts        # CRUD rúbricas
│   │   └── userService.ts          # CRUD usuarios
│   │
│   ├── hooks/                      # Custom hooks
│   │   ├── useAuth.ts              # Hook de autenticación
│   │   └── useApi.ts               # Hook para llamadas API
│   │
│   ├── types/
│   │   └── index.ts                # Tipos TypeScript globales
│   │
│   ├── App.tsx                     # Router principal
│   ├── main.tsx                    # Entry point
│   └── styles.css                  # Estilos globales + Tailwind
│
├── public/                         # Archivos estáticos
├── .env                            # Variables de entorno (NO SUBIR A GIT)
├── .env.example                    # Template de .env
├── .gitignore
├── index.html
├── package.json
├── tailwind.config.js              # Configuración de Tailwind
├── tsconfig.json
├── vite.config.ts
└── README.md
```

---

## 👥 Flujo de Usuarios

### Usuario Normal (rol: `user`)

1. **Login** → `/login`
   - Ingresa username y password
   - Recibe JWT token
   - Se guarda en localStorage

2. **Redirige a Home** → `/`
   - Muestra solo **UserView** (3 secciones)
   - **NO** tiene acceso al Admin Panel
   - Puede acceder a `/consolidator` (público)

3. **UserView - Flujo completo**:
   - Selecciona universidad → materia → rúbrica
   - Sube archivo del alumno
   - Presiona "Corregir" → llama a webhook n8n
   - Visualiza resultados (nota, resumen, fortalezas, recomendaciones)
   - (Opcional) Sube resultados a Google Sheets

4. **Logout** → Elimina token, vuelve a `/login`

---

### Administrador (rol: `admin`)

1. **Login** → `/login`
   - Mismo proceso que usuario normal

2. **Redirige a Home** → `/`
   - Muestra **UserView** (igual que usuario normal)
   - **ADEMÁS** tiene acceso a `/admin`

3. **Admin Panel** → `/admin`
   - **Tab Universidades**:
     - Ver tabla de universidades
     - Crear nueva universidad (modal)
     - Editar universidad (modal con datos precargados)
     - Eliminar universidad (soft delete con confirmación)

   - **Tab Materias**:
     - Filtrar por universidad
     - Ver tabla de materias con universidad asociada
     - Crear nueva materia vinculada a universidad
     - Editar materia
     - Eliminar materia (soft delete)

   - **Tab Rúbricas**:
     - Filtrar por universidad + materia (cascada)
     - Ver tabla con badge de fuente (PDF/JSON/MANUAL)
     - **Crear desde JSON**: Upload de archivo JSON o pegar texto
     - **Crear desde PDF**: Upload de PDF → llama a webhook n8n → Gemini genera rúbrica
     - **Ver rúbrica**: Modal solo lectura con JSON formateado
     - **Editar rúbrica**: Modal con textarea editable
     - **Descargar rúbrica**: Download como archivo .json
     - **Eliminar rúbrica**: Soft delete

   - **Tab Usuarios**:
     - Ver tabla de usuarios activos
     - Toggle "Mostrar eliminados" para ver todos
     - Crear nuevo usuario (username, password, rol)
     - Editar usuario (cambiar username, password opcional, rol)
     - Eliminar usuario (soft delete)
     - Restaurar usuario eliminado
     - **Protección**: Usuario `admin` principal no se puede eliminar ni cambiar rol

4. **Puede usar UserView** igual que un usuario normal

5. **Logout**

---

## 🧩 Componentes Principales

### `App.tsx` - Router Principal

Define todas las rutas del sistema:

```typescript
<Routes>
  {/* Ruta pública */}
  <Route path="/login" element={<Login />} />
  <Route path="/consolidator" element={<ProjectConsolidator />} />

  {/* Rutas protegidas (requieren autenticación) */}
  <Route element={<ProtectedRoute />}>
    <Route path="/" element={<UserView />} />
  </Route>

  {/* Rutas de admin (requieren autenticación + rol admin) */}
  <Route element={<ProtectedRoute requireAdmin />}>
    <Route path="/admin" element={<AdminPanel />} />
  </Route>

  {/* 404 */}
  <Route path="*" element={<NotFound />} />
</Routes>
```

---

### `components/auth/Login.tsx`

Pantalla de login con diseño moderno:
- Logo circular con gradiente
- Formulario de login
- Validación de campos
- Manejo de errores
- Credenciales de prueba mostradas
- Redirige según rol tras login exitoso

---

### `components/user/UserView.tsx`

Vista simplificada con 3 secciones principales:

**Sección 1: Contexto Académico**
- Select universidad (carga desde API)
- Select materia (se habilita al seleccionar universidad)
- Select rúbrica (se habilita al seleccionar materia)

**Sección 2: Corrección**
- Input file para subir archivo del alumno
- Botón "Corregir Archivo" con loading state
- Área de resultados con:
  - Nota destacada
  - Resumen por criterios (parseado automáticamente)
  - Fortalezas (lista)
  - Recomendaciones (lista)

**Sección 3: Subida a Planilla**
- Input: URL de Google Spreadsheet
- Input: Nombre de la hoja
- Input: Alumno
- Input: Legajo/DNI
- Input: Nota (auto-llenado)
- Textarea: Resumen (auto-llenado)
- Textarea: Fortalezas (auto-llenado)
- Textarea: Recomendaciones (auto-llenado)
- Botón "Subir a Planilla"

---

### `components/admin/AdminPanel.tsx`

Container del panel de administración:
- Aside lateral con 4 tabs:
  - 🏫 Universidades
  - 📚 Materias
  - 📋 Rúbricas
  - 👥 Usuarios
- Sistema de navegación entre tabs
- Diseño responsivo

Cada tab renderiza su manager correspondiente.

---

### `components/shared/*`

Componentes reutilizables diseñados con Tailwind:

- **Button**: Variants (primary, secondary, danger), loading state, disabled
- **Input**: Label, error messages, helper text, validación visual
- **Select**: Opciones dinámicas, placeholder, disabled state
- **Card**: Container con hover opcional, padding configurable
- **Modal**: Overlay, ESC para cerrar, footer opcional, tamaños configurables
- **Table**: Genérica con tipos TypeScript, headers, filas, acciones

Todos mantienen el estilo dark theme con gradientes coherentes.

---

## 🎨 Estilo Visual

### Tema Oscuro (Dark Theme)

- **Background principal**: `bg-slate-950` con Aurora gradient animado
- **Cards**: `bg-slate-900/70` con blur y bordes sutiles
- **Texto**: `text-slate-100` / `text-slate-300`
- **Inputs**: Fondo `bg-slate-800`, bordes con hover y focus states

### Gradientes

```css
/* Gradiente principal (botones, highlights) */
bg-gradient-to-r from-sky-400 via-indigo-500 to-purple-500

/* Aurora background */
Gradientes radiales azul, índigo y púrpura con blur

/* Hover en cards */
hover:border-indigo-500/50
```

### Animaciones

- `transition-all duration-300` en elementos interactivos
- `motion-safe:animate-float` en elementos decorativos
- Scrollbars personalizados (`.code-scrollbar`, `.result-scrollbar`)

### Typography

- Fuente: Sans-serif system stack
- Títulos: `text-2xl` / `text-3xl` con `font-bold`
- Body: `text-sm` / `text-base`

---

## 🔧 Consolidador de Proyectos

Herramienta pública para convertir proyectos en un único archivo de texto.

### Acceso

```
http://localhost:5173/consolidator
```

**Sin autenticación requerida.**

### Funcionalidad

- Upload de archivo .zip del proyecto
- 6 modos de conversión predefinidos:
  1. Solo código Java
  2. Solo código JavaScript/TypeScript
  3. Solo código Python
  4. Proyecto web completo
  5. Proyecto universal (todos los lenguajes)
  6. Modo personalizado (extensiones personalizadas)

- Opciones:
  - Incluir/excluir archivos de tests
  - Extensiones personalizadas (modo 6)

- Salida:
  - Archivo .txt con todo el código
  - Botón para copiar al portapapeles
  - Formato optimizado para análisis por IA (ChatGPT, Claude)

### Documentación completa

Ver `../CONSOLIDATOR_README.md` para detalles técnicos.

---

## 🔐 Autenticación y Seguridad

### Flujo de autenticación

1. Usuario envía credenciales a `/api/auth/login`
2. Backend valida y devuelve JWT token
3. Frontend guarda token en `localStorage`
4. En cada request protegido, se envía header:
   ```
   Authorization: Bearer <token>
   ```

### Protección de rutas

```typescript
// Solo autenticados
<Route element={<ProtectedRoute />}>
  <Route path="/" element={<UserView />} />
</Route>

// Solo admin
<Route element={<ProtectedRoute requireAdmin />}>
  <Route path="/admin" element={<AdminPanel />} />
</Route>
```

### Expiración de token

- JWT expira según configuración del backend (default: 7 días)
- Al expirar, el usuario es redirigido automáticamente a `/login`

---

## 🎯 Personalización

### Cambiar colores del tema

Editar `tailwind.config.js`:

```javascript
module.exports = {
  theme: {
    extend: {
      colors: {
        primary: '#3B82F6',    // Cambiar color principal
        secondary: '#8B5CF6',  // Cambiar color secundario
      }
    }
  }
}
```

### Cambiar logo

Reemplazar archivo en `public/logo.png` o actualizar el componente Logo en `Login.tsx`.

### Agregar nuevos campos en formularios

1. Actualizar tipos en `src/types/index.ts`
2. Actualizar componente de formulario
3. Actualizar servicio API correspondiente
4. Actualizar validaciones en backend

---

## 🐛 Troubleshooting

### Error: "Cannot connect to backend"

**Causa**: Backend no está corriendo o .env tiene URL incorrecta

**Solución**:
```bash
# Verificar que backend esté corriendo
curl http://localhost:5000/health

# Verificar .env del frontend
cat .env
# Debe tener: VITE_API_URL=http://localhost:5000

# Reiniciar frontend después de cambiar .env
npm run dev
```

---

### Error: "Token inválido" o redirige a login constantemente

**Causa**: JWT expiró o JWT_SECRET cambió en backend

**Solución**:
1. Hacer logout
2. Limpiar localStorage del navegador
3. Volver a hacer login

---

### No aparecen universidades/cursos/rúbricas

**Causa**: Datos no fueron migrados en backend

**Solución**:
```bash
cd ../backend
npm run seed
```

---

### Error CORS

**Causa**: Backend no tiene configurado CORS para el frontend

**Solución**: Verificar `backend/.env`:
```
CORS_ORIGIN=http://localhost:5173
```

Reiniciar backend.

---

## 📝 Scripts Disponibles

```json
{
  "dev": "vite",                    // Desarrollo con hot-reload
  "build": "tsc && vite build",     // Build de producción
  "preview": "vite preview",        // Preview del build
  "lint": "eslint . --ext ts,tsx"   // Linting (si está configurado)
}
```

---

## 🚀 Deploy a Producción

### 1. Build

```bash
npm run build
```

Esto genera la carpeta `dist/` con archivos optimizados.

### 2. Variables de entorno

Configurar variables de producción (reemplazar URLs locales por producción):

```env
VITE_API_URL=https://tu-backend-produccion.com
VITE_N8N_GRADING_WEBHOOK=https://tu-n8n-produccion.com/webhook/corregir
VITE_N8N_SPREADSHEET_WEBHOOK=https://tu-n8n-produccion.com/webhook/spreadsheet
```

### 3. Opciones de deploy

**Opción A: Vercel**
```bash
npm install -g vercel
vercel --prod
```

**Opción B: Netlify**
- Conectar repositorio de GitHub
- Build command: `npm run build`
- Publish directory: `dist`

**Opción C: Servidor propio (Nginx)**
- Copiar carpeta `dist/` al servidor
- Configurar Nginx para servir archivos estáticos y manejar SPA routing

---

## 📞 Soporte

Para problemas relacionados con:
- **Backend API**: Ver `../backend/README.md`
- **Flujos de n8n**: Ver `../../n8n-flows/README.md`
- **Plan general del proyecto**: Ver `../../PROYECTO_PLAN.md`
- **Guía de pruebas**: Ver `../../GUIA_PRUEBAS.md`

---

**Última actualización**: Noviembre 2025
**Versión**: 1.0
