# OA-Motion: Adaptive Sports Guidance System

> **Sistem Panduan Olahraga Adaptif Berbasis Edge AI & Computer Vision untuk Penderita Osteoarthritis**  
> *Dikembangkan oleh Tim SPEKTRA (Politeknik Negeri Padang) untuk Samsung Solve for Tomorrow (SFT) 2026 — Kategori Sport & Technology.*

---

## 📖 Ringkasan

**OA-Motion** adalah aplikasi web kesehatan berbasis *Edge AI* dan *Computer Vision* yang berfungsi sebagai **"Digital Spotter"** bagi penderita Osteoarthritis (OA) lutut (Grade 1–3) dan pasien pasca-operasi. Aplikasi ini memanfaatkan kamera bawaan perangkat tanpa sensor fisik tambahan (*zero hardware barrier*), memantau sudut fleksi lutut secara *real-time*, memberikan umpan balik visual dan audio Bahasa Indonesia, serta menyusun laporan sesi latihan mandiri untuk telerehabilitasi fisioterapi.

---

## 📚 Dokumentasi Proyek

Seluruh dokumentasi teknis dan spesifikasi proyek tersimpan di dalam direktori [`docs/`](./docs/):

- **[Product Requirements Document (PRD)](./docs/PRD.md):** Latar belakang klinis, profil pengguna, arsitektur sistem, dan target keberhasilan SFT 2026.
- **[Design System & Style Guide](./docs/DESIGN.md):** Spesifikasi visual Brutalist Editorial, token warna, dan tipografi.
- **[Task List & Roadmap](./docs/TASKS.md):** Rincian backlog tugas pengembangan dari Fase 1 hingga Fase 5.
- **[AI Agent Guide (AGENTS.md)](./docs/AGENTS.md):** Konvensi kode, arsitektur folder, dan pedoman operasional untuk AI Coding Agent.

---

## 🛠️ Tech Stack

- **Frontend:** React 19, TypeScript, Vite, React Router DOM v7
- **Styling & UI:** Tailwind CSS v4, shadcn/ui, Lucide React
- **Computer Vision & AI:** MediaPipe Pose (Edge AI WASM), Aturan Kosinus Trigonometri, Filter EMA
- **Audio Coach:** Web Speech API (Indonesian Voice) & Web Audio API Synthesizer
- **Tooling & Code Quality:** ESLint, Husky, Lint-staged, Commitlint, Commitizen

---

## 🚀 Memulai Pengembangan

### 1. Prasyarat
Pastikan [Node.js](https://nodejs.org/) (versi LTS terbaru) telah terpasang.

### 2. Instalasi Dependency
```bash
npm install
```

### 3. Menjalankan Development Server
```bash
npm run dev
```

### 4. Menjalankan Linting & Type-Check
```bash
npm run lint
npm run build
```

---

## 👥 Tim Pengembang (Tim SPEKTRA — SFT 2026)

- **Zaky Ramadhan** — Product Owner & Lead Developer
- **Naufal Khalil Aldeza** — AI & Computer Vision Engineer
- **Zahwa Rahmadhania** — UI/UX & Frontend Developer
- **Vanisa Firsy** — Clinical Research & Data Analyst
