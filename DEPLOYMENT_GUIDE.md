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

5. Klik **Deploy**.

## 4. Selesai!

Tunggu 1-2 menit. Vercel akan memproses build aplikasi Anda. Jika sukses, Anda akan mendapatkan domain (contoh: `wedding-planner-faisal.vercel.app`).

Selamat! Aplikasi Anda sudah online. 🎉
