# UI/UX Comprehensive Audit & Architecture Report: MealMess

**Application:** MealMess (Smart Mess Meal & Financial Accounting Manager)  
**Evaluation Date:** November 2026  
**Scope:** Complete frontend interface, design component systems, responsive mechanics, and user experience flows across mobile, tablet, and desktop viewports.  
**Audit Purpose:** Comprehensive, observational evaluation of current UI patterns, spatial ergonomics, layout integrity, and accessibility compliance without modifying source code.  
**Revision (13 Nov 2026):** Corrected false claims from the first pass, recorded the implemented fixes, and replaced §6.3 with a measured baseline. See §7.

---

## Table of Contents
1. [Executive Summary & High-Level System Overview](#1-executive-summary--high-level-system-overview)
2. [Visual Identity, Theme & Design Tokens](#2-visual-identity-theme--design-tokens)
3. [Screen-by-Screen UI/UX Analysis](#3-screen-by-screen-uiux-analysis)
   - 3.1 [Authentication & Access Gate (`LoginScreen`, `MasterKeyGate`)](#31-authentication--access-gate)
   - 3.2 [Executive Overview Dashboard (`DashboardScreen`)](#32-executive-overview-dashboard)
   - 3.3 [Members Directory & Financial Ledger (`MembersScreen`)](#33-members-directory--financial-ledger)
   - 3.4 [Daily Meal Sheet & Matrix Grid (`DailyMealsScreen`)](#34-daily-meal-sheet--matrix-grid)
   - 3.5 [Expenses Hub: Section A & Section B (`ExpensesScreen`)](#35-expenses-hub)
   - 3.6 [Financial Reports & Final Settlement (`ReportsScreen`)](#36-financial-reports--final-settlement)
   - 3.7 [System Administration & User Management (`SettingsScreen`)](#37-system-administration--user-management)
4. [Shared Component Systems & Structural Breakdown](#4-shared-component-systems--structural-breakdown)
   - 4.1 [Navigation Systems (Desktop Navbar & Mobile BottomNav)](#41-navigation-systems)
   - 4.2 [Cards, Surfaces & Elevation Hierarchy](#42-cards-surfaces--elevation-hierarchy)
   - 4.3 [Data Tables & Matrix Grids](#43-data-tables--matrix-grids)
   - 4.4 [Modal Dialogs & Confirmation Safeguards](#44-modal-dialogs--confirmation-safeguards)
   - 4.5 [Global Utility Widgets (`CalculatorWidget`)](#45-global-utility-widgets)
5. [Multi-Device Layout & Responsive Ergonomics](#5-multi-device-layout--responsive-ergonomics)
   - 5.1 [Small/Mobile Viewports (320px – 480px)](#51-smallmobile-viewports-320px--480px)
   - 5.2 [Tablet & Medium Viewports (768px – 1024px)](#52-tablet--medium-viewports-768px--1024px)
   - 5.3 [Desktop & Ultra-Wide Viewports (1440px – 1600px+)](#53-desktop--ultra-wide-viewports-1440px--1600px)
6. [Design Evaluation: Typography, Color Math & Accessibility](#6-design-evaluation-typography-color-math--accessibility)
   - 6.1 [Typographic Hierarchy & Tabular Numerals](#61-typographic-hierarchy--tabular-numerals)
   - 6.2 [Color Distribution (60-30-10 Rule) & State Signaling](#62-color-distribution-60-30-10-rule--state-signaling)
   - 6.3 [Accessibility & WCAG Contrast Review](#63-accessibility--wcag-contrast-review)
   - 6.4 [Cognitive Ergonomics & Multi-Role Permissions](#64-cognitive-ergonomics--multi-role-permissions)
7. [Fixes Applied & Remaining Gaps](#7-fixes-applied--remaining-gaps)
8. [Conclusion](#8-conclusion)

---

## 1. Executive Summary & High-Level System Overview

MealMess is a specialized financial ledger and meal management single-page web application (SPA) tailored for shared student/bachelor accommodations ("messes") in South Asia. The application reconciles two interrelated financial pipelines:
1. **The Daily Meal Calculation Pipeline**: Tracks daily meal consumption per member (1st through 31st of each month), dividing total shared grocery purchases (Bazaar Expenses) by the total meal count to dynamically compute the monthly **Meal Rate** ($\text{Rate} = \frac{\text{Total Grocery Cost}}{\text{Total Meals}}$).
2. **The Universal Expense Pipeline**: Manages fixed utility expenditures (WiFi, cook/maid salary, gas cylinder refills, apartment rent) that bypass the meal rate and are split equally among selected occupants.
3. **The Member Balance Ledger**: Calculates net financial positions ($\text{Deposits} + \text{Expenses Paid Out-of-Pocket} - \text{Meal Costs} - \text{Universal Shared Deductions}$), highlighting positive balances (refunds due) versus negative balances (dues owed).

### Layout Shell Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          GLOBAL VIEWPORT (min-h-screen)                     │
│  Top Navbar (Sticky h-16, backdrop-blur-md, max-w-7xl/1600px)              │
│  [Back] [Brand Wordmark] ── [Month Select] ── [Expenses Drop] [Sync] [User] │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Main Content Viewport (px-3 sm:px-6 lg:px-8 xl:px-12, pt-6, pb-28 lg:pb-10) │
│                                                                             │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │ SCREEN CONTAINER                                                      │  │
│  │ Header Row: Title, Subtitle, Contextual Action Buttons                │  │
│  │ Metric Row / Filter Tabs: High-contrast summary blocks                │  │
│  │ Main Data Surface: White border-rounded container with tables/forms   │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
├─────────────────────────────────────────────────────────────────────────────┤
│  [Mobile Only] Fixed Bottom Navigation Bar (lg:hidden, h-14, pb-safe)       │
│  [ Home ]    [ Meals ]    [ Members ]    [ Expenses ]    [ Reports ]        │
├─────────────────────────────────────────────────────────────────────────────┤
│  [Global Floating Utility] Calculator Trigger Button (bottom-20 / bottom-6) │
└─────────────────────────────────────────────────────────────────────────────┘
```

The application employs a role-segregated UI with three distinct access postures:
- **Master Key (`sabbirprogrammer`)**: Super-administrator with unrestricted authority to create/lock months, provision user accounts, delete users, and modify all records.
- **Manager (`manager`)**: Operational admin who logs meals, records bazaar expenses, inputs deposits, and adjusts member details.
- **Normal Member (`role: 'member'`)**: Self-service user restricted to viewing their own balance, logging/editing only their own daily meals, and submitting expenses locked strictly under their own identity.

---

## 2. Visual Identity, Theme & Design Tokens

### Color Palette Strategy
MealMess avoids the ubiquitous "AI slop" purple gradient aesthetic by adopting an organic, botanical palette dominated by sage, eucalyptus, and deep forest tones. The color variables are defined in `@theme` within `src/index.css`:

| Token Name | Hex Code | Visual Role | Perceived Tone |
| :--- | :--- | :--- | :--- |
| `--color-brand-bg` | `#E6F2DD` | 60% Dominant Canvas | Soft sage green canvas; reduces visual fatigue during data entry. |
| `--color-brand-card` | `#FFFFFF` | 30% Structural Surfaces | Crisp white card and table containers providing high visual separation. |
| `--color-brand-action` | `#456C63` | 10% Action Accent | Contrast-safe deep teal for primary CTA fills, active tabs/pills, and teal-on-white text (5.87:1 with white). |
| `--color-brand-primary`| `#659287` | Decorative Accent | Eucalyptus teal reserved for icon tiles, borders, and decorative fills — not for text or button labels. |
| `--color-brand-secondary`| `#88BDA4` | Supporting Midtone | Seafoam mint green for scrollbar thumbs and border highlights. |
| `--color-brand-highlight`| `#B1D3B9` | Structural Borders | Light pastel sage for hairline card borders and table headers. |
| `--color-brand-dark` | `#1A332C` | Typographic Contrast | Deep forest emerald-black for primary headlines, numerals, and labels. |

The palette splits the original teal into two roles. `#659287` (3.49:1 against white) is decorative-only; `#456C63` (5.87:1) carries every label-bearing fill and teal text run.

### Semantic Color Coding
Financial applications require instant, unambiguous cognitive signaling. MealMess employs standardized chromatic semantics across all cards and tables:
- **Positive Balance / Due to Receive**: Emerald Green (`text-emerald-700`, `bg-emerald-50`, `border-emerald-200`) indicating that the member has deposited more than consumed and is owed money at month-end.
- **Negative Balance / Due to Pay**: Deep Crimson (`text-[#B91C1C]`, `bg-red-50`, `border-red-200`, 5.91:1) indicating an outstanding debt that must be settled. Plain `text-red-600` on `red-50` (4.41:1) is no longer used for due amounts.
- **Deposit Deductions / Balance Adjustments**: Amber / Gold (`text-amber-700`, `bg-amber-100`, `border-amber-200`) used for negative market adjustments.
- **Status Warnings & Locks**: Amber (`bg-amber-100 text-amber-800`) for month-locked indicators and critical confirmation warnings.

---

## 3. Screen-by-Screen UI/UX Analysis

### 3.1 Authentication & Access Gate

#### `LoginScreen.tsx`
- **Component Role**: First user touchpoint; handles credentials-based authentication with remember-me state persistence in `localStorage`.
- **Visual Composition**:
  - Centered single-card elevation (`max-w-sm sm:max-w-md`) with 24px (`rounded-3xl`) boundary.
  - Brand header with 56px eucalyptus icon tile (`bg-[#659287]`) housing the `UtensilsCrossed` glyph.
  - Form fields use 44px touch targets (`py-2.5 px-3.5`) with subtle sage focus rings (`focus:ring-[#88BDA4]/40`).
  - Interactive password toggle eye icon (`Eye` / `EyeOff`) positioned with absolute right alignment (`right-3`).
- **Interactive Feedback**:
  - Live animated error banner (`animate-in fade-in`) featuring crimson alert styling when authentication fails.
  - Loading spinner / disabled state on primary submit button (`"Signing in..."`) to prevent duplicate submissions.

#### `MasterKeyGate.tsx`
- **Component Role**: Security challenge boundary protecting high-privilege configuration zones (such as Settings) when accessed by non-Master Key sessions.
- **Visual Composition**:
  - Centered inline challenge card (`max-w-md`) with an amber/gold security shield badge (`KeyRound`).
  - Clear dual-action CTA footer: `"Back to Dashboard"` (cancels the challenge) and `"Unlock Settings"` (verifies the master credential).
  - The visibility toggle is a 44px target with an explicit `aria-label` (`Show master key` / `Hide master key`).
  - Unlock attempts are written to `auditLogs` as `Master Key Accepted` or `Master Key Rejected`; a successful elevation expires after 15 minutes of inactivity.

---

### 3.2 Executive Overview Dashboard (`DashboardScreen.tsx`)

#### Information Architecture
The Dashboard serves as the central command cockpit. It organizes information into four vertical tiers:
1. **Header & Context Switcher**: Page title paired with a quick-select month dropdown (`<select id="dashboard-month-select">`).
2. **Six-Card Primary Metric Strip** (`grid-cols-2 md:grid-cols-3 lg:grid-cols-6`):
   - *Members*: Active roster count; links to the Members screen.
   - *Total Meals*: Total meal volume with 1-decimal precision; links to Daily Meals.
   - *Bazaar Cost*: Grocery spend with Bengali Taka symbol (৳); links to Bazaar Expenses.
   - *Universal Expenses*: Fixed utility spend; links to Universal Expenses.
   - *Total Deposits*: Collective funds paid into the mess manager's account.
   - *Meal Rate*: Derived or fixed rate, with an `Auto` / `Fixed` badge. This card is informational, not a link.
3. **Quick Action Bar**:
   - Icon-driven shortcut buttons allowing managers to launch expense modals, record deposits, or jump directly to daily meal entry without navigating sub-menus.
4. **Member Settlement Master Table**:
   - Comprehensive ledger listing every member, their total meals, deposited capital, bazaar expenses paid, universal expenses paid, net meal cost, universal deduction share, and final balance.
   - Clickable row / `"View Details"` action button opening a member breakdown modal that itemizes every individual deposit and receipt.

#### Design Strengths
- **Instant Financial Clarity**: The visual distinction between green (refundable balance) and red (payable balance) allows mess managers to immediately identify delinquent balances.
- **No Floating Card Glitch**: All metric cards maintain fixed equal height with `items-stretch` and `rounded-2xl` styling, preventing layout shift when values change.
- **Keyboard-Reactive KPIs**: Cards 1–5 are real `<button>` elements with descriptive `aria-label`s and visible `focus-visible` rings, so they are reachable and operable without a pointer.

---

### 3.3 Members Directory & Financial Ledger (`MembersScreen.tsx`)

#### Layout & Data Table Mechanics
- **Header Actions**: Features `"Add New Member"` CTA button for managers (hidden when month is locked).
- **Tabular Roster**:
  - Left-aligned member identity cell containing avatar initials icon, display name, and optional phone/email metadata.
  - Initial deposit and carried-over previous month balance columns with tabular numeral formatting (`font-mono`).
  - Dynamic balance status column rendering an explicit textual badge (`"Refundable"` vs `"Due to Pay"`) alongside the currency amount.
- **Self-Service Restrictions**:
  - When logged in as a normal member, financial manipulation inputs (Initial Deposit, Previous Balance) are locked.
  - Members are provided a specialized `"Edit My Info"` affordance on their own record, while other members' edit/delete controls are removed or replaced with `"View only"`.
- **Modals**:
  - *Add/Edit Member Modal*: Single-column form with phone, email, and deposit inputs.
  - *Record Deposit Modal*: Dedicated financial flow allowing managers to credit specific bank or cash receipts with date stamping.

---

### 3.4 Daily Meal Sheet & Matrix Grid (`DailyMealsScreen.tsx`)

#### Structural Design & Dual-Mode Matrix
The Daily Meals screen is the highest-density data interface in the application, accommodating up to 31 calendar days across dozens of members.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  DAILY MEAL SHEET (Dual-View Matrix)                                        │
│  [View Mode Toggle]: [Matrix Grid (All Days)]  |  [Single Day Focus]       │
├─────────────────────────────────────────────────────────────────────────────┤
│  Sticky Left Column   │ Day 1 │ Day 2 │ Day 3 │ ... │ Day 31 │ Total Meals │
│  Member Name          │       │       │       │     │        │             │
├───────────────────────┼───────┼───────┼───────┼─────┼────────┼─────────────┤
│  Rahim Ahmed (You)    │ [ 2 ] │ [1.5] │ [ 1 ] │ ... │ [ 2 ]  │    48.5     │
│  Karim Ullah          │   1   │   2   │   1   │ ... │   1    │    32.0     │
│  Sabbir (Manager)     │   2   │   2   │   2   │ ... │   2    │    62.0     │
├───────────────────────┼───────┼───────┼───────┼─────┼────────┼─────────────┤
│  Daily Mess Total     │   5   │  5.5  │   4   │ ... │   5    │   142.5     │
└─────────────────────────────────────────────────────────────────────────────┘
```

#### Key UI/UX Innovations
- **Two View Modes**:
  1. *Matrix Grid*: Full horizontal scrolling spreadsheet allowing high-level inspection of monthly attendance patterns.
  2. *Single Day Focus*: Card-based daily logger allowing touch-friendly increment/decrement operations (`-`, `+`, or direct numeric taps: `0`, `0.5`, `1`, `1.5`, `2`, `2.5`, `3`) optimized for mobile screens.
- **Cell Editing Quick-Picker**:
  - Clicking an editable cell triggers a floating popover selector displaying quick-tap options (`0`, `0.5`, `1`, `1.5`, `2`, `2.5`, `3`) instead of requiring manual keyboard input.
- **Role-Based Cell Locking**:
  - Normal members are visually identified via a prominent `(You)` badge on their row.
  - Only the logged-in member's cells remain interactive; all other members' cells are rendered with muted, non-clickable text, preventing unauthorized modifications.
- **Comprehensive Audit Trail Modal**:
  - A `"Meal Audit Log"` button opens a chronological log tracking every single edit, logging the exact previous value, new value, editor's username, and timestamp.

---

### 3.5 Expenses Hub (`ExpensesScreen.tsx`)

#### Architectural Split: Section A vs. Section B
To prevent accounting confusion between grocery expenses (which impact the meal rate) and fixed apartment bills (which do not), the screen utilizes a tabbed segmented controller:

1. **Section A: Bazaar Expenses**:
   - Purpose: Records raw groceries (rice, fish, meat, oil, vegetables).
   - Table Columns: Date, Description, Paid By, Amount, Status & Actions.
   - Formula Callout: Explanatory card reminding users that $\text{Meal Rate} = \frac{\text{Total Grocery Cost}}{\text{Total Meals}}$.
   - Negative Adjustments: Allows negative values (e.g., `-300` for returns or deposit deductions) with distinctive amber styling.
2. **Section B: Universal Expenses**:
   - Purpose: Records utilities, cook wages, WiFi, and gas refills.
   - Dual-Column Payer/Split Display: Shows both the full credit added to the payer's balance (`+৳1,500`) and the equal deduction applied to each participating member (`-৳250/each`).
   - Calculation Card: Live interactive preview inside the modal showing exact credit and split amounts as the user types the total.

#### Strict Member Expense Payer Enforcement
- When a normal member clicks `"Add Bazaar Expense"` or `"Add Universal Expense"`, the **Paid By** selector dropdown is replaced with a locked container displaying their name and a `You (Locked)` badge.
- Normal members cannot attribute an expense to any other member or the Shared Mess Fund.
- In the table rows, normal members can edit and delete only their own submitted expenses; rows submitted by others display a quiet `View only` indicator.

---

### 3.6 Financial Reports & Final Settlement (`ReportsScreen.tsx`)

#### Document Layout & Print Engine
- **Print Optimization (`@media print`)**:
  - Includes a dedicated print stylesheet that automatically suppresses all navigation bars, floating buttons, and background colors (`.no-print { display: none !important; }`), formatting the financial statement as a black-and-white A4 accounting audit sheet.
- **Client-Side PDF Generation (`jsPDF`)**:
  - Generates downloadable PDF statements with structured tabular layout, metadata timestamps, and meal rate formulas.
- **Balance Settlement Table**:
  - Summarizes the final financial position for every member, highlighting whether money should be paid out to the member or collected from them to close out the month.

---

### 3.7 System Administration & User Management (`SettingsScreen.tsx`)

#### Master Key Authority Operations
- **Month Lifecycle Governance**:
  - Month creation (Name, Year, Number of Days).
  - Status toggles: `Active` $\rightarrow$ `Locked` (Read-only restriction) $\rightarrow$ `Archived`.
- **Meal Rate Strategy Configuration**:
  - Dynamic Auto Mode (calculated strictly from groceries and meals).
  - Fixed Rate Mode (overrides dynamic calculation with a pre-agreed constant, e.g., ৳65/meal).
- **User Management Center**:
  - Master Key can create Normal Users with linked Member IDs, assign roles (`member` vs `manager`), and reset credentials.
  - Dedicated table of all system users with deletion confirmation dialogs to prevent accidental lockouts.
- **Cloud Backup & Disaster Recovery**:
  - Full JSON export of all months, members, meals, and receipts.
  - JSON restore upload tool with automated integrity checks.
  - Factory reset trigger with safety warnings.

---

## 4. Shared Component Systems & Structural Breakdown

### 4.1 Navigation Systems

#### Desktop Navigation (`Navbar.tsx`)
- **Structure**: Sticky 60/64px (`h-15 sm:h-16`) header adhering to a three-zone contract:
  - *Left Zone*: History back button (`ArrowLeft`), MealMess icon + wordmark (a real `<button>`), and active month selector dropdown.
  - *Center Zone*: Desktop navigation buttons with active highlight states, including an interactive dropdown menu for Expenses (`Bazaar` vs `Universal`). The active destination carries `aria-current="page"`; the Expenses trigger carries `aria-expanded`.
  - *Right Zone*: Cloud synchronization telemetry (`Synced` / `Syncing` / `Offline` status indicator) and user profile trigger.
- **Compact Header Behavior (≤360px)**:
  - The month label is hidden below `md`; only the calendar icon remains inside a 44×44px target.
  - The sync telemetry chip is hidden below `sm` (still available inside Settings).
  - The Logout control becomes icon-only below `sm` while retaining its `aria-label`.
  - The left group is allowed to shrink (`min-w-0`, brand wordmark `truncate`) so the header never exceeds the viewport width.
- **Back Button Navigation Ergonomics**:
  - Uses browser history state (`window.history.pushState` and `window.history.back`) so physical/browser back button clicks navigate between internal screens without terminating the application session.
  - `history.pushState` is called from the navigation callback, not from inside a React state updater, so StrictMode's double invocation cannot duplicate entries.

#### Mobile Bottom Navigation (`BottomNav.tsx`)
- **Structure**: Fixed bottom tab bar (`lg:hidden`) with 5 core tabs (Home, Meals, Members, Expenses, Reports) and an optional 6th tab (Settings) when logged in as Master Key.
- **State Semantics**: The active tab exposes `aria-current="page"`; the container has `aria-label="Mobile Navigation"`.
- **Safe Area Insets**: Incorporates `env(safe-area-inset-bottom)`, which now resolves correctly because the viewport meta includes `viewport-fit=cover`.
- **Touch Targets**: Each tab is `min-h-11` (44px) with a 28–32px icon tile, so labels are not clipped and taps register reliably.

---

### 4.2 Cards, Surfaces & Elevation Hierarchy

- **Single-Elevation Depth**: MealMess avoids nested card clutter. Content surfaces rely on pure white containers (`bg-white`) bordered by subtle 1px pastel sage boundaries (`border border-[#B1D3B9]/60`) and soft ambient shadows (`shadow-xs` / `shadow-2xs`).
- **Surface Math**:
  - Card corner radius: 24px (`rounded-3xl`) for primary screen containers; 16px (`rounded-2xl`) for metric tiles and filter bars.
  - Container padding: 16px (`p-4`) on mobile, scaling to 24px–32px (`p-6 sm:p-8`) on desktop screens.

---

### 4.3 Data Tables & Matrix Grids

- **Header Styling**: Uppercase, tracked-out 11px micro-typography (`text-[11px] font-bold uppercase tracking-wider text-gray-600`) atop a light tinted background (`bg-[#E6F2DD]/30`).
- **Sequential Sorting Toggle**:
  - Expenses tables incorporate a prominent order toggle button allowing users to switch between sequential chronology (`Day 1 → Day 31`) and reverse chronology (`Day 31 → Day 1`).
- **Row Hover & Density**:
  - Row height is constrained between 44px and 56px to maximize information density while preserving touch accessibility.
  - Alternating rows feature subtle hover states (`hover:bg-[#E6F2DD]/15`).

---

### 4.4 Modal Dialogs & Confirmation Safeguards

All dialogs are rendered through one shared primitive, `src/components/Modal.tsx`, built on the native `<dialog>` element:
1. **Native Modal Semantics**: `showModal()` supplies Esc-to-close, background inertness, and a top-layer scrim. `aria-modal="true"`, `aria-labelledby` and `aria-describedby` are wired to the heading and description.
2. **Backdrop & Animations**: The native `::backdrop` is styled with a 50% scrim and light blur; entry uses `fade-in zoom-in-95`, suppressed under `prefers-reduced-motion`.
3. **Header**: Clear title, explanatory subtitle, and an explicit close button (`X`, `aria-label="Close dialog"`, 44px on touch).
4. **Action Footer**: Dual-button alignment with cancel on the left and high-intent action on the right. The body scrolls internally (`max-h-[92dvh] overflow-y-auto`), so tall flows such as Universal Expenses remain reachable at 375×667 and 320×568.
5. **Focus Management**: Focus moves into the dialog on open, a defensive Tab loop keeps it there, and focus returns to the triggering control on close. The page behind cannot scroll (`body.modal-open`).
6. **Destructive Actions**: Deletion confirmations (members, expenses, users) feature crimson warning icon badges (`AlertTriangle`) and explicit consequence text before execution.

All 13 modal sites (Dashboard ×1, Members ×3, Expenses ×4, DailyMeals ×2, Settings ×2, My Profile ×1) use this primitive; none use hand-rolled `fixed inset-0` shells with only `role="dialog"`.

---

### 4.5 Global Utility Widgets (`CalculatorWidget.tsx`)

- **Component Design**:
  - Always-accessible floating button positioned in the bottom-right corner (`fixed bottom-20 lg:bottom-6 right-3 sm:right-6`), 44px on touch and 40px from `sm` upward, with an `aria-label` and visible focus ring.
  - Expanding card modal offering a full 4-function calculator (+, -, ×, ÷), equation history strip, decimal input, and copy-result affordance (`Copy` / `Check`).
  - Icon-only copy and close controls carry explicit `aria-label`s; the backspace key is labelled; every keypad key is at least 44px tall on touch.
- **Workflow Benefit**: Allows mess managers to tally physical paper receipts or supermarket bills without toggling between third-party operating system calculator apps.

---

## 5. Multi-Device Layout & Responsive Ergonomics

### 5.1 Small/Mobile Viewports (320px – 480px)

| Screen / Component | Mobile Adaptation Behavior | Ergonomic Assessment |
| :--- | :--- | :--- |
| **Global Viewport** | `viewport-fit=cover` enables `env(safe-area-inset-bottom)`; content bottom padding (`pb-28`) prevents clipping beneath the fixed BottomNav. | Prevents dead-clicks on the lowest table rows and keeps labels clear of the iOS home indicator. |
| **Top Navbar** | Desktop links collapse at `lg`; month label hides below `md` (icon-only 44px target); sync chip hides below `sm`; Logout becomes icon-only below `sm`; left group shrinks and the brand wordmark truncates. | Fits 320px without page-level horizontal scroll; the measured header group widths total ~306px at 320px. |
| **Dashboard Metrics** | Six-card grid is `grid-cols-2 md:grid-cols-3 lg:grid-cols-6`; currency values use `break-words` + `tabular-nums` and never `truncate`. | Maintains legible font sizes without hiding a digit at 320px. |
| **Daily Meal Sheet** | Matrix stays horizontally scrollable (`min-w-max`) with sticky member and total columns; each cell is 44px tall with an aria-label; Single Day Focus provides a vertical card stack. | Eliminates micro-scrolling frustration on small touchscreens while keeping cells tappable. |
| **Expenses Tables** | Tables use `overflow-x-auto` wrappers plus `min-w-[880px]` so columns scroll instead of squashing; cell padding is `px-3 sm:px-6`. | Prevents table columns from breaking layout bounds and preserves numeric alignment. |
| **Modals** | Shared native `<dialog>` caps at `92dvh` with an internal scroll region and a sticky footer. | Universal Expense actions remain reachable at 320×568 and 375×667. |

---

### 5.2 Tablet & Medium Viewports (768px – 1024px)

- **Grid Balancing**: Dashboard KPI metrics render cleanly as a balanced 2x2 grid.
- **Top Navigation**: Navigation links appear as compact text icons; expense dropdown remains accessible.
- **Daily Meals**: Matrix grid displays 15–20 days comfortably without requiring excessive horizontal dragging.

---

### 5.3 Desktop & Ultra-Wide Viewports (1440px – 1600px+)

- **Container Containment**: Main content canvas is bound by `max-w-7xl xl:max-w-[1400px] 2xl:max-w-[1600px] mx-auto` to prevent wide-screen stretching or line lengths exceeding 100 characters.
- **Meal Matrix Width**: The 31-day matrix does **not** fit at 1440px. It requires roughly 1,636px (176px sticky name column + 31×44px day columns + 96px totals column), so it always scrolls horizontally inside its container even at 1440; the sticky first/last columns keep identity and totals visible while scrolling.
- **Navigation Layout**: Desktop Navbar displays the history back button, brand, month selector (full label at `2xl`), all navigation links, expenses sub-menu, cloud sync status, profile pill, and Logout on a single row. Labels progressively compact below `2xl`.

---

## 6. Design Evaluation: Typography, Color Math & Accessibility

### 6.1 Typographic Hierarchy & Tabular Numerals

- **Typeface**: `Plus Jakarta Sans` applied globally via Google Fonts. Its geometric clarity and tall x-height ensure high legibility at 11px–13px metadata sizes.
- **Monospace Mapping**: `--font-mono` is mapped to `JetBrains Mono` in `@theme`, so the downloaded font is actually applied to financial figures (it was previously requested but unused).
- **Tabular Figures**:
  - Monetary values, daily meal counters, and rate figures use `font-mono tabular-nums`; the Dashboard KPI values use `tabular-nums` directly.
  - Decimal alignment prevents jitter when numbers increment or recalculate in real-time.
  - `tabular-nums` is applied to KPI values, table money columns, balances, the meal rate, the calculator display, and audit-log amounts.
- **No Truncated Currency**: `truncate` was removed from every currency element (Dashboard cards, Reports KPI strip). Values use `break-words` and a compact `text-base sm:text-2xl` scale so no digit can be hidden at 320px.
- **Headline Discipline**:
  - Section headers use bold weights (`font-extrabold`) in deep forest green (`#1A332C`).
  - Metadata labels use `text-gray-600` (7.56:1 on white) rather than `gray-400`/`gray-500`.

---

### 6.2 Color Distribution (60-30-10 Rule) & State Signaling

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       60-30-10 COLOR BUDGET ALLOCATION                      │
├──────────────────────────────────────┬───────────────────────┬──────────────┤
│ 60% DOMINANT CANVAS                  │ 30% STRUCTURAL        │ 10% ACCENT   │
│ Sage Canvas Background (#E6F2DD)     │ White Cards & Tables  │ Action Teal  │
│ Soft natural tint, zero eye strain   │ Crisp white surfaces  │ #456C63      │
│                                      │ Hairline sage borders │ CTAs & Tabs  │
└──────────────────────────────────────┴───────────────────────┴──────────────┘
```

- **Accent Split**: `#659287` remains the decorative eucalyptus tone for icon tiles, borders, and the meal-rate card outline. `#456C63` carries all label-bearing surfaces: primary buttons, active navigation pills/tabs, badges with white text, and teal text on white.

- **Non-Color State Indicators**: MealMess complies with accessibility standards by never signaling critical state via color alone. Every financial balance pairs red/green coloring with explicit text indicators (`"Refundable"` / `"Due to Pay"` / `"You"` / `"Locked"`).

---

### 6.3 Accessibility & WCAG Contrast Review

Measured with the WCAG 2.x relative-luminance formula against the actual tokens in `src/index.css`. **This table is the regression baseline**; re-run the measurement after any palette change.

| Element Pair | Foreground | Background | Contrast | WCAG AA (normal text) |
| :--- | :--- | :--- | :--- | :--- |
| Primary body text | `#1A332C` | `#FFFFFF` | **13.52:1** | Pass (AAA) |
| Headers on canvas | `#1A332C` | `#E6F2DD` | **11.65:1** | Pass (AAA) |
| Primary CTA label | `#FFFFFF` | `#456C63` | **5.87:1** | Pass (AA) |
| Teal text on white | `#456C63` | `#FFFFFF` | **5.87:1** | Pass (AA) |
| Metadata labels | `#4B5563` (gray-600) | `#FFFFFF` | **7.56:1** | Pass (AAA) |
| Due balance text | `#B91C1C` | `#FEF2F2` (red-50) | **5.91:1** | Pass (AA) |
| Credit balance text | `#047857` (emerald-700) | `#ECFDF5` (emerald-50) | **5.21:1** | Pass (AA) |
| White on decorative teal | `#FFFFFF` | `#659287` | 3.49:1 | **Fail** — decorative fills only, never text |
| Teal text on white (old) | `#659287` | `#FFFFFF` | 3.49:1 | **Fail** — replaced by `#456C63` |
| Due text on red-50 (old) | `#DC2626` | `#FEF2F2` | 4.41:1 | **Fail** — replaced by `#B91C1C` |
| Inactive tab label (old) | `#9CA3AF` (gray-400) | `#FFFFFF` | 2.54:1 | **Fail** — replaced by gray-600 |
| gray-500 on canvas (old) | `#6B7280` | `#E6F2DD` | 4.17:1 | **Fail** — labels moved to gray-600 |

Rules enforced in the codebase:
- `#659287` is decorative-only (icon tiles, borders, meal-rate outline). Any fill with a white label uses `#456C63`.
- Teal-on-white text is always `#456C63`.
- Metadata uses `gray-600`; `gray-400`/`gray-500` are limited to decorative icons and placeholders.
- Due/negative amounts use `#B91C1C`.
- Focus indicators are visible (`focus-visible:ring-2`) and there is a `prefers-reduced-motion` guard.

**Known limit:** contrast was verified mathematically, not with axe DevTools in a browser session; see §8.

---

### 6.4 Cognitive Ergonomics & Multi-Role Permissions

MealMess achieves high cognitive ergonomics by adapting its visual language to the user's role:
1. **Master Key**: Receives full administrative indicators, settings tab access, and unrestricted data modification controls.
2. **Manager**: Operates with operational controls enabled, but cannot delete the active month or provision administrative users without Master Key authorization.
3. **Normal Member**: All administrative clutter (create month, delete user, modify other members' meals or expenses) is removed. The member sees an uncluttered interface displaying their own meals, their personal financial standing, and their own expenses with clear `(You)` indicators.

---

## 7. Fixes Applied & Remaining Gaps

### 7.1 Security gate
- Removed the hardcoded `'ASmin1234'` fallback. `verifyMasterKey` now compares only the SHA-256 hash of the submitted key against the stored master credential.
- Master elevation is session-scoped and expires after 15 minutes of inactivity; activity events (`mousedown`, `keydown`, `touchstart`, `pointerdown`, `scroll`) refresh the window.
- Elevation is cleared on normal login and on logout.
- Both successful and rejected unlock attempts are appended to `auditLogs` (`Master Key Accepted` / `Master Key Rejected`).
- The original master password remains valid because the seeded master user stores its hash.

### 7.2 Shared modal system
- Added `src/components/Modal.tsx` using native `<dialog>` + `showModal()`; all 13 modal sites migrated.
- Provides Esc/cancel interception, `::backdrop` styling, explicit close button, `aria-labelledby`/`aria-describedby`, `aria-modal`, body scroll lock, focus restoration, and a defensive Tab loop.
- Tall flows scroll internally (`max-h-[92dvh]`), so actions stay reachable at 320×568 and 375×667.
- Destructive confirmations now all have an explicit `X` in addition to Cancel.

### 7.3 Color & typography
- Added `--color-brand-action: #456C63`; all label-bearing primary fills, active pills, and teal text use it.
- Due amounts use `#B91C1C`; metadata labels use `gray-600`.
- `truncate` removed from every currency element; `tabular-nums` applied to all financial figures.
- `--font-mono` mapped to JetBrains Mono so the font request is no longer wasted.

### 7.4 Mobile layout
- `index.html` viewport now includes `viewport-fit=cover`.
- Navbar fits 320px: month label hidden below `md`, sync chip below `sm`, icon-only logout below `sm`, shrinkable left group, truncated wordmark.
- Dense tables use `min-w` + `overflow-x-auto` with `px-3 sm:px-6` cells.
- Touch targets are ≥44px on touch for back, sync, profile, logout, month selector, calculator trigger/keypad, matrix cells, and bottom-nav items.
- `html, body { max-width: 100vw }` removed.

### 7.5 Keyboard & semantics
- Dashboard KPI cards 1–5 and the navbar brand are real `<button>` elements with focus rings.
- Icon-only controls have `aria-label`s; nav links expose `aria-current="page"`; the Expenses trigger exposes `aria-expanded`.
- `history.pushState` now runs outside the `setCurrentScreen` updater, so StrictMode cannot duplicate history entries.

### 7.6 Verification run
- `npm install` completed (307 packages).
- `npm run lint` (`tsc --noEmit`) passes with no errors.
- `npm run build` (Vite) succeeds.
- Contrast measured with the WCAG relative-luminance formula and recorded in §6.3.
- Live browser checks passed:
  - Login with the documented seed password works after the hash migration.
  - Modals expose `aria-modal`, lock body scroll, move focus inside on open, close on Esc and backdrop click, trap Tab, and restore focus to the trigger.
  - Page `scrollWidth === clientWidth` at 320, 375, 768, 1024, and 1440 px.
  - Mobile month selector and logout are 44×44; bottom-nav items are 51 px tall.
  - Member and Universal Expense modals fit at 320×568 with visible footers.

### 7.7 Known gaps (not fixed here)
- **No server-side authorization.** `firestore.rules` still must enforce role checks; the client gate is not a security boundary.
- **No automated accessibility tests.** axe DevTools and a screen-reader spot-check were not run in a browser.
- **Print/PDF width.** The settlement table has a mobile `min-w`; print preview at A4 should be re-checked because `min-w` can force clipping in print.
- **Remaining decorative teal.** `#659287` is still used for icon tiles and borders by design, including icon-only tiles that contain white glyphs (icons, not text).

---

## 8. Conclusion

The MealMess frontend is a mature, cohesive, and domain-authentic management application. Its visual identity successfully replaces standard boilerplate templates with a purposeful botanical color language. Data density is balanced with generous whitespace, tabular numeral alignments prevent visual jitter, and strict role-based UI adaptations protect financial data integrity while delivering an intuitive user experience across mobile, tablet, and desktop viewports.

The November 2026 revision corrected the audit's measurable errors (contrast, card count, matrix width, touch targets, modal close affordances) and documented the security, modal, color, mobile, and keyboard fixes now in the source. The contrast table in §6.3 is the regression baseline, and the browser checks in §7.6 are the layout and modal baseline. Remaining risk is concentrated outside the component layer: there are no server-side rules and no automated a11y suite.
