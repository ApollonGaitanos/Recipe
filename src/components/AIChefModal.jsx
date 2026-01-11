import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, ArrowRight, ChefHat, FileText, ChevronLeft } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { parseRecipe } from '../utils/recipeParser';

export default function AIChefModal({ isOpen, onClose, onImport, onBack }) {
    const { t, language } = useLanguage();
    const { user } = useAuth();

    // --- State Management ---
    const [inputValue, setInputValue] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [progress, setProgress] = useState(0);
    const [error, setError] = useState(null);

    // --- Effects ---
    // Close on escape
    useEffect(() => {
        if (!isOpen) return;
        if (!user) return; // Changed from return null to return to match existing pattern for useEffect
        const handleEsc = (e) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [isOpen, onClose, user]); // Added user to dependency array

    // Reset state when modal opens/closes
    useEffect(() => {
        if (!isOpen) {
            const timer = setTimeout(() => {
                setInputValue('');
                setProgress(0);
                setIsProcessing(false);
                setError(null);
            }, 200);
            return () => clearTimeout(timer);
        }
    }, [isOpen]);

    const handleCreate = async () => {
        if (!inputValue.trim()) return;

        setIsProcessing(true);
        setProgress(0);
        setError(null);

        try {
            // Simulate progress for UX
            const interval = setInterval(() => {
                setProgress(prev => Math.min(prev + 10, 90));
            }, 500);

            // Call parser with (input, language, mode)
            const result = await parseRecipe(inputValue, language, 'create');

            clearInterval(interval);
            setProgress(100);

            onImport(result);
            onClose();

        } catch (error) {
            console.error("AI Chef Error:", error);
            setError(error.message || "An unexpected error occurred. Please try again.");
            setIsProcessing(false);
        }
    };




    return createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            />

            {/* Modal Content */}
            <div className="relative w-full max-w-[600px] max-h-[90vh] bg-white dark:bg-surface-dark rounded-2xl shadow-2xl overflow-hidden flex flex-col border border-gray-200 dark:border-white/5 animate-in fade-in zoom-in-95 duration-200">

                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-[#dce5df] dark:border-[#2a4030] bg-white dark:bg-[#1a2c20]">
                    <div className="flex items-center gap-2">
                        {onBack && (
                            <button
                                onClick={onBack}
                                className="mr-2 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                            >
                                <ChevronLeft size={24} />
                            </button>
                        )}
                        <ChefHat size={20} className="text-highlight" />
                        <h3 className="text-lg font-bold text-[#111813] dark:text-[#e0e6e2]">
                            AI Chef
                        </h3>
                    </div>

                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 flex flex-col gap-4 bg-white dark:bg-[#1a2c20] overflow-y-auto">

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

                    {/* Input */}
                    <div className="flex flex-col gap-2">
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                            Description
                        </label>
                        <div className="relative">
                            <textarea
                                value={inputValue}
                                onChange={(e) => { setInputValue(e.target.value); if (error) setError(null); }}
                                placeholder="Describe the dish you want to create (e.g. 'A healthy vegetarian lasagna with spinach')..."
                                className={`w-full h-40 rounded-xl border p-4 text-base text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none transition-all ${error
                                    ? 'border-red-300 dark:border-red-800 focus:ring-red-500'
                                    : 'border-[#dce5df] dark:border-[#2a4030]'
                                    } bg-white dark:bg-[#112116]`}
                            />
                            <div className="absolute bottom-4 right-4 text-gray-300 pointer-events-none">
                                <FileText size={20} />
                            </div>
                        </div>
                    </div>

                    {/* Button */}
                    <button
                        onClick={handleCreate}
                        disabled={isProcessing || !inputValue.trim()}
                        className={`mt-2 w-full py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 text-white shadow-lg shadow-primary/20 transition-all ${isProcessing || !inputValue.trim()
                            ? 'bg-gray-300 dark:bg-gray-700 cursor-not-allowed shadow-none'
                            : 'bg-primary hover:opacity-90 hover:-translate-y-0.5'
                            }`}
                    >
                        {isProcessing ? (
                            <span>Creating... {Math.round(progress)}%</span>
                        ) : (
                            <>
                                Create Recipe
                                <ArrowRight size={18} />
                            </>
                        )}
                    </button>

                    <p className="text-center text-xs text-gray-400">
                        AI Chef will generate a recipe based on your description.
                    </p>
                </div>
            </div>
        </div>,
        document.body
    );
}
