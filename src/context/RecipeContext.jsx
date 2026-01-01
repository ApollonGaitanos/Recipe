/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useState, useEffect, useContext } from 'react';
// import { v4 as uuidv4 } from 'uuid';
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
    const [searchQuery, setSearchQuery] = useState(""); // Global Search
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
        image_url: dbRecipe.image_url,
        description: dbRecipe.description || '',
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
        tags: appRecipe.tags || [],
        is_public: appRecipe.is_public || false,
        // image_url: appRecipe.image_url || null,
        // description: appRecipe.description || null, // Column missing in DB
        // author_username: username || null
    });

    // ... (rest of file)

    const addRecipe = async (recipeData) => {
        if (!user) return;

        console.log("Adding Recipe (App Data):", recipeData);

        const currentUsername = user.user_metadata?.username || user.user_metadata?.full_name || user.email.split('@')[0];
        const newDbRecipe = toDbRecipe(recipeData, user.id, currentUsername);

        console.log("Adding Recipe (DB Data - PRE-INSERT):", newDbRecipe);

        // Optimistic Update
        const tempId = Date.now().toString();
        const tempRecipe = { ...toAppRecipe({ ...newDbRecipe, id: tempId, created_at: new Date().toISOString() }), id: tempId };
        setRecipes(prev => [tempRecipe, ...prev]);

        try {
            const { data, error } = await supabase
                .from('recipes')
                .insert([newDbRecipe])
                .select()
                .single();

            if (error) throw error;

            console.log("Supabase Insert Success:", data);

            // Replace temp with real
            const realRecipe = toAppRecipe(data);
            setRecipes(prev => prev.map(r => r.id === tempId ? realRecipe : r));
            setPublicRecipes(prev => [realRecipe, ...prev]); // Add to public feed too if applicable? Logic might vary but safe to add
        } catch (err) {
            console.error("Error adding recipe:", err);
            // Rollback
            setRecipes(prev => prev.filter(r => r.id !== tempId));
            throw err; // Propagate to form
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
            // if (updatedData.image_url) dbUpdates.image_url = updatedData.image_url;
            // if (updatedData.description) dbUpdates.description = updatedData.description; // Column missing in DB
            if (updatedData.is_public !== undefined) dbUpdates.is_public = updatedData.is_public;

            const currentUsername = user.user_metadata?.username || user.user_metadata?.full_name || user.email.split('@')[0];
            // dbUpdates.author_username = currentUsername;

            // Optimistic Update
            setRecipes(prev => prev.map(r => r.id === id ? { ...r, ...updatedData } : r));
            setPublicRecipes(prev => prev.map(r => r.id === id ? { ...r, ...updatedData } : r));

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

        // 1. Optimistic Update for UserLikes Set
        const isLiked = userLikes.has(recipeId);
        setUserLikes(prev => {
            const next = new Set(prev);
            if (isLiked) next.delete(recipeId);
            else next.add(recipeId);
            return next;
        });

        // 2. Optimistic Update for Like Count (UI Feedback)
        const updateCount = (r) => {
            if (r.id !== recipeId) return r;
            return {
                ...r,
                likes_count: Math.max(0, r.likes_count + (isLiked ? -1 : 1))
            };
        };

        setRecipes(prev => prev.map(updateCount));
        setPublicRecipes(prev => prev.map(updateCount));

        try {
            if (isLiked) {
                await supabase.from('likes').delete().eq('user_id', user.id).eq('recipe_id', recipeId);
            } else {
                await supabase.from('likes').insert([{ user_id: user.id, recipe_id: recipeId }]);
            }
        } catch (err) {
            console.error("Like toggle failed", err);
            // Revert UserLikes
            setUserLikes(prev => {
                const next = new Set(prev);
                if (isLiked) next.add(recipeId);
                else next.delete(recipeId);
                return next;
            });
            // Revert Counts
            const revertCount = (r) => {
                if (r.id !== recipeId) return r;
                return {
                    ...r,
                    likes_count: Math.max(0, r.likes_count + (isLiked ? 1 : -1))
                };
            };
            setRecipes(prev => prev.map(revertCount));
            setPublicRecipes(prev => prev.map(revertCount));
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
            searchQuery,
            setSearchQuery,
            loading
        }}>
            {children}
        </RecipeContextData.Provider>
    );
}
