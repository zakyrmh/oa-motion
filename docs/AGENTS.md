# AGENTS.md — AI Coding Agent Guide for OA-Motion

> **Petunjuk AI Agent:** Dokumen ini adalah acuan operasional dan arsitektur wajib bagi seluruh AI Coding Agent (Antigravity CLI `agy`, Cursor, Claude Code, GitHub Copilot) yang bekerja di repositori **OA-Motion**. Patuhi seluruh konvensi kode, struktur folder, batasan teknis, dan protokol memori Obsidian di bawah ini.

---

## 1. Ringkasan Proyek

**OA-Motion (Adaptive Sports Guidance System)** adalah aplikasi web kesehatan berbasis *Edge AI* dan *Computer Vision* yang menyediakan panduan latihan fisik mandiri secara adaptif, aman, dan *real-time* bagi penderita Osteoarthritis (OA) lutut (Grade 1–3) serta pasien rehabilitasi pasca-operasi.

Proyek ini dikembangkan oleh **Tim SPEKTRA (Politeknik Negeri Padang)** untuk kompetisi **Samsung Solve for Tomorrow (SFT) 2026** pada kategori *Sport & Technology* (SDGs 1, 3, dan 10). Sistem bertindak sebagai **"Digital Spotter"** yang menghitung sudut fleksi lutut secara *on-device*, memberikan koreksi visual & audio Bahasa Indonesia secara instan, serta menghasilkan ringkasan sesi telerehabilitasi.

---

## 2. Tech Stack

| Kategori | Teknologi | Keterangan |
|---|---|---|
| **Runtime & Bundler** | [Vite](https://vitejs.dev/) v8.2+ | Modern ESM bundler dengan React Compiler |
| **Language** | [TypeScript](https://www.typescriptlang.org/) v6.0+ | Strict typing dengan `verbatimModuleSyntax` |
| **Frontend Framework** | [React](https://react.dev/) 19.2+ | React 19 dengan Hooks & Context API |
| **Routing** | [React Router DOM](https://reactrouter.com/) v7 | SPA Routing dengan Lazy Loading & Suspense |
| **Styling & Design System** | [Tailwind CSS](https://tailwindcss.com/) v4 & [shadcn/ui](https://ui.shadcn.com/) | Editorial Brutalist monochrome theme with mint/yellow accents |
| **Icons** | [Lucide React](https://lucide.dev/) | Consistent stroke icons |
| **Computer Vision Engine** | [MediaPipe Tasks Vision](https://developers.google.com/mediapipe/solutions/vision/pose_landmarker) (`@mediapipe/tasks-vision`, `PoseLandmarker`) / Edge AI | 33 Pose Landmarks, Cosine Law trigonometry, EMA filter |
| **Audio & Voice Engine** | Web Speech API & Web Audio API | Zero-dependency Indonesian voice coach & tone synthesizer |
| **Git Hooks & Quality** | Husky, Commitlint, Lint-staged, Commitizen | Conventional Commits standard |

---

## 3. Struktur Folder Proyek

Proyek ini menggunakan **Layered Modular Architecture** untuk memisahkan komputasi matematika/AI murni dari siklus render React:

```bash
oa-motion/
├── .agents/                     # Konfigurasi & aturan AI Agent
│   └── skills/                  # Skills terintegrasi (shadcn, vercel-react-best-practices)
├── docs/                        # Dokumentasi Spesifikasi & Panduan Proyek
│   ├── PRD.md                   # Product Requirements Document (Fitur & Target Klinis)
│   ├── DESIGN.md                # Design System, Tokens, Warna, & Tipografi
│   ├── TASKS.md                 # Development Task Breakdown SFT 2026 (P0-P2)
│   └── AGENTS.md                # Panduan operasional AI Coding Agent (File ini)
│
├── public/                      # Static assets publik
│
├── src/
│   ├── assets/                  # Asset visual statis (ilustrasi, hero image)
│   │
│   ├── types/                   # Single Source of Truth TypeScript Contracts
│   │   ├── clinical.ts          # Tipe MedicalProfile, OAGrade, ClinicalSafetyLimits
│   │   ├── kinematics.ts        # Tipe Point2D/3D, KneeAngleData, ExercisePhase, Parallax
│   │   ├── session.ts           # Tipe RepetitionRecord, ExerciseSessionSummary
│   │   └── index.ts             # Barrel export
│   │
│   ├── constants/               # Sentralisasi Konfigurasi & Ambang Batas
│   │   ├── clinical.ts          # Default profile, OA_GRADE_OPTIONS, SAFE_ROM_LIMITS
│   │   ├── storageKeys.ts       # STORAGE_KEYS (localStorage/IndexedDB key names)
│   │   ├── audioPhrases.ts      # Frasa instruksi & peringatan suara Bahasa Indonesia
│   │   └── index.ts
│   │
│   ├── engine/                  # Core Computational & AI Subsystem (PURE NON-REACT TS)
│   │   ├── kinematics/          # Kalkulasi gerak sendi & filter
│   │   │   ├── angleCalculator.ts # Rumus Aturan Kosinus (Vector Dot Product)
│   │   │   ├── emaFilter.ts     # Exponential Moving Average Smoothing Filter
│   │   │   ├── parallaxCheck.ts # Verifikasi orientasi tubuh tegak lurus kamera
│   │   │   └── index.ts
│   │   ├── audio/               # Audio biofeedback engine
│   │   │   ├── ttsEngine.ts     # Wrapper Web Speech API Bahasa Indonesia
│   │   │   ├── soundEffects.ts  # Web Audio API Synthesizer (Chime, buzzer, tick)
│   │   │   └── index.ts
│   │   └── index.ts
│   │
│   ├── context/                 # State Synchronization Layer
│   │   ├── MedicalProfileContext.ts    # Interface & Context instance
│   │   ├── MedicalProfileProvider.tsx  # Provider sinkronisasi otomatis ke LocalStorage
│   │   └── index.ts
│   │
│   ├── hooks/                   # Custom Hooks (Jembatan antara Engine dan React UI)
│   │   ├── useCamera.ts         # Stream WebRTC getUserMedia, error handling & flip camera
│   │   ├── useAudioCoach.ts     # Hook kontrol TTS dan biofeedback suara
│   │   ├── useMedicalProfile.ts # Hook consumer context profil medis
│   │   └── index.ts
│   │
│   ├── components/              # Lapisan Komponen Antarmuka
│   │   ├── layouts/             # Layout container (AppLayout mobile wrapper)
│   │   ├── common/              # Komponen bersama (Header, StepIndicator)
│   │   ├── features/            # Komponen domain spesifik (calibration, tracking, summary)
│   │   │   └── calibration/
│   │   │       └── SilhouetteGuide.tsx
│   │   └── ui/                  # Primitif komponen shadcn (Button, Card, Badge, Slider)
│   │
│   ├── pages/                   # Thin Route Controllers (Halaman Utama)
│   │   ├── Home.tsx             # Langkah 1: Input Profil Medis Harian (Grade OA & VAS)
│   │   ├── Calibration.tsx      # Langkah 2: Pengecekan Jarak & Orientasi Kamera
│   │   ├── Tracking.tsx         # Langkah 3: Dashboard Latihan Real-time & Spotter Digital
│   │   └── Summary.tsx          # Langkah 4: Rekap Sesi, Evaluasi RoM, & Unduh Laporan
│   │
│   ├── App.tsx                  # Root App & Route Configuration
│   ├── index.css                # Tailwind CSS v4 setup & theme variables
│   └── main.tsx                 # Application Entry Point
│
├── CHANGELOG.md                 # Riwayat rilis versi
├── package.json                 # Dependency & scripts
├── tsconfig.app.json            # Strict TypeScript configuration
└── vite.config.ts               # Vite configuration

```

---

## 4. Perintah Penting (Setup & Commands)

| Perintah | Deskripsi |
| --- | --- |
| `npm run dev` | Menjalankan local development server (Vite HMR) |
| `npm run build` | Menjalankan validasi TypeScript (`tsc -b`) dan build produksi Vite |
| `npm run lint` | Menjalankan ESLint pada seluruh codebase |
| `npm run preview` | Menjalankan preview dari build produksi di folder `dist/` |
| `npm run commit` | Menjalankan CLI Commitizen untuk standardisasi Conventional Commits |

---

## 5. Konvensi Kode (Coding Conventions)

### 5.1 TypeScript & Modul

* **Type-Only Imports:** Proyek ini mengaktifkan `verbatimModuleSyntax`. Wajib gunakan sintaks `import type { ... } from '...'` untuk interface dan tipe data murni.
* **Strict Typing:** Dilarang menggunakan tipe `any`. Gunakan tipe eksplisit dari `src/types/`.
* **Path Aliases:** Selalu gunakan alias `@/` untuk import internal (misal: `@/components/ui/button`, `@/engine/kinematics`, `@/types/clinical`).

### 5.2 React 19 & Vercel Best Practices

* **Functional Components:** Semua komponen wajib berbasis fungsi dengan TypeScript.
* **Hindari Fat Components:** Pisahkan logika matematika berat ke `src/engine/` dan logika stateful reusable ke `src/hooks/`.
* **Fast Refresh Compliance:** Jangan mengekspor fungsi biasa / non-komponen bersamaan dengan komponen React di file `.tsx` yang sama.
* **Effect Discipline:** Hindari pemanggilan `setState` sinkron langsung di awal `useEffect` untuk mencegah *cascading render*.
* **Hardware Cleanup:** Pastikan setiap *media stream* kamera (`MediaStreamTrack.stop()`) dan audio context selalu dibersihkan di *cleanup callback* `useEffect`.

### 5.3 Desain & Styling

* **Tokens Keselarasan:** Ikuti aturan warna brutalist di `docs/DESIGN.md`:
* Canvas: `#e5e5e5` (Light mode) / `#000000` (Dark/Tracking mode)
* Accent Tag / Safe: Mint Green (`#d1ffca`)
* Warning / Highlight: Voltage Yellow (`#fff100`)
* Primary Action / Text: Carbon Black (`#000000`) & Paper White (`#ffffff`)


* Gunakan utility function `cn()` dari `@/lib/utils` untuk penggabungan class Tailwind kondisional.

---

## 6. Integrasi Memori Jangka Panjang (Obsidian Vault & Antigravity)

Untuk mempertahankan *context awareness* lintas sesi terminal, AI Agent diinstruksikan untuk menggunakan **Obsidian Vault** sebagai media penyimpanan memori jangka panjang (*Long-term Memory*).

### 6.1 Lokasi Direktori Vault

* **Path Utama (Absolute):** `~/Documents/Antigravity_Brain/`
* **Sub-folder Memori:** `~/Documents/Antigravity_Brain/02_Agent_Memory/`
* **Sub-folder Referensi/Knowledge:** `~/Documents/Antigravity_Brain/01_Knowledge/`
*(Catatan: Jika terdapat symlink `./.brain/` di root proyek, agen diizinkan membaca/menulis langsung melalui `./.brain/`)*.

### 6.2 Protokol Membaca Memori (Read Protocol)

Sebelum mengerjakan tugas yang melibatkan:

1. Refactoring arsitektur atau state global (`MedicalProfileContext`).
2. Debugging masalah hardware (WebRTC camera stream, Web Audio API, MediaPipe pose detection).
3. Modifikasi rumus kinematika atau batasan klinis OA.

**AI Agent WAJIB memeriksa catatan terdahulu** di `~/Documents/Antigravity_Brain/02_Agent_Memory/` untuk melihat apakah ada keputusan teknis, gotchas, atau solusi bug serupa yang pernah dicatat sebelumnya.

### 6.3 Protokol Menulis Memori (Write Protocol)

AI Agent **WAJIB membuat catatan baru** ketika:

1. Menemukan dan menyelesaikan *subtle bug* atau *quirk* khusus browser (misal: autoplay audio policy, mobile camera orientation).
2. Mengambil keputusan arsitektur baru (*Architectural Decision Record* / ADR).
3. Menyelesaikan optimasi performa komputasi atau bundler.

#### Format Standar File Memori:

* **Lokasi Simpan:** `~/Documents/Antigravity_Brain/02_Agent_Memory/oa-motion-<kategori>-<topik-singkat>.md`
* **Struktur Markdown & YAML Frontmatter:**

```markdown
---
title: "Deskripsi Singkat Solusi / Keputusan"
project: "oa-motion"
date: YYYY-MM-DD
type: "bugfix" # Pilihan: bugfix | adr | gotcha | optimization
tags:
  - oa-motion
  - kinematics # sesuaikan topik (misal: webrtc, audio, react19, styling)
  - agent-memory
---

## 1. Konteks Masalah / Latar Belakang
Penjelasan ringkas tentang kendala yang dihadapi atau keputusan yang perlu dibuat.

## 2. Analisis Akar Masalah (Root Cause)
Mengapa masalah tersebut terjadi atau alasan pemilihan pendekatan tertentu.

## 3. Solusi Teknis & Implementasi
Rincian perubahan kode, file yang terpengaruh, atau snippet penting.

## 4. Pelajaran Penting (Gotchas untuk Sesi Mendatang)
Poin penting yang harus diingat agen di sesi berikutnya agar tidak mengulangi kesalahan yang sama.

```

---

## 7. Aturan Operasional AI Agent (DOs & DON'Ts)

### ✅ Wajib Dilakukan (DOs)

1. **Periksa Memori Obsidian:** Cek `~/Documents/Antigravity_Brain/02_Agent_Memory/` sebelum mulai mengerjakan masalah rumit atau ambigu.
2. **Catat Solusi Penting:** Tulis log pemecahan masalah ke folder memori Obsidian setelah menyelesaikan bug non-trivial atau keputusan arsitektur.
3. **Verifikasi Build Mandiri:** Selalu jalankan `npm run lint` dan `npm run build` setelah melakukan modifikasi file sebelum melaporkan hasil ke pengguna.
4. **Pertahankan Tipe Data Terpusat:** Setiap tipe entitas baru harus didefinisikan di `src/types/` dan diekspor melalui `src/types/index.ts`.
5. **Pure Functions untuk Kinematika:** Logika perhitungan sudut fleksi, filter EMA, dan threshold keselamatan klinis harus berupa *pure functions* tanpa dependensi DOM/React.
6. **Resistensi Terhadap State Loss:** Selalu manfaatkan `MedicalProfileContext` atau `localStorage` terverifikasi agar data profil pasien tidak hilang saat refresh browser.

### ❌ Dilarang Keras (DON'Ts)

1. **Dilarang memasukkan rumus matematika langsung di dalam JSX komponen.**
2. **Dilarang menggunakan `location.state` sebagai satu-satunya sumber kebenaran data medis** (harus selalu ada fallback ke Context / LocalStorage).
3. **Dilarang menginstal dependensi npm baru tanpa pertimbangan ukuran bundle.**
4. **Dilarang mematikan atau mengabaikan konfigurasi ESLint dan TypeScript strict mode.**
5. **Dilarang menyimpan file memori sembarangan di luar struktur direktori Obsidian yang telah ditentukan.**
6. **Dilarang menampilkan klaim akurasi angka pasti (misal: "Akurat hingga ±5°") di UI aplikasi sebelum pengujian klinis formal selesai.**

---

## 8. Integrasi Agent Skills

Proyek ini telah dilengkapi dengan *Agent Skills* lokal di folder `.agents/skills/`:

* **`shadcn` (`.agents/skills/shadcn`):** Panduan instalasi, kustomisasi, komposisi UI, dan integrasi komponen Base UI / Radix.
* **`vercel-react-best-practices` (`.agents/skills/vercel-react-best-practices`):** Panduan optimasi performa React 19, pencegahan *re-render*, manajemen *event listener*, dan efisiensi *client-side bundle*.

---

## 9. Dokumen Referensi Utama

* **[OA-Motion_Dev_Guide.md](docs/OA-Motion_Dev_Guide.md):** Rujukan teknis final dan batasan ruang lingkup purwarupa MVP untuk demonstrasi Samsung Solve for Tomorrow 2026.
* **[PRD.md](docs/PRD.md):** Spesifikasi fungsional, latar belakang klinis OA Grade 1–3, dan metrik keberhasilan Samsung Solve for Tomorrow 2026.
* **[DESIGN.md](docs/DESIGN.md):** Spesifikasi visual Brutalist Editorial, skala tipografi, dan token palet warna.
* **[TASKS.md](docs/TASKS.md):** Daftar tugas teknis terinci per fase (Fase 1 hingga Fase 5) dengan status prioritas (P0–P2).

---

## 10. Catatan Khusus & Gotchas

1. **Web Speech API di Mobile Browser:** Beberapa browser mobile memerlukan interaksi pengguna pertama (*user gesture*) sebelum audio dapat diputar otomatis.
2. **MediaPipe Coordinate System:** Koordinat landmark MediaPipe berada dalam rentang ternormalisasi $0.0 - 1.0$. Sumbu Y bernilai $0.0$ di bagian atas layar dan $1.0$ di bagian bawah.
3. **Aturan Kosinus Fleksi Lutut:** Sudut fleksi lutut dihitung pada titik sendi lutut ($P_2$) antara pinggul ($P_1$) dan pergelangan kaki ($P_3$). Posisi kaki lurus sempurna bernilai $\approx 180^\circ$, sedangkan posisi lutut ditekuk $90^\circ$ bernilai $\approx 90^\circ$.
4. **Batas Fleksi Aman per Grade OA:**
* **Grade 1 (Ringan):** Fleksi maksimal aman hingga $100^\circ$.
* **Grade 2 (Sedang):** Fleksi maksimal aman hingga $90^\circ$.
* **Grade 3 (Berat):** Fleksi maksimal aman dibatasi pada $75^\circ$ untuk mencegah stres kompresif sendi tibiofemoral berlebih.