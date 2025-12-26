import React, { useState } from 'react';
import { Plus, ChefHat, Moon, Sun, Languages, User, LogOut, Settings, Globe, BookOpen } from 'lucide-react';
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

    const { t, language, toggleLanguage } = useLanguage();
    const { theme, toggleTheme } = useTheme();
    const { user, signOut } = useAuth();

    return (
        <div className="container">
            <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
            <SettingsModal isOpen={showSettingsModal} onClose={() => setShowSettingsModal(false)} />

            {/* Top Bar: Settings & toggles */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', paddingTop: '12px' }}>
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

            {/* Main Header with Navigation */}
            <header className="main-header" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                    <div
                        onClick={() => onNavigate('home')}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            cursor: 'pointer',
                            userSelect: 'none'
                        }}
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
                        <h1 className="title" style={{ marginBottom: 0 }}>{t('appTitle')}</h1>
                    </div>

                    {/* Navigation Tabs */}
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <button
                            className={`btn-secondary ${currentView === 'home' ? 'active-nav' : ''}`}
                            onClick={() => onNavigate('home')}
                            style={{
                                borderColor: currentView === 'home' ? 'var(--color-primary)' : 'transparent',
                                color: currentView === 'home' ? 'var(--color-primary)' : 'inherit',
                                background: currentView === 'home' ? 'var(--bg-secondary)' : 'transparent'
                            }}
                        >
                            <Globe size={18} /> {t('visibility.publicFeed')}
                        </button>

                        {user && (
                            <button
                                className={`btn-secondary ${currentView === 'myRecipes' ? 'active-nav' : ''}`}
                                onClick={() => onNavigate('myRecipes')}
                                style={{
                                    borderColor: currentView === 'myRecipes' ? 'var(--color-primary)' : 'transparent',
                                    color: currentView === 'myRecipes' ? 'var(--color-primary)' : 'inherit',
                                    background: currentView === 'myRecipes' ? 'var(--bg-secondary)' : 'transparent'
                                }}
                            >
                                <BookOpen size={18} /> {t('visibility.myRecipes')}
                            </button>
                        )}
                    </div>
                </div>
            </header>

            <main>
                <MigrationBanner />
                {children}
            </main>
        </div>
    );
}
