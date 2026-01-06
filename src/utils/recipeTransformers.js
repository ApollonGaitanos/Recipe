export const toAppRecipe = (dbRecipe) => ({
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
    author_username: dbRecipe.profiles?.username || dbRecipe.author_username || '',
    likes_count: dbRecipe.likes_count || 0,
    image_url: dbRecipe.image_url,
    description: dbRecipe.description || '',
    calories: dbRecipe.calories,
    protein: dbRecipe.protein,
    carbs: dbRecipe.carbs,
    fat: dbRecipe.fat,
    createdAt: dbRecipe.created_at,
    originId: dbRecipe.origin_id || null, // Forking support
    originTitle: dbRecipe.origin_title || null,
    originAuthor: dbRecipe.origin_author_username || null
});

export const toDbRecipe = (appRecipe, userId, username) => ({
    user_id: userId,
    title: appRecipe.title,
    ingredients: appRecipe.ingredients,
    instructions: appRecipe.instructions,
    prep_time: appRecipe.prepTime,
    cook_time: appRecipe.cookTime,
    servings: appRecipe.servings,
    tags: appRecipe.tags || [],
    is_public: appRecipe.is_public || false,
    origin_id: appRecipe.originId || null,
    origin_title: appRecipe.originTitle || null,
    origin_author_username: appRecipe.originAuthor || null,
    description: appRecipe.description || null,
    calories: appRecipe.calories,
    protein: appRecipe.protein,
    carbs: appRecipe.carbs,
    fat: appRecipe.fat
    // image_url is usually handled separately via storage upload, but could be added here if passed
});
