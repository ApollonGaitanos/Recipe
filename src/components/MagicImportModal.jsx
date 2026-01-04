import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Sparkles, Image as ImageIcon, ArrowRight, FileText, ChefHat, Link } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { parseRecipe } from '../utils/recipeParser';

export default function MagicImportModal({ isOpen, onClose, onImport }) {
    const { t, language } = useLanguage();

    // --- State Management ---
    const [inputValue, setInputValue] = useState('');
    const [isParsing, setIsParsing] = useState(false);
    const [scanProgress, setScanProgress] = useState(0);
    const [mode, setMode] = useState('import'); // 'import' or 'create'

    const [error, setError] = useState(null);

    // Image State
    const [selectedImage, setSelectedImage] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);
    const fileInputRef = useRef(null);

    // --- Effects ---
    // Close on escape
    useEffect(() => {
        if (!isOpen) return;
        const handleEsc = (e) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [isOpen, onClose]);

    // Reset state when modal opens/closes
    useEffect(() => {
        if (!isOpen) {
            // Small delay to allow fade out if we were doing animations, but for now instant reset
            const timer = setTimeout(() => {
                setInputValue('');
                setPreviewUrl(null);
                setSelectedImage(null);
                setMode('import');
                setScanProgress(0);
                setIsParsing(false);
                setError(null);
            }, 200);
            return () => clearTimeout(timer);
        }
    }, [isOpen]);

    // --- Handlers ---
    const handleFileSelect = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const url = URL.createObjectURL(file);
        setPreviewUrl(url);
        setSelectedImage(file);
        setError(null);
    };

    const handleRemoveImage = (e) => {
        e?.stopPropagation();
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
        setError(null);

        try {
            let result;

            // Determine effective mode
            const activeMode = mode === 'create' ? 'create' : 'extract';

            if (selectedImage && activeMode === 'extract') {
                // Image Import
                setScanProgress(20);
                const base64 = await resizeImage(selectedImage);
                // Call parser with (input, language, mode)
                result = await parseRecipe({ imageBase64: base64, imageType: 'image/jpeg', text: inputValue, mode: 'extract' }, language, 'extract');
            } else {
                // Text/URL Import
                // Call parser with (input, language, mode)
                result = await parseRecipe(inputValue, language, activeMode);
            }

            onImport(result);
            onClose();

        } catch (error) {
            console.error("Magic Import Error:", error);
            setError(error.message || "An unexpected error occurred. Please try again.");
        } finally {
            setIsParsing(false);
            setScanProgress(0);
        }
    };

    if (!isOpen) return null;

    // Use Portal to render at document body level to avoid overflow/z-index issues
    return createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            />

            {/* Modal Content */}
            <div className="relative w-full max-w-[600px] bg-white dark:bg-surface-dark rounded-2xl shadow-2xl overflow-hidden flex flex-col border border-gray-200 dark:border-white/5 animate-in fade-in zoom-in-95 duration-200">

                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-[#dce5df] dark:border-[#2a4030] bg-white dark:bg-[#1a2c20]">
                    <div className="flex items-center gap-2">
                        {mode === 'create' ? <ChefHat size={20} className="text-[#17cf54]" /> : <Sparkles size={20} className="text-[#17cf54]" />}
                        <h3 className="text-lg font-bold text-[#111813] dark:text-[#e0e6e2]">
                            {mode === 'create' ? 'AI Chef' : 'Magic Import'}
                        </h3>
                    </div>

                    <div className="flex items-center gap-4">
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                        >
                            <X size={20} />
                        </button>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex px-6 border-b border-[#dce5df] dark:border-[#2a4030] bg-[#fcfdfc] dark:bg-[#15231a]">
                    <button
                        onClick={() => { setMode('import'); setError(null); }}
                        className={`py-3 px-1 mr-6 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${mode === 'import'
                            ? 'border-[#17cf54] text-[#111813] dark:text-[#e0e6e2]'
                            : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                            }`}
                    >
                        <Link size={16} />
                        Import
                    </button>
                    <button
                        onClick={() => { setMode('create'); setError(null); }}
                        className={`py-3 px-1 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${mode === 'create'
                            ? 'border-[#17cf54] text-[#111813] dark:text-[#e0e6e2]'
                            : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                            }`}
                    >
                        <ChefHat size={16} />
                        Create
                    </button>
                </div>


                {/* Content */}
                <div className="p-6 flex flex-col gap-4 bg-white dark:bg-[#1a2c20]">

                    {/* Error Message */}
                    {error && (
                        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl flex items-start gap-3">
                            <X size={20} className="text-red-500 dark:text-red-400 mt-0.5 shrink-0" />
                            <div className="flex-1">
                                <h4 className="text-sm font-bold text-red-700 dark:text-red-300 mb-1">Error processing request</h4>
                                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                            </div>
                        </div>
                    )}

                    {/* Source Input */}
                    <div className="flex flex-col gap-2">
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                            {mode === 'create' ? 'Details' : 'Source'}
                        </label>
                        <div className="relative">
                            <textarea
                                value={inputValue}
                                onChange={(e) => { setInputValue(e.target.value); if (error) setError(null); }}
                                placeholder={mode === 'create' ? "Describe the dish you want to create (e.g. 'A healthy vegetarian lasagna with spinach')..." : "Paste full recipe text or enter a website URL..."}
                                className={`w-full h-40 rounded-xl border p-4 text-base text-[#111813] dark:text-[#e0e6e2] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#17cf54] focus:border-transparent resize-none transition-all ${error
                                    ? 'border-red-300 dark:border-red-800 focus:ring-red-500'
                                    : 'border-[#dce5df] dark:border-[#2a4030]'
                                    } bg-white dark:bg-[#112116]`}
                            />
                            <div className="absolute bottom-4 right-4 text-gray-300 pointer-events-none">
                                <FileText size={20} />
                            </div>
                        </div>
                    </div>

                    {/* Image Upload (Only for Import) */}
                    {mode === 'import' && (
                        <>
                            <input
                                type="file"
                                accept="image/*"
                                ref={fileInputRef}
                                onChange={handleFileSelect}
                                className="hidden"
                            />

                            {!previewUrl ? (
                                <button
                                    onClick={() => fileInputRef.current?.click()}
                                    className="w-full py-4 border-2 border-dashed border-[#dce5df] dark:border-[#2a4030] rounded-xl flex items-center justify-center gap-2 text-gray-500 hover:bg-gray-50 dark:hover:bg-[#112116] hover:border-[#17cf54]/50 transition-all font-medium"
                                >
                                    <ImageIcon size={18} />
                                    Add Image (Optional)
                                </button>
                            ) : (
                                <div className="relative w-full h-32 rounded-xl overflow-hidden border border-[#dce5df] dark:border-[#2a4030] group">
                                    <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                        <button
                                            onClick={handleRemoveImage}
                                            className="bg-white/20 hover:bg-white/40 text-white p-2 rounded-full backdrop-blur-sm transition-colors"
                                        >
                                            <X size={18} />
                                        </button>
                                    </div>
                                </div>
                            )}
                        </>
                    )}

                    {/* Button */}
                    <button
                        onClick={handleParse}
                        disabled={isParsing || (!inputValue && !selectedImage)}
                        className={`mt-2 w-full py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 text-white shadow-lg shadow-green-500/20 transition-all ${isParsing || (!inputValue && !selectedImage)
                            ? 'bg-gray-300 dark:bg-gray-700 cursor-not-allowed shadow-none'
                            : 'bg-[#17cf54] hover:bg-[#15bd4d] hover:-translate-y-0.5'
                            }`}
                    >
                        {isParsing ? (
                            <span>{mode === 'create' ? 'Creating...' : 'Analyzing...'} {Math.round(scanProgress)}%</span>
                        ) : (
                            <>
                                {mode === 'create' ? 'Create Recipe' : 'Import Recipe'}
                                <ArrowRight size={18} />
                            </>
                        )}
                    </button>

                    <p className="text-center text-xs text-gray-400">
                        {mode === 'create'
                            ? 'AI Chef will generate a recipe based on your description.'
                            : 'Magic Import analyzes your source to extract ingredients and steps.'}
                    </p>
                </div>
            </div>
        </div>,
        document.body
    );
}
