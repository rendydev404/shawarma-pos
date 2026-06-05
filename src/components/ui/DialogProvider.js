'use client';

import React, { createContext, useContext, useState, useCallback, useRef } from 'react';

const DialogContext = createContext({});

export function DialogProvider({ children }) {
  const [dialogs, setDialogs] = useState([]);
  const idCounter = useRef(0);

  const showDialog = useCallback((options) => {
    return new Promise((resolve) => {
      const id = ++idCounter.current;
      
      const handleClose = (result) => {
        setDialogs((prev) => prev.filter((d) => d.id !== id));
        resolve(result);
      };

      const newDialog = {
        id,
        ...options,
        onClose: handleClose,
      };

      setDialogs((prev) => [...prev, newDialog]);
    });
  }, []);

  const confirm = useCallback((message, options = {}) => {
    return showDialog({
      type: 'confirm',
      message,
      title: options.title || 'Konfirmasi',
      confirmText: options.confirmText || 'Ya',
      cancelText: options.cancelText || 'Batal',
      isDanger: options.isDanger || false,
    });
  }, [showDialog]);

  const alert = useCallback((message, options = {}) => {
    return showDialog({
      type: 'alert',
      message,
      title: options.title || 'Pemberitahuan',
      confirmText: options.confirmText || 'OK',
    });
  }, [showDialog]);

  return (
    <DialogContext.Provider value={{ confirm, alert }}>
      {children}
      {dialogs.map((dialog) => (
        <DialogModal key={dialog.id} dialog={dialog} />
      ))}
    </DialogContext.Provider>
  );
}

export function useDialog() {
  const context = useContext(DialogContext);
  if (!context) {
    throw new Error('useDialog must be used within DialogProvider');
  }
  return context;
}

function DialogModal({ dialog }) {
  return (
    <div className="modal-overlay" style={{ background: 'rgba(15, 23, 42, 0.6)', zIndex: 9999 }}>
      <div className="modal animate-scale-in" style={{ maxWidth: '400px', padding: '0', overflow: 'hidden' }}>
        <div className="modal-header" style={{ borderBottom: '1px solid var(--border-color)', padding: '16px 20px', background: 'var(--bg-secondary)' }}>
          <h2 style={{ fontSize: 'var(--text-lg)', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
            {dialog.type === 'confirm' ? (
              <span className="material-icons-round" style={{ color: dialog.isDanger ? 'var(--color-danger)' : 'var(--color-primary)' }}>
                help_outline
              </span>
            ) : (
              <span className="material-icons-round" style={{ color: 'var(--color-primary)' }}>
                info_outline
              </span>
            )}
            {dialog.title}
          </h2>
        </div>
        <div className="modal-body" style={{ padding: '24px 20px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
          {dialog.message}
        </div>
        <div className="modal-footer" style={{ padding: '16px 20px', borderTop: '1px solid var(--border-color)', background: 'var(--bg-secondary)' }}>
          {dialog.type === 'confirm' && (
            <button className="btn btn-secondary" onClick={() => dialog.onClose(false)}>
              {dialog.cancelText}
            </button>
          )}
          <button 
            className={`btn ${dialog.isDanger ? 'btn-danger' : 'btn-primary'}`} 
            onClick={() => dialog.onClose(true)}
            autoFocus
          >
            {dialog.confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
