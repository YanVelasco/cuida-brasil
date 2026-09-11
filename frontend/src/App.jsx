import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { RegionProvider } from './contexts/RegionContext';
import AIChatbot from './components/ui/AIChatbot';
import VLibrasWidget from './components/ui/VLibrasWidget';

// Auth pages
import Login from './pages/auth/Login';
import Cadastro from './pages/auth/Cadastro';

// Citizen pages
import CitizenHome from './pages/citizen/CitizenHome';
import NovaSolicitacao from './pages/citizen/NovaSolicitacao';
import Protocolo from './pages/citizen/Protocolo';
import Avaliar from './pages/citizen/Avaliar';

// Admin pages
import Dashboard from './pages/admin/Dashboard';
import SystemDashboard from './pages/admin/SystemDashboard';
import MapaOcorrencias from './pages/admin/MapaOcorrencias';
import Solicitacoes from './pages/admin/Solicitacoes';
import Equipes from './pages/admin/Equipes';
import Relatorios from './pages/admin/Relatorios';
import Suporte from './pages/admin/Suporte';
import Orgaos from './pages/admin/Orgaos';

function PrivateRoute({ children, role, roles }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  const allowed = roles ?? [role].filter(Boolean);
  if (allowed.length > 0 && !allowed.includes(user.perfil)) return <Navigate to="/login" replace />;
  return children;
}

function AdminHome() {
  const { user } = useAuth();
  if (user?.perfil === 'ADMIN' || user?.perfil === 'ANALYTICS_ADMIN' || user?.perfil === 'GLOBAL_ADMIN') return <SystemDashboard />;
  if (user?.perfil === 'GESTOR') return <Navigate to="/admin/dashboard" replace />;
  return <Navigate to="/login" replace />;
}

function AppRoutes() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<Login />} />
      <Route path="/cadastro" element={<Cadastro />} />

      {/* Citizen App */}
      <Route path="/app" element={<PrivateRoute><CitizenHome /></PrivateRoute>} />
      <Route path="/app/nova-solicitacao" element={<PrivateRoute><NovaSolicitacao /></PrivateRoute>} />
      <Route path="/app/protocolo" element={<PrivateRoute><Protocolo /></PrivateRoute>} />
      <Route path="/app/protocolo/:id" element={<PrivateRoute><Protocolo /></PrivateRoute>} />
      <Route path="/app/avaliar" element={<PrivateRoute><Avaliar /></PrivateRoute>} />
      <Route path="/app/avaliar/:id" element={<PrivateRoute><Avaliar /></PrivateRoute>} />

      {/* Admin */}
      <Route path="/admin" element={<PrivateRoute><AdminHome /></PrivateRoute>} />
      <Route path="/admin/dashboard" element={<PrivateRoute roles={['GESTOR', 'ANALYTICS_ADMIN']}><Dashboard /></PrivateRoute>} />
      <Route path="/admin/mapa" element={<PrivateRoute roles={['ADMIN', 'GESTOR']}><MapaOcorrencias /></PrivateRoute>} />
      <Route path="/admin/solicitacoes" element={<PrivateRoute roles={['ADMIN', 'GESTOR']}><Solicitacoes /></PrivateRoute>} />
      <Route path="/admin/equipes" element={<PrivateRoute roles={['ADMIN', 'GESTOR']}><Equipes /></PrivateRoute>} />
      <Route path="/admin/relatorios" element={<PrivateRoute roles={['ADMIN', 'GESTOR', 'ANALYTICS_ADMIN']}><Relatorios /></PrivateRoute>} />
      <Route path="/admin/orgaos" element={<PrivateRoute role="GLOBAL_ADMIN"><Orgaos /></PrivateRoute>} />
      <Route path="/admin/suporte" element={<PrivateRoute role="GESTOR"><Suporte /></PrivateRoute>} />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

function AppShell() {
  const location = useLocation();
  const { user } = useAuth();
  const showVLibras = !location.pathname.startsWith('/app') && user?.perfil !== 'CITIZEN';

  return (
    <>
      <AppRoutes />
      <AIChatbot />
      {showVLibras && <VLibrasWidget />}
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ThemeProvider>
          <RegionProvider>
            <AppShell />
          </RegionProvider>
        </ThemeProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
