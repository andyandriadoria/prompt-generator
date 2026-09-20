# Workstation Visual Assets

Folder ini khusus untuk thumbnail/presentation image Workstation V2. File di sini tidak menjadi source data prompt; fungsinya hanya untuk tampilan UI.

## Cara mengganti gambar

Upload atau replace file dengan **nama file yang sama**. Tidak perlu mengubah JavaScript, CSS, Google Sheets, Apps Script, atau config.js.

Rekomendasi umum:
- rasio: 16:9
- ukuran ideal: 1200 × 675 px
- JPG/PNG sesuai ekstensi file yang sudah ada
- hindari teks/logo besar di dalam gambar
- subjek utama sebaiknya tetap terbaca saat thumbnail dipotong kecil

## Prompt Mode thumbnails

- `modes/creative.png`
- `modes/reference-outfit.png`
- `modes/reference-product.png`
- `modes/product-poster.png`
- `modes/architectural-render.png`
- `modes/architectural-sketch.png`

Catatan:
- Architectural Render: gunakan gambar bangunan sebagai subjek utama.
- Architectural Sketch: gunakan gambar/sketch arsitektur dengan bangunan dominan.

## Style DNA thumbnails

- `styles/hyper-realistic.png`
- `styles/cinematic.png`
- `styles/fashion-editorial.png`
- `styles/indonesian-lifestyle.png`
- `styles/japanese-nostalgia.png`
- `styles/miniature-diorama.png`

Workstation V2 membaca file-file ini sebagai asset presentasi tetap.


## Cache / GitHub Pages

Workstation V2 menambahkan cache-busting otomatis berdasarkan versi deploy halaman. Setelah replace gambar:
1. tunggu GitHub Pages selesai deploy,
2. refresh halaman,
3. jika tab sudah terbuka sejak sebelum deploy, lakukan hard refresh satu kali.

Setelah mekanisme ini termuat, penggantian gambar berikutnya tetap cukup dilakukan dengan replace file menggunakan nama yang sama.
