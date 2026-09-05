# OA-Motion — Panduan Pengembangan Web App

Dokumen ini adalah rujukan teknis untuk agent AI (misalnya Claude Code) yang akan membangun purwarupa web app OA-Motion untuk kebutuhan demo Samsung Solve for Tomorrow 2026. Isinya merangkum konsep final tim SPEKTRA setelah melalui beberapa putaran revisi berdasarkan masukan mentor, dan menandai secara eksplisit bagian mana yang masih berupa parameter sementara (butuh validasi klinis) versus bagian yang sudah siap diimplementasikan sebagai purwarupa.

Konvensi penandaan di dokumen ini: teks berformat `[BUTUH VALIDASI: ...]` berarti nilai atau logika tersebut adalah asumsi awal untuk keperluan demo, dan wajib dikonfirmasi ke fisioterapis mitra sebelum dipakai di luar tahap purwarupa.

---

## 1. Ringkasan konsep

OA-Motion adalah aplikasi web yang memandu penderita osteoarthritis (OA) lutut melakukan gerakan squat dan latihan penguatan lain secara mandiri dan aman di rumah, memakai kamera bawaan laptop atau smartphone. Sistem mendeteksi pose tubuh secara real-time, menghitung sudut sendi lutut, dan memberi umpan balik visual serta suara sebelum pengguna mencapai sudut gerakan yang berisiko bagi kondisi mereka.

Masalah inti yang dijawab: penderita OA tahu bahwa olahraga terkontrol membantu memperlambat degenerasi sendi, tapi mereka berhenti berolahraga karena dua hal, yaitu tidak tahu batas gerakan yang aman untuk kondisi mereka, dan tidak sanggup membayar fisioterapis secara rutin untuk pendampingan.

Prinsip desain utama, urut dari yang paling penting:

1. **Preventif, bukan evaluatif.** Sistem memperingatkan sebelum sudut berisiko tercapai, bukan menilai setelah gerakan selesai.
2. **Personal per pengguna, bukan generik.** Batas aman gerakan (adaptive thresholding) menyesuaikan grade OA masing-masing pengguna, bukan satu standar untuk semua orang.
3. **Zero hardware barrier.** Hanya kamera bawaan perangkat, tanpa sensor atau wearable tambahan.
4. **Squat sebagai gerakan inti.** Bukan sekadar satu dari banyak gerakan, tapi gerakan yang paling dipoles untuk demo, karena fungsional secara olahraga (bukan cuma medis) dan parameter keamanannya (kedalaman, lebar tumpuan, rotasi kaki) paling relevan dipantau dengan computer vision.

---

## 2. Target pengguna

- **Utama:** penderita OA lutut grade 1 sampai 3, terutama perempuan usia 40 tahun ke atas, dan individu pasca operasi lutut dalam masa pemulihan.
- **Sekunder:** masyarakat usia produktif yang ingin mencegah cedera sendi lewat pemantauan form gerakan, serta fisioterapis yang memakai data OA-Motion sebagai laporan progres pasien.
- **Eksplisit di luar cakupan:** OA grade 4 (kondisi berat, sudah sulit berjalan). Gerakan squat pada kedalaman berapa pun tetap butuh pengawasan klinis langsung pada tingkat keparahan ini, jadi aplikasi tidak dirancang untuk kelompok ini.

Dua persona kerja (representasi kebutuhan, bukan hasil wawancara individu):

- **Ibu Hartini, 68 tahun** — OA grade 2, tinggal sendiri, tidak terbiasa aplikasi rumit. Butuh instruksi sederhana, suara jelas, dan kepastian gerakan yang dilakukan aman.
- **Pak Doni, 54 tahun** — pasca operasi lutut, aktif bekerja. Butuh konfirmasi objektif bahwa gerakannya benar tanpa harus bolak-balik ke klinik.

Implikasi desain UI: font besar, kontras tinggi, navigasi minimal (idealnya tidak lebih dari 2-3 tap untuk mulai sesi latihan), instruksi suara berbahasa Indonesia, dan hindari istilah teknis di antarmuka pengguna akhir.

---

## 3. Lingkup MVP untuk demo

Karena tujuan saat ini adalah purwarupa yang bisa didemokan, bukan produk produksi penuh, berikut pembagian prioritas.

### Harus ada untuk demo
- Deteksi pose real-time dari kamera (webcam laptop cukup untuk demo).
- Kalkulasi sudut lutut secara live saat squat.
- Indikator tiga zona (hijau, kuning, merah) yang berubah sesuai sudut real-time.
- Minimal dua profil grade OA yang bisa dipilih (misalnya grade 1 dan grade 3) untuk menunjukkan adaptive thresholding bekerja beda pada tiap profil.
- Ringkasan sesi sederhana setelah selesai (durasi, jumlah pengulangan, jumlah peringatan zona merah).

### Bagus untuk demo, tapi boleh disederhanakan
- Panduan kalibrasi kamera otomatis dengan bounding box. Untuk demo, boleh diganti instruksi statis ("berdiri di sini, kamera sejajar lutut") tanpa validasi otomatis penuh.
- Umpan balik suara. Untuk demo, cukup memakai Web Speech API bawaan browser untuk teks ke suara berbahasa Indonesia, tidak perlu model TTS custom.
- Grafik riwayat progres. Untuk demo, cukup grafik satu sesi terakhir, tidak perlu histori multi-minggu.

### Tidak perlu untuk demo, taruh di roadmap
- Autentikasi pengguna penuh dan manajemen akun multi-user.
- Enkripsi AES-256 dan kepatuhan penuh UU PDP/Permenkes Rekam Medis (tetap sebutkan sebagai rencana di paper dan pitch, tapi tidak wajib diimplementasikan penuh untuk purwarupa demo).
- Fitur berbagi laporan ke fisioterapis (telerehabilitation) versi lengkap. Untuk demo, cukup tombol "unduh ringkasan sesi" sebagai bukti konsep.
- Deteksi anomali gerakan asimetris dan personalisasi berkelanjutan lintas sesi (fitur lapisan AI tahap lanjut, bukan prioritas MVP).

---

## 4. Alur pengguna (user flow)

1. **Pilih profil.** Pengguna memilih atau mengisi grade OA (untuk demo, cukup dropdown grade 1/2/3, tanpa form medis penuh).
2. **Kalibrasi kamera.** Instruksi memposisikan kamera sejajar lutut, jarak sekitar 1,5-2 meter, sisi tubuh menghadap kamera (bidang kardinal lateral), supaya sudut lutut terbaca akurat.
3. **Mulai sesi squat.** Pose estimation berjalan real-time, sudut lutut dihitung tiap frame, indikator warna berubah sesuai kedekatan dengan batas aman.
4. **Umpan balik langsung.** Saat mendekati batas zona kuning, tampil peringatan visual dan suara sebelum masuk zona merah.
5. **Ringkasan sesi.** Setelah sesi selesai, tampilkan durasi, jumlah pengulangan, rata-rata sudut, dan jumlah peringatan yang muncul.

---

## 5. Arsitektur teknis yang disarankan

Karena ini web app, pose estimation sebaiknya berjalan di sisi klien (browser), bukan server, untuk dua alasan: latensi lebih rendah untuk real-time feedback, dan tidak perlu mengirim video ke server (selaras dengan prinsip privasi data medis).

- **Pose estimation:** MediaPipe Tasks Vision (`@mediapipe/tasks-vision`), model `PoseLandmarker`, berjalan di browser lewat WebAssembly/WebGL. Ini adalah versi web dari MediaPipe Pose (arsitektur BlazePose) yang dipakai di konsep paper.
- **Kalkulasi sudut:** hitung sudut lutut dari tiga titik landmark (pergelangan kaki, lutut, panggul) memakai aturan kosinus di sisi klien, setiap frame.
  ```
  sudut = arccos( (v1 . v2) / (|v1| * |v2|) )
  ```
  di mana v1 adalah vektor dari lutut ke pergelangan kaki, dan v2 adalah vektor dari lutut ke panggul.
- **Adaptive thresholding:** logika sederhana berupa lookup table sudut aman per grade OA. `[BUTUH VALIDASI: nilai ambang derajat fleksi lutut per grade OA di bawah ini adalah placeholder awal untuk demo, bukan angka klinis final]`

  | Grade OA | Zona hijau (aman) | Zona kuning (waspada) | Zona merah (stop) |
  |---|---|---|---|
  | 1 | 0 sampai [BUTUH VALIDASI] derajat | [BUTUH VALIDASI] sampai [BUTUH VALIDASI] derajat | di atas [BUTUH VALIDASI] derajat |
  | 2 | 0 sampai [BUTUH VALIDASI] derajat | [BUTUH VALIDASI] sampai [BUTUH VALIDASI] derajat | di atas [BUTUH VALIDASI] derajat |
  | 3 | 0 sampai [BUTUH VALIDASI] derajat | [BUTUH VALIDASI] sampai [BUTUH VALIDASI] derajat | di atas [BUTUH VALIDASI] derajat |

  Untuk keperluan demo saja (bukan klaim klinis), tim boleh memakai asumsi kerja sementara bahwa grade yang lebih berat mendapat batas kedalaman squat yang lebih dangkal, lalu isi tabel di atas dengan angka yang masuk akal secara kualitatif, dan tandai jelas di pitch/demo bahwa angka final menunggu validasi fisioterapis.
- **Feedback suara:** Web Speech API (`SpeechSynthesisUtterance`, `lang: 'id-ID'`) untuk teks ke suara langsung di browser, cukup untuk demo tanpa dependensi eksternal.
- **State sesi:** simpan di client-side state (React state atau IndexedDB untuk persist sederhana) untuk demo. Tidak perlu backend database di tahap ini kecuali tim ingin menunjukkan fitur riwayat lintas sesi.
- **Frontend:** disarankan React, dengan kanvas overlay (HTML canvas di atas video feed) untuk menggambar skeleton landmark dan indikator zona warna secara real-time.

### Struktur data minimal

```
UserProfile {
  id: string
  oaGrade: 1 | 2 | 3
  kneeSide: "kiri" | "kanan" | "keduanya"
}

ExerciseSession {
  id: string
  userProfileId: string
  startedAt: timestamp
  endedAt: timestamp
  repCount: number
  avgKneeAngle: number
  warningCount: number  // berapa kali masuk zona kuning/merah
}
```

---

## 6. Batasan dan hal yang wajib disebutkan di aplikasi

- Aplikasi ini adalah alat bantu latihan mandiri, bukan alat diagnostik dan bukan pengganti fisioterapis. Sebutkan ini secara eksplisit di layar onboarding.
- Aplikasi tidak ditujukan untuk OA grade 4 atau kondisi lutut pasca operasi yang belum mendapat izin bergerak dari dokter. Cantumkan sebagai bagian dari alur pemilihan profil (bukan cuma di halaman terpisah yang mudah dilewati).
- Karena ini purwarupa demo, akurasi sudut belum divalidasi terhadap goniometer klinis. Jangan menampilkan klaim akurasi angka pasti (misalnya "akurat hingga ±5°") di antarmuka sebelum benar-benar diuji, cukup sebutkan "dalam tahap pengembangan" di UI.

---

## 7. Checklist yang masih perlu tim lengkapi sebelum ke tahap berikutnya

1. Nilai ambang derajat fleksi lutut per grade OA pada tabel adaptive thresholding (bagian 5), idealnya dikonsultasikan ke fisioterapis mitra.
2. Salinan teks informed consent yang akan ditampilkan sebelum profil medis diisi (belum wajib untuk demo, tapi perlu disiapkan untuk versi lanjutan).
3. Keputusan apakah demo akan memakai data pengguna sungguhan (dengan consent) atau cukup anggota tim sendiri sebagai demonstrator saat presentasi.
