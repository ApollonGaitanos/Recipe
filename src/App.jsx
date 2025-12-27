import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation, useParams } from 'react-router-dom';
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

// --- ROUTE COMPONENTS ---

// 1. HOME / FEED ROUTE
function Feed({ isPrivate = false }) {
  const { recipes, publicRecipes, toggleVisibility, deleteRecipe } = useRecipes();
  const { t } = useLanguage();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteId, setDeleteId] = useState(null);

  // Redirect if accessing private while logged out
  useEffect(() => {
    if (!authLoading && !user && isPrivate) {
      navigate('/');
    }
  }, [user, authLoading, isPrivate, navigate]);

  // Data Source
  const displayRecipes = isPrivate ? recipes : publicRecipes;

  // Search Logic
  const normalizeText = (text) => text ? text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase() : "";
  const normalizedQuery = normalizeText(searchQuery);

  const filteredRecipes = displayRecipes.filter(r =>
    normalizeText(r.title).includes(normalizedQuery) ||
    normalizeText(r.ingredients).includes(normalizedQuery) ||
    (r.tags && r.tags.some(tag => normalizeText(tag).includes(normalizedQuery)))
  );

  const confirmDelete = async () => {
    if (deleteId) {
      await deleteRecipe(deleteId);
      setDeleteId(null);
    }
  };

  return (
    <Layout currentView={isPrivate ? 'myRecipes' : 'home'}>
      {/* Action Bar */}
      <div className="action-bar">
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

        {user && (
          <button className="btn-primary" onClick={() => navigate('/add')}>
            <Plus size={20} /> {t('addRecipe')}
          </button>
        )}
      </div>

      {/* Heading */}
      <h2 style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: '15px', color: 'var(--color-text-primary)' }}>
        {isPrivate ? t('visibility.myRecipes') : t('visibility.publicFeed')}
      </h2>

      {/* Grid */}
      {filteredRecipes.length > 0 ? (
        <div className="recipe-grid">
          {filteredRecipes.map(recipe => (
            <RecipeCard
              key={recipe.id}
              recipe={recipe}
              onClick={() => navigate(`/recipe/${recipe.id}`)}
              onEdit={(id) => navigate(`/edit/${id}`)}
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

// 2. DETAIL ROUTE
function DetailRoute() {
  const { id } = useParams();
  const navigate = useNavigate();

  return (
    <Layout>
      <RecipeDetail
        id={id}
        onBack={() => navigate(-1)}
        onEdit={() => navigate(`/edit/${id}`)}
      />
    </Layout>
  );
}

// 3. FORM ROUTE
function FormRoute() {
  const { id } = useParams(); // If present, we are editing
  const { addRecipe, updateRecipe } = useRecipes();
  const navigate = useNavigate();

  const handleSave = async (data) => {
    if (id) {
      await updateRecipe(id, data);
      navigate(`/recipe/${id}`);
    } else {
      await addRecipe(data);
      navigate('/my-recipes');
    }
  };

  return (
    <Layout>
      <RecipeForm
        isOpen={true}
        recipeId={id}
        onSave={handleSave}
        onCancel={() => navigate(-1)}
      />
    </Layout>
  );
}

// --- MAIN APP ---

function AppContent() {
  return (
    <Routes>
      <Route path="/" element={<Feed isPrivate={false} />} />
      <Route path="/my-recipes" element={<Feed isPrivate={true} />} />

      <Route path="/recipe/:id" element={<DetailRoute />} />

      <Route path="/add" element={<FormRoute />} />
      <Route path="/edit/:id" element={<FormRoute />} />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ThemeContext>
          <LanguageContext>
            <RecipeContext>
              <AppContent />
            </RecipeContext>
          </LanguageContext>
        </ThemeContext>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
