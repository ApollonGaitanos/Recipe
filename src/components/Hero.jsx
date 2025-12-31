import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, Bookmark, ChefHat } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export default function Hero({ recipe }) {
    const navigate = useNavigate();
    const { t } = useLanguage();

    // Placeholder if no recipe provided
    if (!recipe) return null; // Or a skeleton

    // Deterministic placeholder image based on ID
    const getPlaceholderImage = (id) => {
        const images = [
            "https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?auto=format&fit=crop&w=800&q=80", // Salad
            "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=800&q=80", // Pizza
            "https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?auto=format&fit=crop&w=800&q=80", // Pancakes
            "https://images.unsplash.com/photo-1482049016688-2d3e1b311543?auto=format&fit=crop&w=800&q=80", // Toast
        ];
        // Use a simple hash of the ID to pick an image
        const index = id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % images.length;
        return images[index];
    };

    return (
        <div className="bg-white dark:bg-surface-dark rounded-3xl p-6 md:p-8 flex flex-col lg:flex-row gap-8 shadow-sm border border-gray-100 dark:border-white/5 mb-12">
            {/* Left: Image */}
            <div className="w-full lg:w-1/2 relative h-[300px] lg:h-[400px]">
                <img
                    src={getPlaceholderImage(recipe.id)}
                    alt={recipe.title}
                    className="w-full h-full object-cover rounded-2xl shadow-md"
                />
            </div>

            {/* Right: Content */}
            <div className="w-full lg:w-1/2 flex flex-col justify-center gap-6">
                <div className="flex items-center gap-3">
                    <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider">
                        {t('hero.badge')}
                    </span>
                    <div className="flex items-center gap-1 text-gray-500 text-sm font-medium">
                        <Clock size={16} />
                        <span>{recipe.prepTime + recipe.cookTime} {t('minSuffix')}</span>
                    </div>
                </div>

                <h2 className="text-4xl md:text-5xl font-serif font-bold text-gray-900 dark:text-white leading-tight">
                    {recipe.title}
                </h2>

                <p className="text-gray-500 dark:text-gray-400 text-lg leading-relaxed line-clamp-3">
                    {recipe.instructions || "A delicious homemade recipe perfect for any occasion. Discover the flavors of the Mediterranean with this classic dish."}
                </p>

                <div className="flex items-center gap-4 mt-2">
                    <button
                        onClick={() => navigate(`/recipe/${recipe.id}`)}
                        className="px-8 py-3.5 rounded-xl bg-primary text-white font-bold shadow-lg shadow-primary/20 hover:bg-green-600 transition-all hover:scale-105"
                    >
                        {t('hero.viewRecipe')}
                    </button>
                    <button className="p-3.5 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors text-gray-600 dark:text-gray-300">
                        <Bookmark size={22} />
                    </button>
                </div>

                <div className="flex items-center gap-3 mt-4 pt-6 border-t border-gray-100 dark:border-white/5">
                    <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-gray-500">
                        {recipe.author_username ? recipe.author_username[0].toUpperCase() : <ChefHat size={18} />}
                    </div>
                    <div className="flex flex-col">
                        <span className="text-sm font-bold text-gray-900 dark:text-white">{recipe.author_username || t('hero.unknownChef')}</span>
                        <span className="text-xs text-gray-500">{t('hero.chefRole')} • {t('hero.timeAgo')}</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
