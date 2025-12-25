import React, { createContext, useState, useEffect, useContext } from 'react';
import { v4 as uuidv4 } from 'uuid';

const RecipeContextData = createContext();

export function useRecipes() {
    return useContext(RecipeContextData);
}

export default function RecipeContext({ children }) {
    const [recipes, setRecipes] = useState(() => {
        const saved = localStorage.getItem('recipes');
        return saved ? JSON.parse(saved) : [];
    });

    useEffect(() => {
        localStorage.setItem('recipes', JSON.stringify(recipes));
    }, [recipes]);

    const addRecipe = (recipe) => {
        const newRecipe = {
            id: uuidv4(),
            createdAt: new Date().toISOString(),
            ...recipe
        };
        setRecipes(prev => [newRecipe, ...prev]);
    };

    const updateRecipe = (id, updatedData) => {
        setRecipes(prev => prev.map(r => r.id === id ? { ...r, ...updatedData } : r));
    };

    const deleteRecipe = (id) => {
        setRecipes(prev => prev.filter(r => r.id !== id));
    };

    return (
        <RecipeContextData.Provider value={{ recipes, addRecipe, updateRecipe, deleteRecipe }}>
            {children}
        </RecipeContextData.Provider>
    );
}
