const fs = require('fs');
const path = require('path');

const CSV_URL = "https://nsearchives.nseindia.com/content/equities/EQUITY_L.csv";
const OUTPUT_FILE = path.join(__dirname, '../lib/nse-stocks.json');

// Existing mappings to preserve custom sectors for Nifty 50 stocks
const SECTOR_MAPPING = {
  "RELIANCE": "Energy",
  "TCS": "IT",
  "HDFCBANK": "Banking",
  "INFY": "IT",
  "ICICIBANK": "Banking",
  "SBIN": "Banking",
  "WIPRO": "IT",
  "BHARTIARTL": "Telecom",
  "HCLTECH": "IT",
  "LT": "Construction",
  "BAJFINANCE": "NBFC",
  "KOTAKBANK": "Banking",
  "NESTLEIND": "FMCG",
  "HINDUNILVR": "FMCG",
  "ITC": "FMCG",
  "ADANIENT": "Conglomerate",
  "ONGC": "Energy",
  "POWERGRID": "Utilities",
  "TATAMOTORS": "Automobile",
  "TATASTEEL": "Metals",
  "SUNPHARMA": "Pharma",
  "DRREDDY": "Pharma",
  "BAJAJFINSV": "Financial Services",
  "TITAN": "Consumer Goods",
  "MARUTI": "Automobile",
  "ULTRACEMCO": "Cement",
  "AXISBANK": "Banking",
  "ASIANPAINT": "Paints",
  "ADANIPORTS": "Infrastructure",
  "INDUSINDBK": "Banking",
  "M&M": "Automobile",
  "NTPC": "Utilities",
  "CIPLA": "Pharma",
  "GRASIM": "Diversified",
  "COALINDIA": "Mining",
  "TECHM": "IT",
  "HEROMOTOCO": "Automobile",
  "JSWSTEEL": "Metals",
  "HDFCLIFE": "Insurance",
  "EICHERMOT": "Automobile",
  "SBILIFE": "Insurance",
  "TATACONSUM": "FMCG",
  "DIVISLAB": "Pharma",
  "BPCL": "Energy",
  "BRITANNIA": "FMCG",
  "APOLLOHOSP": "Healthcare",
  "SHREECEM": "Cement",
  "ZOMATO": "Technology"
};

function parseCSV(text) {
  const lines = text.split(/\r?\n/).filter(Boolean);
  if (lines.length === 0) return [];
  const headers = lines[0].split(',').map(h => h.trim().toUpperCase());
  
  const results = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    const row = [];
    let inQuotes = false;
    let current = '';
    
    for (let c = 0; c < line.length; c++) {
      const char = line[c];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        row.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    row.push(current.trim());
    
    if (row.length >= headers.length) {
      const entry = {};
      headers.forEach((h, idx) => {
        entry[h] = row[idx];
      });
      results.push(entry);
    }
  }
  return results;
}

async function run() {
  console.log(`Fetching NSE equities CSV from ${CSV_URL}...`);
  
  const res = await fetch(CSV_URL, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      Accept: "text/csv,application/csv",
    }
  });

  if (!res.ok) {
    throw new Error(`Failed to download: ${res.status} ${res.statusText}`);
  }

  const csvText = await res.text();
  console.log("Parsing CSV...");
  const rawRows = parseCSV(csvText);
  console.log(`Found ${rawRows.length} raw rows. Filtering and formatting...`);

  // Filter only standard EQ series (ordinary equities)
  const filteredRows = rawRows.filter(row => {
    const series = (row['SERIES'] || '').trim().toUpperCase();
    return series === 'EQ';
  });

  // Deduplicate and map
  const seenTickers = new Set();
  const stocks = [];

  for (const row of filteredRows) {
    const symbol = (row['SYMBOL'] || '').trim();
    const name = (row['NAME OF COMPANY'] || '').trim();
    const isin = (row['ISIN NUMBER'] || '').trim();

    if (!symbol || !isin) continue;
    if (seenTickers.has(symbol)) continue;
    seenTickers.add(symbol);

    const sector = SECTOR_MAPPING[symbol] || "Other";

    stocks.push({
      symbol: `NSE_EQ|${isin}`,
      ticker: symbol,
      name: name,
      sector: sector,
      exchange: "NSE",
      isin: isin
    });
  }

  console.log(`Formatted ${stocks.length} stocks. Writing to ${OUTPUT_FILE}...`);
  fs.mkdirSync(path.dirname(OUTPUT_FILE), { recursive: true });
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(stocks, null, 2), 'utf-8');
  console.log("Done successfully!");
}

run().catch(err => {
  console.error("Error fetching/parsing NSE list:", err);
  process.exit(1);
});
