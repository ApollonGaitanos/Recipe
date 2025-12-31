import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContextData = createContext();

export function useTheme() {
    return useContext(ThemeContextData);
}

export default function ThemeContext({ children }) {
    const [theme, setTheme] = useState(() => {
        return localStorage.getItem('theme') || 'light';
    });

    useEffect(() => {
        localStorage.setItem('theme', theme);
        if (theme === 'dark') {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }, [theme]);

    const toggleTheme = () => {
        setTheme(prev => prev === 'light' ? 'dark' : 'light');
    };

    return (
        <ThemeContextData.Provider value={{ theme, toggleTheme }}>
            {children}
        </ThemeContextData.Provider>
    );
}
