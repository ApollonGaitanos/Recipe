import React, { useState, useEffect, useRef } from 'react';
import { Save, X, Sparkles, Lock, Globe, Plus, Trash2, ArrowLeft } from 'lucide-react';
import { useBlocker } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { useRecipes } from '../context/RecipeContext';
import { useLanguage } from '../context/LanguageContext';
import { RECIPE_CATEGORIES } from '../constants/categories';
import MagicImportModal from './MagicImportModal';
import VisibilityModal from './VisibilityModal';
import TranslationModal from './TranslationModal';
import ConfirmModal from './ConfirmModal';
import { parseRecipe } from '../utils/recipeParser';

// Note: RecipeForm now purely handles form state and validation.
// Persistence is delegated to the onSave prop.
export default function RecipeForm({ recipeId, onSave, onCancel }) {
    const { recipes } = useRecipes(); // Only read recipes for initial state if editing
    const { t } = useLanguage();
    const [showMagicImport, setShowMagicImport] = useState(false);
    const [showVisibilityModal, setShowVisibilityModal] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [actionModal, setActionModal] = useState({ isOpen: false, mode: null });
    const [isProcessingAI, setIsProcessingAI] = useState(false);
    const [pendingTranslations, setPendingTranslations] = useState([]);

    // Dirty State Tracking
    const [isDirty, setIsDirty] = useState(false);

    const [formData, setFormData] = useState({
        title: '',
        prepTime: '',
        cookTime: '',
        servings: '',
        ingredients: '',
        instructions: '',
        tags: '',
        is_public: false,
        description: ''
    });

    const markDirty = () => setIsDirty(true);


    // Helper to parse ingredients string into array
    const parseIngredients = (str) => {
        if (!str) return [{ id: Date.now(), amount: '', item: '' }];
        return str.split('\n').map((line, i) => {
            const parts = line.trim().split(' ');
            return {
                id: i,
                amount: parts[0] || '',
                item: parts.slice(1).join(' ') || ''
            };
        });
    };

    // Helper to parse tools array/string into internal list
    const parseTools = (data) => {
        if (!data) return [{ id: Date.now(), text: '' }];
        if (Array.isArray(data)) return data.map((t, i) => ({ id: Date.now() + i, text: t }));
        return String(data).split(',').map((t, i) => ({ id: Date.now() + i, text: t.trim() }));
    };

    // Helper to parse instructions string/array into internal list
    const parseInstructions = (data) => {
        if (!data) return [{ id: Date.now(), text: '' }];
        if (Array.isArray(data)) return data.map((step, i) => ({ id: Date.now() + i, text: step }));
        return String(data).split('\n').map((line, i) => ({
            id: Date.now() + i,
            text: line.trim()
        })).filter(step => step.text);
    };


    const [ingredientsList, setIngredientsList] = useState([]);
    const [instructionsList, setInstructionsList] = useState([]);
    const [toolsList, setToolsList] = useState([]);

    // --- BLOCKER LOGIC ---
    // Block navigation if form is dirty and not currently saving
    const blocker = useBlocker(isDirty && !isSaving);
    useEffect(() => {
        if (recipeId && recipes.length > 0) {
            const recipe = recipes.find(r => r.id === recipeId);
            if (recipe) {
                setFormData({
                    ...recipe,
                    tags: recipe.tags ? recipe.tags.join(', ') : '',
                    is_public: recipe.is_public || false,
                    description: recipe.description || ''
                });
                setIngredientsList(parseIngredients(recipe.ingredients));
                setInstructionsList(parseInstructions(recipe.instructions));
                setToolsList(parseTools(recipe.tools));
            }
        } else if (!recipeId) {
            // New Recipe Defaults
            setIngredientsList([{ id: Date.now(), amount: '', item: '' }]);
            setInstructionsList([{ id: Date.now(), text: '' }]);
            setToolsList([{ id: Date.now(), text: '' }]);
        }
    }, [recipeId, recipes]);

    const handleSaveLocal = async () => {
        setIsSaving(true);
        // Note: setting isSaving=true prevents blocker from triggering on navigation inside handleSave

        // Serialize lists back to strings
        const ingredientsStr = ingredientsList
            .map(ing => `${ing.amount} ${ing.item}`.trim())
            .filter(str => str.length > 0)
            .join('\n');

        const instructionsStr = instructionsList
            .map(step => step.text.trim())
            .filter(str => str.length > 0)
            .join('\n');

        const toolsArray = toolsList
            .map(t => t.text.trim())
            .filter(t => t.length > 0);

        const recipeData = {
            ...formData,
            ingredients: ingredientsStr,
            instructions: instructionsStr,
            tools: toolsArray,
            tags: formData.tags.split(',').map(tag => tag.trim()).filter(t => t),
            prepTime: Number(formData.prepTime) || 0,
            cookTime: Number(formData.cookTime) || 0,
            servings: Number(formData.servings) || 1,
            is_public: formData.is_public
        };

        try {
            // Save Recipe (Triggers DB Wipe of old translations)
            const savedRecipe = await onSave(recipeData);

            // Determine ID (New or Existing)
            const finalId = savedRecipe?.id || recipeId;

            // Batch Save Pending Translations (Restoring valid ones)
            if (finalId && pendingTranslations.length > 0) {
                console.log(`Saving ${pendingTranslations.length} pending translations for ${finalId}...`);
                const { error: transError } = await supabase
                    .from('recipe_translations')
                    .upsert(
                        pendingTranslations.map(t => ({
                            recipe_id: finalId,
                            language_code: t.language_code,
                            title: t.title,
                            ingredients: t.ingredients,
                            instructions: t.instructions,
                            tools: t.tools, // Save tools in translation too if schema supports it (User didn't ask explicitly but good practice)
                            tags: t.tags
                        }))
                    );

                if (transError) console.error("Error saving translations:", transError);
                else console.log("Translations saved successfully.");

                // Clear pending
                setPendingTranslations([]);
            }
            // Reset dirty state on successful save (though we usually navigate away)
            setIsDirty(false);

        } catch (error) {
            console.error("Save failed", error);
            setIsSaving(false); // Re-enable blocker if save failed
            alert(`Failed to save recipe: ${error.message || JSON.stringify(error)}`);
        }
    };

    const handleMagicImport = (data) => {
        setFormData(prev => ({
            ...prev,
            title: data.title || prev.title,
            prepTime: data.prepTime || prev.prepTime,
            cookTime: data.cookTime || prev.cookTime,
            servings: data.servings || prev.servings,
            description: data.description || prev.description
        }));
        markDirty();

        // Robust Ingredient Handling
        if (data.ingredients) {
            let newIngredients = [];

            if (Array.isArray(data.ingredients)) {
                // Check content of first element to decide strategy
                const firstItem = data.ingredients[0];

                if (typeof firstItem === 'object' && firstItem !== null) {
                    // Strategy A: Array of Objects ({ amount, name })
                    newIngredients = data.ingredients.map((ing, i) => ({
                        id: Date.now() + i,
                        amount: typeof ing.amount === 'object' ? JSON.stringify(ing.amount) : (ing.amount || ''), // Safety for nested objects
                        item: (typeof ing.name === 'object' ? JSON.stringify(ing.name) : ing.name) || (typeof ing.item === 'object' ? JSON.stringify(ing.item) : ing.item) || ''
                    }));
                } else {
                    // Strategy B: Array of Strings
                    newIngredients = data.ingredients.map((line, i) => {
                        // Attempt basic split if it looks like "1 cup Flour"
                        const parts = String(line).trim().split(' ');
                        const amount = parts[0] || '';
                        const item = parts.slice(1).join(' ') || line; // Fallback to full line if split looks weird
                        return {
                            id: Date.now() + i,
                            amount: amount,
                            item: item
                        };
                    });
                }
            } else if (typeof data.ingredients === 'string') {
                // Strategy C: Newline-separated String
                newIngredients = parseIngredients(data.ingredients);
            }

            if (newIngredients.length > 0) {
                setIngredientsList(newIngredients);
            }
        }

        if (data.instructions) setInstructionsList(parseInstructions(data.instructions));
        if (data.tools) setToolsList(parseTools(data.tools));
        if (data.tags && Array.isArray(data.tags)) {
            setFormData(prev => ({ ...prev, tags: data.tags.join(', ') }));
        }
    };

    // AI Enhance/Translate Logic
    // AI Enhance/Translate Logic
    const executeAIAction = async (targetLang) => {
        const mode = actionModal.mode;
        setIsProcessingAI(true);
        try {
            // Construct current recipe state from form (for AI Context)
            const currentRecipeState = {
                ...formData,
                ingredients: ingredientsList.map(ing => `${ing.amount} ${ing.item}`.trim()).join('\n'),
                instructions: instructionsList.map(step => step.text).join('\n'),
                tools: toolsList.map(t => t.text).filter(t => t)
            };

            const inputPayload = {
                text: JSON.stringify(currentRecipeState, null, 2),
                mode: mode,
                targetLanguage: targetLang || 'en' // default, controlled by modal
            };

            // Call AI
            const result = await parseRecipe(inputPayload, targetLang || 'en', mode);

            if (result) {
                // Determine Language Codes
                const detectedCode = result.detectedLanguage; // Should be returned by backend now
                const targetCode = targetLang || 'en';

                // If Translating: Snapshot both versions for "View Only" cache
                if (mode === 'translate' && detectedCode && targetCode) {
                    // 1. Snapshot Original (Current Form State)
                    const originalSnapshot = {
                        language_code: detectedCode,
                        title: formData.title,
                        ingredients: ingredientsList.map(ing => ({ amount: ing.amount, name: ing.item })),
                        instructions: instructionsList.map(i => i.text), // Array of strings
                        tools: toolsList.map(t => t.text),
                        tags: formData.tags.split(',').map(t => t.trim()).filter(Boolean)
                    };

                    // 2. Snapshot New (AI Result)
                    const newSnapshot = {
                        language_code: targetCode,
                        title: result.title,
                        ingredients: result.ingredients, // Already structured
                        instructions: result.instructions, // Array of strings (from backend)
                        tools: result.tools,
                        tags: result.tags
                    };

                    // Add to Pending
                    console.log("Queueing translations:", originalSnapshot.language_code, "&", newSnapshot.language_code);
                    setPendingTranslations(prev => [...prev, originalSnapshot, newSnapshot]);
                }

                // Update Form Data with Result (Apply Change Permanently)
                handleMagicImport(result);
                setActionModal({ isOpen: false, mode: null });
            }
        } catch (error) {
            console.error(`AI ${mode} failed:`, error);
            alert(`Failed: ${error.message}`);
        } finally {
            setIsProcessingAI(false);
        }
    };



    return (
        <div className="fixed inset-0 z-50 bg-background-light dark:bg-background-dark overflow-y-auto animate-in slide-in-from-bottom duration-300">

            {/* --- Top Navigation (Reference Match) --- */}
            <header className="sticky top-0 z-50 flex items-center justify-between border-b border-gray-200 dark:border-white/5 bg-white/95 dark:bg-surface-dark/95 backdrop-blur-sm px-6 py-4 lg:px-10 animate-in fade-in slide-in-from-top-2 duration-500">
                <div className="flex items-center gap-4">
                    <button
                        onClick={onCancel} // Triggers navigation, checking blocker
                        className="flex items-center gap-2 text-highlight hover:text-highlight/80 transition-colors"
                    >
                        <ArrowLeft size={24} />
                    </button>
                    <h2 className="text-xl font-bold leading-tight tracking-tight text-[#111813] dark:text-[#e0e6e2]">
                        {recipeId ? 'Edit Recipe' : 'New Recipe'}
                    </h2>
                    <span className="hidden sm:block text-xs font-medium text-[#63886f] dark:text-[#8ca395] bg-[#dce5df]/30 dark:bg-[#2a4030]/30 px-2 py-1 rounded">
                        Draft saved 2m ago
                    </span>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setShowMagicImport(true)}
                        className="flex h-10 items-center justify-center gap-2 rounded-lg border border-primary/30 bg-primary/5 px-4 text-sm font-bold text-highlight hover:bg-primary/10 transition-colors mr-1"
                    >
                        <Sparkles size={20} />
                        <span className="hidden md:inline">Magic Import</span>
                    </button>



                    <button
                        onClick={onCancel} // Triggers navigation, checking blocker
                        className="hidden sm:flex h-10 items-center justify-center rounded-lg bg-transparent px-4 text-sm font-bold text-[#63886f] dark:text-[#8ca395] hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                    >
                        Cancel
                    </button>

                    <button
                        onClick={handleSaveLocal} // Direct save call
                        disabled={isSaving}
                        className="flex h-10 items-center justify-center rounded-lg bg-primary px-6 text-sm font-bold text-white shadow-sm hover:opacity-90 transition-colors focus:ring-2 focus:ring-primary focus:ring-offset-2 dark:focus:ring-offset-background-dark"
                    >
                        {isSaving ? 'Saving...' : 'Save Recipe'}
                    </button>


                </div>
            </header>

            <main className="max-w-[1440px] mx-auto px-4 py-8 lg:px-10 lg:py-10">
                <div className="flex flex-col gap-10">

                    {/* --- Title Input (Full Width) --- */}
                    <div className="flex flex-col gap-2">
                        <label className="text-sm font-bold uppercase tracking-wider text-[#63886f] dark:text-[#8ca395]">Recipe Title</label>
                        <input
                            className="w-full bg-transparent border-0 border-b-2 border-gray-200 dark:border-white/5 focus:border-primary dark:focus:border-primary focus:ring-0 px-0 py-2 text-3xl md:text-5xl font-bold placeholder:text-gray-400 dark:placeholder:text-gray-500 transition-colors font-serif"
                            type="text"
                            value={formData.title}
                            onChange={(e) => {
                                setFormData(prev => ({ ...prev, title: e.target.value }));
                                markDirty();
                            }}
                            placeholder="e.g. Grandma's Spanakopita"
                        />
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">

                        {/* --- Left Column (Ingredients, Tools, Description, Photo) --- */}
                        <div className="lg:col-span-5 xl:col-span-4 flex flex-col gap-8">

                            {/* Ingredients Section */}
                            <section className="bg-white dark:bg-[#1a2c20] rounded-xl p-6 shadow-sm border border-[#dce5df] dark:border-[#2a4030]">
                                <div className="flex items-center justify-between mb-6">
                                    <h3 className="text-xl font-bold text-[#111813] dark:text-[#e0e6e2] flex items-center gap-2">
                                        Ingredients
                                    </h3>
                                </div>

                                <div className="flex flex-col gap-4">
                                    <div className="hidden sm:flex gap-4 px-2 pb-2 border-b border-[#dce5df] dark:border-[#2a4030] text-xs font-bold uppercase text-[#63886f] dark:text-[#8ca395] tracking-wider">
                                        <span className="w-8"></span>
                                        <span className="w-20">Amount</span>
                                        <span className="flex-1">Ingredient</span>
                                        <span className="w-8"></span>
                                    </div>

                                    {ingredientsList.map((ing, i) => (
                                        <div key={ing.id} className="group flex flex-col sm:flex-row gap-3 sm:items-center">
                                            <div className="hidden sm:flex w-8 justify-center text-[#63886f]/40 cursor-move hover:text-[#63886f]">
                                                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M11 18c0 1.1-.9 2-2 2s-2-.9-2-2 .9-2 2-2 2 .9 2 2zm-2-8c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0-6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm6 4c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" /></svg>
                                            </div>
                                            <input
                                                className="w-full sm:w-20 rounded-lg border border-gray-200 dark:border-white/5 bg-gray-50 dark:bg-background-dark px-3 py-2.5 text-sm focus:border-primary focus:ring-primary"
                                                placeholder="200g"
                                                value={ing.amount}
                                                onChange={e => {
                                                    const newList = [...ingredientsList];
                                                    newList[i].amount = e.target.value;
                                                    setIngredientsList(newList);
                                                    markDirty();
                                                }}
                                            />
                                            <input
                                                className="flex-1 rounded-lg border border-gray-200 dark:border-white/5 bg-gray-50 dark:bg-background-dark px-3 py-2.5 text-sm focus:border-primary focus:ring-primary"
                                                placeholder="Flour"
                                                value={ing.item}
                                                onChange={e => {
                                                    const newList = [...ingredientsList];
                                                    newList[i].item = e.target.value;
                                                    setIngredientsList(newList);
                                                    markDirty();
                                                }}
                                            />
                                            <button
                                                onClick={() => {
                                                    setIngredientsList(ingredientsList.filter(item => item.id !== ing.id));
                                                    markDirty();
                                                }}
                                                className="hidden group-hover:flex w-8 justify-center text-[#63886f]/60 hover:text-red-500 transition-colors"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    ))}
                                </div>

                                <button
                                    onClick={() => {
                                        setIngredientsList([...ingredientsList, { id: Date.now(), amount: '', item: '' }]);
                                        markDirty();
                                    }}
                                    className="mt-6 flex items-center gap-2 text-sm font-bold text-highlight hover:text-highlight/80 transition-colors"
                                >
                                    <Plus size={18} /> Add Ingredient
                                </button>
                            </section>

                            {/* Tools Section (New) */}
                            <section className="bg-white dark:bg-[#1a2c20] rounded-xl p-6 shadow-sm border border-[#dce5df] dark:border-[#2a4030]">
                                <div className="flex items-center justify-between mb-6">
                                    <h3 className="text-xl font-bold text-[#111813] dark:text-[#e0e6e2] flex items-center gap-2">
                                        Tools & Equipment
                                    </h3>
                                </div>

                                <div className="flex flex-col gap-4">
                                    {toolsList.map((tool, i) => (
                                        <div key={tool.id} className="group flex flex-col sm:flex-row gap-3 sm:items-center">
                                            <div className="hidden sm:flex w-8 justify-center text-[#63886f]/40 cursor-move hover:text-[#63886f]">
                                                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M11 18c0 1.1-.9 2-2 2s-2-.9-2-2 .9-2 2-2 2 .9 2 2zm-2-8c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0-6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm6 4c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" /></svg>
                                            </div>
                                            <input
                                                className="flex-1 rounded-lg border border-gray-200 dark:border-white/5 bg-gray-50 dark:bg-background-dark px-3 py-2.5 text-sm focus:border-primary focus:ring-primary"
                                                placeholder="e.g. Large Skillet"
                                                value={tool.text}
                                                onChange={e => {
                                                    const newList = [...toolsList];
                                                    newList[i].text = e.target.value;
                                                    setToolsList(newList);
                                                    markDirty();
                                                }}
                                            />
                                            <button
                                                onClick={() => {
                                                    setToolsList(toolsList.filter(item => item.id !== tool.id));
                                                    markDirty();
                                                }}
                                                className="hidden group-hover:flex w-8 justify-center text-[#63886f]/60 hover:text-red-500 transition-colors"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    ))}
                                </div>

                                <button
                                    onClick={() => {
                                        setToolsList([...toolsList, { id: Date.now(), text: '' }]);
                                        markDirty();
                                    }}
                                    className="mt-6 flex items-center gap-2 text-sm font-bold text-highlight hover:text-highlight/80 transition-colors"
                                >
                                    <Plus size={18} /> Add Tool
                                </button>
                            </section>

                            {/* Description (Moved above Photo) */}
                            <div className="flex flex-col gap-3">
                                <label className="text-sm font-bold uppercase tracking-wider text-[#63886f] dark:text-[#8ca395]">Story & Description</label>
                                <textarea
                                    value={formData.description || ''}
                                    onChange={(e) => {
                                        setFormData(prev => ({ ...prev, description: e.target.value }));
                                        markDirty();
                                    }}
                                    placeholder="Share the story behind this recipe, flavor notes, or why it's special..."
                                    className="w-full rounded-xl border border-gray-200 dark:border-white/5 bg-white dark:bg-surface-dark p-4 text-base focus:border-primary focus:ring-1 focus:ring-primary dark:focus:ring-primary placeholder:text-gray-400 dark:placeholder:text-gray-500 resize-none"
                                    rows={6}
                                />
                            </div>

                            {/* Categories Section */}
                            <div className="flex flex-col gap-3">
                                <label className="text-sm font-bold uppercase tracking-wider text-[#63886f] dark:text-[#8ca395]">
                                    {t('tagsLabel') || "Categories"}
                                </label>
                                <div className="flex flex-wrap gap-2">
                                    {RECIPE_CATEGORIES.map(category => {
                                        const currentTags = formData.tags ? formData.tags.split(',').map(t => t.trim()) : [];
                                        const isActive = currentTags.some(t => t.toLowerCase() === category.id.toLowerCase());

                                        return (
                                            <button
                                                key={category.id}
                                                type="button" // Prevent form submission
                                                onClick={() => {
                                                    let newTags;
                                                    if (isActive) {
                                                        newTags = currentTags.filter(t => t.toLowerCase() !== category.id.toLowerCase());
                                                    } else {
                                                        newTags = [...currentTags, category.id];
                                                    }
                                                    setFormData(prev => ({ ...prev, tags: newTags.join(', ') }));
                                                    markDirty();
                                                }}
                                                className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-all ${isActive
                                                    ? 'bg-primary text-white border-primary'
                                                    : 'bg-white dark:bg-surface-dark text-gray-500 dark:text-gray-400 border-gray-200 dark:border-white/5 hover:border-primary'
                                                    }`}
                                            >
                                                {t(category.labelKey)}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Photo Upload (Moved below Description) */}
                            <div className="group relative aspect-[4/3] w-full overflow-hidden rounded-xl border-2 border-dashed border-gray-200 dark:border-white/5 bg-white dark:bg-surface-dark hover:border-primary/50 hover:bg-primary/5 transition-all cursor-pointer flex flex-col items-center justify-center text-center p-6">
                                <div className="bg-primary/10 text-highlight p-4 rounded-full mb-3 group-hover:scale-110 transition-transform">
                                    <Sparkles className="text-highlight" size={32} />
                                </div>
                                <p className="font-bold text-lg">Add Cover Photo</p>
                                <p className="text-sm text-[#63886f] dark:text-[#8ca395] mt-1">Drag and drop or click to upload</p>
                            </div>

                        </div>

                        {/* --- Right Column (Details, Method) --- */}
                        <div className="lg:col-span-7 xl:col-span-8 flex flex-col gap-10">


                            {/* Details Card (Moved from Left) */}
                            <div className="rounded-xl border border-[#dce5df] dark:border-[#2a4030] bg-white dark:bg-[#1a2c20] p-6 lg:p-8 shadow-sm">
                                <h3 className="text-lg font-bold mb-5 flex items-center gap-2">
                                    <Sparkles className="text-highlight" size={20} />
                                    Details
                                </h3>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                                    <div className="flex flex-col gap-1">
                                        <span className="text-xs font-medium text-[#63886f] dark:text-[#8ca395] uppercase">Prep Time</span>
                                        <div className="flex items-center gap-2">
                                            <input
                                                className="w-full rounded-lg border border-gray-200 dark:border-white/5 bg-gray-50 dark:bg-background-dark p-2 text-center font-bold focus:border-primary focus:ring-primary"
                                                type="number"
                                                min="0"
                                                value={formData.prepTime}
                                                onKeyDown={(e) => ['-', '+', 'e', 'E', '.'].includes(e.key) && e.preventDefault()}
                                                onChange={(e) => {
                                                    setFormData(prev => ({ ...prev, prepTime: e.target.value }));
                                                    markDirty();
                                                }}
                                                placeholder="15"
                                            />
                                            <span className="text-sm">min</span>
                                        </div>
                                    </div>
                                    <div className="flex flex-col gap-1">
                                        <span className="text-xs font-medium text-[#63886f] dark:text-[#8ca395] uppercase">Cook Time</span>
                                        <div className="flex items-center gap-2">
                                            <input
                                                className="w-full rounded-lg border border-gray-200 dark:border-white/5 bg-gray-50 dark:bg-background-dark p-2 text-center font-bold focus:border-primary focus:ring-primary"
                                                type="number"
                                                min="0"
                                                value={formData.cookTime}
                                                onKeyDown={(e) => ['-', '+', 'e', 'E', '.'].includes(e.key) && e.preventDefault()}
                                                onChange={(e) => {
                                                    setFormData(prev => ({ ...prev, cookTime: e.target.value }));
                                                    markDirty();
                                                }}
                                                placeholder="45"
                                            />
                                            <span className="text-sm">min</span>
                                        </div>
                                    </div>
                                    <div className="flex flex-col gap-1 col-span-2 md:col-span-1">
                                        <span className="text-xs font-medium text-[#63886f] dark:text-[#8ca395] uppercase">Servings</span>
                                        <input
                                            className="w-full rounded-lg border border-gray-200 dark:border-white/5 bg-gray-50 dark:bg-background-dark p-2 text-center font-bold focus:border-primary focus:ring-primary"
                                            type="number"
                                            min="0"
                                            value={formData.servings}
                                            onKeyDown={(e) => ['-', '+', 'e', 'E', '.'].includes(e.key) && e.preventDefault()}
                                            onChange={(e) => {
                                                setFormData(prev => ({ ...prev, servings: e.target.value }));
                                                markDirty();
                                            }}
                                            placeholder="4"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Method Section (Stays in Right Column) */}
                            <section className="bg-white dark:bg-[#1a2c20] rounded-xl p-6 lg:p-8 shadow-sm border border-[#dce5df] dark:border-[#2a4030]">
                                <div className="flex items-center justify-between mb-6">
                                    <h3 className="text-2xl font-bold text-[#111813] dark:text-[#e0e6e2]">Method</h3>
                                    <button
                                        onClick={() => setActionModal({ isOpen: true, mode: 'improve' })}
                                        className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-purple-900/40 transition-colors text-xs font-bold"
                                    >
                                        <Sparkles size={14} />
                                        Enhance with AI
                                    </button>
                                </div>

                                <div className="flex flex-col gap-6">
                                    {instructionsList.map((step, i) => (
                                        <div key={step.id} className="group flex gap-4">
                                            <div className="flex flex-col items-center gap-2 pt-2">
                                                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-highlight dark:bg-primary/20">
                                                    {i + 1}
                                                </div>
                                                <div className="h-full w-0.5 bg-[#dce5df] dark:bg-[#2a4030] group-last:hidden"></div>
                                            </div>
                                            <div className="flex-1 pb-4">
                                                <textarea
                                                    className="w-full rounded-lg border border-gray-200 dark:border-white/5 bg-gray-50 dark:bg-background-dark p-4 text-base focus:border-primary focus:ring-primary placeholder:text-gray-400 dark:placeholder:text-gray-500 min-h-[100px]"
                                                    placeholder={`Describe step ${i + 1}...`}
                                                    value={step.text}
                                                    onChange={e => {
                                                        const newList = [...instructionsList];
                                                        newList[i].text = e.target.value;
                                                        setInstructionsList(newList);
                                                        markDirty();
                                                    }}
                                                ></textarea>
                                                <div className="mt-2 flex items-center gap-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button
                                                        onClick={() => {
                                                            setInstructionsList(instructionsList.filter(s => s.id !== step.id));
                                                            markDirty();
                                                        }}
                                                        className="flex items-center gap-1 text-xs font-medium text-[#63886f] hover:text-red-500 transition-colors"
                                                    >
                                                        <Trash2 size={14} /> Remove Step
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <button
                                    onClick={() => {
                                        setInstructionsList([...instructionsList, { id: Date.now(), text: '' }]);
                                        markDirty();
                                    }}
                                    className="mt-2 flex items-center gap-2 text-sm font-bold text-highlight hover:text-highlight/80 transition-colors"
                                >
                                    <Plus size={18} /> Add Step
                                </button>
                            </section>

                        </div>
                    </div>
                </div>
            </main>

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
            <TranslationModal
                isOpen={actionModal.isOpen}
                onClose={() => !isProcessingAI && setActionModal({ isOpen: false, mode: null })}
                mode={actionModal.mode}
                onConfirm={executeAIAction}
                isProcessing={isProcessingAI}
                isPermanent={true}
            />
            <ConfirmModal
                isOpen={blocker.state === 'blocked'}
                onClose={() => blocker.reset()}
                onConfirm={() => blocker.proceed()}
                title="Discard Changes?"
                description="You have unsaved changes. Are you sure you want to discard them?"
                confirmText="Discard"
                isDanger={true}
            />
        </div>
    );
}
