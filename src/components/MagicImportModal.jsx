import React, { useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, Sparkles, Image as ImageIcon, Zap, Brain, ArrowRight, FileText } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { parseRecipe } from '../utils/recipeParser';
import { recognizeText } from '../utils/ocr';

export default function MagicImportModal({ isOpen, onClose, onImport }) {
    const { t, language } = useLanguage();
    const [inputValue, setInputValue] = useState('');
    const [aiMode, setAiMode] = useState('hybrid'); // 'off', 'hybrid', 'on'
    const [isParsing, setIsParsing] = useState(false);
    const [scanProgress, setScanProgress] = useState(0);
    const [activeTab, setActiveTab] = useState('import'); // 'import' | 'chef'

    const [selectedImage, setSelectedImage] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);
    const fileInputRef = useRef(null);

    // Close on escape
    React.useEffect(() => {
        const handleEsc = (e) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [onClose]);

    if (!isOpen) return null;

    const handleFileSelect = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const url = URL.createObjectURL(file);
        setPreviewUrl(url);
        setSelectedImage(file);
    };

    const handleRemoveImage = (e) => {
        e.stopPropagation();
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
            const activeMode = activeTab === 'chef' ? 'create' : 'extract';
            // Force AI if in 'chef' (create) mode, otherwise use toggle
            const effectiveAiMode = activeTab === 'chef' ? 'on' : aiMode;

            if (selectedImage && activeMode === 'extract') {
                if (effectiveAiMode !== 'off') {
                    setScanProgress(20);
                    const base64 = await resizeImage(selectedImage);
                    result = await parseRecipe({ imageBase64: base64, imageType: 'image/jpeg', text: inputValue, mode: 'extract' }, true, language);
                } else {
                    const text = await recognizeText(selectedImage, p => setScanProgress(Math.round(p * 100)));
                    const combinedText = (inputValue ? inputValue + '\n\n' : '') + text;
                    result = await parseRecipe(combinedText, false);
                }
            } else {
                result = await parseRecipe(inputValue, effectiveAiMode, language, activeMode);
            }

            onImport(result);
            onClose();
            // Reset after close
            setTimeout(() => {
                setInputValue('');
                setPreviewUrl(null);
                setSelectedImage(null);
            }, 300);

        } catch (error) {
            console.error("Magic Import Error:", error);
            alert(`Failed: ${error.message}`);
        } finally {
            setIsParsing(false);
            setScanProgress(0);
        }
    };

    return createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

            {/* Modal Content */}
            <div className="relative w-full max-w-[600px] bg-white dark:bg-[#1a2c20] rounded-2xl shadow-xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200 border border-[#dce5df] dark:border-[#2a4030]">

                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-[#dce5df] dark:border-[#2a4030]">
                    <h3 className="text-lg font-bold text-[#111813] dark:text-[#e0e6e2]">Add New Recipe</h3>

                    <div className="flex items-center gap-4">
                        {/* AI Mode Toggle */}
                        {activeTab === 'import' && (
                            <div className="flex items-center p-1 bg-[#f6f8f6] dark:bg-[#112116] rounded-lg border border-[#dce5df] dark:border-[#2a4030]">
                                <button
                                    onClick={() => setAiMode('off')}
                                    className={`p-1.5 rounded-md transition-all ${aiMode === 'off' ? 'bg-white dark:bg-[#2a4030] shadow-sm text-gray-700 dark:text-gray-200' : 'text-gray-400 hover:text-gray-600'}`}
                                    title="Fast / Standard"
                                >
                                    <Zap size={16} fill={aiMode === 'off' ? "currentColor" : "none"} />
                                </button>
                                <button
                                    onClick={() => setAiMode('hybrid')}
                                    className={`p-1.5 rounded-md transition-all ${aiMode === 'hybrid' ? 'bg-white dark:bg-[#2a4030] shadow-sm text-[#17cf54]' : 'text-gray-400 hover:text-gray-600'}`}
                                    title="Smart / Hybrid"
                                >
                                    <Brain size={16} />
                                </button>
                                <button
                                    onClick={() => setAiMode('on')}
                                    className={`p-1.5 rounded-md transition-all ${aiMode === 'on' ? 'bg-white dark:bg-[#2a4030] shadow-sm text-[#17cf54]' : 'text-gray-400 hover:text-gray-600'}`}
                                    title="Advanced / AI Chef"
                                >
                                    <Sparkles size={16} />
                                </button>
                            </div>
                        )}

                        <div className="h-6 w-[1px] bg-[#dce5df] dark:bg-[#2a4030]" />

                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                        >
                            <X size={20} />
                        </button>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex px-6 border-b border-[#dce5df] dark:border-[#2a4030]">
                    <button
                        onClick={() => setActiveTab('import')}
                        className={`py-3 px-1 mr-6 text-sm font-bold border-b-2 transition-colors ${activeTab === 'import'
                                ? 'border-[#17cf54] text-[#111813] dark:text-[#e0e6e2]'
                                : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                            }`}
                    >
                        Magic Import
                    </button>
                    <button
                        onClick={() => setActiveTab('chef')}
                        className={`py-3 px-1 text-sm font-bold border-b-2 transition-colors ${activeTab === 'chef'
                                ? 'border-[#17cf54] text-[#111813] dark:text-[#e0e6e2]'
                                : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                            }`}
                    >
                        AI Chef
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 flex flex-col gap-4">

                    {/* Source Input */}
                    <div className="flex flex-col gap-2">
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Source</label>
                        <div className="relative">
                            <textarea
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                placeholder={activeTab === 'chef' ? "Describe the dish you want to create (e.g. 'A healthy vegetarian lasagna with spinach')..." : "Paste full recipe text or enter a website URL..."}
                                className="w-full h-40 rounded-xl border border-[#dce5df] dark:border-[#2a4030] bg-white dark:bg-[#112116] p-4 text-base text-[#111813] dark:text-[#e0e6e2] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#17cf54] focus:border-transparent resize-none transition-all"
                            />
                            {/* Icon inside textarea */}
                            <div className="absolute bottom-4 right-4 text-gray-300 pointer-events-none">
                                <FileText size={20} />
                            </div>
                        </div>
                    </div>

                    {/* Image Upload (Only for Import) */}
                    {activeTab === 'import' && (
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
                            <span>{activeTab === 'chef' ? 'Creating...' : 'Analyzing...'} {Math.round(scanProgress)}%</span>
                        ) : (
                            <>
                                {activeTab === 'chef' ? 'Create Recipe' : 'Import Recipe'}
                                <ArrowRight size={18} />
                            </>
                        )}
                    </button>

                    <p className="text-center text-xs text-gray-400">
                        {activeTab === 'chef'
                            ? 'AI Chef will generate a recipe based on your description.'
                            : 'Magic Import analyzes your source to extract ingredients and steps.'}
                    </p>
                </div>
            </div>
        </div>,
        document.body
    );
}
