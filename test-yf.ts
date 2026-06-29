import yahooFinance from 'yahoo-finance2';

async function main() {
  try {
    const res = await yahooFinance.quote('RELIANCE.BO');
    console.log(res);
  } catch (e: any) {
    console.error(e.message);
  }
}

main();
