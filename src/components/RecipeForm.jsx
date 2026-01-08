
import React, { useState, useEffect } from 'react';
import { Save, X, Sparkles, Lock, Globe, ArrowLeft, Wand2 } from 'lucide-react';
import { useBlocker } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext';
import VisibilityModal from './VisibilityModal';
import TranslationModal from './TranslationModal';
import ConfirmModal from './ConfirmModal';
import { parseRecipe } from '../utils/recipeParser';
import AIErrorModal from './AIErrorModal';

// Sub-components
import IngredientsList from './RecipeForm/IngredientsList';
import InstructionsList from './RecipeForm/InstructionsList';
import ToolsList from './RecipeForm/ToolsList';
import RecipeMetadata from './RecipeForm/RecipeMetadata';
import MagicImportModal from './MagicImportModal';
import AIFeaturesModal from './RecipeForm/AIFeaturesModal';
import BlockerModal from './BlockerModal';
import AIChefModal from './AIChefModal';
import PhotoUpload from './PhotoUpload';

// Note: RecipeForm now purely handles form state and validation.
// Persistence is delegated to the onSave prop.
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
    description: '',
    image: null,
    calories: '',
    protein: '',
    carbs: '',
    fat: ''
});

const [showVisibilityModal, setShowVisibilityModal] = useState(false);

// List States (Structured Data)
const [ingredientsList, setIngredientsList] = useState([]);
const [instructionsList, setInstructionsList] = useState([]);
const [toolsList, setToolsList] = useState([]);

// UI States
const [isLoading, setIsLoading] = useState(true);
const [isSaving, setIsSaving] = useState(false);

// Modal States
const [aiFeaturesOpen, setAiFeaturesOpen] = useState(false);
const [actionModal, setActionModal] = useState({ isOpen: false, mode: null }); // 'magic', 'enhance', 'translate', 'create'
const [aiError, setAiError] = useState(null);
const [isProcessingAI, setIsProcessingAI] = useState(false);
const [pendingTranslations, setPendingTranslations] = useState([]);
const [validationError, setValidationError] = useState(null);

const markDirty = () => setIsDirty(true);

// Helpers to parse legacy data
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

const parseTools = (data) => {
    if (!data) return [{ id: Date.now(), text: '' }];
    if (Array.isArray(data)) return data.map((t, i) => ({ id: Date.now() + i, text: t }));
    return String(data).split(',').map((t, i) => ({ id: Date.now() + i, text: t.trim() }));
};

const parseInstructions = (data) => {
    if (!data) return [{ id: Date.now(), text: '' }];
    if (Array.isArray(data)) return data.map((step, i) => ({ id: Date.now() + i, text: step }));
    return String(data).split('\n').map((line, i) => ({
        id: Date.now() + i,
        text: line.trim()
    })).filter(step => step.text);
};

// --- EFFECT: Load Data ---
useEffect(() => {
    const load = async () => {
        if (recipeId && recipeId !== 'new') {
            try {
                const { data, error } = await supabase
                    .from('recipes')
                    .select('*')
                    .eq('id', recipeId)
                    .single();

                if (error) throw error;

                setFormData({
                    title: data.title,
                    prepTime: data.prep_time || '',
                    cookTime: data.cook_time || '',
                    servings: data.servings || '',
                    ingredients: data.ingredients || '',
                    instructions: data.instructions || '',
                    tags: Array.isArray(data.tags) ? data.tags.join(', ') : (data.tags || ''),
                    is_public: data.is_public,
                    description: data.description || '',
                    image: data.image_url,
                    calories: data.calories || '',
                    protein: data.protein || '',
                    carbs: data.carbs || '',
                    fat: data.fat || ''
                });



                // Structured Data Parsing
                if (data.ingredients) {
                    try {
                        const parsedIng = typeof data.ingredients === 'string'
                            ? JSON.parse(data.ingredients) // If stored as JSON string
                            : data.ingredients;

                        // Check if it matches our object structure
                        if (Array.isArray(parsedIng) && typeof parsedIng[0] === 'object') {
                            setIngredientsList(parsedIng.map((ing, i) => ({ ...ing, id: Date.now() + i })));
                        } else {
                            // Fallback to line parser
                            setIngredientsList(parseIngredients(String(data.ingredients)));
                        }
                    } catch (e) {
                        setIngredientsList(parseIngredients(String(data.ingredients)));
                    }
                }

                if (data.instructions) {
                    try {
                        const parsedInst = typeof data.instructions === 'string' && data.instructions.startsWith('[')
                            ? JSON.parse(data.instructions)
                            : data.instructions;
                        setInstructionsList(parseInstructions(parsedInst));
                    } catch (e) {
                        setInstructionsList(parseInstructions(data.instructions));
                    }
                }

            } catch (error) {
                console.error('Error loading recipe:', error);
            }
        } else {
            // New Recipe
            setIngredientsList([{ id: Date.now(), amount: '', item: '' }]);
            setInstructionsList([{ id: Date.now(), text: '' }]);
            setToolsList([{ id: Date.now(), text: '' }]);
        }
        setIsLoading(false);
    };
    load();
}, [recipeId]);

// Blocker logic
const blocker = useBlocker(({ currentLocation }) => {
    return isDirty && !isSaving && currentLocation.pathname !== '/';
});

// Handlers
const handleMetadataChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    markDirty();
};



const handleTagChange = (e) => {
    setFormData(prev => ({ ...prev, tags: e.target.value }));
    markDirty();
};


const handleSaveLocal = async () => {
    if (!formData.title.trim()) {
        setValidationError('Please enter a recipe title');
        return;
    }

    setIsSaving(true);
    try {
        // Reconstruct structured data for save
        const finalIngredients = ingredientsList.map(({ id, ...rest }) => rest).filter(i => i.item.trim());
        const finalInstructions = instructionsList.map(i => i.text).filter(t => t.trim());

        const submissionData = {
            ...formData,
            prepTime: formData.prepTime ? parseInt(formData.prepTime, 10) : 0,
            cookTime: formData.cookTime ? parseInt(formData.cookTime, 10) : 0,
            servings: formData.servings ? parseInt(formData.servings, 10) : 0,
            ingredients: finalIngredients, // Save as JSON object array
            instructions: finalInstructions,
            tags: formData.tags.split(',').map(t => t.trim()).filter(Boolean),
            calories: formData.calories,
            protein: formData.protein,
            carbs: formData.carbs,
            fat: formData.fat
        };

        // Call Parent Save
        await onSave(submissionData);

        // Handle Pending Translations
        if (pendingTranslations.length > 0) {
            const { data: latest } = await supabase.from('recipes').select('id').eq('title', formData.title).order('created_at', { ascending: false }).limit(1).single();

            if (latest) {
                await supabase.from('recipe_translations').upsert(
                    pendingTranslations.map(t => ({
                        recipe_id: latest.id,
                        language_code: t.language_code,
                        title: t.title,
                        ingredients: t.ingredients, // JSON
                        instructions: t.instructions, // Array
                        tags: t.tags
                    }))
                );
            }
        }

        setIsDirty(false);
        setPendingTranslations([]);

    } catch (error) {
        console.error(error);
        setAiError("Failed to save recipe. " + (error.message || "Unknown error"));
    } finally {
        setIsSaving(false);
    }
};

const handleMagicImport = (data) => {
    // 1. Core Metadata (Overwrite if provided, standard behavior)
    if (data.title) handleMetadataChange('title', data.title);
    if (data.prepTime) handleMetadataChange('prepTime', data.prepTime);
    if (data.cookTime) handleMetadataChange('cookTime', data.cookTime);
    if (data.servings) handleMetadataChange('servings', data.servings);

    // 2. Description: Add ONLY if currently empty
    if (!formData.description && data.description) {
        handleMetadataChange('description', data.description);
    }

    // 3. Nutrition: Add ONLY if currently empty
    const parseNutrition = (val) => {
        if (!val) return '';
        const match = String(val).match(/(\d+)/);
        return match ? match[1] : '';
    };

    if (!formData.calories) handleMetadataChange('calories', parseNutrition(data.calories || data.nutrition?.calories));
    if (!formData.protein) handleMetadataChange('protein', parseNutrition(data.protein || data.nutrition?.protein));
    if (!formData.carbs) handleMetadataChange('carbs', parseNutrition(data.carbs || data.nutrition?.carbs));
    if (!formData.fat) handleMetadataChange('fat', parseNutrition(data.fat || data.nutrition?.fat));

    // 4. Tags (Filters): Additive (Merge unique variables)
    if (data.tags && Array.isArray(data.tags)) {
        const currentTags = formData.tags.split(',').map(t => t.trim()).filter(Boolean);
        const newTags = data.tags.filter(t => !currentTags.includes(t));
        if (newTags.length > 0) {
            handleMetadataChange('tags', [...currentTags, ...newTags].join(', '));
        }
    }

    // 5. Ingredients: Overwrite (Standard behavior for "Enhance" / "Import")
    if (data.ingredients) {
        let newIngs = [];
        if (Array.isArray(data.ingredients)) {
            // Check if objects or strings
            if (typeof data.ingredients[0] === 'object') {
                newIngs = data.ingredients.map((ing, i) => ({
                    id: Date.now() + i,
                    amount: typeof ing.amount === 'object' ? JSON.stringify(ing.amount) : (ing.amount || ''),
                    item: ing.name || ing.item || ''
                }));
            } else {
                // Strings
                newIngs = data.ingredients.map((line, i) => {
                    const parts = String(line).trim().split(' ');
                    return {
                        id: Date.now() + i,
                        amount: parts[0] || '',
                        item: parts.slice(1).join(' ') || line
                    };
                });
            }
        }
        if (newIngs.length > 0) setIngredientsList(newIngs);
    }

    // 6. Instructions: Overwrite (Standard behavior to allow improvements)
    if (data.instructions) setInstructionsList(parseInstructions(data.instructions));

    // 7. Tools: Additive (Merge unique)
    if (data.tools) {
        const newToolsRaw = Array.isArray(data.tools) ? data.tools : String(data.tools).split(',');
        setToolsList(prevTools => {
            const existingTexts = new Set(prevTools.map(t => t.text.toLowerCase().trim()).filter(Boolean));
            const uniqueNew = newToolsRaw
                .map(t => t.trim())
                .filter(t => t && !existingTexts.has(t.toLowerCase()))
                .map((t, i) => ({ id: Date.now() + 2000 + i, text: t }));

            // Return previous tools + new unique tools
            return [...prevTools, ...uniqueNew];
        });
    }

    markDirty();
};


// AI Execution
const executeAIAction = async (targetLang) => {
    const mode = actionModal.mode;
    setIsProcessingAI(true);
    try {
        // Construct context from current state
        const currentRecipeState = {
            ...formData,
            ingredients: ingredientsList.map(ing => (ing.amount + ' ' + ing.item).trim()).join('\n'),
            instructions: instructionsList.map(step => step.text).join('\n'),
            tools: toolsList.map(t => t.text).filter(Boolean)
        };

        const inputPayload = {
            text: JSON.stringify(currentRecipeState, null, 2),
            mode: mode,
            targetLanguage: targetLang || 'en'
        };

        const result = await parseRecipe(inputPayload, targetLang || 'en', mode);

        if (result) {
            // Translation Logic (Snapshotting)
            if (mode === 'translate') {
                const detectedCode = result.detectedLanguage;
                const targetCode = targetLang || 'en';
                if (detectedCode && targetCode) {
                    const originalSnapshot = {
                        language_code: detectedCode,
                        title: formData.title,
                        ingredients: ingredientsList.map(i => ({ amount: i.amount, name: i.item })),
                        instructions: instructionsList.map(i => i.text),
                        tags: formData.tags.split(',').map(t => t.trim()).filter(Boolean)
                    };
                    const newSnapshot = {
                        language_code: targetCode,
                        title: result.title,
                        ingredients: result.ingredients,
                        instructions: result.instructions,
                        tags: result.tags
                    };
                    setPendingTranslations(prev => [...prev, originalSnapshot, newSnapshot]);
                }
            }

            handleMagicImport(result);
            setActionModal({ isOpen: false, mode: null });
        }
    } catch (error) {
        setAiError(error.message || "AI Error");
    } finally {
        setIsProcessingAI(false);
    }
};

// Feature Choice Handler
const handleAIFeatureSelect = (featureId) => {
    setAiFeaturesOpen(false);
    if (featureId === 'magic') {
        setActionModal({ isOpen: true, mode: 'magic' });
    } else if (featureId === 'chef') {
        setActionModal({ isOpen: true, mode: 'create' });
    } else {
        setActionModal({ isOpen: true, mode: featureId });
    }
};

const handleBackToFeatures = () => {
    setActionModal({ isOpen: false, mode: null });
    setAiFeaturesOpen(true);
};

if (isLoading) return <div className="p-8 text-center text-gray-500">Loading recipe...</div>;

return (
    <div className="max-w-7xl mx-auto px-4 pb-20 pt-6">

        {/* Header */}
        <div className="flex items-center justify-between mb-8 sticky top-0 bg-[#fbfdfc] dark:bg-[#112116] z-40 py-4 border-b border-gray-100 dark:border-white/5 lg:static lg:bg-transparent lg:border-none lg:p-0">
            <div className="flex items-center gap-4">
                <button onClick={onCancel} className="p-2 -ml-2 hover:bg-gray-100 dark:hover:bg-white/5 rounded-full transition-colors hidden lg:flex">
                    <ArrowLeft size={24} className="text-gray-600 dark:text-gray-300" />
                </button>
                {/* Public/Private Toggle */}
                <label className="flex items-center gap-3 cursor-pointer group">
                    <div className="relative">
                        <input
                            type="checkbox"
                            className="sr-only peer"
                            checked={formData.is_public}
                            onChange={() => setShowVisibilityModal(true)}
                        />
                        <div className="w-14 h-8 bg-gray-200 dark:bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-[#63886f]"></div>
                    </div>
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-300 flex items-center gap-1.5 group-hover:text-gray-900 dark:group-hover:text-white transition-colors">
                        {formData.is_public ? <Globe size={16} /> : <Lock size={16} />}
                        {formData.is_public ? 'Public' : 'Private'}
                    </span>
                </label>
            </div>

            <div className="flex gap-2 lg:gap-3 items-center">
                <button
                    onClick={onCancel}
                    className="p-2.5 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5 rounded-full transition-colors lg:hidden"
                    title="Cancel"
                >
                    <X size={20} />
                </button>
                <button
                    onClick={onCancel}
                    className="px-6 py-2 rounded-full font-bold text-gray-500 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors hidden lg:block"
                >
                    Cancel
                </button>

                {/* AI Features Button */}
                <button
                    onClick={() => setAiFeaturesOpen(true)}
                    className="flex items-center gap-2 px-3 sm:px-5 py-2.5 rounded-full bg-gradient-to-r from-purple-500/10 to-blue-500/10 dark:from-purple-500/20 dark:to-blue-500/20 text-[#63886f] hover:from-purple-500/20 hover:to-blue-500/20 transition-all border border-[#dce5df] dark:border-[#2a4030] text-sm font-bold"
                >
                    <Sparkles size={16} className="text-purple-500" />
                    <span className="hidden sm:inline">AI Features</span>
                </button>

                {/* Save */}
                <button
                    type="button"
                    onClick={handleSaveLocal}
                    disabled={isSaving}
                    className="flex items-center gap-2 bg-[#1a2c20] dark:bg-[#63886f] text-white px-4 sm:px-8 py-2.5 rounded-full font-bold hover:opacity-90 transition-all shadow-lg shadow-[#63886f]/20 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isSaving ? (
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                        <>
                            <Save size={18} />
                            <span className="hidden sm:inline">Save</span>
                            <span className="sm:hidden">Save</span>
                        </>
                    )}
                </button>
            </div>
        </div>

        {/* Main Form */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">

            {/* Left Column (5 cols): Photo, Ingredients, Tools */}
            <div className="lg:col-span-5 space-y-8">

                {/* 1. Photo Upload (Top Left) */}
                {/* 1. Photo Upload (Top Left) */}
                <PhotoUpload
                    currentImage={formData.image}
                    onImageChange={(url) => {
                        setFormData(prev => ({ ...prev, image: url }));
                        markDirty();
                    }}
                />

                <IngredientsList
                    ingredients={ingredientsList}
                    setIngredients={setIngredientsList}
                    markDirty={markDirty}
                />

                <ToolsList
                    tools={toolsList}
                    setTools={setToolsList}
                    markDirty={markDirty}
                />
            </div>

            {/* Right Column (7 cols): Title, Metadata, Instructions */}
            <div className="lg:col-span-7 space-y-8">

                {/* 2. Title (Top Right) */}
                <div className="space-y-2">
                    <input
                        className="w-full bg-transparent text-4xl md:text-5xl font-serif font-bold text-[#111813] dark:text-[#e0e6e2] border-b border-[#dce5df] dark:border-[#2a4030] pb-4 focus:border-primary focus:ring-0 placeholder-gray-300 dark:placeholder-gray-600 transition-colors"
                        placeholder="Recipe Title"
                        value={formData.title}
                        onChange={e => handleMetadataChange('title', e.target.value)}
                    />
                </div>

                {/* Metadata (Desc, Time, Servings, Tags) */}
                <RecipeMetadata
                    formData={formData}
                    handleChange={handleMetadataChange}
                    handleTagChange={handleTagChange}
                />

                {/* Instructions */}
                <InstructionsList
                    instructions={instructionsList}
                    setInstructions={setInstructionsList}
                    markDirty={markDirty}
                />
            </div>

        </div>

        {/* Modals */}
        <VisibilityModal
            isOpen={showVisibilityModal}
            onClose={() => setShowVisibilityModal(false)}
            onConfirm={() => handleMetadataChange('is_public', !formData.is_public)}
            isMakingPublic={!formData.is_public}
        />

        <AIChefModal
            isOpen={actionModal.isOpen && (actionModal.mode === 'chef' || actionModal.mode === 'create')}
            onClose={() => setActionModal({ isOpen: false, mode: null })}
            onBack={handleBackToFeatures}
            onImport={(data) => {
                handleMagicImport(data);
                setActionModal({ isOpen: false, mode: null });
            }}
        />

        <MagicImportModal
            isOpen={actionModal.isOpen && actionModal.mode === 'magic'}
            onClose={() => setActionModal({ isOpen: false, mode: null })}
            onBack={handleBackToFeatures}
            onImport={(data) => {
                handleMagicImport(data);
                setActionModal({ isOpen: false, mode: null });
            }}
        />

        <TranslationModal
            isOpen={actionModal.isOpen && (actionModal.mode === 'enhance' || actionModal.mode === 'translate')}
            onClose={() => !isProcessingAI && setActionModal({ isOpen: false, mode: null })}
            onBack={handleBackToFeatures}
            mode={actionModal.mode}
            onConfirm={executeAIAction}
            isProcessing={isProcessingAI}
            isPermanent={true}
        />

        <AIFeaturesModal
            isOpen={aiFeaturesOpen}
            onClose={() => setAiFeaturesOpen(false)}
            onSelect={handleAIFeatureSelect}
        />

        <AIErrorModal
            isOpen={!!aiError}
            onClose={() => setAiError(null)}
            error={aiError}
        />

        <ConfirmModal
            isOpen={!!validationError}
            onClose={() => setValidationError(null)}
            onConfirm={() => setValidationError(null)}
            title="Validation Error"
            message={validationError}
            confirmText="OK"
        />

        <BlockerModal
            isOpen={blocker.state === 'blocked'}
            onClose={() => blocker.reset()}
            onConfirm={() => blocker.proceed()}
        />

    </div>
);
}
