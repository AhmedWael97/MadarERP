import React from 'react';
import ReactDOM from 'react-dom/client';
// Cairo + Inter are loaded via a <link> tag in index.html (same approach as
// the reference Laravel app), so no @fontsource install step is required.
import './styles/globals.css';
import App from './App';
import { initI18n } from './lib/i18n';

// Boot i18n before React renders so the first paint already has translations.
initI18n();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
