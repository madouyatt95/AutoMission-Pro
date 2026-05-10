import { Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, ClipboardList, Zap, Users, FileText, Bell } from 'lucide-react';
import Dashboard from './pages/Dashboard';
import Missions from './pages/Missions';
import Terrain from './pages/Terrain';
import Clients from './pages/Clients';
import Documents from './pages/Documents';
import Rappels from './pages/Rappels';
import MissionDetail from './pages/MissionDetail';
import VehicleHistory from './pages/VehicleHistory';

const navItems = [
  { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/missions', icon: ClipboardList, label: 'Missions' },
  { path: '/terrain', icon: Zap, label: 'Terrain', isTerrain: true },
  { path: '/clients', icon: Users, label: 'Clients' },
  { path: '/documents', icon: FileText, label: 'Documents' },
  { path: '/rappels', icon: Bell, label: 'Rappels' },
];

export default function App() {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <div className="app">
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/missions" element={<Missions />} />
        <Route path="/terrain" element={<Terrain />} />
        <Route path="/clients" element={<Clients />} />
        <Route path="/documents" element={<Documents />} />
        <Route path="/rappels" element={<Rappels />} />
        <Route path="/mission/:id" element={<MissionDetail />} />
        <Route path="/vehicule/:plaque" element={<VehicleHistory />} />
      </Routes>

      <nav className="bottom-nav">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          if (item.isTerrain) {
            return (
              <button key={item.path} className={`nav-terrain ${isActive ? 'active' : ''}`} onClick={() => navigate(item.path)}>
                <div className="nav-terrain-btn"><item.icon /></div>
                <span>{item.label}</span>
              </button>
            );
          }
          return (
            <button key={item.path} className={`nav-item ${isActive ? 'active' : ''}`} onClick={() => navigate(item.path)}>
              <item.icon />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
