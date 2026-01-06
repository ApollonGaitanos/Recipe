
import React, { useState, useEffect, useRef } from 'react';
import { Save, X, Sparkles, Lock, Globe, ArrowLeft, Wand2 } from 'lucide-react';
import { useBlocker } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext';
// import VisibilityModal from './VisibilityModal'; // Replaced by Toggle
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
import AIChefModal from './AIChefModal';
import BlockerModal from './BlockerModal';

// ... (existing code)

{/* Modals */ }
            <AIFeaturesModal
                isOpen={aiFeaturesOpen}
                onClose={() => setAiFeaturesOpen(false)}
                onSelect={handleAIFeatureSelect}
            />

            <TranslationModal
                isOpen={actionModal.isOpen && (actionModal.mode === 'enhance' || actionModal.mode === 'translate')}
                onClose={() => setActionModal({ isOpen: false, mode: null })}
                mode={actionModal.mode}
                onConfirm={executeAIAction}
                isProcessing={isProcessingAI}
                isPermanent={true}
            />

            <MagicImportModal
                isOpen={actionModal.isOpen && actionModal.mode === 'magic'}
                onClose={() => setActionModal({ isOpen: false, mode: null })}
                onImport={(data) => {
                    handleMagicImport(data);
                    setActionModal({ isOpen: false, mode: null });
                }}
            />

            <AIChefModal
                isOpen={actionModal.isOpen && (actionModal.mode === 'chef' || actionModal.mode === 'create')}
                onClose={() => setActionModal({ isOpen: false, mode: null })}
                onImport={(data) => {
                    handleMagicImport(data);
                    setActionModal({ isOpen: false, mode: null });
                }}
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

        </div >
    );
}

