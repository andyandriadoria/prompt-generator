# Prompt Gen 4.0 — GitHub Pages + Google Sheets

Paket ini mengubah Prompt Gen 3.1 menjadi aplikasi modular dengan database dinamis.

## Isi paket

- `index.html` — struktur halaman.
- `style.css` — tampilan light/dark dan responsive.
- `app.js` — interaksi form, random, reset, copy, dan pengaturan sumber data.
- `data-loader.js` — mengambil data Google Sheets API, cache browser, dan fallback.
- `prompt-builder.js` — merangkai prompt dan menyesuaikan pronoun.
- `fallback.json` — seluruh database bawaan dari Prompt Gen 3.1.
- `Database_Prompt_Gen_4.xlsx` — database siap diimpor ke Google Sheets.
- `google-apps-script/Code.gs` — API JSON untuk membaca seluruh sheet.

## A. Unggah ke GitHub Pages

1. Buat repository baru, misalnya `prompt-gen`.
2. Unggah seluruh file web pada folder utama repository:
   `index.html`, `style.css`, `app.js`, `data-loader.js`, `prompt-builder.js`, dan `fallback.json`.
3. Buka **Settings → Pages**.
4. Pilih **Deploy from a branch**.
5. Pilih branch `main` dan folder `/root`.
6. Simpan. Alamatnya akan berbentuk:
   `https://USERNAME.github.io/prompt-gen/`

Aplikasi sudah dapat berjalan memakai `fallback.json` meskipun Google Sheets belum disambungkan.

## B. Buat database Google Sheets

1. Buka Google Sheets.
2. Pilih **File → Import → Upload**.
3. Unggah `Database_Prompt_Gen_4.xlsx`.
4. Pilih **Replace spreadsheet** atau buat spreadsheet baru.
5. Jangan mengganti nama sheet berikut:
   `CONFIG`, `CHARACTERS`, `POSES`, `EXPRESSIONS`, `OUTFITS`, `SETTINGS`,
   `CAMERA_ANGLES`, `LIGHTING`, `CAMERA_STYLES`, `ASPECT_RATIOS`.

## C. Pasang API Google Apps Script

1. Dari Google Sheets tersebut, buka **Extensions → Apps Script**.
2. Hapus kode awal.
3. Salin seluruh isi `google-apps-script/Code.gs`.
4. Simpan.
5. Jalankan fungsi `setup()` satu kali.
6. Setujui permintaan izin.
7. Pilih **Deploy → New deployment**.
8. Type: **Web app**.
9. Execute as: **Me**.
10. Who has access: **Anyone**.
11. Klik **Deploy**, lalu salin URL yang berakhiran `/exec`.

## D. Sambungkan GitHub ke Google Sheets

Ada dua cara.

### Cara publik permanen

Buka `index.html`, lalu isi URL pada bagian:

```html
<meta name="prompt-api-url" content="PASTE_URL_APPS_SCRIPT_DI_SINI">
```

Commit perubahan tersebut satu kali. Setelah itu seluruh isi dropdown dikelola dari Google Sheets tanpa mengedit kode lagi.

### Cara uji cepat lewat browser

Buka bagian **Database connection** pada aplikasi, tempel URL Apps Script, lalu klik **Save & Reload**. URL disimpan di browser melalui `localStorage`.

## E. Menambah atau mengubah pilihan

Tambahkan baris baru pada sheet yang sesuai.

- `CHARACTERS`: preset karakter dan gender.
- `POSES`: pose atau action.
- `EXPRESSIONS`: ekspresi.
- `OUTFITS`: pakaian.
- `SETTINGS`: setting indoor/outdoor.
- `CAMERA_ANGLES`: sudut kamera.
- `LIGHTING`: pencahayaan.
- `CAMERA_STYLES`: gaya kamera.
- `ASPECT_RATIOS`: rasio gambar.
- `CONFIG`: judul, default, dan kalimat pembentuk prompt.

Kolom penting:

- `ID`: harus unik dan sebaiknya tidak diubah setelah dipakai.
- `LABEL`: teks yang terlihat di dropdown.
- `PROMPT` atau `FEATURES`: teks yang dimasukkan ke hasil prompt.
- `ACTIVE`: `TRUE` untuk tampil, `FALSE` untuk disembunyikan.
- `SORT`: urutan tampilan.
- `TYPE` pada `SETTINGS`: `outdoor` atau `indoor`.

Google Apps Script memakai cache sekitar 5 menit. Setelah mengubah database, tunggu cache habis atau jalankan fungsi `clearApiCache()` dari Apps Script.

## Catatan

- Jangan menyimpan password, token, atau data pribadi sensitif di Google Sheets.
- `fallback.json` adalah cadangan lokal. Perubahan di Google Sheets tidak otomatis memperbarui file fallback.
- Saat menjalankan file di komputer, gunakan local server; jangan hanya membuka `index.html` melalui `file://`.
  Contoh: `python -m http.server 8000`.
