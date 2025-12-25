import React from 'react';
import RecipeContext from './context/RecipeContext';
import LanguageContext from './context/LanguageContext';
import ThemeContext from './context/ThemeContext';
import Layout from './components/Layout';

function App() {
  return (
    <ThemeContext>
      <LanguageContext>
        <RecipeContext>
          <Layout />
        </RecipeContext>
      </LanguageContext>
    </ThemeContext>
  );
}

export default App;
