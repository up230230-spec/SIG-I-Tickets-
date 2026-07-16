import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './routes/ProtectedRoute';

import Login from './pages/Login';
import Register from './pages/Register';
import ReportIncident from './pages/ReportIncident';
import MyTickets from './pages/MyTickets';
import AreaPanel from './pages/AreaPanel';
import GlobalPanel from './pages/GlobalPanel';
import ExecutiveDashboard from './pages/ExecutiveDashboard';
import Forum from './pages/Forum';
import MyActivity from './pages/MyActivity';

import './styles/theme.css';
import './App.css';

/**
 * Enrutamiento de SIG-I. Cada panel se protege por rol (ver ProtectedRoute).
 * Requiere: npm i react-router-dom  (y socket.io-client para tiempo real).
 */
export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Públicas */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Usuario general */}
          <Route path="/" element={<ProtectedRoute><ReportIncident /></ProtectedRoute>} />
          <Route path="/mis-tickets" element={<ProtectedRoute><MyTickets /></ProtectedRoute>} />

          {/* Administrador de área */}
          <Route
            path="/area"
            element={<ProtectedRoute roles={['admin_area', 'operaciones']}><AreaPanel /></ProtectedRoute>}
          />

          {/* Operaciones */}
          <Route
            path="/operaciones"
            element={<ProtectedRoute roles={['operaciones']}><GlobalPanel /></ProtectedRoute>}
          />

          {/* Rector */}
          <Route
            path="/ejecutivo"
            element={<ProtectedRoute roles={['rector', 'operaciones']}><ExecutiveDashboard /></ProtectedRoute>}
          />

          {/* Foro (todos los roles autenticados) */}
          <Route path="/foro" element={<ProtectedRoute><Forum /></ProtectedRoute>} />

          {/* Mi actividad — dashboard personal (todos los roles autenticados) */}
          <Route path="/mi-actividad" element={<ProtectedRoute><MyActivity /></ProtectedRoute>} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
