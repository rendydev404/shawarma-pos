'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export default function Toast({ toasts, onDismiss }) {
  if (!toasts || toasts.length === 0) return null;

  return (
    <div className="toast-container">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`toast toast-${toast.type || 'success'}`}
          onClick={() => onDismiss(toast.id)}
          style={{ cursor: 'pointer' }}
        >
          <span className="material-icons-round" style={{ fontSize: '20px' }}>
            {toast.type === 'error' ? 'error' :
              toast.type === 'warning' ? 'warning' : 'check_circle'}
          </span>
          <span style={{ flex: 1 }}>{toast.message}</span>
          <span className="material-icons-round" style={{ fontSize: '18px', color: 'var(--text-tertiary)' }}>
            close
          </span>
        </div>
      ))}
    </div>
  );
}

// Toast hook
let toastIdCounter = 0;

export function useToast() {
  const [toasts, setToasts] = useState([]);

  const addToast = (message, type = 'success', duration = 3000) => {
    const id = ++toastIdCounter;
    setToasts((prev) => [...prev, { id, message, type }]);

    if (duration > 0) {
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, duration);
    }

    return id;
  };

  const dismissToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return { toasts, addToast, dismissToast };
}
