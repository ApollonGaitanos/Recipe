import React from 'react';
import { createPortal } from 'react-dom';
import { useLanguage } from '../context/LanguageContext';
import { AlertTriangle, X } from 'lucide-react';

export default function ConfirmModal({ isOpen, onClose, onConfirm, message, title, description, confirmText, isDanger = true, Icon, showCancel = true }) {
    const { t } = useLanguage();

    if (!isOpen) return null;

    const DisplayIcon = Icon || AlertTriangle;

    return createPortal(
        <div className={`modal-overlay active z-[9999]`} onClick={onClose}>
            <div className={`modal-content active`} onClick={e => e.stopPropagation()}>

                <button className="modal-close" onClick={onClose}>
                    <X size={20} />
                </button>

                <div className={`mx-auto w-12 h-12 rounded-full flex items-center justify-center mb-4 ${isDanger ? 'bg-red-100 text-red-600 dark:bg-red-900/20 dark:text-red-400' : 'bg-primary/10 text-primary'}`}>
                    <DisplayIcon size={32} />
                </div>

                <h3 className="modal-title text-center text-xl font-bold mb-2 text-zinc-900 dark:text-white">{title || message}</h3>

                <p className="modal-description text-center text-zinc-500 dark:text-zinc-400 mb-6">
                    {description || t('deleteWarning') || 'This action cannot be undone.'}
                </p>

                <div className="modal-actions flex gap-3 justify-center w-full">
                    {showCancel && (
                        <button className="btn-secondary px-4 py-2 rounded-lg font-medium transition-colors" onClick={onClose}>
                            {t('cancel')}
                        </button>
                    )}
                    <button
                        className={`btn-primary px-4 py-2 rounded-lg font-bold transition-colors text-white ${isDanger ? 'bg-red-500 hover:bg-red-600 shadow-red-500/20' : 'bg-primary hover:opacity-90 shadow-primary/20'}`}
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
