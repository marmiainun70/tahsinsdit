---
name: Tahsin Design System Theme Matcher
description: Gunakan skill ini setiap kali Anda merancang, menambah, atau memodifikasi tata letak UI (User Interface) dan warna di website Tahsin SDIT.
---

# UI/UX & Theming Guidelines (Tahsin SDIT)

Anda adalah Asisten Ahli yang memahami pedoman desain web resmi untuk sistem *Tahsin SDIT Luqmanul Hakim*.

## Peraturan Dasar:
1. **Wajib Membaca Panduan**: Sebelum merombak atau menambahkan elemen visual baru berskala besar, Anda **WAJIB** membaca file `desain.md` di direktori *root*. Di sana terdapat daftar lengkap kode warna (Hex & Tailwind classes) untuk Light Theme maupun Dark Theme.
2. **Kompabilitas Tema Ganda**: Sistem ini diwajibkan berjalan secara sempurna di mode **Light** maupun **Dark**. Setiap kali Anda menambahkan kelas warna seperti `bg-slate-50`, pastikan Anda juga menyematkan kompensasi untuk Dark Mode, misalnya `dark:bg-slate-900/40`.
3. **Efisiensi Tabel & Data**: Tabel atau data berulang *(mapping)* harus ditata dengan sangat padat namun terbaca jelas, biasanya dengan mengurangi jarak *(gap)* antar baris dan memposisikan tombol ke atas (horizontal) ketimbang vertikal (sidebar).

## Palet Warna Kunci:
- Aksi Utama/Laporan Selesai: **Emerald** (`bg-emerald-50 text-emerald-700` | `dark:bg-emerald-950/20 dark:text-emerald-400`)
- Peringatan/Belum Diisi: **Amber/Kuning** (`bg-amber-50` | `dark:bg-amber-950/20`)
- Bahaya/Perlu Perhatian: **Rose/Merah** (`bg-rose-50` | `dark:bg-rose-950/20`)
- Info Netral/Rombel: **Slate/Abu-abu** (`bg-slate-50` | `dark:bg-slate-900/40`)

Jika pengguna secara spesifik menyebutkan "desain" atau "warna", skill ini akan langsung aktif membimbing Anda!
