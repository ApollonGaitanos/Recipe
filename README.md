# 🍳 Οψοποιία (Opsopoiia) - Intelligent Recipe Manager

**"The Ancient Art of Cooking, Modernized with AI."**

*Οψοποιία* (Opsopoiia) is a premium, privacy-focused Progressive Web Application (PWA) for managing personal and discovered recipes. It combines a sophisticated "Ancient Greek" aesthetic with cutting-edge AI features to simplify the cooking experience.

> **Technical Deep Dive:** For detailed architecture, security models, and developer setup, please consult the [Technical Guide](TECHNICAL_GUIDE.md).

---

## 🏗️ Technology Stack

The application is built on a modern, high-performance stack ensuring speed, scalability, and developer experience.

### **Frontend**
*   **Framework**: [React 18](https://react.dev/) - Functional components, Hooks, and Context API.
*   **Build Tool**: [Vite](https://vitejs.dev/) - Blazing fast hot-module replacement (HMR).
*   **Styling**: 
    *   [Tailwind CSS](https://tailwindcss.com/) - Utility-first styling with a custom semantic theme.
    *   **Theme**: "Ancient Greek" utilizing CSS variables for dynamic Honey Amber / Wine Red palettes (Dark/Light modes).
*   **Routing**: React Router 6.
*   **Icons**: [Lucide React](https://lucide.dev/).

### **Backend & Infrastructure**
*   **Platform**: [Supabase](https://supabase.com/) (PostgreSQL 15).
*   **Authentication**: Supabase Auth (Email/Password) + JWT Verification.
*   **Database**: PostgreSQL with strict Row Level Security (RLS).
*   **Edge Functions**: Deno-based serverless functions for secure AI and file operations.
*   **Storage**: Cloudflare R2 (accessed securely via Edge Functions).

### **AI Intelligence**
*   **Provider**: Google Gemini API via Secure Edge Proxy.
*   **Capabilities**:
    *   **Magic Import**: Extract structured recipes from URLs, Text, or Images.
    *   **AI Chef**: Enhance instructions, translate content, and generate ideas.

---

## ✨ Features Breakdown

### 1. 🪄 Magic Import (AI-Powered)
The core differentiator of Opsopoiia.
*   **URL Scraper**: Securely fetches recipe HTML (protected against SSRF) and parses JSON-LD/Microdata.
*   **Text Parser**: Paste unstructured text; AI structures it into JSON.
*   **Image Recognition**: Upload a photo of a cookbook. Uses Hybrid OCR/Vision AI to digitize handwriting.

### 2. 👨‍🍳 AI Chef Assistant
*   **Improve**: Rewrites instructions to be professional and clear without changing ingredients.
*   **Translate**: Context-aware translation (English/Greek) maintaining culinary precision.

### 3. 🍲 Recipe Management
*   **CRUD**: Full Create, Read, Update, Delete capabilities.
*   **Filters**: Advanced filtering by Cuisine, Meal Type, Difficulty, and Dietary restrictions.
*   **Search**: Accent-insensitive fuzzy search.
*   **Tools Tracking**: Dedicated list for required pots/pans.

### 4. 🌍 Social & Discovery
*   **Privacy First**: Recipes are private by default.
*   **Community Feed**: Share your best creations.
*   **Likes & Saves**: Real-time engagement.
*   **Fork/Copy**: Clone public recipes to edit safely.

---

## 📂 Project Structure

```bash
/
├── src/
│   ├── components/         # Reusable UI components
│   ├── context/            # Global Contexts (Auth, Language, Toast)
│   ├── services/           # API integrations
│   ├── utils/              # Parsers & Helper functions
│   └── App.jsx             # Main Application Logic
├── supabase/
│   ├── functions/          # Deno Edge Functions (scrape-recipe, delete-image)
│   ├── migrations/         # Database schema changes
│   └── misc_sql/           # Backup SQL snippets
├── technical_guide.md      # Detailed Architecture Docs
└── ...
```

---

## 🔒 Security Architecture (Hardened)
*   **Fail-Closed RLS**: Users can ONLY access their own data. Profile visibility is restricted to explicit public columns.
*   **SSRF Protection**: `scrape-recipe` blocks internal network access (Localhost, Private IPs).
*   **Integrity Checks**: `delete-image` enforces strict ownership—users can only delete the file currently linked to their recipe.
*   **Secure Storage**: Cloudflare R2 uploads use short-lived Presigned URLs; Deletes are proxied via Edge Functions.

---

## 🚀 Deployment
*   **Frontend**: Deployed via Vercel/Netlify (SPA).
*   **Backend**: Managed Supabase Project.
*   **CI/CD**: GitHub Actions integrated.

---

*Documentation maintained by Apollo & Antigravity.*
