import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Plus, Clock, Users, MoreHorizontal, Bookmark, Lock, Globe } from 'lucide-react';
import { useRecipes } from '../context/RecipeContext';
// import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import Layout from './Layout';

export default function MyKitchen() {
    const { recipes } = useRecipes();
    // const { t } = useLanguage();
    const { user } = useAuth();
    const navigate = useNavigate();

    const [activeTab, setActiveTab] = useState('my_recipes');
    const [searchQuery, setSearchQuery] = useState('');

    // --- Derived Data ---
    const username = user?.user_metadata?.username || "Chef";
    const recipeCount = recipes.length;

    // Filter Logic
    const filteredRecipes = recipes.filter(recipe => {
        const query = searchQuery.toLowerCase();
        return (
            recipe.title.toLowerCase().includes(query) ||
            (recipe.tags && recipe.tags.some(tag => tag.toLowerCase().includes(query)))
        );
    });

    // Deterministic placeholder based on ID
    const getPlaceholderImage = (id) => {
        const images = [
            "https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?auto=format&fit=crop&w=800&q=80",
            "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=800&q=80",
            "https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?auto=format&fit=crop&w=800&q=80",
            "https://images.unsplash.com/photo-1482049016688-2d3e1b311543?auto=format&fit=crop&w=800&q=80",
            "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=800&q=80"
        ];
        const index = id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % images.length;
        return images[index];
    };

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
                                New Recipe
                            </button>
                        </div>
                    </div>

                    {/* --- Recipe Grid (Custom Styled for My Kitchen) --- */}
                    {filteredRecipes.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {filteredRecipes.map(recipe => (
                                <article
                                    key={recipe.id}
                                    onClick={() => navigate(`/recipe/${recipe.id}`)}
                                    className="group relative flex flex-col bg-white dark:bg-[#192b20] rounded-xl shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 dark:border-gray-800 hover:border-[#17cf54]/20 overflow-hidden h-full cursor-pointer"
                                >
                                    {/* Image Wrapper */}
                                    <div className="relative w-full aspect-[16/10] overflow-hidden">
                                        <div
                                            className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
                                            style={{ backgroundImage: `url(${getPlaceholderImage(recipe.id)})` }}
                                        />

                                        {/* Gradient Overlay */}
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-60"></div>

                                        {/* Top Actions */}
                                        <div className="absolute top-3 left-3 z-10">
                                            <button className="text-white hover:text-[#17cf54] transition-colors drop-shadow-md focus:outline-none">
                                                <Bookmark className="w-7 h-7" strokeWidth={1.5} />
                                            </button>
                                        </div>

                                        <div className="absolute top-3 right-3 flex gap-2">
                                            <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider text-white shadow-sm backdrop-blur-sm flex items-center gap-1 ${recipe.is_public ? 'bg-[#17cf54]/90' : 'bg-gray-600/90'
                                                }`}>
                                                {recipe.is_public ? (
                                                    <Globe className="w-3 h-3" />
                                                ) : (
                                                    <Lock className="w-3 h-3" />
                                                )}
                                                {recipe.is_public ? 'Public' : 'Private'}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Content Body */}
                                    <div className="flex flex-col flex-grow p-4 md:p-5">
                                        <div className="flex flex-col gap-2 mb-3">
                                            <h3 className="text-xl font-bold leading-tight text-[#111813] dark:text-white group-hover:text-[#17cf54] transition-colors line-clamp-2 font-serif">
                                                {recipe.title}
                                            </h3>
                                            <div className="flex items-center text-xs text-[#63886f] dark:text-[#a0b3a6] gap-1.5 font-medium">
                                                <Users className="w-3.5 h-3.5" />
                                                <span>By {recipe.author_username || 'Chef'}</span>
                                            </div>
                                        </div>

                                        {/* Footer Metadata */}
                                        <div className="mt-auto pt-4 border-t border-gray-100 dark:border-gray-800/50 flex items-center justify-between text-xs font-medium text-[#63886f] dark:text-[#a0b3a6] uppercase tracking-wide">
                                            <div className="flex items-center gap-4">
                                                <div className="flex items-center gap-1.5" title="Prep Time">
                                                    <Clock className="w-4 h-4" />
                                                    <span>{recipe.prepTime || 15} min</span>
                                                </div>
                                                <div className="flex items-center gap-1.5" title="Servings">
                                                    <Users className="w-4 h-4" />
                                                    <span>{recipe.servings || 2} Servings</span>
                                                </div>
                                            </div>
                                            <button className="text-[#111813] dark:text-white hover:text-[#17cf54] transition-colors">
                                                <MoreHorizontal className="w-5 h-5" />
                                            </button>
                                        </div>
                                    </div>
                                </article>
                            ))}
                        </div>
                    ) : (
                        // Empty State
                        <div className="flex flex-col items-center justify-center py-20 bg-gray-50 dark:bg-[#192b20] rounded-3xl border border-dashed border-gray-200 dark:border-gray-800">
                            <div className="w-16 h-16 bg-white dark:bg-black/20 rounded-full flex items-center justify-center mb-4 text-[#63886f] dark:text-[#a0b3a6]">
                                <Search className="w-8 h-8" />
                            </div>
                            <h3 className="text-lg font-bold text-[#111813] dark:text-white mb-2">No recipes found</h3>
                            <p className="text-[#63886f] dark:text-[#a0b3a6] text-center max-w-sm mb-6">
                                Try adjusting your search or add a new recipe to your kitchen.
                            </p>
                            <button
                                onClick={() => navigate('/add')}
                                className="px-6 py-2.5 rounded-full bg-[#17cf54] text-white font-bold hover:opacity-90 transition-opacity"
                            >
                                Create Recipe
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
