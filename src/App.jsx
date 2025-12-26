import React, { useState, useEffect } from 'react';
import { Search, Plus, Filter } from 'lucide-react';
import RecipeContext, { useRecipes } from './context/RecipeContext';
import LanguageContext, { useLanguage } from './context/LanguageContext';
import ThemeContext from './context/ThemeContext';
import AuthContext, { useAuth, AuthProvider } from './context/AuthContext';
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

  // Filter Logic
  const displayRecipes = currentView === 'home' ? publicRecipes : recipes;

  const filteredRecipes = displayRecipes.filter(r =>
    r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.ingredients.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (r.tags && r.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase())))
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

  const handleFormSubmit = async (data) => {
    if (editingRecipeId) {
      await updateRecipe(editingRecipeId, data);
    } else {
      await addRecipe(data);
    }
    setIsFormOpen(false);
    setEditingRecipeId(null);
    // If we added a recipe, maybe switch to myRecipes? 
    // For now, let's switch to myRecipes to see it if logged in.
    if (!editingRecipeId && user) setCurrentView('myRecipes');
  };

  if (authLoading || loading) return <div style={{ display: 'flex', justifyContent: 'center', marginTop: '50px' }}>{t('auth.processing')}</div>;

  return (
    <Layout currentView={currentView} onNavigate={setCurrentView}>

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

      {/* Modals */}
      {isFormOpen && (
        <RecipeForm
          isOpen={true} // It's modal based now? Or inline?
          // Original layout used inline. Let's adapt RecipeForm to be modal or full screen.
          // Actually Layout.jsx previously handled views.
          // But here I'm using modals for Form and Detail on top of the list.
          // Let's check RecipeForm component... It assumes it's rendered in main.
          // I'll wrap it in a modal-like overlay if it's not one.
          recipeId={editingRecipeId}
          onSave={() => { setIsFormOpen(false); setEditingRecipeId(null); handleFormSubmit(); }} // RecipeForm handles save internally, wait...
          // The previous Layout logic passed onSave/onCancel.
          // Let's render it as a full screen overlay for now which matches the previous "View" style.
          onCancel={() => { setIsFormOpen(false); setEditingRecipeId(null); }}
        />
      )}

      {/* Detail Modal/Overlay */}
      {selectedRecipe && (
        <RecipeDetail
          id={selectedRecipe.id}
          onBack={() => setSelectedRecipe(null)}
          onEdit={() => { setSelectedRecipe(null); handleEdit(selectedRecipe.id); }}
        />
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
