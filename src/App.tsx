import { lazy, Suspense } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { MedicalProfileProvider } from '@/context/MedicalProfileProvider';

const Home = lazy(() => import('./pages/Home'));
const Calibration = lazy(() => import('./pages/Calibration'));
const Tracking = lazy(() => import('./pages/Tracking'));
const Summary = lazy(() => import('./pages/Summary'));

export default function App() {
  return (
    <MedicalProfileProvider>
      <BrowserRouter>
        <Suspense fallback={<div className="min-h-screen bg-[#e5e5e5]" />}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/calibration" element={<Calibration />} />
            <Route path="/tracking" element={<Tracking />} />
            <Route path="/summary" element={<Summary />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </MedicalProfileProvider>
  );
}
