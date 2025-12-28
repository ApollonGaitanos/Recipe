import React from 'react';
import { Clock, Lock, MoreHoriz, Bookmark, User as UserIcon, Restaurant } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useRecipes } from '../context/RecipeContext';

export default function RecipeCard({ recipe, onClick }) {
    const { user } = useAuth();
    const { toggleLike: toggleBookmark, checkIsLiked: isBookmarked } = useRecipes();

    const isOwner = user && user.id === recipe.user_id;
    const bookmarked = isBookmarked(recipe.id);

    const handleBookmarkClick = (e) => {
        e.stopPropagation();
        if (!user) return;
        toggleBookmark(recipe.id);
    };

    const totalTime = (parseInt(recipe.prepTime, 10) || 0) + (parseInt(recipe.cookTime, 10) || 0);
    const placeholderImage = "https://placehold.co/600x400/f6f8f6/112116?text=Οψοποιία";
    const imageUrl = recipe.image_url || placeholderImage;

    return (
        <article className="group relative flex flex-col bg-card-light dark:bg-card-dark rounded-xl shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 dark:border-gray-800 hover:border-primary/20 overflow-hidden h-full">
            <div className="relative w-full aspect-[16/10] overflow-hidden">
                <div
                    className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
                    style={{ backgroundImage: `url(${imageUrl})` }}
                    onClick={onClick}
                ></div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-60"></div>
                <div className="absolute top-3 left-3 z-10">
                    <button
                        onClick={handleBookmarkClick}
                        className="text-white hover:text-primary transition-colors drop-shadow-md focus:outline-none"
                    >
                        <Bookmark size={28} fill={bookmarked ? 'currentColor' : 'none'} />
                    </button>
                </div>
                <div className="absolute top-3 right-3 flex gap-2">
                    {recipe.is_public ? (
                        <span className="px-2.5 py-1 rounded-full bg-primary/90 text-[11px] font-bold uppercase tracking-wider text-white shadow-sm backdrop-blur-sm">Public</span>
                    ) : (
                        <span className="px-2.5 py-1 rounded-full bg-gray-600/90 text-[11px] font-bold uppercase tracking-wider text-white shadow-sm backdrop-blur-sm flex items-center gap-1">
                            <Lock size={12} /> Private
                        </span>
                    )}
                </div>
            </div>
            <div className="flex flex-col flex-grow p-4 md:p-5">
                <div className="flex flex-col gap-2 mb-3">
                    <h3
                        className="text-xl font-bold leading-tight text-text-main-light dark:text-text-main-dark group-hover:text-primary transition-colors line-clamp-2 cursor-pointer"
                        onClick={onClick}
                    >
                        {recipe.title}
                    </h3>
                    <div className="flex items-center text-xs text-text-sub-light dark:text-text-sub-dark gap-1.5">
                        <UserIcon size={14} />
                        <span className="font-medium">By {isOwner ? 'You' : recipe.author_username || 'Anonymous'}</span>
                    </div>
                </div>
                <div className="mt-auto pt-4 border-t border-gray-100 dark:border-gray-800/50 flex items-center justify-between text-xs font-medium text-text-sub-light dark:text-text-sub-dark uppercase tracking-wide">
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1.5" title="Total Time">
                            <Clock size={16} />
                            {totalTime > 0 ? `${totalTime} min` : 'N/A'}
                        </div>
                        <div className="flex items-center gap-1.5" title="Servings">
                            <Restaurant size={16} />
                            {recipe.servings || 'N/A'} Servings
                        </div>
                    </div>
                    <button className="text-text-main-light dark:text-text-main-dark hover:text-primary transition-colors">
                        <MoreHoriz size={20} />
                    </button>
                </div>
            </div>
        </article>
    );
}
