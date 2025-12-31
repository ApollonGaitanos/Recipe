import React, { useState } from 'react';
// import { useRecipes } from '../context/RecipeContext';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext';
import { UploadCloud, Check, X } from 'lucide-react';

export default function MigrationBanner() {
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [migrated, setMigrated] = useState(false);

    // Check if there are local recipes
    const localRecipesString = localStorage.getItem('recipes');
    const localRecipes = localRecipesString ? JSON.parse(localRecipesString) : [];

    if (!user || localRecipes.length === 0 || migrated) return null;

    const handleMigrate = async () => {
        setLoading(true);
        const { id: userId } = user;

        const recipesToUpload = localRecipes.map(r => ({
            user_id: userId,
            title: r.title,
            ingredients: r.ingredients,
            instructions: r.instructions,
            prep_time: r.prepTime || 0,
            cook_time: r.cookTime || 0,
            servings: r.servings || 1,
            tags: r.tags || []
        }));

        const { error } = await supabase.from('recipes').insert(recipesToUpload);

        if (!error) {
            localStorage.removeItem('recipes'); // Clear local after success
            setMigrated(true);
            window.location.reload(); // Reload to fetch new cloud data
        } else {
            alert('Migration failed: ' + error.message);
        }
        setLoading(false);
    };

    const handleDismiss = () => {
        // Just hide it for this session, or maybe clear local storage if they don't want them?
        // Ideally we ask "Clear or Keep?". For now, just hide.
        setMigrated(true);
    };

    return (
        <div style={{
            background: 'var(--color-primary)',
            color: 'white',
            padding: '12px 20px',
            marginBottom: '20px',
            borderRadius: 'var(--radius-md)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: 'var(--shadow-md)'
        }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <UploadCloud size={24} />
                <div>
                    <strong>Sync your recipes!</strong>
                    <p style={{ fontSize: '0.9rem', opacity: 0.9, marginTop: '2px' }}>
                        We found {localRecipes.length} recipes on this device. Upload them to your account?
                    </p>
                </div>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
                <button
                    onClick={handleDismiss}
                    style={{
                        background: 'rgba(255,255,255,0.2)',
                        border: 'none',
                        color: 'white',
                        padding: '8px',
                        borderRadius: '50%',
                        cursor: 'pointer'
                    }}
                >
                    <X size={18} />
                </button>
                <button
                    onClick={handleMigrate}
                    disabled={loading}
                    style={{
                        background: 'white',
                        color: 'var(--color-primary)',
                        border: 'none',
                        padding: '8px 16px',
                        borderRadius: '20px',
                        fontWeight: 'bold',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                    }}
                >
                    {loading ? 'Uploading...' : <><Check size={16} /> Sync Now</>}
                </button>
            </div>
        </div>
    );
}
