import React, { useState, useEffect } from 'react';
import { createBrowserRouter, createRoutesFromElements, Route, RouterProvider, Navigate, useNavigate, useParams, Outlet } from 'react-router-dom';
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
import AccountSettings from './components/AccountSettings';
import ErrorBoundary from './components/ErrorBoundary'; // Moved up for usage
import { RECIPE_CATEGORIES } from './constants/categories';

// --- ROUTE COMPONENTS ---

// 1. HOME / FEED ROUTE
function Feed({ isPrivate = false }) {
  const { recipes, publicRecipes, toggleVisibility, deleteRecipe, searchQuery } = useRecipes();
  const { t } = useLanguage();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [deleteId, setDeleteId] = useState(null);
  const [activeCategories, setActiveCategories] = useState([]); // Empty = All
  const [visibleCount, setVisibleCount] = useState(12);
  const [isExpanded, setIsExpanded] = useState(false);

  // Redirect if accessing private while logged out
  useEffect(() => {
    if (!authLoading && !user && isPrivate) {
      navigate('/');
    }
  }, [user, authLoading, isPrivate, navigate]);

  // Data Source
  const displayRecipes = isPrivate ? recipes : publicRecipes;

  // Search & Filter Logic
  const normalizeText = (text) => text ? text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase() : "";
  const normalizedQuery = normalizeText(searchQuery);

  const categories = RECIPE_CATEGORIES.map(cat => ({
    id: cat.id,
    label: t(cat.labelKey)
  }));

  // Categories to display (Top 6 + Expanded)
  const visibleCategories = isExpanded ? categories : categories.slice(0, 6);

  const toggleCategory = (catId) => {
    setActiveCategories(prev => {
      if (prev.includes(catId)) {
        return prev.filter(c => c !== catId);
      } else {
        return [...prev, catId];
      }
    });
  };

  const filteredRecipes = displayRecipes.filter(r => {
    // 1. Search Query
    const matchesSearch =
      normalizeText(r.title).includes(normalizedQuery) ||
      normalizeText(r.ingredients).includes(normalizedQuery) ||
      (r.tags && r.tags.some(tag => normalizeText(tag).includes(normalizedQuery)));

    // 2. Category Filter (Multi-select AND Logic)
    // If no categories selected, show all.
    // If categories selected, recipe MUST have ALL selected categories (AND logic) -> Or SHOULD IT BE OR?
    // User asked to "select multiple", usually implies "Show me Breakfast OR Brunch" or "Vegetarian AND Dinner".
    // Let's go with "AND" being more restrictive and useful for drilling down (e.g. Vegetarian + Dinner).
    // If a user selects "Breakfast" and "Vegan", they want Vegan Breakfasts.

    // HOWEVER, standard chip behavior in simple apps often varies. 
    // Let's implement AND logic: Every selected category must be present in r.tags.

    const matchesCategory = activeCategories.length === 0 ||
      activeCategories.every(selectedCat =>
        r.tags && r.tags.some(tag => tag.toLowerCase() === selectedCat.toLowerCase())
      );

    return matchesSearch && matchesCategory;
  });

  // Slice for pagination
  const visibleRecipes = filteredRecipes.slice(0, visibleCount);

  // Reset pagination when filter changes
  useEffect(() => {
    setVisibleCount(12);
  }, [activeCategories, searchQuery]);

  const confirmDelete = async () => {
    if (deleteId) {
      await deleteRecipe(deleteId);
      setDeleteId(null);
    }
  };

  // Select a Featured Recipe (First one for now)
  const featuredRecipe = displayRecipes.length > 0 ? displayRecipes[0] : null;

  return (
    <Layout currentView={isPrivate ? 'myRecipes' : 'home'}>

      {/* FILTER BAR */}
      <div className="flex flex-col gap-3 mb-8">
        <div className="flex flex-wrap items-center gap-3 transition-all duration-300 ease-in-out">
          <button
            className={`px-4 py-2 rounded-full text-sm font-medium flex items-center gap-2 transition-all border ${activeCategories.length === 0
              ? 'bg-black text-white border-black'
              : 'bg-white dark:bg-surface-dark border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-gray-300'
              }`}
            onClick={() => setActiveCategories([])}
          >
            <span>{t('filters.all')}</span>
          </button>

          {visibleCategories.map(cat => (
            <button
              key={cat.id}
              onClick={() => toggleCategory(cat.id)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all border ${activeCategories.includes(cat.id)
                ? 'bg-black text-white border-black'
                : 'bg-white dark:bg-surface-dark border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-gray-300'
                }`}
            >
              {cat.label}
            </button>
          ))}

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="px-4 py-2 text-sm font-bold text-highlight hover:text-highlight/80 underline decoration-2 underline-offset-4 transition-colors ml-2"
          >
            {isExpanded ? t('feed.showLess') : t('feed.showMore')}
          </button>
        </div>
      </div>

      {/* GRID HEADER */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-serif font-bold text-gray-900 dark:text-white">
          {isPrivate ? t('visibility.myRecipes') : t('feed.freshTitle')}
        </h2>

        {/* Actions */}
        <div className="flex items-center gap-3">
          {user && (
            <button
              onClick={() => navigate('/add')}
              className="flex items-center justify-center gap-2 px-4 py-2 min-w-[140px] rounded-full bg-primary text-white text-sm font-bold shadow-sm hover:opacity-90 transition-colors"
            >
              <Plus size={18} /> <span className="hidden sm:inline">{t('addRecipe')}</span>
            </button>
          )}
        </div>
      </div>

      {/* RECIPE GRID */}
      {visibleRecipes.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
          {visibleRecipes.map(recipe => (
            <RecipeCard
              key={recipe.id}
              recipe={recipe}
              onEdit={(id) => navigate(`/edit/${id}`)}
              onDelete={(id) => setDeleteId(id)}
              onToggleVisibility={toggleVisibility}
              hidePublicTag={!isPrivate}
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 bg-gray-50 dark:bg-surface-dark rounded-3xl border border-dashed border-gray-200 dark:border-gray-700">
          <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4 text-gray-400">
            <Search size={32} />
          </div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">No recipes found</h3>
          <p className="text-gray-500 text-center max-w-sm mb-6">
            Try adjusting your search or filters, or add a new recipe to get started.
          </p>
          {user && (
            <button
              onClick={() => navigate('/add')}
              className="px-6 py-2 rounded-full bg-primary text-white font-bold hover:opacity-90 transition-colors"
            >
              Add Your First Recipe
            </button>
          )}
        </div>
      )}

      {/* Load More Button */}
      {visibleRecipes.length < filteredRecipes.length && (
        <div className="flex justify-center mt-12 mb-8">
          <button
            onClick={() => setVisibleCount(prev => prev + 12)}
            className="px-8 py-3 min-w-[220px] justify-center rounded-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-surface-dark text-gray-900 dark:text-white font-bold hover:bg-gray-50 dark:hover:bg-white/5 transition-colors shadow-sm"
          >
            {t('feed.loadMore')}
          </button>
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

// 4. PROTECTED ROUTE WRAPPER
function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) return null; // Or a loading spinner if preferred

  if (!user) {
    return <Navigate to="/" replace />;
  }

  return children;
}



// --- MAIN ROUTER ---

// Helper to redirect legacy /my-recipes to username
function MyRecipesRedirect() {
  const { user, profile } = useAuth();
  const username = profile?.username || user?.user_metadata?.username || user?.email?.split('@')[0];
  if (username) {
    return <Navigate to={`/${username}`} replace />;
  }
  return <MyKitchen />;
}

const router = createBrowserRouter(
  createRoutesFromElements(
    <>
      <Route path="/" element={<Feed isPrivate={false} />} />
      <Route path="/my-recipes" element={<MyRecipesRedirect />} />
      <Route path="/recipe/:id" element={<DetailRoute />} />
      <Route path="/add" element={<FormRoute />} />
      <Route path="/edit/:id" element={<FormRoute />} />
      <Route path="/account" element={
        <ProtectedRoute>
          <AccountSettings />
        </ProtectedRoute>
      } />
      <Route path="/:username" element={<MyKitchen />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </>
  ),
  {
    basename: import.meta.env.BASE_URL
  }
);

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <ThemeContext>
          <LanguageContext>
            <RecipeContext>
              <RouterProvider router={router} />
            </RecipeContext>
          </LanguageContext>
        </ThemeContext>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
