import re
import os

input_file = r"c:\Users\ASUS\OneDrive\Desktop\SDIT LUQMANUL HAKIM\Tahfizh sdit luqman\Database siswa tahfizh\kelas_1.md"
output_file = r"c:\Users\ASUS\OneDrive\Documents\github tahsin\tahsinsdit\insert_kelas_1.sql"

with open(input_file, 'r', encoding='utf-8') as f:
    lines = f.readlines()

sql = "BEGIN;\n\n"
current_rombel = None

for line in lines:
    rombel_match = re.search(r"# KELAS I - ([A-D])", line)
    if rombel_match:
        current_rombel = rombel_match.group(1)
        continue
    
    student_match = re.search(r"^\s*\d+\s+(.+)$", line)
    if student_match and current_rombel:
        nama = student_match.group(1).strip()
        if "Nama Siswa" in nama or "----" in nama:
            continue
        # Escape single quotes in SQL
        nama_escaped = nama.replace("'", "''")
        sql += f"INSERT INTO public.students (nama, kelas, rombel, level, halaman_terakhir, status_bacaan, status_siswa) VALUES ('{nama_escaped}', 1, '{current_rombel}', 'Iqro 1', 0, 'Lancar', 'aktif');\n"

sql += "\nCOMMIT;\n"

with open(output_file, 'w', encoding='utf-8') as f:
    f.write(sql)

print(f"Generated {output_file} successfully.")
