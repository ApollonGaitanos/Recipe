import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, User, Award, Heart, Lock, Globe, Bookmark, GitFork } from 'lucide-react';
import { useRecipes } from '../context/RecipeContext';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext'; // Added useAuth
import ConfirmModal from './ConfirmModal';

export default function RecipeCard({ recipe, onDelete, hidePublicTag = false }) { // Accepted onDelete prop
    const navigate = useNavigate();
    const { toggleLike, hasUserLiked, toggleSave, isRecipeSaved } = useRecipes();
    const { t } = useLanguage();
    const { user } = useAuth(); // Get user
    const [liked, setLiked] = React.useState(false);
    const [showUnsaveConfirm, setShowUnsaveConfirm] = React.useState(false);

    // Check if recipe is saved
    const isSaved = isRecipeSaved ? isRecipeSaved(recipe.id) : false;

    React.useEffect(() => {
        hasUserLiked(recipe.id).then(setLiked);
    }, [recipe.id, hasUserLiked]);

    const handleLike = (e) => {
        e.stopPropagation();
        toggleLike(recipe.id);
        setLiked(!liked);
    };

    const handleSave = (e) => {
        e.stopPropagation();
        if (isSaved) {
            setShowUnsaveConfirm(true);
        } else {
            toggleSave(recipe);
        }
    };

    const confirmUnsave = () => {
        toggleSave(recipe);
        setShowUnsaveConfirm(false);
    };

    // DEBUG: Inspect full objects
    // console.log('Current User:', user);
    // console.log('Recipe Owner ID:', recipe.user_id, typeof recipe.user_id);

    // Strict comparison
    // Strict comparison with memoization AND Username Fallback (Double Safety)
    const isOwner = React.useMemo(() => {
        if (!user || !recipe) return false;

        // 1. ID Check (Primary)
        const idMatch = user.id && recipe.user_id && String(user.id).trim() === String(recipe.user_id).trim();
        if (idMatch) return true;

        // 2. Username Check (Secondary/Fallback) - for cases where IDs might mismatch due to auth weirdness
        const currentUsername = user.user_metadata?.username || user.email?.split('@')[0];
        const recipeUsername = recipe.author_username;
        if (currentUsername && recipeUsername && currentUsername === recipeUsername) return true;

        return false;
    }, [user, recipe]);

    return (
        <div
            onClick={() => navigate(`/recipe/${recipe.id}`)}
            className="group cursor-pointer flex flex-col gap-3 relative"
        >
            {/* Image Container */}
            <div className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-gray-100 dark:bg-gray-800 flex items-center justify-center border-2 border-dashed border-gray-300 dark:border-gray-700">
                <div className="text-center p-4">
                    <span className="text-sm font-medium text-gray-400 dark:text-gray-500">
                        Images are still a work in progress
                    </span>
                </div>

                {/* Bottom Right: Like */}
                <div className="absolute bottom-3 right-3">
                    <button
                        onClick={handleLike}
                        className="p-2 rounded-lg bg-white/90 dark:bg-black/60 hover:bg-white text-gray-700 dark:text-gray-200 transition-colors backdrop-blur-sm shadow-sm group/btn"
                    >
                        <Heart
                            size={18}
                            className={`transition-colors ${liked ? 'fill-red-500 text-red-500' : 'group-hover/btn:text-red-500'}`}
                        />
                    </button>
                </div>

                {/* Bottom Left: Bookmark (Saved) - Moved per request */}
                {!isOwner && (
                    <div className="absolute bottom-3 left-3">
                        <button
                            onClick={handleSave}
                            className={`p-2 rounded-lg transition-colors backdrop-blur-sm shadow-sm group/btn 
                                ${isSaved
                                    ? 'bg-[#17cf54] text-white hover:bg-[#14b045]'
                                    : 'bg-white/90 dark:bg-black/60 hover:bg-white text-gray-700 dark:text-gray-200'
                                }`}
                        >
                            <Bookmark
                                size={18}
                                className={`transition-colors ${isSaved ? 'fill-white text-white' : ''}`}
                            />
                        </button>
                    </div>
                )}

                {/* Top Right: Copy Indicator */}
                {recipe.originId && (
                    <div className="absolute top-3 right-3">
                        <div className="p-1.5 rounded-full bg-black/40 text-white backdrop-blur-sm" title="This is a copy">
                            <GitFork size={14} />
                        </div>
                    </div>
                )}

                {/* Top Left: Visibility Badge (Shifted slightly if needed, but absolute positioning handles overlap usually) */}
                {/* Note: Public badge is top-left. Copied indicator is top-right. Bookmark is bottom-left. Like is bottom-right. All corners covered. */}
                {(!hidePublicTag || !recipe.is_public) && (
                    <div className="absolute top-3 left-3">
                        <span className={`px-3 py-1.5 rounded-full text-xs font-bold backdrop-blur-sm shadow-sm flex items-center gap-1 ${recipe.is_public
                            ? 'bg-black/60 text-white'
                            : 'bg-primary/90 text-white'
                            }`}>
                            {recipe.is_public ? <Globe size={12} /> : <Lock size={12} />}
                            {recipe.is_public ? t('visibility.publicBadge') : t('visibility.privateBadge')}
                        </span>
                    </div>
                )}
            </div>

            {/* Content */}
            <div className="flex flex-col gap-2">
                {/* Tags */}
                <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-primary">
                        {recipe.tags && recipe.tags.length > 0 ? recipe.tags[0] : 'DINNER'}
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">•</span>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">
                        EASY
                    </span>
                </div>

                <h3 className="font-serif font-bold text-xl text-gray-900 dark:text-white leading-tight line-clamp-2 group-hover:text-primary transition-colors">
                    {recipe.title}
                </h3>

                {/* Metadata Row */}
                <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400 mt-1">
                    <div className="flex items-center gap-1.5">
                        <Clock size={16} />
                        <span>{recipe.prepTime + recipe.cookTime}{t('minSuffix')}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <User size={16} />
                        <span>{recipe.servings} {t('card.ppl')}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-red-500">
                        <Heart size={16} className={liked ? "fill-current" : ""} />
                        <span className="font-bold text-gray-700 dark:text-gray-300">{recipe.likes_count || 0}</span>
                    </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between mt-2 pt-3 border-t border-gray-100 dark:border-white/5">
                    <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-[10px] font-bold text-gray-600">
                            {recipe.author_username ? recipe.author_username[0].toUpperCase() : 'U'}
                        </div>
                        <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                            {recipe.author_username || t('card.chef')}
                        </span>
                    </div>
                    <span className="text-xs text-gray-400">2h {t('card.ago')}</span>
                </div>
            </div>
            {/* Unsave Confirmation Modal */}
            <ConfirmModal
                isOpen={showUnsaveConfirm}
                onClose={() => setShowUnsaveConfirm(false)}
                onConfirm={confirmUnsave}
                title="Remove from Saved?"
                description={`Are you sure you want to remove "${recipe.title}" by ${recipe.author_username || 'the Chef'} from your saved recipes?`}
                confirmText="Remove"
                isDanger={true}
            />
        </div>
    );
}
