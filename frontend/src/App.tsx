import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import { WorkspaceProvider } from './context/WorkspaceContext';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import { useWorkspace } from './context/WorkspaceContext';

function AppRoutes() {
  const { isAuthenticated, isLoading } = useAuth();
  const { fetchWorkspaces } = useWorkspace();

  useEffect(() => {
    if (isAuthenticated) fetchWorkspaces();
  }, [isAuthenticated, fetchWorkspaces]);

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-900">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-400 text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <Routes>
      <Route
        path="/login"
        element={isAuthenticated ? <Navigate to="/" replace /> : <LoginPage />}
      />
      <Route
        path="/register"
        element={isAuthenticated ? <Navigate to="/" replace /> : <RegisterPage />}
      />
      <Route
        path="/"
        element={isAuthenticated ? <DashboardPage /> : <Navigate to="/login" replace />}
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <SocketProvider>
          <WorkspaceProvider>
            <AppRoutes />
            <Toaster
              position="bottom-right"
              toastOptions={{
                duration: 3000,
                style: {
                  background: '#1e293b',
                  color: '#f8fafc',
                  borderRadius: '12px',
                  fontSize: '14px',
                  border: '1px solid #334155',
                },
                success: { iconTheme: { primary: '#6366f1', secondary: '#fff' } },
                error: { iconTheme: { primary: '#ef4444', secondary: '#fff' } },
              }}
            />
          </WorkspaceProvider>
        </SocketProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
