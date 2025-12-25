import React, { useEffect, useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { AlertTriangle, X } from 'lucide-react';

export default function ConfirmModal({ isOpen, onClose, onConfirm, message }) {
    const { t } = useLanguage();
    const [animate, setAnimate] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setAnimate(true);
        } else {
            setAnimate(false);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div className={`modal-overlay ${animate ? 'active' : ''}`} onClick={onClose}>
            <div className={`modal-content ${animate ? 'active' : ''}`} onClick={e => e.stopPropagation()}>

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
