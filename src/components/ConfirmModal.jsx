import React from 'react';
import { createPortal } from 'react-dom';
import { useLanguage } from '../context/LanguageContext';
import { AlertTriangle, X } from 'lucide-react';

export default function ConfirmModal({ isOpen, onClose, onConfirm, message, title, description, confirmText, isDanger = true }) {
    const { t } = useLanguage();

    if (!isOpen) return null;

    return createPortal(
        <div className={`modal-overlay active z-[100]`} onClick={onClose}>
            <div className={`modal-content active`} onClick={e => e.stopPropagation()}>

                <button className="modal-close" onClick={onClose}>
                    <X size={20} />
                </button>

                <div className="modal-icon-container">
                    <AlertTriangle size={32} />
                </div>

                <h3 className="modal-title">{title || message}</h3>

                <p className="modal-description">
                    {description || t('deleteWarning') || 'This action cannot be undone.'}
                </p>

                <div className="modal-actions">
                    <button className="btn-secondary" onClick={onClose}>
                        {t('cancel')}
                    </button>
                    <button
                        className={`btn-primary ${isDanger ? 'danger-btn-modern' : 'bg-[#17cf54] hover:bg-[#17cf54]/90'}`}
                        onClick={onConfirm}
                    >
                        {confirmText || t('delete')}
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
}
