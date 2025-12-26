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

        // SUBSCRIPTION 1: Content Updates (Likes, Edits on VISIBLE recipes)
        // This handles "Like Count" increments live.
        // We use a separate channel to avoid conflicts.
        const contentChannel = supabase
            .channel('public:recipes:content')
            .on(
                'postgres_changes',
                { event: 'UPDATE', schema: 'public', table: 'recipes' },
                (payload) => {
                    // We trust this payload for basic fields like likes_count if we already have the recipe
                    // and if RLS allowed us to receive it.
                    const newRecord = payload.new;
                    const targetId = newRecord.id;

                    // Update in place if exists
                    // (toAppRecipe handles nulls safely now)
                    setPublicRecipes(prev => prev.map(r => r.id === targetId ? { ...r, ...toAppRecipe(newRecord) } : r));
                    setRecipes(prev => prev.map(r => r.id === targetId ? { ...r, ...toAppRecipe(newRecord) } : r));
                }
            )
            .subscribe();

        // SUBSCRIPTION 2: Visibility Signals (Add/Remove from Feed)
        // This guarantees we know when something goes Private, even if RLS hides the main record event.
        // Requires 'recipe_signals' table to exist.
        const signalChannel = supabase
            .channel('public:recipe_signals')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'recipe_signals' },
                async (payload) => {
                    const { eventType, new: newSig, old: oldSig } = payload;

                    if (eventType === 'DELETE') {
                        // Signal deleted -> Remove Recipe from Feed
                        const targetId = oldSig.recipe_id;
                        setPublicRecipes(prev => prev.filter(r => r.id !== targetId));
                        // Don't remove from My Recipes (deletion handled by recipes channel or explicit manual refresh if critical)
                        return;
                    }

                    const targetId = newSig.recipe_id;
                    const isPublic = newSig.is_public;

                    if (!isPublic) {
                        // Became Private -> Remove from Public Feed
                        setPublicRecipes(prev => prev.filter(r => r.id !== targetId));
                    } else {
                        // Became Public (or is Public) -> Fetch & Ensure it's in Feed
                        // We fetch because the signal table doesn't have the recipe content.
                        const { data, error } = await supabase
                            .from('recipes')
                            .select('*')
                            .eq('id', targetId)
                            .single();

                        // If we can fetch it (RLS allows), add/update it
                        if (!error && data) {
                            const appRecipe = toAppRecipe(data);
                            setPublicRecipes(prev => {
                                const exists = prev.find(r => r.id === targetId);
                                return exists
                                    ? prev.map(r => r.id === targetId ? appRecipe : r)
                                    : [appRecipe, ...prev];
                            });

                            // Update My Recipes too if I own it
                            if (user && appRecipe.user_id === user.id) {
                                setRecipes(prev => {
                                    const exists = prev.find(r => r.id === targetId);
                                    return exists
                                        ? prev.map(r => r.id === targetId ? appRecipe : r)
                                        : [appRecipe, ...prev];
                                });
                            }
                        }
                    }
                }
            )
            .subscribe();

        // SUBSCRIPTION 3: Deletions (Real Deletions from Recipes table)
        // We still need this because deleting a recipe deletes the signal cascade, 
        // but listening to 'recipes' DELETE is direct and standard.
        const deleteChannel = supabase
            .channel('public:recipes:delete')
            .on(
                'postgres_changes',
                { event: 'DELETE', schema: 'public', table: 'recipes' },
                (payload) => {
                    const oldRecord = payload.old;
                    setPublicRecipes(prev => prev.filter(r => r.id !== oldRecord.id));
                    setRecipes(prev => prev.filter(r => r.id !== oldRecord.id));
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(contentChannel);
            supabase.removeChannel(signalChannel);
            supabase.removeChannel(deleteChannel);
        };
    }, [user]);

    const addRecipe = async (recipe) => {
        if (user) {
            const username = user.user_metadata?.username || user.user_metadata?.full_name || user.email.split('@')[0];
            const newDbRecipe = toDbRecipe(recipe, user.id, username);
            await supabase.from('recipes').insert([newDbRecipe]).select();
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

            await supabase.from('recipes').update(dbUpdates).eq('id', id);
        }
    };

    const deleteRecipe = async (id) => {
        if (user) {
            await supabase.from('recipes').delete().eq('id', id);
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
