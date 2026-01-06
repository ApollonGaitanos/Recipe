import React from 'react';
import { Clock, Users, Tag } from 'lucide-react';

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

            {/* Tags */}
            <div className="space-y-2">
                <label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#63886f] dark:text-[#8ca395]">
                    <Tag size={14} /> Tags
                </label>
                <input
                    className="w-full rounded-lg border border-gray-200 dark:border-white/5 bg-gray-50 dark:bg-background-dark px-3 py-2.5 text-sm focus:border-primary focus:ring-primary text-gray-800 dark:text-gray-200"
                    placeholder="Dinner, Italian, Vegan... (comma separated)"
                    value={formData.tags}
                    onChange={handleTagChange}
                />
            </div>
        </div>
    );
}
