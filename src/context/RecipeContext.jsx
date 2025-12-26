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
        title: dbRecipe.title,
        ingredients: dbRecipe.ingredients,
        instructions: dbRecipe.instructions,
        prepTime: dbRecipe.prep_time,
        cookTime: dbRecipe.cook_time,
        servings: dbRecipe.servings,
        tags: dbRecipe.tags || [],
        is_public: dbRecipe.is_public,
        user_id: dbRecipe.user_id,
        author_username: dbRecipe.author_username,
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

    // Initial Fetch
    useEffect(() => {
        const load = async () => {
            setLoading(true);
            await Promise.all([fetchPublicRecipes(), fetchRecipes(), fetchUserLikes()]);
            setLoading(false);
        };
        load();
    }, [user]);

    const addRecipe = async (recipe) => {
        if (user) {
            // Get username priority: metadata.username (SignUp) -> metadata.full_name -> email prefix
            const username = user.user_metadata?.username || user.user_metadata?.full_name || user.email.split('@')[0];
            const newDbRecipe = toDbRecipe(recipe, user.id, username);
            const { data, error } = await supabase
                .from('recipes')
                .insert([newDbRecipe])
                .select();

            if (!error && data) {
                setRecipes(prev => [toAppRecipe(data[0]), ...prev]);
            }
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
            // Explicitly handle is_public updates if passed
            if (updatedData.is_public !== undefined) dbUpdates.is_public = updatedData.is_public;

            // Always update author_username to current one (fixes old recipes)
            const currentUsername = user.user_metadata?.username || user.user_metadata?.full_name || user.email.split('@')[0];
            dbUpdates.author_username = currentUsername;

            const { error } = await supabase
                .from('recipes')
                .update(dbUpdates)
                .eq('id', id);

            if (!error) {
                // Refresh to ensure consistency
                await fetchRecipes();
                await fetchPublicRecipes();
            }
        }
    };

    const deleteRecipe = async (id) => {
        if (user) {
            const { error } = await supabase
                .from('recipes')
                .delete()
                .eq('id', id);

            if (!error) {
                setRecipes(prev => prev.filter(r => r.id !== id));
                setPublicRecipes(prev => prev.filter(r => r.id !== id));
            }
        }
    };

    const toggleVisibility = async (id, isPublic) => {
        if (!user) return;
        await updateRecipe(id, { is_public: !isPublic });
    };

    // Toggle Like with Sync
    const toggleLike = async (recipeId) => {
        if (!user) return; // Must be logged in

        // Optimistic Update
        const isLiked = userLikes.has(recipeId);
        setUserLikes(prev => {
            const next = new Set(prev);
            if (isLiked) next.delete(recipeId);
            else next.add(recipeId);
            return next;
        });

        try {
            if (isLiked) {
                // UNLIKE
                await supabase.from('likes').delete().eq('user_id', user.id).eq('recipe_id', recipeId);
            } else {
                // LIKE
                await supabase.from('likes').insert([{ user_id: user.id, recipe_id: recipeId }]);
            }

            // Sync counts
            await fetchPublicRecipes();
            await fetchRecipes();

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

    // Synchronous Check (Fast)
    const checkIsLiked = (recipeId) => userLikes.has(recipeId);

    // Asynchronous Check (Legacy/Backup)
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
