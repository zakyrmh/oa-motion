import os
import sys
import cv2
import numpy as np
import time
import pandas as pd
from ultralytics import YOLO
import pyqtgraph as pg
import matplotlib.pyplot as plt
from matplotlib.gridspec import GridSpec
from scipy.signal import find_peaks

from PyQt6.QtWidgets import (
    QApplication,
    QMainWindow,
    QWidget,
    QVBoxLayout,
    QHBoxLayout,
    QLabel,
    QPushButton,
    QGroupBox,
    QMessageBox,
)
from PyQt6.QtGui import QImage, QPixmap, QFont
from PyQt6.QtCore import QThread, pyqtSignal, Qt, pyqtSlot

# =====================================
# APPLICATION CONFIGURATION
# =====================================

DEFAULT_REPS = 8
BUTTON_TEXT = f"Start Recording " f"({DEFAULT_REPS} Reps)"

HEADER_TEXT = "Real-Time Squat Analysis " "& Temporal Data Logger"

# --- KONFIGURASI ---
MODEL_NAME = "yolov8n-pose.pt"
CAMERA_INDEX = 0
FPS_ASSUMPTION = 30.0  # Asumsi kecepatan standar webcam (Frames per Second)


# --- FUNGSI MATEMATIKA TERAPAN ---
def calculate_angle_vector(a, b, c):
    a = np.array(a)
    b = np.array(b)
    c = np.array(c)

    ba = a - b
    bc = c - b

    cosine_angle = np.dot(ba, bc) / (np.linalg.norm(ba) * np.linalg.norm(bc))
    angle = np.arccos(np.clip(cosine_angle, -1.0, 1.0))

    return np.degrees(angle)


# --- WORKER THREAD ---
class CameraWorker(QThread):
    change_pixmap_signal = pyqtSignal(np.ndarray)
    keypoint_signal = pyqtSignal(object, object)

    def __init__(self, model):
        super().__init__()
        self.model = model
        self.is_running = True

    def run(self):
        cap = cv2.VideoCapture(CAMERA_INDEX)
        cap.set(cv2.CAP_PROP_FRAME_WIDTH, 640)
        cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 480)

        while self.is_running:
            ret, frame = cap.read()
            if ret:
                results = self.model(frame, verbose=False, conf=0.5)
                vis_frame = frame.copy()

                kpts = None
                confs = None

                if len(results[0].keypoints) > 0:
                    vis_frame = results[0].plot()
                    kpts = results[0].keypoints.xy.cpu().numpy()[0]
                    confs = results[0].keypoints.conf.cpu().numpy()[0]

                self.keypoint_signal.emit(kpts, confs)

                rgb_image = cv2.cvtColor(vis_frame, cv2.COLOR_BGR2RGB)
                self.change_pixmap_signal.emit(rgb_image)

            time.sleep(0.01)
        cap.release()

    def stop(self):
        self.is_running = False
        self.wait()


# --- MAIN WINDOW ---
class MocapApp(QMainWindow):
    def __init__(self):
        super().__init__()
        self.setWindowTitle("Biomekanika Monocular - Squat Analysis, Temporal & Export")
        self.setGeometry(100, 100, 1050, 600)
        self.setStyleSheet("background-color: #1e1e1e; color: white;")

        self.model = YOLO(MODEL_NAME)
        self.worker = None

        self.data_buffer = np.zeros(100)
        self.prev_angle = 180
        self.alpha = 0.2

        self.is_recording = False
        self.is_countdown = False

        self.recorded_angles = []
        self.recorded_frames = []
        self.current_frame = None

        self.target_reps = DEFAULT_REPS
        self.current_reps = 0

        self.squat_state = "STANDING"

        self.init_ui()

    def init_ui(self):
        main_widget = QWidget()
        self.setCentralWidget(main_widget)
        main_layout = QVBoxLayout()
        main_widget.setLayout(main_layout)

        header = QLabel(HEADER_TEXT)
        header.setFont(QFont("Arial", 18, QFont.Weight.Bold))
        header.setAlignment(Qt.AlignmentFlag.AlignCenter)
        header.setStyleSheet("color: #00e676;")
        main_layout.addWidget(header)

        content_layout = QHBoxLayout()

        # 1. Video Feed
        video_group = QGroupBox("Monocular Webcam Feed")
        video_layout = QVBoxLayout()
        video_group.setLayout(video_layout)

        self.video_label = QLabel("Kamera")
        self.video_label.setMinimumSize(640, 480)
        self.video_label.setStyleSheet(
            "background-color: black; border: 2px solid #444;"
        )
        self.video_label.setAlignment(Qt.AlignmentFlag.AlignCenter)
        video_layout.addWidget(self.video_label)

        content_layout.addWidget(video_group, stretch=2)

        # 2. Grafik Sudut
        graph_group = QGroupBox("Right Knee Flexion (Degrees)")
        graph_layout = QVBoxLayout()
        graph_group.setLayout(graph_layout)

        self.plot_widget = pg.PlotWidget()
        self.plot_widget.setBackground("#121212")
        self.plot_widget.setYRange(50, 190)
        self.plot_widget.setLabel("left", "Sudut Lutut (°)", color="white")
        self.plot_widget.showGrid(x=True, y=True, alpha=0.3)
        self.curve = self.plot_widget.plot(
            self.data_buffer, pen=pg.mkPen("#00e5ff", width=3)
        )

        graph_layout.addWidget(self.plot_widget)

        self.val_label = QLabel("180°")
        self.val_label.setFont(QFont("Arial", 48, QFont.Weight.Bold))
        self.val_label.setAlignment(Qt.AlignmentFlag.AlignCenter)
        self.val_label.setStyleSheet("color: #00e5ff;")
        graph_layout.addWidget(self.val_label)

        content_layout.addWidget(graph_group, stretch=1)
        main_layout.addLayout(content_layout)

        # BUTTONS
        btn_layout = QHBoxLayout()
        self.btn_start = QPushButton("Start Camera")
        self.btn_start.setStyleSheet(
            "background-color: #2962ff; padding: 15px; font-weight: bold; font-size: 14px;"
        )
        self.btn_start.clicked.connect(self.start_system)

        self.btn_record = QPushButton(BUTTON_TEXT)
        self.btn_record.setStyleSheet(
            "background-color: #00c853; padding: 15px; font-weight: bold; font-size: 14px;"
        )
        self.btn_record.clicked.connect(self.toggle_record)
        self.btn_record.setEnabled(False)

        self.btn_stop = QPushButton("Exit System")
        self.btn_stop.setStyleSheet(
            "background-color: #d50000; padding: 15px; font-weight: bold; font-size: 14px;"
        )
        self.btn_stop.clicked.connect(self.close)

        btn_layout.addWidget(self.btn_start)
        btn_layout.addWidget(self.btn_record)
        btn_layout.addWidget(self.btn_stop)
        main_layout.addLayout(btn_layout)

    def stop_recording_countdown(self):
        if not self.is_recording:
            return

        self.is_recording = False

        for i in range(3, 0, -1):
            QApplication.processEvents()

            self.val_label.setText(f"{self.target_reps} REPS DONE\nSTOP IN {i}")

            QApplication.processEvents()
            time.sleep(1)

        self.btn_record.setText(BUTTON_TEXT)

        self.btn_record.setEnabled(True)

        self.generate_report_and_csv()

        self.current_reps = 0
        self.squat_state = "STANDING"

    def start_system(self):
        self.btn_start.setEnabled(False)
        self.btn_record.setEnabled(True)
        self.worker = CameraWorker(self.model)
        self.worker.change_pixmap_signal.connect(self.update_image)
        self.worker.keypoint_signal.connect(self.update_data)
        self.worker.start()

    def start_recording_countdown(self):

        self.is_countdown = True

        for i in range(5, 0, -1):
            self.val_label.setText(f"START\n{i}")
            QApplication.processEvents()
            time.sleep(1)

        self.val_label.setText("GO!")

        self.is_recording = True

        self.val_label.setText(f"0/{self.target_reps}")

        self.current_reps = 0
        self.squat_state = "STANDING"

        self.recorded_angles = []
        self.recorded_frames = []

        self.btn_record.setText("Recording...")
        self.btn_record.setEnabled(False)

        self.is_countdown = False

    def toggle_record(self):
        if not self.is_recording:
            self.start_recording_countdown()

    @pyqtSlot(np.ndarray)
    def update_image(self, cv_img):
        self.current_frame = cv_img.copy()
        h, w, ch = cv_img.shape
        bytes_per_line = ch * w
        qt_img = QImage(cv_img.data, w, h, bytes_per_line, QImage.Format.Format_RGB888)
        self.video_label.setPixmap(
            QPixmap.fromImage(qt_img).scaled(
                self.video_label.width(),
                self.video_label.height(),
                Qt.AspectRatioMode.KeepAspectRatio,
            )
        )

    @pyqtSlot(object, object)
    def update_data(self, kpts, confs):

        IDX_HIP = 12
        IDX_KNEE = 14
        IDX_ANKLE = 16

        if kpts is not None and confs is not None:

            if (
                confs[IDX_HIP] > 0.5
                and confs[IDX_KNEE] > 0.5
                and confs[IDX_ANKLE] > 0.5
            ):

                p_hip = kpts[IDX_HIP]
                p_knee = kpts[IDX_KNEE]
                p_ankle = kpts[IDX_ANKLE]

                raw_angle = calculate_angle_vector(p_hip, p_knee, p_ankle)

                smooth_angle = (self.alpha * raw_angle) + (
                    (1 - self.alpha) * self.prev_angle
                )

                self.prev_angle = smooth_angle

                print(
                    f"Angle={smooth_angle:.1f} | "
                    f"State={self.squat_state} | "
                    f"Reps={self.current_reps}"
                )

                # ==================================
                # RECORDING
                # ==================================
                if self.is_recording and self.current_frame is not None:

                    self.recorded_angles.append(smooth_angle)

                    self.recorded_frames.append(self.current_frame)

                    angle = smooth_angle

                    # ------------------------------
                    # FSM SQUAT DETECTOR
                    # ------------------------------

                    # STANDING -> DESCENDING
                    if self.squat_state == "STANDING":

                        if angle < 150:
                            self.squat_state = "DESCENDING"

                    # DESCENDING -> BOTTOM
                    elif self.squat_state == "DESCENDING":

                        if angle < 120:
                            self.squat_state = "BOTTOM"

                    # BOTTOM -> ASCENDING
                    elif self.squat_state == "BOTTOM":

                        if angle > 130:
                            self.squat_state = "ASCENDING"

                    # ASCENDING -> STANDING
                    elif self.squat_state == "ASCENDING":

                        if angle > 165:

                            self.current_reps += 1

                            print(f"REPETITION DETECTED = " f"{self.current_reps}")

                            self.val_label.setText(
                                f"REP {self.current_reps}/" f"{self.target_reps}"
                            )

                            self.squat_state = "STANDING"

                            if self.current_reps >= self.target_reps:

                                print(
                                    f"AUTO STOP RECORDING "
                                    f"({self.target_reps} REPS COMPLETED)"
                                )

                                self.stop_recording_countdown()

                                return

                # ==================================
                # UPDATE GRAPH
                # ==================================
                self.data_buffer[:-1] = self.data_buffer[1:]

                self.data_buffer[-1] = smooth_angle

                self.curve.setData(self.data_buffer)

                if not self.is_recording:

                    self.val_label.setText(f"{int(smooth_angle)}°")

    def generate_report_and_csv(self):

        os.makedirs("data", exist_ok=True)
        os.makedirs("results", exist_ok=True)

        if len(self.recorded_angles) < 50:
            QMessageBox.warning(self, "Peringatan", "Durasi rekaman terlalu singkat.")
            return

        angles = np.array(self.recorded_angles)
        timestamp_str = str(int(time.time()))

        # 1. Analisis Sinyal Kinematik (Cari Puncak & Lembah)
        valleys, _ = find_peaks(-angles, prominence=40, distance=30)
        peaks, _ = find_peaks(angles, prominence=30, distance=30)

        rep_count = len(valleys)
        if rep_count == 0:
            QMessageBox.warning(
                self, "Peringatan", "Tidak ada gerakan squat yang terdeteksi."
            )
            return

        # ==========================================
        # ANALISIS TEMPORAL & KECEPATAN (EKSTENTRIK VS KONSENTRIK)
        # ==========================================
        phase_labels = ["Tidak Terdefinisi/Jeda"] * len(angles)

        eccentric_times = []  # Waktu Turun
        concentric_times = []  # Waktu Naik
        eccentric_vels = []  # Kecepatan Turun (derajat/detik)
        concentric_vels = []  # Kecepatan Naik (derajat/detik)

        for v in valleys:
            phase_labels[v] = "Deep Flexion (Bottom)"

            # Analisis Fase Eksentrik (Turun)
            peaks_before = peaks[peaks < v]
            if len(peaks_before) > 0:
                p_start = peaks_before[-1]
                for i in range(p_start + 1, v):
                    phase_labels[i] = "Fase Turun (Eccentric)"

                time_sec = (v - p_start) / FPS_ASSUMPTION
                eccentric_times.append(time_sec)

                d_theta = angles[p_start] - angles[v]
                eccentric_vels.append(d_theta / time_sec if time_sec > 0 else 0)

            # Analisis Fase Konsentrik (Naik)
            peaks_after = peaks[peaks > v]
            if len(peaks_after) > 0:
                p_end = peaks_after[0]
                for i in range(v + 1, p_end):
                    phase_labels[i] = "Fase Naik (Concentric)"

                time_sec = (p_end - v) / FPS_ASSUMPTION
                concentric_times.append(time_sec)

                d_theta = angles[p_end] - angles[v]
                concentric_vels.append(d_theta / time_sec if time_sec > 0 else 0)

        for p in peaks:
            phase_labels[p] = "Standing Extension (Top)"

        # ==========================================
        # BAGIAN A: EXPORT DATA KE SPREADSHEET (CSV)
        # ==========================================
        df = pd.DataFrame(
            {
                "Frame": range(len(angles)),
                "Knee_Angle_Degrees": np.round(angles, 2),
                "Movement_Phase": phase_labels,
            }
        )
        csv_filename = os.path.join("data", f"Squat_Data_Temporal_{timestamp_str}.csv")
        df.to_csv(csv_filename, index=False, sep=";")

        # ==========================================
        # BAGIAN B: GENERATE LAPORAN GAMBAR STATISTIK
        # ==========================================
        flexion_angles = angles[valleys]
        standing_angles = angles[peaks]

        avg_flexion = np.mean(flexion_angles)
        avg_standing = np.mean(standing_angles) if len(standing_angles) > 0 else 180.0
        avg_rom = avg_standing - avg_flexion

        # Rata-rata Temporal & Kecepatan
        avg_ecc_time = np.mean(eccentric_times) if eccentric_times else 0.0
        avg_con_time = np.mean(concentric_times) if concentric_times else 0.0
        avg_ecc_vel = np.mean(eccentric_vels) if eccentric_vels else 0.0
        avg_con_vel = np.mean(concentric_vels) if concentric_vels else 0.0

        idx_mid = valleys[0]
        peaks_before = peaks[peaks < idx_mid]
        idx_start = peaks_before[-1] if len(peaks_before) > 0 else 0
        peaks_after = peaks[peaks > idx_mid]
        idx_end = peaks_after[0] if len(peaks_after) > 0 else len(angles) - 1

        img_start = self.recorded_frames[idx_start]
        img_mid = self.recorded_frames[idx_mid]
        img_end = self.recorded_frames[idx_end]

        fig = plt.figure(figsize=(15, 14))
        fig.patch.set_facecolor("#f4f4f4")
        gs = GridSpec(3, 3, figure=fig, height_ratios=[1.2, 1.5, 0.7])

        ax1 = fig.add_subplot(gs[0, 0])
        ax1.imshow(img_start)
        ax1.set_title(
            f"Representative Start\nAngle: {angles[idx_start]:.1f}°", fontweight="bold"
        )
        ax1.axis("off")

        ax2 = fig.add_subplot(gs[0, 1])
        ax2.imshow(img_mid)
        ax2.set_title(
            f"Representative Deep Flexion\nAngle: {angles[idx_mid]:.1f}°",
            fontweight="bold",
            color="red",
        )
        ax2.axis("off")

        ax3 = fig.add_subplot(gs[0, 2])
        ax3.imshow(img_end)
        ax3.set_title(
            f"Representative End\nAngle: {angles[idx_end]:.1f}°", fontweight="bold"
        )
        ax3.axis("off")

        ax_chart = fig.add_subplot(gs[1, :])
        ax_chart.plot(angles, color="#2962ff", linewidth=2.5, label="Knee Trajectory")
        ax_chart.scatter(
            valleys,
            angles[valleys],
            color="red",
            s=100,
            zorder=5,
            label="Deep Flexion Points",
        )
        if len(peaks) > 0:
            ax_chart.scatter(
                peaks,
                angles[peaks],
                color="green",
                s=100,
                zorder=5,
                label="Standing Points",
            )

        ax_chart.set_title(
            "Full Kinematic Trajectory (Multiple Repetitions)",
            fontsize=14,
            fontweight="bold",
        )
        ax_chart.set_ylabel("Knee Angle (Degrees)", fontsize=12)
        ax_chart.set_xlabel("Time (Frames)", fontsize=12)
        ax_chart.grid(True, linestyle=":", alpha=0.7)
        ax_chart.legend()

        ax_stats = fig.add_subplot(gs[2, :])
        ax_stats.axis("off")

        stat_text = (
            "BIOMECHANICAL & TEMPORAL DESCRIPTIVE STATISTICS\n"
            "-----------------------------------------------------------------------\n"
            f"Total Repetitions Detected : {rep_count} Reps\n"
            f"Average Range of Motion    : {avg_rom:.2f}°\n"
            "-----------------------------------------------------------------------\n"
            f"Avg Eccentric (Descent)    : {avg_ecc_time:.2f} seconds | Speed: {avg_ecc_vel:.2f} °/sec\n"
            f"Avg Concentric (Ascent)    : {avg_con_time:.2f} seconds | Speed: {avg_con_vel:.2f} °/sec\n"
        )

        # Validasi Klinis Pelatih
        if avg_ecc_time > avg_con_time:
            stat_text += (
                "\nClinical Eval: EXCELLENT. Descent is properly slower than ascent."
            )
        else:
            stat_text += "\nClinical Eval: POOR. Descent is faster than ascent. Control the eccentric phase!"

        ax_stats.text(
            0.5,
            0.5,
            stat_text,
            ha="center",
            va="center",
            fontsize=13,
            fontfamily="monospace",
            bbox=dict(facecolor="white", alpha=0.9, edgecolor="#1e1e1e", pad=10),
        )

        plt.tight_layout()
        img_filename = os.path.join(
            "results", f"Squat_Temporal_Report_{timestamp_str}.png"
        )
        plt.savefig(img_filename, dpi=150)
        plt.close()

        QMessageBox.information(
            self,
            "Proses Selesai",
            f"Berhasil Menyimpan 2 File:\n\n"
            f"1. Gambar: {img_filename}\n"
            f"2. Data Excel: {csv_filename}",
        )


if __name__ == "__main__":
    app = QApplication(sys.argv)
    window = MocapApp()
    window.show()
    sys.exit(app.exec())
