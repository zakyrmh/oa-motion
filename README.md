# 🦵 OA-Motion — Sistem Panduan Latihan Adaptif Berbasis Edge AI & Biomekanika Lutut

[![Build Status](https://img.shields.io/badge/Build-Passing-d1ffca?style=for-the-badge&logo=vite&logoColor=black)](file:///d:/SAMSUNG%20SFT/program_oa/oa-motion/package.json)
[![React 19](https://img.shields.io/badge/React-19.0-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev)
[![TypeScript 5.7](https://img.shields.io/badge/TypeScript-5.7-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![MediaPipe](https://img.shields.io/badge/MediaPipe-Tasks_Vision-4285F4?style=for-the-badge&logo=google&logoColor=white)](https://mediapipe.dev)
[![Samsung SFT 2026](https://img.shields.io/badge/Samsung_SFT-2026-000000?style=for-the-badge&logo=samsung&logoColor=white)](https://www.samsung.com/id/solvefortomorrow/)
[![SDGs 1, 3, 10](https://img.shields.io/badge/SDGs-1_%7C_3_%7C_10-E5243B?style=for-the-badge)](https://sdgs.un.org/goals)

> **Proyek Kompetisi Samsung Solve for Tomorrow (SFT) 2026 — Kategori Sport & Technology**  
> **Dikembangkan oleh Tim SPEKTRA — Politeknik Negeri Padang**

---

## 📌 Ringkasan Eksekutif

**OA-Motion** adalah aplikasi web kesehatan (*Telerehabilitation App*) berbasis *Edge AI* dan *Computer Vision* yang dirancang untuk membantu penderita **Osteoarthritis (OA) lutut** dan lansia dalam melakukan latihan penguatan otot tungkai bawah secara mandiri, aman, dan presisi di rumah. 

Aplikasi ini menggunakan pendekatan **Zero Hardware Barrier**—hanya memanfaatkan kamera bawaan smartphone atau laptop tanpa memerlukan sensor tambahan (*wearable/IMU*) maupun biaya fisioterapi rutin yang tinggi.

```text
[ Input Kamera 30+ FPS ] ──► [ MediaPipe 3D Pose Extraction ] ──► [ EMA Smoothing ]
                                                                       │
[ Web Speech Audio Coach ] ◄── [ 3-Zone Feedback & Fatigue ] ◄── [ DTW & NCC Reference Matching ]
```

---

## ✨ Fitur-Fitur Utama

### 1. 🤖 Edge AI Kinematics Engine (100% Local On-Device)
- **Pelacakan Sendi Real-time 60 FPS**: Memanfaatkan Google MediaPipe Tasks Vision (`PoseLandmarker` Full Model) via WebAssembly (WASM) & WebGL.
- **Perhitungan Sudut Fleksi Lutut 3D**: Mengukur sudut fleksi lutut ($0^\circ = \text{berdiri lurus sempurna}, 180^\circ = \text{menekuk penuh}$) secara presisi menggunakan Hukum Kosinus.
- **Landmark Smoother (EMA)**: Menggunakan penstabil *Exponential Moving Average* untuk menghilangkan kebasian (*jittering*) data titik sendi tanpa membuang frame video.

### 2. 🎯 Pencocokan Gerakan Referensi Pakar (*Golden Data*)
- **Dynamic Time Warping (DTW) & Normalized Cross-Correlation (NCC)**: Membandingkan ritme dan pola gerakan pengguna secara *real-time* dengan data gerakan acuan yang direkam dari instruktur/fisioterapis mitra.
- **Perekam Data Referensi Lokal ([ReferenceRecorder.tsx](file:///d:/SAMSUNG%20SFT/program_oa/oa-motion/src/pages/ReferenceRecorder.tsx))**: Modul khusus untuk merekam, menguji, dan mengedit *Golden Data* langsung ke penyimpanan `IndexedDB` & `localStorage`.

### 3. 🛡️ Pemantauan Kelelahan Adaptif (*Fatigue Profiling*)
- **Deteksi Penurunan Kecepatan & Rentang Gerak**: Membangun *baseline* kemampuan pribadi dari repetisi awal tiap sesi, kemudian mendeteksi *rep speed decay* atau degradasi RoM untuk memberikan peringatan istirahat sebelum berisiko cedera.

### 4. 🔊 Umpan Balik Preventif 3-Zona & Audio Coach
- **Indikator 3-Zona Visual**: Banner warna interaktif (Hijau = Serasi, Kuning = Perlu Penyesuaian, Merah = Bahaya/Berhenti).
- **Asynchronous TTS Engine ([ttsEngine.ts](file:///d:/SAMSUNG%20SFT/program_oa/oa-motion/src/engine/audio/ttsEngine.ts))**: Sintesis suara Bahasa Indonesia otomatis yang responsif, dilengkapi mekanisme *voice retry loop* dan *debounce*.
- **Canvas Skeleton Overlay Dinamis**: Visualisasi garis kaki & sudut lutut yang menyesuaikan secara otomatis untuk **Lutut Kiri**, **Lutut Kanan**, maupun **Kedua Lutut**.

### 5. 📄 Laporan Telerehabilitasi Cetak & Berbagi Keluarga
- **Laporan Klinis Komprehensif ([TelerehabReportPrint.tsx](file:///d:/SAMSUNG%20SFT/program_oa/oa-motion/src/components/features/summary/TelerehabReportPrint.tsx))**: Menghasilkan ringkasan laporan sesi latihan yang dapat dicetak/diunduh PDF untuk keluarga maupun konsultasi fisioterapis.
- **Privasi Total (Zero Video Transmission)**: Seluruh analisis citra dilakukan di memori RAM perangkat klien. Tidak ada video atau citra wajah yang dikirim ke server luar (Memenuhi UU PDP No. 27 Tahun 2022).

---

## 🗺️ Alur Penggunaan Aplikasi (User Flow)

```text
┌────────────────────────────────┐
│ 1. Profil Latihan ( / )        │ ──► Input Nama, Kapabilitas, Target Lutut (Kiri/Kanan/Kedua)
└───────────────┬────────────────┘
                │
                ▼
┌────────────────────────────────┐
│ 2. Kalibrasi Kamera (/calibration)│ ──► Panduan Jarak Kamera & Live Leg Canvas Preview
└───────────────┬────────────────┘
                │
                ▼
┌────────────────────────────────┐
│ 3. Latihan Real-time (/tracking)│ ──► Sit-to-Stand ──► Squat Bertahap (DTW & Audio Coach)
└───────────────┬────────────────┘
                │
                ▼
┌────────────────────────────────┐
│ 4. Ringkasan Sesi (/summary)   │ ──► Grafik Skor Kemiripan, Indicator Fatigue & Cetak PDF Report
└────────────────────────────────┘
```

---

## 💻 Teknologi & Arsitektur Kode

| Komponen | Teknologi |
| :--- | :--- |
| **Framework UI** | React 19 + TypeScript + Vite |
| **Styling & Ikon** | Tailwind CSS 4 + Lucide React Icons + shadcn/ui |
| **Computer Vision Engine** | Google MediaPipe Tasks Vision (`@mediapipe/tasks-vision`) WASM |
| **Kinematics & Analytics** | Custom DTW & NCC Matcher, EMA Landmark Smoother, Adaptive Fatigue Tracker |
| **Audio Engine** | Web Speech API (`SpeechSynthesis`) Paket Bahasa Indonesia (`id-ID`) |
| **Local Storage** | IndexedDB + Browser LocalStorage |

---

## 📁 Struktur Berkas Proyek

```text
oa-motion/
├── docs/                             # Dokumen PRD, Dev Guide, & Notulensi Bimbingan
├── public/                           # Aset statis & WASM model MediaPipe
├── src/
│   ├── components/
│   │   ├── common/                   # Komponen Header & LayOUT
│   │   ├── features/                 # Komponen khusus (Calibration, Summary, RoMChart, TelerehabReportPrint)
│   │   └── ui/                       # Komponen UI Reusable (Button, Card, Badge)
│   ├── constants/                    # Konstanta klinis, Golden Data acuan, & Frase Audio
│   ├── context/                      # State global Medical Profile Provider
│   ├── engine/
│   │   ├── audio/                    # Engine Suara (ttsEngine.ts)
│   │   └── kinematics/               # Algoritma Kinematika (angleCalculator, landmarkSmoother, poseDetector, DTW, fatigue)
│   ├── hooks/                        # Custom React Hooks (useCamera, usePoseTracking, useExerciseTracking, useAudioCoach)
│   ├── pages/                        # Halaman aplikasi (Home, Calibration, Tracking, Summary, ReferenceRecorder)
│   └── types/                        # Definisi tipe data TypeScript (clinical, kinematics, session)
├── README.md
├── package.json
└── vite.config.ts
```

---

## 🚀 Cara Menjalankan Aplikasi Secara Lokal

### Prasyarat
- Node.js versi 18.0.0 atau yang lebih baru
- Peramban web modern (Google Chrome / Microsoft Edge / Brave) yang mendukung WebGPU/WebGL & Web Speech API.

### Langkah Instalasi

1. **Clone repositori proyek**:
   ```bash
   git clone https://github.com/zakyrmh/oa-motion.git
   cd oa-motion
   ```

2. **Install dependensi npm**:
   ```bash
   npm install
   ```

3. **Jalankan server pengembangan (Dev Server)**:
   ```bash
   npm run dev
   ```
   Buka peramban di `http://localhost:5173`.

4. **Uji Pengompilan TypeScript & Build Produksi**:
   ```bash
   npm run build
   ```

---

## 👥 Tim SPEKTRA — Politeknik Negeri Padang

Proyek dikembangkan untuk **Samsung Solve for Tomorrow (SFT) 2026**:

- **Zaky Ramadhan** — *Project Manager & Lead Developer*
- **Naufal Khalil Aldeza** — *Computer Vision & Software Engineer*
- **Zahwa Rahmadhania** — *UI/UX & Research Specialist*
- **Vanisa Firsy** — *Technical Writer & QA Specialist*
- **Fazrol Rozi, S.ST., M.T. (Pak Oji)** — *Dosen Pembimbing*

---

## ⚖️ Lisensi & Disclaimer Medis

- **Disclaimer Medis**: OA-Motion merupakan alat bantu latihan mandiri dan pemantauan gerakan biomekanika preventif, **bukan** perangkat diagnostik medis atau pengganti fisioterapis profesional. Pengguna dengan nyeri sendi berat atau pasca-operasi wajib berkonsultasi dengan dokter sebelum memulai sesi latihan.
- **Lisensi**: Proyek ini dilindungi di bawah hak cipta Tim SPEKTRA (Politeknik Negeri Padang) untuk Samsung Solve for Tomorrow 2026.
