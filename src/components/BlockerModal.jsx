import React from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle, X } from 'lucide-react';

export default function BlockerModal({ isOpen, onClose, onConfirm }) {
    if (!isOpen) return null;

    return createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            />

            <div className="relative w-full max-w-md bg-white dark:bg-[#1a2c20] rounded-2xl shadow-xl border border-gray-100 dark:border-white/5 animate-in fade-in zoom-in-95 duration-200 overflow-hidden">
                <div className="p-6">
                    <div className="w-12 h-12 bg-amber-100 dark:bg-amber-900/20 rounded-full flex items-center justify-center text-amber-600 dark:text-amber-400 mb-4 mx-auto">
                        <AlertTriangle size={24} />
                    </div>

                    <h3 className="text-xl font-bold text-gray-900 dark:text-white text-center mb-2">
                        Unsaved Changes
                    </h3>
                    <p className="text-gray-600 dark:text-gray-300 text-center mb-6">
                        You have unsaved changes. Are you sure you want to leave? Your changes will be lost.
                    </p>

                    <div className="flex gap-3">
                        <button
                            onClick={onClose}
                            className="flex-1 py-2.5 rounded-xl font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors border border-gray-200 dark:border-white/10"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={onConfirm}
                            className="flex-1 py-2.5 rounded-xl font-medium text-white bg-red-600 hover:bg-red-700 transition-colors shadow-lg shadow-red-600/20"
                        >
                            Leave
                        </button>
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
}
