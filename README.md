# Enterprise Inventory — UTS 24090055

Aplikasi inventory sederhana berbasis **HTML/CSS/JavaScript** (tanpa framework) dengan UI yang clean, tema (light/dark/custom), CRUD produk, profil (termasuk foto), dan chart ringan di dashboard.

---

## Fitur Utama

- **Login UI** sederhana (front-end only)
- **Dashboard**
  - KPI ringkas (Total Produk, Total Sales, Revenue)
  - **Chart canvas**: Sales 7 hari + Top 5 stok produk
- **Produk (CRUD)**
  - Tambah/Edit/Hapus produk via modal (tanpa `prompt()`)
  - Data tersimpan di **localStorage**
- **Tema**
  - Mode: **Light / Dark / Custom**
  - Custom theme pakai CSS Variables + disimpan otomatis
- **Profile**
  - Edit nama/email/role
  - **Upload foto profil**, auto-resize, simpan ke localStorage

---

## Halaman

- `index.html` — Login
- `dashboard.html` — Dashboard + Chart + Pengaturan Tema
- `products.html` — Kelola Produk
- `profile.html` — Profil + Foto Profil

---

## Teknologi

- HTML5, CSS3 (CSS Variables untuk theming)
- JavaScript (Vanilla)
- Penyimpanan: `localStorage`
- Chart: `<canvas>` (tanpa library eksternal)

---

## Cara Menjalankan (Local)

### Opsi A — Python HTTP Server

Di folder project, jalankan:

```bash
python -m http.server 5500
```

Lalu buka:

- http://127.0.0.1:5500/index.html

### Opsi B — VS Code Live Server

- Install extension **Live Server**
- Klik kanan `index.html` → **Open with Live Server**

---

## Data Tersimpan (localStorage)

Aplikasi ini menyimpan data langsung di browser:

- Produk: `inv_products_v1`
- Tema: `inv_theme_v1`
- Profil: `inv_profile_v1`
- Login (remember): `inv_login_v1`

Tips reset cepat:
- Buka DevTools → Application → Local Storage → hapus key di atas

---

## Struktur Folder (ringkas)

- `assets/images/` — logo & ikon
- `style.css` — style utama + theming
- `script.js` — logic utama (init per halaman, CRUD, theme, profile, chart)
- `dashboard.html`, `products.html`, `profile.html`, `index.html`

---

## GitHub Pages (opsional)

Kalau mau jadi link demo:

1. Repo → **Settings** → **Pages**
2. Source: **Deploy from a branch**
3. Branch: `main` dan folder `/ (root)`
4. Simpan, lalu tunggu link Pages muncul

---

## Lisensi

MIT — lihat `LICENSE`.
