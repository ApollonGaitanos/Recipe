import React, { useState } from 'react';
import { Search } from 'lucide-react';
import { useRecipes } from '../context/RecipeContext';
import { useLanguage } from '../context/LanguageContext';
import RecipeCard from './RecipeCard';

export default function RecipeList({ onSelect }) {
    const { recipes } = useRecipes();
    const { t } = useLanguage();
    const [searchTerm, setSearchTerm] = useState('');

    const filteredRecipes = recipes.filter(recipe => {
        const searchLower = searchTerm.toLowerCase();
        return (
            recipe.title.toLowerCase().includes(searchLower) ||
            recipe.tags.some(tag => tag.toLowerCase().includes(searchLower)) ||
            (recipe.ingredients && recipe.ingredients.toLowerCase().includes(searchLower))
        );
    });

    return (
        <div>
            <div className="search-container">
                <Search className="search-icon" size={20} />
                <input
                    type="text"
                    className="search-input"
                    placeholder={t('searchPlaceholder')}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            {filteredRecipes.length === 0 ? (
                <div className="empty-state">
                    <p>{t('noRecipes')}</p>
                </div>
            ) : (
                <div className="recipe-grid">
                    {filteredRecipes.map(recipe => (
                        <RecipeCard key={recipe.id} recipe={recipe} onClick={onSelect} />
                    ))}
                </div>
            )}
        </div>
    );
}
