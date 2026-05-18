import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App';
import './styles/tokens.css';
import './styles/global.css';

// One-shot rename of tonnage:* localStorage keys to massed:* (renamed May 2026).
// Safe to delete once every active install has booted once.
for (const key of Object.keys(localStorage)) {
  if (!key.startsWith('tonnage:')) continue;
  const value = localStorage.getItem(key);
  if (value === null) continue;
  const newKey = 'massed:' + key.slice('tonnage:'.length);
  if (localStorage.getItem(newKey) === null) {
    localStorage.setItem(newKey, value);
  }
  localStorage.removeItem(key);
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
