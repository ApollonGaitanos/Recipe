import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { X, User, Save } from 'lucide-react';

export default function SettingsModal({ isOpen, onClose }) {
    const { user, updateProfile } = useAuth();
    const { t } = useLanguage();

    const [username, setUsername] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState(null); // { type: 'success' | 'error', text: string }

    useEffect(() => {
        if (isOpen && user) {
            setUsername(user.user_metadata?.username || '');
            setMessage(null);
        }
    }, [isOpen, user]);

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage(null);

        try {
            const { error } = await updateProfile({ username });
            if (error) throw error;
            setMessage({ type: 'success', text: t('settings.saved') });
            setTimeout(onClose, 1000);
        } catch {
            setMessage({ type: 'error', text: t('settings.error') });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="modal-overlay active" onClick={onClose}>
            <div className="modal-content active" onClick={e => e.stopPropagation()}>
                <button className="modal-close" onClick={onClose}>
                    <X size={20} />
                </button>

                <div className="modal-icon-container" style={{ background: '#e0f2fe', color: '#0284c7' }}>
                    <User size={32} />
                </div>

                <h3 className="modal-title">{t('settings.title')}</h3>

                {message && (
                    <div style={{
                        color: message.type === 'success' ? 'green' : 'red',
                        marginBottom: '15px',
                        fontWeight: '500'
                    }}>
                        {message.text}
                    </div>
                )}

                <form onSubmit={handleSubmit} style={{ width: '100%' }}>
                    <div className="form-group">
                        <label style={{ textAlign: 'left', display: 'block', marginBottom: '8px' }}>
                            {t('settings.changeUsername')}
                        </label>
                        <div className="input-icon-wrapper" style={{ position: 'relative' }}>
                            <User size={18} style={{ position: 'absolute', top: '14px', left: '12px', color: '#888' }} />
                            <input
                                type="text"
                                value={username}
                                onChange={e => setUsername(e.target.value)}
                                style={{ paddingLeft: '40px' }}
                                required
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        className="btn-primary"
                        style={{ width: '100%', marginTop: '10px' }}
                        disabled={loading}
                    >
                        <Save size={18} />
                        {loading ? '...' : t('settings.save')}
                    </button>
                </form>
            </div>
        </div>
    );
}
