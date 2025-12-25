import React from 'react';
import RecipeContext from './context/RecipeContext';
import LanguageContext from './context/LanguageContext';
import ThemeContext from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import Layout from './components/Layout';

function App() {
  return (
    <AuthProvider>
      <ThemeContext>
        <LanguageContext>
          <RecipeContext>
            <Layout />
          </RecipeContext>
        </LanguageContext>
      </ThemeContext>
    </AuthProvider>
  );
}

export default App;
