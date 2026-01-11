import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Globe, Sparkles, Check, ChevronRight, ChevronLeft } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export default function TranslationModal({ isOpen, onClose, mode, onConfirm, isProcessing, isPermanent = false, onBack }) {
    const { t, language } = useLanguage();
    const [targetLang, setTargetLang] = useState(language === 'en' ? 'el' : 'en');
    const [step, setStep] = useState('select'); // 'select' | 'confirm'

    // Reset state when modal opens
    React.useEffect(() => {
        if (isOpen) {
            setStep('select');
        }
    }, [isOpen]);

    if (!isOpen) return null;

    return createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
                onClick={isProcessing ? null : onClose}
            />

            {/* Modal Content */}
            <div className="relative w-full max-w-md max-h-[90vh] bg-white dark:bg-[#1a2c20] rounded-2xl shadow-2xl overflow-hidden flex flex-col border border-[#dce5df] dark:border-[#2a4030] animate-in fade-in zoom-in-95 duration-200">

                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-[#dce5df] dark:border-[#2a4030] bg-white dark:bg-[#1a2c20]">
                    <div className="flex items-center gap-3">
                        {onBack && step !== 'confirm' && (
                            <button
                                onClick={onBack}
                                disabled={isProcessing}
                                className="mr-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors disabled:opacity-50"
                            >
                                <ChevronLeft size={24} />
                            </button>
                        )}
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isTranslate
                            ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400'
                            : 'bg-purple-50 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400'
                            }`}>
                            {isTranslate ? <Globe size={18} /> : <Sparkles size={18} />}
                        </div>
                        <h3 className="text-lg font-bold text-[#111813] dark:text-[#e0e6e2]">
                            {step === 'confirm' ? 'Warning: Permanent Change' : (isTranslate ? t('translate') : t('improve'))}
                        </h3>
                    </div>
                    <button
                        onClick={onClose}
                        disabled={isProcessing}
                        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors disabled:opacity-50"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 bg-white dark:bg-[#1a2c20] overflow-y-auto">
                    {step === 'confirm' ? (
                        <div className="flex flex-col gap-4 animate-in slide-in-from-right duration-300">
                            <div className="p-4 bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800 rounded-xl flex gap-3 text-amber-800 dark:text-amber-200">
                                <span className="text-2xl">⚠️</span>
                                <div className="text-sm">
                                    <p className="font-bold mb-1">Are you sure?</p>
                                    <p className="opacity-90">This will <strong>permanently overwrite</strong> your existing recipe (ingredients & instructions) with the translation.</p>
                                </div>
                            </div>
                            <p className="text-sm text-gray-500 text-center">
                                To keep the original, you might want to Translate in "View Mode" instead.
                            </p>
                        </div>
                    ) : isTranslate ? (
                        <div className="flex flex-col gap-3 animate-in slide-in-from-left duration-300">
                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Choose the target language for this recipe:</p>

                            <div className="relative">
                                <select
                                    value={targetLang}
                                    onChange={(e) => setTargetLang(e.target.value)}
                                    className="w-full appearance-none p-4 rounded-xl border-2 border-[#dce5df] dark:border-[#2a4030] bg-white dark:bg-[#112116] text-[#111813] dark:text-[#e0e6e2] font-medium focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all pr-10 cursor-pointer"
                                >
                                    <option value="en">🇬🇧 English</option>
                                    <option value="el">🇬🇷 Greek (Ελληνικά)</option>
                                    <option value="es">🇪🇸 Spanish (Español)</option>
                                    <option value="fr">🇫🇷 French (Français)</option>
                                    <option value="de">🇩🇪 German (Deutsch)</option>
                                    <option value="it">🇮🇹 Italian (Italiano)</option>
                                    <option value="ja">🇯🇵 Japanese (日本語)</option>
                                    <option value="zh">🇨🇳 Chinese (中文)</option>
                                </select>
                                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                                    <ChevronRight size={20} className="rotate-90" />
                                </div>
                            </div>

                            <p className="text-xs text-center text-gray-400 mt-2">
                                AI will translate ingredients, instructions, and convert measurements.
                            </p>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-3 animate-in slide-in-from-left duration-300">
                            <div className="flex items-center gap-3 p-3 bg-purple-50 dark:bg-purple-900/10 rounded-xl text-purple-900 dark:text-purple-200">
                                <span className="text-lg">👩‍🍳</span>
                                <span className="font-medium text-sm">Adds pro tips & visual cues</span>
                            </div>
                            <div className="flex items-center gap-3 p-3 bg-purple-50 dark:bg-purple-900/10 rounded-xl text-purple-900 dark:text-purple-200">
                                <span className="text-lg">🔍</span>
                                <span className="font-medium text-sm">Explains 'Why' without changing steps</span>
                            </div>
                            <div className="flex items-center gap-3 p-3 bg-purple-50 dark:bg-purple-900/10 rounded-xl text-purple-900 dark:text-purple-200">
                                <span className="text-lg">✨</span>
                                <span className="font-medium text-sm">Makes instructions clearer & easier</span>
                            </div>
                            <p className="text-center text-xs text-gray-400 mt-2">The AI Sous Chef will improve your recipe description and steps.</p>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-[#dce5df] dark:border-[#2a4030] bg-[#fcfdfc] dark:bg-[#15231a]">
                    <button
                        className="px-4 py-2 text-sm font-bold text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
                        onClick={handleClose}
                        disabled={isProcessing}
                    >
                        {step === 'confirm' ? 'Back' : t('cancel')}
                    </button>
                    <button
                        className={`flex items-center gap-2 px-6 py-2 rounded-xl text-sm font-bold text-white shadow-lg transition-all ${isProcessing ? 'opacity-70 cursor-wait' : 'hover:-translate-y-0.5'
                            } ${step === 'confirm'
                                ? 'bg-amber-500 hover:bg-amber-600 shadow-amber-500/20'
                                : (isTranslate ? 'bg-blue-600 hover:bg-blue-500 shadow-blue-500/20' : 'bg-purple-600 hover:bg-purple-500 shadow-purple-500/20')
                            }`}
                        onClick={handleAction}
                        disabled={isProcessing}
                    >
                        {isProcessing ? (
                            <span>Processing...</span>
                        ) : (
                            <>
                                {step === 'confirm'
                                    ? "Yes, Overwrite"
                                    : (isTranslate ? "Translate Now" : "Enhance Recipe")
                                }
                                <ChevronRight size={16} />
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>,

        document.body
    );
}
