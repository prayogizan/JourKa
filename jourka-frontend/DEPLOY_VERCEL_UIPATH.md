# 🚀 Panduan Deploy Frontend ke Vercel & Integrasi ke Robot UiPath

Dokumen ini memandu langkah demi langkah untuk mempublikasikan `jourka-frontend` ke **Vercel (Gratis)** sekaligus menghubungkannya ke **Robot UiPath (`JourKa/Main.xaml`)**.

---

## Bagian 1 — Deploy `jourka-frontend` ke Vercel (2 Menit)

1. **Pastikan kode terbaru sudah di-push ke GitHub** (`prayogizan/JourKa`).
2. Buka **[vercel.com/new](https://vercel.com/new)** dan login dengan akun GitHub Anda.
3. Pilih repository **`prayogizan/JourKa`** $\rightarrow$ klik **Import**.
4. Pada bagian **Configure Project**, ubah pengaturan berikut:
   * **Framework Preset:** `Vite` (otomatis terdeteksi dari `vercel.json`)
   * **Root Directory:** klik **Edit** lalu pilih **`jourka-frontend`** *(WAJIB!)*
   * **Build Command:** `npm run build`
   * **Output Directory:** `dist`
5. Klik **Deploy** dan tunggu ~1 menit hingga muncul URL publik (misal `https://jourka-discovery.vercel.app`).

> Sampai tahap ini, aplikasi **Onboarding, Asesmen Auto-Next, Radar RIASEC, 15 Profesi & 8 Jurusan, Print PDF Lengkap, dan 7 Dossier HTML** sudah aktif 24/7 di Vercel!

---

## Bagian 2 — Menghubungkan Vercel ↔ Robot UiPath

Di folder `jourka-frontend/api/` sudah tersedia **Vercel Serverless Functions** (`/api/roles`, `/api/riasec-recommendations`, `/api/queue-role`, `/api/queue-status`). Pilih salah satu dari 2 cara integrasi di bawah ini:

### Opsi A: Google Sheets Webhook *(Gratis 100%, Paling Cepat untuk Demo/Sekolah)*

#### 1. Siapkan Google Sheet & Apps Script (2 Menit)
1. Buat **Google Spreadsheet** baru (misal: `JourKa Desire Role Queue`).
2. Buka menu **Extensions $\rightarrow$ Apps Script**.
3. Copy-paste seluruh isi file `jourka-frontend/cloud-bridge/GoogleAppsScript.gs` ke editor Apps Script, lalu klik **Save**.
4. Klik **Deploy $\rightarrow$ New deployment**:
   * Select type: **Web app**
   * Execute as: **Me**
   * Who has access: **Anyone**
5. Klik **Deploy**, izinkan akses, lalu salin **Web App URL** (akhiran `/exec`).

#### 2. Pasang URL ke Vercel
1. Buka dashboard project Anda di **Vercel $\rightarrow$ Settings $\rightarrow$ Environment Variables**.
2. Tambahkan variabel baru:
   * **Name:** `GOOGLE_SHEET_WEBHOOK_URL`
   * **Value:** `<Tempel Web App URL /exec Anda>`
3. Buka tab **Deployments $\rightarrow$ Redeploy** agar environment variable aktif.

#### 3. Sinkronkan ke Robot UiPath di Laptop Windows (Tanpa Ubah `Main.xaml`!)
Jalankan script sync bawaan di laptop tempat UiPath Studio berada:
```bash
node scripts/sync_cloud_queue.mjs --url "https://script.google.com/macros/s/.../exec" --watch
```
* Setiap ada siswa menekan kirim di **Vercel**, data otomatis masuk ke **Google Sheet** $\rightarrow$ otomatis ditarik ke **`JourKa/Input/Desire Role List.xlsx`**!
* Setelah Anda menekan **Run** di **UiPath Studio**, status `Sent` otomatis dikirim balik ke Google Sheet dan langsung terlihat di **Panel Guru BK / Admin** pada website Vercel!

---

### Opsi B: UiPath Automation Cloud Orchestrator API *(Mode Produksi Enterprise)*

Jika Anda sudah memiliki tenant **UiPath Automation Cloud** dengan Queue & Unattended Robot:
1. Buat Queue di Orchestrator (misal nama: `JourKa_Career_Requests`).
2. Pasang **Environment Variables** berikut di **Vercel $\rightarrow$ Settings $\rightarrow$ Environment Variables**:
   * `UIPATH_ORCHESTRATOR_URL` = `https://cloud.uipath.com/<org>/<tenant>/orchestrator_`
   * `UIPATH_ACCESS_TOKEN` = `<Personal Access Token / OAuth Bearer Token>`
   * `UIPATH_FOLDER_ID` = `<OrganizationUnitId Folder Anda>`
   * `UIPATH_QUEUE_NAME` = `JourKa_Career_Requests`
3. **Redeploy** Vercel. Setiap permintaan siswa di Vercel otomatis masuk ke **Orchestrator Queue** dan langsung memicu **Unattended Robot**.
