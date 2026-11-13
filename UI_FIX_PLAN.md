# MealMess — Audit Review & UI Fix Plan

**Reviewed:** `UI_AUDIT_REPORT.md` against the actual source in `src/`  
**Date:** 11 November 2026  
**Status:** Plan only — no source changes made

---

## Bottom line

The audit is accurate about *intent and structure* (role separation, two expense pipelines, matrix vs single-day views, print/PDF export all exist), but it is written as an appraisal, not an audit. Several of its "verified" claims are measurably false, and the real defects it should have caught — modal keyboard/screen-reader behavior, mobile overflow, sub-44px touch targets, a plaintext master key in the client bundle — are absent from it.

So the fix plan below is not "implement the audit's recommendations" (it makes none). It is **fix what the audit missed, and correct the report so it can be trusted as a baseline**.

What I actually ran:
- Full source read of `App.tsx`, `Navbar`, `BottomNav`, `AppContext`, all screens.
- WCAG contrast math on the real palette (script output quoted below).
- Pattern counts across `src/` (`role="dialog"`, `aria-modal`, `Escape`, `tabular-nums`, `max-h`, `viewport-fit`).
- **Not run:** `tsc`/build/browser. There is no `node_modules` in the checkout and I did not install it for a review. Treat "build passes" as unverified until someone runs `npm install && npm run lint`.

---

## 1. Audit claims vs. reality

| Audit claim | Reality | Evidence |
| :--- | :--- | :--- |
| Primary CTA white-on-teal is **4.7:1, Pass AA** | **3.49:1 — fails AA** for normal text. This is the fill under every primary button. | `#FFFFFF` on `#659287` |
| Due-balance text **4.9:1, Pass AA** | **4.41:1 — fails AA** (marginal). Fine only at large/bold sizes. | `#DC2626` on `#FEF2F2` |
| "All color pairings exceed 4.5:1" | Bottom-nav inactive labels are **2.54:1**; `#659287` used as 10–11px *text* on white is **3.49:1**; `gray-500` on canvas is **4.17:1**. | `BottomNav.tsx:104`, `DashboardScreen.tsx:293,311` |
| "All monetary sums use `font-mono` / `tabular-nums`" | `tabular-nums` appears **0 times in `src/`** (only in the audit). Dashboard KPIs have neither. | `grep -c tabular-nums src/**` |
| "4-Column Primary Metric Strip" | **6 cards**, `grid-cols-2 md:grid-cols-3 lg:grid-cols-6`. | `DashboardScreen.tsx:239` |
| "Matrix displays all 31 days at 1440px without horizontal scroll" | Needs ~1636px (176 + 31×44 + 96) inside a 1400px container — **always scrolls** at 1440. | `DailyMealsScreen.tsx:373–390` |
| "Touch targets remain ≥40px" | Back button **32px**, sync button **~28px**, calculator trigger **36px**, matrix cells **36px tall**, bottom-nav icons **~28px**. | `Navbar.tsx:141`, `Navbar.tsx:~410`, `CalculatorWidget.tsx:172`, `DailyMealsScreen.tsx:~452` |
| "Every modal has an explicit close (X)" | Delete-confirmation modals have no X. | `MembersScreen.tsx:469`, `ExpensesScreen.tsx:770,1007`, `SettingsScreen.tsx:1263,1303` |
| "Safe-area insets prevent nav being obscured" | `env(safe-area-inset-bottom)` is **0 on iOS** because the viewport meta lacks `viewport-fit=cover`. | `index.html:5` vs `BottomNav.tsx:78` |
| "Avoids header wrap or overflow at 320px" | Left group (~210px) + right group (~134px) of `shrink-0` children ≈ 344px in a 320px bar; `body { overflow-x: hidden }` silently clips it. | `Navbar.tsx:123–125`, `index.css:22–24` |
| "Master Key is a security boundary" | The master key **`ASmin1234` is hardcoded in the client bundle** as a fallback, and unlocking grants full master authority for the whole page session. | `AppContext.tsx:685` |

Everything else the report describes (sticky columns, two expense sections, print CSS, jsPDF, role gating of inputs, delete confirmations, locked-month banner) does exist roughly as described.

### Contrast reference (measured)

```
white on #659287          3.49   ← primary buttons, active nav pills
white on #88BDA4          2.13
#659287 on white          3.49   ← accent text at 10–11px
gray-400 on white         2.54   ← bottom nav inactive labels
gray-500 on #E6F2DD       4.17
red-600 on red-50         4.41
emerald-700 on emerald-50 5.21
#456C63 on white          5.87   ← already in the codebase; contrast-safe teal
#4F7A6F on white          4.83
#B91C1C on red-50         5.91
```

---

## 2. Findings

### P0 — Security (not UI, but the audit's role claims depend on it)

**F1. Plaintext master key in shipped JS, and the unlock is unscoped.**
`verifyMasterKey` accepts the literal `'ASmin1234'` before touching the hash (`AppContext.tsx:685`). `masterUnlockedSession` (`:681`) then makes `isMasterKey` true for *any* logged-in account (`:708–719`) with no expiry, no re-check, and no audit entry — enabling user deletion and factory reset.

Fix: delete the hardcoded branch; compare only against the hashed master credential. Scope the unlock (e.g. 15-minute idle expiry, cleared on logout/month change), require the key again for destructive actions, and write an `auditLogs` entry on unlock/failure. Long term: enforce this in `firestore.rules` — a client-side gate is not a security boundary.

### P1 — Broken on real devices

**F2. Modals are not keyboard- or screen-reader-operable, and several cannot fit on a phone.**
Across 10 modal sites: `role="dialog"` 0, `aria-modal` 0, `Escape` handler 0, focus trap 0, focus restore 0, body scroll lock 0. Only `MyProfileModal` has `max-h` + internal scroll (`MyProfileModal.tsx:103`); the Universal Expense modal (`ExpensesScreen.tsx:810–812`, ~700px tall) overflows a 667px viewport top **and** bottom with its Cancel/Save buttons off-screen and no way to reach them.

Fix: one shared `Modal` component, built on native `<dialog>` + `showModal()` so Esc, focus containment and background inertness come for free; add `max-h-[92dvh] overflow-y-auto`, a visible close button, `aria-labelledby`, and focus return. Migrate all 10 sites.

**F3. Contrast failures in the core action color.**
See table above. Fix by splitting the token's roles rather than redesigning: keep `#659287` for decorative fills/borders, and use `#456C63` (already in use, 5.87:1) for button fills, active pills, and teal text; `#B91C1C` for due amounts; `gray-600` instead of `gray-400`/`gray-500` for labels. Update `--color-brand-primary` in `index.css:6` or add `--color-brand-action: #456C63`.

**F4. Financial figures are silently truncated.**
`truncate` sits directly on the currency element in Dashboard cards 3–5 and in the Reports KPI strip (`DashboardScreen.tsx:298,319,340`; `ReportsScreen.tsx:278,285,292`). At 320px a five-figure amount loses trailing digits with no ellipsis cue at the digit level — an accounting app must never hide a digit.

Fix: remove `truncate`; use `text-base sm:text-xl` with `tabular-nums`, `break-words`, and a compact format for narrow widths if needed.

**F5. Tables squash instead of scrolling on mobile.**
`overflow-x-auto` wrappers exist, but every table is `w-full` with no `min-w` and uses `px-6` cells (Members: 5 columns = 240px of padding alone). The browser shrinks columns and wraps numbers rather than overflowing, so the scroll container never engages. Affects `MembersScreen.tsx:164–171`, `DashboardScreen.tsx:424–427`, `ExpensesScreen.tsx:349,505`, `SettingsScreen.tsx:838,1394`.

Fix: add per-table `min-w-[720px]` (or the measured needed width), reduce mobile padding to `px-3 sm:px-6`, and add a mobile card layout for Members + settlement (the two tables people read on phones).

**F6. Header overflow at ≤360px.**
Back + brand + month + sync + avatar + "Logout" with `shrink-0` on both groups exceeds 320px; clipping is masked by `overflow-x: hidden`. Fix: icon-only logout below `sm`, month label only from `md`, allow the left group to shrink (`min-w-0`, `truncate` on brand), and verify at 320px with `document.documentElement.scrollWidth === clientWidth`.

**F7. Safe-area insets are inert.**
Add `viewport-fit=cover` to `index.html:5`. Without it, `BottomNav`'s `env(safe-area-inset-bottom)` is 0 and tab labels sit under the iOS home indicator.

### P2 — Accessibility & input correctness

**F8. Form labels are not associated with inputs.** `<label>` without `htmlFor` and inputs without `id` in Members, Expenses, Settings, MyProfile. `LoginScreen` is the only screen doing it correctly. Fix: `htmlFor`/`id` pairs (or wrap the input inside the label).

**F9. Clickable non-buttons.** Dashboard KPI cards are `<div onClick>` (`DashboardScreen.tsx:242,263,285,306,327`) — not focusable, no Enter/Space, no role. Navbar brand is a `div` too. Fix: `<button type="button">` or add `role="button" tabIndex={0}` + key handler.

**F10. Icon-only buttons have no accessible name.** Modal close `X` buttons and meal-matrix cell buttons rely on `title` only. Add `aria-label` (matrix cells should announce "Rahim, day 4, 2 meals, editable").

**F11. No reduced-motion support.** `animate-in`, `animate-pulse`, `animate-spin` are used throughout with no `@media (prefers-reduced-motion: reduce)` guard. Add one rule in `index.css`.

**F12. Side effect inside a state updater.** `navigate()` calls `history.pushState` inside `setCurrentScreen(prev => …)` (`App.tsx:44–60`); React StrictMode double-invokes updaters in development, which can duplicate history entries and make Back require two presses. Compute the decision first, then push outside the updater.

### P3 — Cleanup / accuracy

- **F13.** Fix the audit report itself (numbers in §6.3, card count in §3.2, "31 days fit", touch targets, `tabular-nums`, "every modal has X"). Keep the corrected contrast table as the regression baseline.
- **F14.** `JetBrains Mono` is downloaded (`index.html:16`) but never applied: `@theme` doesn't map `--font-mono`. Either map it or drop the request (it's a render-blocking font load).
- **F15.** `html, body { max-width: 100vw }` (`index.css:23`) forces horizontal overflow on desktop when a vertical scrollbar is present and interferes with sticky/horizontal scroll containers. Use `width: 100%` and drop `max-width: 100vw`.
- **F16.** Ten hand-rolled modal shells and duplicated field markup; `AppContext.tsx` is 2148 lines. Extract `Modal`, `Field`, `DataTable` primitives *while* doing F2/F8 — not as a separate refactor.

---

## 3. Fix plan

Ordered so each phase is independently shippable and testable. No new dependencies required.

### Phase 1 — Security gate (P0)
1. Remove the `'ASmin1234'` fallback in `verifyMasterKey`.
2. Give `masterUnlockedSession` a TTL (idle timestamp + interval), clear on logout, and re-prompt for destructive actions.
3. Log unlock success/failure to `auditLogs`.

**Accept:** wrong key rejected; correct master password still unlocks; reload logs out of master mode; unlock attempt appears in audit log. Note in the report that server-side rules are still required.

### Phase 2 — Shared modal (F2, F8, F10, F11)
1. Add `src/components/Modal.tsx`: native `<dialog>` + `showModal()`, `::backdrop` styling, `aria-labelledby`, close button with `aria-label`, `max-h-[92dvh] overflow-y-auto`, `p-0`-safe mobile padding, reduced-motion-friendly animation.
2. Migrate all 10 sites: `MembersScreen` ×3, `ExpensesScreen` ×4, `DashboardScreen` ×1, `DailyMealsScreen` ×2, `SettingsScreen` ×2, `MyProfileModal`.
3. Add `htmlFor`/`id` pairs to every field touched; add `inputMode="decimal"` on amount inputs.
4. Add the `prefers-reduced-motion` rule in `index.css`.

**Accept:** Esc closes every dialog; Tab stays inside; focus returns to the trigger; background does not scroll; Universal Expense modal's actions reachable at 375×667 and 320×568; axe reports no serious/critical dialog or label violations.

### Phase 3 — Color & typography correction (F3, F4, F14)
1. Add `--color-brand-action: #456C63`; switch primary button/pill/active-nav fills and all teal-on-white *text* to it. Keep `#659287` for borders, icon tiles, and decorative fills.
2. Switch due-amount text/badges to `#B91C1C`; metadata labels from `gray-400/500` to `gray-600` on white and `gray-700` on canvas.
3. Remove `truncate` from all currency elements; add `tabular-nums` to every numeric display (KPI values, table money columns, balances, rate).
4. Map `--font-mono` to JetBrains Mono (or remove the font link).

**Accept:** measured contrast ≥ 4.5:1 for all body text and button labels; amounts render in full at 320px; digits don't shift during recalculation.

### Phase 4 — Mobile layout hardening (F5, F6, F7)
1. `index.html`: `viewport-fit=cover`.
2. Navbar: icon-only logout `<sm`, month label from `md`, shrinkable left group.
3. Tables: `min-w` per table + `px-3 sm:px-6` cells; card layout for Members and settlement below `md`.
4. Bump interactive targets to ≥44px on touch (`sm:`-scoped so desktop density is preserved): back, sync, calculator trigger, matrix cells, bottom-nav items.
5. Drop `max-width: 100vw` from `html, body`.

**Accept:** at 320, 375, 768, 1024, 1440: no page-level horizontal scroll, no control clipped, no digit hidden, all primary actions ≥44px.

### Phase 5 — Keyboard & semantics (F9, F10, F12)
1. Convert KPI cards and navbar brand to real buttons with visible focus rings.
2. `aria-label` on every icon-only control; `aria-pressed`/`aria-current` on nav and tab toggles.
3. Move `history.pushState` out of the state updater.

**Accept:** full keyboard pass of Dashboard → Meals → Expenses → Reports → Settings; Back behaves once per press.

### Phase 6 — Report correction (F13, F15, F16)
1. Replace §6.3 with the measured table and mark it as the regression baseline.
2. Correct §3.2 (six cards), §5.3 (scroll at 1440), §4.4 (no X on destructive modals), §5.1 (touch targets).
3. Record the fixes made and the remaining known gaps (no server-side authorization; no automated a11y tests).

---

## 4. Verification checklist

- `npm install && npm run lint` (script is `tsc --noEmit`) — currently unverifiable, no `node_modules`.
- Contrast: re-run the measurement script against final tokens; require ≥4.5:1.
- Keyboard-only pass: Tab/Shift-Tab/Enter/Space/Esc through every screen and modal; focus visible at all times.
- Viewports: 320×568, 375×667, 768×1024, 1440×900. Assert `document.documentElement.scrollWidth === document.documentElement.clientWidth`.
- Screen reader spot-check on Login, Member add, Expense add, Meal cell edit.
- axe DevTools: no critical/serious issues on all 7 screens.
- Print preview of Reports at A4 (wide settlement table currently has no print-specific min-width — verify it isn't clipped).

---

## 5. Deliberately out of scope

- Redesign or new features.
- Migrating state off `AppContext` into smaller stores (F16 covers only the extraction needed by F2/F8).
- Firestore rules hardening, password hashing changes, and dependency upgrades — these are correctness/security work outside a UI audit, though F1 is listed because the audit's role-separation claims are otherwise misleading.
