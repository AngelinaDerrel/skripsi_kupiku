import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

const ToastCtx = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    if (document.querySelector('#kp-toast-style')) return;
    const el = document.createElement('style');
    el.id = 'kp-toast-style';
    el.textContent = `@keyframes kp-slide-down { from { opacity:0; transform:translateY(-10px); } to { opacity:1; transform:translateY(0); } }`;
    document.head.appendChild(el);
  }, []);

  const toast = useCallback((message, type = 'warn', duration = 4500) => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), duration);
  }, []);

  return (
    <ToastCtx.Provider value={toast}>
      {children}
      {toasts.length > 0 && (
        <div style={{
          position: 'fixed', top: 20, left: '50%', transform: 'translateX(-50%)',
          zIndex: 9999, display: 'flex', flexDirection: 'column', gap: 8,
          pointerEvents: 'none', width: 'max-content',
          maxWidth: 'min(480px, calc(100vw - 32px))',
        }}>
          {toasts.map(t => (
            <div
              key={t.id}
              style={{
                padding: '13px 20px',
                borderRadius: 10,
                background: t.type === 'success'
                  ? 'rgba(14, 35, 16, 0.97)'
                  : t.type === 'error'
                  ? 'rgba(35, 10, 10, 0.97)'
                  : 'rgba(28, 18, 10, 0.97)',
                border: `1px solid ${t.type === 'success' ? 'rgba(74,160,74,0.5)' : t.type === 'error' ? 'rgba(197,74,74,0.6)' : 'rgba(197,139,90,0.5)'}`,
                color: t.type === 'success' ? '#86efac' : t.type === 'error' ? '#fca5a5' : '#E8D9C8',
                fontSize: 13, lineHeight: 1.6,
                boxShadow: '0 8px 32px rgba(0,0,0,0.55)',
                backdropFilter: 'blur(14px)',
                animation: 'kp-slide-down 0.22s ease',
                whiteSpace: 'pre-line',
                textAlign: 'center',
              }}
            >
              {t.message}
            </div>
          ))}
        </div>
      )}
    </ToastCtx.Provider>
  );
}

export function useToast() {
  return useContext(ToastCtx);
}
