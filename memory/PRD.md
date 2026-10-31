# HORAS BAJA – All-in-One POS & Management (PRD)

## Original Problem Statement
All-in-One Management & POS System untuk Toko Bahan Bangunan Spesialis Seng, Roofing & Material Konstruksi "HORAS BAJA" (Jln Ade Irma Suryani No 68, Pematang Siantar; Gudang Mojopahit & Wahidin). Web responsive + PWA offline-first, role Admin/Pemilik & Kasir, 6 modul: Master Data, POS (ready + indent builder, kalkulator meter, upah lengkung, ongkir, catatan, pembayaran, nota 80mm, surat jalan parsial), Riwayat Penjualan (dot status, filter, edit admin + tambah item, void), Pembelian (auto PO indent PREFIX+YY+0001, PO manual, status penerimaan kasir tanpa harga, edit HPP admin, utang dagang), Keuangan (laba rugi, produk menguntungkan, stok, rekap PO, piutang), dummy data.

## User Choices
- Stack: React + FastAPI + MongoDB + backup Export/Import JSON/CSV (bukan Node/PostgreSQL)
- Auth: login username + password (JWT); akun demo admin/admin123, kasir/kasir123
- WA: link wa.me dengan teks nota otomatis
- Semua 6 modul dibangun sekaligus (versi inti); tema industrial gelap dengan aksen oranye
- User: JANGAN jalankan test otomatis setelah setiap perubahan

## Architecture
- Backend: core.py (db, auth, penomoran), services.py (kalkulasi, status, auto-PO), routes_master/sales/purchases/reports.py, seed.py
- Frontend: context Auth/Data (bootstrap cache IndexedDB), lib offline.js (queue + auto-sync), public/sw.js (service worker), PrintProvider (preview + window.print), halaman: Dashboard, POS, Sales, Purchases, Stock, Products, Customers, Suppliers, Reports, Settings

## Implemented (2026-09-30)
- Semua 6 modul, RBAC (field HPP/uang dihapus di API untuk kasir), PWA + antrian offline + sinkronisasi otomatis, nota thermal/standard, surat jalan multi-rit, backup
- Tes E2E pertama: backend 29/29 lulus, smoke test frontend lulus
- Perbaikan: tab kategori POS bisa di-scroll horizontal (shrink-0, scrollbar tipis, snap)
- Cetak nota: dialog pilihan printer sebelum mencetak — Thermal 58mm / 80mm (tanpa margin) atau Printer Biasa SmartTank A4 / F4 (faktur lengkap). Setelah dipilih, pratinjau terbuka dan dialog print browser otomatis muncul; tombol "Ganti Printer" ada di pratinjau
- Data uji TEST_ dari testing agent dihapus (stok dikembalikan)
- Cetak PO Pembelian (A4/A5): tombol cetak di tiap baris PO & detail; layout resmi (header toko, No PO, tanggal, supplier, gudang), tabel No/Deskripsi/Qty Fisik/Total Meter/HPP/Subtotal (HPP & Rp disembunyikan untuk kasir), footer total qty per satuan, total meter, total Rp, catatan, 3 kolom tanda tangan
- Indent Builder: cascading dropdown Pabrik → Jenis Material → Merk/Tipe (hanya produk berpanjang milik supplier terpilih); ganti pabrik mereset jenis/merk/tebal/warna; fallback pesan "Tidak ada material kustom untuk pabrik ini" + input merk manual
- POS: urutkan tabel produk dengan klik header (Nama, Stok, Harga; naik/turun)
- Toggle Lengkung dinamis: field produk baru `is_lengkung` (bool, default false) & `upah_lengkung` (number, default 0), produk lama dimigrasi dari bend_fee; toggle hanya muncul untuk kategori Seng/Spandek/Deck/Atap/Alderon; Lurus = upah Rp 0 & field disembunyikan; berlaku di form produk, POS ready, indent builder, keranjang
- POS Ready Stock: daftar produk diubah dari card grid menjadi tabel ringkas (Nama+badge kategori, Stok G1|G2, Harga Satuan, tombol Pilih), container scroll max 58vh dengan sticky header; di mobile stok pindah di bawah nama
- Nota A4/F4: daftar item kini tabel bergaris (No, Nama Barang, Qty, Satuan, Harga Satuan, Disc, Total) + baris rincian upah lengkung; format thermal tidak berubah

## Backlog
- P1: Hapus password_hash dari backup JSON; cetak ulang nota offline setelah sync memakai nomor resmi
- P1: Laporan stok per gudang ke PDF/Excel; riwayat harga beli per supplier
- P2: Scan barcode di POS; ringkasan harian otomatis ke WA pemilik; mode terang

## 2026-10-14
- Repo di-clone ulang dari GitHub ke /app, backend .env dibuat ulang (JWT_SECRET, ADMIN/KASIR creds), app berjalan normal
- Supplier: field Kontak Sales 2 (sales_contact2) & Note/Keterangan (note, textarea); tampil di tabel Master Supplier & Cetak PO A4/A5 (kasir juga menerima field kontak & note)
- PO: daftar PO jadi tabel ringkas (No PO|Tgl, Supplier, Gudang, Ringkasan Item, Badge Status, Total admin-only, Aksi Detail/Cetak/Edit/Void), detail di modal dengan kolom No/Kategori-Merk/Spesifikasi/Qty (tanpa meter)/Total Meter/HPP/Subtotal; kelas .dtable-compact (py-2 px-3), sticky header
- Sorting global: components/SortTh.jsx (useSort hook + SortTh, ikon ArrowUp/Down/UpDown) dipakai di PO, PO detail, Riwayat Penjualan, detail nota, Produk, Stok+Mutasi, semua laporan Keuangan, dan semua EntityManager (Pelanggan, Supplier, Kategori, Beban, User). Nilai kosong selalu di bawah
- Fix Indent Builder: kategori kini semua produk milik supplier + kategori standar (Seng/Kanal C/Reng/Alderon/Plafon PVC/Talang); kategori non-berpanjang (Kanal C, Reng, Talang) → label Qty sesuai satuan (Batang), panjang kustom & toggle lengkung disembunyikan, panjang standar 6 m; mengalir ke Auto PO dengan unit Batang
- POS layout swap: kiri 42% (konsumen, keranjang, catatan, ongkir, metode bayar — scroll mandiri; footer Total + Simpan selalu terlihat), kanan 58% (Ready Stock & Indent Builder). <lg menumpuk, footer sticky bawah
- Keranjang POS: baris inline grid (Produk | Qty×Panjang | Harga | Subtotal kanan | X), items-center, py-1.5, header kolom, toggle lengkung inline ringkas di bawah baris
- POS resizable splitter (components/pos/useSplit.jsx): drag/keyboard panah/dblclick reset 50:50, batas 30–70%, disimpan di localStorage key hb_pos_split_left_pct, default 50:50, aktif >=lg
- Mode Layar Penuh Kasir (AppShell usePosFocus): tombol di header hanya di /pos; sembunyikan sidebar & bottom nav, header ringkas, padding rapat, requestFullscreen browser; disimpan localStorage hb_pos_fullscreen; keluar via tombol/Esc
- Menu baru Pengiriman / Delivery (/delivery, admin & kasir): tab Hari Ini/Besok/Rentang (filter delivery_date), cari, filter status kirim (Belum Dikirim/Parsial/Selesai dihitung dari delivered_qty), tabel ringkas sortable, aksi Atur Pengiriman/SJ (DeliveryDialog: checklist, Kirim Semua/Kosongkan, Cetak Surat Jalan tanpa harga) & Update Status (PATCH /sales/{id}/status)
- Theme Switcher (components/ThemeSwitcher.jsx) di header: light / dark (hitam pekat) / slate warm focus; html[data-theme], localStorage hb_theme, script anti-flash di public/index.html; override warna aksen hardcoded per tema; sidebar pakai --sidebar; chart grid/tooltip pakai CSS var
- Ukuran huruf Normal/Besar/Ekstra Besar (html[data-font] md/lg/xl → root 100/112.5/125%, override text-[Npx]); di menu Tema & Huruf; localStorage hb_font; cetak tetap 100%
- Keranjang: saat item baru ditambah (Ready/Indent) → smooth scrollIntoView ke baris baru di panel kiri, highlight 1.4 dtk, fokus+select input Qty (hanya perangkat mouse)
- Export PDF (jspdf+html2canvas, lib/pdf.js, components/PdfProvider.jsx, docs/PdfMenu.jsx): Nota A4/A5, Struk 80mm, Surat Jalan (rit terakhir atau DRAFT sisa item); preview iframe, Unduh (nama Nota_INV_Pelanggan.pdf), Cetak, Tab Baru; tombol di dialog sukses POS, baris Riwayat Penjualan, detail nota. Nota: kolom Qty (tanpa meter) + Panjang (m), ringkasan Diskon/Metode/Jumlah Bayar/Sisa, TTD Konsumen & Kasir; varian cetak a5 ditambah
- Void: alasan wajib; retur stok ready + log db.stock_history (GET /api/stock/history, tampil di halaman Stok); PO indent terkait (Draft/Dalam Proses → voided+CANCELED, Belum Lengkap → CANCELED, sisa antrean dihapus), receive diblokir untuk PO CANCELED; sale menyimpan void_total/void_indent/canceled_pos. GET /sales?only_void=true & date_field=void. UI: tab Void/Dibatalkan di Riwayat Penjualan + tab Void di Keuangan (VoidTable), banner alasan void & tag [VOID INDENT - PO PABRIK BATAL] di detail, badge Canceled di PO
- Rencana kirim TBA: checkbox "TBA (Diinfokan Kembali)" (default aktif di POS, juga di Edit Nota) menyimpan delivery_date="TBA"; fdate menampilkan "TBA (Diinfokan Kembali)"; nota/struk/WA "Rencana Kirim: ..."; tab TBA di menu Pengiriman
