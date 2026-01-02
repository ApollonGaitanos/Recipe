import React, { useState } from 'react';
import { X, Globe, Sparkles, Check, ChevronRight } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export default function ActionModal({ isOpen, onClose, mode, onConfirm, isProcessing }) {
    const { t, language } = useLanguage();
    const [targetLang, setTargetLang] = useState(language === 'en' ? 'el' : 'en');

    if (!isOpen) return null;

    const handleConfirm = () => {
        onConfirm(mode === 'translate' ? targetLang : null);
    };

    const isTranslate = mode === 'translate';

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
                onClick={isProcessing ? null : onClose}
            />

            {/* Modal Content */}
            <div className="relative w-full max-w-md bg-white dark:bg-[#1a2c20] rounded-2xl shadow-2xl overflow-hidden flex flex-col border border-[#dce5df] dark:border-[#2a4030] animate-in fade-in zoom-in-95 duration-200">

                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-[#dce5df] dark:border-[#2a4030] bg-white dark:bg-[#1a2c20]">
                    <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isTranslate
                            ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400'
                            : 'bg-purple-50 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400'
                            }`}>
                            {isTranslate ? <Globe size={18} /> : <Sparkles size={18} />}
                        </div>
                        <h3 className="text-lg font-bold text-[#111813] dark:text-[#e0e6e2]">
                            {isTranslate ? t('translate') : t('improve')}
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
                <div className="p-6 bg-white dark:bg-[#1a2c20]">
                    {isTranslate ? (
                        <div className="flex flex-col gap-3">
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
                        <div className="flex flex-col gap-3">
                            <div className="flex items-center gap-3 p-3 bg-purple-50 dark:bg-purple-900/10 rounded-xl text-purple-900 dark:text-purple-200">
                                <span className="text-lg">✨</span>
                                <span className="font-medium text-sm">Fixes typos and formatting</span>
                            </div>
                            <div className="flex items-center gap-3 p-3 bg-purple-50 dark:bg-purple-900/10 rounded-xl text-purple-900 dark:text-purple-200">
                                <span className="text-lg">📊</span>
                                <span className="font-medium text-sm">Standardizes measurements</span>
                            </div>
                            <div className="flex items-center gap-3 p-3 bg-purple-50 dark:bg-purple-900/10 rounded-xl text-purple-900 dark:text-purple-200">
                                <span className="text-lg">📝</span>
                                <span className="font-medium text-sm">Clarifies instructions</span>
                            </div>
                            <p className="text-center text-xs text-gray-400 mt-2">This will update your current recipe.</p>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-[#dce5df] dark:border-[#2a4030] bg-[#fcfdfc] dark:bg-[#15231a]">
                    <button
                        className="px-4 py-2 text-sm font-bold text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
                        onClick={onClose}
                        disabled={isProcessing}
                    >
                        {t('cancel')}
                    </button>
                    <button
                        className={`flex items-center gap-2 px-6 py-2 rounded-xl text-sm font-bold text-white shadow-lg transition-all ${isProcessing ? 'opacity-70 cursor-wait' : 'hover:-translate-y-0.5'
                            } ${isTranslate
                                ? 'bg-blue-600 hover:bg-blue-500 shadow-blue-500/20'
                                : 'bg-purple-600 hover:bg-purple-500 shadow-purple-500/20'
                            }`}
                        onClick={handleConfirm}
                        disabled={isProcessing}
                    >
                        {isProcessing ? (
                            <span>Processing...</span>
                        ) : (
                            <>
                                {isTranslate ? "Translate Now" : "Enhance Recipe"}
                                <ChevronRight size={16} />
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
