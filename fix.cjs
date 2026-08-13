const fs = require('fs');
const path = require('path');
function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(function(file) {
    file = dir + '/' + file;
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) { 
      results = results.concat(walk(file));
    } else { 
      if (file.endsWith('.tsx') || file.endsWith('.ts')) results.push(file);
    }
  });
  return results;
}
const files = walk('./src');
let changedCount = 0;
files.forEach(f => {
  let content = fs.readFileSync(f, 'utf8');
  let original = content;
  // Replace const isAdmin = profile?.role === 'admin';
  content = content.replace(/profile\?\.role === ([\"'])admin\1/g, '(profile?.role === "admin" || profile?.role === "kepala_sekolah")');
  // Handle other variations like role === 'admin'
  content = content.replace(/ role === ([\"'])admin\1/g, ' (role === "admin" || role === "kepala_sekolah")');
  // Handle account.role === 'admin'
  content = content.replace(/account\.role === ([\"'])admin\1/g, '(account.role === "admin" || account.role === "kepala_sekolah")');

  // Also fix user_roles upsert in ManageAccounts.tsx
  if(f.includes('ManageAccounts.tsx')) {
    content = content.replace(/supabase\.from\("user_roles"\)\.update\(\{([\s\S]*?)\}\)\.eq\("user_id", userId\);/g, 'supabase.from("user_roles").upsert({\n        user_id: userId,\n        role: editForm.role as "admin" | "guru" | "parent" | "kepala_sekolah"\n      });');
    
    // Add kepala_sekolah to the edit options
    if(!content.includes('<option value="kepala_sekolah">')) {
      content = content.replace(/<option value="parent">Orang Tua<\/option>/g, '<option value="parent">Orang Tua</option>\n                          <option value="kepala_sekolah">Kepala Sekolah</option>');
    }
    
    // Add kepala_sekolah to role filter
    if(!content.includes('<option value="kepala_sekolah">Kepala Sekolah</option>') && content.includes('<option value="admin">Admin</option>')) {
        content = content.replace(/<option value="admin">Admin<\/option>/g, '<option value="admin">Admin</option>\n            <option value="kepala_sekolah">Kepala Sekolah</option>');
    }

    // Fix error logging to show error on screen!
    content = content.replace(/if \(roleError\) \{\s*console\.warn\("Gagal memperbarui tabel user_roles: ", roleError\.message\);\s*\}/, 'if (roleError) {\n         setActionError("Gagal memperbarui tabel user_roles: " + roleError.message);\n         setIsSavingEdit(false);\n         return;\n      }');
  }

  if (content !== original) {
    fs.writeFileSync(f, content);
    console.log('Updated: ' + f);
    changedCount++;
  }
});
console.log('Total files changed:', changedCount);
