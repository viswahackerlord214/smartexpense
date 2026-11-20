# SpendWise • Smart Personal Finance & Automated Expense Tracker

SpendWise is a production-grade personal finance application with a premium fintech interface (inspired by Linear, Revolut, and Apple) and a strong focus on **automation**.

Whenever you receive a bank transaction SMS on your iPhone (from **HDFC, ICICI, SBI, Federal Bank / FEDX, Axis, Kotak**, etc.), Apple Shortcuts detects the message, extracts the transaction details via SpendWise's secure API, saves it, and dispatches an actionable iOS push notification directly to your iPhone lock screen.

**Your only regular manual task is selecting the category of an expense with 1 tap.**

---

## Architecture & Tech Stack

- **Frontend**: Next.js 14 (App Router), React 18, TypeScript, Tailwind CSS, Lucide React icons, Framer Motion.
- **Charts & Visualizations**: Recharts (interactive Line/Area trends, Category donut chart with drilldown, Daily rhythm bars, Month-over-Month comparison, Calendar Heatmap).
- **Backend**: Next.js App Router API Routes (`POST /api/transactions/import`, `POST /api/transactions/[id]/categorize`, etc.).
- **Database**: Supabase PostgreSQL with Row Level Security (RLS) policies, indexes, and full migrations (`supabase/migrations/20261120_init.sql`), with an in-memory/localStorage sandbox fallback out of the box.
- **Push Notifications**: Web Push API, VAPID, Service Worker (`public/sw.js`), PWA Manifest, iOS 16.4+ Home Screen support.

---

## Core Screens & Features

1. **Fintech Dashboard (`/`)**:
   - Total Monthly Expenses, Income, Net Cash Flow, Daily Spending Rate.
   - Actionable "Pending Categorization" badge pill.
   - Interactive Spending Trend Area Chart (Daily, Weekly, Monthly, Yearly).
   - Category Donut Breakdown with center total label & drilldown.
   - Daily Spending Rhythm Bar Chart with day click inspection drawer.
   - Spending Heatmap (31-day visual intensity matrix).
   - Month-over-Month multi-month comparison chart.
   - Dynamic Spending Insights engine.

2. **Actionable 1-Tap Categorization Screen**:
   - Deep-linked directly from iPhone push notifications (`/?categorize=<id>`).
   - Displays bold formatted amount (₹), bank sender, merchant, and timestamp.
   - 1-tap category selection across 16 curated categories + custom categories.
   - Instant optimistic save with celebration checkmark confirmation.

3. **Transactions Page (`/transactions`)**:
   - Date presets: Today, Yesterday, Last 7d, Last 30d, This Week, Prev Week, This Month, Prev Month, This Year, Custom.
   - Month-wise multi-month selector (Jan, Feb, Mar...).
   - Multi-category filter chips, amount range sliders, bank & type filters.
   - Advanced Custom Boolean Filter Builder supporting nested **AND / OR** logic.
   - Reusable saved filter views.
   - Instant CSV export.

4. **Monthly Expense Analytics (`/analytics`)**:
   - Calendar spending heatmap.
   - Highest & lowest spending days.
   - Weekday vs. Weekend spending pattern.
   - Top merchant destinations leaderboard.
   - Recurring bill & subscription detector (Netflix, Rent, BESCOM, etc.).

5. **Budget Management (`/budgets`)**:
   - Overall monthly master cap.
   - Category-specific spending limits.
   - Visual progress bars with color-coded thresholds: 75% Warning (amber), 90% Critical (orange), 100% Exceeded (rose).

6. **Interactive SMS Testing Playground (`/sms-tester`)**:
   - Paste any bank SMS or load pre-configured bank samples (HDFC, ICICI, SBI, Federal Bank, Axis).
   - Live extraction breakdown: Amount, Normalized Merchant, Bank, Reference/UPI, and Confidence Score.
   - Security filters: Automatic rejection of OTPs, promotional messages, and balance queries.
   - "Simulate iPhone Shortcuts Webhook" button.

7. **Apple Shortcuts Setup Guide (`/shortcuts-guide`)**:
   - Step-by-step iOS walkthrough with exact actions, URL, JSON payload format, and Bearer token.

---

## iPhone Apple Shortcuts Configuration

### Step 1: Open Shortcuts
1. Open the native **Shortcuts** app on your iPhone (iOS 16.4+).
2. Tap the **Automation** tab at the bottom.
3. Tap **+** (New Automation) &rarr; Select **Message**.

### Step 2: Automation Trigger
- **Sender**: Leave blank (to match all banks) or specify bank numbers/shortcodes (`HDFCBK`, `ICICIB`, `SBIINB`, `FEDX`, `AXISBK`).
- **Message Contains**: `debited` (create matching rules for `spent`, `credited`, `refund`).
- **When**: Select **Run Immediately** (disable *Ask Before Running*).

### Step 3: Action Setup
1. Add Action &rarr; Search for **Get Contents of URL**.
2. **URL**: `https://<your-app-domain>/api/transactions/import`
3. **Method**: `POST`
4. **Headers**:
   - `Content-Type`: `application/json`
   - `Authorization`: `Bearer sw_live_sec_8f9a2b4e7c1d3a5f6e8b0c2d4e6f8a0b`
5. **Request Body**: `JSON`
   - `message` (Text) &rarr; `Shortcut Input`
   - `sender` (Text) &rarr; `Shortcut Input.Sender`
   - `timestamp` (Date) &rarr; `Current Date`

---

## Running Locally

```bash
# 1. Install dependencies
npm install

# 2. Run development server
npm run dev

# 3. Or build and run production server
npm run build
PORT=3001 npm run start
```

Open `http://localhost:3001` in your browser.

