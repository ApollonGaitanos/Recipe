import React, { useState } from 'react';
import { X, Globe, Sparkles, Check, ChevronRight } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export default function ActionModal({ isOpen, onClose, mode, onConfirm, isProcessing }) {
    const { t, language } = useLanguage();
    const [targetLang, setTargetLang] = useState(language === 'en' ? 'el' : 'en');

    if (!isOpen) return null;

    const handleConfirm = () => {
        onConfirm(mode === 'translate' ? targetLang : null);
    };

    const isTranslate = mode === 'translate';

    return (
        <div className="modal-overlay active" onClick={isProcessing ? null : onClose}>
            <div className="modal-content active" onClick={e => e.stopPropagation()}>

                {/* Header */}
                <div className="modal-header">
                    <div className="header-left">
                        <div className={`modal-icon-container-small ${isTranslate ? 'blue' : 'purple'}`}>
                            {isTranslate ? <Globe size={20} /> : <Sparkles size={20} />}
                        </div>
                        <h3 className="modal-title-small">
                            {isTranslate ? t('translate') : t('improve')}
                        </h3>
                    </div>
                    <button className="modal-close-btn" onClick={onClose} disabled={isProcessing}>
                        <X size={20} />
                    </button>
                </div>

                {/* Body */}
                <div className="modal-body">
                    {isTranslate ? (
                        <div className="language-selector">
                            <p className="modal-desc">Choose the target language for this recipe:</p>

                            <button
                                className={`lang-option ${targetLang === 'en' ? 'active' : ''}`}
                                onClick={() => setTargetLang('en')}
                            >
                                <span className="flag">🇬🇧</span>
                                <span className="lang-name">English</span>
                                {targetLang === 'en' && <Check size={18} className="check-icon" />}
                            </button>

                            <button
                                className={`lang-option ${targetLang === 'el' ? 'active' : ''}`}
                                onClick={() => setTargetLang('el')}
                            >
                                <span className="flag">🇬🇷</span>
                                <span className="lang-name">Ελληνικά</span>
                                {targetLang === 'el' && <Check size={18} className="check-icon" />}
                            </button>
                        </div>
                    ) : (
                        <div className="improve-content">
                            <div className="improve-feature">
                                <span className="bullet">✨</span>
                                <span>Fixes typos and formatting</span>
                            </div>
                            <div className="improve-feature">
                                <span className="bullet">📊</span>
                                <span>Standardizes measurements</span>
                            </div>
                            <div className="improve-feature">
                                <span className="bullet">📝</span>
                                <span>Clarifies instructions</span>
                            </div>
                            <p className="modal-note">This will update your current recipe.</p>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="modal-footer">
                    <button className="btn-secondary" onClick={onClose} disabled={isProcessing}>
                        {t('cancel')}
                    </button>
                    <button
                        className={`btn-primary ${isTranslate ? 'blue-btn' : 'purple-btn'}`}
                        onClick={handleConfirm}
                        disabled={isProcessing}
                    >
                        {isProcessing ? (
                            <span>Processing...</span>
                        ) : (
                            <>
                                {isTranslate ? "Translate Now" : "Enhance Recipe"}
                                <ChevronRight size={16} />
                            </>
                        )}
                    </button>
                </div>

            </div>

            <style jsx>{`
                .modal-content {
                    background: var(--color-surface);
                    width: 90%;
                    max-width: 400px; /* Compact width */
                    border-radius: var(--radius-lg);
                    box-shadow: var(--shadow-xl);
                    border: 1px solid var(--color-border);
                    display: flex;
                    flex-direction: column;
                    overflow: hidden;
                    animation: modalPop 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
                }

                @keyframes modalPop {
                    from { opacity: 0; transform: scale(0.95) translateY(10px); }
                    to { opacity: 1; transform: scale(1) translateY(0); }
                }

                .modal-header {
                    padding: 16px 20px;
                    border-bottom: 1px solid var(--color-border);
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    background: var(--color-surface);
                }

                .header-left {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                }

                .modal-icon-container-small {
                    width: 32px;
                    height: 32px;
                    border-radius: 8px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
                
                .modal-icon-container-small.blue {
                    background: #e0f2fe; color: #0284c7;
                }
                .modal-icon-container-small.purple {
                    background: #f3e8ff; color: #9333ea;
                }

                body.dark-mode .modal-icon-container-small.blue { background: rgba(14, 165, 233, 0.2); }
                body.dark-mode .modal-icon-container-small.purple { background: rgba(147, 51, 234, 0.2); }

                .modal-title-small {
                    font-size: 1.1rem;
                    font-weight: 700;
                    margin: 0;
                    color: var(--color-text);
                }

                .modal-close-btn {
                    color: var(--color-text-light);
                    background: transparent;
                    border: none;
                    padding: 4px;
                    border-radius: 50%;
                    cursor: pointer;
                }

                .modal-body {
                    padding: 24px;
                    color: var(--color-text);
                }

                .modal-desc {
                    margin-top: 0;
                    margin-bottom: 16px;
                    color: var(--color-text-light);
                    font-size: 0.95rem;
                }

                /* Language Options */
                .language-selector {
                    display: flex;
                    flex-direction: column;
                    gap: 10px;
                }

                .lang-option {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    padding: 12px 16px;
                    border: 2px solid var(--color-border);
                    border-radius: 12px;
                    background: var(--color-bg);
                    cursor: pointer;
                    transition: all 0.2s;
                    color: var(--color-text);
                    text-align: left;
                    font-size: 1rem;
                    font-weight: 500;
                    position: relative;
                }

                .lang-option:hover {
                    border-color: #0ea5e9;
                    background: var(--color-surface);
                }

                .lang-option.active {
                    border-color: #0ea5e9;
                    background: rgba(14, 165, 233, 0.05);
                    color: #0ea5e9;
                }

                .flag { font-size: 1.4rem; }
                .check-icon { margin-left: auto; color: #0ea5e9; }

                /* Improve Features */
                .improve-content {
                    display: flex;
                    flex-direction: column;
                    gap: 12px;
                }

                .improve-feature {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    padding: 8px 12px;
                    background: rgba(147, 51, 234, 0.05);
                    border-radius: 8px;
                    color: var(--color-text);
                    font-weight: 500;
                }

                .bullet { font-size: 1.2rem; }
                
                .modal-note {
                    font-size: 0.85rem;
                    color: var(--color-text-light);
                    text-align: center;
                    margin-top: 12px;
                    margin-bottom: 0;
                }

                /* Footer */
                .modal-footer {
                    padding: 16px 24px;
                    border-top: 1px solid var(--color-border);
                    display: flex;
                    justify-content: flex-end;
                    gap: 12px;
                    background: var(--color-surface);
                }

                .blue-btn {
                    background: #0ea5e9;
                    color: white;
                }
                
                .blue-btn:hover { background: #0284c7; }

                .purple-btn {
                    background: #9333ea;
                    color: white;
                }
                
                .purple-btn:hover { background: #7e22ce; }

            `}</style>
        </div>
    );
}
