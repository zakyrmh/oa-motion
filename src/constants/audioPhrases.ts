export const AUDIO_PHRASES = {
  CALIBRATION: {
    DISTANCE_INSTRUCTION: 'Posisikan smartphone sejajar lutut Anda pada jarak 1.5 hingga 2 meter.',
    POSITION_ALIGNED: 'Posisi tubuh terdeteksi sempurna. Siap untuk memulai latihan.',
    POSITION_MISALIGNED: 'Tubuh belum sejajar. Harap berdiri tampak samping ke arah kamera.',
  },
  EXERCISE: {
    START: 'Mulai latihan. Tekuk lutut perlahan hingga batas nyaman.',
    HOLD_COUNTDOWN: (secondsLeft: number) => `Tahan ${secondsLeft} detik`,
    WARNING_OVER_FLEXION: 'Peringatan! Tekukan lutut melebihi batas aman.',
    EXTEND_SLOWLY: 'Luruskan lutut kembali ke posisi awal secara perlahan.',
    REP_SUCCESS: (rep: number, total: number) => `Bagus! Repetisi ke ${rep} dari ${total} selesai.`,
    SESSION_COMPLETE: 'Latihan hari ini selesai. Kerja yang sangat bagus!',
  },
} as const;
