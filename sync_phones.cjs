const { createClient } = require("@supabase/supabase-js");
const fs = require("fs");
const envContent = fs.readFileSync(".env_utf8", "utf8");
const envVars = {};
envContent.split(/\r?\n/).forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) {
    envVars[match[1].trim().replace(/^\uFEFF/, '')] = match[2].trim();
  }
});

const projectId = envVars.VITE_SUPABASE_PROJECT_ID?.replace(/['"\r]/g, '')?.trim();
const supabaseUrl = projectId ? `https://${projectId}.supabase.co` : envVars.VITE_SUPABASE_URL?.replace(/['"\r]/g, '')?.trim();
const supabaseKey = (envVars.VITE_SUPABASE_PUBLISHABLE_KEY || envVars.VITE_SUPABASE_ANON_KEY)?.replace(/['"\r]/g, '')?.trim();

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials in .env");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function syncPhones() {
  console.log("Fetching teacher_profiles...");
  const { data: teacherProfiles, error: tpError } = await supabase
    .from("teacher_profiles")
    .select("user_id, phone")
    .not("phone", "is", null);

  if (tpError) {
    console.error("Error fetching teacher profiles:", tpError);
    return;
  }

  console.log(`Found ${teacherProfiles.length} teacher profiles with a phone number.`);

  let updatedCount = 0;
  for (const profile of teacherProfiles) {
    if (profile.phone && profile.phone.trim() !== "") {
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ whatsapp: profile.phone })
        .eq("user_id", profile.user_id);

      if (updateError) {
        console.error(`Error updating whatsapp for user ${profile.user_id}:`, updateError);
      } else {
        updatedCount++;
      }
    }
  }

  console.log(`Successfully synced ${updatedCount} phone numbers to profiles.whatsapp.`);
}

syncPhones();
