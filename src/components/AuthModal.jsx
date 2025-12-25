import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { X, Mail, Lock, Eye, EyeOff } from 'lucide-react';

export default function AuthModal({ isOpen, onClose }) {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const { signIn, signUp } = useAuth();
    const { t } = useLanguage();

    useEffect(() => {
        if (!isOpen) {
            // Reset state when closed
            setEmail('');
            setPassword('');
            setConfirmPassword('');
            setError(null);
            setIsLogin(true);
            setShowPassword(false);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    // Password Strength Logic
    const getPasswordStrength = (pass) => {
        let score = 0;
        if (pass.length > 5) score++;
        if (pass.length > 7) score++;
        if (/[A-Z]/.test(pass)) score++;
        if (/[0-9]/.test(pass)) score++;
        if (/[^A-Za-z0-9]/.test(pass)) score++;
        return score; // Max 5
    };

    const strength = getPasswordStrength(password);

    const getStrengthColor = (s) => {
        if (s < 2) return '#ff4d4d'; // Red
        if (s < 4) return '#ffa500'; // Orange
        return '#2ecc71'; // Green
    };

    const isPasswordWeak = !isLogin && strength < 3;
    const passwordsMatch = isLogin || password === confirmPassword;
    const canSubmit = !loading && (isLogin ? true : (!isPasswordWeak && passwordsMatch && password.length > 0));

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        if (!passwordsMatch) {
            setError("Passwords do not match.");
            setLoading(false);
            return;
        }

        if (isPasswordWeak) {
            setError("Password is too weak. Add numbers/symbols/length.");
            setLoading(false);
            return;
        }

        try {
            if (isLogin) {
                const { error } = await signIn(email, password);
                if (error) throw error;
                onClose();
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
                    {/* Email Input */}
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

                    {/* Password Input */}
                    <div className="form-group">
                        <div className="input-icon-wrapper" style={{ position: 'relative' }}>
                            <Lock size={18} style={{ position: 'absolute', top: '14px', left: '12px', color: '#888' }} />
                            <input
                                type={showPassword ? "text" : "password"}
                                placeholder="Password"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                required
                                style={{ paddingLeft: '40px', paddingRight: '40px' }}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                style={{
                                    position: 'absolute',
                                    top: '12px',
                                    right: '12px',
                                    background: 'none',
                                    border: 'none',
                                    cursor: 'pointer',
                                    color: '#888'
                                }}
                            >
                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>

                        {/* Strength Meter (Signup Only) */}
                        {!isLogin && password.length > 0 && (
                            <div style={{ marginTop: '5px', height: '4px', width: '100%', background: '#eee', borderRadius: '2px', overflow: 'hidden' }}>
                                <div style={{
                                    height: '100%',
                                    width: `${(strength / 5) * 100}%`,
                                    background: getStrengthColor(strength),
                                    transition: 'all 0.3s ease'
                                }} />
                            </div>
                        )}
                    </div>

                    {/* Confirm Password Input (Signup Only) */}
                    {!isLogin && (
                        <div className="form-group">
                            <div className="input-icon-wrapper" style={{ position: 'relative' }}>
                                <Lock size={18} style={{ position: 'absolute', top: '14px', left: '12px', color: '#888' }} />
                                <input
                                    type={showPassword ? "text" : "password"}
                                    placeholder="Re-enter Password"
                                    value={confirmPassword}
                                    onChange={e => setConfirmPassword(e.target.value)}
                                    required
                                    style={{
                                        paddingLeft: '40px',
                                        border: (confirmPassword && !passwordsMatch) ? '1px solid red' : undefined
                                    }}
                                />
                            </div>
                            {confirmPassword && !passwordsMatch && (
                                <div style={{ fontSize: '0.8rem', color: 'red', marginTop: '4px' }}>
                                    Passwords do not match
                                </div>
                            )}
                        </div>
                    )}

                    <button
                        type="submit"
                        className="btn-primary"
                        style={{ width: '100%', marginBottom: '10px', opacity: canSubmit ? 1 : 0.6 }}
                        disabled={!canSubmit}
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
