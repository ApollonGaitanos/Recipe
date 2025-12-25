import React, { useState } from 'react';
import { Plus, ChefHat, Moon, Sun, Languages, User, LogOut } from 'lucide-react';
import RecipeList from './RecipeList';
import RecipeForm from './RecipeForm';
import RecipeDetail from './RecipeDetail';
import AuthModal from './AuthModal';
import MigrationBanner from './MigrationBanner';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';

export default function Layout() {
    const [view, setView] = useState('list'); // list, add, detail, edit
    const [selectedRecipeId, setSelectedRecipeId] = useState(null);
    const [showAuthModal, setShowAuthModal] = useState(false);

    const { t, language, toggleLanguage } = useLanguage();
    const { theme, toggleTheme } = useTheme();
    const { user, signOut } = useAuth();

    const goToList = () => {
        setView('list');
        setSelectedRecipeId(null);
    };

    const goToAdd = () => setView('add');

    const goToDetail = (id) => {
        setSelectedRecipeId(id);
        setView('detail');
    };

    const goToEdit = (id) => {
        setSelectedRecipeId(id);
        setView('edit');
    };

    return (
        <div className="container">
            <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />

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

            <header className="main-header">
                <div
                    onClick={goToList}
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

                {view === 'list' && (
                    <button className="btn-primary" onClick={goToAdd}>
                        <Plus size={20} />
                        {t('addRecipe')}
                    </button>
                )}
            </header>

            <main>
                <MigrationBanner />
                {view === 'list' && <RecipeList onSelect={goToDetail} />}
                {view === 'add' && <RecipeForm onSave={goToList} onCancel={goToList} />}
                {view === 'edit' && <RecipeForm recipeId={selectedRecipeId} onSave={() => goToDetail(selectedRecipeId)} onCancel={() => goToDetail(selectedRecipeId)} />}
                {view === 'detail' && (
                    <RecipeDetail
                        id={selectedRecipeId}
                        onBack={goToList}
                        onEdit={() => goToEdit(selectedRecipeId)}
                    />
                )}
            </main>
        </div>
    );
}
