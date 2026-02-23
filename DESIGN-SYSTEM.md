# SouqMaker Design System v1.0

> Reusable design system extracted from SouqMaker. Use this as a blueprint to build new apps with the same look & feel.

---

## Table of Contents

1. [Color Tokens](#1-color-tokens)
2. [Typography](#2-typography)
3. [Spacing & Layout](#3-spacing--layout)
4. [Components](#4-components)
5. [Hooks](#5-hooks)
6. [i18n System](#6-i18n-system)
7. [Dark Mode](#7-dark-mode)
8. [RTL Support](#8-rtl-support)
9. [Animations](#9-animations)
10. [Files to Copy](#10-files-to-copy)

---

## 1. Color Tokens

### Brand Colors
```css
--brand: #C8F03F;                       /* Lime accent (primary brand) */
--brand-hover: #B8E030;                 /* Hover state */
--brand-light: #E6F8A0;                 /* Light tint */
--brand-glow: rgba(200, 240, 63, 0.15); /* Glow/shadow */
```

### Surface Colors (Light Mode)
```css
--d-surface: #ffffff;              /* Cards, panels */
--d-surface-secondary: #f7f7f7;    /* Secondary panels */
--d-surface-tertiary: #f1f1f1;     /* Tertiary/nested */
--d-bg: #f1f1f1;                   /* Page background */
--d-hover-bg: #f7f7f7;            /* Hover state */
--d-active-bg: #f1f1f1;           /* Active/pressed */
--d-subtle-bg: rgba(0,0,0,0.06);  /* Subtle overlay */
```

### Text Colors (Light Mode)
```css
--d-text: #303030;         /* Primary text */
--d-text-sub: #616161;     /* Secondary text */
--d-text-muted: #8a8a8a;   /* Muted/placeholder */
--d-link: #005bd3;          /* Links */
```

### Border & Input Colors (Light Mode)
```css
--d-border: #e3e3e3;        /* Card/section borders */
--d-input-border: #8a8a8a;  /* Input borders */
--d-input-bg: #fdfdfd;      /* Input backgrounds */
```

### Status Colors
```css
/* Success */  emerald-50, emerald-100, emerald-200, emerald-600
/* Error */    red-50, red-100, red-200, red-600
/* Warning */  amber-50, amber-100, amber-200, amber-600
/* Info */     blue-50, blue-100, blue-200, blue-600
```

### Dark Mode Override (`.pro-dark`)
```css
--d-surface: #1E1E1E;
--d-surface-secondary: #252525;
--d-surface-tertiary: #2C2C2C;
--d-text: #FFFFFF;
--d-text-sub: #A1A1A1;
--d-text-muted: #666666;
--d-border: #333333;
--d-input-border: #444444;
--d-input-bg: #252525;
--d-bg: #141414;
--d-link: #C8F03F;              /* Brand lime as link color in dark */
--d-hover-bg: #252525;
--d-active-bg: #2C2C2C;
--d-subtle-bg: rgba(255,255,255,0.06);
```

---

## 2. Typography

### Fonts
```
Primary:  Inter (Latin) - weights: 100-900
Arabic:   IBM Plex Sans Arabic - weights: 300-700
```

### Base Size
```css
font-size: 13px; /* Global base */
```

### Scale
| Token | Size | Usage |
|-------|------|-------|
| `text-xs` | 12px | Badges, labels, captions |
| `text-[13px]` | 13px | Body text, buttons (default) |
| `text-sm` | 14px | Secondary text |
| `text-base` | 16px | Large body |
| `text-lg` | 18px | Section headings |
| `text-xl` | 20px | Page titles |
| `text-2xl` | 24px | Major headings |

### Font Variables
```css
--font-inter: "Inter", system-ui, -apple-system, sans-serif;
--font-arabic: "IBM Plex Sans Arabic", "Inter", system-ui, sans-serif;
```

---

## 3. Spacing & Layout

### Radius Tokens
```css
--radius-card: 12px;    /* Cards, modals, panels */
--radius-input: 8px;    /* Inputs, select, textarea */
--radius-button: 8px;   /* Buttons */
```

### Layout Constants
```css
--sidebar-width: 16rem;   /* 256px */
--header-height: 4rem;    /* 64px */
```

### Responsive Padding
```
Mobile:  p-3     (12px)
Tablet:  sm:p-4  (16px)
Desktop: lg:p-6  (24px)
```

### Breakpoints
```
Mobile:  < 640px
Tablet:  640px - 1023px  (sm:)
Desktop: 1024px+         (lg:)
```

### Shadow System
```css
/* Card shadow (Shopify-inspired) */
.shadow-card {
  box-shadow: 0 1px 0 0 rgba(0,0,0,.05),
              0 0 0 0.5px #e3e3e3,
              0 2px 2px -1px rgba(0,0,0,.04);
}

/* Brand glow */
.shadow-glow {
  box-shadow: 0 0 20px rgba(200, 240, 63, 0.15);
}

/* Dark mode card */
.pro-dark .shadow-card {
  box-shadow: 0 0 0 0.5px #2C2C2C,
              0 1px 3px rgba(0,0,0,0.4);
}
```

---

## 4. Components

### 4.1 StyledButton

**File:** `src/components/styled-button.tsx`
**Dependency:** None (standalone)

**Variants:**
| Variant | Look | Usage |
|---------|------|-------|
| `primary` | Dark gradient `#2c2c2c` | Main actions (Save, Create) |
| `secondary` | Light surface with border | Secondary actions (Cancel) |
| `outline` | Transparent with border | Tertiary actions |
| `ghost` | No border, minimal | Icon-only, inline actions |
| `danger` | Red gradient | Destructive actions (Delete) |

**Sizes:**
| Size | Padding | Font |
|------|---------|------|
| `sm` | `px-3 py-1.5` | `text-xs` |
| `md` | `px-4 py-2` | `text-[15px]` |
| `lg` | `px-5 py-2.5` | `text-base` |
| `icon` | `p-2` | Icon only |

**Props:**
```tsx
interface StyledButtonProps {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger";
  size?: "sm" | "md" | "lg" | "icon";
  icon?: React.ReactNode;     // Left icon
  isLoading?: boolean;         // Shows spinner
  href?: string;               // Renders as <a> tag
  children?: React.ReactNode;
  className?: string;
  disabled?: boolean;
  onClick?: () => void;
}
```

**Usage:**
```tsx
<StyledButton variant="primary" icon={<Plus />} isLoading={saving}>
  Create Product
</StyledButton>

<StyledButton variant="danger" size="sm" icon={<Trash />}>
  Delete
</StyledButton>

<StyledButton variant="outline" href="/dashboard">
  Go to Dashboard
</StyledButton>
```

---

### 4.2 Toast System

**File:** `src/components/toast.tsx`
**Dependency:** None (standalone)

**Setup:**
```tsx
// In layout.tsx
<ToastProvider>
  <App />
</ToastProvider>
```

**Usage:**
```tsx
const { success, error, warning, info } = useToast();

success("Saved!", "Your changes have been saved");
error("Failed", "Something went wrong");
warning("Warning", "This action cannot be undone");
info("Info", "New version available");
```

**Features:**
- Max 5 visible toasts (auto-queue)
- Auto-dismiss after 3.5s
- Sound effects per icon type
- Slide-up animation
- 18 icon types: check, error, warning, info, order, product, style, upload, download, delete, profile, upgrade, copy, notification, store, token, analytics, affiliate

---

### 4.3 Card Pattern

**Not a component - a Tailwind pattern:**

```tsx
{/* Standard card */}
<div className="bg-d-surface rounded-xl border border-d-border shadow-card p-4">
  <h3 className="text-[15px] font-semibold text-d-text">Title</h3>
  <p className="text-[13px] text-d-text-sub mt-1">Description</p>
</div>

{/* Stat card */}
<div className="bg-d-surface rounded-xl border border-d-border shadow-card p-4">
  <p className="text-[12px] text-d-text-muted uppercase tracking-wide">Revenue</p>
  <p className="text-2xl font-bold text-d-text mt-1">$12,450</p>
</div>

{/* Interactive card */}
<div className="bg-d-surface rounded-xl border border-d-border shadow-card p-4
                hover:shadow-md hover:border-d-text/10 transition-all cursor-pointer">
  Content
</div>
```

---

### 4.4 Form Input Pattern

```tsx
{/* Text input */}
<label className="block text-[13px] font-medium text-d-text mb-1.5">
  Label
</label>
<input
  type="text"
  className="w-full px-3 py-2 rounded-lg border border-d-input-border
             bg-d-input-bg text-[13px] text-d-text
             focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand
             placeholder:text-d-text-muted"
  placeholder="Enter value..."
/>

{/* Select */}
<select className="w-full px-3 py-2 rounded-lg border border-d-input-border
                   bg-d-input-bg text-[13px] text-d-text">
  <option>Option 1</option>
</select>

{/* Textarea */}
<textarea
  rows={4}
  className="w-full px-3 py-2 rounded-lg border border-d-input-border
             bg-d-input-bg text-[13px] text-d-text resize-none
             focus:outline-none focus:ring-2 focus:ring-brand/30"
/>
```

---

### 4.5 Layout Components

**Authenticated Layout** (`authenticated-layout.tsx`)
- Sidebar + Header + Main content area
- Mobile responsive (hamburger menu)
- Notification system
- PRO welcome modal

**Sidebar** (`sidebar.tsx`)
- Fixed left navigation (256px width)
- Mobile overlay mode
- Badge support (unread counts)
- Store display with logo

**Dashboard Header** (`dashboard-header.tsx`)
- Breadcrumbs from URL path
- Token balance display
- Notifications dropdown
- Profile dropdown with plan/role badges

**Navbar** (`navbar.tsx`)
- Public-facing navigation
- Auth-aware (shows Login/Register or Dashboard)
- Mobile hamburger menu

---

### 4.6 Language Switcher

**File:** `src/components/language-switcher.tsx`
**Dependency:** `language-provider.tsx`

```tsx
<LanguageSwitcher className="optional-extra-classes" />
```

Renders a toggle button showing current locale (AR/FR) with a globe icon.

---

### 4.7 AdBanner

**File:** `src/components/ad-banner.tsx`
**Dependency:** `use-ad-free-status.ts`

```tsx
<AdBanner slot="page-top" format="horizontal" className="mb-4" />
```

Self-suppresses for PRO users and ad-free subscribers.

---

### 4.8 PRO CTA Card

**File:** `src/components/pro-cta.tsx`
**Dependency:** `use-effective-plan.ts`, translations

Renders a call-to-action card encouraging upgrade to PRO. Auto-hides for PRO users.

---

## 5. Hooks

### useEffectivePlan()
**File:** `src/lib/use-effective-plan.ts`
```tsx
const { effectivePlan, remainingDays, isExpired, isExpiringSoon } = useEffectivePlan();
// effectivePlan: "FREE" | "PRO"
// Accounts for plan expiration dates
```

### useTokenBalance()
**File:** `src/lib/use-token-balance.ts`
```tsx
const { balance, transactions, loading, refresh } = useTokenBalance();
```

### useAdFreeStatus()
**File:** `src/lib/use-ad-free-status.ts`
```tsx
const { showAds, adFreeUntil, loading, refresh } = useAdFreeStatus();
```

### useTranslation()
**File:** `src/components/language-provider.tsx`
```tsx
const { t, locale, setLocale, dir } = useTranslation();
// t("key") returns translated string
// dir is "rtl" or "ltr"
```

### useToast()
**File:** `src/components/toast.tsx`
```tsx
const { success, error, warning, info } = useToast();
```

### useStoreContext()
**File:** `src/lib/store-context.tsx`
```tsx
const { activeStore, loading, refreshStores } = useStoreContext();
```

---

## 6. i18n System

### Structure
```
src/i18n/
  index.ts    - Types, defaults, helpers
  fr.ts       - French dictionary (flat key-value)
  ar.ts       - Arabic dictionary (flat key-value)
```

### Key Format
Dot-notation namespacing:
```
"common.save"           -> "Enregistrer"
"auth.login.title"      -> "Connexion"
"sidebar.dashboard"     -> "Tableau de bord"
"dash.viewOrders"       -> "Voir les commandes"
```

### Adding a New Language
1. Create `src/i18n/en.ts` with same keys
2. Add to `Locale` type: `"ar" | "fr" | "en"`
3. Add to `dictionaries` record
4. Add direction mapping in `getDirection()`

### Provider Hierarchy
```tsx
<LanguageProvider initialLocale={cookieLocale}>
  <App />  {/* useTranslation() available everywhere */}
</LanguageProvider>
```

---

## 7. Dark Mode

### Activation
Dark mode is toggled via the `.pro-dark` class on the root element (PRO feature).

### Usage in Tailwind
```tsx
{/* Use CSS variables - auto-switches in dark mode */}
<div className="bg-d-surface text-d-text border-d-border">
  Auto dark mode via CSS variables
</div>

{/* Or use the custom variant for explicit dark styles */}
<div className="block pro-dark:hidden">Light only</div>
<div className="hidden pro-dark:block">Dark only</div>
```

### CSS Variable Override
All `--d-*` variables are redefined under `.pro-dark` selector, so any component using `bg-d-surface`, `text-d-text`, etc. automatically adapts.

---

## 8. RTL Support

### How It Works
- `<html dir="rtl">` is set based on locale
- CSS handles mirroring via `[dir="rtl"]` selectors
- Tailwind `ms-*` / `me-*` (margin-start/end) used instead of `ml-*` / `mr-*`

### Key Patterns
```tsx
{/* Use logical properties */}
<div className="ms-4">     {/* margin-start: auto-mirrors */}
<div className="ps-4">     {/* padding-start */}
<div className="text-start"> {/* text-align: start */}

{/* For RTL-specific overrides */}
<div className="[dir='rtl']:pr-4">
```

### CSS Overrides
```css
[dir="rtl"] select {
  background-position: left 6px center !important;
  padding-left: 20px !important;
}
```

---

## 9. Animations

### Toast Enter
```css
@keyframes toast-in {
  from { opacity: 0; transform: translateY(12px) scale(0.96); }
  to   { opacity: 1; transform: translateY(0) scale(1); }
}
```

### Tab Fade In
```css
@keyframes tab-fade-in {
  from { opacity: 0; transform: translateY(8px); }
  to   { opacity: 1; transform: translateY(0); }
}
```

### Subtle Bounce
```css
@keyframes subtle-bounce {
  0%, 100% { transform: translateY(0); }
  50%      { transform: translateY(-2px); }
}
```

---

## 10. Files to Copy for a New App

### Core (Required)
```
src/app/globals.css                  - All CSS tokens, variables, animations
src/components/styled-button.tsx     - Button component
src/components/toast.tsx             - Toast notification system
src/components/language-provider.tsx - i18n context
src/components/language-switcher.tsx - Language toggle
src/i18n/index.ts                   - i18n types & helpers
src/i18n/fr.ts                      - French translations (edit keys)
src/i18n/ar.ts                      - Arabic translations (edit keys)
```

### Layout (If building a dashboard app)
```
src/components/authenticated-layout.tsx
src/components/sidebar.tsx
src/components/dashboard-header.tsx
src/components/navbar.tsx
```

### Hooks (Copy as needed)
```
src/lib/use-effective-plan.ts
src/lib/use-token-balance.ts
src/lib/use-ad-free-status.ts
src/lib/store-context.tsx
```

### Providers Setup (in layout.tsx)
```tsx
<SessionProvider>
  <StoreProvider>
    <LanguageProvider initialLocale={locale}>
      <ToastProvider>
        {children}
      </ToastProvider>
    </LanguageProvider>
  </StoreProvider>
</SessionProvider>
```

---

## Approaches to Reuse This Design System

### Option A: Copy & Customize (Simplest)
Copy the files listed above into each new project. Customize colors by editing CSS variables in `globals.css`. Best for 1-3 apps with slight variations.

### Option B: Private npm Package
Extract components into a package like `@souqmaker/ui`:
```
@souqmaker/ui/
  components/  (StyledButton, Toast, etc.)
  hooks/       (useTranslation, useToast, etc.)
  styles/      (globals.css tokens)
  i18n/        (translation system)
```
Install via `npm install @souqmaker/ui`. Best for 3+ apps maintained by a team.

### Option C: Monorepo with Shared Packages
Use Turborepo or Nx:
```
apps/
  souqmaker/       (e-commerce app)
  delivery-app/    (delivery app)
  admin-panel/     (admin app)
packages/
  ui/              (shared components)
  config/          (shared tailwind/eslint configs)
  i18n/            (shared translations)
```
Best for a suite of related apps developed together.

### Option D: Template Repository
Create a GitHub template repo with the base setup:
- All design tokens pre-configured
- Layout components ready
- Auth + i18n + toast wired up
- Empty pages for customization

Use `gh repo create my-new-app --template souqmaker-template`. Best for quickly spinning up new projects with the same foundation.

---

## Quick Start for a New App

```bash
# 1. Create Next.js app
npx create-next-app@latest my-new-app --typescript --tailwind

# 2. Copy design system files (from this project)
cp globals.css styled-button.tsx toast.tsx language-provider.tsx ...

# 3. Edit globals.css to change brand colors
#    --brand: #YOUR_COLOR;

# 4. Edit i18n dictionaries with your app's text

# 5. Wire up providers in layout.tsx

# 6. Start building pages using the component patterns above
```
