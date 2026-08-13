# Panduan Deployment ke Vercel (Gratis & Cepat)

Panduan ini akan membantu Anda mengupload aplikasi Wedding Planner ke internet menggunakan Vercel.

## 1. Persiapan Database (Supabase)

Pastikan Anda sudah memiliki URL & Key Supabase Anda.
1. Buka [Supabase Dashboard](https://supabase.com/dashboard).
2. Pilih Project Anda.
3. Masuk ke **Settings** (icon gerigi) -> **API**.
4. Simpan dua data ini:
   - **Project URL**
   - **Project API Key (anon/public)**

## 2. Upload ke GitHub

Karena folder ini sudah di-inisialisasi sebagai Git repository, langkah selanjutnya adalah mengirimnya ke GitHub.

1. Buka [GitHub.com](https://github.com/new) dan buat **New Repository**.
   - Nama: `wedding-planner` (atau terserah Anda)
   - Visibility: **Public** atau **Private** (Vercel support keduanya).
   - **JANGAN** centang "Add a README file".

2. Setelah jadi, GitHub akan menampilkan halaman dengan perintah. Copy bagian **"…or push an existing repository from the command line"**.

3. Buka Terminal di VS Code (Ctrl+J), pastikan ada di folder `wedding-planner`, lalu jalankan perintah dari GitHub tadi. Biasanya seperti ini:
   ```bash
   git remote add origin https://github.com/USERNAME/wedding-planner.git
   git branch -M main
   git push -u origin main
   ```

## 3. Deploy ke Vercel

1. Buka [Vercel.com](https://vercel.com) dan Login (bisa pakai akun GitHub).
2. Klik tombol **"Add New..."** -> **"Project"**.
3. Di bagian **"Import Git Repository"**, cari repo `wedding-planner` yang baru Anda upload, klik **Import**.
4. Di bagian **Configure Project**:
   - **Framework Preset**: Pilih `Next.js` (biasanya otomatis).
   - **Root Directory**: Biarkan `./`.
   - **Build and Output Settings**: Biarkan default.
   - **Environment Variables** (PENTING!):
     Klik tanda panah untuk membuka menu ini. Masukkan data Supabase Anda di sini:
     
     | Key | Value |
     | --- | --- |
     | `NEXT_PUBLIC_SUPABASE_URL` | (Isi URL Project Supabase dari langkah 1) |
     | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | (Isi Key Project Supabase dari langkah 1) |
     | `SUPABASE_SERVICE_ROLE_KEY` | (Settings -> API -> `service_role`. Dipakai photobooth) |
     | `PHOTOBOOTH_ADMIN_KEY` | (Karang sendiri, bebas. Dipakai photobooth) |

5. Klik **Deploy**.

## 4. Selesai!

Tunggu 1-2 menit. Vercel akan memproses build aplikasi Anda. Jika sukses, Anda akan mendapatkan domain (contoh: `wedding-planner-faisal.vercel.app`).

Selamat! Aplikasi Anda sudah online. 🎉

## 5. Menyiapkan Photobooth Digital

Fitur photobooth (tamu memindai QR di venue lalu berfoto dengan bingkai polaroid)
butuh dua langkah tambahan.

### a. Buat tabel & bucket

Buka **Supabase Dashboard -> SQL Editor**, tempel seluruh isi file
`supabase/photobooth.sql` dari repo ini, lalu jalankan. Sekali saja.

### b. Isi dua environment variable

Dua kunci di tabel langkah 3 wajib diisi, kalau tidak tombol hapus & sembunyikan
tidak berfungsi:

- **`SUPABASE_SERVICE_ROLE_KEY`** — kunci penuh Supabase. **Jangan pernah** diberi
  awalan `NEXT_PUBLIC_`; kunci berawalan itu ikut terkirim ke browser setiap tamu.
- **`PHOTOBOOTH_ADMIN_KEY`** — kata sandi karangan Anda sendiri (mis.
  `bunga-melati-2026`). Dimasukkan sekali di halaman **Photobooth** pada dashboard,
  lalu tersimpan di browser Anda.

### c. Cetak QR-nya

Buka menu **Photobooth** di dashboard, klik **Unduh QR Resolusi Cetak**, lalu cetak
jadi standee atau kartu meja. QR itu mengarah ke `/kenangan`.

Catatan: minta tamu memindai QR dengan **kamera bawaan HP**. Link yang dibuka dari
dalam aplikasi WhatsApp atau Instagram kadang tidak diizinkan memakai kamera —
halaman tamu sudah menyediakan jalur cadangan bila itu terjadi.

### d. Mengganti bingkai polaroid

Bingkai bawaan di `public/photobooth/frames/` masih sementara. Untuk memakai desain
sendiri, siapkan file **PNG dengan area foto transparan** (berlubang), taruh di folder
yang sama, lalu sesuaikan `src`, `width`, `height`, dan `slots` di
`lib/photobooth/frames.ts`. Kalau nama mempelai sudah tercetak di dalam desainnya,
hapus bagian `caption` supaya namanya tidak tertulis dua kali.
