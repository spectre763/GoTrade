# GoTrade 📈 ---- check the website here: https://gotrade-new.vercel.app/

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

<img width="1710" height="883" alt="Screenshot 2026-06-30 at 3 18 37 PM" src="https://github.com/user-attachments/assets/412d0f4a-8923-4790-b9ab-2665b2c36ef1" />

<img width="1710" height="954" alt="Screenshot 2026-06-30 at 3 36 37 PM" src="https://github.com/user-attachments/assets/a6419128-01f0-48eb-96e2-37a553854889" />

<img width="1710" height="891" alt="Screenshot 2026-06-30 at 3 20 45 PM" src="https://github.com/user-attachments/assets/8824d61d-0eb2-48a0-9c16-0ab5e0436728" />

<img width="1705" height="845" alt="Screenshot 2026-06-30 at 3 22 13 PM" src="https://github.com/user-attachments/assets/e6367f56-5400-42a7-ad84-8cf31f96e57d" />

<img width="1710" height="867" alt="Screenshot 2026-06-30 at 3 22 36 PM" src="https://github.com/user-attachments/assets/c7b6c64a-1884-4194-929c-acd0624d9df6" />

<img width="1710" height="840" alt="Screenshot 2026-06-30 at 3 22 48 PM" src="https://github.com/user-attachments/assets/4d55058f-82b6-4ab4-b3a0-b651c1ae048e" />

<img width="1710" height="890" alt="Screenshot 2026-06-30 at 3 22 59 PM" src="https://github.com/user-attachments/assets/851b8963-1d15-4516-aa05-924a9b1c6386" />

<img width="1710" height="898" alt="Screenshot 2026-06-30 at 3 23 09 PM" src="https://github.com/user-attachments/assets/3dbe76d3-f685-4fb1-870b-c4faa94f719e" />
