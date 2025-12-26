import React, { useState, useRef, useEffect } from 'react';
import { ArrowLeft, Edit2, Trash2, Clock, Users, Download, Globe, Lock, ChefHat } from 'lucide-react';
import { useRecipes } from '../context/RecipeContext';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import ConfirmModal from './ConfirmModal';
import VisibilityModal from './VisibilityModal';
import { generateRecipePDF } from '../utils/pdfGenerator';

export default function RecipeDetail({ id, onBack, onEdit }) {
    const { recipes, deleteRecipe, toggleVisibility, toggleLike, hasUserLiked, publicRecipes } = useRecipes();
    const { t } = useLanguage();
    const { user } = useAuth();

    const [showConfirm, setShowConfirm] = useState(false);
    const [isDownloading, setIsDownloading] = useState(false);
    const [isVisModalOpen, setIsVisModalOpen] = useState(false);
    const [isLiked, setIsLiked] = useState(false);

    const contentRef = useRef(null);

    // Logic to find recipe in 'my recipes' or 'public recipes'
    // Prefer 'recipes' (My Recipes) to ensure edit context if I am the owner
    let recipe = recipes.find(r => r.id === id);
    if (!recipe) {
        recipe = publicRecipes.find(r => r.id === id);
    }

    // Check like status
    useEffect(() => {
        const checkLike = async () => {
            if (recipe && user) {
                const liked = await hasUserLiked(recipe.id);
                setIsLiked(liked);
            }
        };
        checkLike();
    }, [id, user, recipe]);

    if (!recipe) return null;

    const isOwner = user && user.id === recipe.user_id;

    const handleDeleteClick = (e) => {
        e.stopPropagation();
        setShowConfirm(true);
    };

    const handleConfirmDelete = () => {
        deleteRecipe(id);
        onBack();
    };

    const handleDownload = async () => {
        if (!contentRef.current) return;
        setIsDownloading(true);
        try {
            await generateRecipePDF(contentRef.current, `${recipe.title}.pdf`);
        } catch (error) {
            console.error('PDF Generation failed:', error);
        } finally {
            setIsDownloading(false);
        }
    };

    const handleLike = async () => {
        if (!user) return;
        await toggleLike(recipe.id);
        setIsLiked(!isLiked);
    };

    return (
        <div className="recipe-detail">
            <ConfirmModal
                isOpen={showConfirm}
                onClose={() => setShowConfirm(false)}
                onConfirm={handleConfirmDelete}
                message={t('deleteConfirm')}
            />

            <VisibilityModal
                isOpen={isVisModalOpen}
                onClose={() => setIsVisModalOpen(false)}
                onConfirm={() => toggleVisibility(recipe.id, recipe.is_public)}
                isMakingPublic={!recipe.is_public}
            />

            <div className="detail-header">
                <button className="btn-secondary" onClick={onBack}>
                    <ArrowLeft size={20} /> {t('back')}
                </button>
                <div className="detail-actions">
                    {/* Like Button */}
                    <button
                        className="btn-icon"
                        onClick={handleLike}
                        title={isLiked ? "Unlike" : "Like"}
                        style={{ color: isLiked ? 'var(--color-primary)' : 'inherit' }}
                    >
                        <ChefHat size={20} fill={isLiked ? 'currentColor' : 'none'} />
                        <span style={{ fontSize: '0.8rem', marginLeft: '4px' }}>{recipe.likes_count || 0}</span>
                    </button>

                    <button
                        className="btn-icon"
                        onClick={handleDownload}
                        title={t('downloadPDF')}
                        disabled={isDownloading}
                    >
                        <Download size={20} />
                    </button>

                    {/* Public/Private Toggle - Only for Owner */}
                    {isOwner && (
                        <button
                            className="btn-icon"
                            onClick={() => setIsVisModalOpen(true)}
                            title={recipe.is_public ? t('visibility.makePrivate') : t('visibility.makePublic')}
                            style={{ color: recipe.is_public ? '#2563eb' : '#d97706' }}
                        >
                            {recipe.is_public ? <Globe size={20} /> : <Lock size={20} />}
                        </button>
                    )}

                    {/* Edit/Delete - Only for Owner */}
                    {isOwner && (
                        <>
                            <button className="btn-icon" onClick={onEdit} title={t('edit')}>
                                <Edit2 size={20} />
                            </button>
                            <button className="btn-icon danger" onClick={handleDeleteClick} title={t('delete')}>
                                <Trash2 size={20} />
                            </button>
                        </>
                    )}
                </div>
            </div>

            <div className="detail-content" ref={contentRef}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px' }}>
                    <div style={{ flex: 1 }}>
                        <h1 className="detail-title" style={{ display: 'inline', marginRight: '10px' }}>{recipe.title}</h1>
                        {/* Author Name */}
                        {recipe.is_public && recipe.author_username && (
                            <span style={{ fontSize: '0.9rem', color: '#666', fontWeight: 500 }}>
                                by {recipe.author_username}
                            </span>
                        )}
                    </div>

                    {/* Static Badge */}
                    {recipe.is_public && (
                        <span style={{ fontSize: '0.8rem', background: '#dbeafe', color: '#2563eb', padding: '4px 8px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '4px', height: 'fit-content', marginTop: '8px' }}>
                            <Globe size={12} /> {t('visibility.publicBadge')}
                        </span>
                    )}
                </div>

                <div className="detail-meta">
                    <div className="meta-badge">
                        <Clock size={16} />
                        <span>{t('prepTime')}: {recipe.prepTime}{t('minSuffix')}</span>
                    </div>
                    <div className="meta-badge">
                        <Clock size={16} />
                        <span>{t('cookTime')}: {recipe.cookTime}{t('minSuffix')}</span>
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
