import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import './styles/tokens.css';
import './styles/globals.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);

// Debug helpers: surface uncaught errors and unhandled promise rejections
console.log('Kupiku: mounting app');

function showFatalError(message) {
  try {
    const existing = document.getElementById('kupiku-fatal');
    if (existing) existing.remove();
    const pre = document.createElement('pre');
    pre.id = 'kupiku-fatal';
    pre.style.position = 'fixed';
    pre.style.left = '12px';
    pre.style.right = '12px';
    pre.style.top = '12px';
    pre.style.padding = '12px';
    pre.style.zIndex = 99999;
    pre.style.background = 'rgba(255,255,255,0.95)';
    pre.style.color = '#111';
    pre.style.border = '1px solid #ccc';
    pre.style.borderRadius = '8px';
    pre.style.maxHeight = '40vh';
    pre.style.overflow = 'auto';
    pre.textContent = String(message);
    document.body.appendChild(pre);
  } catch (e) {
    // ignore
  }
}

window.addEventListener('error', (ev) => {
  console.error('Uncaught error', ev.error || ev.message, ev);
  showFatalError(ev.error ? ev.error.stack || ev.error.message : ev.message);
});

window.addEventListener('unhandledrejection', (ev) => {
  console.error('Unhandled rejection', ev.reason);
  showFatalError(ev.reason && ev.reason.stack ? ev.reason.stack : String(ev.reason));
});
