import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Plus } from 'lucide-react';
import { useRecipes } from '../context/RecipeContext';
import { useAuth } from '../context/AuthContext';
import Layout from './Layout';
import RecipeCard from './RecipeCard';
import { useLanguage } from '../context/LanguageContext';

export default function MyKitchen() {
    const { recipes, deleteRecipe, toggleVisibility } = useRecipes();
    const { user } = useAuth();
    const { t } = useLanguage();
    const navigate = useNavigate();

    const [activeTab, setActiveTab] = useState('my_recipes');
    const [searchQuery, setSearchQuery] = useState('');
    // Filter Logic
    const filteredRecipes = recipes.filter(recipe => {
        const query = searchQuery.toLowerCase();
        return (
            recipe.title.toLowerCase().includes(query) ||
            (recipe.tags && recipe.tags.some(tag => tag.toLowerCase().includes(query)))
        );
    });

    return (
        <Layout currentView="myRecipes" fullWidth>
            <div className="min-h-screen bg-[#f6f8f6] dark:bg-[#112116] text-[#111813] dark:text-white font-sans transition-colors duration-200">

                {/* --- Profile Header Section --- */}
                <div className="bg-white dark:bg-[#192b20] border-b border-gray-200 dark:border-gray-800">
                    <div className="max-w-7xl mx-auto px-6 py-10 md:py-12">
                        <div className="flex flex-col md:flex-row gap-8 items-start md:items-center justify-between">

                            {/* Profile Info (No Icon) */}
                            <div className="flex flex-col gap-2">
                                <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-[#111813] dark:text-white font-serif">
                                    {username}'s Kitchen
                                </h1>
                                <p className="text-[#63886f] dark:text-[#a0b3a6] text-base md:text-lg">
                                    Culinary enthusiast & sourdough baker
                                </p>
                                <div className="flex items-center gap-6 mt-2 text-sm font-medium text-[#63886f] dark:text-[#a0b3a6]">
                                    <span><strong>{recipeCount}</strong> Recipes</span>
                                    <span><strong>12</strong> Followers</span>
                                    <span><strong>8</strong> Following</span>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex gap-3">
                                <button className="px-5 py-2.5 rounded-full border border-gray-300 dark:border-gray-600 text-sm font-semibold hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                                    Edit Profile
                                </button>
                                <button className="px-5 py-2.5 rounded-full bg-[#17cf54] text-white text-sm font-bold shadow-sm hover:opacity-90 transition-opacity">
                                    Share Kitchen
                                </button>
                            </div>
                        </div>

                        {/* --- Tab Navigation --- */}
                        <div className="flex items-center gap-8 mt-12 border-b border-gray-100 dark:border-gray-800">
                            {[
                                { id: 'my_recipes', label: 'My Recipes' },
                                { id: 'saved', label: 'Saved Collection' },
                                { id: 'drafts', label: 'Drafts' }
                            ].map(tab => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`relative pb-4 text-sm font-bold tracking-wide uppercase transition-colors ${activeTab === tab.id
                                        ? 'text-[#17cf54]'
                                        : 'text-[#63886f] dark:text-[#a0b3a6] hover:text-[#111813] dark:hover:text-white'
                                        }`}
                                >
                                    {tab.label}
                                    {activeTab === tab.id && (
                                        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#17cf54] rounded-t-full" />
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* --- Main Content Area --- */}
                <div className="max-w-7xl mx-auto px-6 py-8">

                    {/* Search & Filters */}
                    <div className="flex flex-col sm:flex-row gap-4 items-center justify-between mb-8">
                        <div className="relative w-full sm:w-96">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Search className="text-[#63886f] dark:text-[#a0b3a6] w-5 h-5" />
                            </div>
                            <input
                                type="text"
                                placeholder="Search your recipes..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="block w-full pl-10 pr-4 py-2.5 rounded-full bg-white dark:bg-[#192b20] border border-gray-200 dark:border-gray-800 text-[#111813] dark:text-white placeholder-[#63886f] dark:placeholder-[#a0b3a6] focus:ring-2 focus:ring-[#17cf54] focus:border-transparent transition-shadow shadow-sm font-medium"
                            />
                        </div>

                        <div className="flex items-center gap-3 w-full sm:w-auto">
                            <select className="px-4 py-2.5 rounded-full bg-white dark:bg-[#192b20] border border-gray-200 dark:border-gray-800 text-sm font-medium text-[#111813] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#17cf54] cursor-pointer">
                                <option>Most Recent</option>
                                <option>Oldest First</option>
                                <option>A-Z</option>
                            </select>

                            <button
                                onClick={() => navigate('/add')}
                                className="hidden sm:flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#111813] dark:bg-white text-white dark:text-[#111813] text-sm font-bold hover:opacity-90 transition-opacity ml-auto"
                            >
                                <Plus className="w-4 h-4" />
                                <span className="hidden sm:inline">New Recipe</span>
                            </button>
                        </div>
                    </div>

                    {/* --- Recipe Grid (Replaced with RecipeCard) --- */}
                    {filteredRecipes.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {filteredRecipes.map(recipe => (
                                <RecipeCard
                                    key={recipe.id}
                                    recipe={recipe}
                                    onEdit={(id) => navigate(`/edit/${id}`)}
                                    onToggleVisibility={toggleVisibility}
                                />
                            ))}
                        </div>
                    ) : (
                        // Empty State
                        <div className="flex flex-col items-center justify-center py-20 bg-gray-50 dark:bg-[#192b20] rounded-3xl border border-dashed border-gray-200 dark:border-gray-800">
                            <div className="w-16 h-16 bg-white dark:bg-black/20 rounded-full flex items-center justify-center mb-4 text-[#63886f] dark:text-[#a0b3a6]">
                                <Search className="w-8 h-8" />
                            </div>
                            <h3 className="text-lg font-bold text-[#111813] dark:text-white mb-2">No recipes found in your kitchen</h3>
                            <p className="text-[#63886f] dark:text-[#a0b3a6] text-center max-w-sm mb-6">
                                Start cooking and add your first masterpiece!
                            </p>
                            <button
                                onClick={() => navigate('/add')}
                                className="px-6 py-2.5 rounded-full bg-[#17cf54] text-white font-bold hover:opacity-90 transition-opacity"
                            >
                                Create First Recipe
                            </button>
                        </div>
                    )}
                </div>

                {/* Floating Action Button (Mobile) */}
                <div className="fixed bottom-8 right-8 z-30 md:hidden">
                    <button
                        onClick={() => navigate('/add')}
                        className="flex items-center gap-2 pl-4 pr-5 py-3.5 bg-[#17cf54] text-white rounded-full shadow-lg hover:shadow-xl transition-all hover:-translate-y-0.5"
                    >
                        <Plus className="w-6 h-6" />
                        <span className="font-bold text-base tracking-wide">New</span>
                    </button>
                </div>
            </div>
        </Layout>
    );
}
