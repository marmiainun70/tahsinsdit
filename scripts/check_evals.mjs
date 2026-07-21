import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const envText = fs.readFileSync('.env', 'utf-8');
const envVars = {};
envText.split('\n').forEach(line => {
  const match = line.match(/^\s*([^=]+?)\s*=\s*"?([^"]+)"?\s*$/);
  if (match) envVars[match[1]] = match[2].trim();
});

const supabase = createClient(envVars.VITE_SUPABASE_URL, envVars.VITE_SUPABASE_PUBLISHABLE_KEY);

async function main() {
  const { data: raisha } = await supabase.from('students').select('*').ilike('nama', '%Raisha%Shanika%').single();
  const { data: izza } = await supabase.from('students').select('*').ilike('nama', '%Izza%Hilyah%').single();
  
  console.log("Raisha:", raisha?.id, raisha?.nama);
  console.log("Izza:", izza?.id, izza?.nama);
  
  const { count: evalCount } = await supabase.from('evaluasi_awal_semester').select('*', { count: 'exact', head: true });
  console.log("Total evaluations:", evalCount);
  
  if (raisha) {
    const { data: raishaEvals } = await supabase.from('evaluasi_awal_semester').select('*').eq('student_id', raisha.id);
    console.log("Raisha evals:", raishaEvals?.length);
  }
}

main().catch(console.error);
