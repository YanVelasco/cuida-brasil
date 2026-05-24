import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import AIChatbot from './components/ui/AIChatbot';

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
import MapaOcorrencias from './pages/admin/MapaOcorrencias';
import Solicitacoes from './pages/admin/Solicitacoes';
import Equipes from './pages/admin/Equipes';
import Relatorios from './pages/admin/Relatorios';

function PrivateRoute({ children, role }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (role && user.perfil !== role) return <Navigate to="/login" replace />;
  return children;
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
      <Route path="/admin" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
      <Route path="/admin/mapa" element={<PrivateRoute><MapaOcorrencias /></PrivateRoute>} />
      <Route path="/admin/solicitacoes" element={<PrivateRoute><Solicitacoes /></PrivateRoute>} />
      <Route path="/admin/equipes" element={<PrivateRoute><Equipes /></PrivateRoute>} />
      <Route path="/admin/relatorios" element={<PrivateRoute><Relatorios /></PrivateRoute>} />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ThemeProvider>
          <AppRoutes />
          <AIChatbot />
        </ThemeProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
