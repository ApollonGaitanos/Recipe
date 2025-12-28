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
import MyKitchen from './components/MyKitchen';

function AppContent() {
  const { recipes, publicRecipes, addRecipe, updateRecipe, deleteRecipe, toggleVisibility, loading } = useRecipes();
  const { t } = useLanguage();
  const { user, loading: authLoading } = useAuth();

  // --- STATE MANAGEMENT ---

  // 1. Navigation State (Strict Separation: LIST | DETAIL | FORM)
  const [view, setView] = useState({ mode: 'LIST', data: null }); // data: { id }

  // 2. List Filter State
  const [listType, setListType] = useState('public'); // 'public' | 'private'
  const [searchQuery, setSearchQuery] = useState('');

  // 3. Action State
  const [deleteId, setDeleteId] = useState(null);

  // --- VIEW HELPERS ---

  const goToList = (type) => {
    const nextView = { mode: 'LIST', data: null };
    const nextListType = type || listType;

    setView(nextView);
    if (type) setListType(type);
    setSearchQuery('');

    window.history.pushState({ view: nextView, listType: nextListType }, "");
  };

  const goToDetail = (recipe) => {
    const nextView = { mode: 'DETAIL', data: { id: recipe.id } };
    setView(nextView);
    window.history.pushState({ view: nextView, listType }, "");
  };

  const goToForm = (id = null) => {
    const nextView = { mode: 'FORM', data: { id } };
    setView(nextView);
    window.history.pushState({ view: nextView, listType }, "");
  };

  // Calculate display recipes based on listType
  const displayRecipes = listType === 'public' ? publicRecipes : recipes;

  // --- EFFECTS ---

  // Auth Redirect: If logged out while on private list, go to public
  useEffect(() => {
    if (!authLoading && !user && listType === 'private') {
      setListType('public');
    }
  }, [user, authLoading, listType]);

  // --- HISTORY HANDLING ---
  // Handle Browser Back Button
  useEffect(() => {
    // Initial State replacement to ensure we have a base
    window.history.replaceState({ view: { mode: 'LIST', data: null }, listType: 'public' }, "");

    const handlePopState = (event) => {
      if (event.state && event.state.view) {
        setView(event.state.view);
        if (event.state.listType) setListType(event.state.listType);
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // --- SEARCH LOGIC ---

  const normalizeText = (text) => text ? text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase() : "";
  const normalizedQuery = normalizeText(searchQuery);

  const filteredRecipes = displayRecipes.filter(r =>
    normalizeText(r.title).includes(normalizedQuery) ||
    normalizeText(r.ingredients).includes(normalizedQuery) ||
    (r.tags && r.tags.some(tag => normalizeText(tag).includes(normalizedQuery)))
  );

  // --- HANDLERS ---

  const handleFormSubmit = async (data) => {
    const editingId = view.data?.id;
    if (editingId) {
      await updateRecipe(editingId, data);
      // Return to Detail view of the edited recipe
      // BUT user might have wanted to go back to list.. let's default to detail to check changes
      goToDetail({ id: editingId });
    } else {
      await addRecipe(data);
      // Go to private list to see new recipe
      goToList('private');
    }
  };

  const confirmDelete = async () => {
    if (deleteId) {
      await deleteRecipe(deleteId);
      setDeleteId(null);
      // If we deleted the current detail recipe, go back to list
      if (view.mode === 'DETAIL' && view.data?.id === deleteId) {
        goToList();
      }
    }
  };

  if (authLoading || loading) return <div style={{ display: 'flex', justifyContent: 'center', marginTop: '50px' }}>{t('auth.processing')}</div>;

  // --- RENDER ---

  // Common Layout Props
  const layoutProps = {
    currentView: listType === 'public' ? 'home' : 'myRecipes',
    onNavigate: (key) => key === 'home' ? goToList('public') : goToList('private')
  };

  return (
    <Layout {...layoutProps}>

      {/* VIEW 1: LIST */}
      {view.mode === 'LIST' && (
        listType === 'public' ? (
          <>
            {/* Action Bar */}
            <div className="action-bar">
              {/* Search */}
              <div className="search-wrapper">
                <Search className="search-icon" size={20} />
                <input
                  type="text"
                  className="search-input"
                  placeholder={t('searchPlaceholder')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            {/* Heading */}
            <h2 style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: '15px', color: 'var(--color-text-primary)' }}>
              {t('visibility.publicFeed')}
            </h2>

            {/* Grid */}
            {filteredRecipes.length > 0 ? (
              <div className="recipe-grid">
                {filteredRecipes.map(recipe => (
                  <RecipeCard
                    key={recipe.id}
                    recipe={recipe}
                    onClick={() => goToDetail(recipe)}
                    onEdit={goToForm}
                    onDelete={(id) => setDeleteId(id)}
                    onToggleVisibility={toggleVisibility}
                  />
                ))}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '40px', color: '#888' }}>
                <p>{t('noRecipes')}</p>
              </div>
            )}
          </>
        ) : (
          user && <MyKitchen onRecipeClick={goToDetail} onNewRecipe={() => goToForm(null)} />
        )
      )}

      {/* VIEW 2: DETAIL */}
      {view.mode === 'DETAIL' && view.data && (
        <RecipeDetail
          id={view.data.id}
          onBack={() => goToList()} // Back goes to list
          onEdit={() => goToForm(view.data.id)}
        />
      )}

      {/* VIEW 3: FORM */}
      {view.mode === 'FORM' && (
        <RecipeForm
          isOpen={true}
          recipeId={view.data?.id}
          onSave={handleFormSubmit}
          // Cancel goes back to Detail if editing, or List if adding
          onCancel={() => view.data?.id ? goToDetail({ id: view.data.id }) : goToList()}
        />
      )}

      {/* Global Modals */}
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

// Wrapper
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
