<div align="center">

# 🍽️ Smart Meal Manager

**The complete mess accounting & daily meal management system for shared living spaces.**

[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Firebase](https://img.shields.io/badge/Firebase-12-FFCA28?logo=firebase&logoColor=black)](https://firebase.google.com/)
[![Vite](https://img.shields.io/badge/Vite-6-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-4-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)

</div>

---

## 📋 Table of Contents

- [What is Smart Meal Manager?](#-what-is-smart-meal-manager)
- [Unique Selling Points](#-unique-selling-points)
- [Feature Overview](#-feature-overview)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [How to Use — Screen-by-Screen Guide](#-how-to-use--screen-by-screen-guide)
- [Financial Calculation Engine](#-financial-calculation-engine)
- [Data Model](#-data-model)
- [Cloud Sync & Offline Support](#-cloud-sync--offline-support)
- [Security & Access Control](#-security--access-control)
- [Getting Started (Local Development)](#-getting-started-local-development)

---

## 🍽️ What is Smart Meal Manager?

**Smart Meal Manager** is a full-featured, cloud-synced web application purpose-built for **mess/hostel managers** and **shared meal communities**. It replaces manual notebooks, scattered spreadsheets, and guesswork with a transparent, automated accounting system.

Whether you're managing a student hostel mess, a bachelor house, or any shared living arrangement, Smart Meal Manager handles the entire lifecycle of mess accounting — from tracking who ate how many meals each day, to calculating each member's exact financial balance at the end of the month.

> Built with **React 19 + TypeScript + Firebase Firestore**, this app provides real-time cloud sync, multi-device access, offline-first local caching, PDF report generation, and a built-in calculator — all in a clean, mobile-responsive UI.

---

## ✨ Unique Selling Points

| Feature | What Makes It Special |
|---|---|
| **Real-Time Cloud Sync** | Changes from any device instantly appear on all others via Firestore `onSnapshot` listeners — no manual refresh needed |
| **Offline-First Architecture** | All data is cached in `localStorage`/`sessionStorage`, so the app works fully even without internet |
| **Dual Expense System** | Two distinct expense categories (Bazaar & Universal) with different accounting rules, covering all real-world mess expense scenarios |
| **Auto Balance Carry-Forward** | When you create a new month, every member's previous final balance is automatically carried forward as their opening balance |
| **Half-Meal Support** | Meal quantities support `0, 0.5, 1, 1.5, 2, 2.5, 3` — perfect for tracking partial meals |
| **Complete Audit Trail** | Every action (meal update, expense, deposit, login) is logged with a timestamp and the responsible user |
| **PDF Report Export** | One-click export of the full monthly financial audit statement as a professional A4 PDF |
| **Built-in Calculator** | A persistent, floating calculator widget available on every screen — no need to switch apps |
| **Month Lifecycle Management** | Months can be `active`, `locked` (read-only), or `archived` — protecting historical records |
| **Flexible Meal Rate** | Choose between **Auto mode** (rate = total bazaar cost ÷ total meals) or **Fixed rate** per meal |

---

## 🗂️ Feature Overview

### 🔐 Authentication
- Secure username + hashed-password login
- "Stay signed in" remember-me feature using `localStorage`
- Session is preserved independently from cloud data (switching devices doesn't log you out)
- Manager can update username, full name, and password from Settings

### 📊 Dashboard
- Live summary cards: Total Members, Total Meals, Bazaar Cost, Universal Expenses, Total Deposits, Meal Rate
- Per-member balance breakdown: each member's Receivable / Payable / Settled status shown at a glance
- Clickable member cards that open a detailed modal showing individual deposits, bazaar payments, universal payments, and the final balance formula
- Month switcher dropdown to jump between any month
- Quick navigation buttons to other screens

### 👥 Members
- Add members with name, initial deposit, previous balance, optional email and phone
- Edit or delete members at any time (deletions cascade-remove all associated meals and deposits)
- Log additional deposits for any member with date and an optional note
- View each member's deposit history with delete capability
- Live status badge (Receivable / Payable / Settled) shown per member

### 🍱 Daily Meals
- **Matrix View**: Full month grid — rows = members, columns = days — showing every meal entry at once
- **Daily View**: Focus on a single day to quickly enter meals for all members
- Click any cell to open a meal picker with quantity options (0 → 3 in 0.5 steps)
- Day totals and member totals shown in real time
- Meal Change History modal: full chronological audit log of every meal edit for the month (who changed what and when)
- Locked/archived months become read-only automatically

### 💰 Expenses (Bazaar & Universal)

#### Bazaar Expenses (Food Purchases)
- Record daily grocery/bazaar purchases: date, description, amount, and who paid
- The member who paid gets a **bazaar credit** added to their balance
- Total bazaar cost drives the **auto meal rate** calculation
- Supports negative amounts (e.g., returned items or cash taken from shared fund)
- Payer can be a member or "Shared Fund"

#### Universal Expenses (Shared Non-Food Costs)
- Record shared utility bills, cleaning costs, internet, etc.
- The paying member receives a **universal credit**
- Cost is **split equally** across all applicable members (or a selectable subset)
- Completely independent from the meal rate formula

### 📄 Reports
- Full monthly financial audit table showing every member's:
  - Total meals consumed
  - Initial deposit + additional deposits
  - Previous balance carry-forward
  - Bazaar credit (amount they paid toward food)
  - Universal credit & universal expense share
  - Meal cost (meals × meal rate)
  - **Final Balance** = (Previous Balance + Deposits + Bazaar Credit + Universal Credit) − (Meal Cost + Universal Share)
  - Status: **Receivable** (they're owed money), **Payable** (they owe money), or **Settled**
- **Print** button for browser print dialog
- **Export PDF** button — generates a fully formatted A4 PDF document via `jsPDF`

### ⚙️ Settings
- **Month Management**: Create new months, switch active month, lock/unlock, archive
- **Meal Rate Settings**: Toggle between Auto and Fixed rate mode; set custom fixed rate value
- **Account Credentials**: Update manager username, full name, and password
- **Cloud Sync Status**: Live sync indicator (Synced / Syncing / Offline / Error), last synced time, and Force Sync button
- **Audit Log**: Searchable log of all actions across the app (member added, expense updated, month created, etc.)
- **Backup & Restore**: Export full app state as a JSON file; import from a JSON backup
- **Reset**: Restore demo/seed data (with confirmation modal)

### 🧮 Calculator Widget
- Floating calculator button accessible from every screen (bottom-right corner)
- Supports `+`, `−`, `×`, `÷` with chained operations
- Persistent memory (`M+`, `M-`, `MR`) saved to `localStorage`
- Copy result to clipboard with a single button
- Designed for quick financial calculations without leaving the app

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | React 19 with functional components and hooks |
| **Language** | TypeScript 5.8 |
| **Build Tool** | Vite 6 |
| **Styling** | Tailwind CSS v4 |
| **Database** | Firebase Firestore (real-time NoSQL cloud database) |
| **Auth Backend** | Firebase Auth (session management) |
| **Icons** | Lucide React |
| **Animations** | Motion (Framer Motion v12) |
| **PDF Export** | jsPDF |
| **Password Hashing** | Custom SHA-256 via Web Crypto API (`utils/crypto.ts`) |
| **Package Manager** | Bun (lockfile) / npm-compatible |

---

## 📁 Project Structure

```
smart-meal-manager-6/
├── src/
│   ├── App.tsx                  # Root component — routing between screens
│   ├── main.tsx                 # React DOM entry point
│   ├── index.css                # Global base styles
│   ├── firebase.ts              # Firebase init, Firestore & Auth exports, error handler
│   ├── types.ts                 # All TypeScript interfaces & types
│   │
│   ├── context/
│   │   └── AppContext.tsx       # Global state, all CRUD actions, Firestore sync logic
│   │
│   ├── components/
│   │   ├── Navbar.tsx           # Top navigation bar with month switcher & sync badge
│   │   ├── BottomNav.tsx        # Mobile bottom tab navigation
│   │   └── CalculatorWidget.tsx # Floating calculator with memory
│   │
│   ├── screens/
│   │   ├── LoginScreen.tsx      # Auth gate — username/password login form
│   │   ├── DashboardScreen.tsx  # Summary cards + member balance overview
│   │   ├── MembersScreen.tsx    # Member CRUD + deposit management
│   │   ├── DailyMealsScreen.tsx # Meal matrix/daily view + audit history
│   │   ├── ExpensesScreen.tsx   # Bazaar & Universal expense management (tabbed)
│   │   ├── ReportsScreen.tsx    # Monthly audit report + PDF/print export
│   │   └── SettingsScreen.tsx   # Month mgmt, credentials, backup, audit log
│   │
│   └── utils/
│       ├── calculations.ts      # Core financial calculation engine + formatters
│       ├── crypto.ts            # SHA-256 password hashing via Web Crypto API
│       └── initialData.ts       # Seed/default data for first-run
│
├── firebase-applet-config.json  # Firebase project configuration
├── firebase-blueprint.json      # Firebase project blueprint metadata
├── firestore.rules              # Firestore security rules
├── .env.example                 # Environment variable template
├── vite.config.ts               # Vite build configuration
├── tsconfig.json                # TypeScript compiler config
└── package.json                 # Dependencies and scripts
```

---

## 🖥️ How to Use — Screen-by-Screen Guide

### Step 1 — Login

Navigate to the app URL. You will see the login screen.

**Default manager credentials:**

| Username | Password |
|---|---|
| `manager` | `manager123` |
| `admin` | `admin123` |

Enter your credentials and click **Sign In**. Enable "Stay signed in on this device" to persist your session across browser restarts.

---

### Step 2 — Settings: Set Up Your First Month

After logging in, go to **Settings** (gear icon).

1. Under **Month Management**, pick a month name (e.g., "September") and year from the dropdowns.
2. Click **Create Month**. The app automatically switches to this new month.
3. *(Optional)* Under **Meal Rate Settings**, choose **Fixed Rate** if you want to set a flat cost per meal, or leave it on **Auto** to let the system calculate it from bazaar expenses.

---

### Step 3 — Members: Add Residents

Go to the **Members** screen.

1. Click **Add Member**.
2. Enter the member's name, their initial deposit for this month, and their previous balance (if carrying over manually). Email and phone are optional.
3. Click **Save**. Repeat for all mess members.
4. To log additional deposits later, click the **+** (deposit) icon on any member's card.

---

### Step 4 — Daily Meals: Track What Everyone Ate

Go to the **Meals** screen.

- **Matrix View** (default): See the entire month at a glance. Click any cell to set that member's meal count for that day.
- **Daily View**: Use the day navigator arrows to focus on a single day and set meals for all members quickly.
- Meal quantities: `0` (no meal), `0.5` (half meal), `1`, `1.5`, `2`, `2.5`, `3`
- Click **History** to see a full changelog of all meal edits.

---

### Step 5 — Expenses: Record Costs

Go to the **Expenses** screen. It has two tabs:

**Bazaar Tab (Food Expenses)**
- Click **Add Bazaar Expense**.
- Fill in the date, what was bought (description), the amount, and who paid.
- This contributes to the total bazaar cost and, in Auto mode, drives the meal rate calculation.

**Universal Tab (Shared Non-Food Expenses)**
- Click **Add Universal Expense**.
- Fill in the date, description, amount, and who paid.
- Select which members this expense applies to (or leave all selected to split equally across everyone).
- The payer gets a credit; the cost is split evenly among applicable members.

---

### Step 6 — Reports: See the Final Breakdown

Go to the **Reports** screen.

The full financial audit table is shown, listing every member's balance calculation. At the top, you'll see:
- Total meals, total bazaar cost, total universal expenses, total deposits
- The calculated meal rate (formula shown)

Each member row shows: meals eaten, deposits paid, credits earned, costs incurred, and their **Final Balance**.

- Click **🖨️ Print** to open the browser print dialog.
- Click **📄 Export PDF** to download a formatted A4 PDF report.

---

### Step 7 — End of Month: Lock & Archive

Once the month is complete:

1. Go to **Settings → Month Management**.
2. Click **Lock** on the active month to make it read-only (no further edits).
3. When creating the next month, all current members are **automatically carried forward** with their final balances as the new opening `previousBalance`.
4. Click **Archive** on old months to mark them as fully closed.

---

### Account Management (Settings)

Under **Account & Credentials**, you can:
- Change your display name (Full Name)
- Update your login username
- Set a new password (minimum 4 characters)

---

### Backup & Restore (Settings)

- **Export Backup**: Downloads the entire app state (all months, members, meals, expenses) as a JSON file.
- **Import Backup**: Upload a previously exported JSON to restore data.

---

## 🧮 Financial Calculation Engine

The core formula (`src/utils/calculations.ts`) runs entirely in the browser:

```
Meal Rate (Auto)   = Total Bazaar Cost ÷ Total Meals
Meal Rate (Fixed)  = User-defined fixed value

Per-Member Balance:
  Total Deposit    = Initial Deposit + Additional Deposits
  Meal Cost        = Member's Total Meals × Meal Rate
  Universal Share  = Sum of (each Universal Expense Amount ÷ Applicable Members Count)
  Total Cost       = Meal Cost + Universal Share
  Total Credits    = Bazaar Credit (amount they paid) + Universal Credit (amount they paid)
  Final Balance    = (Previous Balance + Total Deposit + Total Credits) − Total Cost

Status:
  Final Balance > 0   → Receivable (the mess owes them)
  Final Balance < 0   → Payable (they owe the mess)
  Final Balance = 0   → Settled
```

---

## 📐 Data Model

| Entity | Key Fields | Purpose |
|---|---|---|
| `User` | `id`, `username`, `role`, `passwordHash` | Manager authentication |
| `MonthRecord` | `id`, `name`, `year`, `status`, `mealRateMode`, `fixedMealRate` | Monthly accounting period |
| `Member` | `id`, `monthId`, `name`, `initialDeposit`, `previousBalance` | Mess resident per month |
| `Deposit` | `id`, `monthId`, `memberId`, `amount`, `date` | Additional cash deposits |
| `MealEntry` | `id`, `monthId`, `memberId`, `day`, `quantity` | Single day meal record |
| `MealAuditRecord` | `monthId`, `memberId`, `day`, `previousValue`, `newValue`, `user` | Meal change history |
| `BazaarExpense` | `id`, `monthId`, `date`, `amount`, `paidById` | Food/grocery purchases |
| `UniversalExpense` | `id`, `monthId`, `amount`, `paidById`, `applicableMemberIds` | Shared non-food costs |
| `AuditLog` | `id`, `user`, `action`, `target`, `date`, `time` | System-wide action log |

---

## ☁️ Cloud Sync & Offline Support

The app uses a **dual-persistence** strategy:

1. **Local (Immediate)**: Every state change is instantly written to `localStorage` (with `sessionStorage` as fallback). The app loads instantly on next visit from local cache.
2. **Cloud (Debounced)**: Local changes are pushed to Firestore after a **400 ms debounce**, batching rapid inputs (e.g., filling a meal matrix row).
3. **Real-Time Listener**: A Firestore `onSnapshot` listener receives changes from other devices in real time and merges them into local state — without overwriting the current device's active session.
4. **Force Sync**: The Settings screen provides a manual "Force Sync from Cloud" button for edge cases.

**Sync Status Indicator** (visible in the Navbar):
- 🟢 **Synced** — data is up to date with cloud
- 🔄 **Syncing** — write in progress
- 🔴 **Offline** — no cloud connection (local mode active)
- ⚠️ **Error** — Firestore write failed

---

## 🔐 Security & Access Control

- **Password Hashing**: Passwords are hashed using **SHA-256 via the Web Crypto API** before storage — plain-text passwords are never stored.
- **Firestore Rules**: Only the `workspaces` collection is accessible; all other paths deny read/write by default.
- **Session Isolation**: The authenticated `currentUserId` is stored only in `localStorage` and never pushed to Firestore, keeping session state device-local.
- **Month Locking**: Locked and archived months reject all write operations at the application layer (`isLockedOrArchived` guard).
- **Audit Logging**: Every data mutation is logged with the actor's name, action type, target, date, and time.

---

## 🚀 Getting Started (Local Development)

### Prerequisites
- **Node.js** v18+ (or Bun)
- A **Firebase project** with Firestore enabled

### Steps

```bash
# 1. Clone the repository
git clone <your-repo-url>
cd smart-meal-manager-6

# 2. Install dependencies
npm install
# or: bun install

# 3. Configure environment variables
cp .env.example .env.local
# Add your GEMINI_API_KEY to .env.local if using AI features

# 4. Add Firebase config
# Edit firebase-applet-config.json with your Firebase project credentials

# 5. Start the development server
npm run dev
# App will be available at http://localhost:3000
```

### Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start dev server on port 3000 (0.0.0.0) |
| `npm run build` | Build production bundle |
| `npm run preview` | Preview production build locally |
| `npm run lint` | TypeScript type-check (no emit) |
| `npm run clean` | Remove dist and server.js |

---

<div align="center">

Built with ❤️ for mess managers everywhere · Powered by React, Firebase & TypeScript

</div>
