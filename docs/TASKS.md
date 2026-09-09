# Task List — Development Breakdown OA-Motion (SFT 2026)

---

## 1. Informasi Dokumen

| Item | Keterangan |
| --- | --- |
| **Nama Proyek** | **OA-Motion: Adaptive Sports Guidance System** |
| **Dokumen Referensi (PRD)** | `docs/PRD.md` (v1.0 — MVP Release) & `docs/OA-Motion_Dev_Guide.md` |
| **Penulis** | Tim SPEKTRA (Zaky Ramadhan, Naufal Khalil Aldeza, Zahwa Rahmadhania, Vanisa Firsy) |
| **Tanggal Dibuat** | 23/08/2026 |
| **Versi** | v1.0 |
| **AI Agent yang Digunakan** | Antigravity CLI / Claude Code / Cursor |

---

## 2. Tujuan Dokumen

Dokumen ini memecah kebutuhan produk dari `PRD.md` dan `OA-Motion_Dev_Guide.md` menjadi unit-unit tugas teknis terukur dengan target penyelesaian akhir **15 September 2026**. Dokumen ini menjadi acuan kerja operasional bagi seluruh anggota Tim SPEKTRA dan AI Coding Agent guna memastikan kejelasan ruang lingkup (*scope*), pembagian tugas (*responsibility*), dependensi antarmodul, serta definisi selesai (*Definition of Done*).

---

## 3. Keterangan Status & Prioritas

| Simbol Status | Arti |
| --- | --- |
| 🔴 Belum Dikerjakan | Belum dimulai |
| 🟡 Sedang Dikerjakan | Dalam proses pengerjaan |
| 🟢 Selesai | Sudah selesai & diverifikasi sesuai kriteria |
| ⚪ Diblokir | Terhambat dependency atau keputusan lain |

| Prioritas | Arti |
| --- | --- |
| **P0** | Kritis — Wajib ada untuk demonstrasi MVP & Video Pitch |
| **P1** | Penting — Diperlukan untuk kelengkapan Final Paper & Analisis Data |
| **P2** | Bagus untuk ada — Fitur tambahan jika waktu memungkinkan |

---

## 4. Ringkasan Fase Pengembangan (Deadline: 15 September 2026)

| Fase | Deskripsi | Target Selesai |
| --- | --- | --- |
| **Fase 1 — Setup, State Routing & UI Base** | Inisialisasi Vite React, Tailwind CSS, struktur folder modular, halaman `Home`, dan `Calibration`. | 26 Agustus 2026 |
| **Fase 2 — Core Edge AI, Kinematic & Audio Engine** | Integrasi MediaPipe Pose WASM, kalkulasi Aturan Kosinus, filter EMA, dan Web Speech API. | 31 Agustus 2026 |
| **Fase 3 — UI Tracking, Analytics & Telerehab PDF** | Pembangunan halaman `Tracking.tsx`, `Summary.tsx`, Chart.js, dan generator PDF. | 5 September 2026 |
| **Fase 4 — Testing, QA & Validasi Klinis/SUS** | Pengujian akurasi goniometer ($\le \pm5^\circ$), survei SUS lansia, dan *bug fixing*. | 10 September 2026 |
| **Fase 5 — Final Paper, Video Pitch & Deployment** | Finalisasi naskah paper ilmiah SFT 2026, produksi & editing video pitch 3 menit, serta deploy live. | 15 September 2026 |

---

## 5. Daftar Tugas

### Fase 1 — Setup, State Routing & UI Base (23 – 26 Agustus 2026)

| ID | Tugas | Deskripsi | Prioritas | Dependency | Status | PIC |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **T-001** | Inisialisasi Proyek & Boilerplate | Setup Vite + React 19 (TypeScript), Tailwind CSS v4, Lucide React, shadcn/ui. | P0 | - | 🟢 | Zaky Ramadhan |
| **T-002** | Implementasi UI `Home.tsx` | Form pemilihan Grade OA 1–3, Slider Skala Nyeri VAS, dan toggle riwayat operasi. | P0 | T-001 | 🟢 | Zaky Ramadhan |
| **T-002B**| UI Disclaimer & Knee Selector | Penambahan banner Medical Disclaimer (eksklusi Grade 4) & selector sisi lutut di `Home.tsx`. | P0 | T-002 | 🟢 | Zaky Ramadhan |
| **T-003** | Implementasi UI & Kamera `Calibration.tsx` | Layout siluet tampak samping, `useCamera` hook, dan izin kamera mobile. | P0 | T-001 | 🟢 | Zaky Ramadhan |
| **T-004** | State Navigation & Context Data Flow | Sinkronisasi state profil medis (`MedicalProfileContext`) antarhalaman dan persistensi `localStorage`. | P0 | T-002, T-003 | 🟢 | Zaky Ramadhan |

---

### Fase 2 — Core Edge AI, Kinematic & Audio Engine (27 – 31 Agustus 2026)

| ID | Tugas | Deskripsi | Prioritas | Dependency | Status | PIC |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **T-005** | Integrasi `@mediapipe/tasks-vision` WASM | Setup pipeline deteksi 33 landmark tubuh via browser webcam (`PoseLandmarker`) di RAM lokal. | P0 | T-001 | 🟢 | Naufal Khalil Aldeza |
| **T-006** | Engine Biomekanika `angleCalculator.ts` | Kalkulasi sudut fleksi lutut ($\theta$) berbasis Aturan Kosinus (vektor Hip-Knee-Ankle 2D & 3D). | P0 | T-005 | 🟢 | Naufal Khalil Aldeza |
| **T-007** | Filter Smoothing & Heuristic Tracking | Implementasi `EMAFilter` ($\alpha=0.25$) dan penanganan oklusi pakaian longgar (`occlusionHeuristics.ts`). | P0 | T-006 | 🟢 | Naufal Khalil Aldeza |
| **T-008** | Adaptive Rules Engine & Safe RoM | Pemetaan dinamis ambang batas fleksi aman per Grade OA 1–3 (`rulesEngine.ts`). | P0 | T-004, T-006 | 🟢 | Naufal Khalil Aldeza |
| **T-009** | Audio Controller `ttsEngine.ts` & Synth | Web Speech API Bahasa Indonesia (`id-ID`) anti-spam debounce & Web Audio synthesizer tones. | P0 | T-008 | 🟢 | Zaky Ramadhan |

---

### Fase 3 — UI Tracking, Analytics & Telerehab PDF (1 – 5 September 2026)

| ID | Tugas | Deskripsi | Prioritas | Dependency | Status | PIC |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **T-010** | Implementasi Layar `Tracking.tsx` | Hero screen latihan: Canvas skeleton overlay, badge sudut real-time, dan status banner 3 zona. | P0 | T-005, T-008, T-009 | 🟢 | Zaky Ramadhan |
| **T-011** | Emergency Stop & Session Aggregator | Logika tombol berhenti darurat, pencatatan durasi latihan, peak RoM, dan frekuensi peringatan. | P0 | T-010 | 🟢 | Zaky Ramadhan |
| **T-012** | Implementasi Layar `Summary.tsx` | Dashboard pasca-latihan: 4 kartu metrik (Durasi, RoM, Warning Red Zone, Kepatuhan). | P0 | T-011 | 🟢 | Zaky Ramadhan |
| **T-013** | Visualisasi Grafik RoM Sesi Terakhir | Render grafik garis tren sudut fleksi 1 sesi terakhir dengan garis batas ambang zona aman. | P1 | T-012 | 🟢 | Zaky Ramadhan |
| **T-014** | Generator Unduh PDF Ringkasan Sesi | Fitur unduh rekapitulasi data telerehabilitasi 1 sesi terstruktur untuk dibagikan ke fisioterapis. | P1 | T-012 | 🟢 | Zaky Ramadhan |

---

### Fase 4 — Testing, QA & Validasi Klinis/SUS (6 – 10 September 2026)

| ID | Tugas | Deskripsi | Prioritas | Dependency | Status | PIC |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **T-015** | Validasi Akurasi Eror Sudut Sendi | Pengujian komparasi pembacaan sudut OA-Motion vs Goniometer Manual (Target error $\le \pm5^\circ$). | P0 | T-010 | 🔴 | Vanisa Firsy |
| **T-016** | Usability Testing Lansia (SUS Survey) | Uji coba langsung ke responden target lansia dan penghitungan skor kuesioner SUS (Target $\ge 80$). | P1 | T-010, T-012 | 🔴 | Zahwa Rahmadhania |
| **T-017** | Cross-Browser & Performance QA | Uji kestabilan frame rate ($\ge 30\text{ FPS}$), memory leak, dan respon di Chrome Android/Laptop. | P0 | T-010 | 🔴 | Vanisa Firsy |

---

### Fase 5 — Final Paper, Video Pitch & Deployment (11 – 15 September 2026)

| ID | Tugas | Deskripsi | Prioritas | Dependency | Status | PIC |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **T-018** | Penulisan Final Concept Paper SFT | Penyusunan laporan ilmiah lengkap SFT 2026 (Latar belakang, STEM, hasil validasi, etika data). | P0 | T-015, T-016 | 🔴 | Vanisa Firsy |
| **T-019** | Storyboard & Shooting Video Pitch | Pembuatan naskah video 3 menit, pengambilan footage persona "Ibu Hartini", dan live demo alat. | P0 | T-010, T-012 | 🔴 | Zahwa Rahmadhania |
| **T-020** | Video Editing & Motion Graphic | Editing video pitch: dubbing jernih, teks kontras tinggi, cut-to-cut demo UI, dan rendering MP4 1080p. | P0 | T-019 | 🔴 | Vanisa Firsy |
| **T-021** | Live Deployment & Production Audit | Deploy aplikasi web ke Vercel/Cloudflare Pages, uji HTTPS, dan verifikasi Zero Video Transmission. | P0 | T-014, T-017 | 🔴 | Zaky Ramadhan |

---

## 6. Detail Tugas (Untuk Tugas Kompleks)

### T-006 — Engine Biomekanika `angleCalculator.ts`
- **Tujuan:** Menghitung sudut tekukan sendi lutut (*knee flexion angle*) secara matematis pada setiap frame kamera.
- **Instruksi/Konteks untuk AI Agent:**
  1. Gunakan fungsi murni `calculateJointAngle2D(hip, knee, ankle)` di `src/engine/kinematics/angleCalculator.ts`.
  2. Hitung vektor $\mathbf{u} = \vec{P}_{\text{hip}} - \vec{P}_{\text{knee}}$ dan $\mathbf{v} = \vec{P}_{\text{ankle}} - \vec{P}_{\text{knee}}$.
  3. Gunakan aturan kosinus: $\theta = \arccos\left(\frac{\mathbf{u} \cdot \mathbf{v}}{\Vert{}\mathbf{u}\Vert{} \Vert{}\mathbf{v}\Vert{}}\right) \times \frac{180^\circ}{\pi}$.
  4. Lakukan normalisasi sudut fleksi: $\text{Flexion Angle} = 180^\circ - \theta$.
- **Kriteria Selesai (Acceptance Criteria):**
  - [x] Menghasilkan output angka float sudut antara $0^\circ$ (kaki lurus) sampai $140^\circ$ (tekukan maksimal).
  - [x] Tidak menghasilkan nilai `NaN` saat sendi sejajar atau titik koordinat bernilai 0.
- **File/Modul Terkait:** `src/engine/kinematics/angleCalculator.ts`
- **Catatan Tambahan:** Validasi keypoint visibility minimal 0.60 sebelum melakukan komputasi vektor.

---

### T-010 — Implementasi Layar Latihan Real-Time `Tracking.tsx`
- **Tujuan:** Menjadi layar utama (*Hero Screen*) interaktif yang menampilkan live tracking skeleton dan umpan balik pencegahan cedera.
- **Instruksi/Konteks untuk AI Agent:**
  1. Pasang elemen `<video>` (tersembunyi/di belakang) dan `<canvas>` untuk merender live stream dan skeleton overlay.
  2. Gambar garis vektor hijau tebal yang menghubungkan titik Panggul (23/24), Lutut (25/26), dan Pergelangan Kaki (27/28).
  3. Render bubble angka sudut dinamis berukuran besar di dekat posisi sendi lutut.
  4. Pasang banner atas dinamis yang berubah warna secara real-time: **Hijau** (Aman), **Kuning** (Waspada), **Merah** (Bahaya).
  5. Hubungkan dengan `useAudioCoach` untuk memicu suara Bahasa Indonesia saat masuk zona kuning/merah.
- **Kriteria Selesai (Acceptance Criteria):**
  - [x] Visual UI 100% identik dengan hasil desain Google Stitch & spesifikasi DESIGN.md.
  - [x] Suara peringatan otomatis keluar tepat waktu tanpa delay terasa (<100 ms) dengan mekanisme debounce anti-spam.
  - [x] Tombol merah "HENTIKAN LATIHAN" langsung mematikan stream kamera dan berpindah ke `/summary` membawa agregasi data sesi.
- **File/Modul Terkait:** `src/pages/Tracking.tsx`

---

### T-018 — Penulisan Final Concept Paper SFT 2026
- **Tujuan:** Menyusun dokumen proposal final akademis sebagai salah satu dari 3 syarat utama kelulusan Top 10 SFT 2026.
- **Instruksi/Konteks Penulisan:**
  1. Perbarui draf *Concept Paper Revisi* dengan menyertakan hasil pengujian fungsional dan teknis prototipe MVP.
  2. Cantumkan rujukan ilmiah baku (Naylor et al., Pantouveris et al., Ray et al., Roggio et al.) dan hukum UU PDP No. 27/2022.
  3. Masukkan rumus trigonometri Aturan Kosinus, arsitektur Edge AI Zero Video Transmission, dan data uji goniometer $\le \pm5^\circ$.
- **Kriteria Selesai (Acceptance Criteria):**
  - [ ] Dokumen tersusun lengkap dalam format PDF sesuai templat resmi Samsung Solve for Tomorrow 2026.
  - [ ] Seluruh data metrik STEM, dampak SDGs (1, 3, 10), dan aspek keberlanjutan terisi komprehensif.
- **File/Modul Terkait:** Dokumen `Final_Paper_OA_Motion_SPEKTRA.pdf`

---

## 7. Definition of Done (Global)

Setiap tugas pengembangan perangkat lunak dalam proyek ini dianggap **Selesai (🟢)** hanya jika memenuhi syarat berikut:

- [ ] Kode ditulis dalam **TypeScript / TSX** yang bersih dan bebas dari tipe `any` yang tidak perlu.
- [ ] Tidak terdapat *error*, *warning*, atau *memory leak* pada Google Chrome DevTools Console.
- [ ] Aksesibilitas visual memenuhi standar kontras tinggi WCAG 2.1 AAA (mudah dibaca lansia).
- [ ] Logika privasi data *Zero Video Transmission* terpenuhi (tidak ada pengiriman stream video ke server luar).
- [ ] Telah diuji secara langsung pada browser mobile smartphone dan laptop tanpa kendala *crash*.

---

## 8. Batasan & Aturan Teknis (Constraints)

1. **Arsitektur 100% Client-Side:** Seluruh inferensi AI (MediaPipe Pose WASM) dan kalkulasi sudut wajib dieksekusi lokal di browser perangkat klien (*Edge AI*).
2. **Bahasa Antarmuka & Audio:** Seluruh teks antarmuka pengguna dan instruksi suara Text-to-Speech (TTS) wajib menggunakan **Bahasa Indonesia** yang santun dan jelas.
3. **Penyimpanan Lokal:** Untuk fase MVP ini, penyimpanan data profil dan sesi cukup menggunakan `localStorage` atau state memory React tanpa konfigurasi backend cloud yang memakan waktu.
4. **Git Commit Standard:** Setiap commit Git wajib mematuhi konvensi *Conventional Commits* (contoh: `feat(tracking): add law of cosines angle calculation` atau `fix(audio): handle onvoiceschanged tts debounce`).

---

## 9. Riwayat Perubahan (Changelog)

| Tanggal | Perubahan | Oleh |
| --- | --- | --- |
| 23/08/2026 | Inisialisasi dokumen `TASKS.md` berbasis PRD v1.0 untuk deadline 15 September 2026. | Tim SPEKTRA |
| 23/08/2026 | Pembaruan status tugas T-001 hingga T-004 menjadi Selesai (🟢) serta penyelarasan struktur folder modular. | Zaky Ramadhan |
| 01/09/2026 | Sinkronisasi dengan `OA-Motion_Dev_Guide.md`: penyelesaian seluruh tugas Fase 2 (T-005 s.d T-009 🟢), penambahan T-002B, dan penyederhanaan cakupan MVP. | Tim SPEKTRA |
| 03/09/2026 | Implementasi T-002B (Medical Disclaimer Banner eksklusi Grade 4 & Selector Sisi Lutut di `Home.tsx` 🟢). | Zaky Ramadhan |
| 09/09/2026 | Penyelesaian tugas T-013 (Visualisasi Grafik RoM Sesi Terakhir 🟢) dan T-014 (Generator Unduh PDF Ringkasan Sesi 🟢). | Zaky Ramadhan |
