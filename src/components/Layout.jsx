import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useRecipes } from '../context/RecipeContext';
import { Search, Globe, Moon, Sun, User as UserIcon, LogOut, Settings, Menu, X, ChefHat } from 'lucide-react';
import AuthModal from './AuthModal';
import LogoutModal from './LogoutModal';
import SearchSuggestions from './SearchSuggestions';

export default function Layout({ children, fullWidth = false }) {
    const navigate = useNavigate();
    const location = useLocation();
    const { t, toggleLanguage } = useLanguage();
    const { theme, toggleTheme } = useTheme();
    const { user, profile, signOut } = useAuth();
    const { searchQuery, setSearchQuery } = useRecipes();

    const [showAuthModal, setShowAuthModal] = useState(false);
    const [showLogoutModal, setShowLogoutModal] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isSearchFocused, setIsSearchFocused] = useState(false);

    const isDiscoverPage = location.pathname === '/';

    const myKitchenPath = profile?.username || user?.user_metadata?.username || user?.email?.split('@')[0]
        ? `/${profile?.username || user?.user_metadata?.username || user?.email?.split('@')[0]}`
        : '/my-recipes';

    return (
        <div className="min-h-screen bg-background-light dark:bg-background-dark text-gray-900 dark:text-gray-100 font-display transition-colors duration-200">
            <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
            <LogoutModal isOpen={showLogoutModal} onClose={() => setShowLogoutModal(false)} />

            {/* HEADER - Honey Background in Light Mode */}
            <header className="sticky top-0 z-40 w-full bg-primary dark:bg-surface-dark border-b border-primary/10 dark:border-white/5 py-3 px-4 md:px-8 shadow-sm">
                <div className="max-w-[1440px] mx-auto flex items-center justify-between gap-4">

                    {/* LEFT: Logo & Nav */}
                    <div className="flex items-center gap-8">
                        {/* Logo */}
                        <div
                            onClick={() => navigate('/')}
                            className="flex items-center gap-2 cursor-pointer group"
                        >
                            <div className="w-10 h-10 flex items-center justify-center relative">
                                <img
                                    src="/logo.png"
                                    alt="Opsopoiia Logo"
                                    className="w-full h-full object-contain"
                                />
                            </div>
                            <h1 className="text-2xl font-serif font-bold tracking-tight text-gray-900 dark:text-white group-hover:text-highlight transition-colors">
                                {t('appTitle')}
                            </h1>
                        </div>

                        {/* Desktop Nav */}
                        <nav className="hidden md:flex items-center gap-6">
                            <button
                                onClick={() => navigate('/discover')}
                                className={`text-sm font-bold transition-colors ${location.pathname === '/discover' ? 'text-accent' : 'text-gray-900 dark:text-gray-300 hover:text-accent'}`}
                            >
                                {t('nav.discover')}
                            </button>
                            <button
                                onClick={() => navigate(myKitchenPath)}
                                className={`text-sm font-bold transition-colors ${location.pathname === myKitchenPath ? 'text-accent' : 'text-gray-900 dark:text-gray-300 hover:text-accent'}`}
                            >
                                {t('nav.myKitchen')}
                            </button>
                        </nav>

                    </div>

                    {/* CENTER: Search Bar (Desktop) */}
                    <div className="hidden md:flex flex-1 max-w-2xl mx-6">
                        <div className="relative w-full group">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400 group-focus-within:text-highlight transition-colors">
                                <Search size={18} />
                            </div>
                            <input
                                type="text"
                                className="block w-full rounded-full border-none bg-gray-100 dark:bg-black/20 py-2.5 pl-10 pr-4 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 focus:ring-2 focus:ring-primary/50 transition-all hover:bg-gray-200/50 dark:hover:bg-black/30"
                                placeholder={t('searchPlaceholder')}
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                onFocus={() => setIsSearchFocused(true)}
                            />

                            {/* Autocomplete Dropdown - Only if NOT on Discover Page */}
                            {!isDiscoverPage && (
                                <SearchSuggestions
                                    query={searchQuery}
                                    isVisible={isSearchFocused}
                                    onClose={() => setIsSearchFocused(false)}
                                    onClear={() => setSearchQuery('')}
                                />
                            )}
                        </div>
                    </div>

                    {/* RIGHT: Actions */}
                    <div className="flex items-center gap-2">
                        {/* Desktop Only: Theme & Language */}
                        <div className="hidden md:flex items-center gap-2">
                            <button onClick={toggleLanguage} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-white/10 text-gray-600 dark:text-gray-300 transition-colors" title="Switch Language">
                                <Globe size={20} />
                            </button>
                            <button onClick={toggleTheme} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-white/10 text-gray-600 dark:text-gray-300 transition-colors" title="Toggle Theme">
                                {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
                            </button>
                            <div className="h-6 w-px bg-gray-200 dark:bg-white/10 mx-1"></div>
                        </div>

                        {/* Mobile: Prominent Navigation Icons */}
                        <div className="flex md:hidden items-center gap-1 mr-1">
                            <button
                                onClick={() => navigate('/discover')}
                                className={`p-2 rounded-full transition-colors ${location.pathname === '/discover' ? 'bg-primary/10 text-primary' : 'text-gray-600 dark:text-gray-300'}`}
                            >
                                <Globe size={20} />
                            </button>
                            {user && (
                                <button
                                    onClick={() => navigate(myKitchenPath)}
                                    className={`p-2 rounded-full transition-colors ${location.pathname === myKitchenPath ? 'bg-primary/10 text-primary' : 'text-gray-600 dark:text-gray-300'}`}
                                >
                                    <ChefHat size={20} />
                                </button>
                            )}
                        </div>

                        {/* User Profile / Login (Desktop) */}
                        <div className="hidden md:flex items-center">
                            {user ? (
                                <div className="flex items-center gap-1">
                                    <button
                                        onClick={() => user ? navigate('/account') : setShowAuthModal(true)}
                                        className="flex items-center gap-1.5 pl-2 pr-1 py-1 rounded-full hover:bg-gray-100 dark:hover:bg-white/5 transition-all group"
                                    >
                                        <span className="hidden sm:block text-sm font-medium text-gray-700 dark:text-gray-300 group-hover:text-highlight transition-colors">
                                            {(profile?.username || user?.user_metadata?.username || user?.email?.split('@')[0])}
                                        </span>
                                        <div className="w-9 h-9 rounded-full bg-surface-hover flex items-center justify-center text-highlight group-hover:bg-primary group-hover:text-white transition-all shadow-sm">
                                            <UserIcon className="w-5 h-5" />
                                        </div>
                                    </button>
                                </div>
                            ) : (
                                <button
                                    onClick={() => setShowAuthModal(true)}
                                    className="ml-2 px-4 py-2 min-w-[110px] flex justify-center rounded-full bg-primary text-white text-sm font-bold hover:opacity-90 transition-colors shadow-sm"
                                >
                                    {t('nav.login')}
                                </button>
                            )}
                        </div>

                        {/* Mobile Menu Toggle */}
                        <button
                            className="md:hidden p-2 -mr-2 rounded-full hover:bg-gray-100 dark:hover:bg-white/10 text-gray-600 dark:text-gray-300"
                            onClick={() => setIsMobileMenuOpen(true)}
                        >
                            <Menu size={24} />
                        </button>
                    </div>
                </div>
            </header>

            {/* Mobile Search (Below Header) */}
            <div className="md:hidden px-4 py-3 bg-white dark:bg-surface-dark border-b border-gray-100 dark:border-white/5 sticky top-[65px] z-30">
                <div className="relative w-full">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                        <Search size={18} />
                    </div>
                    <input
                        type="text"
                        className="block w-full rounded-full border-none bg-gray-100 dark:bg-black/20 py-2.5 pl-10 pr-4 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 focus:ring-2 focus:ring-primary/50"
                        placeholder={t('searchPlaceholder')}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onFocus={() => setIsSearchFocused(true)}
                    />
                    {/* Mobile Autocomplete Dropdown */}
                    {!isDiscoverPage && (
                        <SearchSuggestions
                            query={searchQuery}
                            isVisible={isSearchFocused}
                            onClose={() => setIsSearchFocused(false)}
                            onClear={() => setSearchQuery('')}
                        />
                    )}
                </div>
            </div>

            {/* Mobile Menu Overlay */}
            {isMobileMenuOpen && (
                <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm md:hidden" onClick={() => setIsMobileMenuOpen(false)}>
                    <div
                        className="absolute right-0 top-0 bottom-0 w-[80%] max-w-sm bg-white dark:bg-surface-dark shadow-2xl p-6 flex flex-col gap-6 animate-in slide-in-from-right duration-200"
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-serif font-bold text-gray-900 dark:text-white">{t('nav.menu')}</h2>
                            <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 -mr-2 rounded-full hover:bg-gray-100 dark:hover:bg-white/10">
                                <X size={24} />
                            </button>
                        </div>

                        <nav className="flex flex-col gap-2">
                            {/* Settings / System Toggles */}
                            <div className="flex items-center gap-4 bg-gray-50 dark:bg-white/5 p-4 rounded-xl mb-2">
                                <button onClick={toggleLanguage} className="flex-1 flex items-center justify-center gap-2 p-2 rounded-lg bg-white dark:bg-black/20 border border-gray-100 dark:border-white/5 text-sm font-medium">
                                    <Globe size={16} /> Language
                                </button>
                                <button onClick={toggleTheme} className="flex-1 flex items-center justify-center gap-2 p-2 rounded-lg bg-white dark:bg-black/20 border border-gray-100 dark:border-white/5 text-sm font-medium">
                                    {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />} Theme
                                </button>
                            </div>

                            {user ? (
                                <>
                                    <div className="flex items-center gap-3 p-3 rounded-xl bg-primary/5 border border-primary/10 mb-2">
                                        <div className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center">
                                            <UserIcon size={20} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-bold truncate">{(profile?.username || user?.user_metadata?.username || user?.email?.split('@')[0])}</p>
                                            <p className="text-xs text-gray-500 truncate">{user.email}</p>
                                        </div>
                                    </div>

                                    <button onClick={() => { navigate('/account'); setIsMobileMenuOpen(false); }} className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-white/5 text-left font-medium">
                                        <Settings size={20} className="text-gray-400" /> {t('nav.settings')}
                                    </button>
                                    <button onClick={() => { setShowLogoutModal(true); setIsMobileMenuOpen(false); }} className="flex items-center gap-3 p-3 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/10 text-left font-medium text-red-600">
                                        <LogOut size={20} /> {t('nav.signOut')}
                                    </button>
                                </>
                            ) : (
                                <button onClick={() => { setShowAuthModal(true); setIsMobileMenuOpen(false); }} className="w-full py-3 rounded-xl bg-primary text-white font-bold shadow-sm">
                                    {t('nav.loginSignup')}
                                </button>
                            )}
                        </nav>
                    </div>
                </div>
            )}

            <main className={`w-full ${fullWidth ? '' : 'max-w-[1440px] mx-auto px-4 md:px-8 py-8'}`}>
                {children}
            </main>
            {/* FOOTER */}
            <footer className="w-full bg-white dark:bg-surface-dark border-t border-gray-100 dark:border-white/5 py-6 mt-8">
                <div className="max-w-[1440px] mx-auto px-4 md:px-8 flex flex-col items-center text-center gap-4">
                    {/* Brand */}
                    <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center text-white">
                            <ChefHat size={14} strokeWidth={2.5} />
                        </div>
                        <h2 className="text-xl font-serif font-bold text-gray-900 dark:text-white">{t('appTitle')}</h2>
                    </div>

                    {/* Tagline */}
                    <p className="text-gray-500 dark:text-gray-400 font-medium">{t('footer.tagline')}</p>

                    {/* Links */}
                    <div className="flex flex-wrap items-center justify-center gap-6 text-sm font-medium text-gray-600 dark:text-gray-300">
                        <button className="hover:text-highlight transition-colors">{t('nav.about')}</button>
                        <button className="hover:text-highlight transition-colors">{t('nav.community')}</button>
                        <button className="hover:text-highlight transition-colors">{t('nav.submitRecipe')}</button>
                        <button className="hover:text-highlight transition-colors">{t('nav.privacy')}</button>
                    </div>

                    {/* Copyright */}
                    <div className="text-xs text-gray-400 font-medium">
                        &copy; {new Date().getFullYear()} {t('footer.copyright')}
                    </div>
                </div>
            </footer>
        </div>
    );
}
