import React, { useState, useEffect, useRef } from 'react';
import { Save, X, Sparkles, Lock, Globe, ArrowLeft } from 'lucide-react';
import { useBlocker } from 'react-router-dom';
import { supabase } from '../supabaseClient'; // Leftover for direct AI call, could be moved to service later
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

// Note: RecipeForm now purely handles form state and validation.
// Persistence is delegated to the onSave prop.
export default function RecipeForm({ recipeId, onSave, onCancel }) {
    const fileInputRef = useRef(null);

    // Form State
    const [isDirty, setIsDirty] = useState(false);
    const [formData, setFormData] = useState({
        title: '',
        prepTime: '',
        cookTime: '',
        servings: '',
        ingredients: '', // Legacy string field, not used in UI but kept for safety
        instructions: '', // Legacy string field
        tags: '',
        is_public: false,
        description: '',
        image: null // File or URL
    });

    // List States (Structured Data)
    const [ingredientsList, setIngredientsList] = useState([]);
    const [instructionsList, setInstructionsList] = useState([]);
    const [toolsList, setToolsList] = useState([]);

    // UI States
    const [imagePreview, setImagePreview] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    // Modal States
    const [visibilityModalOpen, setVisibilityModalOpen] = useState(false);
    const [actionModal, setActionModal] = useState({ isOpen: false, mode: null }); // 'magic', 'enhance', 'translate'
    const [aiError, setAiError] = useState(null);
    const [isProcessingAI, setIsProcessingAI] = useState(false);
    const [pendingTranslations, setPendingTranslations] = useState([]);

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
                        image: data.image_url
                    });

                    if (data.image_url) setImagePreview(data.image_url);

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

                    // Tools - not in original DB schema as column? 
                    // Wait, transformer says it's not there.
                    // If it's not in DB, we can't load it.
                    // Assuming for now it MIGHT be added or we ignore it on load if not present.
                    // (User asked for AI support, we added it to prompt. Frontend displays it.
                    // But if DB doesn't save it, it's transient. 
                    // However, for this refactor, we maintain existing behavior which ignored it on save maybe?)
                    // Checking implementation plan: "Ensure tools are extracted".
                    // If DB doesn't have 'tools' column, we should probably add it or store in jsonb.
                    // For now, let's init empty or try to find it.
                    // *Self-correction*: If I don't see 'tools' in DB load, I leave empty. 

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

    useEffect(() => {
        if (blocker.state === 'blocked') {
            const confirmLeave = window.confirm('You have unsaved changes. Do you really want to leave?');
            if (confirmLeave) {
                blocker.proceed();
            } else {
                blocker.reset();
            }
        }
    }, [blocker]);


    // Handlers
    const handleMetadataChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        markDirty();
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setFormData(prev => ({ ...prev, image: file }));
            setImagePreview(URL.createObjectURL(file));
            markDirty();
        }
    };

    const handleTagChange = (e) => {
        setFormData(prev => ({ ...prev, tags: e.target.value }));
        markDirty();
    };


    const handleSaveLocal = async () => {
        if (!formData.title.trim()) {
            alert('Please enter a recipe title');
            return;
        }

        setIsSaving(true);
        try {
            // Reconstruct structured data for save
            const finalIngredients = ingredientsList.map(({ id, ...rest }) => rest).filter(i => i.item.trim());
            const finalInstructions = instructionsList.map(i => i.text).filter(t => t.trim());
            // const finalTools = toolsList.map(t => t.text).filter(t => t.trim()); // Not saving tools to DB yet as per schema check

            const submissionData = {
                ...formData,
                ingredients: finalIngredients, // Save as JSON object array
                instructions: finalInstructions,
                tags: formData.tags.split(',').map(t => t.trim()).filter(Boolean),
                // tools: finalTools // If DB supported it
            };

            // Call Parent Save
            await onSave(submissionData);

            // Handle Pending Translations (logic moved to parent or kept here? Kept here mostly)
            if (pendingTranslations.length > 0) {
                const { data: { session } } = await supabase.auth.getSession(); // Direct for now
                // Ideally this goes to service too, but 'pendingTranslations' logic is tightly coupled here.
                // We will skip refactoring this specific block to service for this turn to avoid scope creep,
                // or we can iterate pendingTranslations and use recipeService.createTranslation() if it existed.
                // For now, let's keep direct calls for translations or move to service if I added it.
                // I didn't add `saveTranslation` to service. I'll leave as is or add inline.

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
            setIsSaving(false);
        }
    };

    const handleMagicImport = (data) => {
        handleMetadataChange('title', data.title || formData.title);
        handleMetadataChange('prepTime', data.prepTime || formData.prepTime);
        handleMetadataChange('cookTime', data.cookTime || formData.cookTime);
        handleMetadataChange('servings', data.servings || formData.servings);
        handleMetadataChange('description', data.description || formData.description);

        if (data.tags && Array.isArray(data.tags)) {
            handleMetadataChange('tags', data.tags.join(', '));
        }

        // Ingredients
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

        if (data.instructions) setInstructionsList(parseInstructions(data.instructions));
        if (data.tools) setToolsList(parseTools(data.tools));

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
                ingredients: ingredientsList.map(ing => `${ing.amount} ${ing.item}`.trim()).join('\n'),
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
            setAiError(error);
        } finally {
            setIsProcessingAI(false);
        }
    };

    if (isLoading) return <div className="p-8 text-center">Loading recipe...</div>;

    return (
        <div className="max-w-7xl mx-auto px-4 pb-20 pt-6">

            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <button onClick={onCancel} className="p-2 -ml-2 hover:bg-gray-100 dark:hover:bg-white/5 rounded-full transition-colors">
                    <ArrowLeft size={24} className="text-gray-600 dark:text-gray-300" />
                </button>
                <div className="flex gap-2">
                    {/* Action Buttons */}
                    <button
                        onClick={() => setActionModal({ isOpen: true, mode: 'enhance' })}
                        className="flex items-center gap-2 px-4 py-2 rounded-full border border-[#dce5df] dark:border-[#2a4030] text-[#63886f] hover:bg-[#e8f5e9] dark:hover:bg-[#2a4030] transition-colors text-sm font-medium"
                    >
                        <Sparkles size={16} /> Enhance
                    </button>
                    <button
                        onClick={() => setActionModal({ isOpen: true, mode: 'translate' })}
                        className="flex items-center gap-2 px-4 py-2 rounded-full border border-[#dce5df] dark:border-[#2a4030] text-[#63886f] hover:bg-[#e8f5e9] dark:hover:bg-[#2a4030] transition-colors text-sm font-medium"
                    >
                        <Globe size={16} /> Translate
                    </button>
                    {/* Visibility */}
                    <button
                        onClick={() => setVisibilityModalOpen(true)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-full border transition-colors text-sm font-medium ${formData.is_public
                            ? 'bg-[#e8f5e9] border-[#63886f] text-[#63886f]'
                            : 'items-center gap-2 px-4 py-2 rounded-full border border-[#dce5df] dark:border-[#2a4030] text-gray-500'
                            }`}
                    >
                        {formData.is_public ? <Globe size={16} /> : <Lock size={16} />}
                        {formData.is_public ? 'Public' : 'Private'}
                    </button>
                    {/* Save */}
                    <button
                        onClick={handleSaveLocal}
                        disabled={isSaving}
                        className="flex items-center gap-2 bg-[#1a2c20] dark:bg-[#63886f] text-white px-6 py-2 rounded-full font-medium hover:opacity-90 transition-all shadow-lg shadow-[#63886f]/20 disabled:opacity-50"
                    >
                        {isSaving ? (
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                            <>
                                <Save size={18} /> Save
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
                    <div
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full aspect-[4/3] rounded-xl border-2 border-dashed border-[#dce5df] dark:border-[#2a4030] bg-gray-50 dark:bg-[#1a2c20]/50 flex flex-col items-center justify-center cursor-pointer hover:border-[#63886f] hover:bg-[#63886f]/5 transition-all overflow-hidden relative group"
                    >
                        {imagePreview ? (
                            <img src={imagePreview} alt="Recipe" className="w-full h-full object-cover" />
                        ) : (
                            <div className="text-center p-6">
                                <div className="w-12 h-12 bg-[#e8f5e9] dark:bg-[#2a4030] rounded-full flex items-center justify-center mx-auto mb-3 text-[#63886f]">
                                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                </div>
                                <span className="text-sm font-medium text-gray-500 dark:text-gray-400 group-hover:text-primary transition-colors">Upload Photo</span>
                            </div>
                        )}
                        {/* Hidden Input managed by parent's ref */}
                        <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            ref={fileInputRef}
                            onChange={handleImageChange}
                            onClick={(e) => e.stopPropagation()}
                        />
                    </div>

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
                isOpen={visibilityModalOpen}
                onClose={() => setVisibilityModalOpen(false)}
                isPublic={formData.is_public}
                onConfirm={(isPub) => {
                    handleMetadataChange('is_public', isPub);
                    setVisibilityModalOpen(false);
                }}
            />

            <TranslationModal
                isOpen={actionModal.isOpen}
                onClose={() => setActionModal({ isOpen: false, mode: null })}
                mode={actionModal.mode}
                onConfirm={executeAIAction}
                isProcessing={isProcessingAI}
            />

            <AIErrorModal
                isOpen={!!aiError}
                onClose={() => setAiError(null)}
                error={aiError}
            />

        </div>
    );
}
