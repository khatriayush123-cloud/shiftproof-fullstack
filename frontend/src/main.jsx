import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import './index.css';

// The previous demo version kept data in localStorage. Remove any leftovers
// on startup so old demo data cannot linger in the browser.
try {
  Object.keys(localStorage)
    .filter((key) => key.startsWith('shiftproof'))
    .forEach((key) => localStorage.removeItem(key));
} catch {
  // storage unavailable - nothing to clean
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>
);
