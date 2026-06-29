import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const envLocal = fs.readFileSync('.env.local', 'utf8');
const SUPABASE_URL = envLocal.match(/NEXT_PUBLIC_SUPABASE_URL=(.*)/)?.[1] ?? '';
const SUPABASE_KEY = envLocal.match(/SUPABASE_SERVICE_ROLE_KEY=(.*)/)?.[1] ?? '';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function main() {
  const { data: user } = await supabase.from('profiles').select('id').limit(1).single();
  if (!user) return console.log('no user');

  const { data, error } = await supabase.from('limit_orders').insert({
    user_id: user.id,
    symbol: 'NSE_EQ|INE467B01029',
    ticker: 'TCS',
    name: 'Tata Consultancy Services',
    type: 'SELL',
    quantity: 10,
    target_price: 3000,
    order_type: 'LIMIT',
    status: 'PENDING'
  }).select();

  console.log(error || data);
}
main();
