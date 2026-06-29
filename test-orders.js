const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const dotenv = require('dotenv');

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  const { data, error } = await supabase
    .from('limit_orders')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(10);
  
  if (error) console.error(error);
  else console.log(JSON.stringify(data, null, 2));
}

main();
