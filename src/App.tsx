/**
 * App.tsx - Router principal de la aplicación
 * Integra React Router y maneja las rutas principales
 */
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Login } from './components/auth/Login';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { Layout } from './components/layout/Layout';
import { UserView } from './components/user/UserView';
import { AdminPanel } from './components/admin/AdminPanel';

const HomePage = () => {
  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <UserView />
      </div>
    </Layout>
  );
};

const AdminPage = () => {
  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <AdminPanel />
      </div>
    </Layout>
  );
};

const NotFoundPage = () => {
  return (
    <Layout showNavbar={false}>
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-6xl font-bold text-text-primary mb-4">404</h1>
          <p className="text-xl text-text-disabled mb-6">Página no encontrada</p>
          <a
            href="/"
            className="text-accent-1 hover:text-accent-2 transition-colors"
          >
            Volver al inicio
          </a>
        </div>
      </div>
    </Layout>
  );
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Ruta pública - Login */}
        <Route path="/login" element={<Login />} />

        {/* Ruta protegida - Home (usuario normal o admin) */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <HomePage />
            </ProtectedRoute>
          }
        />

        {/* Ruta protegida - Admin (solo admin) */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute requireAdmin={true}>
              <AdminPage />
            </ProtectedRoute>
          }
        />

        {/* Ruta 404 */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
