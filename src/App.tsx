import { useEffect } from 'react';
import { Routes, Route, useLocation, useNavigate, Link } from 'react-router-dom';
import { LayoutDashboard, ClipboardList, Zap, Users, FileText, Bell, Car, Cloud, CloudOff, CloudRain, RefreshCw } from 'lucide-react';
import Dashboard from './pages/Dashboard';
import Missions from './pages/Missions';
import Terrain from './pages/Terrain';
import Clients from './pages/Clients';
import Documents from './pages/Documents';
import Rappels from './pages/Rappels';
import MissionDetail from './pages/MissionDetail';
import VehicleHistory from './pages/VehicleHistory';
import ClientDetail from './pages/ClientDetail';
import { useRappelStore } from './store';
import { pullAllData, useSyncStore } from './utils/supabaseSync';

const navItems = [
  { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/missions', icon: ClipboardList, label: 'Missions' },
  { path: '/terrain', icon: Zap, label: 'Terrain', isTerrain: true },
  { path: '/clients', icon: Users, label: 'Clients' },
  { path: '/documents', icon: FileText, label: 'Documents' },
];

export default function App() {
  const location = useLocation();
  const navigate = useNavigate();
  const { rappels } = useRappelStore();
  const { status, lastSynced, errorMessage } = useSyncStore();
  
  const today = new Date().toISOString().split('T')[0];
  const uncompletedRappels = rappels.filter(r => !r.completed && r.date <= today).length;

  // Hydrate local store from Supabase on application mount
  useEffect(() => {
    void pullAllData();
    const retry = () => { void pullAllData(); };
    const retryTimer = window.setInterval(() => {
      if (navigator.onLine && useSyncStore.getState().status === 'error') retry();
    }, 30_000);
    window.addEventListener('online', retry);
    return () => {
      window.clearInterval(retryTimer);
      window.removeEventListener('online', retry);
    };
  }, []);

  return (
    <div className="app">
      {/* Dynamic Spin Animation Style injection */}
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        .sync-spin {
          animation: spin 1.5s linear infinite;
        }
      `}</style>

      {!location.pathname.startsWith('/mission/') && (
        <header className="top-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Link to="/" className="header-title">
            <Car size={24} color="var(--accent)" />
            Chauffeur <span>Service</span>
          </Link>

          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            {/* Supabase Reactive Cloud Sync Badge */}
            {status === 'syncing' && (
              <div 
                title="Synchronisation cloud en cours..." 
                style={{ display: 'flex', alignItems: 'center', color: 'var(--accent)', cursor: 'pointer' }}
              >
                <RefreshCw size={18} className="sync-spin" />
              </div>
            )}
            {status === 'synced' && (
              <button
                type="button"
                aria-label="Actualiser la synchronisation"
                title={`Synchronisé avec Supabase (${lastSynced ? new Date(lastSynced).toLocaleTimeString() : 'à l\'instant'})`} 
                style={{ display: 'flex', alignItems: 'center', color: '#10b981', cursor: 'pointer', background: 'none', border: 0, padding: 4 }}
                onClick={() => { void pullAllData(); }}
              >
                <Cloud size={18} />
              </button>
            )}
            {status === 'error' && (
              <button
                type="button"
                aria-label={`Réessayer la synchronisation : ${errorMessage || 'Erreur de connexion'}`}
                title={`${errorMessage || 'Erreur de synchronisation'}. Cliquez pour réessayer. Mode local actif.`}
                style={{ display: 'flex', alignItems: 'center', color: 'var(--red)', cursor: 'pointer', background: 'none', border: 0, padding: 4 }}
                onClick={() => { void pullAllData(); }}
              >
                <CloudRain size={18} />
              </button>
            )}
            {status === 'not_configured' && (
              <div 
                title="Mode local uniquement (Supabase non configuré)" 
                style={{ display: 'flex', alignItems: 'center', color: 'var(--text3)', cursor: 'pointer' }}
              >
                <CloudOff size={18} />
              </div>
            )}

            <button className="header-bell" style={{ margin: 0 }} onClick={() => navigate('/rappels')}>
              <Bell />
              {uncompletedRappels > 0 && <span className="bell-badge"></span>}
            </button>
          </div>
        </header>
      )}

      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/missions" element={<Missions />} />
        <Route path="/terrain" element={<Terrain />} />
        <Route path="/clients" element={<Clients />} />
        <Route path="/documents" element={<Documents />} />
        <Route path="/rappels" element={<Rappels />} />
        <Route path="/mission/:id" element={<MissionDetail />} />
        <Route path="/vehicule/:plaque" element={<VehicleHistory />} />
        <Route path="/client/:id" element={<ClientDetail />} />
      </Routes>

      {!location.pathname.startsWith('/mission/') && (
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
      )}
    </div>
  );
}
