# GoTrade 📈

GoTrade is a modern, feature-rich stock market trading simulator built with Next.js and Supabase. Experience the thrill of the markets with real-time data, advanced order types, and competitive leaderboards—all without risking real money.

## 🚀 Features

- **Real-Time Market Data**: Live stock quotes, historical price charts, and financial news powered by Yahoo Finance.
- **Advanced Trading Capabilities**: 
  - **Market Orders**: Buy/Sell instantly at the current market price.
  - **Limit Orders**: Set a specific price to automatically execute trades when the market reaches your target.
  - **Stop-Loss & Take-Profit**: Manage risk automatically by setting exit triggers.
- **Interactive Portfolio Management**: 
  - Track your net worth over time with dynamic charts.
  - Visualize your investments with sector allocation breakdowns.
  - View detailed transaction history.
- **Custom Price Alerts**: Set alerts for your favorite stocks and get notified in real-time when price targets are hit.
- **Global Leaderboard**: Compete against other traders globally to see who can build the most profitable portfolio.
- **Secure Authentication**: Robust user sign-up, login, and secure session management via Supabase Auth.
- **Personalized Watchlists**: Keep a close eye on your favorite stocks in one convenient dashboard.

## 🛠️ Tech Stack

- **Frontend**: Next.js 15 (App Router), React, Tailwind CSS, Recharts (for dynamic data visualization)
- **Backend / API**: Next.js API Routes, Supabase (PostgreSQL database, Row Level Security)
- **Market Data**: Custom integrations utilizing Yahoo Finance API for quotes, charts, and news.
- **Design**: Fully responsive, dark-mode optimized UI with premium animations and dynamic backgrounds.

## 🏃‍♂️ Running Locally

1. **Clone the repository:**
   ```bash
   git clone https://github.com/spectre763/GoTrade.git
   cd GoTrade
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up environment variables:**
   Create a `.env.local` file in the root directory and add your Supabase credentials:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   ```

4. **Run the development server:**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) to view the app in your browser.

## 🗄️ Database Setup (Supabase)

The project includes SQL migration scripts to instantly set up the required schema. You can run the `.sql` files found in `/supabase/migrations/` sequentially in your Supabase SQL editor to create the tables for portfolios, transactions, limit orders, price alerts, and the corresponding Row Level Security (RLS) policies.
