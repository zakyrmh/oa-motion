# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Added SVG visual trend chart component `RoMChart.tsx` on `/summary` displaying repetition-by-repetition Range of Motion (RoM) knee flexion angle trend curve with clinical safe limit threshold line and interactive tooltips (T-013).
- Added printable Telerehabilitation Session Summary PDF Report generator component `TelerehabReportPrint.tsx` with `@media print` layout, patient clinical profile, safety limits, repetition history breakdown, zero-video privacy compliance statement (UU PDP No. 27/2022), and physiotherapist verification sign-off block (T-014).
- Implemented post-exercise session analytics dashboard on `/summary` featuring 4 core metric cards (Active Duration, Safe Repetitions & Compliance Rate, Peak Flexion RoM, Red Zone Breach Count), detailed repetition audit log, and seamless multi-path navigation (T-012).
- Implemented live exercise tracking hero screen on `/tracking` with HTML5 Canvas skeleton overlay, real-time knee flexion angle bubble, dynamic 3-zone color banner, and emergency stop button (T-010).
- Implemented Finite State Machine (FSM) repetition counter and session aggregator hook `useExerciseTracking.ts` inspired by Nicholas Renotte pattern, recording repetition RoM, safe vs warning counts, and audio biofeedback cues (T-011).
- Added Medical Disclaimer and Clinical Safety banner on Home page (`/`), highlighting home-exercise digital spotter boundaries, safety instructions, and explicit Grade 4 OA exclusion (T-002B).
- Added responsive Target Knee Selector (`LUTUT KIRI`, `LUTUT KANAN`, `KEDUA LUTUT`) in `Home.tsx` and `src/constants/clinical.ts` synchronized with `MedicalProfileContext` (T-002B).
- Exported `TargetKnee` type in `src/types/clinical.ts` and added `TARGET_KNEE_OPTIONS` constant in `src/constants/clinical.ts` (T-002B).
- Enhanced `AppLayout.tsx` and `Home.tsx` container width classes to be fully responsive across mobile, tablet, and desktop viewports (`w-full max-w-md md:max-w-2xl lg:max-w-3xl`).
- Installed `@rolldown/binding-linux-x64-gnu` for native bundler support.
- Added MediaPipe Tasks Vision WASM integration using `@mediapipe/tasks-vision` for 33 body landmark tracking (T-005).
- Added `usePoseTracking` custom React hook to manage WebRTC webcam frame processing loop using `requestAnimationFrame` (T-005).
- Added normalized knee flexion angle calculation (`180 - theta`) in `calculateKneeAngle` based on Law of Cosines (T-006).
- Added keypoint visibility safety verification (minimum 0.60 threshold) in `calculateKneeAngle` (T-006).
- Updated default `EMAFilter` alpha parameter value to `0.25` for improved real-time tracking smoothness (T-007).
- Added geometric reconstruction and tracking fallback (`occlusionHeuristics.ts`) to estimate the knee position when occluded by loose clothing (T-007).
- Added `SafetyZone` type and `ZoneThresholds` interface in `src/types/clinical.ts` (T-008).
- Added `rulesEngine.ts` module with functions to dynamically calculate safety zones (GREEN, YELLOW, RED) and exercise phases (REST, FLEXION, HOLD, EXTENSION, OVER_FLEXION) based on OA grade limits (T-008).
- Added automatic real-time Text-to-Speech (TTS) Web Speech API integration in Indonesian (`id-ID`) on `/calibration` synchronized with mute/unmute toggle.
- Added data persistence via `localStorage` and React Router state forwarding across Home (`/`), Calibration (`/calibration`), and Tracking (`/tracking`) pages.
- Added AR camera calibration guide screen on `/calibration` featuring camera feed preview, side-profile body silhouette overlay, distance badge, audio instruction card, and status pill.
- Added `Profil Medis Harian` form on Home page (`/`) conforming to `DESIGN.md` brutalist-editorial design system and WCAG 2.1 AAA accessibility guidelines.
- Added Shadcn UI `Card`, `Badge`, and `Slider` components in `src/components/ui/`.
- Added `@radix-ui/react-slider` dependency.
- Added `react-router-dom` dependency for client-side routing.
- Added lazy-loaded page components for Home (`/`), Calibration (`/calibration`), Tracking (`/tracking`), and Summary (`/summary`).
- Configured Suspense-wrapped sequential page routing in `App.tsx` following Vercel React performance best practices.
- Installed and configured Git hooks with Husky (`^9.1.7`) and `lint-staged` (`^17.3.0`).
- Installed and configured Commitlint (`@commitlint/cli`, `@commitlint/config-conventional`) for commit message validation.
- Installed and configured Commitizen (`commitizen`, `cz-conventional-changelog`) with `npm run commit` script.
- Installed shadcn/ui (v4) with Base UI (`@base-ui/react`) component library and Nova preset.
- Added path alias (`@/*`) configuration in `vite.config.ts`, `tsconfig.json`, and `tsconfig.app.json`.

### Fixed

- Cleaned up deprecated `baseUrl` and `ignoreDeprecations` options from TypeScript configuration for modern bundler compatibility.

### Removed

- Removed unused Vite boilerplate CSS file (`src/App.css`).

## [0.1.0] - 2026-08-13

### Added

- Initial project setup with Vite, React, TypeScript, and Tailwind CSS.
