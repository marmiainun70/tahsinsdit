# Rencana: Redesign Halaman Login → "Aurora Sign Up" Islamic Modern

Mengadaptasi spesifikasi Aurora Sign Up (two-column, video hero, staggered animation) tapi diselaraskan dengan identitas visual project: **Forest Green deep + Gold accent + Plus Jakarta Sans + Amiri (Arabic)** — bukan hitam putih ala Aurora asli.

## Lingkup

- Hanya menyentuh `src/pages/Login.tsx` (form login yang sudah ada) — TIDAK menambah halaman baru, TIDAK mengubah `signIn` / `AuthContext`.
- Tetap memakai Tailwind v3 + token semantic di `index.css` (project ini bukan Tailwind v4). Tidak menambah font Inter — gunakan `Plus Jakarta Sans` yang sudah terdaftar.
- Tetap `framer-motion` (sudah dipakai), bukan `motion/react`.
- Form tetap **Login** (email + password) — bukan registrasi multi-step. Hanya bahasa visual & layout-nya yang mengikuti Aurora.

## Struktur Layout Baru

```text
<main> flex min-h-screen p-2 lg:p-4 bg-[hsl(var(--green-deep))]
 ├── Left Hero (lg:w-[52%], rounded-3xl, overflow-hidden)
 │    ├── <video> autoplay muted loop playsInline (URL persis seperti spec)
 │    ├── Lapisan halus gradient hijau→transparan dari bawah (HANYA agar teks terbaca,
 │    │   bukan tint penuh — spec asli melarang overlay; di sini kompromi minimal
 │    │   untuk kontras teks putih. Bila tidak diinginkan, hapus.)
 │    └── Konten z-10 (staggerChildren 0.15, delayChildren 0.2):
 │         • Brand: ikon BookOpen (gold) + "Tahsin SDIT" + baris arab "اقرأ"
 │         • Heading: "Selamat Datang" + sub "Tiga langkah singkat menuju ruang Anda."
 │         • 3 StepItem: "Masuk akun guru/admin" (active),
 │                       "Pantau progres siswa",
 │                       "Kelola laporan & ujian"
 │
 └── Right Form (flex-1, py-12 lg:py-6, px-4 sm:px-12 lg:px-16)
      └── motion.div fade-in 0.8s, w-full max-w-xl, space-y-8
           ├── Header: "Masuk ke Sistem" + sub "Monitoring Iqra & Tahsin Al-Qur'an"
           ├── (Tombol social DIHAPUS — project tidak pakai OAuth; mempertahankannya
           │    akan menyesatkan user. Diganti badge kecil "Akses guru & admin".)
           ├── Divider tipis gold/10 dengan teks "BISMILLAH"
           ├── InputGroup Email (ikon Mail)
           ├── InputGroup Password (ikon Lock + toggle Eye/EyeOff)
           ├── Pesan error (state lama tetap)
           ├── Submit "Masuk ke Sistem" — h-14 rounded-xl bg-gold text-green-deep
           │   font-semibold hover:opacity-90 active:scale-[0.98]
           └── Footer: "Belum punya akun? Hubungi admin sekolah."
```

## Penyesuaian Tema (Islamic Modern)

| Elemen spec asli | Adaptasi project |
|---|---|
| `bg-black` body | `bg-[hsl(var(--green-deep))]` |
| `bg-brand-gray #1A1A1A` (input/step inactive) | `bg-white/5` di atas hero, `bg-secondary` di sisi form |
| Tombol putih `bg-white text-black` | `bg-gold text-green-deep` (sudah ada token `--gold`) |
| Aksen putih (`text-white/60`, border `white/10`) | Di hero: tetap putih transparan agar kontras dengan video. Di form: `text-muted-foreground`, `border-border` |
| Font Inter | `Plus Jakarta Sans` (sudah aktif global) + `font-arabic` (Amiri) untuk satu kalimat khas |
| Ikon `Circle` brand | `BookOpen` (konsisten dengan brand existing) |

## Komponen yang Dibuat (lokal di `Login.tsx`)

1. **`StepItem({ number, text, active })`**
   - Active: `bg-gold/95 text-green-deep border border-gold` + lingkaran nomor `bg-green-deep text-gold`.
   - Inactive: `bg-white/5 text-white/70 border border-white/10` + nomor `bg-white/10 text-white/40`.
   - Rounded-2xl, padding `px-4 py-3`, flex gap-3.

2. **`InputGroup({ label, icon, ...inputProps })`**
   - Label: `text-sm font-medium text-foreground mb-2`.
   - Input: `bg-secondary border-none rounded-xl h-11 pl-10 pr-4 text-foreground placeholder:text-muted-foreground/50 focus:ring-2 focus:ring-primary/30`.
   - Icon absolut kiri.

(Komponen `SocialButton` dari spec **tidak dibuat** karena OAuth belum diaktifkan di project; menambahkan tombol non-fungsional akan menyesatkan user.)

## Animasi (framer-motion)

- Hero container: `initial={{ opacity: 0 }} animate={{ opacity: 1 }}` + child variants `y:10→0`, `opacity:0→1`, `duration:0.5`, `staggerChildren:0.15`, `delayChildren:0.2`.
- Form container: fade + slight scale, `duration:0.8`, `ease:"easeOut"`.

## Yang TIDAK Berubah

- Logika `signIn`, state `email/password/error/loading`, validasi, navigasi.
- Tidak menyentuh `index.css` (token Forest Green/Gold sudah lengkap).
- Tidak menyentuh `tailwind.config.ts`.
- Tidak menambah dependency.

## Catatan Klarifikasi

- **Video CloudFront** dari spec akan dipakai apa adanya. Bila preview-nya tidak cocok dengan nuansa islami (mis. tampil objek tidak relevan), opsi alternatif: pakai `src/assets/hero-pattern.png` lama sebagai background statis. **Default plan: pakai video sesuai spec.**
- **Overlay gradient bawah** ditambahkan tipis (hijau-deep → transparan ~40% di 1/3 bawah) hanya untuk keterbacaan teks. Spec asli melarang overlay; jika Anda mau strict no-overlay, sebut saja saat approve.

## Deliverable

- 1 file dimodifikasi: `src/pages/Login.tsx`.
