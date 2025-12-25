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
    const [recipes, setRecipes] = useState([]);
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
        createdAt: dbRecipe.created_at
    });

    const toDbRecipe = (appRecipe, userId) => ({
        user_id: userId,
        title: appRecipe.title,
        ingredients: appRecipe.ingredients,
        instructions: appRecipe.instructions,
        prep_time: appRecipe.prepTime,
        cook_time: appRecipe.cookTime,
        servings: appRecipe.servings,
        tags: appRecipe.tags
    });

    // Fetch recipes effect
    useEffect(() => {
        const fetchRecipes = async () => {
            setLoading(true);
            if (user) {
                // Cloud Mode
                const { data, error } = await supabase
                    .from('recipes')
                    .select('*')
                    .order('created_at', { ascending: false });

                if (!error && data) {
                    setRecipes(data.map(toAppRecipe));
                }
            } else {
                // Local Mode
                const saved = localStorage.getItem('recipes');
                setRecipes(saved ? JSON.parse(saved) : []);
            }
            setLoading(false);
        };

        fetchRecipes();
    }, [user]);

    // Save to LocalStorage whenever recipes change (only for guest mode)
    useEffect(() => {
        if (!user && !loading) {
            localStorage.setItem('recipes', JSON.stringify(recipes));
        }
    }, [recipes, user, loading]);

    const addRecipe = async (recipe) => {
        if (user) {
            // Cloud Add
            const newDbRecipe = toDbRecipe(recipe, user.id);
            const { data, error } = await supabase
                .from('recipes')
                .insert([newDbRecipe])
                .select();

            if (!error && data) {
                setRecipes(prev => [toAppRecipe(data[0]), ...prev]);
            }
        } else {
            // Local Add
            const newRecipe = {
                id: uuidv4(),
                createdAt: new Date().toISOString(),
                ...recipe
            };
            setRecipes(prev => [newRecipe, ...prev]);
        }
    };

    const updateRecipe = async (id, updatedData) => {
        if (user) {
            // Cloud Update
            // We map the partial updates to db format
            const dbUpdates = {};
            if (updatedData.title) dbUpdates.title = updatedData.title;
            if (updatedData.ingredients) dbUpdates.ingredients = updatedData.ingredients;
            if (updatedData.instructions) dbUpdates.instructions = updatedData.instructions;
            if (updatedData.prepTime) dbUpdates.prep_time = updatedData.prepTime;
            if (updatedData.cookTime) dbUpdates.cook_time = updatedData.cookTime;
            if (updatedData.servings) dbUpdates.servings = updatedData.servings;
            if (updatedData.tags) dbUpdates.tags = updatedData.tags;

            const { error } = await supabase
                .from('recipes')
                .update(dbUpdates)
                .eq('id', id);

            if (!error) {
                setRecipes(prev => prev.map(r => r.id === id ? { ...r, ...updatedData } : r));
            }
        } else {
            // Local Update
            setRecipes(prev => prev.map(r => r.id === id ? { ...r, ...updatedData } : r));
        }
    };

    const deleteRecipe = async (id) => {
        if (user) {
            // Cloud Delete
            const { error } = await supabase
                .from('recipes')
                .delete()
                .eq('id', id);

            if (!error) {
                setRecipes(prev => prev.filter(r => r.id !== id));
            }
        } else {
            // Local Delete
            setRecipes(prev => prev.filter(r => r.id !== id));
        }
    };

    return (
        <RecipeContextData.Provider value={{ recipes, addRecipe, updateRecipe, deleteRecipe, loading }}>
            {children}
        </RecipeContextData.Provider>
    );
}
