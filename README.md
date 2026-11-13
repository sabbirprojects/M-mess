# MealMess — Shared Mess Management System

**MealMess** is a transparent, automated shared mess management system designed to track daily meals, bazaar costs, universal expenses, member deposits, and monthly balances for student housing, staff messes, or any shared living community.

Built with **React**, **Vite**, **Tailwind CSS**, and **Firebase Firestore**, MealMess provides a complete financial management solution for mess operations, from daily meal logging to month-end financial settlements and PDF reporting.

---

## 📖 Overview

MealMess simplifies shared mess financial administration by automating calculations that traditionally required manual spreadsheet work. The system tracks:

- **Daily meal consumption** per member (breakfast/lunch/dinner portions)
- **Bazaar expenses** — Grocery and market purchases that directly determine the monthly meal rate
- **Universal expenses** — Shared bills (WiFi, maid service, gas, rent, utilities) that affect member balances but not the meal rate
- **Member deposits** — Initial and additional deposits that form the financial foundation
- **Monthly balance calculation** — Automated computation of who owes, who is owed, and who is settled

The system automatically calculates the **meal rate** each month using the formula:
> **Meal Rate = Total Bazaar Cost ÷ Total Meals** (in Auto Mode)

Or a fixed rate can be manually set in Settings (Fixed Mode).

All data is persisted in real-time via Firebase Firestore, with automatic local storage backup for offline access.

---

## 👥 User Roles & Permissions

MealMess has three distinct role levels with progressively restricted capabilities:

### 🔑 Master Key (Sabbir Programmer Only)
- **Full system access** — All administrative functions available
- Can **create and delete normal user accounts**
- Can **lock and archive months** (makes all records read-only)
- Can **configure meal rate modes** (Auto vs. Fixed) and set fixed rates
- Can **export/import backup JSON files** for migration/restore
- Can **reset all demo data**
- Can **force sync** with cloud Firestore
- The Master Key is strictly the account `sabbirprogrammer` with a hashed password

### 🛡️ Manager
- **Normal user with manager role**
- Can **add and edit members** in the current active month
- Can **record deposits** for members
- Can **add, edit, and delete** bazaar and universal expenses
- Can **log daily meals** for all members
- Can **update their own profile** (name, password, contact info)
- **Cannot** create/delete users, lock/archive months, or change meal rate modes without Master Key elevation
- If `isMasterKey` is true (i.e., logged in as sabbirprogrammer), gains full admin access

### 👤 Normal Member
- Can **only log and edit their own daily meals**
- Can **view their own financial balance** and meal history
- Can **edit their own profile** (name, phone, email, password)
- **Cannot** add/edit expenses, manage members, or access Settings
- Meal isolation: Members can only see and modify their own entries

### Role Hierarchy
```
Master Key (sabbirprogrammer)
       ↓
Manager (any user with role='manager')
       ↓
Normal Member (any user with role='member')
```

**Permission gates are enforced at the component level** — attempting unauthorized actions displays warning messages in the console but does not crash the application.

---

## ⚙️ Core Features & Functions

### 🍽️ Daily Meal Tracking
- **Matrix view**: Full-month calendar showing all members' meal quantities per day
- **Daily view**: Focus on a single day's meals across all members
- **Quantities**: 0, 0.5, 1, 1.5, 2, 2.5, 3 (partial meals supported)
- **Member isolation**: Members can only edit their own daily meals
- **Audit trail**: Every meal change is logged with timestamp, previous value, and new value
- **Live meal rate display**: The current meal rate (৳ per meal) updates in real-time on the Daily Meals screen

### 🏪 Bazaar vs. Universal Expenses

| **Bazaar Expenses** | **Universal Expenses** |
|----------------------|------------------------|
| Grocery/market purchases (rice, oil, meat, fish, spices) | Shared bills (WiFi, maid service, gas, rent, utilities) |
| **Directly determine the meal rate** | **Do NOT affect meal rate** |
| Added (+) to total expenditure | Full amount credited to payer, equal shares deducted from every member |
| Paid by a single member or 'shared_fund' | Paid by a member, split equally across applicable members |
| Example: Rice purchase for the month | Example: Monthly WiFi bill, maid salary |

**Bazaar Expense Rule**: Out-of-pocket spending and market purchases are real, positive expenses for the mess. When calculating total expenditure, bazaar amounts are added (using absolute magnitude), not subtracted, ensuring the total cost and meal rate reflect the true expenditure.

**Universal Expense Rule**: When a member pays for a shared bill, the full amount is credited to their balance (reported under "Uni. Credit"). However, equal shares are automatically deducted from every member's account, factoring into their "Total Cost."

### 🧮 Automated Meal Rate & Balance Calculation
The system automatically computes:

1. **Meal Rate** (per meal): `Total Bazaar Cost ÷ Total Meals` (Auto) or manually set rate (Fixed)
2. **Per-member meal cost**: `Total Meals × Meal Rate`
3. **Universal expense share**: Equal deduction from every member's account
4. **Total cost per member**: `Meal Cost + Universal Expense Share`
5. **Final balance**: `(Previous Balance + Deposits + Bazaar Credits + Universal Credits) - Total Cost`
6. **Balance status**:
   - `Receivable`: Final balance > 0 (member gets money back)
   - `Payable`: Final balance < 0 (member owes money)
   - `Settled`: Final balance ≈ 0 (within 0.001 tolerance)

All calculations are performed in `src/utils/calculations.ts` using the `calculateMonthSummary()` function.

### 📁 Month Locking & Archiving
- **Active month**: Fully editable — all members can log meals, add expenses
- **Locked month**: Read-only — no additions, edits, or deletions allowed. Master Key can unlock.
- **Archived month**: Historical record — archived months are preserved but isolated from active operations
- **Lock/Archive**: Master Key only function via Settings → Month Management
- **Auto-carry forward**: Creating a new month carries forward members' final balances from the previous month as their `previousBalance`

### 📄 PDF/Print Reports
- **Comprehensive monthly financial audit statement**
- Includes:
  - Report header with month/year and generation date
  - Financial summary: total meals, bazaar cost, universal expenses, total deposits, meal rate
  - Member-by-member breakdown: meals, deposits, bazaar credits, universal credits, total cost, final balance, status
  - Balance coloring: Green (Receivable), Red (Payable), Gray (Settled)
  - Payment formula explanation
  - Universal expense rule policy
  - Signature line for mess manager
- **Print**: Browser's native print function (`Ctrl+P` / `Cmd+P`)
- **Export PDF**: Generates downloadable PDF via `jsPDF`
- **Footer disclaimer**: Universal Expense Rule policy printed at bottom of report

### 👤 Profile Management
- **Update display name**, phone number, and email address
- **Change password** (requires current password verification)
- **Linked member record**: Each user can be linked to a mess member record, connecting their login to their financial calculations
- Profile changes are audited and persisted to cloud Firestore
- Accessible from Navbar (profile picture) and Daily Meals screen

### 💾 Backup & Restore
- **Export**: Download complete workspace state as JSON file
- **Import**: Restore from previously exported JSON backup
- Strict user sanitization: Only `sabbirprogrammer` (Master Key) and `manager` role users are preserved; all other accounts are removed during import
- Backup includes: months, members, deposits, meals, bazaar expenses, universal expenses, audit logs, and users

---

## 📋 How to Use — Step-by-Step Guide

### 🔐 First-Time Login
1. Open the MealMess application in your browser
2. **Login credentials** (provided by the mess administrator):
   - **Master Key**: Username: `sabbirprogrammer`, Password: `ASmin1234`
   - **Manager**: Username: `manager`, Password: `manager123`
   - **Normal Members**: Credentials set up by Master Key or Manager
3. Enter your username and password, optionally check "Stay signed in on this device"
4. Click **Sign In**

### 🏠 Daily Operations — Dashboard
After login, you land on the **Dashboard** showing the active month:

- **Month selector**: Use the dropdown to switch between months
- **My Account banner**: If linked to a member, shows your meals, deposits, and balance status
- **Quick navigation**: Buttons to navigate to Members, Meals, Expenses, Reports, or Settings

### 📅 Daily: Log Meals
1. Navigate to the **Meals** screen (or click "Meals" from bottom nav)
2. Choose **Matrix view** (full month calendar) or **Daily view** (single day)
3. Click on a member's cell for the current day
4. Select the meal quantity (0, 0.5, 1, 1.5, 2, 2.5, or 3)
5. The system immediately recalculates the live meal rate and member balances
6. Audit history is automatically logged for each change

### 🛒 Weekly/Monthly: Add Expenses
1. Navigate to the **Expenses** screen
2. Choose **Bazaar** (Section A) or **Universal** (Section B) tab
3. **Bazaar Expense**: 
   - Enter date, description, amount, and who paid
   - Click "Add Bazaar Expense"
   - Automatically updates the meal rate in real-time
4. **Universal Expense**:
   - Enter date, description, amount, who paid
   - Select which members this applies to (defaults to all members)
   - Click "Add Universal Expense"
   - Payer gets full credit; equal shares deducted from all selected members

### 👥 Member Management (Manager + Master Key only)
1. Navigate to the **Members** screen
2. View current month's members with their initial deposits and previous balances
3. **Add new member**: Fill form with name, initial deposit, previous balance, optional email/phone
4. **Edit member**: Click on existing member, modify details (managers can edit all; members can only edit their own)
5. **Record deposit**: Select member, enter amount and date, add optional note
6. **Delete member**: Master Key only — removes member and all associated meal/expense/deposit data

### 📊 Month-End: Generate Report
1. Ensure the correct **active month** is selected on Dashboard
2. Navigate to the **Reports** screen
3. Review the financial highlights summary cards
4. Click **'Export PDF'** to generate a downloadable PDF report
   - Includes: meal rate breakdown, member financial breakdown, total costs, final balances, status
5. Click **'Print Report'** to print directly from browser
6. The PDF includes:
   - Header with month/year and generation date
   - Financial summary statistics
   - Member table with meals, deposits, credits, total cost, final balance, status
   - Meal rate formula explanation
   - Universal expense rule policy
   - Manager signature line

### 🔒 Lock Month (Master Key only)
1. Navigate to **Settings** screen
2. View the active month's restriction status
3. Click **"Lock Month"** to make the month read-only
   - All records become immutable
   - Prevents any alterations before month-end settlement
4. Click **"Unlock Month"** to restore editing capability

### 📂 Backup & Restore
1. **Backup**: Go to Settings → scroll to "Backup & Restore" section → click "Export Backup JSON"
   - Downloads `MealMess_Backup_YYYY-MM-DD.json`
   - Contains complete workspace state
2. **Restore**: 
   - Click "Browse..." to select a backup JSON file
   - System validates the file structure
   - Restores all months, members, deposits, meals, expenses, and audit logs
   - Preserves current login session (does not kick you to login screen)

### 🔄 Month-End Settlement Workflow
1. **Finalize all meal entries** for the month
2. **Review and approve all bazaar/universal expenses**
3. **Master Key locks the month** (makes it read-only)
4. **Generate and distribute PDF reports** to all members
5. **Collect any outstanding payments** from members with "Payable" status
6. **Create new month** (carries forward final balances as previous balances)
7. **Unlock new month** for new month's operations

---

## 💻 Tech Stack & Setup

### Technologies Used
| **Category** | **Details** |
|-------------|-------------|
| **Frontend** | React 19, Vite 6, Tailwind CSS 4 |
| **State Management** | React Context API (AppContext) with Firebase sync |
| **Backend/Firestore** | Firebase Firestore (experimental long polling for unstable connections) |
| **PDF Generation** | `jspdf` with `html2canvas` support |
| **Authentication** | Custom username/password with SHA-256 hashing (client-side + Web Crypto API) |
| **Icons** | Lucide React |
| **Calculation Logic** | Pure JavaScript in `src/utils/calculations.ts` |
| **AI Integration** | `@google/genai` (Gemini API — configured via AI Studio secrets) |
| **Backup/Restore** | JSON serialization/deserialization with localStorage/sessionStorage persistence |

### 📦 Local Installation

#### Prerequisites
- **Node.js** (v18 or recommended v20+)
- **npm**, **yarn**, **pnpm**, or **bun** (this project uses `bun`)
- **Firebase project** with Firestore enabled (configured in `firebase-applet-config.json`)

#### Installation Steps

1. **Clone or download the project**
   ```bash
   git clone <repository-url>
   cd smart-meal-manager
   ```

2. **Install dependencies**
   ```bash
   bun install
   # or: npm install
   # or: pnpm install
   ```

3. **Configure Firebase** (if not already configured by AI Studio):
   - The app uses a pre-configured Firebase project (`elaborate-box-72ts5`)
   - If you need your own Firebase project:
     - Create a Firebase project at console.firebase.google.com
     - Enable Firestore Database
     - Replace `firebase-applet-config.json` with your config
     - Ensure Firestore rules allow read/write for development

4. **Start the development server**
   ```bash
   bun run dev
   # or: npm run dev
   ```
   
   The app will be available at `http://localhost:3000` (or the port specified)

5. **Default login credentials** (from seed data):
   - **Master Key**: `sabbirprogrammer` / `ASmin1234`
   - **Manager**: `manager` / `manager123`

6. **Begin using MealMess**:
   - Log in with appropriate role
   - Start by creating members, recording deposits, and logging daily meals
   - Add bazaar and universal expenses as they occur
   - Generate PDF reports at month-end

### 🛠️ Development Notes
- **Master Key is strictly `sabbirprogrammer`** — no other account can achieve master access
- **Password hashing**: Uses Web Crypto API (`window.crypto.subtle`) with SHA-256 fallback to pure JS implementation
- **Firestore connection**: Uses experimental long polling (`experimentalForceLongPolling: true`) for stability in sandboxed environments
- **Cloud sync**: Automatic background sync to Firestore with 400ms debounce to aggregate rapid inputs
- **Local persistence**: State saved to `localStorage`/`sessionStorage` key `smart_meal_manager_state_v1`
- **Backup files**: JSON format, strictly sanitized to preserve only Master Key and Manager users
- **Month locking**: Enforced both in UI and calculation logic — locked months are read-only for all operations

### 📁 Project Structure (Key Files)
```
src/
├── App.tsx           # Main app router with hash-based navigation
├── context/AppContext.tsx  # React context with auth, state, and all handlers
├── types.ts          # TypeScript interfaces for all data models
├── utils/
│   ├── calculations.ts   # Meal rate, balance calculation engine
│   ├── crypto.ts         # SHA-256 password hashing
│   └── initialData.ts    # Seed data for initial setup
├── components/       # UI components (Modals, Navbar, BottomNav, etc.)
├── screens/          # Page screens (Dashboard, Members, Meals, Expenses, Reports, Settings)
└── firebase.ts       # Firebase initialization and Firestore helper functions
```

### 📜 Firebase Firestore Rules
**Important**: Current rules allow unrestricted read/write:
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /workspaces/{workspaceId} {
      allow read, write: if isValidId(workspaceId);
    }
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```
**For production**: Update rules to enforce role-based access control matching the client-side permissions described in this README.

### 🔐 Security & Best Practices
- **Never share Master Key credentials** — only the designated administrator should have access
- **Regular backups** before making significant changes (new months, large data imports)
- **Month locking** after settlement to prevent accidental alterations
- **Password strength**: Minimum 4 characters (enforced in client validation)
- **Audit trail**: All changes are logged with user, action, target, and details
- **Offline support**: Local state persists offline; syncs when connection restores

---

## 🆘 Need Help?

- **Forgot password**: Only the Master Key holder can create new user accounts
- **Stuck on a feature**: Check the corresponding screen's help text or disabled buttons (grayed out = permission restricted)
- **Data not syncing**: Ensure internet connection; the app auto-syncs to cloud Firestore with debounced writes
- **Report issues**: Review the audit logs in Settings → Audit Search to see recent changes

---

**MealMess** — Transparent, automated, and community-powered shared mess financial management.

*Documentation generated from codebase inspection. Last updated: November 2026.*