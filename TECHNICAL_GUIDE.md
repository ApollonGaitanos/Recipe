# Chef's Compass - Technical Documentation

## 1. Project Overview
**Chef's Compass** is a premium, offline-capable Personal Recipe Management application built for modern web standards. It features a bilingual interface (Greek/English), "Magic" AI integration for recipe extraction, and a secure, cloud-backed storage system.

**Purpose:** To provide a seamless, beautiful cooking companion that helps users organize, cook, and discover recipes without the clutter of traditional recipe sites.

## 2. Technology Stack

### Frontend
- **Framework:** [React 18](https://react.dev/) (Vite)
- **Styling:** [TailwindCSS 3](https://tailwindcss.com/) with a custom design system (custom color palette, dark mode support).
- **Icons:** [Lucide React](https://lucide.dev/) for consistent, clean iconography.
- **State Management:**
  - `Context API` for global state (`AuthContext`, `LanguageContext`, `ToastContext`).
  - Local component state for UI interactions.

### Backend & Infrastructure
- **BaaS (Backend as a Service):** [Supabase](https://supabase.com/)
  - **Database:** PostgreSQL (with Row Level Security).
  - **Auth:** Supabase Auth (Email/Password).
  - **Edge Functions:** Deno-based serverless functions for secure operations.
- **Storage:**
  - **Images:** [Cloudflare R2](https://www.cloudflare.com/developer-platform/r2/) (accessed via Edge Functions for security).
- **AI Integration:**
  - **Google Gemini API:** Powers the "Magic Import" and "AI Chef" features.

## 3. Architecture & Key Features

### 3.1 Directory Structure
```
/
├── src/
│   ├── components/      # UI Components (Modals, Forms, Cards)
│   ├── context/         # Global Context Providers (Auth, Language)
│   ├── services/        # API Service layers (recipeService, aiService)
│   ├── utils/           # Helper functions (recipeParser, formatters)
│   └── App.jsx          # Main Router & Layout
├── supabase/
│   ├── functions/       # Deno Edge Functions (Server-side logic)
│   ├── migrations/      # Database schema changes
│   └── misc_sql/        # Manual SQL snippets/backups
└── ...
```

### 3.2 AI Features ("Magic")
All AI logic is centralized in `src/utils/recipeParser.js` and securely executed via Edge Functions.
1.  **Extract from URL:** Uses `scrape-recipe` to fetch HTML securely (SSRF protected), then parses JSON-LD/Microdata.
2.  **Magic Import (Text/Image):** Uses `ai-extract-recipe` to analyze unstructured text or photos of handwritten recipes and convert them into structured JSON.
3.  **AI Chef:** Generates recipes based on ingredients or prompts.
4.  **Translation:** On-the-fly translation of recipe content between English/Greek.

### 3.3 Security Implementation (Hardened)
The application follows a **"Fail Closed"** security model.

#### Database (PostgreSQL + RLS)
- **RLS (Row Level Security):** ENABLED on all tables (`recipes`, `profiles`, `likes`).
- **Profiles:** Public visibility is restricted via **Explicit Column Grants**. Only `id`, `username`, `avatar_url`, and `website` are public. Sensitive data (email) is never exposed to `anon`.
- **Recipes:** Users can only `INSERT/UPDATE/DELETE` their own rows (`user_id = auth.uid()`). Public recipes are viewable by everyone.

#### Edge Functions (Serverless)
1.  **`scrape-recipe`:**
    - **SSRF Protection:** Validates URLs against a strict allowlist (HTTPS only). Blocks Private IPs (10.x, 192.168.x), Localhost, and Cloud Metadata IPs (169.254.x).
    - **Auth:** Requires valid Supabase JWT (`VerifyJWT: true`).
2.  **`delete-image`:**
    - **Integrity Check:** Verifies that the `imageUrl` being deleted matches the **currently active** image in the database for that recipe. Prevents arbitrary file deletion attacks.
    - **Auth:** Strict JWT validation.
3.  **`upload-image`:**
    - **Presigned URLs:** Generates short-lived upload URLs for Cloudflare R2.
    - **Validation:** Enforces MIME types (images only) and file size limits.

## 4. Coding Practices

### Localization (i18n)
- **Strategy:** We do NOT use hardcoded strings. All text is routed through `LanguageContext`.
- **Usage:**
  ```javascript
  const { t } = useLanguage();
  return <button>{t('common.save')}</button>;
  ```
- **Dictionaries:** Located in `src/context/LanguageContext.jsx`. Structure is nested (e.g., `recipe.ingredients.label`).

### Component Design
- **Functional:** Pure functional components with Hooks.
- **Props:** Clean interface definitions.
- **Styling:** Mobile-first Tailwind classes.
  - *Example:* `grid grid-cols-1 md:grid-cols-2 gap-4`

### State Management
- **Optimistic UI:** UI updates immediately (e.g., Likes) while the DB request happens in the background.
- **Error Handling:** Centralized through `ToastContext` for user feedback.

## 5. Development Workflow

### Running Locally
1.  **Install Dependencies:**
    ```bash
    npm install
    ```
2.  **Start Frontend:**
    ```bash
    npm run dev
    ```
    (Runs on `http://localhost:5173`)

### Database & Backend
Supabase is used as the hosted backend.
- **Migrations:** Applied via generic SQL scripts or Supabase Dashboard.
- **Edge Functions:** Deployed using Supabase MCP or CLI:
    ```bash
    supabase functions deploy scrape-recipe --no-verify-jwt
    ```
    *(Note: We currently manage deployments via the Supabase MCP tool)*

## 6. Future Roadmap
- [ ] **Offline Sync:** Use Service Workers to cache recipes for true offline access.
- [ ] **Social Features:** Comments and "Remixes" of recipes.
- [ ] **Desktop App:** Wrap using Tauri/Electron.
