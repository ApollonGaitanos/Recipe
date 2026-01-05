
import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Edit, Edit2, Trash2, Clock, Users, Download, Globe, Lock, ChefHat, Sparkles, Heart, Check, ShoppingCart, ShoppingBag, Activity, Printer, Share2, Star, BarChart2, Info, Languages, Image as ImageIcon, Bookmark, GitFork } from 'lucide-react';
import { useRecipes } from '../context/RecipeContext';
import { useLanguage } from '../context/LanguageContext';
import { supabase } from '../supabaseClient';

import { useAuth } from '../context/AuthContext';
import ConfirmModal from './ConfirmModal';
import VisibilityModal from './VisibilityModal';
import { generateRecipePDF } from '../utils/pdfGenerator';
import { parseRecipe } from '../utils/recipeParser';
import TranslationModal from './TranslationModal';

export default function RecipeDetail({ id, onBack, onEdit }) {
    const { recipes, deleteRecipe, updateRecipe, toggleVisibility, toggleLike, checkIsLiked, publicRecipes, toggleSave, isRecipeSaved, duplicateRecipe } = useRecipes();
    const { t, language } = useLanguage();
    const { user } = useAuth();

    const [showConfirm, setShowConfirm] = useState(false);
    const [showUnsaveConfirm, setShowUnsaveConfirm] = useState(false);
    const [isDownloading, setIsDownloading] = useState(false);
    const [isVisModalOpen, setIsVisModalOpen] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);

    // AI Modal State
    const [actionModal, setActionModal] = useState({ isOpen: false, mode: null });
    const [translatedRecipe, setTranslatedRecipe] = useState(null);
    const [aiError, setAiError] = useState(null);


    // Sync Like Status
    const isLiked = checkIsLiked(id);
    const isSaved = isRecipeSaved(id);

    const contentRef = useRef(null);

    // Logic to find recipe
    let originalRecipe = recipes.find(r => r.id === id);
    if (!originalRecipe) {
        originalRecipe = publicRecipes.find(r => r.id === id);
    }

    const navigate = useNavigate();
    const [originalSource, setOriginalSource] = useState(null);
    const [showCopyConfirm, setShowCopyConfirm] = useState(false);
    const [showMissingOriginModal, setShowMissingOriginModal] = useState(false);
    const [showDeadLinkModal, setShowDeadLinkModal] = useState(false);

    React.useEffect(() => {
        if (originalRecipe?.originId) {
            supabase.from('recipes').select('title, author_username').eq('id', originalRecipe.originId).single()
                .then(({ data }) => setOriginalSource(data));
        }
    }, [originalRecipe?.originId]);



    // recipe definition moved, result used in hooks
    const recipe = translatedRecipe || originalRecipe;

    // if (!recipe) return null; // MOVED DOWN


    const isOwner = React.useMemo(() => {
        if (!user || !recipe) return false;

        // 1. ID Check
        const idMatch = user.id && recipe.user_id && String(user.id).trim() === String(recipe.user_id).trim();
        if (idMatch) return true;

        // 2. Username Check
        const currentUsername = user.user_metadata?.username || user.email?.split('@')[0];
        const recipeUsername = recipe.author_username;
        if (currentUsername && recipeUsername && currentUsername === recipeUsername) return true;

        return false;
    }, [user, recipe]);

    if (!recipe) return null;



    const handleConfirmDelete = () => {
        deleteRecipe(id);
        onBack();
    };

    const handleDownload = async () => {
        if (!contentRef.current) return;
        setIsDownloading(true);
        try {
            await generateRecipePDF(contentRef.current, recipe.title + ".pdf");
        } catch (error) {
            console.error('PDF Generation failed:', error);
        } finally {
            setIsDownloading(false);
        }
    };



    const handleSave = () => {
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

    // Open the modal


    // AI Enhance/Translate Logic (View-Only / Cache First)
    const executeAIAction = async (targetLang) => {
        const mode = actionModal.mode;

        // 1. Check if translation exists in DB (Cache Check)
        if (mode === 'translate' && targetLang) {
            setIsProcessing(true);
            try {
                // Fetch from DB
                const { data: cachedData, error: cacheError } = await supabase
                    .from('recipe_translations')
                    .select('*')
                    .eq('recipe_id', id)
                    .eq('language_code', targetLang)
                    .single();

                if (cachedData) {
                    // BAD CACHE CHECK: If cached title is identical to original, it's a "Ghost Translation".
                    // FIX: Delete it immediately so it doesn't persist.
                    // Normalize strings (trim) to catch subtle differences.
                    const cachedTitle = (cachedData.title || '').trim();
                    const currentTitle = (recipe.title || '').trim();

                    if (cachedTitle === currentTitle) {
                        console.warn("Detected BAD CACHE (Identical to original). Deleting from DB...");
                        await supabase.from('recipe_translations')
                            .delete()
                            .eq('recipe_id', id)
                            .eq('language_code', targetLang);
                        console.log("Bad cache deleted. Proceeding to fresh AI generation.");
                    } else {
                        console.log("Using cached translation for:", targetLang);
                        setTranslatedRecipe({
                            ...recipe,
                            title: cachedData.title || recipe.title,
                            ingredients: cachedData.ingredients || recipe.ingredients,
                            instructions: cachedData.instructions || recipe.instructions,
                        });
                        setActionModal({ isOpen: false, mode: null });
                        setIsProcessing(false);
                        return;
                    }
                }
            } catch (err) {
                // Ignore 406/No rows found
                console.log("No cache found, proceeding to AI.");
            }
        }

        // 2. Call AI if no cache
        setIsProcessing(true);
        try {
            const currentRecipeState = {
                title: recipe.title,
                ingredients: recipe.ingredients,
                instructions: recipe.instructions,
                tags: recipe.tags
            };

            const inputPayload = {
                text: JSON.stringify(currentRecipeState),
                mode: mode,
                targetLanguage: targetLang || 'en'
            };

            const result = await parseRecipe(inputPayload, targetLang || 'en', mode);

            if (result) {
                // 3. Save to DB (Cache It)
                if (mode === 'translate' && targetLang) {
                    // PREVENT BAD SAVE: Don't save if it's identical to original (AI failed/refused).
                    const resultTitle = (result.title || '').trim();
                    const originalTitle = (recipe.title || '').trim();
                    const isIdentical = resultTitle === originalTitle;

                    if (isIdentical) {
                        console.warn("AI returned identical text. Skipping DB save to prevent cache poisoning.");
                        // Trigger Error Modal to explain why it looks unchanged
                        throw new Error("The AI returned the recipe in the original language. Please try again or choose a different language.");
                    } else {
                        const { error: insertError } = await supabase
                            .from('recipe_translations')
                            .upsert({
                                recipe_id: id,
                                language_code: targetLang,
                                title: result.title,
                                ingredients: result.ingredients,
                                instructions: result.instructions
                            });
                        if (insertError) console.error("Failed to cache translation:", insertError);
                    }
                }

                // 4. Update View (Temporary Local State)
                // Ensure ingredients/instructions/tools are arrays for display
                const standardizedResult = {
                    ...result,
                    ingredients: Array.isArray(result.ingredients)
                        ? result.ingredients
                        : (typeof result.ingredients === 'string' ? result.ingredients.split('\n') : []),
                    instructions: Array.isArray(result.instructions)
                        ? result.instructions
                        : (typeof result.instructions === 'string' ? result.instructions.split('\n') : []),
                    tools: Array.isArray(result.tools)
                        ? result.tools
                        : (typeof result.tools === 'string' ? result.tools.split('\n') : [])
                };

                setTranslatedRecipe({
                    ...recipe,
                    ...standardizedResult
                });
                setActionModal({ isOpen: false, mode: null });
            }
        } catch (error) {
            console.error('AI ' + mode + ' failed: ', error);
            setAiError(error);
        } finally {
            setIsProcessing(false);
        }
    };

    const displayDescription = recipe.description || (typeof recipe.instructions === 'string' ? recipe.instructions : recipe.instructions.join(' ')).substring(0, 160) + "...";

    return (
        <div className="min-h-screen bg-background-light dark:bg-background-dark pt-2 pb-20 fade-in text-zinc-900 dark:text-zinc-100 font-sans transition-colors duration-200">
            <div className="container mx-auto px-4 md:px-8 max-w-7xl space-y-12">

                <div className="space-y-6 w-full">
                    {translatedRecipe && (
                        <div className="w-full bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-900 rounded-xl p-4 flex items-center justify-between animate-in slide-in-from-top-2">
                            <div className="flex items-center gap-3 text-blue-800 dark:text-blue-200">
                                <Globe className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                                <p className="font-medium text-sm">
                                    Viewing Translated Version <span className="opacity-60 font-normal ml-1">(View-Only)</span>
                                </p>
                            </div>
                            <button
                                onClick={() => setTranslatedRecipe(null)}
                                className="px-4 py-1.5 rounded-lg bg-blue-100 dark:bg-blue-800 text-blue-700 dark:text-blue-200 text-xs font-bold hover:bg-blue-200 dark:hover:bg-blue-700 transition-colors"
                            >
                                View Original
                            </button>
                        </div>
                    )}


                    <div className="flex flex-row items-start justify-between gap-4">
                        <h1 className="text-4xl md:text-5xl lg:text-6xl font-serif font-bold text-zinc-900 dark:text-white leading-tight max-w-4xl">
                            {recipe.title}
                        </h1>
                        {recipe.originId && (
                            <div className="p-3 bg-zinc-100 dark:bg-zinc-800 rounded-full text-zinc-500 dark:text-zinc-400 mt-2">
                                <GitFork size={32} />
                            </div>
                        )}
                    </div>

                    {recipe.originId && (
                        <div
                            className="flex items-center gap-2 text-sm text-zinc-500 cursor-pointer hover:text-highlight transition-colors"
                            onClick={() => {
                                // 1. If original recipe is healthy and found:
                                if (originalSource) {
                                    navigate('/recipe/' + recipe.originId);
                                }
                                // 2. If original is missing but we know the author (Legacy or New logic):
                                else if (recipe.originAuthor) {
                                    setShowMissingOriginModal(true);
                                }
                                // 3. Truly dead link (Old copy, no metadata):
                                else {
                                    setShowDeadLinkModal(true);
                                }
                            }}
                        >
                            <GitFork size={14} />
                            <span>
                                Copy of <span className="font-semibold underline">
                                    {originalSource?.title || recipe.originTitle || 'Original Recipe'}
                                </span> by {originalSource?.author_username || recipe.originAuthor || 'Unknown'}
                            </span>
                        </div>
                    )}



                    <div className="flex flex-wrap items-center gap-6 text-zinc-500 dark:text-zinc-400 text-sm md:text-base">
                        <div className="flex items-center gap-2">

                            <span className="font-medium text-zinc-900 dark:text-zinc-200">
                                {t('detail.by')} {recipe.author_username || 'Chef'}
                            </span>
                        </div>

                        <div className="ml-auto flex items-center gap-4">
                            <button
                                onClick={() => isOwner && setIsVisModalOpen(true)}
                                disabled={!isOwner}
                                className={'flex items-center gap-2 text-sm font-medium transition-colors ' + (!isOwner ? 'opacity-70 cursor-not-allowed' : 'hover:brightness-110 cursor-pointer')}
                            >
                                <span className="text-zinc-500 dark:text-zinc-400">{recipe.is_public ? 'Public' : 'Private'}</span>
                                {recipe.is_public ? <Globe className="w-4 h-4 text-highlight" /> : <Lock className="w-4 h-4 text-amber-500" />}
                            </button>

                            <div className="h-4 w-px bg-zinc-300 dark:bg-zinc-700 mx-1" />

                            <button className="flex items-center gap-2 px-5 py-1.5 rounded-full border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900/50 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors text-sm font-medium text-zinc-700 dark:text-zinc-300">
                                <Share2 className="w-3.5 h-3.5" />
                                <span>share</span>
                            </button>
                            <button onClick={handleDownload} disabled={isDownloading} className="flex items-center gap-2 px-5 py-1.5 rounded-full border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900/50 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors text-sm font-medium text-zinc-700 dark:text-zinc-300">
                                <Printer className="w-3.5 h-3.5" />
                                <span>print</span>
                            </button>
                            {!isOwner && (
                                <button
                                    onClick={handleSave}
                                    className={'flex items-center gap-2 px-5 py-1.5 rounded-full border transition-colors text-sm font-medium ' +
                                        (isSaved
                                            ? 'border-primary bg-primary/10 text-highlight hover:bg-primary/20'
                                            : 'border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900/50 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300')}
                                >
                                    <Bookmark className={'w-3.5 h-3.5 ' + (isSaved ? 'fill-current' : '')} />
                                    <span>{isSaved ? 'Saved' : 'Save'}</span>
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Hero Image - Placeholder Style */}
                <div className="relative w-full aspect-[21/9] bg-zinc-100 dark:bg-zinc-900 rounded-2xl overflow-hidden shadow-sm flex items-center justify-center border-2 border-dashed border-zinc-200 dark:border-zinc-800">
                    <div className="text-center p-6">
                        <span className="text-lg font-medium text-zinc-400 dark:text-zinc-500">
                            Images are still a work in progress
                        </span>
                    </div>

                    {/* Floating Action Button */}
                    <button
                        onClick={() => toggleLike(recipe.id)}
                        className="absolute bottom-6 right-6 p-4 rounded-full bg-white dark:bg-zinc-800 shadow-lg hover:scale-105 transition-transform group"
                    >
                        <Heart className={'w-6 h-6 ' + (isLiked ? "fill-red-500 text-red-500" : "text-zinc-400 group-hover:text-red-500")} />
                    </button>
                </div>

                {/* Description Grid */}
                <div className="max-w-4xl mx-auto text-center py-8">
                    <p className="text-xl md:text-2xl text-zinc-600 dark:text-zinc-300 leading-relaxed font-serif">
                        "{displayDescription}"
                    </p>
                </div>

                {/* Main Content Grid */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-12 items-start">

                    {/* Left Sidebar: Ingredients */}
                    <div className="md:col-span-4 space-y-8 md:sticky md:top-24">
                        <div className="bg-zinc-50 dark:bg-[#0D1811] rounded-3xl p-8 border border-zinc-100 dark:border-zinc-800">
                            {/* Ingredients Header */}
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-xl font-bold font-serif">{t('ingredientsSection')}</h3>
                                <div className="flex items-center gap-2 bg-white dark:bg-zinc-800 p-1 rounded-lg border border-zinc-200 dark:border-zinc-700">
                                    <button className="w-8 h-8 flex items-center justify-center hover:bg-zinc-50 dark:hover:bg-zinc-700 rounded-md">-</button>
                                    <span className="font-semibold w-6 text-center">4</span>
                                    <button className="w-8 h-8 flex items-center justify-center hover:bg-zinc-50 dark:hover:bg-zinc-700 rounded-md">+</button>
                                </div>
                            </div>

                            <ul className="space-y-4">
                                {(Array.isArray(recipe.ingredients) ? recipe.ingredients : (typeof recipe.ingredients === 'string' ? recipe.ingredients.split('\n').filter(Boolean) : [])).map((ingredient, index) => (
                                    <li key={index} className="flex items-center gap-3 group cursor-pointer">
                                        <div className="w-5 h-5 rounded border-2 border-zinc-300 dark:border-zinc-600 group-hover:border-primary transition-colors" />
                                        <span className="text-zinc-700 dark:text-zinc-300 group-hover:text-zinc-900 dark:group-hover:text-white transition-colors">
                                            {(() => {
                                                if (!ingredient) return '';
                                                if (typeof ingredient === 'object') {
                                                    const amt = ingredient.amount || '';
                                                    const name = ingredient.name || ingredient.item || '';
                                                    return (String(amt || '') + ' ' + String(name || '')).trim();
                                                }
                                                return String(ingredient);
                                            })()}
                                        </span>
                                    </li>
                                ))}
                            </ul>

                            <button className="w-full mt-8 py-3 rounded-xl bg-primary/10 dark:bg-primary/20 text-highlight font-semibold text-sm hover:bg-primary/20 dark:hover:bg-primary/30 transition-colors flex items-center justify-center gap-2">
                                <ShoppingBag className="w-4 h-4" />
                                Add to Shopping List
                            </button>
                        </div>

                        {/* Tools Section */}
                        {recipe.tools && recipe.tools.length > 0 && (
                            <div className="bg-zinc-50 dark:bg-[#0D1811] rounded-3xl p-8 border border-zinc-100 dark:border-zinc-800 list-disc">
                                <h3 className="text-xl font-bold font-serif mb-6 text-zinc-900 dark:text-white flex items-center gap-2">
                                    <span className="text-highlight">
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" /></svg>
                                    </span>
                                    Tools
                                </h3>
                                <ul className="space-y-3">
                                    {(Array.isArray(recipe.tools) ? recipe.tools : String(recipe.tools).split('\n')).map((tool, idx) => (
                                        <li key={idx} className="flex items-start gap-3">
                                            <span className="text-highlight mt-1.5 w-1.5 h-1.5 bg-highlight rounded-full block flex-shrink-0"></span>
                                            <span className="text-zinc-700 dark:text-zinc-300 leading-snug">{tool}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {/* Nutrition Card */}
                        <div className="bg-white dark:bg-[#0D1811] rounded-3xl p-6 border border-zinc-100 dark:border-zinc-800 shadow-sm">
                            <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-4">Nutrition per serving</h4>
                            <div className="grid grid-cols-4 gap-2 text-center">
                                <div>
                                    <div className="text-xl font-bold text-zinc-900 dark:text-white">450</div>
                                    <div className="text-xs text-zinc-500">Cals</div>
                                </div>
                                <div>
                                    <div className="text-xl font-bold text-zinc-900 dark:text-white">32g</div>
                                    <div className="text-xs text-zinc-500">Protein</div>
                                </div>
                                <div>
                                    <div className="text-xl font-bold text-zinc-900 dark:text-white">12g</div>
                                    <div className="text-xs text-zinc-500">Carbs</div>
                                </div>
                                <div>
                                    <div className="text-xl font-bold text-zinc-900 dark:text-white">28g</div>
                                    <div className="text-xs text-zinc-500">Fat</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Main Content: Instructions */}
                    <div className="md:col-span-8 space-y-12">

                        {/* Meta Stats Row */}
                        <div className="grid grid-cols-3 gap-4 bg-zinc-50 dark:bg-zinc-900/50 rounded-2xl p-6 border border-zinc-100 dark:border-zinc-800">
                            <div className="flex flex-col md:flex-row items-center gap-4 text-center md:text-left">
                                <div className="w-12 h-12 rounded-full bg-orange-100 dark:bg-orange-900/20 flex items-center justify-center text-orange-600 dark:text-orange-400">
                                    <Clock className="w-6 h-6" />
                                </div>
                                <div>
                                    <div className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Prep Time</div>
                                    <div className="font-semibold text-zinc-900 dark:text-white">{recipe.prepTime || 0} mins</div>
                                </div>
                            </div>
                            <div className="flex flex-col md:flex-row items-center gap-4 text-center md:text-left">
                                <div className="w-12 h-12 rounded-full bg-orange-100 dark:bg-orange-900/20 flex items-center justify-center text-orange-600 dark:text-orange-400">
                                    <ChefHat className="w-6 h-6" />
                                </div>
                                <div>
                                    <div className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Cook Time</div>
                                    <div className="font-semibold text-zinc-900 dark:text-white">{recipe.cookTime || 0} mins</div>
                                </div>
                            </div>
                            <div className="flex flex-col md:flex-row items-center gap-4 text-center md:text-left">
                                <div className="w-12 h-12 rounded-full bg-primary/10 dark:bg-primary/20 flex items-center justify-center text-highlight">
                                    <Activity className="w-6 h-6" />
                                </div>
                                <div>
                                    <div className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Difficulty</div>
                                    <div className="font-semibold text-zinc-900 dark:text-white">Medium</div>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center justify-between">
                            <h2 className="text-3xl font-serif font-bold text-zinc-900 dark:text-white">{t('instructionsSection')}</h2>
                            <div className="flex gap-2">

                                <button
                                    onClick={() => setActionModal({ isOpen: true, mode: 'translate' })}
                                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors text-xs font-bold"
                                >
                                    <Globe size={14} />
                                    Translate AI
                                </button>

                                {/* Make a Copy Button */}
                                {!isOwner && (
                                    <button
                                        onClick={() => setShowCopyConfirm(true)}
                                        className="btn-secondary-small bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-900 dark:text-gray-200 flex items-center gap-2 px-4 py-2 rounded-full text-sm border-none"
                                    >
                                        <GitFork className="w-4 h-4" />
                                        Make a Copy
                                    </button>
                                )}


                                {isOwner && (
                                    <>
                                        <button className="btn-secondary text-sm px-4 py-2 rounded-full border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 flex items-center gap-2" onClick={onEdit}>
                                            <Edit2 className="w-4 h-4" />
                                            Edit
                                        </button>
                                        <button
                                            className="btn-secondary text-sm px-4 py-2 rounded-full border border-red-200 dark:border-red-900/30 bg-red-50 dark:bg-red-900/10 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 flex items-center gap-2 transition-colors"
                                            onClick={() => setShowConfirm(true)}
                                        >
                                            <Trash2 className="w-4 h-4" />
                                            Delete
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>

                        <div className="space-y-10 relative border-l-2 border-zinc-100 dark:border-zinc-800 ml-3 md:ml-4 pl-8 md:pl-10 pb-10">
                            {(Array.isArray(recipe.instructions) ? recipe.instructions : (typeof recipe.instructions === 'string' ? recipe.instructions.split('\n').filter(Boolean) : [])).map((step, index) => (
                                <div key={index} className="relative">
                                    <div className="absolute -left-[43px] md:-left-[51px] top-0 w-8 h-8 md:w-10 md:h-10 rounded-full bg-white dark:bg-zinc-900 border-2 border-primary flex items-center justify-center text-highlight font-bold z-10">
                                        {index + 1}
                                    </div>
                                    <h4 className="text-lg font-bold text-zinc-900 dark:text-white mb-2">Step {index + 1}</h4>
                                    <p className="text-lg text-zinc-600 dark:text-zinc-300 leading-relaxed">
                                        {step}
                                    </p>
                                </div>
                            ))}
                        </div>

                        {/* Tags Section */}
                        <div className="border-t border-zinc-200 dark:border-zinc-800 pt-8 mt-12">
                            <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-4">Tags</h4>
                            <div className="flex flex-wrap gap-2">
                                {(recipe.tags && recipe.tags.length > 0 ? recipe.tags : []).map(tag => (
                                    <span key={tag} className="px-3 py-1 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 rounded-full text-sm font-medium hover:bg-zinc-200 dark:hover:bg-zinc-700 cursor-pointer transition-colors">
                                        #{tag}
                                    </span>
                                ))}
                                {(!recipe.tags || recipe.tags.length === 0) && (
                                    <span className="text-zinc-400 text-sm italic">No tags</span>
                                )}
                            </div>
                        </div>

                    </div>
                </div>

                {/* You Might Also Like Section */}
                <div className="border-t border-zinc-200 dark:border-zinc-800 pt-16 mt-16">
                    <h3 className="text-2xl font-serif font-bold text-zinc-900 dark:text-white mb-8">You might also like</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="group cursor-pointer">
                                <div className="aspect-[4/3] bg-zinc-100 dark:bg-zinc-900 rounded-xl mb-4 overflow-hidden flex items-center justify-center border-2 border-dashed border-zinc-200 dark:border-zinc-800">
                                    <div className="text-center p-4">
                                        <span className="text-xs font-medium text-zinc-400 dark:text-zinc-500">
                                            Images are still a work in progress
                                        </span>
                                    </div>
                                </div>
                                <h4 className="font-bold text-lg text-zinc-900 dark:text-white leading-tight group-hover:text-highlight transition-colors">
                                    {i === 1 ? "Summer Grilled Chicken Salad" : i === 2 ? "Creamy Garlic Pasta" : "Rustic Vegetable Soup"}
                                </h4>
                                <div className="flex items-center gap-2 text-zinc-500 text-sm mt-2">
                                    <Clock className="w-4 h-4" />
                                    <span>{i === 1 ? "25 mins" : i === 2 ? "40 mins" : "55 mins"}</span>
                                    <span>•</span>
                                    <span>{i === 1 ? "Easy" : i === 2 ? "Medium" : "Easy"}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

            </div>

            {/* Modals */}
            <ConfirmModal
                isOpen={showConfirm}
                onClose={() => setShowConfirm(false)}
                onConfirm={handleConfirmDelete}
                message={t('deleteConfirm')}
            />

            <ConfirmModal
                isOpen={showUnsaveConfirm}
                onClose={() => setShowUnsaveConfirm(false)}
                onConfirm={confirmUnsave}
                title="Remove from Saved?"
                description={'Are you sure you want to remove "' + recipe.title + '" by ' + (recipe.author_username || 'the Chef') + ' from your saved recipes?'}
                confirmText="Remove"
                isDanger={true}
            />

            <ConfirmModal
                isOpen={showCopyConfirm}
                onClose={() => setShowCopyConfirm(false)}
                onConfirm={async () => {
                    setShowCopyConfirm(false);
                    const newRecipe = await duplicateRecipe(recipe);
                    if (newRecipe) navigate('/recipe/' + newRecipe.id);
                }}
                title="Make a Copy?"
                description="This will create a new private copy of this recipe in your kitchen. You can edit it however you like."
                confirmText="Create Copy"
                isDanger={false}
                Icon={GitFork}
            />

            <ConfirmModal
                isOpen={showMissingOriginModal}
                onClose={() => setShowMissingOriginModal(false)}
                onConfirm={() => {
                    setShowMissingOriginModal(false);
                    navigate('/' + recipe.originAuthor);
                }}
                title="Original Recipe Unavailable"
                description={"The original recipe is either private or has been deleted. Would you like to visit " + (recipe.originAuthor || "the author") + "'s kitchen instead?"}
                confirmText="Visit Kitchen"
                isDanger={false}
                Icon={Info}
            />

            <ConfirmModal
                isOpen={showDeadLinkModal}
                onClose={() => setShowDeadLinkModal(false)}
                onConfirm={() => setShowDeadLinkModal(false)}
                title="Recipe Unavailable"
                description="The original recipe source is no longer available and the author is unknown."
                confirmText="Close"
                isDanger={false}
                Icon={Info}
                showCancel={false}
            />

            <VisibilityModal
                isOpen={isVisModalOpen}
                onClose={() => setIsVisModalOpen(false)}
                onConfirm={() => toggleVisibility(recipe.id, recipe.is_public)}
                isMakingPublic={!recipe.is_public}
            />

            <TranslationModal
                isOpen={actionModal.isOpen}
                onClose={() => !isProcessing && setActionModal({ isOpen: false, mode: null })}
                mode={actionModal.mode}
                onConfirm={executeAIAction}
                isProcessing={isProcessing}
                isPermanent={false}
            />

            <AIErrorModal
                isOpen={!!aiError}
                onClose={() => setAiError(null)}
                error={aiError}
            />
        </div>
    );
}
