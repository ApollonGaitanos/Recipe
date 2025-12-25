import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { X, Mail, Lock, User } from 'lucide-react';

export default function AuthModal({ isOpen, onClose }) {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const { signIn, signUp } = useAuth();
    const { t } = useLanguage();

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            if (isLogin) {
                const { error } = await signIn(email, password);
                if (error) throw error;
                onClose(); // Close on success
            } else {
                const { error } = await signUp(email, password);
                if (error) throw error;
                alert('Check your email to confirm account!');
                onClose();
            }
        } catch (err) {
            setError(err.message);
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

                <h3 className="modal-title">
                    {isLogin ? 'Welcome Back' : 'Create Account'}
                </h3>

                {error && <div className="error-message" style={{ color: 'red', marginBottom: '10px' }}>{error}</div>}

                <form onSubmit={handleSubmit} style={{ width: '100%' }}>
                    <div className="form-group">
                        <div className="input-icon-wrapper" style={{ position: 'relative' }}>
                            <Mail size={18} style={{ position: 'absolute', top: '14px', left: '12px', color: '#888' }} />
                            <input
                                type="email"
                                placeholder="Email"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                required
                                style={{ paddingLeft: '40px' }}
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <div className="input-icon-wrapper" style={{ position: 'relative' }}>
                            <Lock size={18} style={{ position: 'absolute', top: '14px', left: '12px', color: '#888' }} />
                            <input
                                type="password"
                                placeholder="Password"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                required
                                style={{ paddingLeft: '40px' }}
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        className="btn-primary"
                        style={{ width: '100%', marginBottom: '10px' }}
                        disabled={loading}
                    >
                        {loading ? 'Processing...' : (isLogin ? 'Log In' : 'Sign Up')}
                    </button>
                </form>

                <p style={{ fontSize: '0.9rem', color: 'var(--color-text-light)' }}>
                    {isLogin ? "Don't have an account? " : "Already have an account? "}
                    <button
                        onClick={() => setIsLogin(!isLogin)}
                        style={{ color: 'var(--color-primary)', fontWeight: 'bold', textDecoration: 'underline' }}
                    >
                        {isLogin ? 'Sign Up' : 'Log In'}
                    </button>
                </p>
            </div>
        </div>
    );
}
