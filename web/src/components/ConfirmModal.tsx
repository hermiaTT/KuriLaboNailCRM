import { useEffect, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

import { t, useLanguage } from '../lib/i18n';
import { PaperCard } from './UI';

type ConfirmModalProps = {
  open: boolean;
  title: string;
  message: ReactNode;
  onConfirm: () => void;
  onCancel: () => void;
  confirmLabel?: string;
  cancelLabel?: string;
  pending?: boolean;
  tone?: 'default' | 'danger';
};

export function ConfirmModal({
  open,
  title,
  message,
  onConfirm,
  onCancel,
  confirmLabel = t('Confirm'),
  cancelLabel = t('Cancel'),
  pending = false,
  tone = 'default',
}: ConfirmModalProps) {
  useLanguage();

  useEffect(() => {
    if (!open) return;
    const cancelOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !pending) onCancel();
    };
    window.addEventListener('keydown', cancelOnEscape);
    return () => window.removeEventListener('keydown', cancelOnEscape);
  }, [open, pending, onCancel]);

  if (!open) return null;

  return createPortal(
    <div className="confirm-modal-backdrop" role="presentation" onMouseDown={(event) => {
      if (event.target === event.currentTarget && !pending) onCancel();
    }}>
      <PaperCard className={`confirm-modal confirm-modal-${tone}`} role="alertdialog" aria-modal="true" aria-labelledby="confirm-modal-title" aria-describedby="confirm-modal-message">
        <span className="confirm-modal-mark" aria-hidden="true">{tone === 'danger' ? '!' : '✦'}</span>
        <h2 id="confirm-modal-title">{title}</h2>
        <div id="confirm-modal-message" className="confirm-modal-message">{message}</div>
        <div className="confirm-modal-actions">
          <button type="button" className="secondary-button" disabled={pending} onClick={onCancel} autoFocus={tone === 'danger'}>{cancelLabel}</button>
          <button type="button" className={tone === 'danger' ? 'confirm-danger-button' : 'primary-button'} disabled={pending} onClick={onConfirm}>{confirmLabel}</button>
        </div>
      </PaperCard>
    </div>,
    document.body,
  );
}
