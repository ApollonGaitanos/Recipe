import React from 'react';
import { Clock, Users, Globe, Lock, ChefHat } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { useRecipes } from '../context/RecipeContext';

export default function RecipeCard({ recipe, onClick, onEdit, onDelete }) {
    const { t } = useLanguage();
    const { user } = useAuth();
    const { toggleLike, checkIsLiked } = useRecipes();

    // Check ownership: Is the current user the creator?
    const isOwner = user && user.id === recipe.user_id;
    const isLiked = checkIsLiked(recipe.id);

    const handleLikeClick = (e) => {
        e.stopPropagation(); // Prevent card click (navigation)
        toggleLike(recipe.id);
    };

    return (
        <div className="recipe-card" onClick={(e) => onClick(recipe.id)}>
            <div className="card-content">
                {/* Header Row: Title + Visibility Badge */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                    <h3 className="card-title" style={{ margin: 0, flex: 1 }}>{recipe.title}</h3>

                    {/* Visibility Badge - Visual only */}
                    {recipe.is_public ? (
                        <span style={{ fontSize: '0.7rem', background: '#dbeafe', color: '#2563eb', padding: '2px 6px', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
                            <Globe size={10} /> {t('visibility.publicBadge')}
                        </span>
                    ) : (
                        isOwner && (
                            <span style={{ fontSize: '0.7rem', background: '#fef3c7', color: '#d97706', padding: '2px 6px', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
                                <Lock size={10} /> {t('visibility.privateBadge')}
                            </span>
                        )
                    )}
                </div>

                <div className="card-meta">
                    <div className="meta-item">
                        <Clock size={16} />
                        <span>{parseInt(recipe.prepTime) + parseInt(recipe.cookTime)}{t('minSuffix')}</span>
                    </div>
                    <div className="meta-item">
                        <Users size={16} />
                        <span>{recipe.servings}</span>
                    </div>
                </div>

                {recipe.tags && recipe.tags.length > 0 && (
                    <div className="card-tags">
                        {recipe.tags.slice(0, 3).map(tag => (
                            <span key={tag} className="tag">{tag}</span>
                        ))}
                    </div>
                )}

                {/* Footer: Likes & Author */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px', borderTop: '1px solid var(--border-color)', paddingTop: '8px', fontSize: '0.8rem', color: '#666' }}>

                    {/* Interactive Like Icon */}
                    <div
                        onClick={handleLikeClick}
                        style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', padding: '4px', borderRadius: '50%', transition: 'background 0.2s' }}
                        title={isLiked ? "Unlike" : "Like"}
                        className="like-btn-hover"
                    >
                        <ChefHat size={16} color={isLiked ? 'var(--color-primary)' : '#666'} fill={isLiked ? 'var(--color-primary)' : 'none'} />
                        <span style={{ fontSize: '0.8rem', marginLeft: '2px', color: isLiked ? 'var(--color-primary)' : '#666' }}>{recipe.likes_count || 0}</span>
                    </div>

                    {/* Author Name */}
                    {recipe.is_public && recipe.author_username && (
                        <div style={{ fontStyle: 'italic' }}>
                            by {recipe.author_username}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
