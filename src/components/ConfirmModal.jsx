import React from 'react';
import { useLanguage } from '../context/LanguageContext';
import { AlertTriangle, X } from 'lucide-react';

export default function ConfirmModal({ isOpen, onClose, onConfirm, message }) {
    const { t } = useLanguage();
    // Simplified animation logic to avoid sync setState warning
    // If complex exit animation is needed, use a dedicated library or setTimeout


    if (!isOpen) return null;

    return (
        <div className={`modal-overlay ${isOpen ? 'active' : ''}`} onClick={onClose}>
            <div className={`modal-content ${isOpen ? 'active' : ''}`} onClick={e => e.stopPropagation()}>

                <button className="modal-close" onClick={onClose}>
                    <X size={20} />
                </button>

                <div className="modal-icon-container">
                    <AlertTriangle size={32} />
                </div>

                <h3 className="modal-title">{message}</h3>

                <p className="modal-description">
                    {t('deleteWarning') || 'This action cannot be undone.'}
                </p>

                <div className="modal-actions">
                    <button className="btn-secondary" onClick={onClose}>
                        {t('cancel')}
                    </button>
                    <button className="btn-primary danger-btn-modern" onClick={onConfirm}>
                        {t('delete')}
                    </button>
                </div>
            </div>
        </div>
    );
}
