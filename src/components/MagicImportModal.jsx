
import React, { useState, useRef } from 'react';
import { X, Sparkles, Image as ImageIcon, Camera, Link, FileText } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { parseRecipe } from '../utils/recipeParser';
import { recognizeText } from '../utils/ocr';

export default function MagicImportModal({ isOpen, onClose, onImport }) {
    const { t, language } = useLanguage();
    const [inputValue, setInputValue] = useState('');
    const [useAI, setUseAI] = useState(true); // Default to true based on user preference for AI
    const [isParsing, setIsParsing] = useState(false);
    const [scanProgress, setScanProgress] = useState(0);

    // Image State
    const [selectedImage, setSelectedImage] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);
    const fileInputRef = useRef(null);

    if (!isOpen) return null;

    const handleFileSelect = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Reset text input if image selected (optional, or keep both? User said "copy text from image and fill fields")
        // The prompt says "AI's job is to just analyze... (url or text)". 
        // If image is present, we prioritize image.

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

            if (selectedImage) {
                if (useAI) {
                    setScanProgress(20);
                    const base64 = await resizeImage(selectedImage);
                    // Pass language to AI to ensure correct target language
                    result = await parseRecipe({ imageBase64: base64, imageType: 'image/jpeg', text: inputValue }, true, language);
                } else {
                    // Legacy OCR
                    const text = await recognizeText(selectedImage, p => setScanProgress(Math.round(p * 100)));
                    // Combine OCR text with manual text if any?
                    const combinedText = (inputValue ? inputValue + '\n\n' : '') + text;
                    result = await parseRecipe(combinedText, false);
                }
            } else {
                // Text or URL
                result = await parseRecipe(inputValue, useAI, language);
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
        onClose();
    };

    const hasInput = inputValue.trim().length > 0 || selectedImage;

    return (
        <div className="modal-overlay active" onClick={onClose}>
            <div className="modal-content active" onClick={e => e.stopPropagation()}
                style={{
                    width: '90%',
                    maxWidth: '500px',
                    padding: '0',
                    overflow: 'hidden',
                    maxHeight: '90vh',
                    display: 'flex',
                    flexDirection: 'column'
                }}>

                {/* Header */}
                <div style={{ padding: '15px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f3f3f3' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div className="modal-icon-container" style={{ background: '#f5d0fe', color: '#c026d3', width: '36px', height: '36px', margin: 0 }}>
                            <Sparkles size={18} />
                        </div>
                        <h3 className="modal-title" style={{ margin: 0, fontSize: '1.1rem' }}>
                            {t('magicImport.title')}
                        </h3>
                    </div>
                    <button className="modal-close" onClick={onClose} style={{ position: 'static' }}>
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div style={{ padding: '20px', overflowY: 'auto' }}>

                    <p style={{ marginTop: 0, marginBottom: '20px', color: '#666', fontSize: '0.9rem', lineHeight: '1.4' }}>
                        {t('magicImport.description')}
                    </p>

                    {/* Unified Text Input */}
                    <div className="form-group" style={{ marginBottom: '15px' }}>
                        <div style={{ position: 'relative' }}>
                            <textarea
                                placeholder={t('magicImport.textPlaceholder') || "Paste recipe URL or text here..."}
                                value={inputValue}
                                onChange={e => setInputValue(e.target.value)}
                                style={{
                                    minHeight: '120px',
                                    fontSize: '0.95rem',
                                    width: '100%',
                                    padding: '12px',
                                    borderRadius: '12px',
                                    border: '1px solid #e5e7eb',
                                    resize: 'vertical'
                                }}
                                disabled={isParsing}
                            />
                            {/* Icon overlay hint? No, clean is better. */}
                        </div>
                    </div>

                    {/* Image Selection - Discreet Button */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        {/* Hidden File Input */}
                        <input
                            type="file"
                            accept="image/*"
                            ref={fileInputRef}
                            onChange={handleFileSelect}
                            style={{ display: 'none' }}
                            disabled={isParsing}
                        />

                        {/* Image Button */}
                        <button
                            type="button"
                            onClick={() => fileInputRef.current.click()}
                            disabled={isParsing}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                background: '#f9f9f9',
                                border: '1px solid #ddd',
                                padding: '8px 12px',
                                borderRadius: '8px',
                                color: '#555',
                                fontSize: '0.85rem',
                                cursor: 'pointer',
                                transition: 'all 0.2s'
                            }}
                        >
                            <ImageIcon size={16} />
                            <span>{t('magicImport.imageButton') || "Scan Image"}</span>
                        </button>
                    </div>

                    {/* Image Preview */}
                    {previewUrl && (
                        <div style={{ marginTop: '15px', position: 'relative', borderRadius: '12px', overflow: 'hidden', border: '1px solid #eee' }}>
                            <img
                                src={previewUrl}
                                alt="Preview"
                                style={{ width: '100%', maxHeight: '200px', objectFit: 'contain', background: '#f9f9f9', display: 'block' }}
                            />
                            <button
                                onClick={handleRemoveImage}
                                disabled={isParsing}
                                style={{
                                    position: 'absolute',
                                    top: '8px',
                                    right: '8px',
                                    background: 'rgba(0,0,0,0.6)',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '50%',
                                    width: '24px',
                                    height: '24px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    cursor: 'pointer'
                                }}
                            >
                                <X size={14} />
                            </button>
                        </div>
                    )}

                    {/* AI Toggle */}
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
                                    ✨ {t('magicImport.useAI') || "Use AI Extraction"}
                                </div>
                                <div style={{ fontSize: '0.75rem', color: '#78350f', marginTop: '2px' }}>
                                    {t('magicImport.aiHint') || "Precise extraction, no alterations."}
                                </div>
                            </div>
                        </label>
                    </div>

                    {/* Progress Bar */}
                    {isParsing && (
                        <div style={{ marginTop: '15px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '5px', color: '#c026d3', fontWeight: 500 }}>
                                <span>{isParsing ? "Analyzing..." : "Ready"}</span>
                                {scanProgress > 0 && <span>{scanProgress}%</span>}
                            </div>
                            <div style={{ height: '4px', background: '#f5d0fe', borderRadius: '2px', overflow: 'hidden' }}>
                                <div style={{ height: '100%', background: '#d946ef', width: scanProgress > 0 ? `${scanProgress}%` : '100%', transition: 'width 0.3s ease', animation: scanProgress === 0 ? 'pulse 1.5s infinite' : 'none' }} />
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div style={{ padding: '15px 20px', borderTop: '1px solid #f3f3f3', background: '#fff', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                    <button type="button" className="btn-secondary" onClick={onClose} disabled={isParsing}>
                        {t('cancel')}
                    </button>
                    <button
                        type="button"
                        className="btn-primary"
                        onClick={handleParse}
                        disabled={!hasInput || isParsing}
                        style={{ background: 'linear-gradient(135deg, #d946ef, #a855f7)', border: 'none', minWidth: '120px' }}
                    >
                        {isParsing ? "Processing..." : (
                            <>
                                <Sparkles size={18} />
                                {t('magicImport.button')}
                            </>
                        )}
                    </button>
                </div>
            </div>
            <style jsx>{`
                @keyframes pulse {
                    0% { opacity: 0.6; }
                    50% { opacity: 1; }
                    100% { opacity: 0.6; }
                }
            `}</style>
        </div>
    );
}
