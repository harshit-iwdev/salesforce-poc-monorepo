'use client';

import React from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export interface ToastItem {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}

interface ToastContainerProps {
  toasts: ToastItem[];
  onDismiss: (id: string) => void;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onDismiss }) => {
  if (toasts.length === 0) return null;

  return (
    <div style={{
      position: 'fixed',
      top: '1.5rem',
      right: '1.5rem',
      display: 'flex',
      flexDirection: 'column',
      gap: '0.75rem',
      zIndex: 9999,
      maxWidth: '420px',
      width: '100%',
      pointerEvents: 'none',
    }}>
      {toasts.map((toast) => (
        <div
          key={toast.id}
          style={{
            pointerEvents: 'auto',
            background: toast.type === 'success' ? '#09271d' : toast.type === 'error' ? '#2a0d14' : '#0c1a30',
            border: `1px solid ${
              toast.type === 'success'
                ? 'rgba(16, 185, 129, 0.4)'
                : toast.type === 'error'
                ? 'rgba(244, 63, 94, 0.4)'
                : 'rgba(14, 165, 233, 0.4)'
            }`,
            borderRadius: '12px',
            padding: '0.9rem 1.1rem',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '0.75rem',
            boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
            backdropFilter: 'blur(12px)',
            animation: 'fadeIn 0.2s ease-out',
          }}
        >
          <div style={{ marginTop: '2px', flexShrink: 0 }}>
            {toast.type === 'success' && <CheckCircle2 size={18} color="#34d399" />}
            {toast.type === 'error' && <AlertCircle size={18} color="#fb7185" />}
            {toast.type === 'info' && <Info size={18} color="#38bdf8" />}
          </div>
          <div style={{
            flex: 1,
            fontSize: '0.85rem',
            lineHeight: 1.4,
            color: toast.type === 'success' ? '#a7f3d0' : toast.type === 'error' ? '#fecdd3' : '#bae6fd',
            wordBreak: 'break-word',
          }}>
            {toast.message}
          </div>
          <button
            onClick={() => onDismiss(toast.id)}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: '#94a3b8',
              padding: '2px',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <X size={16} />
          </button>
        </div>
      ))}
    </div>
  );
};
