# Reversible Compression
Aplikasi kompresi video

## Menjalankan secara lokal

Prasyarat: Node.js 20 atau lebih baru dan npm.

1. Buka terminal pertama, lalu jalankan backend:

   ```powershell
   cd backend
   npm ci
   npm run dev
   ```

2. Buka terminal kedua, lalu jalankan frontend:

   ```powershell
   cd frontend
   npm ci
   npm run dev
   ```

Buka frontend di http://localhost:5173. Backend tersedia di http://localhost:8000; Vite meneruskan request API ke sana secara default. Cek backend di http://localhost:8000/health.

## Menjalankan dengan Docker

Prasyarat: Docker dengan Docker Compose.

Dari direktori root proyek:

```powershell
docker compose up --build
```

Buka http://localhost:5173. Backend berjalan di http://localhost:8000. Data aplikasi disimpan di direktori `storage` proyek.

Untuk menghentikan layanan, tekan `Ctrl+C`, lalu jalankan:

```powershell
docker compose down
```

Batas upload default adalah 500 MB. Ubah dengan mengatur `REVCOMP_MAX_UPLOAD_MB` sebelum menjalankan Docker Compose.
