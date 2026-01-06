import React from 'react';
import { Clock, Users, Tag } from 'lucide-react';

export default function RecipeMetadata({ formData, handleChange, handleTagChange, imagePreview, handleImageChange, triggerFileInput }) {
    return (
        <div className="space-y-6">

            {/* Image Upload - Now full width in this column or side-by-side with desc? Let's stack it. */}
            <div
                onClick={triggerFileInput}
                className="w-full aspect-[21/9] rounded-xl border-2 border-dashed border-[#dce5df] dark:border-[#2a4030] bg-gray-50 dark:bg-[#1a2c20]/50 flex flex-col items-center justify-center cursor-pointer hover:border-[#63886f] hover:bg-[#63886f]/5 transition-all overflow-hidden relative group"
            >
                {imagePreview ? (
                    <img src={imagePreview} alt="Recipe" className="w-full h-full object-cover" />
                ) : (
                    <div className="text-center p-6">
                        <div className="w-12 h-12 bg-[#e8f5e9] dark:bg-[#2a4030] rounded-full flex items-center justify-center mx-auto mb-3 text-[#63886f]">
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                        </div>
                        <span className="text-sm font-medium text-gray-500 dark:text-gray-400 group-hover:text-primary transition-colors">Upload Photo</span>
                    </div>
                )}
                {/* Hidden Input managed by parent's ref, but if we want to isolate: */}
                <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageChange}
                    onClick={(e) => e.stopPropagation()}
                />
            </div>

            {/* Description */}
            <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-[#63886f] dark:text-[#8ca395]">Description / Story</label>
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
