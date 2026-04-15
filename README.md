# 💒 Undangan Nikah Digital

Sistem undangan pernikahan digital dengan Web Admin dan Web User.

## Cara Buka

### Opsi 1: Langsung buka file
Buka `index.html` di browser (klik dua kali).

### Opsi 2: Jalankan server lokal (direkomendasikan)
```bash
python -m http.server 8899
```
Lalu buka: http://localhost:8899

## URL Penting

| Halaman | URL |
|---------|-----|
| 🎊 Undangan | `index.html` atau `http://localhost:8899/` |
| 🔑 Login Admin | `login.html` atau `http://localhost:8899/login.html` |
| ⚙️ Dashboard Admin | `admin.html` (setelah login) |

## Login Admin

- **Username:** `admin`
- **Password:** `wedding2025`

## Link Tamu Personalisasi

Format: `index.html?to=NamaTamu`

Contoh: `index.html?to=Budi+Santoso` → Tampil "Kepada Yth. Budi Santoso"

## Struktur File

```
├── index.html          # Halaman undangan (Web User)
├── login.html          # Login admin
├── admin.html          # Dashboard admin (Web Admin)
├── css/
│   ├── style.css       # Styling undangan
│   └── admin.css       # Styling dashboard
├── js/
│   ├── db.js           # Database (localStorage)
│   ├── app.js          # Logic undangan
│   └── admin.js        # Logic admin
└── README.md
```

## Fitur

### Web User (Undangan)
- ✉️ Envelope opening animation
- 👤 Sapaan personal dari URL parameter (`?to=NamaTamu`)
- ⏳ Countdown hitung mundur real-time
- 💑 Profil kedua mempelai
- 📅 Detail acara Akad & Resepsi + Maps
- 📖 Timeline kisah cinta
- 📸 Galeri foto
- 💌 Form ucapan & RSVP
- 🎁 Amplop digital dengan fitur salin nomor
- 🎵 Background music

### Web Admin (Dashboard)
- 📊 Statistik tamu & RSVP
- 👥 CRUD manajemen tamu
- 🔗 Generate link personal otomatis + tombol salin
- 📥 Export daftar tamu ke CSV/Excel
- 💌 Lihat & hapus ucapan tamu
- ⚙️ Edit semua konten undangan tanpa coding
- 🔒 Login dengan autentikasi

## Ganti Password Admin

Masuk ke Dashboard → Pengaturan → scroll ke bawah → Kredensial Admin
