import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Search, Plus, Share2 } from 'lucide-react';
import { supabase } from '../supabaseClient';
import { useRecipes } from '../context/RecipeContext';
import { useAuth } from '../context/AuthContext';
import Layout from './Layout';
import RecipeCard from './RecipeCard';
import { useLanguage } from '../context/LanguageContext';

export default function MyKitchen() {
    const { recipes, deleteRecipe, toggleVisibility, savedRecipes } = useRecipes();
    const { user, profile } = useAuth();
    const { t } = useLanguage();
    const navigate = useNavigate();
    const { username } = useParams();

    const [activeTab, setActiveTab] = useState('my_recipes');
    const [searchQuery, setSearchQuery] = useState('');
    const [visitorProfile, setVisitorProfile] = useState(null);
    const [visitorRecipes, setVisitorRecipes] = useState([]);
    const [activeTab, setActiveTab] = useState('my_recipes');
    const [searchQuery, setSearchQuery] = useState('');
    const [visitorProfile, setVisitorProfile] = useState(null);
    const [visitorRecipes, setVisitorRecipes] = useState([]);
    const [loadingVisitor, setLoadingVisitor] = useState(false);
    const [showCopied, setShowCopied] = useState(false); // Toast state

    // Determine if we are viewing our own kitchen
    const isOwner = !username || (user && (profile?.username === username || user.user_metadata?.username === username));

    // Fetch Visitor Data
    React.useEffect(() => {
        if (isOwner || !username) return;

        async function fetchVisitorData() {
            setLoadingVisitor(true);
            try {
                // 1. Fetch Profile
                const { data: profileData, error: profileError } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('username', username)
                    .single();

                if (profileError) throw profileError;
                setVisitorProfile(profileData);

                // 2. Fetch Public Recipes
                const { data: recipeData, error: recipeError } = await supabase
                    .from('recipes')
                    .select(`*, profiles:user_id (username)`)
                    .eq('user_id', profileData.id)
                    .eq('is_public', true);

                if (recipeError) throw recipeError;

                // Map to App Recipe Format
                const mapped = (recipeData || []).map(r => ({
                    id: r.id,
                    title: r.title,
                    ingredients: r.ingredients || '',
                    instructions: r.instructions || '',
                    prepTime: r.prep_time || 0,
                    cookTime: r.cook_time || 0,
                    servings: r.servings || 2,
                    tags: r.tags || [],
                    is_public: true,
                    user_id: r.user_id,
                    author_username: r.profiles?.username || '',
                    likes_count: r.likes_count || 0,
                    image_url: r.image_url,
                    description: r.description || '',
                    createdAt: r.created_at
                }));
                setVisitorRecipes(mapped);

            } catch (err) {
                console.error("Error fetching public profile:", err);
            } finally {
                setLoadingVisitor(false);
            }
        }
        fetchVisitorData();
    }, [username, isOwner]);


    // --- Derived Data ---
    const displayUsername = isOwner
        ? (profile?.username || user?.user_metadata?.username || user?.email?.split('@')[0] || "Chef")
        : (visitorProfile?.username || username || "Chef");

    const displayBio = isOwner
        ? (profile?.bio || user?.user_metadata?.bio || "No bio yet")
        : (visitorProfile?.bio || "No bio yet");

    const currentRecipes = isOwner ? recipes : visitorRecipes;
    const recipeCount = isOwner
        ? (activeTab === 'saved' ? savedRecipes.length : recipes.length) // Simplify count logic?
        : visitorRecipes.length; // Visitor only sees 'recipes' tab effectively



    const getRecipesForTab = () => {
        if (!isOwner) return visitorRecipes; // Visitors only see public recipes
        if (activeTab === 'saved') return savedRecipes;
        if (activeTab === 'drafts') return [];
        return recipes;
    };

    // Filter Logic
    const filteredRecipes = getRecipesForTab().filter(recipe => {
        const query = searchQuery.toLowerCase();
        return (
            recipe.title.toLowerCase().includes(query) ||
            (recipe.tags && recipe.tags.some(tag => tag.toLowerCase().includes(query)))
        );
    });

    return (
        <Layout currentView="myRecipes" fullWidth>
            <div className="min-h-screen bg-[#f6f8f6] dark:bg-[#112116] text-[#111813] dark:text-white font-sans transition-colors duration-200">

                <div className="bg-white dark:bg-[#192b20] border-b border-gray-200 dark:border-gray-800">
                    <div className="max-w-7xl mx-auto px-6 pt-6 md:pt-8 pb-0">
                        <div className="flex flex-col gap-4 w-full">
                            <div>
                                <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-[#111813] dark:text-white font-serif flex items-center flex-wrap gap-3">
                                    <span>{displayUsername}'s Kitchen</span>
                                    <span className="text-lg md:text-xl font-medium text-[#63886f] dark:text-[#a0b3a6]">
                                        ({recipeCount} Recipes)
                                    </span>
                                    <div className="relative flex items-center">
                                        <button
                                            onClick={async () => {
                                                const url = window.location.origin + '/' + (isOwner ? (profile?.username || user?.user_metadata?.username) : (visitorProfile?.username || username));

                                                // 1. Try Native Share (Mobile)
                                                if (navigator.share) {
                                                    try {
                                                        await navigator.share({
                                                            title: `${displayUsername}'s Kitchen`,
                                                            text: `Check out ${displayUsername}'s recipes on Recipe App!`,
                                                            url: url
                                                        });
                                                        return;
                                                    } catch (err) {
                                                        console.log('Share canceled or failed', err);
                                                        // Continue to clipboard fallback if it wasn't just a cancel
                                                    }
                                                }

                                                // 2. Fallback to Clipboard (Desktop)
                                                navigator.clipboard.writeText(url).then(() => {
                                                    setShowCopied(true);
                                                    setTimeout(() => setShowCopied(false), 2000);
                                                });
                                            }}
                                            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-white/10 text-[#63886f] dark:text-[#a0b3a6] transition-colors"
                                            title="Share Kitchen"
                                        >
                                            <Share2 size={24} />
                                        </button>

                                        {/* Copied Toast / Tooltip */}
                                        <div className={`absolute left-full ml-2 px-3 py-1 bg-black text-white text-xs font-bold rounded-lg transition-all duration-200 ${showCopied ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-2 pointer-events-none'}`}>
                                            Link Copied!
                                        </div>
                                    </div>
                                </h1>
                                <p className="text-[#63886f] dark:text-[#a0b3a6] text-base md:text-lg break-words whitespace-pre-wrap mt-2">
                                    {displayBio}
                                </p>
                            </div>
                        </div>

                        {/* --- Tab Navigation --- */}
                        <div className="flex items-center mt-12">
                            <div className="flex items-center gap-8">
                                {(isOwner ? [
                                    { id: 'my_recipes', label: 'My Recipes' },
                                    { id: 'saved', label: 'Saved Collection' },
                                    { id: 'drafts', label: 'Drafts' }
                                ] : [
                                    { id: 'my_recipes', label: 'Recipes' }
                                ]).map(tab => (
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
                </div>

                {/* --- Main Content Area --- */}
                <div className="max-w-7xl mx-auto px-6 py-8">
                    {/* --- Toolbar --- */}
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

                            {isOwner && (
                                <button
                                    onClick={() => navigate('/add')}
                                    className="hidden sm:flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#111813] dark:bg-white text-white dark:text-[#111813] text-sm font-bold hover:opacity-90 transition-opacity ml-auto"
                                >
                                    <Plus className="w-4 h-4" />
                                    <span className="hidden sm:inline">New Recipe</span>
                                </button>
                            )}
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
                            <h3 className="text-lg font-bold text-[#111813] dark:text-white mb-2">
                                {activeTab === 'saved' ? 'No saved recipes yet' : 'No recipes found in your kitchen'}
                            </h3>
                            <p className="text-[#63886f] dark:text-[#a0b3a6] text-center max-w-sm mb-6">
                                {activeTab === 'saved' ? 'Bookmark recipes you like to see them here!' : 'Start cooking and add your first masterpiece!'}
                            </p>
                            <button
                                onClick={() => navigate('/add')}
                                className="px-6 py-2.5 rounded-full bg-[#17cf54] text-white font-bold hover:opacity-90 transition-opacity"
                            >
                                {activeTab === 'saved' ? 'Browse Recipes' : 'Create First Recipe'}
                            </button>
                        </div>
                    )}
                </div>

                {/* Floating Action Button (Mobile) - Owner Only */}
                {isOwner && (
                    <div className="fixed bottom-8 right-8 z-30 md:hidden">
                        <button
                            onClick={() => navigate('/add')}
                            className="flex items-center gap-2 pl-4 pr-5 py-3.5 bg-[#17cf54] text-white rounded-full shadow-lg hover:shadow-xl transition-all hover:-translate-y-0.5"
                        >
                            <Plus className="w-6 h-6" />
                            <span className="font-bold text-base tracking-wide">New</span>
                        </button>
                    </div>
                )}
            </div>
        </Layout>
    );
}
