import fs from 'fs';
import path from 'path';

async function main() {
  const nseStocksPath = path.join(__dirname, 'lib', 'nse-stocks.json');
  const bseStocksPath = path.join(__dirname, 'lib', 'bse-stocks.json');

  const nseData = fs.readFileSync(nseStocksPath, 'utf8');
  const nseStocks = JSON.parse(nseData);

  const bseStocks = nseStocks.map((stock: any) => {
    return {
      symbol: stock.symbol.replace('NSE_EQ|', 'BSE_EQ|'),
      ticker: stock.ticker,
      name: stock.name,
      sector: stock.sector || 'Other',
      exchange: 'BSE',
      isin: stock.isin
    };
  });

  fs.writeFileSync(bseStocksPath, JSON.stringify(bseStocks, null, 2));
  console.log(`Successfully generated ${bseStocks.length} BSE stocks based on the NSE master list!`);
}

main();
