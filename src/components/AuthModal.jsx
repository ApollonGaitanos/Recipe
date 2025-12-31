import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { X, Mail, Lock, Eye, EyeOff, User, Chrome, Apple } from 'lucide-react';

export default function AuthModal({ isOpen, onClose }) {
    const [isLogin, setIsLogin] = useState(true);
    const [username, setUsername] = useState('');
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
            setUsername('');
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
    const isPasswordWeak = !isLogin && strength < 3;
    const passwordsMatch = isLogin || password === confirmPassword;
    const canSubmit = !loading && (isLogin ? true : (!isPasswordWeak && passwordsMatch && password.length > 0));

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        if (!passwordsMatch) {
            setError(t('auth.passwordMatchError'));
            setLoading(false);
            return;
        }

        if (isPasswordWeak) {
            setError(t('auth.passwordWeakError'));
            setLoading(false);
            return;
        }

        try {
            if (isLogin) {
                const { error } = await signIn(email, password);
                if (error) throw error;
                onClose();
            } else {
                const { error } = await signUp(email, password, username);
                if (error) throw error;
                alert(t('auth.emailConfirmAlert'));
                onClose();
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in" onClick={onClose}>
            <div
                className="relative flex w-full max-w-4xl bg-white dark:bg-[#111813] rounded-2xl overflow-hidden shadow-2xl animate-scale-up"
                onClick={e => e.stopPropagation()}
            >
                {/* Close Button */}
                <button
                    className="absolute top-4 right-4 z-10 p-2 rounded-full bg-white/10 hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
                    onClick={onClose}
                >
                    <X size={20} className="text-gray-500 dark:text-gray-400" />
                </button>

                {/* Left Column - Image & Branding (Hidden on mobile) */}
                <div className="hidden md:flex flex-col relative w-[40%] text-white">
                    <img
                        src="https://images.unsplash.com/photo-1543362906-ac1b96633e36?q=80&w=1000&auto=format&fit=crop"
                        alt="Cooking ingredients"
                        className="absolute inset-0 w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                    <div className="relative mt-auto p-12 z-10">
                        <p className="text-xs font-bold tracking-[0.2em] mb-3 text-[#17cf54] uppercase">
                            {t('auth.editorial')}
                        </p>
                        <h2 className="text-3xl font-serif leading-tight">
                            {t('auth.freshFlavors')}
                        </h2>
                    </div>
                </div>

                {/* Right Column - Form */}
                <div className="flex-1 flex flex-col p-8 md:p-12 overflow-y-auto max-h-[90vh]">
                    {/* Header */}
                    <div className="mb-8">
                        <h2 className="text-2xl font-bold font-serif text-gray-900 dark:text-white mb-2">
                            {t('auth.welcome')}
                        </h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            {t('auth.subtitle') || "Sign in to save recipes and create your own cookbook."}
                        </p>
                    </div>

                    {/* Tab Switcher */}
                    <div className="flex border-b border-gray-100 dark:border-white/10 mb-8">
                        <button
                            className={`pb-3 pr-6 text-sm font-medium transition-colors relative ${isLogin
                                    ? 'text-gray-900 dark:text-white'
                                    : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
                                }`}
                            onClick={() => setIsLogin(true)}
                        >
                            {t('auth.login')}
                            {isLogin && (
                                <span className="absolute bottom-0 left-0 w-full h-[2px] bg-[#17cf54]" />
                            )}
                        </button>
                        <button
                            className={`pb-3 px-6 text-sm font-medium transition-colors relative ${!isLogin
                                    ? 'text-gray-900 dark:text-white'
                                    : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
                                }`}
                            onClick={() => setIsLogin(false)}
                        >
                            {t('auth.signup')}
                            {!isLogin && (
                                <span className="absolute bottom-0 left-0 w-full h-[2px] bg-[#17cf54]" />
                            )}
                        </button>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                        {error && (
                            <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm">
                                {error}
                            </div>
                        )}

                        {!isLogin && (
                            <div className="relative">
                                <User className="absolute top-1/2 -translate-y-1/2 left-3.5 text-gray-400" size={18} />
                                <input
                                    type="text"
                                    placeholder={t('auth.usernamePlaceholder')}
                                    value={username}
                                    onChange={e => setUsername(e.target.value)}
                                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-transparent focus:bg-white focus:border-[#17cf54] focus:ring-0 dark:focus:bg-white/10 outline-none transition-all text-gray-900 dark:text-white placeholder-gray-400"
                                    required
                                />
                            </div>
                        )}

                        <div className="relative">
                            <Mail className="absolute top-1/2 -translate-y-1/2 left-3.5 text-gray-400" size={18} />
                            <input
                                type="email"
                                placeholder={t('auth.emailPlaceholder')}
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-transparent focus:bg-white focus:border-[#17cf54] focus:ring-0 dark:focus:bg-white/10 outline-none transition-all text-gray-900 dark:text-white placeholder-gray-400"
                                required
                            />
                        </div>

                        <div className="relative">
                            <Lock className="absolute top-1/2 -translate-y-1/2 left-3.5 text-gray-400" size={18} />
                            <input
                                type={showPassword ? "text" : "password"}
                                placeholder={t('auth.passwordPlaceholder')}
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                className="w-full pl-10 pr-12 py-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-transparent focus:bg-white focus:border-[#17cf54] focus:ring-0 dark:focus:bg-white/10 outline-none transition-all text-gray-900 dark:text-white placeholder-gray-400"
                                required
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute top-1/2 -translate-y-1/2 right-3.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                            >
                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>

                        {/* Password Strength Indicator */}
                        {!isLogin && password.length > 0 && (
                            <div className="flex gap-1 h-1 mt-[-10px]">
                                {[1, 2, 3, 4, 5].map(step => (
                                    <div
                                        key={step}
                                        className={`flex-1 rounded-full transition-colors duration-300 ${strength >= step
                                                ? (strength < 3 ? 'bg-red-500' : strength < 4 ? 'bg-orange-500' : 'bg-[#17cf54]')
                                                : 'bg-gray-200 dark:bg-white/10'
                                            }`}
                                    />
                                ))}
                            </div>
                        )}

                        {!isLogin && (
                            <div className="relative">
                                <Lock className="absolute top-1/2 -translate-y-1/2 left-3.5 text-gray-400" size={18} />
                                <input
                                    type={showPassword ? "text" : "password"}
                                    placeholder={t('auth.confirmPasswordPlaceholder')}
                                    value={confirmPassword}
                                    onChange={e => setConfirmPassword(e.target.value)}
                                    className={`w-full pl-10 pr-12 py-3 rounded-xl bg-gray-50 dark:bg-white/5 border focus:bg-white focus:ring-0 dark:focus:bg-white/10 outline-none transition-all text-gray-900 dark:text-white placeholder-gray-400 ${confirmPassword && !passwordsMatch ? 'border-red-500 focus:border-red-500' : 'border-transparent focus:border-[#17cf54]'
                                        }`}
                                    required
                                />
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={!canSubmit}
                            className="w-full py-3.5 rounded-xl bg-[#17cf54] hover:bg-[#14b84b] text-white font-bold transition-all transform active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed mt-2 shadow-lg shadow-green-500/20"
                        >
                            {loading ? t('auth.processing') : (isLogin ? t('auth.login') : t('auth.signup'))}
                        </button>
                    </form>

                    {/* Social Login Divider */}
                    <div className="relative my-8 text-center">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-gray-100 dark:border-white/10"></div>
                        </div>
                        <span className="relative px-3 bg-white dark:bg-[#111813] text-xs font-semibold text-gray-400 uppercase tracking-wider">
                            {t('auth.orContinue') || "Or continue with"}
                        </span>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <button className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors text-sm font-medium text-gray-700 dark:text-gray-300">
                            {/* Simplified Google Icon for this context */}
                            <svg className="w-5 h-5" viewBox="0 0 24 24">
                                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                            </svg>
                            Google
                        </button>
                        <button className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors text-sm font-medium text-gray-700 dark:text-gray-300">
                            <Apple size={20} className="text-black dark:text-white" />
                            Apple
                        </button>
                    </div>

                    {/* Footer Links */}
                    <div className="mt-8 text-center text-xs text-gray-400">
                        By continuing, you agree to our <a href="#" className="underline hover:text-[#17cf54]">Terms of Service</a> and <a href="#" className="underline hover:text-[#17cf54]">Privacy Policy</a>.
                    </div>
                </div>
            </div>
        </div>
    );
}
