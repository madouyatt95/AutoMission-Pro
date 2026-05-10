import React from 'react';
import ReactDOM from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import App from './App';
import './index.css';
import { initializeSeedData } from './seedData';

// Disable seed data generation for production
// initializeSeedData();

// One-time script to wipe the fake data from the user's phone
if (localStorage.getItem('automission-seeded-v3')) {
  localStorage.clear();
  // Ensure the page reloads cleanly
  window.location.reload();
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <HashRouter>
      <App />
    </HashRouter>
  </React.StrictMode>
);
