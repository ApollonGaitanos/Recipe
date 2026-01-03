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

// --- ROUTE COMPONENTS ---

// 1. HOME / FEED ROUTE
function Feed({ isPrivate = false }) {
  const { recipes, publicRecipes, toggleVisibility, deleteRecipe, searchQuery } = useRecipes();
  const { t } = useLanguage();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [deleteId, setDeleteId] = useState(null);
  const [activeCategory, setActiveCategory] = useState("All");

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

  const categories = [
    { id: "All", label: t('filters.all') },
    { id: "Breakfast", label: t('filters.breakfast') },
    { id: "Vegan", label: t('filters.vegan') },
    { id: "Quick & Easy", label: t('filters.quickEasy') },
    { id: "Pasta", label: t('filters.pasta') },
    { id: "Desserts", label: t('filters.desserts') },
    { id: "Healthy", label: t('filters.healthy') }
  ];

  const filteredRecipes = displayRecipes.filter(r => {
    // 1. Search Query
    const matchesSearch =
      normalizeText(r.title).includes(normalizedQuery) ||
      normalizeText(r.ingredients).includes(normalizedQuery) ||
      (r.tags && r.tags.some(tag => normalizeText(tag).includes(normalizedQuery)));

    // 2. Category Filter (Mock logic: Tag match or 'All')
    const matchesCategory = activeCategory === "All" || (r.tags && r.tags.some(t => t.toLowerCase() === activeCategory.toLowerCase()));

    return matchesSearch && matchesCategory;
  });

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

      {/* HERO SECTION */}
      {featuredRecipe && searchQuery === "" && activeCategory === "All" && (
        <Hero recipe={featuredRecipe} />
      )}

      {/* FILTER BAR */}
      <div className="flex flex-wrap items-center gap-3 mb-8 overflow-x-auto pb-2 scrollbar-hide">
        <button
          className="px-4 py-2 rounded-full bg-black text-white text-sm font-medium flex items-center gap-2 hover:opacity-80 transition-opacity whitespace-nowrap"
          onClick={() => setActiveCategory("All")}
        >
          <span className={activeCategory === "All" ? "" : "text-gray-400"}>{t('filters.all')}</span>
        </button>
        {categories.slice(1).map(cat => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all border ${activeCategory === cat.id
              ? 'bg-black text-white border-black'
              : 'bg-white dark:bg-surface-dark border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-gray-300'
              }`}
          >
            {cat.label}
          </button>
        ))}
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
              className="flex items-center justify-center gap-2 px-4 py-2 min-w-[140px] rounded-full bg-primary text-white text-sm font-bold shadow-sm hover:bg-green-600 transition-colors"
            >
              <Plus size={18} /> <span className="hidden sm:inline">{t('addRecipe')}</span>
            </button>
          )}
          <button className="text-primary text-sm font-bold hover:underline">
            {t('feed.viewAll')}
          </button>
        </div>
      </div>

      {/* RECIPE GRID */}
      {filteredRecipes.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
          {filteredRecipes.map(recipe => (
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
              className="px-6 py-2 rounded-full bg-primary text-white font-bold hover:bg-green-600 transition-colors"
            >
              Add Your First Recipe
            </button>
          )}
        </div>
      )}

      {/* Load More Button (Mockup Visual) */}
      {filteredRecipes.length > 0 && searchQuery === "" && activeCategory === "All" && (
        <div className="flex justify-center mt-12 mb-8">
          <button className="px-8 py-3 min-w-[220px] justify-center rounded-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-surface-dark text-gray-900 dark:text-white font-bold hover:bg-gray-50 dark:hover:bg-white/5 transition-colors shadow-sm">
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

// --- HERO COMPONENT ---
import Hero from './components/Hero';

// --- MAIN ROUTER ---

const router = createBrowserRouter(
  createRoutesFromElements(
    <>
      <Route path="/" element={<Feed isPrivate={false} />} />
      <Route path="/my-recipes" element={<MyKitchen />} />
      <Route path="/recipe/:id" element={<DetailRoute />} />
      <Route path="/add" element={<FormRoute />} />
      <Route path="/edit/:id" element={<FormRoute />} />
      <Route path="/account" element={
        <ProtectedRoute>
          <AccountSettings />
        </ProtectedRoute>
      } />
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
