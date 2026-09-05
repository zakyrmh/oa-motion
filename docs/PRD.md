# Product Requirements Document (PRD) — OA-Motion

---

## 1. Informasi Dokumen

| Item | Keterangan |
| --- | --- |
| **Nama Proyek** | **OA-Motion: Sistem Panduan Olahraga Adaptif Berbasis Computer Vision dan Kecerdasan Buatan untuk Penderita Osteoarthritis** |
| **Pemilik Produk (Product Owner)** | Zaky Ramadhan (Ketua Tim SPEKTRA) |
| **Penulis Dokumen** | Tim SPEKTRA (Zaky Ramadhan, Naufal Khalil Aldeza, Zahwa Rahmadhania, Vanisa Firsy) |
| **Tanggal Dibuat** | 23/08/2026 |
| **Versi Dokumen** | v1.0 (MVP Release — Samsung Solve for Tomorrow 2026) |
| **Status** | Disetujui |

---

## 2. Ringkasan Eksekutif

**OA-Motion** adalah aplikasi web kesehatan berbasis *Edge AI* dan *Computer Vision* yang menyediakan panduan latihan fisik mandiri (berfokus pada gerakan **Squat adaptif**) secara preventif, aman, dan *real-time* bagi penderita Osteoarthritis (OA) lutut (Grade 1–3) serta pasien rehabilitasi pasca-operasi. Aplikasi ini **secara eksplisit tidak ditujukan untuk penderita OA Grade 4**, yang memerlukan pengawasan klinis langsung. Sistem memanfaatkan kamera bawaan smartphone atau laptop tanpa memerlukan sensor atau *wearable device* tambahan (*zero hardware barrier*).

Melalui integrasi MediaPipe Tasks Vision (`PoseLandmarker`) dan aturan trigonometri kosinus, OA-Motion bertindak sebagai **"Digital Spotter"** yang menyesuaikan batas aman gerakan (*Range of Motion* / RoM) secara adaptif berdasarkan profil klinis individu, memberikan peringatan visual dan suara Bahasa Indonesia sebelum risiko cedera terjadi (*preventive feedback*), serta mencatat ringkasan sesi latihan telerehabilitasi. Proyek ini dikembangkan oleh Tim SPEKTRA (Politeknik Negeri Padang) untuk kompetisi **Samsung Solve for Tomorrow (SFT) 2026** di bawah tema *Sport & Technology* guna mendukung pencapaian SDGs 1, 3, dan 10.

---

## 3. Latar Belakang & Masalah

### 3.1 Latar Belakang

Osteoarthritis (OA) adalah penyakit degeneratif sendi paling umum di dunia dan penyebab utama disabilitas fisik pada lansia, dengan lebih dari 528 juta penderita secara global (WHO, 2023). Di Indonesia, prevalensi OA lutut mencapai 34,3% pada populasi usia di atas 40 tahun (Kemenkes RI, 2022), didominasi oleh perempuan (60% kasus) dan lansia.

Aktivitas fisik terstruktur merupakan terapi non-farmakologis paling efektif untuk memperlambat kerusakan kartilago sendi. Namun, penderita menghadapi kendala biaya pendampingan fisioterapi rutin (Rp150.000–Rp400.000 per sesi) yang membebani masyarakat menengah ke bawah.

### 3.2 Masalah yang Ingin Diselesaikan

- **Ketakutan Berolahraga (*Fear-Avoidance Behavior*):** Penderita OA ragu bergerak karena takut rasa nyeri atau takut memperparah cedera sendi jika salah melakukan form latihan.
- **Ketiadaan Panduan Personal di Rumah:** Video tutorial umum di internet bersifat generik dan tidak dapat menyesuaikan batas tekukan lutut yang berbeda antara penderita OA Grade 1, 2, atau 3.
- **Keterbatasan Akses & Biaya Fisioterapi:** Penderita lansia di daerah sulit mengunjungi klinik fisioterapi setiap hari secara konsisten.
- **Distorsi Pengukuran (*Parallax Error*):** Pengguna awam yang merekam gerakan mandiri sering meletakkan kamera pada sudut yang salah, menyebabkan evaluasi gerakan menjadi tidak akurat.

---

## 4. Tujuan & Sasaran (Goals & Objectives)

| No | Tujuan | Indikator Keberhasilan (Terukur) |
| :--- | :--- | :--- |
| 1 | Mengembangkan engine Computer Vision *on-device* yang mampu mendeteksi sendi dan menghitung sudut fleksi lutut secara *real-time*. | Latensi inferensi $\le 33\text{ ms}$ per frame ($\ge 30\text{ FPS}$) dengan batas toleransi eror sudut $\le \pm5^\circ$ terhadap goniometer manual. |
| 2 | Menghadirkan antarmuka latihan adaptif yang ramah lansia dan mudah digunakan tanpa bantuan teknis rumit. | Skor *System Usability Scale* (SUS) $\ge 80$ (Kategori *Excellent*) dari uji coba pengguna lansia. |
| 3 | Mencegah risiko cedera sendi saat latihan mandiri melalui umpan balik suara Bahasa Indonesia. | Umpan balik suara otomatis terpicu dalam waktu $< 100\text{ ms}$ saat sudut lutut memasuki batas waspada (*Yellow Zone*). |
| 4 | Menyediakan data kemajuan pemulihan yang terdigitalisasi untuk kebutuhan telerehabilitasi jarak jauh. | Laporan ringkasan sesi latihan dan grafik tren RoM dapat diunduh instan dalam format dokumen PDF. |

---

## 5. Target Pengguna (User Persona)

### Persona 1: Ibu Hartini (68 Tahun) — Penderita OA Lutut Grade 2
- **Demografi:** Lansia, tinggal di rumah, memiliki keterbatasan pemahaman teknologi kompleks.
- **Kebutuhan:** Panduan gerakan sendi yang aman, instruksi suara yang jelas, tombol antarmuka yang besar, dan kepastian bahwa gerakan tidak merusak sendi.
- **Pain Points:** Takut lutut bertambah bengkak jika salah gerak, tidak ada anggota keluarga yang menemani setiap saat, biaya fisioterapi mahal jika dilakukan harian.
- **Tujuan Menggunakan Website:** Melakukan pemanasan dan penguatan otot paha secara mandiri dengan pendampingan suara virtual.

### Persona 2: Pak Doni (54 Tahun) — Pasca-Operasi Rekonstruksi Lutut
- **Demografi:** Pria usia produktif, aktif bekerja, dalam masa rehabilitasi pasca-bedah.
- **Kebutuhan:** Konfirmasi data objektif apakah sudut tekukan latihan (*Range of Motion*) sudah sesuai target protokol rehabilitasi.
- **Pain Points:** Tidak memiliki waktu untuk bolak-balik ke klinik rumah sakit di sela jam kerja.
- **Tujuan Menggunakan Website:** Memantau sudut fleksi lutut secara mandiri di rumah dan mengekspor grafik perkembangan untuk dikirim ke dokter.

### Persona 3: Fisioterapis / Tenaga Medis Mitra (Target Sekunder)
- **Demografi:** Praktisi fisioterapi klinik atau poli rehabilitasi medik rumah sakit.
- **Kebutuhan:** Data kepatuhan dan tren capaian RoM pasien saat berlatih di rumah.
- **Pain Points:** Pasien sering lupa atau tidak disiplin melakukan *home-exercise*, serta sulit memverifikasi kebenaran laporan lisan pasien.
- **Tujuan Menggunakan Website:** Meninjau lembar rekapitulasi sesi latihan terdigitalisasi sebagai dasar penyesuaian program terapi.

---

## 6. Ruang Lingkup (Scope)

### 6.1 Termasuk dalam Cakupan (In Scope — MVP Release SFT 2026)
- **Formulir Profil Medis Dinamis & Disclaimer:** Pengaturan Grade OA (1–3), pilihan sisi lutut (kiri/kanan/keduanya), slider skala nyeri harian (VAS 1–10), riwayat operasi lutut, dan *Medical Disclaimer* eksplisit.
- **Pemandu Kalibrasi Kamera Visual & Audio:** Validasi jarak (1,5–2 meter), garis siluet tubuh tampak samping (*lateral plane*), dan instruksi suara kalibrasi.
- **Kinematic Engine (Edge AI — Gerakan Squat Inti):** Ekstraksi 33 landmark tubuh via MediaPipe Tasks Vision (`PoseLandmarker`), perhitungan sudut Aturan Kosinus (Hip-Knee-Ankle), dan penghalusan sudut (*EMA smoothing*).
- **Umpan Balik Preventif 3 Zona:** Status banner warna (Hijau, Kuning, Merah) dengan *adaptive thresholding* per Grade OA dan sintesis suara otomatis Bahasa Indonesia via Web Speech API.
- **Dashboard Ringkasan & Ekspor Snapshot Sesi:** Kartu metrik durasi, rata-rata RoM, jumlah peringatan zona merah, persentase repetisi aman, serta generator ekspor/unduh PDF ringkasan sesi.
- **Arsitektur Zero Video Transmission:** Pemrosesan frame kamera murni di RAM perangkat klien tanpa pengiriman data video ke luar.

### 6.2 Tidak Termasuk dalam Cakupan (Out of Scope — Rencana Fase Lanjutan)
- **Penderita OA Grade 4:** Kondisi sendi berat/tulang bergesekan langsung yang mutlak memerlukan pendampingan fisik tenaga medis di klinik.
- **Sistem Pembayaran & Akun Multi-user Kompleks:** Tidak diperlukan untuk purwarupa demo kompetisi.
- **Integrasi Dua Arah Rekam Medis Elektronik (EHR):** Cukup format dokumen PDF portabel untuk demonstrasi.
- **Pelacakan Sendi Non-Lutut:** Fokus penuh pada sendi lutut dan biomekanika squat.
- **Sensor Hardware Tambahan (Wearable/IMU):** Mempertahankan prinsip *Zero Hardware Barrier*.

---

## 7. Kebutuhan Fungsional (Functional Requirements)

| ID | Nama Fitur | Deskripsi | Prioritas (MoSCoW) |
| :--- | :--- | :--- | :--- |
| **FR-01** | Pengaturan Profil Klinis | Pengguna dapat memilih Grade OA (1/2/3), target lutut (kiri/kanan/keduanya), skala nyeri VAS (1–10), dan status operasi. | **Must Have** |
| **FR-02** | *Adaptive Threshold Locking* | Sistem mengunci ambang batas sudut fleksi squat (Zona Hijau/Kuning/Merah) dinamis berdasarkan Grade OA `[BUTUH VALIDASI KLINIS]`. | **Must Have** |
| **FR-03** | Kalibrasi Kamera AR & Suara | Menampilkan siluet *bounding box* tampak samping dan instruksi penempatan kamera jarak 1,5–2 meter. | **Must Have** |
| **FR-04** | Deteksi Landmark MediaPipe | Mengidentifikasi koordinat titik panggul, lutut, dan pergelangan kaki dari kamera secara *real-time* on-device. | **Must Have** |
| **FR-05** | Kalkulasi Sudut Trigonometri | Menghitung sudut tekukan fleksi lutut secara otomatis pada setiap frame menggunakan aturan kosinus. | **Must Have** |
| **FR-06** | Indikator Visual 3 Zona | Mengubah warna banner atas (Hijau/Kuning/Merah) secara live sesuai posisi kedalaman squat aktif. | **Must Have** |
| **FR-07** | *Preventive Voice Alerts* | Membunyikan suara Bahasa Indonesia saat gerakan pengguna mendekati batas waspada (Zona Kuning/Merah) dengan *audio debounce*. | **Must Have** |
| **FR-08** | Tombol Darurat (Emergency Stop) | Pengguna dapat menghentikan sesi seketika melalui tombol besar yang selalu terlihat di viewport. | **Must Have** |
| **FR-09** | Ringkasan Sesi & Metrik RoM | Menampilkan metrik durasi latihan, rata-rata sudut fleksi, jumlah pengulangan aman, dan frekuensi peringatan bahaya. | **Must Have** |
| **FR-10** | Generator Unduh Dokumen PDF | Menghasilkan ringkasan laporan sesi latihan telerehabilitasi terstruktur dalam format PDF. | **Should Have** |
| **FR-11** | Kontrol Bisu Suara (*Mute Toggle*) | Pengguna dapat mematikan atau menyalakan suara instruksi kapan saja dari header. | **Could Have** |
| **FR-12** | *Medical Disclaimer & Exclusion Notice* | Menampilkan pernyataan bahwa aplikasi adalah alat bantu latihan mandiri (bukan diagnostik) dan mengecualikan Grade 4. | **Must Have** |

---

## 8. Kebutuhan Non-Fungsional (Non-Functional Requirements)

| Kategori | Kebutuhan Spesifik |
| :--- | :--- |
| **Performa & FPS** | Proses inferensi Computer Vision harus berjalan stabil minimal 30 FPS dengan latensi pengolahan $\le 33\text{ ms}$ per frame di browser perangkat klien. |
| **Kecepatan Respon Audio** | Waktu jeda antara terdeteksinya sudut berisiko dan keluarnya suara peringatan Web Speech API tidak boleh melebihi $100\text{ ms}$. |
| **Aksesibilitas Lansia** | Mematuhi standar **WCAG 2.1 AAA**: Kontras rasio warna minimal 7:1, ukuran font minimal 18pt untuk teks panduan, dan area sentuh tombol minimal $48 \times 48\text{ dp}$. |
| **Keamanan & Privasi Data** | Menerapkan prinsip *Zero Video Transmission* (UU PDP No. 27/2022): Stream kamera hanya diproses pada memori sementara (RAM) dan tidak pernah direkam atau diunggah ke server mana pun. |
| **Kompatibilitas Platform** | Dapat dijalankan langsung tanpa instalasi pada peramban web modern (Google Chrome, Microsoft Edge, Mozilla Firefox, Safari) di laptop maupun smartphone Android/iOS. |
| **Efisiensi Memori** | Konsumsi memori peramban (*RAM footprint*) saat proses pelacakan kamera aktif tidak boleh melebihi 500 MB. |

---

## 9. User Stories / Skenario Penggunaan

- **Sebagai penderita OA lansia (Ibu Hartini),** saya ingin aplikasi memberi tahu jika tekukan lutut saya sudah terlalu dalam lewat suara Bahasa Indonesia, agar saya tidak mengalami cedera sendi saat berlatih sendirian di rumah.
- **Sebagai penderita OA (Ibu Hartini),** saya ingin tampilan tombol berukuran besar dan memiliki warna kontras tinggi, agar saya dapat mengoperasikan aplikasi dengan mudah tanpa kacamata baca.
- **Sebagai pasien pasca-operasi (Pak Doni),** saya ingin melihat angka sudut lutut saya secara langsung di layar saat squat, agar saya tahu apakah latihan saya sudah memenuhi batas anjuran dokter.
- **Sebagai pengguna mandiri,** saya ingin dipandu saat meletakkan posisi smartphone dengan kotak siluet dan petunjuk suara, agar sudut kamera saya pas dan pengukurannya akurat.
- **Sebagai pengguna,** saya ingin mengunduh laporan PDF hasil latihan mingguan, agar saya bisa memperlihatkannya kepada fisioterapis saya saat jadwal konsultasi.

---

## 10. Struktur Halaman & Sitemap

```text
[ Halaman 1: Setup Profil ] ( / )
            │
            ▼
[ Halaman 2: Kalibrasi Kamera ] ( /calibration )
            │
            ▼
[ Halaman 3: Live Exercise Tracking ] ( /tracking )
            │
            ▼
[ Halaman 4: Ringkasan Sesi & Ekspor PDF ] ( /summary )
```

| No | Nama Halaman | Route | Tujuan Halaman | Konten Utama |
| :--- | :--- | :--- | :--- | :--- |
| 1 | Pengaturan Profil Medis | `/` | Mengumpulkan data klinis dan menentukan batas RoM. | Pilihan kartu Grade OA 1–3, slider skala nyeri VAS (1–10), tombol toggle riwayat operasi, dan tombol lanjut. |
| 2 | Kalibrasi Kamera | `/calibration` | Memastikan posisi smartphone tegak lurus dan berjarak pas. | Live camera feed, visual siluet putus-putus (*bounding box*), badge jarak 1.5–2m, kartu instruksi suara, dan tombol mulai latihan. |
| 3 | Latihan Real-Time | `/tracking` | Ruang kerja latihan mandiri dengan pelacakan sudut sendi. | Banner status zona (Hijau/Kuning/Merah), skeleton overlay hijau, bubble sudut lutut aktif, subtitle suara AI, dan tombol darurat hentikan latihan. |
| 4 | Ringkasan Latihan | `/summary` | Menampilkan analitik sesi dan unduh laporan. | Kartu metrik durasi, rata-rata RoM, jumlah peringatan, persentase kepatuhan, grafik tren repetisi, dan tombol unduh PDF. |

---

## 11. Desain & Pengalaman Pengguna (UI/UX)

- **Tema Visual & Moodboard:** Bersih, klinis, modern, dan sangat kontras (*Dark Mode Overlay* untuk kamera, *Clean Slate White* untuk formulir dan analitik).
- **Palet Warna Utama:**
  - **Emerald Green (`#d1ffca` / `#10B981`):** Zona Aman, konfirmasi sukses, dan tombol aksi utama.
  - **Amber Yellow (`#fff100` / `#F59E0B`):** Zona Waspada / batas mendekati bahaya.
  - **Crimson Red (`#EF4444` / `#DC2626`):** Zona Bahaya (Stop), batas cedera, dan tombol darurat.
  - **Deep Black & Slate (`#000000` / `#1E293B`):** Background kontras tinggi dan teks utama.
- **Tipografi:** Sans-serif (Inter / Roboto) dengan ketebalan *Bold* dan *ExtraBold* untuk kemudahan membaca lansia.
- **Aset UI/UX:** Mengacu pada 4 rancangan layar terverifikasi Google Stitch yang mencakup visual *camera bounding box*, *skeleton tracking*, dan *dashboard analytics*.

---

## 12. Kebutuhan Teknis (Technical Requirements)

| Item | Keterangan |
| :--- | :--- |
| **Arsitektur Sistem** | Single Page Application (SPA) — 100% Client-Side Edge AI Processing. |
| **Framework & Build Tool** | Vite 6.x / 8.x + React 19 (TypeScript / TSX). |
| **Styling Library** | Tailwind CSS 4.x + Lucide React Icons + shadcn/ui. |
| **Machine Learning Engine** | Google MediaPipe Tasks Vision (`@mediapipe/tasks-vision`, `PoseLandmarker`) berbasis WebAssembly (WASM). |
| **Speech Engine** | Native W3C Web Speech API (`window.speechSynthesis`) dengan paket suara Bahasa Indonesia (`id-ID`). |
| **Data Visualisasi & PDF** | Chart.js (`react-chartjs-2`) untuk grafik garis dan `jspdf` / `html2pdf.js` untuk ekspor dokumen. |
| **Penyimpanan Data Sesi** | Browser `localStorage` / React Context State Memory (Mocked Telemetry). |
| **Target Deployment** | Vercel / Netlify / Cloudflare Pages. |

---

## 13. Metrik Keberhasilan (Success Metrics / KPI)

| Metrik | Target | Cara Mengukur |
| :--- | :--- | :--- |
| **Frame Rate Pemrosesan** | $\ge 30\text{ FPS}$ konstan | Pengujian performa Chrome DevTools Performance Monitor pada smartphone mid-range. |
| **Akurasi Sudut Sendi** | Eror margin $\le \pm5^\circ$ | Komparasi pembacaan sudut aplikasi terhadap pengukuran goniometer manual. |
| **Skor Aksesibilitas Lansia** | SUS Score $\ge 80 / 100$ | Kuesioner System Usability Scale (SUS) pada 15–20 responden uji coba. |
| **Keberhasilan Kalibrasi** | $100\%$ tanpa *crash* | Uji coba deteksi kamera di berbagai variasi pencahayaan ruangan ($>100\text{ lux}$). |
| **Kepatuhan Regulasi Data** | $0$ transmisi rekaman video | Audit lalu lintas jaringan (Network Tab) untuk memastikan zero video data upload. |

---

## 14. Linimasa & Milestone (Timeline)

| Fase | Deskripsi Pengerjaan | Target Tanggal |
| :--- | :--- | :--- |
| **Fase 1: Setup & UI Scaffolding** | Setup Vite+React, implementasi 4 halaman UI (Home, Calibration, Tracking, Summary) sesuai rancangan Google Stitch. | 14 – 21 Agustus 2026 |
| **Fase 2: Core ML Engine & Audio Integration** | Integrasi MediaPipe Pose, kalkulasi aturan kosinus, penghalusan EMA, dan voice synthesizer Bahasa Indonesia. | 22 – 28 Agustus 2026 |
| **Fase 3: Testing & Video Pitch Production** | Uji coba ke pengguna lansia/target, pengambilan footage demonstrasi prototipe, dan penyusunan naskah video pitch. | 29 Ags – 5 Sep 2026 |
| **Fase 4: Final Paper Polish & Video Editing** | Finalisasi penulisan dokumen paper ilmiah SFT 2026, rendering video pitch, dan pengujian akhir sistem. | 6 – 15 September 2026 |
| **Fase 5: Final Submission** | Pengunggahan seluruh berkas (Final Paper, Link Demo Prototipe, dan Video Pitch) ke portal Samsung Solve for Tomorrow. | 18 – 20 September 2026 |

---

## 15. Risiko & Asumsi

### 15.1 Risiko

| Risiko | Dampak | Rencana Mitigasi |
| :--- | :--- | :--- |
| **Oklusi Pakaian Longgar:** Pengguna lansia mengenakan sarung/daster yang menutupi titik lutut. | Landmark lutut tidak terbaca sempurna. | Implementasi *heuristic skeleton tracking* yang mengestimasi posisi sendi dari titik pinggul dan pergelangan kaki. |
| **Pencahayaan Rendah:** Ruangan rumah penderita memiliki pencahayaan $< 100\text{ lux}$. | Akurasi estimasi titik pose menurun. | Peringatan otomatis di layar jika *confidence score* MediaPipe $< 0.60$. |
| **Izin Kamera Ditolak:** Pengguna tidak sengaja menekan tombol blokir izin kamera di browser. | Layar kamera menjadi hitam. | Menyediakan *fallback message* dan instruksi panduan mengaktifkan izin kamera pada kartu antarmuka. |

### 15.2 Asumsi

- Pengguna memiliki smartphone atau laptop dengan kamera depan minimal beresolusi 720p 30 FPS yang berfungsi dengan baik.
- Browser pengguna mendukung Web Speech API dan memiliki koneksi internet saat pertama kali memuat model MediaPipe WASM.
- Latihan yang dilakukan berfokus pada gerakan bidang lateral (tampak samping) seperti *adaptive squat*, *chair stand*, dan *leg extension*.

---

## 16. Stakeholder & Persetujuan

| Nama | Peran | Tanggal Persetujuan | Status |
| :--- | :--- | :--- | :--- |
| **Zaky Ramadhan** | Project Manager & Lead Developer | 23/08/2026 | Disetujui |
| **Naufal Khalil Aldeza** | Computer Vision & Software Engineer | 23/08/2026 | Disetujui |
| **Zahwa Rahmadhania** | UI/UX & Research Specialist | 23/08/2026 | Disetujui |
| **Vanisa Firsy** | Technical Writer & QA Specialist | 23/08/2026 | Disetujui |

---

## 17. Lampiran (Appendix)

- **Dokumen Konsep Solusi:** *Concept Paper Samsung Solve for Tomorrow 2026 — Tim SPEKTRA Politeknik Negeri Padang*.
- **Rancangan Antarmuka:** 4 Screen UI Flow dari Google Stitch (Setup Profil Medis, Kalibrasi Kamera AR, Active Tracking Hero Workspace, dan Summary Telerehabilitasi).
- **Dasar Hukum & Standar:** UU Pelindungan Data Pribadi No. 27 Tahun 2022, Permenkes No. 24 Tahun 2022, dan Standar Aksesibilitas WCAG 2.1 Level AAA.
