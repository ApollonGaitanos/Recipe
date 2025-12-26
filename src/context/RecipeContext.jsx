import React, { createContext, useState, useEffect, useContext } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { supabase } from '../supabaseClient';
import { useAuth } from './AuthContext';

const RecipeContextData = createContext();

export function useRecipes() {
    return useContext(RecipeContextData);
}

export default function RecipeContext({ children }) {
    const { user } = useAuth();
    const [recipes, setRecipes] = useState([]); // My Recipes
    const [publicRecipes, setPublicRecipes] = useState([]); // Public Feed
    const [userLikes, setUserLikes] = useState(new Set()); // Set of liked recipe IDs
    const [loading, setLoading] = useState(true);

    // Helpers to convert between App (camelCase) and DB (snake_case)
    const toAppRecipe = (dbRecipe) => ({
        id: dbRecipe.id,
        title: dbRecipe.title || '',
        ingredients: dbRecipe.ingredients || '',
        instructions: dbRecipe.instructions || '',
        prepTime: dbRecipe.prep_time || 0,
        cookTime: dbRecipe.cook_time || 0,
        servings: dbRecipe.servings || 0,
        tags: dbRecipe.tags || [],
        is_public: !!dbRecipe.is_public,
        user_id: dbRecipe.user_id,
        author_username: dbRecipe.author_username || '',
        likes_count: dbRecipe.likes_count || 0,
        createdAt: dbRecipe.created_at
    });

    const toDbRecipe = (appRecipe, userId, username) => ({
        user_id: userId,
        title: appRecipe.title,
        ingredients: appRecipe.ingredients,
        instructions: appRecipe.instructions,
        prep_time: appRecipe.prepTime,
        cook_time: appRecipe.cookTime,
        servings: appRecipe.servings,
        tags: appRecipe.tags,
        is_public: appRecipe.is_public || false,
        author_username: username
    });

    // Fetch User Likes
    const fetchUserLikes = async () => {
        if (!user) {
            setUserLikes(new Set());
            return;
        }
        const { data, error } = await supabase
            .from('likes')
            .select('recipe_id')
            .eq('user_id', user.id);

        if (!error && data) {
            setUserLikes(new Set(data.map(l => l.recipe_id)));
        }
    };

    // Fetch My Recipes
    const fetchRecipes = async () => {
        if (user) {
            const { data, error } = await supabase
                .from('recipes')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });

            if (!error && data) {
                setRecipes(data.map(toAppRecipe));
            }
        } else {
            setRecipes([]);
        }
    };

    // Fetch Public Recipes
    const fetchPublicRecipes = async () => {
        const { data, error } = await supabase
            .from('recipes')
            .select('*')
            .eq('is_public', true)
            .order('created_at', { ascending: false });

        if (!error && data) {
            setPublicRecipes(data.map(toAppRecipe));
        }
    };

    // Initial Fetch & Real-time Subscription
    useEffect(() => {
        const load = async () => {
            setLoading(true);
            await Promise.all([fetchPublicRecipes(), fetchRecipes(), fetchUserLikes()]);
            setLoading(false);
        };
        load();

        // Helper to fetch valid full recipe data on event
        // This avoids issues with partial updates or missing columns in Realtime payload
        const handleRealtimeEvent = async (id, eventType) => {
            if (eventType === 'DELETE') {
                // Instant local removal
                setPublicRecipes(prev => prev.filter(r => r.id !== id));
                setRecipes(prev => prev.filter(r => r.id !== id));
                return;
            }

            // For INSERT/UPDATE, fetch fresh valid data
            const { data, error } = await supabase
                .from('recipes')
                .select('*')
                .eq('id', id)
                .single();

            if (!error && data) {
                const appRecipe = toAppRecipe(data);

                // Update Public Feed
                setPublicRecipes(prev => {
                    const exists = prev.find(r => r.id === appRecipe.id);
                    if (appRecipe.is_public) {
                        // Update existing or Add new
                        return exists
                            ? prev.map(r => r.id === appRecipe.id ? appRecipe : r)
                            : [appRecipe, ...prev];
                    } else {
                        // Remove if it became private
                        return prev.filter(r => r.id !== appRecipe.id);
                    }
                });

                // Update My Recipes
                // Only if I own it (verified by appRecipe.user_id matching user.id)
                if (user && appRecipe.user_id === user.id) {
                    setRecipes(prev => {
                        const exists = prev.find(r => r.id === appRecipe.id);
                        return exists
                            ? prev.map(r => r.id === appRecipe.id ? appRecipe : r)
                            : [appRecipe, ...prev];
                    });
                }
            }
        };

        const channel = supabase
            .channel('public:recipes')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'recipes' },
                (payload) => {
                    // Trigger fetch-based update
                    // Use new.id or old.id depending on event
                    const targetId = payload.new?.id || payload.old?.id;
                    if (targetId) {
                        handleRealtimeEvent(targetId, payload.eventType);
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [user]);

    const addRecipe = async (recipe) => {
        if (user) {
            const username = user.user_metadata?.username || user.user_metadata?.full_name || user.email.split('@')[0];
            const newDbRecipe = toDbRecipe(recipe, user.id, username);
            const { data, error } = await supabase
                .from('recipes')
                .insert([newDbRecipe])
                .select();
            // No local update needed, Realtime+Fetch handles it
        }
    };

    const updateRecipe = async (id, updatedData) => {
        if (user) {
            const dbUpdates = {};
            if (updatedData.title) dbUpdates.title = updatedData.title;
            if (updatedData.ingredients) dbUpdates.ingredients = updatedData.ingredients;
            if (updatedData.instructions) dbUpdates.instructions = updatedData.instructions;
            if (updatedData.prepTime) dbUpdates.prep_time = updatedData.prepTime;
            if (updatedData.cookTime) dbUpdates.cook_time = updatedData.cookTime;
            if (updatedData.servings) dbUpdates.servings = updatedData.servings;
            if (updatedData.tags) dbUpdates.tags = updatedData.tags;
            if (updatedData.is_public !== undefined) dbUpdates.is_public = updatedData.is_public;

            const currentUsername = user.user_metadata?.username || user.user_metadata?.full_name || user.email.split('@')[0];
            dbUpdates.author_username = currentUsername;

            const { error } = await supabase
                .from('recipes')
                .update(dbUpdates)
                .eq('id', id);
        }
    };

    const deleteRecipe = async (id) => {
        if (user) {
            const { error } = await supabase
                .from('recipes')
                .delete()
                .eq('id', id);
        }
    };

    const toggleVisibility = async (id, isPublic) => {
        if (!user) return;
        await updateRecipe(id, { is_public: !isPublic });
    };

    const toggleLike = async (recipeId) => {
        if (!user) return;

        // Optimistic Update for UserLikes Set
        const isLiked = userLikes.has(recipeId);
        setUserLikes(prev => {
            const next = new Set(prev);
            if (isLiked) next.delete(recipeId);
            else next.add(recipeId);
            return next;
        });

        try {
            if (isLiked) {
                await supabase.from('likes').delete().eq('user_id', user.id).eq('recipe_id', recipeId);
            } else {
                await supabase.from('likes').insert([{ user_id: user.id, recipe_id: recipeId }]);
            }
        } catch (err) {
            console.error("Like toggle failed", err);
            // Revert on error
            setUserLikes(prev => {
                const next = new Set(prev);
                if (isLiked) next.add(recipeId);
                else next.delete(recipeId);
                return next;
            });
        }
    };

    const checkIsLiked = (recipeId) => userLikes.has(recipeId);

    const hasUserLiked = async (recipeId) => {
        return userLikes.has(recipeId);
    };

    return (
        <RecipeContextData.Provider value={{
            recipes,
            publicRecipes,
            addRecipe,
            updateRecipe,
            deleteRecipe,
            toggleVisibility,
            toggleLike,
            checkIsLiked,
            hasUserLiked,
            loading
        }}>
            {children}
        </RecipeContextData.Provider>
    );
}
