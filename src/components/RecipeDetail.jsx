import React, { useState } from 'react';
import { ArrowLeft, Edit2, Trash2, Clock, Users } from 'lucide-react';
import { useRecipes } from '../context/RecipeContext';
import { useLanguage } from '../context/LanguageContext';
import ConfirmModal from './ConfirmModal';

export default function RecipeDetail({ id, onBack, onEdit }) {
    const { recipes, deleteRecipe } = useRecipes();
    const { t } = useLanguage();
    const [showConfirm, setShowConfirm] = useState(false);
    const recipe = recipes.find(r => r.id === id);

    if (!recipe) return null;

    const handleDeleteClick = (e) => {
        e.stopPropagation();
        setShowConfirm(true);
    };

    const handleConfirmDelete = () => {
        deleteRecipe(id);
        onBack();
    };

    return (
        <div className="recipe-detail">
            <ConfirmModal
                isOpen={showConfirm}
                onClose={() => setShowConfirm(false)}
                onConfirm={handleConfirmDelete}
                message={t('deleteConfirm')}
            />

            <div className="detail-header">
                <button className="btn-secondary" onClick={onBack}>
                    <ArrowLeft size={20} /> {t('back')}
                </button>
                <div className="detail-actions">
                    <button className="btn-icon" onClick={onEdit} title={t('edit')}>
                        <Edit2 size={20} />
                    </button>
                    <button className="btn-icon danger" onClick={handleDeleteClick} title={t('delete')}>
                        <Trash2 size={20} />
                    </button>
                </div>
            </div>

            <div className="detail-content">
                <h1 className="detail-title">{recipe.title}</h1>

                <div className="detail-meta">
                    <div className="meta-badge">
                        <Clock size={16} />
                        <span>{t('prepTime')}: {recipe.prepTime}m</span>
                    </div>
                    <div className="meta-badge">
                        <Clock size={16} />
                        <span>{t('cookTime')}: {recipe.cookTime}m</span>
                    </div>
                    <div className="meta-badge">
                        <Users size={16} />
                        <span>{recipe.servings} {t('servings')}</span>
                    </div>
                </div>

                {recipe.tags && recipe.tags.length > 0 && (
                    <div className="detail-tags">
                        {recipe.tags.map(tag => (
                            <span key={tag} className="tag">{tag}</span>
                        ))}
                    </div>
                )}

                <div className="detail-grid">
                    <div className="detail-section">
                        <h3>{t('ingredientsSection')}</h3>
                        <div className="ingredients-list">
                            {recipe.ingredients.split('\n').map((line, i) => (
                                line.trim() && (
                                    <div key={i} className="ingredient-item">
                                        <span className="bullet">•</span>
                                        <span>{line}</span>
                                    </div>
                                )
                            ))}
                        </div>
                    </div>

                    <div className="detail-section">
                        <h3>{t('instructionsSection')}</h3>
                        <div className="instructions-list">
                            {recipe.instructions.split('\n').map((line, i) => (
                                line.trim() && (
                                    <div key={i} className="instruction-item">
                                        <span className="step-number">{i + 1}</span>
                                        <p>{line}</p>
                                    </div>
                                )
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
