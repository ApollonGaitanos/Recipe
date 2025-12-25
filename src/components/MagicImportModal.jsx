import React, { useState } from 'react';
import { X, Sparkles, Globe, FileText, Link } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { parseRecipe } from '../utils/recipeParser';

export default function MagicImportModal({ isOpen, onClose, onImport }) {
    const { t } = useLanguage();
    const [urlValue, setUrlValue] = useState('');
    const [textValue, setTextValue] = useState('');
    const [isParsing, setIsParsing] = useState(false);

    if (!isOpen) return null;

    const handleParse = async () => {
        const inputToUse = urlValue.trim() ? urlValue : textValue;
        if (!inputToUse.trim()) return;

        setIsParsing(true);
        try {
            const result = await parseRecipe(inputToUse);
            onImport(result);
            setUrlValue('');
            setTextValue('');
            onClose();
        } catch (error) {
            console.error(error);
        } finally {
            setIsParsing(false);
        }
    };

    const hasInput = urlValue.trim().length > 0 || textValue.trim().length > 0;

    return (
        <div className="modal-overlay active" onClick={onClose}>
            <div className="modal-content active" onClick={e => e.stopPropagation()} style={{ maxWidth: '600px', padding: '0', overflow: 'hidden' }}>

                {/* Header */}
                <div style={{ padding: '20px', paddingBottom: '0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div className="modal-icon-container" style={{ background: '#f5d0fe', color: '#c026d3', width: '40px', height: '40px', margin: 0 }}>
                            <Sparkles size={20} />
                        </div>
                        <h3 className="modal-title" style={{ margin: 0 }}>{t('magicImport.title')}</h3>
                    </div>
                    <button className="modal-close" onClick={onClose} style={{ position: 'static' }}>
                        <X size={20} />
                    </button>
                </div>

                <p style={{ padding: '0 20px', marginTop: '10px', color: '#666', fontSize: '0.95rem' }}>
                    {t('magicImport.description')}
                </p>

                {/* Content */}
                <div style={{ padding: '20px' }}>

                    {/* URL Input */}
                    <div className="form-group" style={{ marginBottom: '15px' }}>
                        <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#444', marginBottom: '6px', display: 'block' }}>
                            {t('magicImport.labelUrl')}
                        </label>
                        <div className="input-icon-wrapper" style={{ position: 'relative' }}>
                            <Link size={18} style={{ position: 'absolute', top: '12px', left: '12px', color: '#888' }} />
                            <input
                                type="url"
                                placeholder={t('magicImport.urlPlaceholder')}
                                value={urlValue}
                                onChange={e => {
                                    setUrlValue(e.target.value);
                                    if (e.target.value) setTextValue(''); // Clear text if URL is typed to avoid confusion
                                }}
                                style={{ paddingLeft: '40px', width: '100%' }}
                            />
                        </div>
                    </div>

                    {/* Divider */}
                    <div style={{ display: 'flex', alignItems: 'center', margin: '20px 0' }}>
                        <div style={{ flex: 1, height: '1px', background: '#eee' }}></div>
                        <span style={{ padding: '0 10px', fontSize: '0.8rem', color: '#888', fontWeight: 500 }}>
                            {t('magicImport.or')}
                        </span>
                        <div style={{ flex: 1, height: '1px', background: '#eee' }}></div>
                    </div>

                    {/* Text Input */}
                    <div className="form-group">
                        <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#444', marginBottom: '6px', display: 'block' }}>
                            {t('magicImport.labelText')}
                        </label>
                        <textarea
                            placeholder={t('magicImport.textPlaceholder')}
                            value={textValue}
                            onChange={e => {
                                setTextValue(e.target.value);
                                if (e.target.value) setUrlValue(''); // Clear URL if text is typed
                            }}
                            style={{ height: '120px', fontSize: '0.9rem', width: '100%' }}
                        />
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px', gap: '10px' }}>
                        <button type="button" className="btn-secondary" onClick={onClose}>
                            {t('cancel')}
                        </button>
                        <button
                            type="button"
                            className="btn-primary"
                            onClick={handleParse}
                            disabled={!hasInput || isParsing}
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
        </div>
    );
}
