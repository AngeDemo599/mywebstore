# SouqMaker Design System v1.0

> Complete UI pattern library extracted from SouqMaker. Copy-paste ready for new apps.

---

## Table of Contents

1. [Color Tokens](#1-color-tokens)
2. [Typography](#2-typography)
3. [Spacing & Layout](#3-spacing--layout)
4. [Buttons](#4-buttons)
5. [Cards](#5-cards)
6. [Tables](#6-tables)
7. [Forms & Inputs](#7-forms--inputs)
8. [Modals & Dialogs](#8-modals--dialogs)
9. [Tabs](#9-tabs)
10. [Badges & Pills](#10-badges--pills)
11. [Dropdowns](#11-dropdowns)
12. [Toast Notifications](#12-toast-notifications)
13. [Alerts & Banners](#13-alerts--banners)
14. [Search](#14-search)
15. [Pagination](#15-pagination)
16. [Toggle Switch](#16-toggle-switch)
17. [Progress Bars](#17-progress-bars)
18. [File Upload](#18-file-upload)
19. [Status Indicators](#19-status-indicators)
20. [Empty States](#20-empty-states)
21. [Loading States](#21-loading-states)
22. [Avatars & Thumbnails](#22-avatars--thumbnails)
23. [Grid Layouts](#23-grid-layouts)
24. [Sidebar Navigation](#24-sidebar-navigation)
25. [Dashboard Header](#25-dashboard-header)
26. [Navbar](#26-navbar)
27. [PRO CTA](#27-pro-cta)
28. [Hooks](#28-hooks)
29. [i18n System](#29-i18n-system)
30. [Dark Mode](#30-dark-mode)
31. [RTL Support](#31-rtl-support)
32. [Animations](#32-animations)
33. [Files to Copy](#33-files-to-copy)
34. [Reuse Approaches](#34-reuse-approaches)

---

## 1. Color Tokens

### Brand
```css
--brand: #C8F03F;
--brand-hover: #B8E030;
--brand-light: #E6F8A0;
--brand-glow: rgba(200, 240, 63, 0.15);
```

### Surfaces (Light)
```css
--d-surface: #ffffff;
--d-surface-secondary: #f7f7f7;
--d-surface-tertiary: #f1f1f1;
--d-bg: #f1f1f1;
--d-hover-bg: #f7f7f7;
--d-active-bg: #f1f1f1;
--d-subtle-bg: rgba(0,0,0,0.06);
```

### Text (Light)
```css
--d-text: #303030;
--d-text-sub: #616161;
--d-text-muted: #8a8a8a;
--d-link: #005bd3;
```

### Borders (Light)
```css
--d-border: #e3e3e3;
--d-input-border: #8a8a8a;
--d-input-bg: #fdfdfd;
```

### Status Colors
| Status | Background | Text |
|--------|-----------|------|
| Success | `bg-green-100` / `bg-emerald-50` | `text-green-700` / `text-emerald-600` |
| Error | `bg-red-100` / `bg-red-50` | `text-red-700` / `text-red-600` |
| Warning | `bg-yellow-100` / `bg-amber-50` | `text-yellow-800` / `text-amber-600` |
| Info | `bg-blue-100` / `bg-blue-50` | `text-blue-800` / `text-blue-600` |
| Purple | `bg-purple-100` | `text-purple-800` |
| Indigo | `bg-indigo-100` | `text-indigo-800` |

### Dark Mode (`.pro-dark`)
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
--d-link: #C8F03F;
--d-hover-bg: #252525;
--d-active-bg: #2C2C2C;
--d-subtle-bg: rgba(255,255,255,0.06);
```

---

## 2. Typography

### Fonts
```css
--font-inter: "Inter", system-ui, -apple-system, sans-serif;
--font-arabic: "IBM Plex Sans Arabic", "Inter", system-ui, sans-serif;
```

### Scale
| Class | Size | Usage |
|-------|------|-------|
| `text-[10px]` | 10px | Tiny labels, badge text |
| `text-[11px]` | 11px | Stock indicators |
| `text-xs` | 12px | Badges, captions, table labels |
| `text-[13px]` | 13px | Body text, buttons, inputs (base) |
| `text-sm` | 14px | Secondary text, descriptions |
| `text-[15px]` | 15px | Button labels (md size) |
| `text-base` | 16px | Large body text |
| `text-lg` | 18px | Section headings |
| `text-xl` | 20px | Page titles |
| `text-2xl` | 24px | Major headings, stat numbers |

### Weights Used
| Weight | Class | Usage |
|--------|-------|-------|
| 400 | `font-normal` | Body text |
| 500 | `font-medium` | Labels, input labels |
| 550 | `font-[550]` | Active tab text |
| 600 | `font-semibold` | Card titles, section headings |
| 700 | `font-bold` | Page titles, stat numbers, badges |

---

## 3. Spacing & Layout

### Radius
```css
--radius-card: 12px;   /* rounded-xl */
--radius-input: 8px;   /* rounded-lg */
--radius-button: 8px;  /* rounded-lg */
```

### Layout Constants
```css
--sidebar-width: 16rem;  /* 256px */
--header-height: 4rem;   /* 64px */
```

### Responsive Padding
```
Mobile:  p-3     (12px)
Tablet:  sm:p-4  (16px)
Desktop: lg:p-6  (24px)
```

### Shadow System
```css
.shadow-card {
  box-shadow: 0 1px 0 0 rgba(0,0,0,.05),
              0 0 0 0.5px #e3e3e3,
              0 2px 2px -1px rgba(0,0,0,.04);
}

.shadow-glow {
  box-shadow: 0 0 20px rgba(200, 240, 63, 0.15);
}

.pro-dark .shadow-card {
  box-shadow: 0 0 0 0.5px #2C2C2C, 0 1px 3px rgba(0,0,0,0.4);
}
```

---

## 4. Buttons

### StyledButton Component

**File:** `src/components/styled-button.tsx`

#### Variants

**Primary** — Main actions (Save, Create, Submit)
```tsx
<StyledButton variant="primary" icon={<Plus className="w-4 h-4" />}>
  Create Product
</StyledButton>
```
```
bg-[#2c2c2c] bg-gradient-to-b from-[#3a3a3a] to-[#262626]
text-white border border-black
shadow-[inset_0_1px_0_0_rgba(255,255,255,0.15),0_2px_4px_rgba(0,0,0,0.3)]
hover:from-[#404040] hover:to-[#2b2b2b]
```

**Secondary** — Cancel, Back
```tsx
<StyledButton variant="secondary">Cancel</StyledButton>
```
```
bg-d-surface text-d-text border border-d-border
shadow-sm hover:bg-d-hover-bg
```

**Outline** — Tertiary actions
```tsx
<StyledButton variant="outline" icon={<Filter />}>Filter</StyledButton>
```
```
bg-transparent text-d-text border border-d-border
hover:bg-d-hover-bg shadow-sm
```

**Ghost** — Minimal, inline actions
```tsx
<StyledButton variant="ghost" size="icon"><X /></StyledButton>
```
```
bg-transparent text-d-text-sub border border-transparent
hover:bg-d-hover-bg hover:text-d-text
```

**Danger** — Destructive actions
```tsx
<StyledButton variant="danger" icon={<Trash />}>Delete</StyledButton>
```
```
bg-red-600 bg-gradient-to-b from-red-500 to-red-600
text-white border border-red-800
shadow-[inset_0_1px_0_0_rgba(255,255,255,0.2),0_2px_4px_rgba(220,38,38,0.2)]
```

#### Sizes
| Size | Classes | Usage |
|------|---------|-------|
| `sm` | `px-3 py-1.5 text-xs gap-1.5 rounded-lg` | Compact actions |
| `md` | `px-4 py-2 text-[15px] gap-2 rounded-lg` | Default |
| `lg` | `px-5 py-2.5 text-base gap-2 rounded-lg` | Hero CTA |
| `icon` | `p-2 rounded-lg` | Icon-only (square) |

#### Loading State
```tsx
<StyledButton variant="primary" isLoading={true}>
  Saving...
</StyledButton>
// Shows: spinning circle + "Saving..."
```

#### As Link
```tsx
<StyledButton variant="primary" href="/dashboard">
  Go to Dashboard
</StyledButton>
// Renders as <a> tag instead of <button>
```

---

## 5. Cards

### Standard Card
```tsx
<div className="bg-d-surface rounded-xl border border-d-border shadow-card p-4">
  <h3 className="text-[15px] font-semibold text-d-text">Card Title</h3>
  <p className="text-[13px] text-d-text-sub mt-1">Card description text</p>
</div>
```

### Stat Card
```tsx
<div className="bg-d-surface rounded-xl shadow-card p-4 hover:shadow-md transition-shadow">
  <div className="flex items-center justify-between mb-3">
    <span className="text-[12px] font-medium text-d-text-muted uppercase tracking-wide">
      Total Orders
    </span>
    <ShoppingCart className="w-4 h-4 text-d-text-muted" />
  </div>
  <p className="text-2xl font-bold text-d-text tracking-tight">1,234</p>
  <p className="text-[12px] text-d-text-sub mt-1">+12 today</p>
</div>
```

### Interactive Card (Hover)
```tsx
<div className="bg-d-surface rounded-xl border border-d-border shadow-card p-4
                hover:shadow-md hover:border-d-text/10 transition-all cursor-pointer">
  Content
</div>
```

### Selected Card (Ring)
```tsx
<div className={`rounded-xl border-2 p-4 cursor-pointer transition-all ${
  selected
    ? "border-d-text bg-d-surface shadow-card"
    : "border-d-border bg-d-surface-secondary hover:border-d-input-border"
}`}>
  Content
</div>
```

### Feature Card (with icon)
```tsx
<div className="bg-d-surface rounded-xl border border-d-border shadow-card p-5">
  <div className="w-10 h-10 bg-d-surface-secondary rounded-xl flex items-center justify-center mb-3">
    <Zap className="w-5 h-5 text-d-text" />
  </div>
  <h4 className="text-[14px] font-semibold text-d-text mb-1">Feature Name</h4>
  <p className="text-[13px] text-d-text-sub">Feature description goes here.</p>
</div>
```

### Pricing Card
```tsx
<div className="relative bg-d-surface rounded-xl border border-d-border shadow-card p-6">
  {/* Best value badge */}
  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#303030] text-white
                  text-[10px] font-bold px-3 py-1 rounded-full shadow-md
                  flex items-center gap-1 whitespace-nowrap">
    <Sparkles size={10} />BEST VALUE
  </div>
  <h3 className="text-lg font-bold text-d-text">PRO Plan</h3>
  <p className="text-3xl font-bold text-d-text mt-2">$9.99<span className="text-sm font-normal text-d-text-sub">/mo</span></p>
  <ul className="mt-4 space-y-2">
    <li className="flex items-center gap-2 text-[13px] text-d-text">
      <Check className="w-4 h-4 text-green-500" />Feature 1
    </li>
  </ul>
</div>
```

---

## 6. Tables

### Flex-based Table (Responsive)

#### Desktop Table Header
```tsx
<div className="hidden lg:block bg-d-surface rounded-xl shadow-card overflow-x-auto">
  {/* Header row */}
  <div className="flex items-center bg-d-surface-secondary rounded-t-xl border-b border-d-border">
    <div className="w-[200px] shrink-0 p-3 text-xs font-medium text-d-text-sub uppercase tracking-wide">
      Name
    </div>
    <div className="w-[150px] shrink-0 p-3 text-xs font-medium text-d-text-sub uppercase tracking-wide">
      Email
    </div>
    <div className="flex-1 p-3 text-xs font-medium text-d-text-sub uppercase tracking-wide">
      Status
    </div>
    <div className="w-[100px] shrink-0 p-3 text-xs font-medium text-d-text-sub uppercase tracking-wide text-end">
      Actions
    </div>
  </div>

  {/* Data rows */}
  {items.map(item => (
    <div key={item.id} className="flex items-center hover:bg-d-hover-bg transition-colors border-b border-d-border last:border-b-0">
      <div className="w-[200px] shrink-0 p-3 text-[13px] text-d-text font-medium">
        {item.name}
      </div>
      <div className="w-[150px] shrink-0 p-3 text-[13px] text-d-text-sub">
        {item.email}
      </div>
      <div className="flex-1 p-3">
        <span className="inline-block px-2 py-1 rounded-lg text-xs font-medium bg-green-100 text-green-700">
          Active
        </span>
      </div>
      <div className="w-[100px] shrink-0 p-3 text-end">
        <StyledButton variant="ghost" size="icon"><MoreHorizontal className="w-4 h-4" /></StyledButton>
      </div>
    </div>
  ))}
</div>
```

#### Mobile Card View (Same Data)
```tsx
<div className="lg:hidden space-y-3">
  {items.map(item => (
    <div key={item.id} className="bg-d-surface rounded-xl shadow-card p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[13px] font-semibold text-d-text">{item.name}</span>
        <span className="inline-block px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-700">
          Active
        </span>
      </div>
      <p className="text-[12px] text-d-text-sub">{item.email}</p>
    </div>
  ))}
</div>
```

---

## 7. Forms & Inputs

### Text Input
```tsx
<label className="block text-[13px] font-medium text-d-text mb-1.5">Label</label>
<input
  type="text"
  className="w-full px-3 py-2 rounded-lg border border-d-input-border bg-d-input-bg
             text-[13px] text-d-text min-h-[32px]
             focus:outline-none focus:ring-2 focus:ring-d-link
             placeholder:text-d-text-muted"
  placeholder="Enter value..."
/>
```

### Input with Icon
```tsx
<div className="relative">
  <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-d-text-sub" />
  <input
    className="w-full ps-9 pe-3 py-2 border border-d-input-border rounded-lg bg-d-input-bg
               text-[13px] focus:outline-none focus:ring-1 focus:ring-d-link focus:border-d-link"
  />
</div>
```

### Select
```tsx
<select className="w-full px-3 py-2 rounded-lg border border-d-input-border
                   bg-d-input-bg text-[13px] text-d-text outline-none">
  <option value="">Select...</option>
  <option value="a">Option A</option>
  <option value="b">Option B</option>
</select>
```

### Textarea
```tsx
<textarea
  rows={4}
  className="w-full px-3 py-2 rounded-lg border border-d-input-border bg-d-input-bg
             text-[13px] text-d-text resize-none
             focus:outline-none focus:ring-2 focus:ring-brand/30"
  placeholder="Enter description..."
/>
```

### Input with Label + Helper Text
```tsx
<div>
  <label className="block text-[13px] font-medium text-d-text mb-1.5">Store Name</label>
  <input
    className="w-full px-3 py-2 rounded-lg border border-d-input-border bg-d-input-bg text-[13px] text-d-text
               focus:outline-none focus:ring-2 focus:ring-d-link"
  />
  <p className="text-[11px] text-d-text-muted mt-1">This will appear in your store URL</p>
</div>
```

### Checkbox
```tsx
<label className="flex items-center gap-2 cursor-pointer">
  <input type="checkbox" className="w-4 h-4 rounded border-d-input-border text-d-text" />
  <span className="text-[13px] text-d-text">Enable notifications</span>
</label>
```

---

## 8. Modals & Dialogs

### Standard Modal
```tsx
{showModal && (
  <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
    <div className="bg-d-surface rounded-xl shadow-2xl w-full max-w-md p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-d-text">Modal Title</h3>
        <button onClick={() => setShowModal(false)}
                className="p-1 rounded-lg hover:bg-d-hover-bg text-d-text-sub">
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Body */}
      <div className="space-y-4">
        <p className="text-[13px] text-d-text-sub">Modal content goes here.</p>
      </div>

      {/* Footer */}
      <div className="flex justify-end gap-3 mt-6">
        <StyledButton variant="secondary" onClick={() => setShowModal(false)}>
          Cancel
        </StyledButton>
        <StyledButton variant="primary">Confirm</StyledButton>
      </div>
    </div>
  </div>
)}
```

### Danger Confirmation Modal
```tsx
{showDelete && (
  <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
    <div className="bg-d-surface rounded-xl shadow-2xl w-full max-w-sm p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
          <AlertTriangle className="w-5 h-5 text-red-600" />
        </div>
        <div>
          <h3 className="text-[15px] font-bold text-d-text">Delete Item?</h3>
          <p className="text-[13px] text-d-text-sub">This action cannot be undone.</p>
        </div>
      </div>
      <div className="flex justify-end gap-3 mt-6">
        <StyledButton variant="secondary" onClick={() => setShowDelete(false)}>Cancel</StyledButton>
        <StyledButton variant="danger" onClick={handleDelete}>Delete</StyledButton>
      </div>
    </div>
  </div>
)}
```

### Image Lightbox
```tsx
{lightboxUrl && (
  <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
       onClick={() => setLightboxUrl(null)}>
    <img src={lightboxUrl} className="max-w-full max-h-[90vh] rounded-xl" />
  </div>
)}
```

---

## 9. Tabs

### Standard Tabs
```tsx
<div className="px-3 py-2 bg-d-surface rounded-xl border border-d-border flex items-center gap-2">
  {["Tab 1", "Tab 2", "Tab 3"].map(tab => (
    <button
      key={tab}
      onClick={() => setActiveTab(tab)}
      className={`flex-1 px-2 py-1.5 rounded-lg text-sm font-bold text-center transition-colors whitespace-nowrap ${
        activeTab === tab
          ? "bg-d-surface-tertiary text-d-text font-[550]"
          : "text-d-text-sub hover:text-d-text"
      }`}
    >
      {tab}
    </button>
  ))}
</div>
```

### Tabs with Badge Count
```tsx
<button className="relative flex-1 px-2 py-1.5 rounded-lg text-sm text-center">
  Pending
  {pendingCount > 0 && (
    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs
                     w-5 h-5 rounded-full flex items-center justify-center">
      {pendingCount}
    </span>
  )}
</button>
```

### Tabs with Sliding Indicator
```tsx
<div ref={tabsRef} className="relative flex gap-1 bg-d-subtle-bg rounded-xl p-1 mb-5">
  {/* Sliding background */}
  <div
    className="absolute top-1 bottom-1 bg-d-surface rounded-lg shadow-sm transition-all duration-300 ease-out"
    style={{ left: indicatorLeft, width: indicatorWidth }}
  />
  {/* Tab buttons */}
  {tabs.map((tab, i) => (
    <button
      key={tab}
      ref={el => { tabRefs.current[i] = el }}
      onClick={() => setActiveTab(tab)}
      className="relative z-10 flex-1 flex items-center justify-center gap-2
                 py-2 text-[13px] font-medium rounded-lg transition-colors"
    >
      {tab}
    </button>
  ))}
</div>
```

---

## 10. Badges & Pills

### Plan Badge
```tsx
<span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full
                 bg-[#303030] text-white text-[10px] font-bold tracking-wide">
  PRO
</span>
```

### PRO Badge (with sparkle)
```tsx
<span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded
                 bg-[#303030] text-white text-[9px] font-bold">
  <Sparkles size={8} className="text-lime-400" />PRO
</span>
```

### Role Badge
```tsx
<span className={`inline-block px-2 py-1 rounded-lg text-xs font-medium ${
  role === "ADMIN"
    ? "bg-purple-100 text-purple-800"
    : "bg-d-surface-secondary text-d-text"
}`}>
  {role}
</span>
```

### Status Badge
```tsx
<span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${
  status === "PENDING"   ? "bg-yellow-100 text-yellow-800" :
  status === "APPROVED"  ? "bg-green-100 text-green-800" :
  status === "REJECTED"  ? "bg-red-100 text-red-800" :
  "bg-d-surface-secondary text-d-text"
}`}>
  {status}
</span>
```

### Count Badge (Sidebar)
```tsx
<span className="text-[11px] font-bold text-d-text-sub bg-d-surface-secondary
                 px-2 py-0.5 rounded-md">
  {count}
</span>
```

### Notification Dot
```tsx
<span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-red-500
                 rounded-full border-2 border-d-surface" />
```

### Best Value Badge (Floating)
```tsx
<div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#303030] text-white
                text-[10px] font-bold px-3 py-1 rounded-full shadow-md
                flex items-center gap-1 whitespace-nowrap">
  <Sparkles size={10} />BEST VALUE
</div>
```

### Locked Feature Badge
```tsx
<span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded
                 bg-d-surface-tertiary text-d-text-muted text-[9px] font-bold">
  <Lock size={8} />PRO
</span>
```

---

## 11. Dropdowns

### Filter Dropdown
```tsx
<div className="relative">
  <StyledButton variant="outline" size="sm" onClick={() => setOpen(!open)}>
    <Filter className="w-4 h-4" /> Filter
  </StyledButton>

  {open && (
    <div className="absolute start-0 sm:end-0 sm:start-auto top-full mt-1.5
                    w-[calc(100vw-2rem)] sm:w-72 max-w-sm
                    bg-d-surface rounded-xl border border-d-border shadow-lg z-30 py-3 px-3">
      {/* Filter content */}
      <label className="text-[12px] font-medium text-d-text-sub uppercase tracking-wide">
        Status
      </label>
      <select className="w-full px-2.5 py-1.5 rounded-lg border border-d-input-border
                         text-d-text text-sm outline-none bg-transparent mt-1">
        <option value="">All</option>
        <option value="active">Active</option>
      </select>
    </div>
  )}
</div>
```

### Profile Dropdown
```tsx
<div className="relative">
  <button onClick={() => setOpen(!open)} className="flex items-center gap-2">
    <div className="w-8 h-8 rounded-full bg-d-surface-tertiary flex items-center justify-center">
      <User className="w-4 h-4 text-d-text-sub" />
    </div>
  </button>

  {open && (
    <div className="absolute end-0 top-full mt-2 w-64
                    bg-d-surface rounded-xl border border-d-border shadow-lg z-30 py-2">
      <div className="px-3 py-2 border-b border-d-border">
        <p className="text-[13px] font-semibold text-d-text">John Doe</p>
        <p className="text-[12px] text-d-text-sub">john@example.com</p>
      </div>
      <button className="w-full text-start px-3 py-2 text-[13px] text-d-text
                         hover:bg-d-hover-bg transition-colors">
        Profile
      </button>
      <button className="w-full text-start px-3 py-2 text-[13px] text-red-600
                         hover:bg-red-50 transition-colors">
        Sign Out
      </button>
    </div>
  )}
</div>
```

---

## 12. Toast Notifications

**File:** `src/components/toast.tsx` (standalone)

### Setup
```tsx
<ToastProvider>{children}</ToastProvider>
```

### Usage
```tsx
const { success, error, warning, info } = useToast();

success("Saved!", "Changes saved successfully");
error("Error", "Something went wrong");
warning("Warning", "This cannot be undone");
info("Info", "New update available");
```

### Toast Container
```
Position: fixed bottom-4 end-4 z-[100]
Width: w-[calc(100vw-2rem)] max-w-sm
Stack: flex flex-col gap-2
```

### Toast Item
```
Container: flex items-start gap-3 px-4 py-3 rounded-xl border shadow-lg
Animation: animate-toast-in (slide up + scale)
Auto-dismiss: 3.5 seconds
Max visible: 5
Sound: Per icon type
```

### Icon Types (18)
`check` `error` `warning` `info` `order` `product` `style` `upload` `download` `delete` `profile` `upgrade` `copy` `notification` `store` `token` `analytics` `affiliate`

---

## 13. Alerts & Banners

### Error Alert
```tsx
<div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-xl text-sm">
  Something went wrong. Please try again.
</div>
```

### Warning Alert
```tsx
<div className="bg-amber-50 border border-amber-200 text-amber-800 p-3 rounded-xl text-sm">
  Your trial expires in 3 days.
</div>
```

### Info Alert (with side stripe)
```tsx
<div className="flex items-center gap-3 rounded-xl border border-blue-200 bg-blue-50
                ps-1 pe-2 py-1">
  <div className="w-1 self-stretch rounded-full bg-blue-500 flex-shrink-0" />
  <Info className="w-5 h-5 text-blue-600 flex-shrink-0" />
  <div className="flex-1 py-1.5">
    <p className="text-[13px] font-semibold text-blue-900">Setup Required</p>
    <p className="text-[12px] text-blue-700 mt-0.5">Configure your settings to continue.</p>
  </div>
</div>
```

### Info Box (with icon)
```tsx
<div className="bg-d-surface-secondary border border-d-border rounded-xl p-5 flex gap-4 items-start">
  <div className="bg-d-border p-2 rounded-lg text-d-text shrink-0">
    <Info size={18} />
  </div>
  <div>
    <h4 className="text-d-text font-semibold text-sm">How it works</h4>
    <p className="text-d-text-sub text-sm mt-1">Explanation text here.</p>
  </div>
</div>
```

### Urgent Banner (Full-width)
```tsx
<div className={`block rounded-xl p-5 mb-6 transition-all ${
  isUrgent
    ? "bg-red-600 text-white hover:bg-red-700"
    : "bg-amber-500 text-white hover:bg-amber-600"
}`}>
  <div className="flex items-center gap-3">
    <AlertTriangle className="w-5 h-5" />
    <div>
      <p className="font-bold text-sm">Your plan expires soon!</p>
      <p className="text-xs opacity-80 mt-0.5">Renew now to keep your features.</p>
    </div>
  </div>
</div>
```

### Success Alert
```tsx
<div className="bg-green-50 border border-green-200 text-green-700 p-3 rounded-xl text-sm
                flex items-center gap-2">
  <CheckCircle className="w-4 h-4" />
  Operation completed successfully.
</div>
```

---

## 14. Search

### Search Bar
```tsx
<div className="w-full sm:max-w-[500px] px-3 sm:px-4 py-2 rounded-lg
                border border-d-input-border flex items-center gap-2">
  <Search className="w-5 h-5 text-d-text flex-shrink-0" />
  <input
    type="text"
    value={search}
    onChange={e => setSearch(e.target.value)}
    placeholder="Search..."
    className="flex-1 text-sm text-d-text placeholder-gray-400 outline-none bg-transparent"
  />
  {search && (
    <button onClick={() => setSearch("")} className="text-d-text-muted hover:text-d-text">
      <X className="w-4 h-4" />
    </button>
  )}
</div>
```

### Compact Search (in dropdowns)
```tsx
<div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-d-input-border">
  <Search className="w-4 h-4 text-d-text-sub flex-shrink-0" />
  <input
    type="text"
    className="flex-1 text-sm text-d-text placeholder-d-text-sub outline-none bg-transparent min-w-0"
    placeholder="Search..."
  />
</div>
```

---

## 15. Pagination

### Full Pagination
```tsx
<div className="flex flex-col sm:flex-row justify-between items-center gap-3 px-4 py-3
                border-t border-d-border">
  {/* Item count */}
  <div className="flex items-center gap-1 text-sm">
    <span className="text-d-text font-semibold">{startItem}</span>
    <span className="text-d-text-sub">-</span>
    <span className="text-d-text font-semibold">{endItem}</span>
    <span className="text-d-text-sub">of</span>
    <span className="text-d-text font-semibold">{total}</span>
  </div>

  {/* Page controls */}
  <div className="flex items-center gap-2">
    <StyledButton variant="outline" size="icon"
                  disabled={page === 1}
                  onClick={() => setPage(p => p - 1)}>
      <ChevronLeft className="w-4 h-4" />
    </StyledButton>

    <select
      value={page}
      onChange={e => setPage(Number(e.target.value))}
      className="ps-2 pe-1 py-1 rounded-lg border border-d-input-border
                 text-d-text text-sm outline-none cursor-pointer">
      {Array.from({ length: totalPages }, (_, i) => (
        <option key={i + 1} value={i + 1}>{i + 1}</option>
      ))}
    </select>
    <span className="text-sm text-d-text-sub">of {totalPages}</span>

    <StyledButton variant="outline" size="icon"
                  disabled={page === totalPages}
                  onClick={() => setPage(p => p + 1)}>
      <ChevronRight className="w-4 h-4" />
    </StyledButton>
  </div>
</div>
```

---

## 16. Toggle Switch

```tsx
<button
  type="button"
  onClick={() => setEnabled(!enabled)}
  className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors shrink-0 ${
    enabled ? "bg-green-500" : "bg-gray-300"
  }`}
>
  <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
    enabled ? "translate-x-[18px]" : "translate-x-[3px]"
  }`} />
</button>
```

### Toggle with Label
```tsx
<div className="flex items-center justify-between">
  <span className="text-[13px] text-d-text">Enable feature</span>
  <button className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
    enabled ? "bg-green-500" : "bg-gray-300"
  }`} onClick={() => setEnabled(!enabled)}>
    <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
      enabled ? "translate-x-[18px]" : "translate-x-[3px]"
    }`} />
  </button>
</div>
```

---

## 17. Progress Bars

### Standard Progress
```tsx
<div className="h-2 bg-d-surface-tertiary rounded-full overflow-hidden">
  <div
    className="h-full rounded-full bg-d-text transition-all"
    style={{ width: `${percent}%` }}
  />
</div>
```

### Progress with Label
```tsx
<div>
  <div className="flex justify-between text-[12px] mb-1">
    <span className="text-d-text-sub">Products</span>
    <span className="text-d-text font-medium">{used} / {max}</span>
  </div>
  <div className="h-2 bg-d-surface-tertiary rounded-full overflow-hidden">
    <div
      className="h-full rounded-full transition-all"
      style={{
        width: `${Math.min((used / max) * 100, 100)}%`,
        backgroundColor: used >= max ? "#ef4444" : "var(--d-text)",
      }}
    />
  </div>
</div>
```

### Thin Progress (in lists)
```tsx
<div className="flex-1 h-1.5 bg-d-surface-secondary rounded-full overflow-hidden">
  <div
    className="h-full rounded-full bg-d-text transition-all"
    style={{ width: `${pct}%`, opacity: 0.45 }}
  />
</div>
```

---

## 18. File Upload

### Drag & Drop Zone
```tsx
<label
  htmlFor="file-upload"
  className="flex flex-col items-center justify-center w-full h-32
             border-2 border-dashed border-d-border rounded-xl cursor-pointer
             hover:border-d-input-border hover:bg-d-hover-bg transition-all group"
>
  <div className="flex flex-col items-center justify-center">
    <div className="p-3 bg-d-surface-tertiary rounded-full mb-3
                    group-hover:bg-d-border transition-colors">
      <Upload className="w-5 h-5 text-d-text" />
    </div>
    <p className="text-sm text-d-text font-medium">Click to upload</p>
    <p className="text-xs text-d-text-muted mt-1">PNG, JPG up to 5MB</p>
  </div>
  <input id="file-upload" type="file" className="hidden" />
</label>
```

### Upload Success State
```tsx
<div className="flex flex-col items-center justify-center w-full p-4
                border-2 border-green-200 bg-green-50 rounded-xl">
  <div className="flex items-center gap-2 mb-2">
    <CheckCircle className="w-5 h-5 text-green-600" />
    <span className="text-sm font-semibold text-green-800">Uploaded successfully</span>
  </div>
  <p className="text-xs text-green-600">{fileName}</p>
</div>
```

### Upload Loading State
```tsx
<div className="flex flex-col items-center justify-center w-full h-32
                border-2 border-d-border rounded-xl bg-d-surface-secondary">
  <div className="w-8 h-8 border-4 border-d-border border-t-d-text rounded-full animate-spin mb-2" />
  <p className="text-sm font-medium text-d-text-sub">Uploading...</p>
</div>
```

### File Input (CSV style)
```tsx
<input
  type="file"
  accept=".csv"
  className="w-full text-sm text-d-text
             file:me-3 file:py-2 file:px-4 file:rounded-lg
             file:border file:border-d-input-border
             file:text-sm file:font-medium
             file:bg-d-surface-secondary file:text-d-text
             hover:file:bg-d-hover-bg file:cursor-pointer file:transition-colors"
/>
```

---

## 19. Status Indicators

### Order Status Colors
```tsx
const statusStyles = {
  PENDING:     { bg: "bg-yellow-100", text: "text-yellow-800" },
  CONFIRMED:   { bg: "bg-indigo-100", text: "text-indigo-800" },
  IN_DELIVERY: { bg: "bg-blue-100",   text: "text-blue-800" },
  DELIVERED:   { bg: "bg-green-200",  text: "text-green-700" },
  RETURNED:    { bg: "bg-red-100",    text: "text-red-700" },
};
```

### Stock Status
```tsx
<span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold ${
  stockQuantity === 0
    ? "bg-red-50 text-red-600"
    : stockQuantity <= lowStockThreshold
      ? "bg-amber-50 text-amber-600"
      : "bg-green-50 text-green-600"
}`}>
  {stockQuantity === 0 ? "Out of Stock" : stockQuantity <= lowStockThreshold ? "Low Stock" : "In Stock"}
</span>
```

### Dot Indicator
```tsx
<span
  className="w-2 h-2 rounded-full flex-shrink-0 bg-d-text"
  style={{ opacity: status === "DELIVERED" ? 0.3 : status === "PENDING" ? 1 : 0.6 }}
/>
```

### Online/Offline Indicator
```tsx
<span className="w-2.5 h-2.5 rounded-full bg-green-500 border-2 border-white" />
```

---

## 20. Empty States

### Simple Empty
```tsx
<div className="p-8 text-center text-d-text-sub text-sm">
  No results found.
</div>
```

### Empty with Icon
```tsx
<div className="text-center px-5 py-10">
  <Package className="w-6 h-6 text-d-text-muted mx-auto mb-2" />
  <p className="text-[13px] text-d-text-muted">No products yet</p>
</div>
```

### Empty with Action
```tsx
<div className="bg-d-surface rounded-xl shadow-card p-8 text-center">
  <div className="w-12 h-12 bg-d-surface-secondary rounded-full flex items-center justify-center mx-auto mb-3">
    <Plus className="w-6 h-6 text-d-text-muted" />
  </div>
  <p className="text-d-text-sub mb-4">You haven't created any products yet.</p>
  <StyledButton variant="primary" href="/dashboard/products/new">
    Create First Product
  </StyledButton>
</div>
```

---

## 21. Loading States

### Page Spinner
```tsx
<div className="flex items-center justify-center min-h-[400px]">
  <div className="w-8 h-8 border-4 border-d-border border-t-d-text rounded-full animate-spin" />
</div>
```

### Button Spinner (inside StyledButton)
```tsx
<div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
```

### Inline Spinner
```tsx
<div className="flex items-center gap-2 text-sm text-d-text-sub">
  <div className="w-4 h-4 border-2 border-d-border border-t-d-text rounded-full animate-spin" />
  Loading...
</div>
```

---

## 22. Avatars & Thumbnails

### User Avatar (Initials)
```tsx
<div className="w-8 h-8 rounded-full bg-d-surface-tertiary flex items-center justify-center">
  <span className="text-xs font-bold text-d-text">JD</span>
</div>
```

### User Avatar (Icon fallback)
```tsx
<div className="w-8 h-8 rounded-full bg-d-surface-tertiary flex items-center justify-center">
  <User className="w-4 h-4 text-d-text-sub" />
</div>
```

### Product Thumbnail
```tsx
<div className="w-12 h-12 bg-d-surface-secondary rounded-lg overflow-hidden flex-shrink-0
                flex items-center justify-center">
  {imageUrl ? (
    <img src={imageUrl} alt={title} className="w-full h-full object-cover" />
  ) : (
    <span className="text-d-text-muted text-[9px]">No img</span>
  )}
</div>
```

### Store Logo (with initial fallback)
```tsx
<div className="w-10 h-10 rounded-xl overflow-hidden flex-shrink-0">
  {logoUrl ? (
    <img src={logoUrl} alt={storeName} className="w-full h-full object-cover" />
  ) : (
    <div className="w-full h-full bg-d-surface-tertiary flex items-center justify-center">
      <span className="text-sm font-bold text-d-text">{storeName[0]}</span>
    </div>
  )}
</div>
```

---

## 23. Grid Layouts

### Stats Grid (2x2 on mobile, 4-col on desktop)
```tsx
<div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
  <StatCard />
  <StatCard />
  <StatCard />
  <StatCard />
</div>
```

### Product/Token Grid (3-col)
```tsx
<div className="grid sm:grid-cols-3 gap-4">
  <Card />
  <Card />
  <Card />
</div>
```

### Dashboard 2-Column (content + sidebar)
```tsx
<div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
  <div className="lg:col-span-3">Main content</div>
  <div className="lg:col-span-2">Sidebar</div>
</div>
```

### Main + Aside (12-col grid)
```tsx
<div className="grid lg:grid-cols-12 gap-8">
  <div className="lg:col-span-8">Main content</div>
  <div className="lg:col-span-4">Sidebar</div>
</div>
```

### 3-Column Divider (Stats strip)
```tsx
<div className="grid grid-cols-3 divide-x divide-d-border">
  <div className="px-4 py-3 text-center">
    <p className="text-[11px] text-d-text-muted">Views</p>
    <p className="text-lg font-bold text-d-text">1.2K</p>
  </div>
  <div className="px-4 py-3 text-center">...</div>
  <div className="px-4 py-3 text-center">...</div>
</div>
```

---

## 24. Sidebar Navigation

**File:** `src/components/sidebar.tsx`

### Nav Item
```tsx
<Link
  href="/dashboard"
  className={`flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] font-medium transition-colors ${
    isActive
      ? "bg-d-active-bg text-d-text"
      : "text-d-text-sub hover:bg-d-hover-bg hover:text-d-text"
  }`}
>
  <LayoutDashboard className="w-[18px] h-[18px]" />
  Dashboard
</Link>
```

### Nav Item with Badge
```tsx
<Link href="/dashboard/orders" className="flex items-center gap-3 px-3 py-2 rounded-lg ...">
  <ClipboardList className="w-[18px] h-[18px]" />
  <span className="flex-1">Orders</span>
  {unreadCount > 0 && (
    <span className="text-[11px] font-bold text-d-text-sub bg-d-surface-secondary px-2 py-0.5 rounded-md">
      {unreadCount}
    </span>
  )}
</Link>
```

### Highlighted Nav Item (Upgrade)
```tsx
<Link href="/dashboard/upgrade"
      className="flex items-center gap-3 px-3 py-2 rounded-lg text-[13px]
                 font-medium text-lime-700 bg-lime-50 hover:bg-lime-100">
  <Crown className="w-[18px] h-[18px]" />
  Upgrade to PRO
</Link>
```

---

## 25. Dashboard Header

**File:** `src/components/dashboard-header.tsx`

### Breadcrumbs
```tsx
<nav className="flex items-center gap-1.5 text-sm">
  <Link href="/dashboard" className="text-d-text-sub hover:text-d-text">Dashboard</Link>
  <ChevronRight className="w-3.5 h-3.5 text-d-text-muted" />
  <span className="text-d-text font-medium">Products</span>
</nav>
```

### Token Balance Display
```tsx
<div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg
                bg-[#303030] text-white text-[12px] font-bold">
  <Coins className="w-3.5 h-3.5 text-lime-400" />
  {balance}
</div>
```

### Notification Bell
```tsx
<button className="relative p-2 rounded-lg hover:bg-d-hover-bg">
  <Bell className="w-5 h-5 text-d-text-sub" />
  {unread > 0 && (
    <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500
                     rounded-full border-2 border-d-surface" />
  )}
</button>
```

---

## 26. Navbar

**File:** `src/components/navbar.tsx`

```tsx
<nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-d-border">
  <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
    <Link href="/" className="text-lg font-bold text-d-text">SouqMaker</Link>
    <div className="hidden sm:flex items-center gap-6">
      <Link href="/store/demo" className="text-sm text-d-text-sub hover:text-d-text">Demo</Link>
      <StyledButton variant="primary" size="sm" href="/auth/login">Login</StyledButton>
    </div>
  </div>
</nav>
```

---

## 27. PRO CTA

**File:** `src/components/pro-cta.tsx`

```tsx
<Link href="/dashboard/upgrade"
      className="relative flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4
                 rounded-xl bg-gradient-to-r from-[#2c2c2c] to-[#1a1a1a]
                 border border-white/[0.08] p-3 sm:p-3.5
                 hover:from-[#333] hover:to-[#222] transition-all group overflow-hidden">
  <div className="flex items-center gap-2.5">
    <div className="w-8 h-8 rounded-lg bg-lime-400/10 flex items-center justify-center">
      <Zap className="w-4 h-4 text-lime-400" />
    </div>
    <div>
      <p className="text-white text-[13px] font-semibold">Upgrade to PRO</p>
      <p className="text-white/50 text-[11px]">Unlock all features</p>
    </div>
  </div>
  <ChevronRight className="w-4 h-4 text-white/40 ms-auto" />
</Link>
```

---

## 28. Hooks

| Hook | File | Returns |
|------|------|---------|
| `useEffectivePlan()` | `use-effective-plan.ts` | `{ effectivePlan, remainingDays, isExpired, isExpiringSoon }` |
| `useTokenBalance()` | `use-token-balance.ts` | `{ balance, transactions, loading, refresh }` |
| `useAdFreeStatus()` | `use-ad-free-status.ts` | `{ showAds, adFreeUntil, loading, refresh }` |
| `useTranslation()` | `language-provider.tsx` | `{ t, locale, setLocale, dir }` |
| `useToast()` | `toast.tsx` | `{ success, error, warning, info, toast }` |
| `useStoreContext()` | `store-context.tsx` | `{ activeStore, loading, refreshStores }` |

---

## 29. i18n System

### Structure
```
src/i18n/index.ts  - Types + helpers
src/i18n/fr.ts     - French (flat key-value)
src/i18n/ar.ts     - Arabic (flat key-value)
```

### Key Format
```
"common.save"       -> "Enregistrer"
"auth.login.title"  -> "Connexion"
"sidebar.dashboard" -> "Tableau de bord"
```

### Usage
```tsx
const { t, dir } = useTranslation();
return <div dir={dir}><button>{t("common.save")}</button></div>;
```

---

## 30. Dark Mode

Toggle via `.pro-dark` class on root. All `--d-*` variables auto-switch.

```tsx
<div className="bg-d-surface text-d-text">Auto dark mode</div>
<div className="block pro-dark:hidden">Light only</div>
<div className="hidden pro-dark:block">Dark only</div>
```

---

## 31. RTL Support

Set via `<html dir="rtl">`. Use logical properties:
```tsx
<div className="ms-4 ps-4 text-start">Auto-mirrors in RTL</div>
```

---

## 32. Animations

```css
@keyframes toast-in {
  from { opacity: 0; transform: translateY(12px) scale(0.96); }
  to   { opacity: 1; transform: translateY(0) scale(1); }
}

@keyframes tab-fade-in {
  from { opacity: 0; transform: translateY(8px); }
  to   { opacity: 1; transform: translateY(0); }
}

@keyframes subtle-bounce {
  0%, 100% { transform: translateY(0); }
  50%      { transform: translateY(-2px); }
}
```

---

## 33. Files to Copy

### Core (Required for any app)
```
src/app/globals.css                  - All CSS tokens + animations
src/components/styled-button.tsx     - Button component (5 variants)
src/components/toast.tsx             - Toast notification system
src/components/language-provider.tsx  - i18n context
src/components/language-switcher.tsx  - Language toggle
src/i18n/index.ts                    - i18n types
src/i18n/fr.ts                       - French dict
src/i18n/ar.ts                       - Arabic dict
```

### Dashboard Layout
```
src/components/authenticated-layout.tsx
src/components/sidebar.tsx
src/components/dashboard-header.tsx
src/components/navbar.tsx
src/components/pro-cta.tsx
```

### Provider Setup (layout.tsx)
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

## 34. Reuse Approaches

| Approach | Best For | Effort |
|----------|----------|--------|
| **A. Copy & Customize** | 1-3 apps | Low — copy files, change `--brand` color |
| **B. npm Package** | 3+ apps | Medium — publish `@souqmaker/ui` |
| **C. Monorepo** (Turborepo) | App suite | High — shared packages |
| **D. Template Repo** | Quick start | Low — `gh repo create --template` |
