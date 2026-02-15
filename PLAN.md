# Plan: Single Store Per Account + Onboarding Wizard

## Summary
Remove multi-store concept. Each account = one store. New users go through an onboarding wizard (name → logo → theme) before accessing the dashboard. Store settings merge into the Profile page.

---

## Phase 1: Onboarding Wizard
**New file: `src/app/onboarding/page.tsx`**
- Reuse the 3-step wizard UI from the existing `stores/new/page.tsx`
- Steps: Store Name + Language → Logo Upload → Theme Colors
- On completion: creates the store via `POST /api/stores`, then redirects to `/dashboard`
- Minimal layout (no sidebar/header) — clean fullscreen wizard
- Protected: redirect to `/dashboard` if user already has a store

## Phase 2: Dashboard Gate (Redirect to Onboarding)
**Modify: `src/components/authenticated-layout.tsx`**
- After session loads, check if user has a store (from store context)
- If no store exists → redirect to `/onboarding`
- This blocks ALL dashboard pages until onboarding is complete

## Phase 3: Simplify Store Context
**Modify: `src/lib/store-context.tsx`**
- Remove `stores` array, `setActiveStore`, store selection logic
- New shape: `{ store, loading, refreshStore }` — always the user's single store
- Remove localStorage `activeStoreId` persistence (no selection needed)
- Auto-set the single store as the active store

## Phase 4: Remove Multi-Store UI from Sidebar
**Modify: `src/components/sidebar.tsx`**
- Remove "Stores" nav item entirely
- Remove the store selector/indicator at the top
- Show store logo + name as a static display (not clickable selector)
- Remove store-related icon/link

## Phase 5: Remove Store References from Dashboard Header
**Modify: `src/components/dashboard-header.tsx`**
- Remove "My Stores" link from profile dropdown
- Remove store selector from any dropdown menus
- Keep store name display in breadcrumb header (read-only)

## Phase 6: Simplify Dashboard Home
**Modify: `src/app/dashboard/page.tsx`**
- Remove "Stores" stat card entirely
- Keep Products and Orders stat cards
- Remove activeStore filtering (everything belongs to the one store)
- Remove "stores used" progress indicator

## Phase 7: Simplify Products Pages
**Modify: `src/app/dashboard/products/page.tsx`**
- Remove store filter dropdown from toolbar
- Remove `filterStore` state and store name extraction
- Remove `activeStore` filtering from the `filtered` useMemo

**Modify: `src/app/dashboard/products/new/page.tsx`**
- Remove store selector dropdown
- Auto-assign to user's single store (fetch it silently, no UI)
- Remove stores fetch + storeId state → replace with single auto-fetched store

**Modify: `src/app/dashboard/products/[id]/edit/page.tsx`**
- Remove store selector dropdown
- Keep storeId from loaded product (read-only, not changeable)

## Phase 8: Simplify Orders Page
**Modify: `src/app/dashboard/orders/page.tsx`**
- Remove `activeStore` filtering from the `filtered` useMemo
- Show all orders directly (they all belong to one store)

## Phase 9: Simplify Analytics
**Modify: `src/app/dashboard/analytics/page.tsx`**
- Remove store selector dropdown (if any)
- Always show analytics for the user's single store

## Phase 10: Merge Store Settings into Profile
**Modify: `src/app/dashboard/profile/page.tsx`**
- Add a "Store Settings" section below account settings
- Fields: Store name, Logo (upload/change/remove), Theme colors, Language
- Reuse theme color picker and logo upload UI from the old store creation wizard
- Save via `PUT /api/stores/[id]`
- Update the store API to also support language updates

## Phase 11: Update Plan Limits & Upgrade Page
**Modify: `src/lib/auth-helpers.ts`**
- Remove `maxStores` from `PLAN_LIMITS` (keep `maxProducts` only)
- Remove `getStoreCount()` helper
- Remove `PRO_EXTRA_STORE_COST`

**Modify: `src/app/dashboard/upgrade/page.tsx`**
- Remove "1 store" / "5 stores" from FREE/PRO feature lists
- Keep product limit differences (5 vs 100)

**Modify: `src/app/api/stores/route.ts`**
- POST: Remove store count limit check — but add check that user has 0 stores (only allow 1)
- GET: Return single store (or empty)

## Phase 12: Remove/Delete Old Files
- Delete `src/app/dashboard/stores/page.tsx` (stores list page)
- Delete `src/app/dashboard/stores/new/page.tsx` (replaced by onboarding)
- Delete `src/lib/use-require-store.ts` (no longer needed)
- Clean up unused store-related imports across files

## Phase 13: Update Translations (ar.ts + fr.ts)
- Add `onboarding.*` keys (wizard steps, welcome text)
- Remove `stores.*` keys related to multi-store (list, select, limit messages)
- Update `sidebar.*` keys (remove store selector text)
- Add `profile.storeName`, `profile.storeLogo`, `profile.storeTheme`, etc.

## Phase 14: Update Admin Page
**Modify: `src/app/admin/page.tsx`**
- Minor: users table may reference store count — simplify if needed

## Phase 15: Public Pages (No Changes)
- `/store/[slug]` and `/product/[slug]` pages remain unchanged
- They work by slug lookup, independent of multi/single store concept

---

## Files Affected (Summary)
| Action | File |
|--------|------|
| **NEW** | `src/app/onboarding/page.tsx` |
| **MODIFY** | `src/components/authenticated-layout.tsx` |
| **MODIFY** | `src/lib/store-context.tsx` |
| **MODIFY** | `src/components/sidebar.tsx` |
| **MODIFY** | `src/components/dashboard-header.tsx` |
| **MODIFY** | `src/app/dashboard/page.tsx` |
| **MODIFY** | `src/app/dashboard/products/page.tsx` |
| **MODIFY** | `src/app/dashboard/products/new/page.tsx` |
| **MODIFY** | `src/app/dashboard/products/[id]/edit/page.tsx` |
| **MODIFY** | `src/app/dashboard/orders/page.tsx` |
| **MODIFY** | `src/app/dashboard/analytics/page.tsx` |
| **MODIFY** | `src/app/dashboard/profile/page.tsx` |
| **MODIFY** | `src/app/dashboard/upgrade/page.tsx` |
| **MODIFY** | `src/lib/auth-helpers.ts` |
| **MODIFY** | `src/app/api/stores/route.ts` |
| **MODIFY** | `src/app/api/stores/[id]/route.ts` |
| **MODIFY** | `src/app/api/products/route.ts` |
| **MODIFY** | `src/i18n/ar.ts` |
| **MODIFY** | `src/i18n/fr.ts` |
| **DELETE** | `src/app/dashboard/stores/page.tsx` |
| **DELETE** | `src/app/dashboard/stores/new/page.tsx` |
| **DELETE** | `src/lib/use-require-store.ts` |

## Execution Order
Phases 1-3 first (onboarding + gate + context), then 4-9 (remove multi-store UI), then 10-14 (settings + cleanup).
