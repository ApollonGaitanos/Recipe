import React, { useState } from 'react';
import { Plus, ChefHat, Moon, Sun, Languages } from 'lucide-react';
import RecipeList from './RecipeList';
import RecipeForm from './RecipeForm';
import RecipeDetail from './RecipeDetail';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';

export default function Layout() {
    const [view, setView] = useState('list'); // list, add, detail, edit
    const [selectedRecipeId, setSelectedRecipeId] = useState(null);

    const { t, language, toggleLanguage } = useLanguage();
    const { theme, toggleTheme } = useTheme();

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
            <div style={{ display: 'flex', justifyContent: 'flex-start', gap: '12px', paddingTop: '12px' }}>
                <button className="btn-secondary" onClick={toggleLanguage} title="Switch Language">
                    <Languages size={18} /> {language.toUpperCase()}
                </button>
                <button className="btn-secondary" onClick={toggleTheme} title="Switch Theme">
                    {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
                </button>
            </div>

            <header style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '32px',
                marginTop: '12px'
            }}>
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
