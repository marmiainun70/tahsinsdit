const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// Baca URL dari .env
const envContent = fs.readFileSync('.env', 'utf8');
const env = envContent.split('\n').reduce((acc, line) => {
  const [k, ...vParts] = line.split('=');
  const v = vParts.join('=');
  if (k && v) acc[k] = v.replace(/"/g, '').trim();
  return acc;
}, {});

const supabaseUrl = env.VITE_SUPABASE_URL;

// SERVICE_ROLE_KEY harus diberikan melalui argumen atau environment
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.argv[2];

if (!serviceRoleKey) {
  console.error("❌ ERROR: Tolong berikan SUPABASE_SERVICE_ROLE_KEY.");
  console.log("Contoh penggunaan: node reset_password.cjs <SERVICE_ROLE_KEY> <email_atau_username> <password_baru>");
  process.exit(1);
}

const identifier = process.argv[3];
const newPassword = process.argv[4];

if (!identifier || !newPassword) {
  console.error("❌ ERROR: Argumen tidak lengkap.");
  console.log("Contoh penggunaan: node reset_password.cjs <SERVICE_ROLE_KEY> \"ilha aulia\" \"PasswordBaru123\"");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function run() {
  console.log(`Mencari pengguna dengan nama/email: ${identifier}...`);
  
  // Cari di tabel profiles
  const { data: profiles, error: profileErr } = await supabase
    .from('profiles')
    .select('user_id, full_name, username')
    .ilike('full_name', `%${identifier}%`);

  if (profileErr) {
    console.error("Gagal mencari profil:", profileErr);
    return;
  }

  if (!profiles || profiles.length === 0) {
    console.log("❌ Pengguna tidak ditemukan di tabel profiles.");
    return;
  }

  if (profiles.length > 1) {
    console.log("⚠️ Ditemukan lebih dari 1 pengguna dengan nama tersebut. Tolong lebih spesifik:");
    console.table(profiles);
    return;
  }

  const targetUser = profiles[0];
  console.log(`✅ Ditemukan: ${targetUser.full_name} (ID: ${targetUser.user_id})`);
  console.log(`Mengatur password baru menjadi: ${newPassword}`);

  const { data, error } = await supabase.auth.admin.updateUserById(
    targetUser.user_id,
    { password: newPassword }
  );

  if (error) {
    console.error("❌ Gagal mereset password:", error.message);
  } else {
    console.log("✅ Berhasil! Password telah direset.");
  }
}

run();
