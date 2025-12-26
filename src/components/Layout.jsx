import React, { useState } from 'react';
import { Plus, ChefHat, Moon, Sun, Languages, User, LogOut, Settings, Globe, BookOpen, Menu, X } from 'lucide-react';
import RecipeList from './RecipeList';
import RecipeForm from './RecipeForm';
import RecipeDetail from './RecipeDetail';
import AuthModal from './AuthModal';
import MigrationBanner from './MigrationBanner';
import SettingsModal from './SettingsModal';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';

export default function Layout({
    children, // Should be main content from App
    currentView,
    onNavigate,
    // Add button action passed from parent
    onAddClick
}) {
    const [showAuthModal, setShowAuthModal] = useState(false);
    const [showSettingsModal, setShowSettingsModal] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const { t, language, toggleLanguage } = useLanguage();
    const { theme, toggleTheme } = useTheme();
    const { user, signOut } = useAuth();

    return (
        <div className="container">
            <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
            <SettingsModal isOpen={showSettingsModal} onClose={() => setShowSettingsModal(false)} />

            {/* Mobile Menu Overlay */}
            {isMobileMenuOpen && (
                <div className="mobile-menu-overlay" onClick={() => setIsMobileMenuOpen(false)}>
                    <div className="mobile-menu-content" onClick={e => e.stopPropagation()}>
                        <div className="mobile-menu-header">
                            <h3>Menu</h3>
                            <button className="btn-icon" onClick={() => setIsMobileMenuOpen(false)}>
                                <X size={24} />
                            </button>
                        </div>

                        <div className="mobile-menu-items">
                            {user && (
                                <div className="user-info-mobile">
                                    <div className="user-avatar-placeholder">
                                        {user.user_metadata?.username?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase()}
                                    </div>
                                    <span className="user-name">{user.user_metadata?.username || user.email}</span>
                                </div>
                            )}

                            <div className="menu-divider"></div>

                            <button className="menu-item" onClick={toggleTheme}>
                                {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
                                <span>{theme === 'light' ? 'Dark Mode' : 'Light Mode'}</span>
                            </button>

                            <button className="menu-item" onClick={toggleLanguage}>
                                <Languages size={20} />
                                <span>{language.toUpperCase()}</span>
                            </button>

                            {user ? (
                                <>
                                    <button className="menu-item" onClick={() => { setShowSettingsModal(true); setIsMobileMenuOpen(false); }}>
                                        <Settings size={20} />
                                        <span>{t('settings.title') || 'Settings'}</span>
                                    </button>
                                    <button className="menu-item text-danger" onClick={() => { signOut(); setIsMobileMenuOpen(false); }}>
                                        <LogOut size={20} />
                                        <span>Sign Out</span>
                                    </button>
                                </>
                            ) : (
                                <button className="btn-primary full-width" onClick={() => { setShowAuthModal(true); setIsMobileMenuOpen(false); }}>
                                    <User size={20} /> Login / Sign Up
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Top Bar: Logo, Desktop Actions, Mobile Menu */}
            <div className="top-bar">
                {/* Logo & Title (Now in Top Bar) */}
                <div
                    onClick={() => onNavigate('home')}
                    className="app-branding"
                    style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', marginRight: 'auto' }}
                >
                    <div style={{
                        background: 'var(--color-primary)',
                        color: 'white',
                        padding: '8px',
                        borderRadius: '12px',
                        display: 'flex'
                    }}>
                        <ChefHat size={24} />
                    </div>
                    {/* Hide Title on very small screens if needed, but usually fits now */}
                    <h1 className="title" style={{ marginBottom: 0, fontSize: '1.2rem' }}>{t('appTitle')}</h1>
                </div>

                {/* Desktop Actions */}
                <div className="desktop-actions">
                    <div style={{ display: 'flex', gap: '12px' }}>
                        <button className="btn-secondary" onClick={toggleLanguage} title="Switch Language">
                            <Languages size={18} /> {language.toUpperCase()}
                        </button>
                        <button className="btn-secondary" onClick={toggleTheme} title="Switch Theme">
                            {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
                        </button>
                    </div>

                    <div>
                        {user ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <span style={{ fontSize: '0.9rem', color: 'var(--color-text-light)' }}>
                                    {user.user_metadata?.username || user.email}
                                </span>
                                <button className="btn-secondary" onClick={() => setShowSettingsModal(true)} title="Settings">
                                    <Settings size={18} />
                                </button>
                                <button className="btn-secondary" onClick={signOut} title="Sign Out">
                                    <LogOut size={18} />
                                </button>
                            </div>
                        ) : (
                            <button className="btn-primary" onClick={() => setShowAuthModal(true)} style={{ padding: '8px 16px', fontSize: '0.9rem' }}>
                                <User size={18} /> Login / Sign Up
                            </button>
                        )}
                    </div>
                </div>

                {/* Mobile Hamburger */}
                <div className="mobile-header-controls">
                    <button className="btn-icon" onClick={() => setIsMobileMenuOpen(true)}>
                        <Menu size={24} />
                    </button>
                </div>
            </div>

            {/* Segmented Navigation Control (Formerly Main Header) */}
            <header className="main-header" style={{ marginTop: '16px' }}>
                <div className="nav-segmented-control">
                    <button
                        className={`segment-item ${currentView === 'home' ? 'active' : ''}`}
                        onClick={() => onNavigate('home')}
                    >
                        <Globe size={18} />
                        <span className="nav-text-desktop">{t('visibility.publicFeed')}</span>
                        <span className="nav-text-mobile">Community</span>
                    </button>

                    {user && (
                        <button
                            className={`segment-item ${currentView === 'myRecipes' ? 'active' : ''}`}
                            onClick={() => onNavigate('myRecipes')}
                        >
                            <BookOpen size={18} />
                            <span className="nav-text-desktop">{t('visibility.myRecipes')}</span>
                            <span className="nav-text-mobile">My Recipes</span>
                        </button>
                    )}
                </div>
            </header>

            <main>
                <MigrationBanner />
                {children}
            </main>
        </div>
    );
}
