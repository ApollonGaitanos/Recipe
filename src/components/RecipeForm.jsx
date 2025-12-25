import React, { useState, useEffect } from 'react';
import { Save, X } from 'lucide-react';
import { useRecipes } from '../context/RecipeContext';
import { useLanguage } from '../context/LanguageContext';

export default function RecipeForm({ recipeId, onSave, onCancel }) {
    const { recipes, addRecipe, updateRecipe } = useRecipes();
    const { t } = useLanguage();

    const [formData, setFormData] = useState({
        title: '',
        ingredients: '',
        instructions: '',
        prepTime: '',
        cookTime: '',
        servings: '',
        tags: ''
    });

    useEffect(() => {
        if (recipeId) {
            const recipe = recipes.find(r => r.id === recipeId);
            if (recipe) {
                setFormData({
                    ...recipe,
                    tags: recipe.tags ? recipe.tags.join(', ') : ''
                });
            }
        }
    }, [recipeId, recipes]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const recipeData = {
            ...formData,
            tags: formData.tags.split(',').map(t => t.trim()).filter(Boolean),
            prepTime: Number(formData.prepTime) || 0,
            cookTime: Number(formData.cookTime) || 0,
            servings: Number(formData.servings) || 1
        };

        if (recipeId) {
            updateRecipe(recipeId, recipeData);
        } else {
            addRecipe(recipeData);
        }
        onSave();
    };

    return (
        <form onSubmit={handleSubmit} className="recipe-form">
            <div className="form-header">
                <h2 className="title" style={{ marginBottom: 0 }}>
                    {recipeId ? t('editRecipe') : t('newRecipe')}
                </h2>
                <div className="form-actions">
                    <button type="button" className="btn-secondary" onClick={onCancel}>
                        <X size={20} /> {t('cancel')}
                    </button>
                    <button type="submit" className="btn-primary">
                        <Save size={20} /> {t('saveRecipe')}
                    </button>
                </div>
            </div>

            <div className="form-group">
                <label>{t('recipeTitle')}</label>
                <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    placeholder={t('placeholders.title')}
                    required
                    autoFocus
                />
            </div>

            <div className="form-row">
                <div className="form-group">
                    <label>{t('prepTimeLabel')}</label>
                    <input type="number" name="prepTime" value={formData.prepTime} onChange={handleChange} placeholder="15" />
                </div>
                <div className="form-group">
                    <label>{t('cookTimeLabel')}</label>
                    <input type="number" name="cookTime" value={formData.cookTime} onChange={handleChange} placeholder="45" />
                </div>
                <div className="form-group">
                    <label>{t('servingsLabel')}</label>
                    <input type="number" name="servings" value={formData.servings} onChange={handleChange} placeholder="4" />
                </div>
            </div>

            <div className="form-group">
                <label>{t('ingredientsLabel')}</label>
                <textarea
                    name="ingredients"
                    value={formData.ingredients}
                    onChange={handleChange}
                    rows={8}
                    placeholder={t('placeholders.ingredients')}
                />
            </div>

            <div className="form-group">
                <label>{t('instructionsLabel')}</label>
                <textarea
                    name="instructions"
                    value={formData.instructions}
                    onChange={handleChange}
                    rows={8}
                    placeholder={t('placeholders.instructions')}
                />
            </div>

            <div className="form-group">
                <label>{t('tagsLabel')}</label>
                <input
                    type="text"
                    name="tags"
                    value={formData.tags}
                    onChange={handleChange}
                    placeholder={t('placeholders.tags')}
                />
            </div>
        </form>
    );
}
