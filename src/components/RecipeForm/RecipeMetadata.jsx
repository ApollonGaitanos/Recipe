import React from 'react';
import { Clock, Users } from 'lucide-react';
import { FILTER_CATEGORIES } from '../../constants/filters';

export default function RecipeMetadata({ formData, handleChange, handleTagChange }) {
    return (
        <div className="space-y-6">

            {/* Description */}
            <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-[#63886f] dark:text-[#8ca395]">Description / Story <span className="text-gray-400 font-normal normal-case">(optional)</span></label>
                <textarea
                    className="w-full rounded-lg border border-gray-200 dark:border-white/5 bg-gray-50 dark:bg-background-dark px-4 py-3 text-sm focus:border-primary focus:ring-primary text-gray-800 dark:text-gray-200"
                    placeholder="Tell us about this dish..."
                    rows={3}
                    value={formData.description}
                    onChange={e => handleChange('description', e.target.value)}
                />
            </div>

            {/* Metrics Row */}
            <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                    <label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#63886f] dark:text-[#8ca395]">
                        <Clock size={14} /> Prep
                    </label>
                    <div className="relative">
                        <input
                            type="number"
                            min="0"
                            step="1"
                            onKeyDown={(e) => ["e", "E", "+", "-", "."].includes(e.key) && e.preventDefault()}
                            className="w-full rounded-lg border border-gray-200 dark:border-white/5 bg-gray-50 dark:bg-background-dark px-3 py-2.5 text-sm focus:border-primary focus:ring-primary text-gray-800 dark:text-gray-200"
                            placeholder="15"
                            value={formData.prepTime}
                            onChange={e => handleChange('prepTime', e.target.value)}
                        />
                        <span className="absolute right-3 top-2.5 text-xs text-gray-400">min</span>
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#63886f] dark:text-[#8ca395]">
                        <Clock size={14} /> Cook
                    </label>
                    <div className="relative">
                        <input
                            type="number"
                            min="0"
                            step="1"
                            onKeyDown={(e) => ["e", "E", "+", "-", "."].includes(e.key) && e.preventDefault()}
                            className="w-full rounded-lg border border-gray-200 dark:border-white/5 bg-gray-50 dark:bg-background-dark px-3 py-2.5 text-sm focus:border-primary focus:ring-primary text-gray-800 dark:text-gray-200"
                            placeholder="30"
                            value={formData.cookTime}
                            onChange={e => handleChange('cookTime', e.target.value)}
                        />
                        <span className="absolute right-3 top-2.5 text-xs text-gray-400">min</span>
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#63886f] dark:text-[#8ca395]">
                        <Users size={14} /> Serves
                    </label>
                    <input
                        type="number"
                        min="1"
                        step="1"
                        onKeyDown={(e) => ["e", "E", "+", "-", "."].includes(e.key) && e.preventDefault()}
                        className="w-full rounded-lg border border-gray-200 dark:border-white/5 bg-gray-50 dark:bg-background-dark px-3 py-2.5 text-sm focus:border-primary focus:ring-primary text-gray-800 dark:text-gray-200"
                        placeholder="4"
                        value={formData.servings}
                        onChange={e => handleChange('servings', e.target.value)}
                    />
                </div>
            </div>

            {/* Filters */}
            <div className="space-y-6 pt-4 border-t border-gray-100 dark:border-white/5">
                {FILTER_CATEGORIES.map(category => (
                    <div key={category.id} className="space-y-3">
                        <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#63886f] dark:text-[#8ca395]">
                            <category.icon size={14} />
                            {category.label}
                        </label>
                        <div className="flex flex-wrap gap-2">
                            {category.options.map(option => {
                                const isSelected = formData.tags?.includes(option.value);
                                return (
                                    <button
                                        key={option.id}
                                        onClick={() => {
                                            const currentTags = formData.tags ? formData.tags.split(',').map(t => t.trim()).filter(Boolean) : [];
                                            let newTags;
                                            if (isSelected) {
                                                newTags = currentTags.filter(t => t !== option.value);
                                            } else {
                                                newTags = [...currentTags, option.value];
                                            }
                                            // Call the parent's handleChange directly for 'tags' field
                                            // We use handleTagChange logic but mapped to the 'tags' field manually
                                            // Actually parent expects handleTagChange(e) or we can just call handleChange('tags', string)
                                            handleChange('tags', newTags.join(', '));
                                        }}
                                        className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-all flex items-center gap-1.5 ${isSelected
                                            ? 'bg-[#63886f] text-white border-[#63886f] shadow-sm'
                                            : 'bg-white dark:bg-[#1a2c20] text-gray-600 dark:text-gray-300 border-gray-200 dark:border-[#2a4030] hover:border-[#63886f] hover:text-[#63886f]'
                                            }`}
                                    >
                                        {option.icon && <option.icon size={12} />}
                                        {option.flag && <span>{option.flag}</span>}
                                        {option.label}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
