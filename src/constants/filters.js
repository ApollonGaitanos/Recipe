
import {
    Coffee, Sun, Moon, Utensils, Cookie, // Meal Types
    Leaf, WheatOff, Beef, // Dietary
    Gauge, // Difficulty
    Globe // Cuisine
} from 'lucide-react';

export const FILTER_CATEGORIES = [
    {
        id: 'mealType',
        label: 'Meal Type',
        icon: Utensils,
        options: [
            { id: 'breakfast', label: 'Breakfast', value: 'Breakfast', icon: Coffee },
            { id: 'lunch', label: 'Lunch', value: 'Lunch', icon: Sun },
            { id: 'dinner', label: 'Dinner', value: 'Dinner', icon: Moon },
            { id: 'snack', label: 'Snack', value: 'Snack', icon: Cookie },
            { id: 'dessert', label: 'Dessert', value: 'Dessert', icon: Cookie }
        ]
    },
    {
        id: 'dietary',
        label: 'Dietary',
        icon: Leaf,
        options: [
            { id: 'vegetarian', label: 'Vegetarian', value: 'Vegetarian', icon: Leaf },
            { id: 'vegan', label: 'Vegan', value: 'Vegan', icon: Leaf },
            { id: 'glutenTypes', label: 'Gluten-Free', value: 'Gluten-Free', icon: WheatOff },
            { id: 'keto', label: 'Keto', value: 'Keto', icon: Beef },
            { id: 'lowCarb', label: 'Low Carb', value: 'Low Carb', icon: Beef },
            { id: 'dairyFree', label: 'Dairy-Free', value: 'Dairy-Free', icon: Leaf }
        ]
    },
    {
        id: 'difficulty',
        label: 'Difficulty',
        icon: Gauge,
        options: [
            { id: 'easy', label: 'Easy', value: 'Easy', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' },
            { id: 'medium', label: 'Medium', value: 'Medium', color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300' },
            { id: 'hard', label: 'Hard', value: 'Hard', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' }
        ]
    },
    {
        id: 'cuisine',
        label: 'Cuisine',
        icon: Globe,
        options: [
            { id: 'italian', label: 'Italian', value: 'Italian', flag: '🇮🇹' },
            { id: 'greek', label: 'Greek', value: 'Greek', flag: '🇬🇷' },
            { id: 'mexican', label: 'Mexican', value: 'Mexican', flag: '🇲🇽' },
            { id: 'asian', label: 'Asian', value: 'Asian', flag: '🌏' },
            { id: 'french', label: 'French', value: 'French', flag: '🇫🇷' },
            { id: 'indian', label: 'Indian', value: 'Indian', flag: '🇮🇳' },
            { id: 'american', label: 'American', value: 'American', flag: '🇺🇸' }
        ]
    }
];
