# Product Requirements Document (PRD) — OA-Motion

---

## 1. Informasi Dokumen

| Item | Keterangan |
| --- | --- |
| **Nama Proyek** | **OA-Motion: Sistem Panduan Latihan Adaptif Berbasis Computer Vision dan Kecerdasan Buatan untuk Penguatan Otot Tungkai Bawah** |
| **Pemilik Produk (Product Owner)** | Zaky Ramadhan (Ketua Tim SPEKTRA) |
| **Penulis Dokumen** | Tim SPEKTRA (Zaky Ramadhan, Naufal Khalil Aldeza, Zahwa Rahmadhania, Vanisa Firsy) |
| **Tanggal Dibuat** | 23/08/2026 |
| **Tanggal Revisi Terakhir** | 09/09/2026 |
| **Versi Dokumen** | v2.0 (Revisi arsitektur pasca-diskusi dosen pembimbing Pak Fazrol Rozi) |
| **Status** | Revisi — menunggu persetujuan ulang tim sebelum implementasi |
| **Dokumen Rujukan** | `OA-Motion_Dev_Guide.md` (v2) |

Ringkasan perubahan dari v1.0 ada di bagian 18 (Riwayat Revisi Dokumen) di akhir dokumen ini.

---

## 2. Ringkasan Eksekutif

**OA-Motion** adalah aplikasi web kesehatan berbasis *Edge AI* dan *Computer Vision* yang menyediakan panduan latihan penguatan otot tungkai bawah secara mandiri, preventif, dan *real-time*, dengan progresi dua tahap: **sit-to-stand** (duduk ke berdiri) sebagai skrining kemampuan dan pemanasan, dilanjutkan **squat bertahap**. Target utama adalah lansia dan penderita osteoarthritis (OA) lutut yang ingin tetap aktif secara fisik tanpa memerlukan pendampingan fisioterapis setiap saat. Sistem memanfaatkan kamera bawaan smartphone atau laptop tanpa sensor atau *wearable device* tambahan (*zero hardware barrier*).

Berbeda dari versi awal, personalisasi OA-Motion **tidak lagi bergantung pada tabel ambang derajat sudut per Grade OA** yang sumbernya belum bisa dipertanggungjawabkan secara klinis. Sebagai gantinya, sistem membandingkan pola gerakan pengguna secara *real-time* terhadap **data gerakan referensi ("golden data")** yang direkam dari instruktur/fisioterapis mitra, menggunakan *Dynamic Time Warping* (DTW) dan *Normalized Cross-Correlation* (NCC) untuk menghasilkan skor kemiripan gerakan. Sistem juga membangun **baseline kelelahan adaptif** dari repetisi awal tiap sesi pengguna sendiri, untuk mendeteksi tanda kelelahan atau penurunan kualitas gerakan sebelum berisiko cedera. OA-Motion bertindak sebagai **"Digital Spotter"** yang memberi peringatan visual dan suara Bahasa Indonesia secara preventif, menghitung repetisi, dan menyediakan ringkasan sesi yang bisa dibagikan ke keluarga atau pendamping pengguna.

Proyek ini dikembangkan oleh Tim SPEKTRA (Politeknik Negeri Padang) untuk kompetisi **Samsung Solve for Tomorrow (SFT) 2026** di bawah tema *Sport & Technology*, guna mendukung pencapaian SDGs 1, 3, dan 10.

---

## 3. Latar Belakang & Masalah

### 3.1 Latar Belakang

Osteoarthritis (OA) adalah penyakit degeneratif sendi paling umum di dunia dan salah satu penyebab utama disabilitas fisik pada lansia, dengan sekitar 528 juta orang hidup dengan OA secara global pada 2019 (WHO, 2023), 60% di antaranya perempuan. Angka ini menggambarkan skala masalah global, bukan proyeksi jumlah pengguna OA-Motion. Di Indonesia, Riskesdas 2018 mencatat prevalensi penyakit sendi (kategori yang lebih luas dari OA lutut secara spesifik, berdasarkan diagnosis tenaga kesehatan pada penduduk usia 15 tahun ke atas) sebesar 7,3% secara nasional.

Aktivitas fisik terstruktur merupakan pendekatan non-farmakologis paling efektif untuk memperlambat kerusakan kartilago sendi. Namun, penderita menghadapi kendala biaya pendampingan fisioterapi rutin (Rp150.000–Rp400.000 per sesi) yang membebani masyarakat menengah ke bawah.

### 3.2 Masalah yang Ingin Diselesaikan

- **Ketakutan Berolahraga (*Fear-Avoidance Behavior*):** Lansia dan penderita OA ragu bergerak karena takut rasa nyeri atau takut memperparah cedera sendi jika salah melakukan form latihan. Narasi kampanye: "usia bukan alasan untuk lemah."
- **Ketiadaan Panduan Personal di Rumah:** Video tutorial umum di internet bersifat generik dan tidak bisa memastikan bentuk gerakan pengguna sudah benar, karena tidak ada pembanding objektif.
- **Keterbatasan Akses & Biaya Fisioterapi:** Lansia di daerah sulit mengunjungi klinik fisioterapi setiap hari secara konsisten.
- **Distorsi Pengukuran & Penempatan Kamera:** Pengguna awam yang merekam gerakan mandiri sering meletakkan kamera pada posisi yang salah, menyebabkan evaluasi gerakan menjadi tidak akurat atau titik sendi tertutup (oklusi) saat gerakan dilipat seperti squat.
- **Ketiadaan Pemantauan Objektif untuk Keluarga:** Anggota keluarga yang tidak selalu bisa mendampingi latihan tidak punya cara mudah untuk tahu kondisi dan perkembangan latihan orang tua/anggota keluarganya.

---

## 4. Tujuan & Sasaran (Goals & Objectives)

| No | Tujuan | Indikator Keberhasilan (Terukur) |
| :--- | :--- | :--- |
| 1 | Mengembangkan engine Computer Vision *on-device* yang mendeteksi sendi dan menghitung sudut fleksi lutut/panggul secara *real-time*. | Latensi inferensi ≤ 33 ms per frame (≥ 30 FPS) dengan batas toleransi eror sudut ≤ ±5° terhadap goniometer manual. |
| 2 | Membandingkan gerakan pengguna terhadap data gerakan referensi (golden data) untuk menghasilkan skor kemiripan gerakan yang menentukan zona umpan balik. | Skor kemiripan (DTW/NCC) dapat dihitung dalam satu siklus frame tanpa mengganggu frame rate real-time. `[BUTUH VALIDASI: target akurasi skor kemiripan terhadap penilaian manual instruktur belum ditetapkan]` |
| 3 | Menghadirkan antarmuka latihan adaptif yang ramah lansia dan mudah digunakan tanpa bantuan teknis rumit. | Skor *System Usability Scale* (SUS) ≥ 80 (Kategori *Excellent*) dari uji coba pengguna lansia. |
| 4 | Mencegah risiko cedera dan overexertion melalui umpan balik suara preventif dan deteksi kelelahan adaptif. | Umpan balik suara otomatis terpicu dalam waktu < 100 ms saat skor kemiripan memasuki zona waspada/bahaya; `fatigueFlag` terpicu saat rep speed decay atau penurunan RoM melewati ambang toleransi terhadap baseline sesi. |
| 5 | Menyediakan data progres latihan yang bisa dibagikan ke keluarga/pendamping. | Ringkasan sesi latihan dapat diunduh/dibagikan dalam waktu < 5 detik setelah sesi selesai. |

---

## 5. Target Pengguna (User Persona)

### Persona 1: Ibu Hartini (68 Tahun) — Lansia dengan OA Lutut
- **Demografi:** Lansia, tinggal sendiri, keterbatasan pemahaman teknologi kompleks.
- **Kebutuhan:** Panduan gerakan yang sederhana, instruksi suara yang jelas, tombol antarmuka besar, kepastian bahwa gerakan yang dilakukan aman.
- **Pain Points:** Takut lutut bertambah bengkak jika salah gerak, tidak ada anggota keluarga yang menemani setiap saat, biaya fisioterapi mahal jika dilakukan rutin.
- **Profil di sistem:** Kapabilitas `duduk_dan_berdiri`, pendampingan `mandiri` — sehingga masuk mode latihan dengan overlay gerakan referensi (lihat bagian 6).

### Persona 2: Pak Doni (54 Tahun) — Pasca-Operasi Rekonstruksi Lutut
- **Demografi:** Pria usia produktif, aktif bekerja, dalam masa rehabilitasi pasca-bedah.
- **Kebutuhan:** Konfirmasi objektif bahwa gerakan latihannya sudah mendekati pola gerakan yang benar, tanpa harus bolak-balik ke klinik.
- **Pain Points:** Tidak punya waktu untuk sering ke klinik di sela jam kerja; butuh kepastian gerakan tidak mencederai ulang sendi pasca operasi.
- **Profil di sistem:** Kapabilitas `duduk_dan_berdiri`, pendampingan bisa `mandiri` atau `butuh_pendamping` tergantung tahap pemulihan.

### Persona 3: Anggota Keluarga/Pendamping (Target Sekunder, Prioritas MVP)
- **Demografi:** Anak atau pendamping dari pengguna lansia, tidak selalu bisa hadir mendampingi latihan langsung.
- **Kebutuhan:** Ringkasan sederhana kondisi latihan orang tua/anggota keluarganya, termasuk indikasi kelelahan atau penyimpangan gerakan.
- **Pain Points:** Khawatir orang tua berlatih sendirian tanpa pengawasan; kesulitan memantau kondisi dari jarak jauh.
- **Tujuan Menggunakan Website:** Menerima atau mengunduh ringkasan sesi latihan (lihat FR-17).

### Persona 4: Fisioterapis / Tenaga Medis Mitra (Target Sekunder, Rencana Fase Lanjutan)
- **Demografi:** Praktisi fisioterapi klinik atau poli rehabilitasi medik rumah sakit, sekaligus sumber data gerakan referensi (golden data).
- **Kebutuhan:** Merekam gerakan referensi yang benar secara klinis sebagai data acuan sistem; meninjau data kepatuhan dan skor kemiripan pasien.
- **Pain Points:** Pasien sering lupa atau tidak disiplin melakukan *home-exercise*, sulit memverifikasi kebenaran laporan lisan pasien.
- **Catatan cakupan:** Integrasi laporan dua arah ke fisioterapis (di luar perekaman golden data) masuk **rencana fase lanjutan**, bukan prioritas MVP (lihat bagian 6.2).

---

## 6. Ruang Lingkup (Scope)

### 6.1 Termasuk dalam Cakupan (In Scope — MVP Release SFT 2026)

- **Formulir Profil Kapabilitas & Disclaimer:** Pilihan kapabilitas (`hanya_duduk` / `duduk_dan_berdiri`), status pendampingan (`mandiri` / `butuh_pendamping`), target repetisi per sesi, kontak keluarga (opsional), dan *Medical Disclaimer* eksplisit.
- **Pemandu Kalibrasi Kamera Visual & Audio:** Instruksi posisi kamera jarak sekitar 3 meter, serong 45 derajat dari pengguna. `[BUTUH VALIDASI INTERNAL — lihat bagian 15, konfigurasi ini belum dikunci final]`
- **Kinematic Engine (Edge AI):** Ekstraksi 33 landmark tubuh via MediaPipe Tasks Vision (`PoseLandmarker`), perhitungan sudut Aturan Kosinus (Hip-Knee-Ankle), penghalusan sudut (*EMA smoothing*). Output sudut ini menjadi input untuk mesin perbandingan gerakan referensi.
- **Modul Data Gerakan Referensi (Golden Data):** Penyimpanan dan pemuatan deret waktu sudut sendi (`angleTimeSeries`) hasil rekaman instruktur/fisioterapis mitra, untuk tahap sit-to-stand dan squat.
- **Mesin Perbandingan Gerakan (DTW/NCC):** Membandingkan pola gerakan aktif pengguna terhadap gerakan referensi secara *real-time*, menghasilkan skor kemiripan yang menentukan zona umpan balik.
- **Progresi Latihan Dua Tahap:** Tahap 1 (sit-to-stand) sebagai skrining/pemanasan, Tahap 2 (squat bertahap, kedalaman meningkat progresif).
- **Mode Latihan:** Mode Mandiri (menampilkan overlay video/skeleton gerakan referensi) dan Mode Dengan Pendamping.
- **Baseline Kelelahan Adaptif:** Membangun baseline dari 2–3 repetisi pertama tiap sesi, memantau *rep speed decay* dan penurunan RoM untuk memicu `fatigueFlag`.
- **Umpan Balik Preventif 3 Zona:** Status banner warna (Hijau, Kuning, Merah) berdasarkan skor kemiripan gerakan, disertai sintesis suara otomatis Bahasa Indonesia via Web Speech API.
- **Dashboard Ringkasan & Laporan Keluarga:** Kartu metrik durasi, repetisi vs target, skor kemiripan rata-rata, status `fatigueFlag`, jumlah peringatan, serta tombol unduh/bagikan ringkasan sesi untuk keluarga.
- **Arsitektur Zero Video Transmission:** Pemrosesan frame kamera dan perhitungan skor kemiripan murni di perangkat klien tanpa pengiriman data video ke luar.

### 6.2 Tidak Termasuk dalam Cakupan (Out of Scope — Rencana Fase Lanjutan)

- **Kondisi yang Butuh Pengawasan Klinis Langsung:** OA berat/kondisi sendi berat, atau pasca operasi yang belum mendapat izin bergerak dari dokter.
- **Sistem Pembayaran & Akun Multi-user Kompleks:** Tidak diperlukan untuk purwarupa demo kompetisi.
- **Integrasi Dua Arah dengan Fisioterapis/Rekam Medis Elektronik (EHR):** MVP hanya mencakup perekaman golden data dari fisioterapis mitra, bukan portal pelaporan dua arah penuh.
- **Notifikasi Otomatis ke Keluarga (Email/WhatsApp):** MVP cukup tombol unduh/bagikan manual; notifikasi otomatis masuk roadmap.
- **Model Deep Learning Lanjutan (mis. BiLSTM) untuk Rep Counting/Fatigue:** MVP memakai state machine berbasis ambang sudut yang lebih sederhana; model lanjutan dipertimbangkan hanya jika akurasi state machine terbukti tidak cukup setelah diuji.
- **Pelacakan Sendi Non-Lutut/Panggul:** Fokus penuh pada sit-to-stand dan squat.
- **Sensor Hardware Tambahan (Wearable/IMU):** Mempertahankan prinsip *Zero Hardware Barrier*.

---

## 7. Kebutuhan Fungsional (Functional Requirements)

| ID | Nama Fitur | Deskripsi | Prioritas (MoSCoW) |
| :--- | :--- | :--- | :--- |
| **FR-01** | Pengaturan Profil Kapabilitas | Pengguna memilih kapabilitas (hanya duduk / duduk & berdiri), status pendampingan, target repetisi per sesi, dan kontak keluarga opsional. | **Must Have** |
| **FR-02** | Mesin Perbandingan Gerakan Referensi | Sistem membandingkan deret sudut sendi aktif pengguna terhadap `angleTimeSeries` gerakan referensi memakai DTW dan NCC, menghasilkan skor kemiripan per repetisi. | **Must Have** |
| **FR-03** | Kalibrasi Kamera AR & Suara | Menampilkan panduan visual dan instruksi suara penempatan kamera pada jarak sekitar 3 meter, serong 45 derajat. `[BUTUH VALIDASI INTERNAL]` | **Must Have** |
| **FR-04** | Deteksi Landmark MediaPipe | Mengidentifikasi koordinat titik panggul, lutut, dan pergelangan kaki dari kamera secara *real-time* on-device. | **Must Have** |
| **FR-05** | Kalkulasi Sudut Trigonometri | Menghitung sudut sendi lutut/panggul pada setiap frame menggunakan aturan kosinus, sebagai input mesin perbandingan gerakan. | **Must Have** |
| **FR-06** | Indikator Visual 3 Zona | Mengubah warna banner (Hijau/Kuning/Merah) secara live berdasarkan skor kemiripan gerakan terhadap referensi. | **Must Have** |
| **FR-07** | *Preventive Voice Alerts* | Membunyikan suara Bahasa Indonesia saat skor kemiripan mendekati zona waspada/bahaya, dengan *audio debounce*. | **Must Have** |
| **FR-08** | Tombol Darurat (Emergency Stop) | Pengguna dapat menghentikan sesi seketika melalui tombol besar yang selalu terlihat di viewport. | **Must Have** |
| **FR-09** | Penghitung Repetisi & Progresi Tahap | State machine berbasis sudut sendi menghitung repetisi untuk tahap sit-to-stand dan squat secara terpisah, mendukung transisi antar tahap. | **Must Have** |
| **FR-10** | Mode Latihan (Mandiri / Dengan Pendamping) | Mode mandiri menampilkan overlay video/skeleton gerakan referensi sebagai panduan visual tambahan; mode dengan pendamping menjadikannya opsional. | **Must Have** |
| **FR-11** | Baseline Kelelahan Adaptif | Membangun baseline kecepatan & RoM dari 2–3 repetisi pertama tiap sesi, memicu `fatigueFlag` saat terdeteksi penurunan signifikan. | **Should Have** |
| **FR-12** | Ringkasan Sesi & Metrik | Menampilkan durasi, repetisi vs target, skor kemiripan rata-rata, status `fatigueFlag`, dan jumlah peringatan. | **Must Have** |
| **FR-13** | Laporan untuk Keluarga | Tombol unduh/bagikan ringkasan sesi latihan, dapat dilihat oleh kontak keluarga yang didaftarkan. | **Should Have** |
| **FR-14** | Manajemen Data Referensi (Golden Data) | Utilitas internal untuk memuat dan menyimpan `angleTimeSeries` hasil rekaman instruktur/fisioterapis mitra ke sistem. | **Must Have** (prasyarat FR-02) |
| **FR-15** | Kontrol Bisu Suara (*Mute Toggle*) | Pengguna dapat mematikan/menyalakan suara instruksi kapan saja dari header. | **Could Have** |
| **FR-16** | *Medical Disclaimer & Exclusion Notice* | Menampilkan pernyataan bahwa aplikasi adalah alat bantu latihan mandiri (bukan diagnostik), dan mengecualikan kondisi yang butuh pengawasan klinis langsung. | **Must Have** |
| **FR-17** | Generator Unduh Dokumen PDF/Ringkasan | Menghasilkan dokumen ringkasan sesi latihan (untuk keluarga, dan opsional untuk dibawa ke fisioterapis). | **Should Have** |

---

## 8. Kebutuhan Non-Fungsional (Non-Functional Requirements)

| Kategori | Kebutuhan Spesifik |
| :--- | :--- |
| **Performa & FPS** | Proses inferensi Computer Vision dan perhitungan skor kemiripan (DTW/NCC) harus berjalan stabil minimal 30 FPS dengan latensi total ≤ 33 ms per frame di browser perangkat klien. |
| **Kecepatan Respon Audio** | Jeda antara terdeteksinya penyimpangan gerakan berisiko dan keluarnya suara peringatan tidak boleh melebihi 100 ms. |
| **Aksesibilitas Lansia** | Mematuhi standar WCAG 2.1 AAA: kontras rasio warna minimal 7:1, ukuran font minimal 18pt, area sentuh tombol minimal 48×48 dp. |
| **Keamanan & Privasi Data** | Prinsip *Zero Video Transmission* (UU PDP No. 27/2022): stream kamera dan hasil perhitungan sudut/skor kemiripan hanya diproses di memori sementara (RAM) perangkat klien, tidak pernah direkam atau diunggah ke server. |
| **Kompatibilitas Platform** | Berjalan tanpa instalasi pada peramban web modern (Chrome, Edge, Firefox, Safari) di laptop maupun smartphone Android/iOS. |
| **Efisiensi Memori** | Konsumsi memori peramban saat pelacakan kamera dan perhitungan DTW/NCC aktif tidak boleh melebihi 500 MB. |
| **Kualitas Data Referensi** | Golden data minimal direkam dari satu instruktur/fisioterapis mitra untuk tiap tahap gerakan (sit-to-stand, squat), dengan jumlah repetisi referensi yang cukup untuk generalisasi. `[BUTUH VALIDASI: angka pasti minimal repetisi referensi]` |

---

## 9. User Stories / Skenario Penggunaan

- **Sebagai Ibu Hartini,** saya ingin memulai dari gerakan duduk-ke-berdiri sebelum mencoba squat penuh, agar saya yakin dulu dengan kemampuan saya sebelum mencoba gerakan yang lebih dalam.
- **Sebagai pengguna yang berlatih sendirian (mode mandiri),** saya ingin melihat overlay gerakan referensi di layar, agar saya tahu bentuk gerakan yang benar tanpa ada pendamping yang mengoreksi langsung.
- **Sebagai Pak Doni,** saya ingin tahu seberapa mirip gerakan saya dengan gerakan yang benar secara langsung di layar, agar saya yakin latihan saya tidak berisiko mencederai ulang sendi pasca operasi.
- **Sebagai pengguna,** saya ingin diperingatkan jika sistem mendeteksi tanda kelelahan saat latihan, agar saya bisa berhenti sebelum risiko cedera akibat overexertion.
- **Sebagai anggota keluarga,** saya ingin menerima ringkasan sesi latihan orang tua saya, agar saya tahu perkembangan dan kondisinya tanpa harus selalu mendampingi langsung.
- **Sebagai pengguna,** saya ingin dipandu meletakkan posisi smartphone dengan panduan visual dan suara, agar sudut kamera saya sesuai dan pengukuran gerakan saya akurat.
- **Sebagai pengguna,** saya ingin mengunduh ringkasan sesi latihan, agar bisa saya tunjukkan ke keluarga atau fisioterapis saat konsultasi.

---

## 10. Struktur Halaman & Sitemap

```text
[ Halaman 1: Setup Profil & Mode ] ( / )
            │
            ▼
[ Halaman 2: Kalibrasi Kamera ] ( /calibration )
            │
            ▼
[ Halaman 3: Latihan Real-Time (Sit-to-Stand → Squat) ] ( /tracking )
            │
            ▼
[ Halaman 4: Ringkasan Sesi & Laporan Keluarga ] ( /summary )
```

| No | Nama Halaman | Route | Tujuan Halaman | Konten Utama |
| :--- | :--- | :--- | :--- | :--- |
| 1 | Setup Profil & Mode | `/` | Mengumpulkan data kapabilitas fungsional dan menentukan mode latihan. | Pilihan kapabilitas (hanya duduk / duduk & berdiri), toggle status pendampingan (mandiri / dengan pendamping), input target repetisi per sesi, input kontak keluarga (opsional), disclaimer medis, tombol lanjut. |
| 2 | Kalibrasi Kamera | `/calibration` | Memastikan posisi kamera sesuai konfigurasi jarak dan sudut yang divalidasi. | Live camera feed, panduan visual posisi kamera (jarak ~3 meter, serong 45°), badge status kalibrasi, kartu instruksi suara, tombol mulai latihan. |
| 3 | Latihan Real-Time | `/tracking` | Ruang kerja latihan dengan pelacakan gerakan dan perbandingan terhadap referensi. | Selector/indikator tahap aktif (Sit-to-Stand / Squat), banner status zona (Hijau/Kuning/Merah) berbasis skor kemiripan, skeleton overlay pengguna, overlay gerakan referensi (mode mandiri), penghitung repetisi vs target, subtitle suara AI, indikator peringatan kelelahan, tombol darurat hentikan latihan. |
| 4 | Ringkasan Latihan | `/summary` | Menampilkan analitik sesi dan opsi berbagi laporan. | Kartu metrik durasi, repetisi vs target, skor kemiripan rata-rata, status fatigue flag, jumlah peringatan, grafik tren skor kemiripan per repetisi, tombol unduh/bagikan laporan keluarga, tombol unduh PDF (opsional untuk fisioterapis). |

---

## 11. Desain & Pengalaman Pengguna (UI/UX)

- **Tema Visual & Moodboard:** Bersih, klinis, modern, sangat kontras (*Dark Mode Overlay* untuk kamera, *Clean Slate White* untuk formulir dan analitik).
- **Palet Warna Utama:**
  - **Emerald Green (`#d1ffca` / `#10B981`):** Zona Aman (skor kemiripan tinggi), konfirmasi sukses, tombol aksi utama.
  - **Amber Yellow (`#fff100` / `#F59E0B`):** Zona Waspada (skor kemiripan mulai menurun / indikasi kelelahan awal).
  - **Crimson Red (`#EF4444` / `#DC2626`):** Zona Bahaya (Stop), skor kemiripan rendah, atau `fatigueFlag` aktif.
  - **Deep Black & Slate (`#000000` / `#1E293B`):** Background kontras tinggi dan teks utama.
- **Tipografi:** Sans-serif (Inter / Roboto), ketebalan *Bold*/*ExtraBold* untuk kemudahan membaca lansia.
- **Elemen baru yang perlu dirancang:** overlay gerakan referensi untuk mode mandiri (skeleton semi-transparan atau video contoh berdampingan), indikator tahap aktif (Sit-to-Stand vs Squat) yang jelas terlihat, badge status kelelahan.
- **Aset UI/UX:** Rancangan layar sebelumnya (Google Stitch) perlu direvisi menyesuaikan elemen baru di atas sebelum dipakai sebagai acuan final implementasi.

---

## 12. Kebutuhan Teknis (Technical Requirements)

| Item | Keterangan |
| :--- | :--- |
| **Arsitektur Sistem** | Single Page Application (SPA) — 100% Client-Side Edge AI Processing. |
| **Framework & Build Tool** | Vite 6.x/8.x + React 19 (TypeScript/TSX). |
| **Styling Library** | Tailwind CSS 4.x + Lucide React Icons + shadcn/ui. |
| **Machine Learning Engine** | Google MediaPipe Tasks Vision (`@mediapipe/tasks-vision`, `PoseLandmarker`) berbasis WebAssembly (WASM). |
| **Modul Kinematika (baru)** | `src/engine/kinematics/dtwCalculator.ts` (Dynamic Time Warping) dan `src/engine/kinematics/fatigueDetector.ts` (baseline kelelahan adaptif) — menggantikan `rulesEngine.ts` berbasis `SAFE_ROM_LIMITS` statis. |
| **Data Gerakan Referensi** | Aset `angleTimeSeries` (deret waktu sudut) per tahap gerakan, disimpan sebagai JSON dan dimuat oleh mesin DTW/NCC. Menggantikan `src/constants/clinical.ts` (`OAGrade`, `ClinicalSafetyLimits`). |
| **Speech Engine** | Native W3C Web Speech API (`window.speechSynthesis`) dengan paket suara Bahasa Indonesia (`id-ID`). |
| **Data Visualisasi & PDF** | Chart.js (`react-chartjs-2`) untuk grafik tren skor kemiripan, `jspdf`/`html2pdf.js` untuk ekspor laporan. |
| **Penyimpanan Data Sesi** | Browser `localStorage` / React Context State Memory. |
| **Target Deployment** | Vercel / Netlify / Cloudflare Pages. |

### 12.1 Rencana Refactor dari Codebase Saat Ini

Berdasarkan hasil analisis perbandingan codebase v1 terhadap dev guide v2, refactor disarankan bertahap dan **tidak mengubah kode secara langsung** sebelum tiga persiapan berikut selesai:

1. **Persiapan data referensi (golden data):** menyiapkan draf `angleTimeSeries` untuk sit-to-stand dan squat dari rekaman instruktur/fisioterapis mitra.
2. **Pembuatan modul algoritma baru:** `dtwCalculator.ts` dan `fatigueDetector.ts` sebagai modul komputasi murni di `src/engine/kinematics/`, dikembangkan dan diuji terpisah sebelum diintegrasikan ke alur utama.
3. **Refactor bertahap:** perbarui `src/types/` (data contract `UserProfile`, `ExerciseSession`, `ReferenceMovement`) terlebih dahulu tanpa merusak alur yang berjalan, baru menyesuaikan Context dan halaman UI (`Home.tsx`, `Calibration.tsx`, `Tracking.tsx`, `Summary.tsx`) secara berurutan.

`angleCalculator.ts` (kalkulasi sudut aturan kosinus) dan `emaFilter.ts` (smoothing) dari codebase saat ini **tetap dipakai tanpa perubahan**, karena keduanya sudah sesuai dengan kebutuhan v2.

---

## 13. Metrik Keberhasilan (Success Metrics / KPI)

| Metrik | Target | Cara Mengukur |
| :--- | :--- | :--- |
| **Frame Rate Pemrosesan** | ≥ 30 FPS konstan | Pengujian performa Chrome DevTools Performance Monitor pada smartphone mid-range. |
| **Akurasi Sudut Sendi** | Eror margin ≤ ±5° | Komparasi pembacaan sudut aplikasi terhadap pengukuran goniometer manual. |
| **Akurasi Skor Kemiripan Gerakan** | `[BUTUH VALIDASI: target belum ditetapkan]` | Bandingkan skor DTW/NCC sistem dengan penilaian kualitatif instruktur/fisioterapis terhadap rekaman yang sama. |
| **Sensitivitas Deteksi Kelelahan** | `[BUTUH VALIDASI, bersifat eksploratif untuk demo]` | Amati apakah `fatigueFlag` terpicu konsisten dengan laporan subjektif kelelahan dari responden uji coba. |
| **Skor Aksesibilitas Lansia** | SUS Score ≥ 80/100 | Kuesioner System Usability Scale (SUS) pada 15–20 responden uji coba. |
| **Keberhasilan Kalibrasi** | 100% tanpa *crash* | Uji coba deteksi kamera di berbagai variasi pencahayaan ruangan (>100 lux). |
| **Kepatuhan Regulasi Data** | 0 transmisi rekaman video | Audit lalu lintas jaringan (Network Tab) untuk memastikan zero video data upload. |

---

## 14. Linimasa & Milestone (Timeline)

Timeline berikut direvisi mengingat batas waktu submission SFT 2026 (20 September 2026) dan perubahan arsitektur inti yang baru diputuskan.

| Fase | Deskripsi Pengerjaan | Target Tanggal |
| :--- | :--- | :--- |
| **Fase 1–2 (selesai)** | Setup Vite+React, 4 halaman UI awal, integrasi MediaPipe Pose dan kalkulasi sudut. | 14 – 28 Agustus 2026 |
| **Fase 3: Perekaman Golden Data** | Rekam data gerakan referensi (sit-to-stand, squat bertahap) bersama instruktur/fisioterapis mitra; uji internal konfigurasi kamera (bagian 15). | 9 – 11 September 2026 |
| **Fase 4: Refactor Engine & Fitur Baru** | Bangun `dtwCalculator.ts` dan `fatigueDetector.ts`, perbarui `src/types/`, integrasikan ke Context dan halaman UI sesuai rencana di bagian 12.1. | 11 – 15 September 2026 |
| **Fase 5: Testing & Video Pitch** | Uji coba ke pengguna target, pengambilan footage demonstrasi purwarupa, penyusunan naskah video pitch. | 15 – 17 September 2026 |
| **Fase 6: Final Paper Polish & Submission** | Finalisasi paper ilmiah SFT 2026 (menyesuaikan Metode dengan arsitektur v2), rendering video pitch, pengujian akhir, pengunggahan seluruh berkas. | 18 – 20 September 2026 |

**Catatan risiko waktu:** rentang Fase 3–4 sangat singkat untuk perubahan arsitektur sebesar ini. Lihat mitigasi di bagian 15.1.

---

## 15. Risiko & Asumsi

### 15.1 Risiko

| Risiko | Dampak | Rencana Mitigasi |
| :--- | :--- | :--- |
| **Waktu Pengembangan Sangat Singkat:** Perubahan arsitektur inti (dari tabel ambang statis ke DTW/NCC + fatigue profiling) diputuskan kurang dari dua minggu sebelum tenggat submission. | Fitur baru berisiko tidak selesai atau tidak stabil saat demo. | Ikuti pembagian prioritas di dev guide v2 (Harus Ada / Boleh Disederhanakan / Roadmap). Jika DTW penuh terlalu kompleks dalam waktu tersisa, gunakan dulu skor kemiripan sederhana (misalnya NCC saja atau rata-rata selisih sudut absolut terhadap referensi) sebagai fallback yang tetap bisa didemokan. |
| **Konfigurasi Kamera Belum Final:** Sudut 45° yang diarahkan Pak Oji berpotensi bertentangan dengan temuan literatur (Baldinger dkk., 2025) untuk gerakan sejenis. | Akurasi sudut sendi bisa lebih rendah dari target jika konfigurasi salah dikunci. | Lakukan uji internal cepat (beberapa opsi sudut kamera) sebelum Fase 4 dimulai, sesuai catatan di dev guide bagian 7. |
| **Ketiadaan/Keterlambatan Golden Data:** Rekaman gerakan referensi dari instruktur/fisioterapis mitra belum tersedia. | Mesin DTW/NCC tidak bisa diuji atau didemokan. | Prioritaskan perekaman golden data di awal Fase 3, dengan minimal satu model referensi per tahap gerakan sebagai syarat minimum demo. |
| **Oklusi Pakaian Longgar:** Pengguna lansia mengenakan sarung/daster yang menutupi titik lutut. | Landmark lutut tidak terbaca sempurna. | Implementasi *heuristic skeleton tracking* yang mengestimasi posisi sendi dari titik pinggul dan pergelangan kaki. |
| **Pencahayaan Rendah:** Ruangan rumah penderita memiliki pencahayaan < 100 lux. | Akurasi estimasi titik pose menurun. | Peringatan otomatis di layar jika *confidence score* MediaPipe < 0,60. |
| **Izin Kamera Ditolak:** Pengguna tidak sengaja menekan tombol blokir izin kamera di browser. | Layar kamera menjadi hitam. | Sediakan *fallback message* dan instruksi mengaktifkan izin kamera pada kartu antarmuka. |

### 15.2 Asumsi

- Pengguna memiliki smartphone atau laptop dengan kamera depan minimal beresolusi 720p 30 FPS yang berfungsi baik.
- Browser pengguna mendukung Web Speech API dan memiliki koneksi internet saat pertama kali memuat model MediaPipe WASM.
- Tersedia minimal satu instruktur/fisioterapis mitra yang bersedia direkam sebagai sumber golden data untuk tahap sit-to-stand dan squat.
- Latihan yang dilakukan berfokus pada gerakan bidang sagital (sit-to-stand, squat) yang dapat diukur dari satu sudut kamera.

---

## 16. Stakeholder & Persetujuan

| Nama | Peran | Tanggal Persetujuan | Status |
| :--- | :--- | :--- | :--- |
| **Zaky Ramadhan** | Project Manager & Lead Developer | — | Menunggu persetujuan ulang (v2.0) |
| **Naufal Khalil Aldeza** | Computer Vision & Software Engineer | — | Menunggu persetujuan ulang (v2.0) |
| **Zahwa Rahmadhania** | UI/UX & Research Specialist | — | Menunggu persetujuan ulang (v2.0) |
| **Vanisa Firsy** | Technical Writer & QA Specialist | — | Menunggu persetujuan ulang (v2.0) |
| **Fazrol Rozi (Pak Oji)** | Dosen Pembimbing | — | Perlu konfirmasi ulang, khususnya soal konfigurasi kamera (bagian 15.1) |

---

## 17. Lampiran (Appendix)

- **Dokumen Konsep Solusi:** Concept Paper Samsung Solve for Tomorrow 2026 — Tim SPEKTRA Politeknik Negeri Padang.
- **Dokumen Rujukan Teknis:** `OA-Motion_Dev_Guide.md` (v2).
- **Notulensi Diskusi Dosen Pembimbing:** Notulensi diskusi dengan Pak Fazrol Rozi, 4 September 2026.
- **Rujukan Akademis Utama (terverifikasi ke sumber primer):**
  - Ullah, R. dkk. (2025) 'A real time action scoring system for movement analysis and feedback in physical therapy using human pose estimation', *Scientific Reports*.
  - Baldinger, M., Reimer, L.M., dan Senner, V. (2025) 'Influence of the Camera Viewing Angle on OpenPose Validity in Motion Analysis', *Sensors*, 25(3), 799.
  - Pratapneni, A. dkk. (2026) 'Validating Single-Camera Pose Estimation Against Multi-Camera Motion Capture for Accessible Biomechanical Assessment', *IEEE Access*, 14, hal. 66264–66274.
  - Michaels, R. dkk. (2026) 'Validity of multiple human pose estimation tools for measuring knee impact angles in video-captured falls of older adults', *PLOS ONE*, 21(7), e0335108.
  - Rujukan lain (Riccio 2024, Jain & Kulkarni 2025, Slupczynski dkk. 2024, Peng dkk. 2026, Naseer dkk. 2025, Russo dkk. 2026, Scataglini dkk. 2025, Rambely & Fazrolrozi 2012) masih berstatus `[VERIFIKASI SITASI]`, perlu dicek detail bibliografinya sebelum dipakai formal di paper.
- **Dasar Hukum & Standar:** UU Pelindungan Data Pribadi No. 27 Tahun 2022, Permenkes No. 24 Tahun 2022, Standar Aksesibilitas WCAG 2.1 Level AAA.

---

## 18. Riwayat Revisi Dokumen

**v2.0 (09/09/2026)** — Revisi menyeluruh berdasarkan arahan dosen pembimbing (Pak Fazrol Rozi) dan dev guide v2:
- Mengganti arsitektur personalisasi dari tabel ambang derajat statis per Grade OA menjadi perbandingan terhadap data gerakan referensi (golden data) memakai DTW/NCC.
- Mengganti profil pengguna dari input medis (Grade OA, skala nyeri, riwayat operasi) menjadi kapabilitas fungsional (duduk/berdiri, status pendampingan, target repetisi).
- Menambahkan progresi dua tahap (sit-to-stand → squat bertahap) dan mode latihan (mandiri dengan overlay referensi / dengan pendamping).
- Menambahkan fitur baseline kelelahan adaptif (fatigue profiling) berbasis data sesi pengguna sendiri.
- Mengganti fokus laporan dari PDF fisioterapis menjadi laporan untuk keluarga sebagai prioritas MVP; laporan fisioterapis dua arah dipindah ke roadmap.
- Memperbarui konfigurasi kamera dari 1,5–2 meter tampak samping menjadi 3 meter serong 45 derajat, dengan catatan terbuka soal validasi (belum dikunci final).
- Memperbaiki data epidemiologi di bagian Latar Belakang yang sebelumnya memakai sitasi yang tidak dapat diverifikasi.
- Menambahkan rencana refactor bertahap dari codebase v1 ke v2 (bagian 12.1) dan risiko keterbatasan waktu pengembangan (bagian 15.1).

**v1.0 (23/08/2026)** — Versi awal MVP untuk submission SFT 2026, berbasis adaptive thresholding per Grade OA.