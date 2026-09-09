# OA-Motion — Panduan Pengembangan Web App (v2)

Versi ini menggantikan draf sebelumnya. Perubahan utama: arsitektur personalisasi bergeser dari "tabel ambang derajat per grade OA" (yang sumbernya belum ada) menjadi pendekatan **perbandingan terhadap gerakan referensi** (golden reference) plus **baseline kelelahan adaptif per sesi**, mengikuti arahan Pak Oji dan literatur yang sudah diverifikasi. Riwayat perubahan ada di bagian paling bawah.

Konvensi penandaan: `[BUTUH VALIDASI: ...]` berarti keputusan sementara untuk demo yang wajib dikonfirmasi sebelum dipakai di luar tahap purwarupa. `[VERIFIKASI SITASI]` berarti klaim akademis yang perlu dicek ulang detail bibliografinya (volume/halaman/DOI) langsung ke sumber sebelum dipakai formal di paper.

---

## 1. Ringkasan konsep

OA-Motion adalah aplikasi web yang memandu penderita osteoarthritis (OA) lutut dan lansia melakukan latihan penguatan otot tungkai bawah secara mandiri dan aman di rumah, memakai kamera bawaan laptop atau smartphone yang terkoneksi internet. Sistem membandingkan gerakan pengguna secara real-time terhadap pola gerakan referensi yang direkam dari instruktur/fisioterapis, memberi umpan balik sebelum gerakan berisiko terjadi, menghitung repetisi, dan bisa melaporkan ringkasan sesi ke keluarga atau pendamping pengguna.

Masalah inti yang dijawab: orang tua/penderita OA ingin tetap aktif ("usia bukan alasan untuk lemah"), tapi berhenti berolahraga karena tidak tahu gerakan mana yang aman, dan tidak sanggup membayar pendampingan fisioterapis secara rutin.

Prinsip desain, urut dari yang paling penting:

1. **Preventif, bukan evaluatif.** Sistem memperingatkan sebelum pola gerakan menyimpang jauh dari referensi aman, bukan menilai setelah gerakan selesai.
2. **Personal lewat data sesi sendiri, bukan tabel klinis eksternal.** Baseline kemampuan pengguna dibangun dari repetisi awal tiap sesi (lihat bagian 5), bukan dari tabel ambang grade OA yang sumbernya tidak bisa kita pertanggungjawabkan.
3. **Golden reference dari pelatih sungguhan.** Pola gerakan yang benar direkam dari instruktur/fisioterapis asli sebagai data primer, bukan diasumsikan dari literatur. Ini juga jawaban konkret atas kritik soal keaslian data riset.
4. **Zero hardware barrier.** Hanya kamera bawaan perangkat.
5. **Progresi bertahap.** Sit-to-stand dulu sebagai gerakan skrining/pemanasan, baru squat dengan kedalaman meningkat bertahap.

---

## 2. Target pengguna dan profil

Field profil pengguna diganti dari "grade OA" (yang butuh data klinis eksternal) menjadi kapabilitas fungsional yang bisa diisi pengguna sendiri di awal, sesuai arahan Pak Oji:

```
UserProfile {
  id: string
  namaPanggilan: string
  kapabilitas: "hanya_duduk" | "duduk_dan_berdiri"
  pendampingan: "mandiri" | "butuh_pendamping"
  targetRepetisiPerSesi: number   // contoh default: 10
  kontakKeluarga: string (opsional, untuk fitur report)
}
```

Dua persona kerja tetap relevan sebagai acuan kebutuhan (representasi kebutuhan, bukan hasil wawancara individu):

- **Ibu Hartini, 68 tahun** — tinggal sendiri, tidak terbiasa aplikasi rumit, butuh instruksi sederhana dan kepastian gerakan aman. Cocok dengan mode `mandiri` (lihat bagian 4).
- **Pak Doni, 54 tahun** — pasca operasi lutut, aktif bekerja, butuh konfirmasi objektif bahwa gerakannya benar. Kebutuhannya persis dijawab oleh fitur "feedback yang memastikan gerakan pasca operasi tidak mencederai ulang sendi" yang disebut Pak Oji.

Eksplisit di luar cakupan: kondisi yang butuh pengawasan klinis langsung (misalnya OA berat/grade 4 atau pasca operasi yang belum dapat izin bergerak dari dokter). Ini disebutkan di layar profil, bukan hanya di halaman disclaimer terpisah.

---

## 3. Sumber data referensi ("golden data")

Ini bagian yang paling penting diperbaiki dari draf sebelumnya. Sistem **tidak** mengambil ambang batas dari tabel klinis eksternal. Sebagai gantinya:

1. Rekam beberapa sesi gerakan (sit-to-stand dan squat bertahap) yang dilakukan oleh instruktur/fisioterapis mitra yang gerakannya sudah dikonfirmasi benar secara klinis. Ini jadi data primer asli tim, bukan asumsi dari literatur, dan langsung menjawab permintaan mentor soal keaslian data.
2. Simpan gerakan referensi ini sebagai deret waktu sudut sendi (bukan video mentah), yaitu barisan sudut lutut dan panggul per frame sepanjang satu repetisi penuh.
3. Karena perbandingan berbasis sudut sendi (bukan koordinat piksel absolut), perbedaan tinggi badan atau panjang tungkai antara pengguna dan model referensi tidak jadi masalah. Sudut adalah besaran relatif.
4. `[BUTUH VALIDASI]` Jumlah repetisi referensi minimal yang direkam per gerakan, dan apakah perlu lebih dari satu model referensi (misalnya varian tubuh berbeda) untuk generalisasi yang lebih baik.

---

## 4. Alur pengguna (user flow)

1. **Isi profil.** Kapabilitas (duduk saja/duduk dan berdiri), status pendampingan (mandiri/butuh pendamping), target repetisi per sesi.
2. **Kalibrasi kamera.** Posisi kamera pada jarak sekitar 3 meter, serong 45 derajat dari pengguna. `[BUTUH VALIDASI, lihat bagian 7]`
3. **Pilih mode.**
   - **Mandiri (independent):** aplikasi menampilkan contoh gerakan referensi (overlay skeleton atau video contoh) sebelum dan selama sesi, karena tidak ada pendamping yang mengoreksi secara langsung.
   - **Dengan pendamping:** overlay referensi opsional, karena pendamping bisa membantu koreksi manual.
4. **Sesi latihan.**
   - Tahap 1: sit-to-stand (gerakan duduk ke berdiri) sebagai skrining kemampuan dan pemanasan.
   - Tahap 2: squat bertahap, dimulai dari kedalaman dangkal menuju target tertentu, bukan langsung squat penuh.
   - Sistem membandingkan pola gerakan pengguna terhadap referensi secara real-time (lihat bagian 5), menghitung repetisi, dan memberi umpan balik sebelum penyimpangan gerakan terlalu jauh dari pola aman.
5. **Ringkasan sesi.** Durasi, jumlah repetisi tercapai dari target, skor kemiripan gerakan rata-rata, indikasi kelelahan (lihat bagian 5).
6. **Laporan ke keluarga (opsional).** Ringkasan sesi bisa dikirim/diunduh untuk dilihat kontak keluarga yang didaftarkan di profil.

---

## 5. Arsitektur teknis

Pose estimation tetap disarankan berjalan di sisi klien (browser) untuk latensi rendah dan privasi (video tidak perlu dikirim ke server).

### Ekstraksi pose dan kalkulasi sudut
- **Pose estimation:** MediaPipe Tasks Vision (`@mediapipe/tasks-vision`), model `PoseLandmarker`, berjalan di browser lewat WebAssembly/WebGL.
- **Kalkulasi sudut:** aturan kosinus pada tiga titik landmark (pergelangan kaki, lutut, panggul), dihitung tiap frame, sama seperti draf sebelumnya.
- **Normalisasi:** gunakan strategi *fixed bounding box* untuk menstabilkan pelacakan terhadap pergerakan kamera/tubuh kecil, mengikuti pendekatan Ullah dkk. (2025) [VERIFIKASI SITASI: sudah dicek cocok dengan sumber asli, aman dipakai].

### Perbandingan terhadap gerakan referensi (menggantikan tabel ambang grade OA)
- Gunakan **Dynamic Time Warping (DTW)** untuk menyelaraskan ritme/waktu gerakan pengguna terhadap gerakan referensi, karena kecepatan gerakan tiap orang berbeda.
- Gunakan **Normalized Cross-Correlation (NCC)** untuk mengukur kemiripan pola lintasan sudut sendi antara pengguna dan referensi.
- Skor kemiripan inilah yang menentukan zona umpan balik (aman/waspada/berhenti), bukan ambang derajat statis dari tabel eksternal.
- Pendekatan ini mengikuti Ullah dkk. (2025), yang menurut pengujian mereka mengungguli RepNet (model rep counting berbasis video) dari sisi akurasi maupun efisiensi komputasi.

### Penghitungan repetisi
- State machine berbasis sudut sendi utama: berdiri (sudut besar) → turun → titik terendah → naik → berdiri lagi = 1 repetisi, mengikuti arsitektur umum sistem rep counting berbasis pose (lihat referensi Alatiah & Chen, dan sistem lima komponen pose estimation-thresholding-optical flow-state machine-counter dari sistem *Pūioio*).
- Alternatif yang lebih robust jika waktu memungkinkan: model BiLSTM dengan fitur sudut sendi dan koordinat ternormalisasi pada sliding window, yang dilaporkan Riccio (2024) [VERIFIKASI SITASI] mencapai akurasi tinggi untuk squat dan push-up. Untuk MVP demo, state machine berbasis ambang sudut sudah cukup dan jauh lebih sederhana diimplementasikan.

### Baseline kelelahan adaptif (fatigue profiling)
Fitur baru yang menggantikan personalisasi berbasis grade OA:
- Di awal tiap sesi, sistem membangun baseline personal dari 2-3 repetisi pertama pengguna (kecepatan gerakan, rentang gerak/RoM yang dicapai).
- Sepanjang sesi, sistem memantau penurunan kecepatan repetisi (*rep speed decay*), pengurangan RoM dibanding baseline awal, dan variabilitas gerakan.
- Jika terdeteksi tanda kelelahan atau penurunan kualitas gerakan signifikan, sistem menyarankan berhenti atau istirahat, sebagai pencegahan overexertion, mengikuti konsep dari Jain & Kulkarni (2025) [VERIFIKASI SITASI].
- Pendekatan ini menjawab kebutuhan personalisasi tanpa bergantung pada tabel ambang klinis per grade OA yang sumbernya belum bisa kita pertanggungjawabkan.

### Progresi sit-to-stand ke squat
- Sit-to-stand dipakai sebagai tahap 1 karena posisi pergelangan kaki relatif tetap di lantai selama gerakan ini, sehingga lebih stabil diukur pose estimation dibanding gerakan berpindah tempat, dan risiko kehilangan keseimbangan lebih rendah dibanding langsung squat penuh.
- Squat tahap 2 dimulai dari kedalaman dangkal, meningkat bertahap menuju target repetisi yang ditentukan di profil.

### Feedback suara dan visual
- Indikator tiga zona (hijau/kuning/merah) berdasarkan skor kemiripan DTW/NCC terhadap referensi, bukan lagi berdasarkan ambang derajat statis.
- Web Speech API (`SpeechSynthesisUtterance`, `lang: 'id-ID'`) untuk umpan balik suara, cukup untuk demo.
- Mode mandiri menampilkan overlay skeleton referensi di layar sebagai panduan visual tambahan.

### Struktur data sesi

```
ExerciseSession {
  id: string
  userProfileId: string
  startedAt: timestamp
  endedAt: timestamp
  tahap: "sit_to_stand" | "squat"
  repCount: number
  targetRep: number
  avgSimilarityScore: number   // hasil DTW/NCC rata-rata terhadap referensi
  fatigueFlag: boolean         // true jika terdeteksi tanda kelelahan
  warningCount: number
}

ReferenceMovement {
  id: string
  tahap: "sit_to_stand" | "squat"
  kedalamanTarget: string
  angleTimeSeries: number[]   // deret sudut sendi per frame, direkam dari instruktur
}
```

---

## 6. Fitur laporan ke keluarga/pendamping

Sesuai arahan Pak Oji soal pelaporan ke keluarga pengguna:
- Untuk demo: cukup tombol "unduh/bagikan ringkasan sesi" berisi tanggal, jumlah repetisi, skor kemiripan rata-rata, dan indikasi kelelahan jika ada.
- Untuk versi lanjutan: notifikasi otomatis (email/WhatsApp) ke kontak keluarga setelah sesi selesai, terutama jika ada tanda kelelahan atau penyimpangan gerakan signifikan.

---

## 7. Catatan terbuka soal setup kamera (perlu didiskusikan lagi ke Pak Oji)

Pak Oji mengarahkan kamera pada jarak 3 meter, serong 45 derajat, dengan alasan praktis: kalau kamera lurus di depan, MediaPipe kesulitan menangkap sudut lutut saat squat karena satu kaki bisa menutupi kaki lainnya.

Literatur yang sudah kami telusuri memberi gambaran yang sedikit lebih rumit: studi Baldinger dkk. (2025) yang menguji gerakan *lunge* dari empat sudut kamera diagonal menemukan bahwa sudut **depan-diagonal justru menghasilkan deviasi akurasi tertinggi** (sekitar 27%), sementara sudut **belakang** paling akurat (sekitar 13%) karena oklusi paling minim. Studi ini memakai gerakan lunge, bukan squat, jadi pola oklusinya bisa berbeda, tapi ini tetap sinyal bahwa asumsi "serong 45 derajat otomatis lebih baik" belum tentu berlaku sama persis untuk squat.

`[BUTUH VALIDASI]` Rekomendasi konkret: sebelum konfigurasi kamera ini dikunci di kode, uji internal sederhana dengan membandingkan akurasi sudut lutut dari beberapa opsi (depan lurus, depan serong 45 derajat, dan dari belakang/samping) khusus untuk gerakan squat dan sit-to-stand, lalu diskusikan hasilnya dengan Pak Oji sebelum menetapkan konfigurasi final.

---

## 8. Lingkup MVP untuk demo (masih berlaku dari draf sebelumnya)

### Harus ada
- Deteksi pose real-time dari kamera.
- Kalkulasi sudut sendi live saat sit-to-stand dan squat.
- Perbandingan DTW/NCC sederhana terhadap minimal satu gerakan referensi per tahap.
- Penghitung repetisi berbasis state machine sudut.
- Indikator tiga zona dan ringkasan sesi.

### Boleh disederhanakan
- Baseline kelelahan adaptif: untuk demo, cukup tampilkan tren penurunan kecepatan/RoM secara sederhana, tanpa model prediksi kelelahan yang canggih.
- Overlay skeleton referensi: untuk demo, boleh berupa video contoh statis, tidak harus overlay real-time yang presisi.
- Laporan ke keluarga: cukup tombol unduh ringkasan, tidak perlu notifikasi otomatis.

### Taruh di roadmap
- Autentikasi dan manajemen akun multi-user.
- Enkripsi penuh dan kepatuhan regulasi data medis (tetap disebutkan sebagai rencana di paper).
- Model BiLSTM untuk rep counting/fatigue jika arsitektur state machine sederhana dirasa belum cukup akurat setelah diuji.
- Notifikasi otomatis ke keluarga.

---

## 9. Batasan dan hal yang wajib disebutkan di aplikasi

- Aplikasi adalah alat bantu latihan mandiri, bukan alat diagnostik dan bukan pengganti fisioterapis.
- Tidak ditujukan untuk kondisi yang butuh pengawasan klinis langsung (OA berat, pasca operasi yang belum dapat izin bergerak dari dokter).
- Skor kemiripan gerakan dan deteksi kelelahan adalah hasil purwarupa yang belum divalidasi klinis penuh, sebutkan sebagai "dalam tahap pengembangan" di UI, jangan tampilkan sebagai klaim akurasi pasti sebelum benar-benar diuji.

---

## 10. Checklist yang masih perlu tim lengkapi

1. Rekam data gerakan referensi (golden data) dari instruktur/fisioterapis mitra untuk sit-to-stand dan squat bertahap.
2. Uji internal perbandingan akurasi beberapa posisi kamera untuk squat dan sit-to-stand, sebelum mengunci konfigurasi 45 derajat (bagian 7).
3. Verifikasi detail bibliografi (volume/halaman/DOI) untuk sitasi yang masih ditandai `[VERIFIKASI SITASI]` sebelum masuk paper final.
4. Tentukan jumlah minimal repetisi referensi yang perlu direkam per gerakan untuk generalisasi yang wajar (bagian 3).
5. Salinan teks informed consent untuk perekaman data referensi dan data sesi pengguna (belum wajib untuk demo internal, tapi perlu disiapkan untuk versi lanjutan).

---

## Riwayat perubahan

- **v2 (saat ini):** mengganti adaptive thresholding berbasis tabel grade OA dengan pendekatan golden-reference (DTW+NCC) dan baseline kelelahan adaptif, mengikuti arahan Pak Oji dan literatur terverifikasi (Ullah dkk. 2025, Baldinger dkk. 2025, Pratapneni dkk. 2026, Michaels dkk. 2026). Menambahkan progresi sit-to-stand ke squat, field profil berbasis kapabilitas fungsional, fitur laporan keluarga, dan catatan terbuka soal validasi sudut kamera.
- **v1:** versi awal dengan adaptive thresholding berbasis tabel ambang grade OA (tabel `[BUTUH VALIDASI]` yang sumbernya tidak pernah ditemukan).