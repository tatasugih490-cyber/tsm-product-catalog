# Katalog Produk PT Tata Sugih Mineral

Website katalog produk statis (HTML, CSS, JavaScript murni) untuk menampilkan peralatan
pemurnian, peleburan, pengecoran, electrowinning, dan pengolahan emisi dari PT Tata Sugih
Mineral. Tidak membutuhkan backend, database, atau proses build — cukup file statis yang
siap dipublikasikan ke GitHub Pages.

## Cara Membuka Secara Lokal

### Opsi 1 — Local server (disarankan)

Browser modern membatasi `fetch()` terhadap file lokal (`file://`), sehingga `data/products.json`
tidak akan termuat jika `index.html` dibuka langsung dengan cara diklik dua kali. Gunakan
local server sederhana:

```bash
# Python 3
cd tsm-product-catalog
python3 -m http.server 8000
```

Lalu buka `http://localhost:8000` di browser.

Alternatif lain:

```bash
# Node.js (jika tersedia)
npx serve .
```

### Opsi 2 — Membuka index.html langsung

Jika browser Anda mengizinkan `fetch()` pada file lokal (beberapa browser dengan flag khusus),
Anda bisa membuka `index.html` langsung. Jika halaman menampilkan pesan "Gagal memuat data
produk", gunakan Opsi 1.

## Struktur Folder

```text
tsm-product-catalog/
├── index.html                 # Halaman utama (satu halaman/one-page)
├── README.md
├── assets/
│   ├── css/
│   │   └── style.css          # Semua styling, termasuk tema warna TSM
│   ├── js/
│   │   ├── products.js        # Memuat & memfilter data dari data/products.json
│   │   └── app.js             # Logika UI: filter, chip kategori, modal, perbandingan
│   ├── images/
│   │   ├── logo/               # Salinan logo (logo.png, tsm-logo.png)
│   │   └── products/            # Gambar produk hasil crop dari Product Catalog.pdf (.webp)
│   └── icons/                  # (disediakan untuk kebutuhan ikon tambahan di masa depan)
├── data/
│   └── products.json          # Sumber data seluruh 31 produk
├── Product List_TSM.xlsx      # File sumber asli (disimpan, tidak ditampilkan di web)
├── Product Catalog.pdf        # File sumber asli (disimpan, tidak ditampilkan di web)
├── logo.png                   # Logo horizontal (dipakai di header)
└── tsm-logo.png                # Logo vertikal (dipakai di footer)
```

Seluruh path pada `index.html`, CSS, dan JS menggunakan **relative path** (`./...`), sehingga
situs tetap berfungsi meskipun dipublikasikan dari subfolder repository di GitHub Pages
(misalnya `https://username.github.io/nama-repo/`).

## Cara Menambah Produk Baru

1. Buka `data/products.json`.
2. Tambahkan objek baru mengikuti struktur berikut:

```json
{
  "id": "kode-model-huruf-kecil",
  "model": "KODE-MODEL",
  "category": "Nama Kategori",
  "name": "Nama Produk",
  "function": "Fungsi utama produk.",
  "capacity": "Kapasitas produk",
  "voltage": "380V",
  "power": "Perlu dikonfirmasi",
  "dimensions": "Perlu dikonfirmasi",
  "weight": "Perlu dikonfirmasi",
  "productionTime": "Perlu dikonfirmasi",
  "description": "Catatan/spesifikasi tambahan.",
  "image": "assets/images/products/kode-model-huruf-kecil.webp",
  "representativeImage": false,
  "imageAvailable": true
}
```

- Gunakan teks **"Perlu dikonfirmasi"** untuk data yang belum tersedia — jangan gunakan angka 0.
- `id` harus unik dan menjadi dasar nama file gambar.
- Jika kategori baru ditambahkan, kartu kategori dan dropdown filter akan otomatis
  menyesuaikan (tidak perlu mengubah kode JavaScript).

## Cara Mengganti/Menambah Gambar Produk

1. Siapkan gambar produk dalam format **WebP** (disarankan lebar maksimum ±1100px agar ringan).
2. Simpan ke `assets/images/products/` dengan nama file sesuai `id` produk, misalnya
   `jq-jdj-5.webp`.
3. Pastikan field `"image"` pada `data/products.json` menunjuk ke path tersebut, contoh:
   `"assets/images/products/jq-jdj-5.webp"`.
4. Jika satu gambar mewakili beberapa model dalam satu seri (bukan foto spesifik model
   tersebut), set `"representativeImage": true` agar label "Gambar representatif" muncul
   otomatis pada card dan halaman detail.
5. Jika belum ada gambar yang sesuai, set `"imageAvailable": false` dan arahkan `"image"` ke
   `assets/images/products/placeholder.webp` (placeholder abu-abu/hijau bertuliskan
   "Gambar belum tersedia").

## Cara Memperbarui Informasi Kontak

Informasi kontak muncul di beberapa tempat dan perlu diperbarui secara manual di file berikut:

- `index.html` — bagian **Header** (tombol WhatsApp ringkas), **Footer**, dan tombol
  **WhatsApp mengambang**.
- `assets/js/app.js` — konstanta `WHATSAPP_NUMBER` di bagian atas file (digunakan untuk
  membangun tautan WhatsApp otomatis pada setiap produk).

Format nomor WhatsApp pada tautan `wa.me` menggunakan kode negara tanpa tanda `+` atau spasi,
misalnya `628111266960`.

## Cara Mengunggah ke GitHub

```bash
git init
git add .
git commit -m "Initial commit: katalog produk PT Tata Sugih Mineral"
git branch -M main
git remote add origin <URL_REPOSITORY_ANDA>
git push -u origin main
```

> Ganti `<URL_REPOSITORY_ANDA>` dengan URL repository GitHub Anda. Jangan menjalankan
> perintah `push` sebelum Anda yakin repository tujuan sudah benar.

## Cara Mengaktifkan GitHub Pages (setelah disetujui)

1. Buka repository di GitHub.
2. Masuk ke **Settings → Pages**.
3. Pada **Source**, pilih branch `main` dan folder `/ (root)`.
4. Klik **Save**. GitHub akan memberikan URL publikasi (biasanya berbentuk
   `https://username.github.io/nama-repo/`).
5. Perbarui nilai `REPLACE_WITH_CANONICAL_URL` pada `index.html` (atribut `canonical` dan
   pada data terstruktur `ItemList`) dengan URL tersebut, lalu commit & push ulang.

## Catatan Teknis

- Situs ini murni statis: tidak ada backend, database, login, maupun API berbayar.
- Tidak ada tracking/analytics pihak ketiga yang dipasang.
- Tidak ada informasi harga, margin, atau data internal workbook yang ditampilkan.
- Gambar produk diambil dan di-crop dari `Product Catalog.pdf` (hanya foto/ilustrasi mesin),
  dioptimalkan ke format WebP, dan watermark/logo pemasok asli pada foto telah dihilangkan
  agar situs mencerminkan identitas PT Tata Sugih Mineral.
