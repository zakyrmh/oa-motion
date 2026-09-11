import { lazy, Suspense } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { MedicalProfileProvider } from '@/context/MedicalProfileProvider';
import { hydrateReferenceMovements } from '@/engine/kinematics/referenceStorage';

const Home = lazy(() => import('./pages/Home'));
const Calibration = lazy(() => import('./pages/Calibration'));
const Tracking = lazy(() => import('./pages/Tracking'));
const Summary = lazy(() => import('./pages/Summary'));
const ReferenceRecorder = lazy(() => import('./pages/ReferenceRecorder'));

export default function App() {
  void hydrateReferenceMovements().catch(() => undefined);

  return (
    <MedicalProfileProvider>
      <BrowserRouter>
        <Suspense fallback={<div className="min-h-screen bg-[#e5e5e5]" />}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/calibration" element={<Calibration />} />
            <Route path="/tracking" element={<Tracking />} />
            <Route path="/summary" element={<Summary />} />
            <Route path="/reference-recorder" element={<ReferenceRecorder />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </MedicalProfileProvider>
  );
}
