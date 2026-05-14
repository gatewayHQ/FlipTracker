import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Portfolio from './pages/Portfolio';
import Projects from './pages/Projects';
import ProjectDetail from './pages/ProjectDetail';
import AddProject from './pages/AddProject';
import Capital from './pages/Capital';
import Analytics from './pages/Analytics';
import Vendors from './pages/Vendors';
import Settings from './pages/Settings';
import ContractorPortal from './pages/ContractorPortal';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public contractor portal — no nav/layout */}
        <Route path="/contractor/:token" element={<ContractorPortal />} />

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
    </BrowserRouter>
  );
}
