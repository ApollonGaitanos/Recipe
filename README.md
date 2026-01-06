# 🍳 Οψοποιία (Opsopoiia) - Intelligent Recipe Manager

**"The Ancient Art of Cooking, Modernized with AI."**

*Οψοποιία* (Opsopoiia) is a premium, privacy-focused Progressive Web Application (PWA) for managing personal and discovered recipes. It combines a sophisticated "Ancient Greek" aesthetic with cutting-edge AI features to simplify the cooking experience.

---

## 🏗️ Technology Stack

The application is built on a modern, high-performance stack ensuring speed, scalability, and developer experience.

### **Frontend**
*   **Framework**: [React 19](https://react.dev/) - Functional components, Hooks, and Context API for state management.
*   **Build Tool**: [Vite 7](https://vitejs.dev/) - Blazing fast hot-module replacement (HMR) and optimized building.
*   **Styling**: 
    *   [Tailwind CSS 4](https://tailwindcss.com/) - Utility-first styling with a custom semantic theme configuration.
    *   **Design System**: "Ancient Greek" theme utilizing CSS variables for dynamic Light/Dark mode switching (Honey Amber/Wine Red palettes).
*   **Routing**: [React Router 7](https://reactrouter.com/) - Client-side routing with history management.
*   **Icons**: [Lucide React](https://lucide.dev/) - Consistent, lightweight SVG icons.

### **Backend & Infrastructure**
*   **Platform**: [Supabase](https://supabase.com/) (PostgreSQL 15).
*   **Authentication**: Supabase Auth (Email/Password) with secure session management.
*   **Database**: PostgreSQL with Row Level Security (RLS) policies for granular access control.
*   **Real-time Communication**: Supabase Realtime for live updates (Like counts, Feed synchronization).
*   **Edge Functions**: Deno-based serverless functions for running AI operations securely.

### **Types of Intelligence (AI)**
*   **Provider**: Google Gemini API (via Supabase Edge Functions).
*   **Models Strategy**:
    *   **Text & Logic**: Prioritizes **Gemma 3 (27b/12b)** for high reasoning and RPD (Requests Per Day) limits.
    *   **Vision**: Prioritizes **Gemini 3 Flash** & **Gemini 2.5 Flash** for multimodal (image) analysis.
    *   **Fallback**: Robust error handling switches to available stable models if primary ones fail.
*   **Agent**: Custom prompts for "Chef Persona" (Creative) vs. "Data Extractor" (Strict).

### **Utilities**
*   **OCR**: [Tesseract.js](https://tesseract.projectnaptha.com/) - Client-side optical character recognition for offline/fast image text extraction.
*   **PDF Generation**: [html2pdf.js](https://ekoopmans.github.io/html2pdf.js/) - Client-side rendering of recipes to printable PDFs.

---

## ✨ Features Breakdown

### 1. 🪄 Magic Import (AI-Powered)
The core differentiator of Opsopoiia.
*   **URL Scraper**: Paste any recipe URL.
    *   *Triple-Layer Robustness*: Uses Direct Fetch (Browser Mimicry) -> AllOrigins Proxy -> CorsProxy.io to overcome blocking.
    *   Extracts Title, Tools, Description, Ingredients, and Instructions cleanly.
*   **Text Parser**: Paste unstructured text (e.g., from a message). AI structures it into JSON.
*   **Image Recognition**: Upload a photo of a cookbook. Hybrid system uses OCR (Tesseract) for speed or AI (Gemini Vision) for handwriting/layout understanding.

### 2. 👨‍🍳 AI Chef Assistant
*   **Improve**: Rewrites instructions to be professional and clear without changing ingredients. Adds "Why" explanations to steps.
*   **Translate**: Context-aware translation (currently optimized for Greek/English) that converts units (cups -> grams) and maintains culinary nuances.

### 3. 🍲 Recipe Management
*   **CRUD**: Full Create, Read, Update, Delete capabilities.
*   **Filters**: Advanced filtering by Cuisine, Meal Type, Difficulty, and Dietary restrictions.
*   **Search**: Accent-insensitive fuzzy search (e.g., "κοτοπουλο" finds "κοτόπουλο").
*   **Tools & Equipment**: Dedicated tracking for pots, pans, and gadgets required.

### 4. 🌍 Social & Discovery
*   **Public/Private Visibility**: Toggle recipes between ultra-private (encrypted RLS) and the Public Feed.
*   **Community Feed**: Discover recipes from other users.
*   **Likes**: Real-time heart system to save favorites.
*   **Bookmarks (Cookbook)**: Save public recipes to your personal collection.
*   **Fork/Copy**: Clone a public recipe to your kitchen to edit it safely.

### 5. 🎨 UX & Design
*   **Theming**: 
    *   *Light Mode*: "Attic Light" - Warm backgrounds, Wine Red accents.
    *   *Dark Mode*: "Dorian Dark" - Deep charcoal, Amber Honey accents.
*   **Internationalization (i18n)**: Full generic language support with Greek (El) and English (En) fully implemented.
*   **Responsive**: Mobile-first grid layout that adapts to desktops (1-col -> 3-col).

---

## 📂 Project Structure

```bash
/
├── src/
│   ├── components/         # Reusable UI components (RecipeCard, AuthModal, etc.)
│   ├── contexts/           # React Contexts (RecipeContext, AuthContext, ThemeContext)
│   ├── utils/              # Helper functions (recipeParser.js, ocr.js)
│   ├── App.jsx             # Main Application Logic
│   └── main.jsx            # Entry Point
├── supabase/
│   ├── functions/          # Deno Edge Functions
│   │   └── ai-extract-recipe/  # Main AI Logic
│   └── migrations/         # SQL Schema definitions
├── public/                 # Static assets
└── index.html              # HTML entry
```

---

## 🔒 Security & Data
*   **RLS (Row Level Security)**: Database policies ensure users can ONLY read/write their own data unless explicitly set to `is_public`.
*   **Edge Security**: AI API keys are stored in Supabase Vault/Env variables, never exposed to the client.
*   **Sanitization**: AI outputs are strictly sanitized to prevent JSON injection or format execution.

---

## 🚀 Deployment
*   **Frontend**: Deployed as a holistic SPA (Single Page App).
*   **Backend**: Managed by Supabase Platform.
*   **CI/CD**: GitHub Actions integrated for automated checks.

---

*Documentation generated automatically by Antigravity.*
