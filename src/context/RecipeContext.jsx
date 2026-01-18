/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
// import { v4 as uuidv4 } from 'uuid';
// import { supabase } from '../supabaseClient'; // REMOVED: Now using service
import { useAuth } from './AuthContext';
import { useLanguage } from './LanguageContext';
import { recipeService } from '../services/recipeService';

const RecipeContextData = createContext();

export function useRecipes() {
    return useContext(RecipeContextData);
}

export default function RecipeContext({ children }) {
    const { user } = useAuth();
    const { t } = useLanguage();
    const [recipes, setRecipes] = useState([]); // My Recipes
    const [publicRecipes, setPublicRecipes] = useState([]); // Public Feed
    const [userLikes, setUserLikes] = useState(new Set()); // Set of liked recipe IDs
    const [savedRecipes, setSavedRecipes] = useState([]); // Saved Recipes
    const [savedRecipeIds, setSavedRecipeIds] = useState(new Set()); // Set of saved recipe IDs
    const [searchQuery, setSearchQuery] = useState(""); // Global Search
    const [loading, setLoading] = useState(true);

    // --- FETCH DATA ---

    const fetchUserLikes = useCallback(async () => {
        if (!user) {
            setUserLikes(new Set());
            return;
        }
        try {
            const likesSet = await recipeService.fetchUserLikes(user.id);
            setUserLikes(likesSet);
        } catch (error) {
            console.error("Error fetching likes:", error);
        }
    }, [user]);

    const fetchSavedRecipes = useCallback(async () => {
        if (!user) {
            setSavedRecipes([]);
            setSavedRecipeIds(new Set());
            return;
        }
        try {
            const savedList = await recipeService.fetchSavedRecipes(user.id);
            setSavedRecipes(savedList);
            setSavedRecipeIds(new Set(savedList.map(r => r.id)));
        } catch (error) {
            console.error("Error fetching saved recipes:", error);
        }
    }, [user]);

    const fetchRecipes = useCallback(async () => {
        if (!user) {
            setRecipes([]);
            return;
        }
        try {
            const myRecipes = await recipeService.fetchUserRecipes(user.id);
            setRecipes(myRecipes);
        } catch (error) {
            console.error("Error fetching user recipes:", error);
        }
    }, [user]);

    const fetchPublicRecipes = useCallback(async () => {
        try {
            const pubRecipes = await recipeService.fetchPublicRecipes();
            setPublicRecipes(pubRecipes);
        } catch (error) {
            console.error("Error fetching public recipes:", error);
        }
    }, []);

    // Initial Load
    useEffect(() => {
        const loadAll = async () => {
            setLoading(true);
            await Promise.all([
                fetchPublicRecipes(),
                fetchRecipes(),
                fetchUserLikes(),
                fetchSavedRecipes()
            ]);
            setLoading(false);
        };
        loadAll();
    }, [user, fetchPublicRecipes, fetchRecipes, fetchUserLikes, fetchSavedRecipes]);


    // --- ACTIONS ---

    const addRecipe = async (recipeData) => {
        if (!user) return;
        try {
            let imageUrl = recipeData.image;

            // Handle Image Upload
            if (recipeData.image instanceof File) {
                imageUrl = await recipeService.uploadImage(recipeData.image, user.id);
            }

            // Create
            const newRecipe = await recipeService.create({ ...recipeData, image_url: imageUrl }, user.id);

            // Update State
            setRecipes(prev => [newRecipe, ...prev]);
            if (newRecipe.is_public) {
                setPublicRecipes(prev => [newRecipe, ...prev]);
            }
            return newRecipe;
        } catch (error) {
            console.error("Error adding recipe:", error);
            throw error;
        }
    };

    const updateRecipe = async (id, updatedData) => {
        try {
            let imageUrl = updatedData.image; // Assume existing URL

            // Handle New Image Upload
            if (updatedData.image instanceof File) {
                imageUrl = await recipeService.uploadImage(updatedData.image, user.id);
            }

            // Clean up data for update provided to service
            const updatePayload = { ...updatedData };
            if (imageUrl) updatePayload.image_url = imageUrl;
            delete updatePayload.image; // Remove file object

            const updatedRecipe = await recipeService.update(id, updatePayload, user.id);

            // Update DOM
            setRecipes(prev => prev.map(r => r.id === id ? updatedRecipe : r));
            setPublicRecipes(prev => prev.map(r => r.id === id ? updatedRecipe : r));
            // Also update saved if necessary
            setSavedRecipes(prev => prev.map(r => r.id === id ? updatedRecipe : r));

        } catch (error) {
            console.error("Error updating recipe:", error);
            throw error;
        }
    };

    const deleteRecipe = async (id) => {
        try {
            await recipeService.delete(id);

            setRecipes(prev => prev.filter(r => r.id !== id));
            setPublicRecipes(prev => prev.filter(r => r.id !== id));
            setSavedRecipes(prev => prev.filter(r => r.id !== id));
            setSavedRecipeIds(prev => {
                const next = new Set(prev);
                next.delete(id);
                return next;
            });
        } catch (error) {
            console.error("Error deleting recipe:", error);
            throw error;
        }
    };

    const toggleVisibility = async (id, isPublic) => {
        try {
            const updated = await recipeService.toggleVisibility(id, isPublic);

            setRecipes(prev => prev.map(r => r.id === id ? updated : r));

            if (isPublic) {
                // It BECAME public -> Add to feed (or update if already there)
                setPublicRecipes(prev => {
                    if (prev.find(r => r.id === id)) return prev.map(r => r.id === id ? updated : r);
                    return [updated, ...prev];
                });
            } else {
                // It became PRIVATE -> Remove from feed
                setPublicRecipes(prev => prev.filter(r => r.id !== id));
            }
            return updated;
        } catch (error) {
            console.error("Error toggling visibility:", error);
            throw error;
        }
    };

    const toggleLike = async (recipeId) => {
        if (!user) return; // Prompt login in UI

        const isLiked = userLikes.has(recipeId);

        // 1. Optimistic Update for UI (Immediate feedback)
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
                likes_count: isLiked ? Math.max(0, r.likes_count - 1) : r.likes_count + 1
            };
        };

        setRecipes(prev => prev.map(updateCount));
        setPublicRecipes(prev => prev.map(updateCount));
        setSavedRecipes(prev => prev.map(updateCount));

        // 3. API Call
        try {
            await recipeService.toggleLike(recipeId, user.id, isLiked);
        } catch (error) {
            console.error("Error toggling like:", error);
            // Revert on error
            setUserLikes(prev => {
                const next = new Set(prev);
                if (isLiked) next.add(recipeId); // Re-add if we failed to delete
                else next.delete(recipeId); // Delete if we failed to add
                return next;
            });
            // Revert Counts
            const revertCount = (r) => {
                if (r.id !== recipeId) return r;
                return {
                    ...r,
                    likes_count: isLiked ? r.likes_count + 1 : Math.max(0, r.likes_count - 1)
                };
            };
            setRecipes(prev => prev.map(revertCount));
            setPublicRecipes(prev => prev.map(revertCount));
            setSavedRecipes(prev => prev.map(revertCount));
        }
    };

    const toggleSave = async (recipe) => {
        if (!user) return;

        const isSaved = savedRecipeIds.has(recipe.id);

        // Optimistic UI
        setSavedRecipeIds(prev => {
            const next = new Set(prev);
            if (isSaved) next.delete(recipe.id);
            else next.add(recipe.id);
            return next;
        });

        if (isSaved) {
            setSavedRecipes(prev => prev.filter(r => r.id !== recipe.id));
        } else {
            setSavedRecipes(prev => [recipe, ...prev]);
        }

        try {
            await recipeService.toggleSave(recipe.id, user.id, isSaved);
        } catch (error) {
            console.error("Error toggling save:", error);
            // Revert
            setSavedRecipeIds(prev => {
                const next = new Set(prev);
                if (isSaved) next.add(recipe.id);
                else next.delete(recipe.id);
                return next;
            });
            if (isSaved) {
                setSavedRecipes(prev => [recipe, ...prev]);
            } else {
                setSavedRecipes(prev => prev.filter(r => r.id !== recipe.id));
            }
        }
    };

    const duplicateRecipe = async (originalRecipe) => {
        if (!user) return;
        try {
            const newRecipeData = {
                ...originalRecipe,
                title: `${originalRecipe.title} (Copy)`,
                is_public: false,
                originId: originalRecipe.originId || originalRecipe.id,
                originTitle: originalRecipe.originTitle || originalRecipe.title,
                originAuthor: originalRecipe.originAuthor || originalRecipe.author_username
            };
            delete newRecipeData.id;
            delete newRecipeData.createdAt;

            const newRecipe = await addRecipe(newRecipeData);
            return newRecipe;
        } catch (error) {
            console.error("Error duplicating recipe:", error);
            throw error;
        }
    };

    const isRecipeSaved = (recipeId) => savedRecipeIds.has(recipeId);

    // Check if liked (helper)
    const hasUserLiked = (recipeId) => userLikes.has(recipeId);


    return (
        <RecipeContextData.Provider value={{
            recipes,
            publicRecipes,
            userLikes,
            savedRecipes,
            addRecipe,
            updateRecipe,
            deleteRecipe,
            toggleVisibility,
            toggleLike,
            hasUserLiked,
            toggleSave,
            isRecipeSaved,
            loading,
            searchQuery,
            setSearchQuery,
            duplicateRecipe,
            fetchPublicRecipes,
            fetchRecipes,
            fetchSavedRecipes,
            fetchUserLikes
        }}>
            {children}
        </RecipeContextData.Provider>
    );
}
