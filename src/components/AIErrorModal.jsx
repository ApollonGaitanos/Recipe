import React from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle, X } from 'lucide-react';

export default function AIErrorModal({ isOpen, onClose, error }) {
    if (!isOpen) return null;

    // Friendly messages mapping
    const getFriendlyMessage = (rawError) => {
        const msg = rawError?.message?.toLowerCase() || '';
        if (msg.includes('429') || msg.includes('quota')) return "Our AI Chef is a bit overwhelmed right now (Rate Limit). Please try again in a moment.";
        if (msg.includes('500') || msg.includes('503')) return "The AI service is having a hiccup. Please try again.";
        if (msg.includes('network') || msg.includes('fetch')) return "Network issue. Please check your connection.";
        return rawError?.message || "Something went wrong with the AI request.";
    };

    return createPortal(
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-[#1a2c20] w-full max-w-md rounded-2xl shadow-xl border border-red-100 dark:border-red-900/30 overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="p-6 flex flex-col items-center text-center gap-4">
                    <div className="w-16 h-16 rounded-full bg-red-50 dark:bg-red-900/20 flex items-center justify-center text-red-500 mb-2">
                        <AlertTriangle size={32} />
                    </div>

                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                        Oops! The Chef Stumbled
                    </h3>

                    <p className="text-gray-600 dark:text-gray-300">
                        {getFriendlyMessage(error)}
                    </p>

                    <div className="text-xs text-gray-400 font-mono bg-gray-50 dark:bg-black/20 p-2 rounded w-full overflow-hidden text-ellipsis whitespace-nowrap">
                        Error: {error?.message || 'Unknown'}
                    </div>

                    <button
                        onClick={onClose}
                        className="mt-2 w-full py-3 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white font-bold hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                    >
                        Close & Try Again
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
}
