import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './lib/AuthContext';
import Layout from './components/Layout';
import Auth from './pages/Auth';
import Portfolio from './pages/Portfolio';
import Projects from './pages/Projects';
import ProjectDetail from './pages/ProjectDetail';
import AddProject from './pages/AddProject';
import Capital from './pages/Capital';
import Analytics from './pages/Analytics';
import Vendors from './pages/Vendors';
import Settings from './pages/Settings';

function ProtectedRoutes() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-surface-900 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-brand border-t-transparent rounded-full animate-spin" />
          <span className="text-gray-400 text-sm">Loading...</span>
        </div>
      </div>
    );
  }

  if (!user) return <Auth />;

  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Navigate to="/portfolio" replace />} />
        <Route path="/portfolio" element={<Portfolio />} />
        <Route path="/projects" element={<Projects />} />
        <Route path="/projects/new" element={<AddProject />} />
        <Route path="/projects/:id" element={<ProjectDetail />} />
        <Route path="/projects/:id/edit" element={<AddProject />} />
        <Route path="/capital" element={<Capital />} />
        <Route path="/analytics" element={<Analytics />} />
        <Route path="/vendors" element={<Vendors />} />
        <Route path="/settings" element={<Settings />} />
      </Route>
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <ProtectedRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}
