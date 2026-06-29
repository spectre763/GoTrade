async function main() {
  const res = await fetch('http://localhost:3000/api/trade/limit', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    // I can't easily fetch without auth cookies.
  });
}
