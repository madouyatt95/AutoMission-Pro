import React from 'react';
import ReactDOM from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import App from './App';
import './index.css';
import { hydrateLocalStores } from './store';

const root = ReactDOM.createRoot(document.getElementById('root')!);
root.render(<main style={{ padding: 24 }} role="status">Chargement des données locales…</main>);

// IndexedDB hydration is asynchronous. Finish it before rendering forms or
// merging with Supabase, so an empty initial state cannot replace local work.
void hydrateLocalStores().then(() => {
  root.render(
    <React.StrictMode>
      <HashRouter>
        <App />
      </HashRouter>
    </React.StrictMode>,
  );
}).catch((error: unknown) => {
  console.error('Unable to load local data:', error);
  root.render(
    <main role="alert" style={{ padding: 24 }}>
      <p>Impossible de charger les données locales. Réessayez sans effacer les données du navigateur.</p>
      <button onClick={() => window.location.reload()}>Réessayer</button>
    </main>,
  );
});
