import type { ExerciseSessionSummary } from '@/types/session';

interface TelerehabReportPrintProps {
  sessionSummary: ExerciseSessionSummary;
}

export function TelerehabReportPrint({ sessionSummary }: TelerehabReportPrintProps) {
  const profile = sessionSummary.userProfile;

  const redWarnings = sessionSummary.repetitionHistory.filter((r) => !r.isSafeRoM).length;
  const complianceRate =
    sessionSummary.totalRepsCompleted > 0
      ? Math.round((sessionSummary.safeRepsCompleted / sessionSummary.totalRepsCompleted) * 100)
      : 100;

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const formattedDate = new Date(sessionSummary.date).toLocaleDateString('id-ID', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className="hidden print:block print:w-full print:p-6 print:bg-white print:text-black font-sans leading-relaxed text-xs">
      {/* Printable Header / Letterhead */}
      <div className="border-b-2 border-black pb-4 mb-6 flex justify-between items-start">
        <div>
          <h1 className="text-xl font-black uppercase tracking-tight">OA-MOTION // TELEREHABILITATION REPORT</h1>
          <p className="text-xs font-mono text-gray-600 font-semibold uppercase">
            Sistem Panduan Latihan Adaptif Berbasis Edge AI & Biomekanika Lutut
          </p>
          <p className="text-[10px] font-mono text-gray-500 mt-1">
            Tim SPEKTRA — Politeknik Negeri Padang | Samsung Solve for Tomorrow 2026
          </p>
        </div>
        <div className="text-right font-mono text-[10px] text-gray-700">
          <p className="font-bold text-xs text-black">ID SESI: {sessionSummary.sessionId}</p>
          <p>{formattedDate}</p>
          <p className="text-emerald-700 font-bold mt-1">✓ VERIFIKASI EDGE AI ZERO VIDEO TRANSMISSION</p>
        </div>
      </div>

      {/* Patient & Clinical Profile Grid */}
      <div className="grid grid-cols-2 gap-4 mb-6 border border-black p-4 rounded-xl bg-gray-50">
        <div>
          <h3 className="font-mono font-bold text-xs text-black uppercase mb-2 border-b border-gray-300 pb-1">
            PROFIL LATIHAN PENGGUNA
          </h3>
          <table className="w-full text-xs font-mono">
            <tbody>
              <tr>
                <td className="text-gray-600 py-0.5">Nama panggilan:</td>
                <td className="font-bold text-black py-0.5">{profile.namaPanggilan || 'Tidak diisi'}</td>
              </tr>
              <tr>
                <td className="text-gray-600 py-0.5">Sisi Lutut Target:</td>
                <td className="font-bold text-black py-0.5">
                  {profile.targetKnee === 'right' ? 'Lutut Kanan' : profile.targetKnee === 'both' ? 'Kedua Lutut' : 'Lutut Kiri'}
                </td>
              </tr>
              <tr>
                <td className="text-gray-600 py-0.5">Kapabilitas Gerak:</td>
                <td className="font-bold text-black py-0.5">
                  {profile.kapabilitas === 'hanya_duduk' ? 'Hanya duduk' : 'Duduk dan berdiri'}
                </td>
              </tr>
              <tr>
                <td className="text-gray-600 py-0.5">Pendampingan:</td>
                <td className="font-bold text-black py-0.5">{profile.pendampingan === 'mandiri' ? 'Mandiri' : 'Butuh pendamping'}</td>
              </tr>
              <tr>
                <td className="text-gray-600 py-0.5">Target repetisi:</td>
                <td className="font-bold text-black py-0.5">{profile.targetRepetisiPerSesi} repetisi</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div>
          <h3 className="font-mono font-bold text-xs text-black uppercase mb-2 border-b border-gray-300 pb-1">
            RINGKASAN EVALUASI GERAKAN
          </h3>
          <table className="w-full text-xs font-mono">
            <tbody>
              <tr>
                <td className="text-gray-600 py-0.5">Skor kemiripan rata-rata:</td>
                <td className="font-bold text-black py-0.5">{sessionSummary.averageSimilarityScore}%</td>
              </tr>
              <tr>
                <td className="text-gray-600 py-0.5">Status kelelahan:</td>
                <td className="font-bold text-black py-0.5">{sessionSummary.fatigueFlag ? 'Terdeteksi' : 'Tidak terdeteksi'}</td>
              </tr>
              <tr>
                <td className="text-gray-600 py-0.5">Skor form rata-rata:</td>
                <td className="font-bold text-black py-0.5">{sessionSummary.overallFormScore}/100</td>
              </tr>
              <tr>
                <td className="text-gray-600 py-0.5">Status Evaluasi Spotter:</td>
                <td className={`font-bold py-0.5 ${redWarnings === 0 ? 'text-emerald-700' : 'text-amber-700'}`}>
                  {redWarnings === 0 ? 'Terkontrol Bebas Peringatan' : `${redWarnings} Peringatan Zona Merah`}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Core Session Performance Metrics */}
      <div className="mb-6">
        <h3 className="font-mono font-bold text-xs text-black uppercase mb-2">RINGKASAN METRIK PERFORMA SESI</h3>
        <div className="grid grid-cols-4 gap-3 text-center">
          <div className="border border-black p-3 rounded-lg bg-white">
            <span className="block font-mono text-[10px] text-gray-500 uppercase font-bold">DURASI LATIHAN</span>
            <span className="text-lg font-black font-mono text-black">{formatTime(sessionSummary.totalDurationSeconds)}</span>
          </div>
          <div className="border border-black p-3 rounded-lg bg-white">
            <span className="block font-mono text-[10px] text-gray-500 uppercase font-bold">REPETISI AMAN</span>
            <span className="text-lg font-black font-mono text-black">
              {sessionSummary.safeRepsCompleted}/{sessionSummary.totalRepsCompleted} ({complianceRate}%)
            </span>
          </div>
          <div className="border border-black p-3 rounded-lg bg-white">
            <span className="block font-mono text-[10px] text-gray-500 uppercase font-bold">KEMIRIPAN RATA-RATA</span>
            <span className="text-lg font-black font-mono text-black">{sessionSummary.averageSimilarityScore}%</span>
          </div>
          <div className="border border-black p-3 rounded-lg bg-white">
            <span className="block font-mono text-[10px] text-gray-500 uppercase font-bold">SKOR FORM KESELURUHAN</span>
            <span className="text-lg font-black font-mono text-black">{sessionSummary.overallFormScore}/100</span>
          </div>
        </div>
      </div>

      {/* Repetition History Table */}
      <div className="mb-6">
        <h3 className="font-mono font-bold text-xs text-black uppercase mb-2">LOG DETAIL REPETISI SQUAT</h3>
        <table className="w-full text-left border-collapse border border-black font-mono text-xs">
          <thead>
            <tr className="bg-gray-100 border-b border-black">
              <th className="p-2 border-r border-black">Rep #</th>
              <th className="p-2 border-r border-black">Fleksi Lutut Maksimal</th>
              <th className="p-2 border-r border-black">Waktu Tahan (Hold)</th>
              <th className="p-2 border-r border-black">Skor Form</th>
              <th className="p-2">Status Keselamatan</th>
            </tr>
          </thead>
          <tbody>
            {sessionSummary.repetitionHistory.map((rep) => (
              <tr key={rep.repIndex} className="border-b border-gray-300">
                <td className="p-2 border-r border-black font-bold">#{rep.repIndex}</td>
                <td className="p-2 border-r border-black">{rep.maxFlexionAngle}°</td>
                <td className="p-2 border-r border-black">{rep.holdDurationSeconds} Detik</td>
                <td className="p-2 border-r border-black">{rep.formScore}/100</td>
                <td className="p-2 font-bold">
                  {rep.isSafeRoM ? (
                    <span className="text-emerald-700">✓ AMAN (BERADA DI ZONA AMAN)</span>
                  ) : (
                    <span className="text-red-600">⚠ OVERFLEX (MELEBIHI BATAS KLINIS)</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Zero Video Privacy & Verification Footer */}
      <div className="border-t border-black pt-4 mt-6">
        <div className="p-3 bg-gray-50 border border-gray-400 rounded-lg mb-6 text-[10px] font-mono leading-relaxed text-gray-700">
          <p className="font-bold text-black uppercase">PERNYATAAN PRIVASI PRIVASI REKAM MEDIS & KEPATUHAN ETIS (ZERO VIDEO TRANSMISSION):</p>
          Laporan ini dihasilkan secara otomatis oleh mesin Edge AI OA-Motion. Seluruh inferensi pose MediaPipe dan kalkulasi sudut fleksi diproses secara lokal di memori RAM browser pengguna. Tidak ada aliran video atau gambar visual yang dikirimkan ke server cloud eksternal, mematuhi standar privasi UU No. 27 Tahun 2022 tentang Perlindungan Data Pribadi (UU PDP).
        </div>

        {/* Clinical Sign-off & Notes section */}
        <div className="grid grid-cols-2 gap-8 pt-2 font-mono text-xs">
          <div>
            <p className="font-bold uppercase mb-2">CATATAN EVALUASI FISIOTERAPIS / DOKTER:</p>
            <div className="border border-dashed border-gray-400 h-24 rounded p-2 text-gray-400">
              (Area catatan fisioterapis pendamping...)
            </div>
          </div>
          <div className="flex flex-col justify-between text-right">
            <div>
              <p className="font-bold uppercase">VERIFIKASI FISIOTERAPIS MITRA</p>
              <p className="text-[10px] text-gray-500">Tanda tangan & Nama Terang</p>
            </div>
            <div className="border-b border-black w-48 ml-auto my-4" />
            <p className="text-[10px] text-gray-600">Tanggal: ____________________</p>
          </div>
        </div>
      </div>
    </div>
  );
}
