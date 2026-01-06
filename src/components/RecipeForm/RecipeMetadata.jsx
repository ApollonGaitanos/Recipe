import React from 'react';
import { Clock, Users } from 'lucide-react';
import FilterSelect from '../FilterSelect';

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

            {/* Nutrition Row */}
            <div className="space-y-3 pt-4 border-t border-gray-100 dark:border-white/5">
                <label className="text-xs font-bold uppercase tracking-wider text-[#63886f] dark:text-[#8ca395]">
                    Nutrition <span className="text-gray-400 font-normal normal-case">(per serving)</span>
                </label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="space-y-1">
                        <label className="text-[10px] uppercase font-bold text-gray-500">Calories</label>
                        <input
                            type="text"
                            className="w-full rounded-lg border border-gray-200 dark:border-white/5 bg-gray-50 dark:bg-background-dark px-3 py-2 text-sm focus:border-primary focus:ring-primary text-gray-800 dark:text-gray-200"
                            placeholder="e.g. 450"
                            value={formData.calories || ''}
                            onChange={e => handleChange('calories', e.target.value)}
                        />
                    </div>
                    <div className="space-y-1">
                        <label className="text-[10px] uppercase font-bold text-gray-500">Protein</label>
                        <input
                            type="text"
                            className="w-full rounded-lg border border-gray-200 dark:border-white/5 bg-gray-50 dark:bg-background-dark px-3 py-2 text-sm focus:border-primary focus:ring-primary text-gray-800 dark:text-gray-200"
                            placeholder="e.g. 32g"
                            value={formData.protein || ''}
                            onChange={e => handleChange('protein', e.target.value)}
                        />
                    </div>
                    <div className="space-y-1">
                        <label className="text-[10px] uppercase font-bold text-gray-500">Carbs</label>
                        <input
                            type="text"
                            className="w-full rounded-lg border border-gray-200 dark:border-white/5 bg-gray-50 dark:bg-background-dark px-3 py-2 text-sm focus:border-primary focus:ring-primary text-gray-800 dark:text-gray-200"
                            placeholder="e.g. 12g"
                            value={formData.carbs || ''}
                            onChange={e => handleChange('carbs', e.target.value)}
                        />
                    </div>
                    <div className="space-y-1">
                        <label className="text-[10px] uppercase font-bold text-gray-500">Fat</label>
                        <input
                            type="text"
                            className="w-full rounded-lg border border-gray-200 dark:border-white/5 bg-gray-50 dark:bg-background-dark px-3 py-2 text-sm focus:border-primary focus:ring-primary text-gray-800 dark:text-gray-200"
                            placeholder="e.g. 28g"
                            value={formData.fat || ''}
                            onChange={e => handleChange('fat', e.target.value)}
                        />
                    </div>
                </div>
            </div>

            {/* Filters (4 Boxes) */}
            <div className="space-y-3 pt-4 border-t border-gray-100 dark:border-white/5">
                <label className="text-xs font-bold uppercase tracking-wider text-[#63886f] dark:text-[#8ca395]">
                    Filters
                </label>
                <FilterSelect
                    selectedTags={formData.tags ? formData.tags.split(',').map(t => t.trim()).filter(Boolean) : []}
                    onChange={(newTags) => handleChange('tags', newTags.join(', '))}
                />
            </div>
        </div>
    );
}
