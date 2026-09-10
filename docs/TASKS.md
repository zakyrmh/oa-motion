# Task List — Development Breakdown OA-Motion (SFT 2026)

---

## 1. Informasi Dokumen

| Item | Keterangan |
| --- | --- |
| **Nama Proyek** | **OA-Motion: Adaptive Sports Guidance System** |
| **Dokumen Referensi (PRD)** | `docs/PRD.md` (v2.0 — Golden Data, DTW/NCC & Fatigue Profiling) & `docs/OA-Motion_Dev_Guide.md` (v2) |
| **Penulis** | Tim SPEKTRA (Zaky Ramadhan, Naufal Khalil Aldeza, Zahwa Rahmadhania, Vanisa Firsy) |
| **Tanggal Dibuat** | 23/08/2026 |
| **Tanggal Revisi Terakhir** | 09/09/2026 |
| **Versi** | v2.0 (Sinkronisasi dengan PRD v2.0 & Dev Guide v2) |
| **AI Agent yang Digunakan** | Antigravity CLI / Claude Code / Cursor |

---

## 2. Tujuan Dokumen

Dokumen ini memecah kebutuhan produk dari `PRD.md` (v2.0) dan `OA-Motion_Dev_Guide.md` (v2) menjadi unit-unit tugas teknis terukur dengan target penyelesaian akhir **20 September 2026** (Tenggat submission resmi Samsung Solve for Tomorrow 2026). Dokumen ini menjadi acuan kerja operasional bagi seluruh anggota Tim SPEKTRA dan AI Coding Agent guna memastikan kejelasan ruang lingkup (*scope*), pembagian tugas (*responsibility*), dependensi antarmodul, serta definisi selesai (*Definition of Done*).

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

## 4. Ringkasan Fase Pengembangan (Deadline Submission: 20 September 2026)

| Fase | Deskripsi | Target Selesai |
| --- | --- | --- |
| **Fase 1 — Setup, State Routing & UI Base** | Inisialisasi Vite React, Tailwind CSS, struktur folder modular, halaman `Home`, dan `Calibration`. | 26 Agustus 2026 |
| **Fase 2 — Core Edge AI, Kinematic & Audio Engine** | Integrasi MediaPipe Pose WASM, kalkulasi Aturan Kosinus, filter EMA, dan Web Speech API. | 31 Agustus 2026 |
| **Fase 3A — UI Tracking, Analytics & Telerehab PDF** | Pembangunan halaman `Tracking.tsx`, `Summary.tsx`, grafik RoM, dan generator PDF v1. | 5 September 2026 |
| **Fase 3B — Refactor Arsitektur v2.0 (Golden Data, DTW/NCC & Fatigue)** | Transisi ke perbandingan gerakan referensi (DTW/NCC), baseline kelelahan adaptif, kapabilitas fungsional, dan progresi sit-to-stand. | 15 September 2026 |
| **Fase 4 — Testing, QA & Validasi Klinis/SUS** | Pengujian komparasi akurasi sudut goniometer, survei SUS lansia, dan *bug fixing*. | 17 September 2026 |
| **Fase 5 — Final Paper, Video Pitch & Live Deployment** | Finalisasi naskah paper ilmiah SFT 2026, produksi & editing video pitch 3 menit, serta deploy live. | 20 September 2026 |

---

## 5. Daftar Tugas

### Fase 1 — Setup, State Routing & UI Base (23 – 26 Agustus 2026)

| ID | Tugas | Deskripsi | Prioritas | Dependency | Status | PIC |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **T-001** | Inisialisasi Proyek & Boilerplate | Setup Vite + React 19 (TypeScript), Tailwind CSS v4, Lucide React, shadcn/ui. | P0 | - | 🟢 | Zaky Ramadhan |
| **T-002** | Implementasi UI `Home.tsx` | Form awal v1: pemilihan Grade OA 1–3, Slider Skala Nyeri VAS, dan toggle riwayat operasi. | P0 | T-001 | 🟢 | Zaky Ramadhan |
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

### Fase 3A — UI Tracking, Analytics & Telerehab PDF (1 – 5 September 2026)

| ID | Tugas | Deskripsi | Prioritas | Dependency | Status | PIC |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **T-010** | Implementasi Layar `Tracking.tsx` | Hero screen latihan: Canvas skeleton overlay, badge sudut real-time, dan status banner 3 zona. | P0 | T-005, T-008, T-009 | 🟢 | Zaky Ramadhan |
| **T-011** | Emergency Stop & Session Aggregator | Logika tombol berhenti darurat, pencatatan durasi latihan, peak RoM, dan frekuensi peringatan. | P0 | T-010 | 🟢 | Zaky Ramadhan |
| **T-012** | Implementasi Layar `Summary.tsx` | Dashboard pasca-latihan: 4 kartu metrik (Durasi, RoM, Warning Red Zone, Kepatuhan). | P0 | T-011 | 🟢 | Zaky Ramadhan |
| **T-013** | Visualisasi Grafik RoM Sesi Terakhir | Render grafik garis tren sudut fleksi 1 sesi terakhir dengan garis batas ambang zona aman (`RoMChart.tsx`). | P1 | T-012 | 🟢 | Zaky Ramadhan |
| **T-014** | Generator Unduh PDF Ringkasan Sesi | Fitur unduh rekapitulasi data telerehabilitasi 1 sesi terstruktur untuk dibagikan ke fisioterapis (`TelerehabReportPrint.tsx`). | P1 | T-012 | 🟢 | Zaky Ramadhan |

---

### Fase 3B — Refactor Arsitektur v2.0 (Golden Data, DTW/NCC & Fatigue Profiling) (9 – 15 September 2026)

| ID | Tugas | Deskripsi | Prioritas | Dependency | Status | PIC |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **T-022** | Perekaman & Pemuatan Golden Data Referensi | Menyiapkan dataset `ReferenceMovement` (`angleTimeSeries`) untuk *Sit-to-Stand* dan *Squat* dari instruktur/fisioterapis mitra. | P0 | T-006 | 🟢 | Naufal Khalil Aldeza |

| **T-023** | Kinematics Similarity Engine `dtwCalculator.ts` | Pembangunan modul `dtwCalculator.ts` (Dynamic Time Warping & NCC) untuk mengukur skor kemiripan gerakan aktif vs *golden data*. | P0 | T-022 | 🟢 | Naufal Khalil Aldeza |

| **T-024** | Baseline Kelelahan Adaptif `fatigueDetector.ts` | Pembangunan modul `fatigueDetector.ts` untuk merekam baseline 2–3 rep awal, memantau *rep speed decay* & kemerosotan RoM (`fatigueFlag`). | P1 | T-023 | 🔴 | Naufal Khalil Aldeza |
| **T-025** | Refactor Data Contract & Context `UserProfile` v2.0 | Refactor tipe `UserProfile`, `MedicalProfileContext`, dan `localStorage` dari Grade OA statis ke Kapabilitas Fungsional & Status Pendampingan. | P0 | T-004 | 🔴 | Zaky Ramadhan |
| **T-026** | Refactor UI `Home.tsx` v2.0 — Form Kapabilitas | Pembaruan form `Home.tsx`: pilihan kapabilitas (hanya duduk / duduk & berdiri), status pendampingan (mandiri/pendamping), target rep, & kontak keluarga. | P0 | T-025 | 🔴 | Zaky Ramadhan |
| **T-027** | Refactor Layar Latihan `Tracking.tsx` v2.0 | Update `Tracking.tsx` untuk progresi 2 tahap (Sit-to-Stand $\to$ Squat), status banner berbasis skor DTW/NCC, overlay referensi, & indikator kelelahan. | P0 | T-023, T-024, T-026 | 🔴 | Zaky Ramadhan |
| **T-028** | Refactor `Summary.tsx` v2.0 & Laporan Keluarga | Update `Summary.tsx`: Skor Kemiripan Rata-Rata, status `fatigueFlag`, dan fitur unduh/bagikan ringkasan sesi untuk kontak keluarga (FR-13). | P1 | T-027 | 🔴 | Zaky Ramadhan |

---

### Fase 4 — Testing, QA & Validasi Klinis/SUS (16 – 17 September 2026)

| ID | Tugas | Deskripsi | Prioritas | Dependency | Status | PIC |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **T-015** | Validasi Akurasi Eror Sudut Sendi | Pengujian komparasi pembacaan sudut OA-Motion vs Goniometer Manual (Target error $\le \pm5^\circ$). | P0 | T-027 | 🔴 | Vanisa Firsy |
| **T-016** | Usability Testing Lansia (SUS Survey) | Uji coba langsung ke responden target lansia dan penghitungan skor kuesioner SUS (Target $\ge 80$). | P1 | T-027, T-028 | 🔴 | Zahwa Rahmadhania |
| **T-017** | Cross-Browser & Performance QA | Uji kestabilan frame rate ($\ge 30\text{ FPS}$), memory leak, dan respon di Chrome Android/Laptop. | P0 | T-027 | 🔴 | Vanisa Firsy |

---

### Fase 5 — Final Paper, Video Pitch & Deployment (18 – 20 September 2026)

| ID | Tugas | Deskripsi | Prioritas | Dependency | Status | PIC |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **T-018** | Penulisan Final Concept Paper SFT | Penyusunan laporan ilmiah lengkap SFT 2026 (Latar belakang, STEM, hasil validasi v2.0, etika data UU PDP). | P0 | T-015, T-016 | 🔴 | Vanisa Firsy |
| **T-019** | Storyboard & Shooting Video Pitch | Pembuatan naskah video 3 menit, pengambilan footage persona "Ibu Hartini", dan live demo alat. | P0 | T-027, T-028 | 🔴 | Zahwa Rahmadhania |
| **T-020** | Video Editing & Motion Graphic | Editing video pitch: dubbing jernih, teks kontras tinggi, cut-to-cut demo UI, dan rendering MP4 1080p. | P0 | T-019 | 🔴 | Vanisa Firsy |
| **T-021** | Live Deployment & Production Audit | Deploy aplikasi web ke Vercel/Cloudflare Pages, uji HTTPS, dan verifikasi Zero Video Transmission. | P0 | T-028, T-017 | 🔴 | Zaky Ramadhan |

---

## 6. Detail Tugas (Untuk Tugas Kompleks v2.0)

### T-023 — Kinematics Similarity Engine `dtwCalculator.ts`
- **Tujuan:** Menghitung skor kemiripan (*similarity score*) antara lintasan sudut gerak aktif pengguna terhadap deret waktu sudut referensi (*golden data*) menggunakan algoritma Dynamic Time Warping (DTW) dan Normalized Cross-Correlation (NCC).
- **Instruksi/Konteks untuk AI Agent:**
  1. Buat modul fungsi murni `calculateDTWDistance(userSeries: number[], referenceSeries: number[]): number` di `src/engine/kinematics/dtwCalculator.ts`.
  2. Implementasikan matriks akumulasi jarak Euclidean 1D antara sampel sudut aktif dan sudut referensi.
  3. Hitung skor kemiripan ter-normalisasi $0 - 100\%$: Skor tinggi ($>80\%$) = Zona Hijau, ($60-80\%$) = Zona Kuning, ($<60\%$) = Zona Merah.
- **Kriteria Selesai (Acceptance Criteria):**
  - [ ] Hasil perhitungan DTW dan NCC selesai dalam $< 5\text{ ms}$ per siklus window frame tanpa menurunkan FPS dari 30 FPS.
  - [ ] Bebas dari eror *out-of-bounds array index* atau kalkulasi `NaN` saat panjang array sampel berbeda.
- **File/Modul Terkait:** `src/engine/kinematics/dtwCalculator.ts`

---

### T-025 — Refactor Data Contract & Context `UserProfile` v2.0
- **Tujuan:** Memperbarui data contract profil dari ambang Grade OA statis menjadi profil berbasis kapabilitas fungsional dan status pendampingan sesuai PRD v2.0.
- **Instruksi/Konteks untuk AI Agent:**
  1. Perbarui interface `UserProfile` di `src/types/clinical.ts`:
     ```typescript
     export type CapabilityLevel = 'hanya_duduk' | 'duduk_dan_berdiri';
     export type AssistanceStatus = 'mandiri' | 'butuh_pendamping';

     export interface UserProfile {
       id: string;
       namaPanggilan: string;
       kapabilitas: CapabilityLevel;
       pendampingan: AssistanceStatus;
       targetRepetisiPerSesi: number;
       kontakKeluarga?: string;
     }
     ```
  2. Sesuaikan `MedicalProfileContext` dan provider persistensi `localStorage` agar menggunakan tipe `UserProfile` baru dengan nilai default yang aman.
- **Kriteria Selesai (Acceptance Criteria):**
  - [ ] Data profil tersimpan dan terbaca konsisten di `localStorage` tanpa menimbulkan breaking changes/error parse pada browser.
- **File/Modul Terkait:** `src/types/clinical.ts`, `src/context/MedicalProfileContext.ts`, `src/context/MedicalProfileProvider.tsx`

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

1. **Arsitektur 100% Client-Side:** Seluruh inferensi AI (MediaPipe Pose WASM) dan kalkulasi DTW/NCC wajib dieksekusi lokal di browser perangkat klien (*Edge AI*).
2. **Bahasa Antarmuka & Audio:** Seluruh teks antarmuka pengguna dan instruksi suara Text-to-Speech (TTS) wajib menggunakan **Bahasa Indonesia** yang santun dan jelas.
3. **Penyimpanan Lokal:** Untuk fase MVP ini, penyimpanan data profil dan sesi cukup menggunakan `localStorage` atau state memory React tanpa konfigurasi backend cloud yang memakan waktu.
4. **Git Commit Standard:** Setiap commit Git wajib mematuhi konvensi *Conventional Commits* (contoh: `feat(kinematics): add DTW angle similarity calculator` atau `refactor(profile): update user capability data contract v2`).

---

## 9. Riwayat Perubahan (Changelog)

| Tanggal | Perubahan | Oleh |
| --- | --- | --- |
| 23/08/2026 | Inisialisasi dokumen `TASKS.md` berbasis PRD v1.0 untuk deadline 15 September 2026. | Tim SPEKTRA |
| 23/08/2026 | Pembaruan status tugas T-001 hingga T-004 menjadi Selesai (🟢) serta penyelarasan struktur folder modular. | Zaky Ramadhan |
| 01/09/2026 | Sinkronisasi dengan `OA-Motion_Dev_Guide.md`: penyelesaian seluruh tugas Fase 2 (T-005 s.d T-009 🟢), penambahan T-002B, dan penyederhanaan cakupan MVP. | Tim SPEKTRA |
| 03/09/2026 | Implementasi T-002B (Medical Disclaimer Banner eksklusi Grade 4 & Selector Sisi Lutut di `Home.tsx` 🟢). | Zaky Ramadhan |
| 09/09/2026 | Penyelesaian tugas T-013 (Visualisasi Grafik RoM Sesi Terakhir 🟢) dan T-014 (Generator Unduh PDF Ringkasan Sesi 🟢). | Zaky Ramadhan |
| 09/09/2026 | Sinkronisasi dengan PRD v2.0 & Dev Guide v2: penambahan Fase 3B (Tugas Refactor v2.0 T-022 s.d T-028) dan penyesuaian deadline submission ke 20 September 2026. | Zaky Ramadhan |
| 11/09/2026 | Penyelesaian tugas T-022 (Perekaman & Pemuatan Golden Data Referensi `ReferenceMovement` `angleTimeSeries` untuk Sit-to-Stand & Squat 🟢). | Naufal Khalil Aldeza |
| 11/09/2026 | Penyelesaian tugas T-023 (Kinematics Similarity Engine `dtwCalculator.ts` berbasis Dynamic Time Warping & NCC 🟢). | Naufal Khalil Aldeza |


