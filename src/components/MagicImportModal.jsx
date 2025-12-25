import React, { useState } from 'react';
import { X, Sparkles, Globe, FileText, Link } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { parseRecipe } from '../utils/recipeParser';

export default function MagicImportModal({ isOpen, onClose, onImport }) {
    const { t } = useLanguage();
    const [activeTab, setActiveTab] = useState('url'); // 'url' or 'text'
    const [inputValue, setInputValue] = useState('');
    const [isParsing, setIsParsing] = useState(false);

    if (!isOpen) return null;

    const handleParse = async () => {
        setIsParsing(true);
        try {
            // parseRecipe handles both, but we can pass the specific input
            const result = await parseRecipe(inputValue);
            onImport(result);
            setInputValue('');
            onClose();
        } catch (error) {
            console.error(error);
        } finally {
            setIsParsing(false);
        }
    };

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

                {/* Tabs */}
                <div style={{ display: 'flex', borderBottom: '1px solid #eee', marginTop: '20px' }}>
                    <button
                        onClick={() => { setActiveTab('url'); setInputValue(''); }}
                        style={{
                            flex: 1,
                            padding: '12px',
                            background: activeTab === 'url' ? 'white' : '#f9fafb',
                            border: 'none',
                            borderBottom: activeTab === 'url' ? '2px solid #c026d3' : '2px solid transparent',
                            color: activeTab === 'url' ? '#c026d3' : '#666',
                            fontWeight: activeTab === 'url' ? '600' : '400',
                            cursor: 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
                        }}
                    >
                        <Globe size={18} /> {t('magicImport.tabUrl')}
                    </button>
                    <button
                        onClick={() => { setActiveTab('text'); setInputValue(''); }}
                        style={{
                            flex: 1,
                            padding: '12px',
                            background: activeTab === 'text' ? 'white' : '#f9fafb',
                            border: 'none',
                            borderBottom: activeTab === 'text' ? '2px solid #c026d3' : '2px solid transparent',
                            color: activeTab === 'text' ? '#c026d3' : '#666',
                            fontWeight: activeTab === 'text' ? '600' : '400',
                            cursor: 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
                        }}
                    >
                        <FileText size={18} /> {t('magicImport.tabText')}
                    </button>
                </div>

                {/* Content */}
                <div style={{ padding: '20px' }}>
                    {activeTab === 'url' ? (
                        <div className="form-group">
                            <div className="input-icon-wrapper" style={{ position: 'relative' }}>
                                <Link size={18} style={{ position: 'absolute', top: '14px', left: '12px', color: '#888' }} />
                                <input
                                    type="url"
                                    placeholder={t('magicImport.urlPlaceholder')}
                                    value={inputValue}
                                    onChange={e => setInputValue(e.target.value)}
                                    style={{ paddingLeft: '40px', width: '100%' }}
                                    autoFocus
                                />
                            </div>
                            <p style={{ fontSize: '0.8rem', color: '#888', marginTop: '8px' }}>
                                Supports extraction from most modern recipe websites.
                            </p>
                        </div>
                    ) : (
                        <div className="form-group">
                            <textarea
                                placeholder={t('magicImport.textPlaceholder')}
                                value={inputValue}
                                onChange={e => setInputValue(e.target.value)}
                                style={{ height: '150px', fontSize: '0.9rem', width: '100%' }}
                                autoFocus
                            />
                        </div>
                    )}

                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px', gap: '10px' }}>
                        <button type="button" className="btn-secondary" onClick={onClose}>
                            {t('cancel')}
                        </button>
                        <button
                            type="button"
                            className="btn-primary"
                            onClick={handleParse}
                            disabled={!inputValue.trim() || isParsing}
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
