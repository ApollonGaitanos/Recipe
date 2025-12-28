import React, { useState } from 'react';
import { useRecipes } from '../context/RecipeContext';
import { useAuth } from '../context/AuthContext';
import RecipeCard from './RecipeCard';
import { Share, Plus, Search } from 'lucide-react';

export default function MyKitchen({ onRecipeClick, onNewRecipe }) {
    const { recipes } = useRecipes();
    const { user } = useAuth();
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState('my_recipes');

    const filteredRecipes = recipes.filter(recipe =>
        recipe.title.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const username = user?.user_metadata?.username || user?.email?.split('@')[0] || 'User';
    const createdCount = recipes.length;
    const savedCount = 0;
    const draftsCount = 0;

    return (
        <div className="flex-1 flex flex-col h-full overflow-hidden relative w-full">
            <div className="flex-1 overflow-y-auto scroll-smooth">
                {/* Header Section */}
                <div className="bg-card-light dark:bg-card-dark border-b border-gray-200 dark:border-gray-800">
                    <div className="max-w-7xl mx-auto px-6 py-8">
                        <div className="flex flex-col md:flex-row gap-6 md:items-center justify-between">
                            <div className="flex gap-5 items-center">
                                <div className="bg-center bg-no-repeat bg-cover rounded-full size-24 border-4 border-background-light dark:border-background-dark shadow-sm"
                                     style={{ backgroundImage: `url(${user?.user_metadata?.avatar_url || 'https://placehold.co/100x100'})` }}>
                                </div>
                                <div className="flex flex-col gap-1">
                                    <h2 className="text-3xl font-bold tracking-tight text-text-main-light dark:text-text-main-dark">{username}'s Kitchen</h2>
                                    <p className="text-text-sub-light dark:text-text-sub-dark text-base">Your personal recipe collection.</p>
                                    <div className="flex items-center gap-4 mt-2 text-sm font-medium">
                                        <span className="flex items-center gap-1"><span className="text-primary font-bold">{createdCount}</span> Created</span>
                                        <span className="w-1 h-1 rounded-full bg-gray-300 dark:bg-gray-600"></span>
                                        <span className="flex items-center gap-1"><span className="text-primary font-bold">{savedCount}</span> Saved</span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex gap-3">
                                <button className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-transparent text-sm font-medium hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                                    <Share size={20} /> Share Profile
                                </button>
                                <button
                                    onClick={onNewRecipe}
                                    className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary/90 transition-colors shadow-sm shadow-primary/30">
                                    <Plus size={20} /> Create Recipe
                                </button>
                            </div>
                        </div>
                        <div className="flex gap-8 mt-8 border-b border-gray-200 dark:border-gray-800">
                            <button
                                onClick={() => setActiveTab('my_recipes')}
                                className={`pb-3 border-b-[3px] font-bold text-sm tracking-wide ${activeTab === 'my_recipes' ? 'border-primary text-primary' : 'border-transparent text-text-sub-light dark:text-text-sub-dark hover:text-text-main-light dark:hover:text-text-main-dark'}`}>
                                My Recipes
                            </button>
                            <button
                                onClick={() => setActiveTab('saved')}
                                className={`pb-3 border-b-[3px] font-medium text-sm tracking-wide transition-colors ${activeTab === 'saved' ? 'border-primary text-primary' : 'border-transparent text-text-sub-light dark:text-text-sub-dark hover:text-text-main-light dark:hover:text-text-main-dark'}`}>
                                Saved Collection
                            </button>
                            <button
                                onClick={() => setActiveTab('drafts')}
                                className={`pb-3 border-b-[3px] font-medium text-sm tracking-wide transition-colors ${activeTab === 'drafts' ? 'border-primary text-primary' : 'border-transparent text-text-sub-light dark:text-text-sub-dark hover:text-text-main-light dark:hover:text-text-main-dark'}`}>
                                Drafts ({draftsCount})
                            </button>
                        </div>
                    </div>
                </div>

                {/* Filtering Section */}
                 <div className="sticky top-0 z-10 bg-background-light/95 dark:bg-background-dark/95 backdrop-blur-sm border-b border-gray-200 dark:border-gray-800">
                    <div className="max-w-7xl mx-auto px-6 py-4 flex flex-col lg:flex-row gap-4 justify-between items-center">
                        <div className="relative w-full lg:max-w-md group">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Search className="text-text-sub-light dark:text-text-sub-dark group-focus-within:text-primary transition-colors" size={20} />
                            </div>
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="Filter recipes by keyword..."
                                className="block w-full pl-10 pr-3 py-2.5 border-none rounded-lg bg-white dark:bg-card-dark text-text-main-light dark:text-text-main-dark placeholder-text-sub-light dark:placeholder-text-sub-dark focus:ring-2 focus:ring-primary shadow-sm sm:text-sm"
                            />
                        </div>
                    </div>
                </div>

                {/* Recipe Grid */}
                <div className="max-w-7xl mx-auto px-6 py-8">
                     {activeTab === 'my_recipes' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                            {filteredRecipes.length > 0 ? filteredRecipes.map(recipe => (
                                <RecipeCard
                                    key={recipe.id}
                                    recipe={recipe}
                                    onClick={() => onRecipeClick(recipe)}
                                />
                            )) : (
                                <div className="col-span-full text-center py-12 text-text-sub-light dark:text-text-sub-dark">
                                    <p>No recipes found. Time to create one!</p>
                                </div>
                            )}
                        </div>
                     )}
                     {activeTab === 'saved' && (
                         <div className="col-span-full text-center py-12 text-text-sub-light dark:text-text-sub-dark">
                            <p>Saved recipes will appear here.</p>
                         </div>
                     )}
                    {activeTab === 'drafts' && (
                         <div className="col-span-full text-center py-12 text-text-sub-light dark:text-text-sub-dark">
                            <p>Drafts will appear here.</p>
                         </div>
                     )}
                </div>
            </div>
        </div>
    );
}