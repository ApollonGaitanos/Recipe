/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, useEffect } from 'react';

const LanguageContextData = createContext();

export function useLanguage() {
    return useContext(LanguageContextData);
}

const translations = {
    en: {
        appTitle: 'Opsopoiia',
        addRecipe: 'Add Recipe',
        improve: 'Improve with AI',
        translate: 'Translate',
        improving: 'Improving...',
        translating: 'Translating...',
        searchPlaceholder: 'Search recipes, ingredients...',
        noRecipes: 'No recipes found. Try adding one!',
        prepTime: 'Prep',
        cookTime: 'Cook',
        minSuffix: ' min',
        servings: 'Servings',
        edit: 'Edit',
        delete: 'Delete',
        back: 'Back',
        saveRecipe: 'Save Recipe',
        cancel: 'Cancel',
        editRecipe: 'Edit Recipe',
        newRecipe: 'New Recipe',
        downloadPDF: 'Download PDF',
        recipeTitle: 'Recipe Title',
        prepTimeLabel: 'Prep Time (min)',
        cookTimeLabel: 'Cook Time (min)',
        servingsLabel: 'Servings',
        ingredientsLabel: 'Ingredients (one per line)',
        instructionsLabel: 'Instructions',
        tagsLabel: 'Filters',
        deleteConfirm: 'Are you sure you want to delete this recipe?',
        ingredientsSection: 'Ingredients',
        instructionsSection: 'Instructions',
        placeholders: {
            title: "e.g. Grandma's Apple Pie",
            ingredients: "2 cups flour\n1 tsp salt\n...",
            instructions: "1. Preheat oven...\n2. Mix ingredients...",
            tags: "dessert, easy, holiday"
        },
        auth: {
            welcome: "Welcome Back",
            createAccount: "Create Account",
            login: "Log In",
            signup: "Sign Up",
            subtitle: "Sign in to save recipes and create your own cookbook.",
            orContinue: "Or continue with",
            processing: "Processing...",
            emailPlaceholder: "Email",
            usernamePlaceholder: "Username",
            passwordPlaceholder: "Password",
            confirmPasswordPlaceholder: "Re-enter Password",
            passwordMatchError: "Passwords do not match",
            passwordWeakError: "Password is too weak. Add numbers/symbols/length.",
            emailConfirmAlert: "Check your email to confirm account!",
            mustBeStronger: "Must be stronger",
            noAccount: "Don't have an account?",
            hasAccount: "Already have an account?",
            editorial: "EDITORIAL",
            freshFlavors: "Fresh flavors for every season."
        },
        settings: {
            title: "Account Settings",
            changeUsername: "Change Username",
            save: "Save Changes",
            saved: "Saved!",
            error: "Error saving changes"
        },
        magicImport: {
            title: "Magic Import",
            description: "Paste a URL or recipe text below:",
            labelUrl: "Option 1: From Website",
            labelText: "Option 2: Paste Text",
            labelImage: "Option 3: Scan Image",
            or: "OR",
            urlPlaceholder: "https://www.example.com/recipe...",
            textPlaceholder: "Paste recipe title, ingredients and instructions...",
            imageButton: "Choose Image or Take Photo",
            button: "Magic Import",
            parsing: "Processing...",
            scanning: "Scanning Text...",
            statusCore: "Loading OCR Core...",
            statusDownload: "Downloading Language Data...",
            statusInit: "Initializing Engine...",
            useAI: "AI",
            aiCost: "cost per use: 0.01€",
            modeImport: "Import",
            modeCreate: "Create Chef",
            placeholderCreate: "Describe what you want to cook (e.g. 'Spicy Chicken Pasta' or 'I have eggs and milk')...",
            btnCreate: "Generate Recipe",
            aiModeTitle: "AI Mode",
            aiModeFree: "Free",
            aiModeSmart: "Smart",
            tooltips: {
                off: "Classic Scraper Only",
                hybrid: "Scraper + AI Backup",
                on: "Force AI"
            },
            ready: "Ready",
            addImage: "Add Image",
            preview: "Preview"
        },
        visibility: {
            makePublic: "Make Public",
            makePrivate: "Make Private",
            publicFeed: "Public Community Recipes",
            myRecipes: "My Recipe Collection",
            confirmPublic: "Are you sure you want to make this recipe PUBLIC? It will be visible to everyone.",
            confirmPrivate: "Are you sure you want to make this recipe PRIVATE? Only you will be able to see it.",
            publicBadge: "Public",
            privateBadge: "Private"
        },
        nav: {
            discover: "Discover",
            myKitchen: "My Kitchen",
            shoppingList: "Shopping List",
            about: "About",
            community: "Community",
            submitRecipe: "Submit a Recipe",
            privacy: "Privacy",
            menu: "Menu",
            loginSignup: "Login / Sign Up",
            login: "Login",
            signOut: "Sign Out",
            settings: "Settings"
        },
        footer: {
            tagline: "Cooking made simple, beautiful, and organized.",
            copyright: "Οψοποιία Inc."
        },
        hero: {
            badge: "Recipe of the Day",
            viewRecipe: "View Recipe",
            unknownChef: "Unknown Chef",
            chefRole: "Head Chef",
            timeAgo: "2 hrs ago"
        },
        card: {
            ppl: "ppl",
            chef: "Chef",
            ago: "ago"
        },
        detail: {
            by: "by",
            like: "Like",
            unlike: "Unlike"
        },
        feed: {
            loadMore: "Load More Recipes",
            viewAll: "View all",
            freshTitle: "Fresh from the Kitchen",
            showMore: "Show More",
            showLess: "Show Less"
        },
        filters: {
            all: "All",
            // Meal Type
            breakfast: "Breakfast",
            brunch: "Brunch",
            lunch: "Lunch",
            dinner: "Dinner",
            snack: "Snack",
            appetizer: "Appetizer",
            soup: "Soup",
            salad: "Salad",
            side_dish: "Side Dish",
            dessert: "Dessert",
            drink: "Drink",
            // Dietary
            vegetarian: "Vegetarian",
            vegan: "Vegan",
            gluten_free: "Gluten-Free",
            dairy_free: "Dairy-Free",
            keto: "Keto",
            low_carb: "Low Carb",
            healthy: "Healthy",
            // Cuisine
            italian: "Italian",
            mexican: "Mexican",
            greek: "Greek",
            asian: "Asian",
            indian: "Indian",
            mediterranean: "Mediterranean",
            american: "American",
            // Method
            quick: "Quick (< 30m)",
            easy: "Easy",
            baking: "Baking",
            air_fryer: "Air Fryer",
            slow_cooker: "Slow Cooker",
            grilling: "Grilling"
        }
    },
    el: {
        appTitle: 'Οψοποιία',
        addRecipe: 'Προσθήκη',
        improve: 'Βελτίωση με AI',
        translate: 'Μετάφραση',
        improving: 'Βελτίωση...',
        translating: 'Μετάφραση...',
        searchPlaceholder: 'Αναζήτηση συνταγών, υλικών...',
        noRecipes: 'Δεν βρέθηκαν συνταγές. Προσθέστε μία!',
        prepTime: 'Προετοιμασία',
        cookTime: 'Μαγείρεμα',
        minSuffix: 'λ',
        servings: 'Μερίδες',
        edit: 'Επεξεργασία',
        delete: 'Διαγραφή',
        back: 'Πίσω',
        saveRecipe: 'Αποθήκευση',
        cancel: 'Ακύρωση',
        editRecipe: 'Επεξεργασία Συνταγής',
        newRecipe: 'Νέα Συνταγή',
        downloadPDF: 'Λήψη PDF',
        recipeTitle: 'Τίτλος Συνταγής',
        prepTimeLabel: 'Προετοιμασία (λεπτά)',
        cookTimeLabel: 'Μαγείρεμα (λεπτά)',
        servingsLabel: 'Μερίδες',
        ingredientsLabel: 'Υλικά (ένα ανά γραμμή)',
        instructionsLabel: 'Οδηγίες',
        tagsLabel: 'Φίλτρα',
        deleteConfirm: 'Είστε σίγουροι ότι θέλετε να διαγράψετε αυτή τη συνταγή;',
        ingredientsSection: 'Υλικά',
        instructionsSection: 'Οδηγίες',
        placeholders: {
            title: "π.χ. Μηλόπιτα της Γιαγιάς",
            ingredients: "2 κούπες αλεύρι\n1 κ.γ. αλάτι\n...",
            instructions: "1. Προθερμάνετε τον φούρνο...\n2. Ανακατέψτε τα υλικά...",
            tags: "γλυκό, εύκολο, γιορτινό"
        },
        auth: {
            welcome: "Καλώς Ήρθατε",
            createAccount: "Δημιουργία Λογαριασμού",
            login: "Σύνδεση",
            signup: "Εγγραφή",
            subtitle: "Συνδεθείτε για να αποθηκεύσετε συνταγές και να φτιάξετε το δικό σας βιβλίο μαγειρικής.",
            orContinue: "Ή συνεχίστε με",
            processing: "Επεξεργασία...",
            emailPlaceholder: "Email",
            usernamePlaceholder: "Όνομα Χρήστη",
            passwordPlaceholder: "Κωδικός",
            confirmPasswordPlaceholder: "Επαλήθευση Κωδικού",
            passwordMatchError: "Οι κωδικοί δεν ταιριάζουν",
            passwordWeakError: "Ο κωδικός είναι αδύναμος. Προσθέστε αριθμούς/σύμβολα.",
            emailConfirmAlert: "Ελέγξτε το email σας για επιβεβαίωση!",
            mustBeStronger: "Πρέπει να είναι πιο ισχυρός",
            noAccount: "Δεν έχετε λογαριασμό;",
            hasAccount: "Έχετε ήδη λογαριασμό;"
        },
        settings: {
            title: "Ρυθμίσεις Λογαριασμού",
            changeUsername: "Αλλαγή Ονόματος",
            save: "Αποθήκευση",
            saved: "Αποθηκεύτηκε!",
            error: "Σφάλμα αποθήκευσης"
        },
        magicImport: {
            title: "Αυτόματη Εισαγωγή",
            description: "Εισάγετε σύνδεσμο ή επικολλήστε κείμενο:",
            labelUrl: "Επιλογή 1: Από Ιστοσελίδα",
            labelText: "Επιλογή 2: Επικόλληση Κειμένου",
            labelImage: "Επιλογή 3: Σάρωση Εικόνας",
            or: "Ή",
            urlPlaceholder: "https://www.site.gr/syntagi...",
            textPlaceholder: "Επικολλήστε τίτλο, υλικά και εκτέλεση...",
            imageButton: "Επιλογή Εικόνας ή Φωτογραφία",
            button: "Αυτόματη Εισαγωγή",
            parsing: "Επεξεργασία...",
            scanning: "Σάρωση Κειμένου...",
            statusCore: "Φόρτωση Μηχανής...",
            statusDownload: "Λήψη Δεδομένων Γλώσσας...",
            statusInit: "Αρχικοποίηση...",
            useAI: "AI",
            aiCost: "κόστος χρήσης: 0.01€",
            modeImport: "Εισαγωγή",
            modeCreate: "Σεφ (Δημιουργία)",
            placeholderCreate: "Περιγράψτε τι θέλετε να μαγειρέψετε (π.χ. 'Κοτόπουλο με πατάτες' ή 'Έχω αυγά και γάλα')...",
            btnCreate: "Δημιουργία Συνταγής",
            aiModeTitle: "Λειτουργία AI",
            aiModeFree: "Δωρεάν",
            aiModeSmart: "Έξυπνη",
            tooltips: {
                off: "Μόνο Κλασική Σάρωση",
                hybrid: "Σάρωση + AI Backup",
                on: "Αποκλειστικά AI"
            },
            ready: "Έτοιμο",
            addImage: "Προσθήκη",
            preview: "Προεπισκόπηση"
        },
        visibility: {
            makePublic: "Δημοσιοποίηση",
            makePrivate: "Απόκρυψη",
            publicFeed: "Συνταγές της Κοινότητας",
            myRecipes: "Η Συλλογή μου",
            confirmPublic: "Θέλετε σίγουρα να κάνετε τη συνταγή ΔΗΜΟΣΙΑ; Θα είναι ορατή σε όλους.",
            confirmPrivate: "Θέλετε σίγουρα να κάνετε τη συνταγή ΙΔΙΩΤΙΚΗ; Θα είναι ορατή μόνο σε εσάς.",
            publicBadge: "Δημόσια",
            privateBadge: "Ιδιωτική"
        },
        nav: {
            discover: "Ανακάλυψη",
            myKitchen: "Η Κουζίνα μου",
            shoppingList: "Λίστα Αγορών",
            about: "Σχετικά",
            community: "Κοινότητα",
            submitRecipe: "Υποβολή Συνταγής",
            privacy: "Απόρρητο",
            menu: "Μενού",
            loginSignup: "Σύνδεση / Εγγραφή",
            login: "Σύνδεση",
            signOut: "Αποσύνδεση",
            settings: "Ρυθμίσεις"
        },
        footer: {
            tagline: "Η μαγειρική έγινε απλή, όμορφη και οργανωμένη.",
            copyright: "Οψοποιία Inc."
        },
        hero: {
            badge: "Συνταγή της Ημέρας",
            viewRecipe: "Προβολή",
            unknownChef: "Άγνωστος Σεφ",
            chefRole: "Σεφ",
            timeAgo: "πριν 2 ώρες"
        },
        card: {
            ppl: "άτομα",
            chef: "Σεφ",
            ago: "πριν"
        },
        detail: {
            by: "από",
            like: "Μου αρέσει",
            unlike: "Δεν μου αρέσει"
        },
        feed: {
            loadMore: "Περισσότερες Συνταγές",
            viewAll: "Προβολή όλων",
            freshTitle: "Φρέσκα από την Κουζίνα",
            showMore: "Περισσότερα",
            showLess: "Λιγότερα"
        },
        filters: {
            all: "Όλα",
            // Meal Type
            breakfast: "Πρωινό",
            brunch: "Δεκατιανό",
            lunch: "Μεσημεριανό",
            dinner: "Βραδινό",
            snack: "Σνακ",
            appetizer: "Ορεκτικό",
            soup: "Σούπα",
            salad: "Σαλάτα",
            side_dish: "Συνοδευτικό",
            dessert: "Γλυκό",
            drink: "Ποτό",
            // Dietary
            vegetarian: "Χορτοφαγικό",
            vegan: "Vegan",
            gluten_free: "Χωρίς Γλουτένη",
            dairy_free: "Χωρίς Γαλακτοκομικά",
            keto: "Κέτο",
            low_carb: "Χαμηλοί Υδατάνθρακες",
            healthy: "Υγιεινό",
            // Cuisine
            italian: "Ιταλική",
            mexican: "Μεξικάνικη",
            greek: "Ελληνική",
            asian: "Ασιατική",
            indian: "Ινδική",
            mediterranean: "Μεσογειακή",
            american: "Αμερικάνικη",
            // Method
            quick: "Γρήγορο (< 30λ)",
            easy: "Εύκολο",
            baking: "Φούρνου",
            air_fryer: "Air Fryer",
            slow_cooker: "Γάστρα/Αργό",
            grilling: "Σχάρας"
        }
    }
};

export default function LanguageContext({ children }) {
    const [language, setLanguage] = useState(() => {
        return localStorage.getItem('language') || 'en';
    });

    useEffect(() => {
        localStorage.setItem('language', language);
    }, [language]);

    const toggleLanguage = () => {
        setLanguage(prev => prev === 'en' ? 'el' : 'en');
    };

    const t = (key) => {
        const keys = key.split('.');
        let value = translations[language];
        for (const k of keys) {
            value = value?.[k];
        }
        return value || key;
    };

    return (
        <LanguageContextData.Provider value={{ language, toggleLanguage, t }}>
            {children}
        </LanguageContextData.Provider>
    );
}
