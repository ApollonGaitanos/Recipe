import React from 'react';
import { createPortal } from 'react-dom';
import { X, Sparkles, ChefHat, Globe, Wand2 } from 'lucide-react';

import { useAuth } from '../context/AuthContext';

export default function AIFeaturesModal({ isOpen, onClose, onSelect }) {
    const { user } = useAuth();
    if (!isOpen) return null;
    if (!user) return null;


    const features = [
        {
            id: 'magic',
            label: 'Magic Import',
            description: 'Import from URL, text, or photo',
            icon: Sparkles,
            color: 'text-purple-500',
            bg: 'bg-purple-50 dark:bg-purple-900/20',
            border: 'border-purple-100 dark:border-purple-800'
        },
        {
            id: 'chef',
            label: 'AI Chef',
            description: 'Generate recipe from description',
            icon: ChefHat,
            color: 'text-orange-500',
            bg: 'bg-orange-50 dark:bg-orange-900/20',
            border: 'border-orange-100 dark:border-orange-800'
        },
        {
            id: 'enhance',
            label: 'Enhance',
            description: 'Improve descriptions and details',
            icon: Wand2,
            color: 'text-blue-500',
            bg: 'bg-blue-50 dark:bg-blue-900/20',
            border: 'border-blue-100 dark:border-blue-800'
        },
        {
            id: 'translate',
            label: 'Translate',
            description: 'Convert to another language',
            icon: Globe,
            color: 'text-green-500',
            bg: 'bg-green-50 dark:bg-green-900/20',
            border: 'border-green-100 dark:border-green-800'
        }
    ];

    return createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            />

            <div className="relative w-full max-w-lg max-h-[85vh] bg-white dark:bg-[#1a2c20] rounded-2xl shadow-xl border border-gray-100 dark:border-white/5 animate-in fade-in zoom-in-95 duration-200 overflow-hidden flex flex-col">
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-white/5">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <Sparkles size={20} className="text-[#63886f]" />
                        AI Features
                    </h3>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="p-4 grid gap-3 overflow-y-auto">
                    {features.map((feature) => (
                        <button
                            key={feature.id}
                            onClick={() => onSelect(feature.id)}
                            className={`flex items-center gap-4 p-4 rounded-xl border transition-all hover:scale-[1.01] hover:shadow-sm text-left ${feature.bg} ${feature.border}`}
                        >
                            <div className={`p-3 rounded-full bg-white dark:bg-black/20 ${feature.color}`}>
                                <feature.icon size={24} />
                            </div>
                            <div>
                                <h4 className="font-bold text-gray-900 dark:text-white text-base mb-0.5">
                                    {feature.label}
                                </h4>
                                <p className="text-sm text-gray-600 dark:text-gray-300">
                                    {feature.description}
                                </p>
                            </div>
                        </button>
                    ))}
                </div>
            </div>
        </div>,
        document.body
    );
}
