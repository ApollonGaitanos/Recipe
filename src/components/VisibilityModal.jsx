import React from 'react';
import { createPortal } from 'react-dom';
import { Lock, Globe, X } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export default function VisibilityModal({ isOpen, onClose, onConfirm, isMakingPublic }) {
    const { t } = useLanguage();

    if (!isOpen) return null;

    return createPortal(
        <div className="modal-overlay active z-[9999]" onClick={onClose}>
            <div className="modal-content active confirmation-modal" onClick={e => e.stopPropagation()}>
                <div style={{
                    width: '60px',
                    height: '60px',
                    borderRadius: '50%',
                    background: isMakingPublic ? '#dbeafe' : '#fef3c7',
                    color: isMakingPublic ? '#2563eb' : '#d97706',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 20px auto'
                }}>
                    {isMakingPublic ? <Globe size={32} /> : <Lock size={32} />}
                </div>

                <h3 className="modal-title" style={{ textAlign: 'center', marginBottom: '10px' }}>
                    {isMakingPublic ? t('visibility.makePublic') : t('visibility.makePrivate')}
                </h3>

                <p style={{ textAlign: 'center', color: '#666', marginBottom: '25px', lineHeight: '1.5' }}>
                    {isMakingPublic ? t('visibility.confirmPublic') : t('visibility.confirmPrivate')}
                </p>

                <div className="modal-actions">
                    <button className="btn-secondary" onClick={onClose}>
                        {t('cancel')}
                    </button>
                    <button
                        className="btn-primary"
                        onClick={() => { onConfirm(); onClose(); }}
                        style={{
                            background: isMakingPublic ? '#2563eb' : '#d97706',
                            borderColor: 'transparent'
                        }}
                    >
                        {isMakingPublic ? t('visibility.makePublic') : t('visibility.makePrivate')}
                    </button>
                </div>
            </div>
        </div>

        document.body
    );
}
