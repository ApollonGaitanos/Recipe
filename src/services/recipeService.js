import { supabase } from '../supabaseClient';
import { toAppRecipe, toDbRecipe } from '../utils/recipeTransformers';

export const recipeService = {
    // --- READ ---
    async fetchPublicRecipes() {
        // Fetch recipes that are public OR belong to the current user (if we wanted to mix them, but usually feed is public)
        // For now, feed is ALL public recipes.
        const { data, error } = await supabase
            .from('recipes')
            .select('*, profiles(username)')
            .eq('is_public', true)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data.map(toAppRecipe);
    },

    async fetchUserRecipes(userId) {
        const { data, error } = await supabase
            .from('recipes')
            .select('*, profiles(username)')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data.map(toAppRecipe);
    },

    async fetchSavedRecipes(userId) {
        const { data, error } = await supabase
            .from('saved_recipes')
            .select('recipe_id, recipes(*, profiles(username))')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

        if (error) throw error;
        // Map the nested recipe data
        return data
            .map(item => item.recipes ? toAppRecipe(item.recipes) : null)
            .filter(Boolean);
    },

    async getById(id) {
        const { data, error } = await supabase
            .from('recipes')
            .select('*, profiles(username)')
            .eq('id', id)
            .single();

        if (error) throw error;
        return toAppRecipe(data);
    },

    // --- WRITE ---
    async create(recipeData, userId) {
        // Handle Image Upload if present (this logic might need to stay in Context or move here completely if we pass the file)
        // For now, assuming recipeData contains the image_url if already uploaded.

        const dbPayload = toDbRecipe(recipeData, userId);
        // Include image_url if it exists in the app object (it wasn't in the transformer by default to be safe)
        if (recipeData.image_url) dbPayload.image_url = recipeData.image_url;

        const { data, error } = await supabase
            .from('recipes')
            .insert([dbPayload])
            .select()
            .single();

        if (error) throw error;
        return toAppRecipe(data);
    },

    async update(id, updates, userId) {
        const dbPayload = toDbRecipe(updates, userId);
        if (updates.image_url) dbPayload.image_url = updates.image_url;

        const { data, error } = await supabase
            .from('recipes')
            .update(dbPayload)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return toAppRecipe(data);
    },

    async delete(id) {
        const { error } = await supabase
            .from('recipes')
            .delete()
            .eq('id', id);

        if (error) throw error;
        return true;
    },

    async toggleVisibility(id, isPublic) {
        const { data, error } = await supabase
            .from('recipes')
            .update({ is_public: isPublic })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return toAppRecipe(data);
    },

    // --- INTERACTIONS ---
    async fetchUserLikes(userId) {
        const { data, error } = await supabase
            .from('likes')
            .select('recipe_id')
            .eq('user_id', userId);

        if (error) throw error;
        return new Set(data.map(l => l.recipe_id));
    },

    async toggleLike(recipeId, userId, isLiked) {
        if (isLiked) {
            // Unlike
            const { error } = await supabase
                .from('likes')
                .delete()
                .eq('user_id', userId)
                .eq('recipe_id', recipeId);
            if (error) throw error;
        } else {
            // Like
            const { error } = await supabase
                .from('likes')
                .insert([{ user_id: userId, recipe_id: recipeId }]);
            if (error) throw error;
        }
    },

    async toggleSave(recipeId, userId, isSaved) {
        if (isSaved) {
            // Unsave
            const { error } = await supabase
                .from('saved_recipes')
                .delete()
                .eq('user_id', userId)
                .eq('recipe_id', recipeId);
            if (error) throw error;
        } else {
            // Save
            const { error } = await supabase
                .from('saved_recipes')
                .insert([{ user_id: userId, recipe_id: recipeId }]);
            if (error) throw error;
        }
    },

    // --- STORAGE ---
    // (Optional: Move uploadImage here too)
    async uploadImage(file, userId) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${userId}/${Date.now()}.${fileExt}`;
        const filePath = fileName;

        const { error: uploadError } = await supabase.storage
            .from('recipe-images')
            .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data } = supabase.storage
            .from('recipe-images')
            .getPublicUrl(filePath);

        return data.publicUrl;
    }
};
