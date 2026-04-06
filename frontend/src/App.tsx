import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Reserve from './pages/Reserve';
import MyReservations from './pages/MyReservations';
import AdminPanel from './pages/AdminPanel';
import Terms from './pages/Terms';
import NotFound from './pages/NotFound';
import ErrorBoundary from './components/ErrorBoundary';

function ProtectedRoute({ children, allowAdminBiena = true }: { children: React.ReactNode, allowAdminBiena?: boolean }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="p-8 text-center text-gray-500 font-bold uppercase tracking-widest animate-pulse">Procesando Identidad Militar...</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (!allowAdminBiena && user.role === 'admin_biena') return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <Router>
          <div className="min-h-screen bg-slate-50 flex flex-col font-sans transition-all duration-300">
            <Navbar />

            <main className="flex-1 w-full">
              <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                <Route path="/reserve" element={<ProtectedRoute allowAdminBiena={false}><Reserve /></ProtectedRoute>} />
                <Route path="/my-reservations" element={<ProtectedRoute allowAdminBiena={false}><MyReservations /></ProtectedRoute>} />
                <Route path="/admin" element={<ProtectedRoute><AdminPanel /></ProtectedRoute>} />
                <Route path="/terms" element={<Terms />} />
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </main>
          </div>
        </Router>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
