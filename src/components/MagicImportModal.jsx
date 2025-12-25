import React, { useState } from 'react';
import { X, Sparkles, Clipboard } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { parseRecipe } from '../utils/recipeParser';

export default function MagicImportModal({ isOpen, onClose, onImport }) {
    const { t } = useLanguage();
    const [text, setText] = useState('');
    const [isParsing, setIsParsing] = useState(false);

    if (!isOpen) return null;

    const handleParse = async () => {
        setIsParsing(true);
        try {
            const result = await parseRecipe(text);
            onImport(result);
            setText('');
            onClose();
        } catch (error) {
            console.error(error);
            // Optionally set error message state here
        } finally {
            setIsParsing(false);
        }
    };

    return (
        <div className="modal-overlay active" onClick={onClose}>
            <div className="modal-content active" onClick={e => e.stopPropagation()} style={{ maxWidth: '600px' }}>
                <button className="modal-close" onClick={onClose}>
                    <X size={20} />
                </button>

                <div className="modal-icon-container" style={{ background: '#f5d0fe', color: '#c026d3' }}>
                    <Sparkles size={32} />
                </div>

                <h3 className="modal-title">{t('magicImport.title')}</h3>
                <p style={{ textAlign: 'center', color: '#666', marginBottom: '20px', fontSize: '0.95rem' }}>
                    {t('magicImport.description')}
                </p>

                <div className="form-group">
                    <textarea
                        placeholder={t('magicImport.placeholder')}
                        value={text}
                        onChange={e => setText(e.target.value)}
                        style={{ height: '200px', fontSize: '0.9rem' }}
                    />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                    <button type="button" className="btn-secondary" onClick={onClose}>
                        {t('cancel')}
                    </button>
                    <button
                        type="button"
                        className="btn-primary"
                        onClick={handleParse}
                        disabled={!text.trim() || isParsing}
                        style={{ background: 'linear-gradient(135deg, #d946ef, #a855f7)', border: 'none' }}
                    >
                        {isParsing ? (
                            <span>{t('magicImport.parsing')}</span>
                        ) : (
                            <>
                                <Sparkles size={18} />
                                {t('magicImport.button')}
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
