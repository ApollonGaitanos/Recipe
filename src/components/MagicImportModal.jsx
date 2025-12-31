
import React, { useState, useRef } from 'react';
import { X, Sparkles, Image as ImageIcon, Camera, ChefHat, Link } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { parseRecipe } from '../utils/recipeParser';
import { recognizeText } from '../utils/ocr';

export default function MagicImportModal({ isOpen, onClose, onImport }) {
    const { t, language } = useLanguage();
    const [inputValue, setInputValue] = useState('');
    const [aiMode, setAiMode] = useState('hybrid'); // 'off', 'hybrid', 'on'
    const [isParsing, setIsParsing] = useState(false);
    const [scanProgress, setScanProgress] = useState(0);
    const [mode, setMode] = useState('import'); // 'import' or 'create'

    // Image State
    const [selectedImage, setSelectedImage] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);
    const fileInputRef = useRef(null);

    if (!isOpen) return null;

    const handleFileSelect = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const url = URL.createObjectURL(file);
        setPreviewUrl(url);
        setSelectedImage(file);
    };

    const handleRemoveImage = () => {
        setPreviewUrl(null);
        setSelectedImage(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const resizeImage = (file) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = (event) => {
                const img = new Image();
                img.src = event.target.result;
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    const MAX_WIDTH = 800;
                    const MAX_HEIGHT = 800;
                    let width = img.width;
                    let height = img.height;

                    if (width > height) {
                        if (width > MAX_WIDTH) {
                            height *= MAX_WIDTH / width;
                            width = MAX_WIDTH;
                        }
                    } else {
                        if (height > MAX_HEIGHT) {
                            width *= MAX_HEIGHT / height;
                            height = MAX_HEIGHT;
                        }
                    }

                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, width, height);
                    const dataUrl = canvas.toDataURL('image/jpeg', 0.6);
                    resolve(dataUrl.split(',')[1]);
                };
                img.onerror = () => reject(new Error("Failed to load image"));
            };
            reader.onerror = reject;
        });
    };

    const handleParse = async () => {
        if (!inputValue.trim() && !selectedImage) return;

        setIsParsing(true);
        setScanProgress(0);

        try {
            let result;

            // Determine effective mode and AI usage
            const activeMode = mode === 'create' ? 'create' : 'extract';
            // If Create, Force AI. If Import, use selected AI Mode.
            const effectiveAiMode = mode === 'create' ? 'on' : aiMode;

            if (selectedImage && activeMode === 'extract') {
                if (effectiveAiMode !== 'off') { // Hybrid or On uses AI for images
                    setScanProgress(20);
                    const base64 = await resizeImage(selectedImage);
                    result = await parseRecipe({ imageBase64: base64, imageType: 'image/jpeg', text: inputValue, mode: 'extract' }, true, language);
                } else {
                    const text = await recognizeText(selectedImage, p => setScanProgress(Math.round(p * 100)));
                    const combinedText = (inputValue ? inputValue + '\n\n' : '') + text;
                    result = await parseRecipe(combinedText, false);
                }
            } else {
                // Pass aiMode string to parser instead of boolean
                result = await parseRecipe(inputValue, effectiveAiMode, language, activeMode);
            }

            onImport(result);
            resetAndClose();

        } catch (error) {
            console.error("Magic Import Error:", error);
            const errorMsg = error.message || JSON.stringify(error);
            alert(`Failed to parse: ${errorMsg}`);
        } finally {
            setIsParsing(false);
            setScanProgress(0);
        }
    };

    const resetAndClose = () => {
        setInputValue('');
        setPreviewUrl(null);
        setSelectedImage(null);
        setMode('import');
        onClose();
    };

    const hasInput = inputValue.trim().length > 0 || selectedImage;

    return (
        <div className="modal-overlay active" onClick={onClose}>
            <div className="modal-content-wide active" onClick={e => e.stopPropagation()}>

                {/* Header */}
                <div className="modal-header">
                    <div className="header-left">
                        <div className="modal-icon-container-small">
                            {mode === 'create' ? <ChefHat size={20} strokeWidth={2} /> : <Sparkles size={20} strokeWidth={2} />}
                        </div>
                        <h3 className="modal-title-small">
                            {t('magicImport.title')}
                        </h3>
                    </div>

                    {/* AI Mode Selector */}
                    <div className="header-right">
                        {mode === 'import' && (
                            <div className="ai-toggle-wrapper">
                                <div className="toggle-text">
                                    <span className="toggle-title">{t('magicImport.aiModeTitle')}</span>
                                    <span className="toggle-cost">
                                        {aiMode === 'off' ? t('magicImport.aiModeFree') : (aiMode === 'hybrid' ? t('magicImport.aiModeSmart') : '0.01€')}
                                    </span>
                                </div>
                                <div className="mode-selector">
                                    <button
                                        className={`selector-btn ${aiMode === 'off' ? 'active' : ''}`}
                                        onClick={() => setAiMode('off')}
                                        title={t('magicImport.tooltips.off')}
                                    >
                                        Off
                                    </button>
                                    <button
                                        className={`selector-btn ${aiMode === 'hybrid' ? 'active' : ''}`}
                                        onClick={() => setAiMode('hybrid')}
                                        title={t('magicImport.tooltips.hybrid')}
                                    >
                                        Hybrid
                                    </button>
                                    <button
                                        className={`selector-btn ${aiMode === 'on' ? 'active' : ''}`}
                                        onClick={() => setAiMode('on')}
                                        title={t('magicImport.tooltips.on')}
                                    >
                                        On
                                    </button>
                                </div>
                            </div>
                        )}
                        <button className="modal-close-btn" onClick={onClose}>
                            <X size={20} />
                        </button>
                    </div>
                </div>

                {/* Mode Tabs */}
                <div className="mode-tabs">
                    <button
                        className={`mode-tab ${mode === 'import' ? 'active' : ''}`}
                        onClick={() => setMode('import')}
                    >
                        <Link size={16} />
                        {t('magicImport.modeImport')}
                    </button>
                    <button
                        className={`mode-tab ${mode === 'create' ? 'active' : ''}`}
                        onClick={() => setMode('create')}
                    >
                        <ChefHat size={16} />
                        {t('magicImport.modeCreate')}
                    </button>
                </div>

                {/* Content Body - Responsive Grid */}
                <div className="modal-body">

                    {/* Left/Top: Text Input */}
                    <div className="input-section">
                        <p className="section-desc">
                            {mode === 'create'
                                ? t('magicImport.placeholderCreate')
                                : t('magicImport.description')
                            }
                        </p>
                        <textarea
                            className={`magic-textarea ${mode === 'create' ? 'creative' : ''}`}
                            placeholder={mode === 'create' ? t('magicImport.placeholderCreate') : t('magicImport.textPlaceholder')}
                            value={inputValue}
                            onChange={e => setInputValue(e.target.value)}
                            disabled={isParsing}
                        />

                        {/* Image Button / Preview - ONLY IN IMPORT MODE */}
                        {mode === 'import' && (
                            <div className="image-section">
                                <input
                                    type="file"
                                    accept="image/*"
                                    ref={fileInputRef}
                                    onChange={handleFileSelect}
                                    style={{ display: 'none' }}
                                    disabled={isParsing}
                                />

                                {!previewUrl ? (
                                    <button
                                        type="button"
                                        className={`image-select-btn ${selectedImage ? 'active' : ''}`}
                                        onClick={() => fileInputRef.current.click()}
                                        disabled={isParsing}
                                    >
                                        <ImageIcon size={18} />
                                        <span>{t('magicImport.imageButton') || t('magicImport.addImage')}</span>
                                    </button>
                                ) : (
                                    <div className="image-preview-wrapper">
                                        <img src={previewUrl} alt="Preview" />
                                        <button onClick={handleRemoveImage} className="remove-image-btn">
                                            <X size={14} />
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Progress Bar (Full Width if Active) */}
                    {isParsing && (
                        <div className="progress-section">
                            <div className="progress-status">
                                <span>{isParsing ? t('magicImport.parsing') : t('magicImport.ready')}</span>
                                {scanProgress > 0 && <span>{scanProgress}%</span>}
                            </div>
                            <div className="progress-bar-bg">
                                <div className="progress-bar-fill" style={{ width: scanProgress > 0 ? `${scanProgress}%` : '100%' }} />
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="modal-footer">
                    <button type="button" className="btn-secondary" onClick={onClose} disabled={isParsing}>
                        {t('cancel')}
                    </button>
                    <button
                        type="button"
                        className="btn-primary"
                        onClick={handleParse}
                        disabled={!hasInput || isParsing}
                    >
                        {isParsing ? (
                            <span>{t('magicImport.parsing')}</span>
                        ) : (
                            <>
                                {mode === 'create' ? <ChefHat size={18} /> : <Sparkles size={18} />}
                                {mode === 'create' ? t('magicImport.btnCreate') : t('magicImport.button')}
                            </>
                        )}
                    </button>
                </div>

            </div>

            <style jsx>{`
                /* Container Styles */
                .modal-content-wide {
                    background: var(--color-surface); /* Dark mode compatible */
                    width: 90%;
                    max-width: 800px; /* Use more real estate */
                    border-radius: var(--radius-lg);
                    box-shadow: var(--shadow-md);
                    border: 1px solid var(--color-border);
                    display: flex;
                    flex-direction: column;
                    overflow: hidden;
                    max-height: 90vh;
                    animation: modalPop 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
                }

                @keyframes modalPop {
                    from { opacity: 0; transform: scale(0.95) translateY(10px); }
                    to { opacity: 1; transform: scale(1) translateY(0); }
                }

                /* Header */
                .modal-header {
                    padding: 16px 24px;
                    border-bottom: 1px solid var(--color-border);
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    background: var(--color-surface);
                }
                
                .header-right {
                    display: flex;
                    align-items: center;
                    gap: 16px;
                }

                .header-left {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                }

                .modal-icon-container-small {
                    width: 32px;
                    height: 32px;
                    background: #fdf2f8; 
                    color: #db2777;
                    border-radius: 8px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
                
                body.dark-mode .modal-icon-container-small {
                     background: rgba(219, 39, 119, 0.2);
                }

                .modal-title-small {
                    font-size: 1.1rem;
                    font-weight: 700;
                    color: var(--color-text);
                    margin: 0;
                }
                
                /* Tabs */
                .mode-tabs {
                    display: flex;
                    padding: 0 24px;
                    border-bottom: 1px solid var(--color-border);
                    background: var(--color-bg); 
                }
                
                .mode-tab {
                    flex: 1;
                    padding: 12px;
                    font-weight: 600;
                    color: var(--color-text-light);
                    border-bottom: 2px solid transparent;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 8px;
                    transition: all 0.2s;
                }
                
                .mode-tab:hover {
                    background: var(--color-surface);
                    color: var(--color-text);
                }
                
                .mode-tab.active {
                    color: var(--color-primary);
                    border-bottom-color: var(--color-primary);
                    background: var(--color-surface);
                }

                /* AI Toggle */
                .ai-toggle-wrapper {
                    display: flex;
                    align-items: center;
                    gap: 16px;
                }
                
                .toggle-label {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    cursor: pointer;
                    background: rgba(var(--color-primary-rgb), 0.05); /* subtle bg */
                    padding: 4px 8px;
                    border-radius: 8px;
                }

                .toggle-text {
                    display: flex;
                    flex-direction: column;
                    align-items: flex-end;
                    line-height: 1.1;
                }

                .toggle-title {
                    font-size: 0.85rem;
                    font-weight: 700;
                    color: var(--color-primary);
                }

                .toggle-cost {
                    font-size: 0.65rem;
                    color: var(--color-text-light);
                    opacity: 0.8;
                }

                .mode-selector {
                    display: flex;
                    background: var(--color-bg);
                    padding: 2px;
                    border-radius: 8px;
                    border: 1px solid var(--color-border);
                }

                .selector-btn {
                    padding: 4px 12px;
                    font-size: 0.8rem;
                    font-weight: 600;
                    color: var(--color-text-light);
                    background: transparent;
                    border: none;
                    border-radius: 6px;
                    cursor: pointer;
                    transition: all 0.2s;
                }

                .selector-btn:hover {
                    color: var(--color-text);
                }

                .selector-btn.active {
                    background: var(--color-surface);
                    color: var(--color-primary);
                    box-shadow: 0 1px 2px rgba(0,0,0,0.1);
                }
                
                body.dark-mode .selector-btn.active {
                     background: #333;
                }

                .modal-close-btn {
                    color: var(--color-text-light);
                    padding: 4px;
                    border-radius: 50%;
                    transition: all 0.2s;
                    display: flex;
                }
                
                .modal-close-btn:hover {
                    background: rgba(0,0,0,0.05);
                    color: var(--color-text);
                }
                
                body.dark-mode .modal-close-btn:hover {
                    background: rgba(255,255,255,0.1);
                }

                /* Body */
                .modal-body {
                    padding: 24px;
                    overflow-y: auto;
                    display: flex;
                    flex-direction: column;
                    gap: 20px;
                    flex: 1;
                }
                
                .section-desc {
                    margin-top: 0;
                    margin-bottom: 12px;
                    color: var(--color-text-light);
                    font-size: 0.95rem;
                }

                .magic-textarea {
                    width: 100%;
                    min-height: 200px; /* Taller by default */
                    padding: 16px;
                    border-radius: var(--radius-md);
                    border: 1px solid var(--color-border);
                    background: var(--color-bg); /* Use theme bg for input */
                    color: var(--color-text);
                    font-size: 1rem;
                    resize: vertical;
                    transition: border-color 0.2s;
                }
                
                .magic-textarea.creative {
                    min-height: 150px;
                    font-size: 1.1rem; /* Larger font for ideas */
                }
                
                .magic-textarea:focus {
                    border-color: var(--color-primary);
                    outline: none;
                }

                /* Image Section */
                .image-section {
                    margin-top: 12px;
                    display: flex;
                    align-items: center;
                }
                
                .image-select-btn {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    padding: 8px 16px;
                    border-radius: var(--radius-md);
                    border: 1px solid var(--color-border);
                    background: var(--color-bg);
                    color: var(--color-text);
                    font-size: 0.9rem;
                    font-weight: 500;
                    cursor: pointer;
                    transition: all 0.2s;
                }
                
                .image-select-btn:hover {
                    border-color: var(--color-text-light);
                    background: var(--color-surface);
                }
                
                .image-preview-wrapper {
                    position: relative;
                    border-radius: var(--radius-md);
                    overflow: hidden;
                    border: 1px solid var(--color-border);
                    display: inline-block;
                }
                
                .image-preview-wrapper img {
                    height: 80px;
                    width: auto;
                    display: block;
                    object-fit: cover;
                }
                
                .remove-image-btn {
                    position: absolute;
                    top: 4px;
                    right: 4px;
                    background: rgba(0,0,0,0.6);
                    color: white;
                    border-radius: 50%;
                    width: 20px;
                    height: 20px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                /* Progress */
                .progress-section {
                    margin-top: auto;
                }
                
                .progress-status {
                    display: flex;
                    justify-content: space-between;
                    font-size: 0.85rem;
                    color: var(--color-primary);
                    font-weight: 600;
                    margin-bottom: 6px;
                }
                
                .progress-bar-bg {
                    height: 6px;
                    background: rgba(var(--color-primary-rgb), 0.1); /* Fallback or variable */
                    background: #f3f3f3;
                    border-radius: 3px;
                    overflow: hidden;
                }
                
                body.dark-mode .progress-bar-bg {
                    background: #333;
                }
                
                .progress-bar-fill {
                    height: 100%;
                    background: var(--color-primary);
                    transition: width 0.3s ease;
                }

                /* Footer */
                .modal-footer {
                    padding: 16px 24px;
                    border-top: 1px solid var(--color-border);
                    background: var(--color-surface); /* Important for Dark Mode */
                    display: flex;
                    justify-content: flex-end; /* Right aligned actions */
                    gap: 12px;
                }
                
                /* Mobile Responsiveness */
                @media (max-width: 600px) {
                    .modal-content-wide {
                        width: 100%;
                        height: 100%;
                        max-height: 100%;
                        border-radius: 0;
                    }
                    
                    .modal-header {
                        padding: 12px 16px;
                    }
                    
                    .modal-body {
                        padding: 16px;
                    }
                    
                    .toggle-text {
                         /* Hide text labels on small screens if needed, or stack */
                         /* Keep for now */
                    }
                }
            `}</style>
        </div>
    );
}
