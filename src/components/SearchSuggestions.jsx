import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { ChefHat, User, Search, ArrowRight, Loader2 } from 'lucide-react';

export default function SearchSuggestions({ query, isVisible, onClose, onClear }) {
    const navigate = useNavigate();
    const dropdownRef = useRef(null);
    const [profiles, setProfiles] = useState([]);
    const [recipes, setRecipes] = useState([]);
    const [loading, setLoading] = useState(false);

    // Close when clicking outside
    useEffect(() => {
        function handleClickOutside(event) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                onClose();
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [onClose]);

    // Fetch Suggestions
    useEffect(() => {
        if (!isVisible || !query || query.trim().length === 0) {
            setProfiles([]);
            setRecipes([]);
            return;
        }

        const fetchSuggestions = async () => {
            setLoading(true);
            try {
                // 1. Search Profiles (RPC for unaccent support)
                const { data: profileData, error: profileError } = await supabase
                    .rpc('search_profiles_public', { search_term: query });

                if (profileError) console.error("Profile search error:", profileError);

                // 2. Search Public Recipes (RPC for unaccent support & sorting)
                const { data: recipeData, error: recipeError } = await supabase
                    .rpc('search_recipes_public', { search_term: query });

                if (recipeError) console.error("Recipe search error:", recipeError);

                setProfiles(profileData || []);
                setRecipes(recipeData || []);
            } catch (err) {
                console.error("Critical search suggestions error:", err);
            } finally {
                setLoading(false);
            }
        };

        const timeoutId = setTimeout(fetchSuggestions, 300); // Debounce
        return () => clearTimeout(timeoutId);
    }, [query, isVisible]);

    if (!isVisible || (!query && !loading)) return null;

    return (
        <div
            ref={dropdownRef}
            className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-[#1A1A1A] rounded-2xl shadow-xl border border-gray-100 dark:border-white/5 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2"
        >
            {loading ? (
                <div className="p-4 flex items-center justify-center text-gray-400">
                    <Loader2 className="animate-spin w-5 h-5 mr-2" />
                    <span className="text-sm">Searching...</span>
                </div>
            ) : profiles.length === 0 && recipes.length === 0 ? (
                <div className="p-4 text-center text-gray-500 text-sm">
                    No results found for "{query}"
                </div>
            ) : (
                <div className="py-2">
                    {/* Profiles Section */}
                    {profiles.length > 0 && (
                        <div className="mb-2">
                            <div className="px-4 py-2 text-xs font-bold text-gray-400 uppercase tracking-wider">
                                Kitchens
                            </div>
                            {profiles.map(profile => (
                                <button
                                    key={profile.id}
                                    type="button"
                                    onMouseDown={(e) => {
                                        e.preventDefault(); // Prevent focus loss
                                        navigate(`/${profile.username}`);
                                        onClose();
                                        onClear();
                                    }}
                                    className="w-full text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-white/5 flex items-center gap-3 transition-colors group"
                                >
                                    <div className="w-8 h-8 rounded-full bg-surface-hover dark:bg-white/10 flex items-center justify-center text-gray-600 dark:text-gray-300 group-hover:bg-primary group-hover:text-white transition-colors">
                                        <User size={16} />
                                    </div>
                                    <span className="text-sm font-medium text-gray-900 dark:text-gray-200 group-hover:text-primary dark:group-hover:text-white transition-colors">
                                        {profile.username}'s Kitchen
                                    </span>
                                </button>
                            ))}
                        </div>
                    )}

                    {profiles.length > 0 && recipes.length > 0 && (
                        <div className="h-px bg-gray-100 dark:bg-white/5 mx-4 my-1"></div>
                    )}

                    {/* Recipes Section */}
                    {recipes.length > 0 && (
                        <div>
                            <div className="px-4 py-2 text-xs font-bold text-gray-400 uppercase tracking-wider">
                                Recipes
                            </div>
                            {recipes.map(recipe => (
                                <button
                                    key={recipe.id}
                                    type="button"
                                    onMouseDown={(e) => {
                                        e.preventDefault(); // Prevent focus loss
                                        navigate(`/recipe/${recipe.id}`);
                                        onClose();
                                        onClear();
                                    }}
                                    className="w-full text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-white/5 flex items-center gap-3 transition-colors group"
                                >
                                    <div className="w-8 h-8 rounded-full bg-orange-50 dark:bg-orange-900/10 flex items-center justify-center text-orange-500 group-hover:bg-orange-500 group-hover:text-white transition-colors">
                                        <ChefHat size={16} />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-sm font-medium text-gray-900 dark:text-gray-200 group-hover:text-primary dark:group-hover:text-white transition-colors">
                                            {recipe.title}
                                        </span>
                                        <span className="text-xs text-gray-500 dark:text-gray-400">
                                            by {recipe.username || recipe.profiles?.username || 'Chef'}
                                        </span>
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
