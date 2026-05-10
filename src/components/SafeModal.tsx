import React from 'react';

interface SafeModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children?: React.ReactNode;
  actions: React.ReactNode;
  subtitle?: React.ReactNode;
}

export default function SafeModal({ isOpen, onClose, title, children, actions, subtitle }: SafeModalProps) {
  if (!isOpen) return null;

  return (
    <div className="safe-modal-overlay" onClick={onClose}>
      <div className="safe-modal-content" onClick={e => e.stopPropagation()}>
        <div style={{ padding: '24px 24px 0 24px' }}>
          <div className="modal-handle" />
          <h3 className="modal-title">{title}</h3>
          {subtitle && <div style={{ marginBottom: 16 }}>{subtitle}</div>}
          <div style={{ paddingBottom: 24 }}>
            {children}
          </div>
        </div>
        <div className="safe-modal-actions">
          {actions}
        </div>
      </div>
    </div>
  );
}
