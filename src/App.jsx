import React, { useState, useEffect } from 'react';
import { Search, Plus } from 'lucide-react';
import RecipeContext, { useRecipes } from './context/RecipeContext';
import LanguageContext, { useLanguage } from './context/LanguageContext';
import ThemeContext from './context/ThemeContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import RecipeCard from './components/RecipeCard';
import RecipeForm from './components/RecipeForm';
import RecipeDetail from './components/RecipeDetail';
import ConfirmationModal from './components/ConfirmModal';

function AppContent() {
  const { recipes, publicRecipes, addRecipe, updateRecipe, deleteRecipe, toggleVisibility, loading } = useRecipes();
  const { t } = useLanguage();
  const { user, loading: authLoading } = useAuth();

  // View State: 'home' (Public Feed) or 'myRecipes' (Private)
  const [currentView, setCurrentView] = useState('home');

  const [searchQuery, setSearchQuery] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingRecipeId, setEditingRecipeId] = useState(null);
  const [selectedRecipe, setSelectedRecipe] = useState(null);
  const [deleteId, setDeleteId] = useState(null);

  // Helper for accent-insensitive search (Greek support)
  const normalizeText = (text) => {
    return text ? text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase() : "";
  };

  // Filter Logic
  const displayRecipes = currentView === 'home' ? publicRecipes : recipes;

  // Normalize query once
  const normalizedQuery = normalizeText(searchQuery);

  const filteredRecipes = displayRecipes.filter(r =>
    normalizeText(r.title).includes(normalizedQuery) ||
    normalizeText(r.ingredients).includes(normalizedQuery) ||
    (r.tags && r.tags.some(tag => normalizeText(tag).includes(normalizedQuery)))
  );

  const handleEdit = (id) => {
    setEditingRecipeId(id);
    setIsFormOpen(true);
  };

  const handleDeleteClick = (id) => {
    setDeleteId(id);
  };

  const confirmDelete = async () => {
    if (deleteId) {
      await deleteRecipe(deleteId);
      setDeleteId(null);
      if (selectedRecipe && selectedRecipe.id === deleteId) {
        setSelectedRecipe(null);
      }
    }
  };

  // Navigate to 'home' if logged out while on 'myRecipes'
  useEffect(() => {
    if (!authLoading && !user && currentView === 'myRecipes') {
      setCurrentView('home');
    }
  }, [user, authLoading, currentView]);


  // Clear selection when switching views
  const handleNavigate = (view) => {
    setCurrentView(view);
    setSelectedRecipe(null);
    setIsFormOpen(false);
    setEditingRecipeId(null);
    setSearchQuery('');
  };

  const handleFormSubmit = async (data) => {
    if (editingRecipeId) {
      await updateRecipe(editingRecipeId, data);
    } else {
      await addRecipe(data);
    }
    setIsFormOpen(false);
    setEditingRecipeId(null);
    if (!editingRecipeId && user) {
      setCurrentView('myRecipes'); // Go to my recipes to see new one
      setSelectedRecipe(null); // Ensure we go to list
    }
  };

  if (authLoading || loading) return <div style={{ display: 'flex', justifyContent: 'center', marginTop: '50px' }}>{t('auth.processing')}</div>;

  // Detail View Mode - Hides everything else to feel like a separate page
  if (selectedRecipe) {
    return (
      <Layout currentView={currentView} onNavigate={handleNavigate}>
        <RecipeDetail
          id={selectedRecipe.id}
          onBack={() => setSelectedRecipe(null)}
          onEdit={() => { handleEdit(selectedRecipe.id); }}
        />

        {/* Form Overlay for Edit within Detail View */}
        {isFormOpen && (
          <RecipeForm
            isOpen={true}
            recipeId={editingRecipeId}
            onSave={handleFormSubmit}
            onCancel={() => { setIsFormOpen(false); setEditingRecipeId(null); }}
          />
        )}
      </Layout>
    );
  }

  return (
    <Layout currentView={currentView} onNavigate={handleNavigate}>

      {/* Action Bar */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, position: 'relative', minWidth: '200px' }}>
          <Search size={20} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#888' }} />
          <input
            type="text"
            placeholder={t('searchPlaceholder')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ width: '100%', paddingLeft: '40px' }}
          />
        </div>

        {/* Add button available if logged in */}
        {user && (
          <button className="btn-primary" onClick={() => { setEditingRecipeId(null); setIsFormOpen(true); }}>
            <Plus size={20} /> {t('addRecipe')}
          </button>
        )}
      </div>

      {/* List Heading */}
      <h2 style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: '15px', color: 'var(--color-text-primary)' }}>
        {currentView === 'home' ? t('visibility.publicFeed') : t('visibility.myRecipes')}
      </h2>

      {/* Grid */}
      {filteredRecipes.length > 0 ? (
        <div className="recipe-grid">
          {filteredRecipes.map(recipe => (
            <RecipeCard
              key={recipe.id}
              recipe={recipe}
              onClick={(id) => setSelectedRecipe(recipe)}
              onEdit={handleEdit}
              onDelete={handleDeleteClick}
              onToggleVisibility={toggleVisibility}
            />
          ))}
        </div>
      ) : (
        <div style={{ textAlign: 'center', padding: '40px', color: '#888' }}>
          <p>{t('noRecipes')}</p>
        </div>
      )}


      <ConfirmationModal
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={confirmDelete}
        title={t('delete')}
        message={t('deleteConfirm')}
      />

    </Layout>
  );
}

// Wrapper to provide contexts
function App() {
  return (
    <AuthProvider>
      <ThemeContext>
        <LanguageContext>
          <RecipeContext>
            <AppContent />
          </RecipeContext>
        </LanguageContext>
      </ThemeContext>
    </AuthProvider>
  );
}

export default App;
