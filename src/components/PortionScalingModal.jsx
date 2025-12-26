import React, { useState } from 'react';
import { X, Scale, Loader } from 'lucide-react';
import { supabase } from '../supabaseClient';

export default function PortionScalingModal({ isOpen, onClose, currentServings, currentIngredients, onScaleComplete }) {
    const [targetServings, setTargetServings] = useState(currentServings);
    const [isScaling, setIsScaling] = useState(false);
    const [error, setError] = useState('');

    if (!isOpen) return null;

    const handleScale = async () => {
        if (targetServings <= 0 || targetServings === currentServings) return;

        setIsScaling(true);
        setError('');

        try {
            const { data, error } = await supabase.functions.invoke('scale-recipe', {
                body: {
                    ingredients: currentIngredients,
                    currentServings: currentServings,
                    targetServings: targetServings
                }
            });

            if (error) throw error;

            if (!data.success) {
                throw new Error(data.error || 'Failed to scale recipe');
            }

            onScaleComplete(data.data.scaledIngredients, targetServings);
            onClose();
        } catch (error) {
            console.error('Scaling error:', error);
            setError(error.message || 'Failed to scale portions. Please try again.');
        } finally {
            setIsScaling(false);
        }
    };

    const scalingFactor = currentServings > 0 ? (targetServings / currentServings).toFixed(2) : 1;

    return (
        <div className="modal-overlay active" onClick={onClose}>
            <div className="modal-content active" onClick={e => e.stopPropagation()} style={{ maxWidth: '400px' }}>
                <div className="modal-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div className="modal-icon-container" style={{ background: '#dbeafe', color: '#2563eb' }}>
                            <Scale size={20} />
                        </div>
                        <h3 className="modal-title">Adjust Portions</h3>
                    </div>
                    <button className="modal-close" onClick={onClose}>
                        <X size={20} />
                    </button>
                </div>

                <div className="modal-body">
                    <p style={{ marginBottom: '20px', color: '#666', fontSize: '0.95rem' }}>
                        AI will automatically recalculate all ingredient quantities for your desired serving size.
                    </p>

                    <div className="form-group">
                        <label>Current Servings</label>
                        <input
                            type="number"
                            value={currentServings}
                            disabled
                            style={{ background: '#f5f5f5', cursor: 'not-allowed' }}
                        />
                    </div>

                    <div className="form-group">
                        <label>Target Servings</label>
                        <input
                            type="number"
                            min="1"
                            value={targetServings}
                            onChange={(e) => setTargetServings(parseInt(e.target.value) || 1)}
                            disabled={isScaling}
                            autoFocus
                        />
                    </div>

                    {targetServings !== currentServings && (
                        <div style={{
                            padding: '12px',
                            background: '#dbeafe',
                            borderRadius: '8px',
                            marginTop: '12px',
                            fontSize: '0.9rem',
                            color: '#1e40af'
                        }}>
                            Scaling factor: <strong>{scalingFactor}x</strong>
                        </div>
                    )}

                    {error && (
                        <div style={{
                            marginTop: '15px',
                            padding: '12px',
                            background: '#fee2e2',
                            color: '#dc2626',
                            borderRadius: '8px',
                            fontSize: '0.9rem',
                            border: '1px solid #fecaca'
                        }}>
                            {error}
                        </div>
                    )}
                </div>

                <div className="modal-footer">
                    <button
                        type="button"
                        className="btn-secondary"
                        onClick={onClose}
                        disabled={isScaling}
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        className="btn-primary"
                        onClick={handleScale}
                        disabled={isScaling || targetServings === currentServings || targetServings <= 0}
                        style={{ background: '#2563eb' }}
                    >
                        {isScaling ? (
                            <>
                                <Loader size={18} className="spin" />
                                Scaling...
                            </>
                        ) : (
                            <>
                                <Scale size={18} />
                                Scale Recipe
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
