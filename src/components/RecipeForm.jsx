import React, { useState, useEffect } from 'react';
import { Save, X, Sparkles, Lock, Globe, Scale } from 'lucide-react';
import { useRecipes } from '../context/RecipeContext';
import { useLanguage } from '../context/LanguageContext';
import MagicImportModal from './MagicImportModal';
import VisibilityModal from './VisibilityModal';
import PortionScalingModal from './PortionScalingModal';

// Note: RecipeForm now purely handles form state and validation.
// Persistence is delegated to the onSave prop.
export default function RecipeForm({ recipeId, onSave, onCancel }) {
    const { recipes } = useRecipes(); // Only read recipes for initial state if editing
    const { t } = useLanguage();
    const [showMagicImport, setShowMagicImport] = useState(false);
    const [showVisibilityModal, setShowVisibilityModal] = useState(false);
    const [showPortionScaling, setShowPortionScaling] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    const [formData, setFormData] = useState({
        title: '',
        prepTime: '',
        cookTime: '',
        servings: '',
        ingredients: '',
        instructions: '',
        tags: '', // stored as string for input
        is_public: false // Default to private
    });

    useEffect(() => {
        if (recipeId) {
            const recipe = recipes.find(r => r.id === recipeId);
            if (recipe) {
                setFormData({
                    ...recipe,
                    tags: recipe.tags ? recipe.tags.join(', ') : '',
                    is_public: recipe.is_public || false
                });
            }
        }
    }, [recipeId, recipes]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSaving(true);

        const recipeData = {
            ...formData,
            tags: formData.tags.split(',').map(tag => tag.trim()).filter(t => t),
            prepTime: Number(formData.prepTime) || 0,
            cookTime: Number(formData.cookTime) || 0,
            servings: Number(formData.servings) || 1,
            is_public: formData.is_public
        };

        try {
            // Await the onSave callback (which calls App.jsx -> Context)
            await onSave(recipeData);
        } catch (error) {
            console.error("Failed to save recipe:", error);
            // Optionally set error state here
        } finally {
            setIsSaving(false);
        }
    };

    const handleMagicImport = (data) => {
        setFormData(prev => ({
            ...prev,
            title: data.title || prev.title,
            prepTime: data.prepTime || prev.prepTime,
            cookTime: data.cookTime || prev.cookTime,
            servings: data.servings || prev.servings,
            ingredients: data.ingredients || prev.ingredients,
            instructions: data.instructions || prev.instructions
        }));
    };

    const handleVisibilityChange = (isPublic) => {
        if (isPublic) {
            // Switching to Public -> Require Confirmation
            setShowVisibilityModal(true);
        } else {
            // Switching to Private -> Instant
            setFormData(prev => ({ ...prev, is_public: false }));
        }
    };

    const handlePortionScaling = (scaledIngredients, newServings) => {
        setFormData(prev => ({
            ...prev,
            ingredients: scaledIngredients,
            servings: newServings
        }));
    };

    return (
        <div className="recipe-form-container">
            <MagicImportModal
                isOpen={showMagicImport}
                onClose={() => setShowMagicImport(false)}
                onImport={handleMagicImport}
            />

            <VisibilityModal
                isOpen={showVisibilityModal}
                onClose={() => setShowVisibilityModal(false)}
                onConfirm={() => setFormData(prev => ({ ...prev, is_public: true }))}
                isMakingPublic={true}
            />

            <PortionScalingModal
                isOpen={showPortionScaling}
                onClose={() => setShowPortionScaling(false)}
                currentServings={Number(formData.servings) || 1}
                currentIngredients={formData.ingredients}
                onScaleComplete={handlePortionScaling}
            />

            <form onSubmit={handleSubmit} className="recipe-form">
                <div className="form-header">
                    <h2 className="title" style={{ marginBottom: 0 }}>
                        {recipeId ? t('editRecipe') : t('newRecipe')}
                    </h2>
                    <div className="form-actions">
                        {/* Magic Import Button */}
                        <button
                            type="button"
                            className="btn-secondary"
                            onClick={() => setShowMagicImport(true)}
                            style={{ color: '#c026d3', borderColor: '#f0abfc', background: '#fdf4ff', marginRight: '8px' }}
                            title={t('magicImport.title')}
                            disabled={isSaving}
                        >
                            <Sparkles size={18} /> <span className="hide-mobile">{t('magicImport.button')}</span>
                        </button>

                        <button type="button" className="btn-secondary" onClick={onCancel} disabled={isSaving}>
                            <X size={20} /> <span className="hide-mobile">{t('cancel')}</span>
                        </button>
                        <button type="submit" className="btn-primary" disabled={isSaving}>
                            <Save size={20} /> <span className="hide-mobile">{t('saveRecipe')}</span>
                        </button>
                    </div>
                </div>

                {/* Visibility Toggle */}
                <div className="form-group" style={{ marginBottom: '20px' }}>
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <button
                            type="button"
                            onClick={() => handleVisibilityChange(false)}
                            className={!formData.is_public ? 'btn-primary' : 'btn-secondary'}
                            style={{
                                flex: 1,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '8px',
                                background: !formData.is_public ? '#d97706' : '#fff',
                                borderColor: !formData.is_public ? '#d97706' : 'var(--border-color)',
                                color: !formData.is_public ? '#fff' : 'inherit'
                            }}
                        >
                            <Lock size={18} /> <span className="hide-mobile">{t('visibility.privateBadge')}</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => handleVisibilityChange(true)}
                            className={formData.is_public ? 'btn-primary' : 'btn-secondary'}
                            style={{
                                flex: 1,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '8px',
                                background: formData.is_public ? '#2563eb' : '#fff',
                                borderColor: formData.is_public ? '#2563eb' : 'var(--border-color)',
                                color: formData.is_public ? '#fff' : 'inherit'
                            }}
                        >
                            <Globe size={18} /> <span className="hide-mobile">{t('visibility.publicBadge')}</span>
                        </button>
                    </div>
                </div>

                <div className="form-group">
                    <label>{t('recipeTitle')}</label>
                    <input
                        type="text"
                        name="title"
                        value={formData.title}
                        onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                        placeholder={t('placeholders.title')}
                        required
                        autoFocus
                        disabled={isSaving}
                    />
                </div>

                <div className="form-row">
                    <div className="form-group">
                        <label>{t('prepTimeLabel')}</label>
                        <input
                            type="number"
                            name="prepTime"
                            value={formData.prepTime}
                            onChange={(e) => setFormData(prev => ({ ...prev, prepTime: e.target.value }))}
                            placeholder="15"
                            disabled={isSaving}
                        />
                    </div>
                    <div className="form-group">
                        <label>{t('cookTimeLabel')}</label>
                        <input
                            type="number"
                            name="cookTime"
                            value={formData.cookTime}
                            onChange={(e) => setFormData(prev => ({ ...prev, cookTime: e.target.value }))}
                            placeholder="45"
                            disabled={isSaving}
                        />
                    </div>
                    <div className="form-group">
                        <label>{t('servingsLabel')}</label>
                        <div style={{ display: 'flex', gap: '8px' }}>
                            <input
                                type="number"
                                name="servings"
                                value={formData.servings}
                                onChange={(e) => setFormData(prev => ({ ...prev, servings: e.target.value }))}
                                placeholder="4"
                                disabled={isSaving}
                                style={{ flex: 1 }}
                            />
                            <button
                                type="button"
                                className="btn-secondary"
                                onClick={() => setShowPortionScaling(true)}
                                disabled={isSaving || !formData.ingredients || !formData.servings}
                                title="AI-powered portion scaling"
                                style={{
                                    padding: '0 16px',
                                    flexShrink: 0,
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    background: '#dbeafe',
                                    color: '#2563eb',
                                    border: '1px solid #93c5fd'
                                }}
                            >
                                <Scale size={16} />
                                <span className="hide-mobile">Adjust</span>
                            </button>
                        </div>
                    </div>
                </div>

                <div className="form-group">
                    <label>{t('ingredientsLabel')}</label>
                    <textarea
                        name="ingredients"
                        value={formData.ingredients}
                        onChange={(e) => setFormData(prev => ({ ...prev, ingredients: e.target.value }))}
                        rows={8}
                        placeholder={t('placeholders.ingredients')}
                        disabled={isSaving}
                    />
                </div>

                <div className="form-group">
                    <label>{t('instructionsLabel')}</label>
                    <textarea
                        name="instructions"
                        value={formData.instructions}
                        onChange={(e) => setFormData(prev => ({ ...prev, instructions: e.target.value }))}
                        rows={8}
                        placeholder={t('placeholders.instructions')}
                        disabled={isSaving}
                    />
                </div>

                <div className="form-group">
                    <label>{t('tagsLabel')}</label>
                    <input
                        type="text"
                        name="tags"
                        value={formData.tags}
                        onChange={(e) => setFormData(prev => ({ ...prev, tags: e.target.value }))}
                        placeholder={t('placeholders.tags')}
                        disabled={isSaving}
                    />
                </div>
            </form>
        </div>
    );
}
