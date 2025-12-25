import React from 'react';
import { Clock, Users } from 'lucide-react';

export default function RecipeCard({ recipe, onClick }) {
    return (
        <div className="recipe-card" onClick={() => onClick(recipe.id)}>
            <div className="card-content">
                <h3 className="card-title">{recipe.title}</h3>

                <div className="card-meta">
                    <div className="meta-item">
                        <Clock size={16} />
                        <span>{recipe.prepTime + recipe.cookTime}m</span>
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
            </div>
        </div>
    );
}
