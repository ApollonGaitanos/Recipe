
import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, X, Check } from 'lucide-react';
import { FILTER_CATEGORIES } from '../constants/filters';

export default function FilterSelect({ selectedTags = [], onChange }) {
    // State to track which category dropdown is open
    const [openCategory, setOpenCategory] = useState(null);
    const containerRef = useRef(null);

    // Close dropdowns when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (containerRef.current && !containerRef.current.contains(event.target)) {
                setOpenCategory(null);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const toggleTag = (value) => {
        const current = selectedTags || [];
        let updated;
        if (current.includes(value)) {
            updated = current.filter(t => t !== value);
        } else {
            updated = [...current, value];
        }
        onChange(updated);
    };

    return (
        <div className="w-full" ref={containerRef}>
            {/* 4-Box Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {FILTER_CATEGORIES.map(category => {
                    // Calculate active count for this category
                    const categoryValues = category.options.map(o => o.value);
                    const activeCount = selectedTags.filter(t => categoryValues.includes(t)).length;
                    const isOpen = openCategory === category.id;

                    return (
                        <div key={category.id} className="relative">
                            <button
                                onClick={() => setOpenCategory(isOpen ? null : category.id)}
                                className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all duration-200 ${isOpen
                                    ? 'border-[#63886f] ring-1 ring-[#63886f] bg-white dark:bg-[#1a2c20]'
                                    : activeCount > 0
                                        ? 'border-[#63886f] bg-[#e8f5e9] dark:bg-[#63886f]/20'
                                        : 'border-gray-200 dark:border-white/10 bg-white dark:bg-[#1a2c20] hover:border-gray-300 dark:hover:border-white/20'
                                    }`}
                            >
                                <div className="flex items-center gap-2 overflow-hidden">
                                    <div className={`p-1.5 rounded-lg ${activeCount > 0 ? 'bg-white/50 text-[#63886f] dark:text-[#8ca395]' : 'bg-gray-100 dark:bg-white/5 text-gray-500'}`}>
                                        <category.icon size={16} />
                                    </div>
                                    <div className="flex flex-col items-start truncate">
                                        <span className={`text-xs font-bold uppercase tracking-wider ${activeCount > 0 ? 'text-[#63886f] dark:text-[#8ca395]' : 'text-gray-500'}`}>
                                            {category.label}
                                        </span>
                                        {activeCount > 0 && (
                                            <span className="text-xs font-medium text-[#111813] dark:text-white">
                                                {activeCount} selected
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <ChevronDown size={16} className={`text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
                            </button>

                            {/* Dropdown Popover */}
                            {isOpen && (
                                <div className="absolute top-full left-0 right-0 mt-2 p-3 bg-white dark:bg-[#1a2c20] rounded-xl shadow-xl border border-gray-100 dark:border-white/5 z-50 animate-in fade-in zoom-in-95 duration-200 block min-w-[200px]">
                                    <div className="flex flex-col gap-1 max-h-[300px] overflow-y-auto custom-scrollbar">
                                        {category.options.map(option => {
                                            const isSelected = selectedTags.includes(option.value);
                                            return (
                                                <button
                                                    key={option.id}
                                                    onClick={() => toggleTag(option.value)}
                                                    className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${isSelected
                                                        ? 'bg-[#e8f5e9] dark:bg-[#63886f]/20 text-[#1a2c20] dark:text-white'
                                                        : 'hover:bg-gray-50 dark:hover:bg-white/5 text-gray-600 dark:text-gray-300'
                                                        }`}
                                                >
                                                    <div className="flex items-center gap-2.5">
                                                        {option.icon && <option.icon size={14} className={isSelected ? 'text-[#63886f] dark:text-[#8ca395]' : 'text-gray-400'} />}
                                                        {option.flag && <span className="text-base leading-none">{option.flag}</span>}
                                                        <span>{option.label}</span>
                                                    </div>
                                                    {isSelected && <Check size={14} className="text-[#63886f] dark:text-[#8ca395]" />}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Active Filters Summary (Optional, for easy removal) */}
            {selectedTags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-4">
                    {selectedTags.map(tag => {
                        // Find label/icon for this tag
                        let option = null;
                        FILTER_CATEGORIES.some(cat => {
                            option = cat.options.find(o => o.value === tag);
                            return !!option;
                        });

                        if (!option) return null; // Should not happen

                        return (
                            <button
                                key={tag}
                                onClick={() => toggleTag(tag)}
                                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-gray-100 dark:bg-white/5 text-gray-700 dark:text-gray-300 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20 dark:hover:text-red-400 border border-transparent hover:border-red-100 transition-colors"
                            >
                                {option.flag && <span>{option.flag}</span>}
                                {option.label}
                                <X size={12} />
                            </button>
                        );
                    })}
                    <button
                        onClick={() => onChange([])}
                        className="text-xs text-gray-400 hover:text-gray-600 underline px-2"
                    >
                        Clear all
                    </button>
                </div>
            )}
        </div>
    );
}
