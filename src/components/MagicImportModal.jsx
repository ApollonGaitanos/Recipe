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

    // Image State
    const [selectedImage, setSelectedImage] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);
    const fileInputRef = useRef(null);

    if (!isOpen) return null;

    const handleFileSelect = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Reset other inputs
        setUrlValue('');
        setTextValue('');

        // Create Preview
        const url = URL.createObjectURL(file);
        setPreviewUrl(url);
        setSelectedImage(file);
    };

    const handleRemoveImage = () => {
        setPreviewUrl(null);
        setSelectedImage(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleParse = async () => {
        setIsParsing(true);
        setScanProgress(0);

        try {
            // Priority 1: Image
            if (selectedImage) {
                if (useAI) {
                    setScanProgress(10); // Start
                    // Resize and convert to Base64
                    const base64 = await resizeImage(selectedImage);

                    // DEBUG: Log payload size
                    const sizeInBytes = (base64.length * 3) / 4;
                    const sizeInMB = sizeInBytes / (1024 * 1024);
                    console.log(`📸 Image Payload: ~${sizeInMB.toFixed(2)}MB`);

                    if (sizeInMB > 5.5) {
                        alert("Image is still too large even after resizing. Please try a smaller photo.");
                        throw new Error("Payload too large");
                    }

                    setScanProgress(40); // Uploading
                    const result = await parseRecipe({ imageBase64: base64, imageType: 'image/jpeg' }, true);
                    onImport(result);
                    resetAndClose();
                } else {
                    // Legacy OCR
                    const text = await recognizeText(selectedImage, p => setScanProgress(Math.round(p * 100)));
                    const result = await parseRecipe(text, false);
                    onImport(result);
                    resetAndClose();
                }
                return;
            }

            // Priority 2: Text/URL
            const inputToUse = urlValue.trim() ? urlValue : textValue;
            if (!inputToUse.trim()) return;

            const result = await parseRecipe(inputToUse, useAI);
            onImport(result);
            resetAndClose();

        } catch (error) {
            console.error("Magic Import Error:", error);
            // Enhanced error display for mobile debugging
            const errorMsg = error.message || JSON.stringify(error, Object.getOwnPropertyNames(error));
            alert(`Failed to parse: ${errorMsg}`);
            setIsParsing(false);
            setScanProgress(0);
        }
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

                    // Export as JPEG with 0.6 quality (Aggressive optimization)
                    const dataUrl = canvas.toDataURL('image/jpeg', 0.6);
                    // Remove prefix
                    resolve(dataUrl.split(',')[1]);
                };
                img.onerror = (err) => reject(new Error("Failed to load image for resizing"));
            };
            reader.onerror = (error) => reject(error);
        });
    };

    const resetAndClose = () => {
        setUrlValue('');
        setTextValue('');
        setPreviewUrl(null);
        setSelectedImage(null);
        onClose();
    };

    const hasInput = urlValue.trim().length > 0 || textValue.trim().length > 0 || selectedImage;

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
                            {t('magicImport.title')} <span style={{ fontSize: '0.8rem', opacity: 0.7, fontWeight: 'normal' }}>(v1.1 Beta)</span>
                        </h3>
                    </div>
                    <button className="modal-close" onClick={onClose} style={{ position: 'static' }}>
                        <X size={20} />
                    </button>
                </div>

                {/* Content - Scrollable */}
                <div style={{ padding: '20px', overflowY: 'auto' }}>

                    <p style={{ marginTop: 0, marginBottom: '20px', color: '#666', fontSize: '0.9rem', lineHeight: '1.4' }}>
                        {t('magicImport.description')}
                    </p>

                    {/* Image Selection Area */}
                    <div className="form-group" style={{ marginBottom: '20px' }}>
                        <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#444', marginBottom: '8px', display: 'block' }}>
                            {t('magicImport.labelImage')}
                        </label>

                        {!previewUrl ? (
                            <div
                                onClick={() => fileInputRef.current.click()}
                                style={{
                                    border: '2px dashed #ddd',
                                    borderRadius: '12px',
                                    padding: '30px',
                                    textAlign: 'center',
                                    cursor: 'pointer',
                                    background: '#fafafa',
                                    transition: 'all 0.2s ease'
                                }}
                            >
                                <input
                                    type="file"
                                    accept="image/*"
                                    ref={fileInputRef}
                                    onChange={handleFileSelect}
                                    style={{ display: 'none' }}
                                    disabled={isParsing}
                                />
                                <div style={{ color: '#c026d3', marginBottom: '8px', display: 'flex', justifyContent: 'center' }}>
                                    <ImageIcon size={32} />
                                </div>
                                <div style={{ fontWeight: 600, color: '#555', marginBottom: '4px' }}>
                                    {t('magicImport.selectImage') || "Select Image"}
                                </div>
                                <div style={{ fontSize: '0.8rem', color: '#999' }}>
                                    Tap to choose from Gallery or Camera
                                </div>
                            </div>
                        ) : (
                            <div style={{ position: 'relative', borderRadius: '12px', overflow: 'hidden', border: '1px solid #eee' }}>
                                <img
                                    src={previewUrl}
                                    alt="Preview"
                                    style={{ width: '100%', maxHeight: '250px', objectFit: 'contain', background: '#f9f9f9', display: 'block' }}
                                />
                                <button
                                    onClick={handleRemoveImage}
                                    disabled={isParsing}
                                    style={{
                                        position: 'absolute',
                                        top: '10px',
                                        right: '10px',
                                        background: 'rgba(0,0,0,0.6)',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '50%',
                                        width: '30px',
                                        height: '30px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        cursor: 'pointer'
                                    }}
                                >
                                    <X size={16} />
                                </button>
                                <div style={{ padding: '8px 12px', background: '#eef2ff', color: '#4338ca', fontSize: '0.85rem', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <Sparkles size={14} />
                                    Ready to scan!
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="divider-or"><span>{t('magicImport.or')}</span></div>

                    {/* URL Input */}
                    <div className="form-group" style={{ marginBottom: '15px' }}>
                        <div className="input-icon-wrapper" style={{ position: 'relative' }}>
                            <Link size={16} style={{ position: 'absolute', top: '12px', left: '12px', color: '#aaa' }} />
                            <input
                                type="url"
                                placeholder={t('magicImport.urlPlaceholder')}
                                value={urlValue}
                                onChange={e => {
                                    setUrlValue(e.target.value);
                                    if (e.target.value) { setTextValue(''); handleRemoveImage(); }
                                }}
                                style={{ paddingLeft: '36px', width: '100%', fontSize: '0.9rem', padding: '10px 10px 10px 36px' }}
                                disabled={isParsing}
                            />
                        </div>
                    </div>

                    {/* Text Input */}
                    <div className="form-group">
                        <textarea
                            placeholder={t('magicImport.textPlaceholder')}
                            value={textValue}
                            onChange={e => {
                                setTextValue(e.target.value);
                                if (e.target.value) { setUrlValue(''); handleRemoveImage(); }
                            }}
                            style={{ height: '70px', fontSize: '0.9rem', width: '100%', padding: '10px' }}
                            disabled={isParsing}
                        />
                    </div>

                    {/* AI Toggle */}
                    {true && (
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
                                        Recommended for images & messy text
                                    </div>
                                </div>
                            </label>
                        </div>
                    )}

                    {/* Progress Bar */}
                    {isParsing && scanProgress > 0 && (
                        <div style={{ marginTop: '15px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '5px', color: '#c026d3', fontWeight: 500 }}>
                                <span>{selectedImage ? "Processing Image..." : "Thinking..."}</span>
                                <span>{scanProgress}%</span>
                            </div>
                            <div style={{ height: '6px', background: '#f5d0fe', borderRadius: '3px', overflow: 'hidden' }}>
                                <div style={{ height: '100%', background: '#d946ef', width: `${scanProgress}%`, transition: 'width 0.3s ease' }}></div>
                            </div>
                        </div>
                    )}

                </div>

                {/* Footer - Fixed at bottom */}
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
                        {isParsing ? (
                            <span>Processing...</span>
                        ) : (
                            <>
                                <Sparkles size={18} />
                                {selectedImage ? "Scan Recipe" : t('magicImport.button')}
                            </>
                        )}
                    </button>
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
