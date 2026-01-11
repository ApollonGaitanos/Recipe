import React from 'react';
import { Clock, Users, ChevronDown, ChevronUp } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

export default function RecipeMetadata({ formData, handleChange, handleTagChange }) {
    const { t } = useLanguage();
    const [showAdvanced, setShowAdvanced] = React.useState(false);

    // Common input styles
    const inputClasses = "w-full bg-white dark:bg-[#1a2c20] border border-[#dce5df] dark:border-[#2a4030] rounded-xl px-4 py-3 text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#63886f] focus:border-transparent transition-all";
    const labelClasses = "block text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2 ml-1";

    return (
        <div className="space-y-6">

            {/* Description */}
            <div>
                <textarea
                    className={`${inputClasses} min-h-[100px] resize-y`}
                    placeholder={t('form.placeholderDesc')}
                    value={formData.description}
                    onChange={e => handleChange('description', e.target.value)}
                />
            </div>

            {/* Core Metrics: Prep, Cook, Servings */}
            <div className="grid grid-cols-3 gap-3 md:gap-4">
                <div>
                    <label className={labelClasses}>
                        <div className="flex items-center gap-1.5">
                            <Clock size={14} /> {t('form.prep')}
                        </div>
                    </label>
                    <input
                        type="number"
                        className={inputClasses}
                        placeholder="0"
                        value={formData.prepTime}
                        onChange={e => handleChange('prepTime', e.target.value)}
                    />
                </div>
                <div>
                    <label className={labelClasses}>
                        <div className="flex items-center gap-1.5">
                            <Clock size={14} /> {t('form.cook')}
                        </div>
                    </label>
                    <input
                        type="number"
                        className={inputClasses}
                        placeholder="0"
                        value={formData.cookTime}
                        onChange={e => handleChange('cookTime', e.target.value)}
                    />
                </div>
                <div>
                    <label className={labelClasses}>
                        <div className="flex items-center gap-1.5">
                            <Users size={14} /> {t('form.serves')}
                        </div>
                    </label>
                    <input
                        type="number"
                        className={inputClasses}
                        placeholder="2"
                        value={formData.servings}
                        onChange={e => handleChange('servings', e.target.value)}
                    />
                </div>
            </div>

            {/* Advanced Toggle */}
            <div className="border-t border-gray-100 dark:border-white/5 pt-4">
                <button
                    onClick={() => setShowAdvanced(!showAdvanced)}
                    className="flex items-center gap-2 text-sm font-bold text-[#63886f] hover:text-[#4d6a56] transition-colors"
                >
                    {showAdvanced ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    {showAdvanced ? t('form.hideNutrition') : t('form.showNutrition')}
                </button>
            </div>

            {/* Advanced Section: Nutrition & Tags */}
            {showAdvanced && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in slide-in-from-top-2 duration-200">

                    {/* Nutrition Grid */}
                    <div className="space-y-4">
                        <h4 className="font-serif font-bold text-gray-900 dark:text-white">{t('form.nutrition')}</h4>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className={labelClasses}>{t('form.calories')}</label>
                                <input
                                    type="number"
                                    className={inputClasses}
                                    placeholder="0"
                                    value={formData.calories}
                                    onChange={e => handleChange('calories', e.target.value)}
                                />
                            </div>
                            <div>
                                <label className={labelClasses}>{t('form.protein')}</label>
                                <input
                                    type="number"
                                    className={inputClasses}
                                    placeholder="0g"
                                    value={formData.protein}
                                    onChange={e => handleChange('protein', e.target.value)}
                                />
                            </div>
                            <div>
                                <label className={labelClasses}>{t('form.carbs')}</label>
                                <input
                                    type="number"
                                    className={inputClasses}
                                    placeholder="0g"
                                    value={formData.carbs}
                                    onChange={e => handleChange('carbs', e.target.value)}
                                />
                            </div>
                            <div>
                                <label className={labelClasses}>{t('form.fat')}</label>
                                <input
                                    type="number"
                                    className={inputClasses}
                                    placeholder="0g"
                                    value={formData.fat}
                                    onChange={e => handleChange('fat', e.target.value)}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Tags */}
                    <div className="space-y-4">
                        <h4 className="font-serif font-bold text-gray-900 dark:text-white">{t('form.filters')}</h4>
                        <label className={labelClasses}>{t('form.filters')}</label>
                        <textarea
                            className={`${inputClasses} h-[132px] resize-none`}
                            placeholder={t('placeholders.tags')}
                            value={formData.tags}
                            onChange={handleTagChange}
                        />
                        <p className="text-xs text-gray-400 dark:text-gray-500">
                            {t('form.tagsHelp')}
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}
