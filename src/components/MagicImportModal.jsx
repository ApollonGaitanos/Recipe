import React, { useState, useRef } from 'react';
import { X, Sparkles, Link, Image as ImageIcon, Camera } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { parseRecipe } from '../utils/recipeParser';
import { recognizeText } from '../utils/ocr';

export default function MagicImportModal({ isOpen, onClose, onImport }) {
    const { t } = useLanguage();
    const [urlValue, setUrlValue] = useState('');
    const [textValue, setTextValue] = useState('');
    const [useAI, setUseAI] = useState(false);
    const [isParsing, setIsParsing] = useState(false);
    const [scanProgress, setScanProgress] = useState(0);
    const fileInputRef = useRef(null);

    if (!isOpen) return null;

    const handleParse = async () => {
        const inputToUse = urlValue.trim() ? urlValue : textValue;
        if (!inputToUse.trim()) return;

        setIsParsing(true);
        try {
            const result = await parseRecipe(inputToUse, useAI);
            onImport(result);
            resetAndClose();
        } catch (error) {
            console.error("Magic Import Error:", error);
            alert(`Failed to parse recipe: ${error.message || 'Unknown error'}. Please try entering the text manually.`);
            setIsParsing(false);
        }
    };

    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Clear other inputs
        setUrlValue('');
        setTextValue('');
        setIsParsing(true);
        setScanProgress(0);

        try {
            if (useAI) {
                // AI Mode: Convert to Base64 and send directly
                setScanProgress(50); // Fake progress for conversion
                const base64 = await fileToBase64(file);
                const result = await parseRecipe({ imageBase64: base64, imageType: file.type || 'image/jpeg' }, true);
                onImport(result);
                resetAndClose();
            } else {
                // Local OCR Mode (Legacy)
                // 1. OCR Scan
                const text = await recognizeText(file, (progress) => {
                    setScanProgress(Math.round(progress * 100));
                });

                // 2. Parse the extracted text
                const result = await parseRecipe(text, false);
                onImport(result);
                resetAndClose();
            }
        } catch (error) {
            console.error("Image Import Failed:", error);
            alert("Could not process image. " + (error.message || "Please try a clearer photo."));
        } finally {
            setIsParsing(false);
            setScanProgress(0);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const fileToBase64 = (file) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => {
                // Remove the data URL prefix (e.g. "data:image/jpeg;base64,")
                const base64 = reader.result.split(',')[1];
                resolve(base64);
            };
            reader.onerror = error => reject(error);
        });
    };

    const resetAndClose = () => {
        setUrlValue('');
        setTextValue('');
        onClose();
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

                    {/* Option 1: URL */}
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
                                    if (e.target.value) setTextValue('');
                                }}
                                style={{ paddingLeft: '40px', width: '100%' }}
                                disabled={isParsing}
                            />
                        </div>
                    </div>

                    <div className="divider-or"><span>{t('magicImport.or')}</span></div>

                    {/* Option 2: Text */}
                    <div className="form-group" style={{ marginBottom: '15px' }}>
                        <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#444', marginBottom: '6px', display: 'block' }}>
                            {t('magicImport.labelText')}
                        </label>
                        <textarea
                            placeholder={t('magicImport.textPlaceholder')}
                            value={textValue}
                            onChange={e => {
                                setTextValue(e.target.value);
                                if (e.target.value) setUrlValue('');
                            }}
                            style={{ height: '80px', fontSize: '0.9rem', width: '100%' }}
                            disabled={isParsing}
                        />
                    </div>

                    <div className="divider-or"><span>{t('magicImport.or')}</span></div>

                    {/* Option 3: Image */}
                    <div className="form-group">
                        <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#444', marginBottom: '6px', display: 'block' }}>
                            {t('magicImport.labelImage')}
                        </label>
                        <input
                            type="file"
                            accept="image/*"
                            capture="environment"
                            ref={fileInputRef}
                            onChange={handleImageUpload}
                            style={{ display: 'none' }}
                            disabled={isParsing}
                        />
                        <button
                            type="button"
                            className="btn-secondary"
                            onClick={() => fileInputRef.current.click()}
                            disabled={isParsing}
                            style={{ width: '100%', justifyContent: 'center', gap: '10px', padding: '12px', borderStyle: 'dashed' }}
                        >
                            <Camera size={18} />
                            {t('magicImport.imageButton')}
                        </button>
                    </div>

                    {/* AI Toggle (for text and image only, not URL) */}
                    {!urlValue.trim() && (
                        <div style={{ marginTop: '20px', padding: '12px', background: '#fef3c7', borderRadius: '8px', border: '1px solid #fbbf24' }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontSize: '0.9rem' }}>
                                <input
                                    type="checkbox"
                                    checked={useAI}
                                    onChange={(e) => setUseAI(e.target.checked)}
                                    disabled={isParsing}
                                    style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                                />
                                <div>
                                    <div style={{ fontWeight: 600, color: '#92400e' }}>
                                        ✨ Use AI for better parsing
                                    </div>
                                    <div style={{ fontSize: '0.75rem', color: '#78350f', marginTop: '2px' }}>
                                        Works with messy text, handwriting, any format (~$0.01/use)
                                    </div>
                                </div>
                            </label>
                        </div>
                    )}

                    {/* Progress Bar for OCR */}
                    {isParsing && scanProgress > 0 && (
                        <div style={{ marginTop: '15px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '5px', color: '#c026d3', fontWeight: 500 }}>
                                <span>{t('magicImport.scanning')}</span>
                                <span>{scanProgress}%</span>
                            </div>
                            <div style={{ height: '6px', background: '#f5d0fe', borderRadius: '3px', overflow: 'hidden' }}>
                                <div style={{ height: '100%', background: '#d946ef', width: `${scanProgress}%`, transition: 'width 0.3s ease' }}></div>
                            </div>
                        </div>
                    )}


                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px', gap: '10px' }}>
                        <button type="button" className="btn-secondary" onClick={onClose} disabled={isParsing}>
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
                                <span>{scanProgress > 0 ? t('magicImport.scanning') : t('magicImport.parsing')}</span>
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
            <style jsx>{`
                .divider-or {
                    display: flex;
                    align-items: center;
                    margin: 15px 0;
                }
                .divider-or::before,
                .divider-or::after {
                    content: '';
                    flex: 1;
                    height: 1px;
                    background: #eee;
                }
                .divider-or span {
                    padding: 0 10px;
                    font-size: 0.8rem;
                    color: #999;
                    font-weight: 500;
                }
            `}</style>
        </div>
    );
}
