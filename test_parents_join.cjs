const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const envFile = fs.readFileSync('.env.local', 'utf-8');
const SUPABASE_URL = envFile.match(/VITE_SUPABASE_URL=(.+)/)[1];
const SUPABASE_ANON_KEY = envFile.match(/VITE_SUPABASE_ANON_KEY=(.+)/)[1];

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function run() {
  const { data, error } = await supabase
    .from('parents')
    .select('student_id, students(*)');
  console.log('Error:', error);
  console.log('Data:', JSON.stringify(data?.slice(0, 2), null, 2));
}

run();
