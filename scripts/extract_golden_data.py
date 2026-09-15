#!/usr/bin/env python3
"""
OA-Motion — Golden Data Extractor from Physiotherapy Video (.mp4 / webcam)
Samsung Solve for Tomorrow (SFT) 2026 - Tim SPEKTRA (Politeknik Negeri Padang)

Usage:
  python scripts/extract_golden_data.py --video path/to/fisioterapis_squat.mp4 --type squat --name "Squat Fisioterapi Ahli"
  python scripts/extract_golden_data.py --webcam 0 --type squat
"""

import argparse
import json
import math
import os
import sys

try:
    import cv2
    import numpy as np
except ImportError:
    print("Error: OpenCV (cv2) atau numpy belum terinstall.")
    print("Silakan jalankan: pip install opencv-python mediapipe numpy")
    sys.exit(1)

try:
    import mediapipe as mp
except ImportError:
    print("Error: Google MediaPipe belum terinstall.")
    print("Silakan jalankan: pip install mediapipe")
    sys.exit(1)


def calculate_angle_2d(p1, p2, p3):
    """
    Menghitung sudut fleksi lutut (180 - interior angle) dari tiga titik (P1=Hip, P2=Knee, P3=Ankle).
    Hasil 0° = Kaki lurus sempurna, 90° = Siku-siku, membesar seiring menekuk.
    """
    v1 = np.array([p1[0] - p2[0], p1[1] - p2[1]])
    v2 = np.array([p3[0] - p2[0], p3[1] - p2[1]])
    
    mag1 = np.linalg.norm(v1)
    mag2 = np.linalg.norm(v2)
    if mag1 == 0 or mag2 == 0:
        return 0.0
    
    cos_theta = np.dot(v1, v2) / (mag1 * mag2)
    cos_theta = np.clip(cos_theta, -1.0, 1.0)
    interior_angle = math.degrees(math.acos(cos_theta))
    flexion_angle = 180.0 - interior_angle
    return max(0.0, min(180.0, flexion_angle))


def extract_video_motion(video_source, movement_type='squat', name="Gerakan Referensi Fisioterapi", output_json=None):
    mp_pose = mp.solutions.pose
    pose = mp_pose.Pose(
        static_image_mode=False,
        model_complexity=2,
        smooth_landmarks=True,
        min_detection_confidence=0.6,
        min_tracking_confidence=0.6
    )

    cap = cv2.VideoCapture(int(video_source) if str(video_source).isdigit() else video_source)
    if not cap.isOpened():
        print(f"Gagal membuka sumber video: {video_source}")
        return

    fps = cap.get(cv2.CAP_PROP_FPS)
    if fps <= 0 or math.isnan(fps):
        fps = 30.0

    raw_angles = []
    timestamps = []
    frame_idx = 0

    print(f"[*] Mulai memproses video (FPS: {fps:.1f})...")

    while cap.isOpened():
        ret, frame = cap.read()
        if not ret:
            break

        h, w, _ = frame.shape
        rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        results = pose.process(rgb_frame)

        if results.pose_landmarks:
            landmarks = results.pose_landmarks.landmark
            # Deteksi sisi kiri (23, 25, 27) & kanan (24, 26, 28)
            left_hip = (landmarks[23].x * w, landmarks[23].y * h)
            left_knee = (landmarks[25].x * w, landmarks[25].y * h)
            left_ankle = (landmarks[27].x * w, landmarks[27].y * h)
            
            angle_left = calculate_angle_2d(left_hip, left_knee, left_ankle)
            raw_angles.append(round(angle_left, 1))
            timestamps.append(frame_idx / fps)
        
        frame_idx += 1

    cap.release()
    pose.close()

    if len(raw_angles) < 20:
        print("[!] Terlalu sedikit frame valid yang terdeteksi.")
        return

    # Cari puncak fleksi (peak flexion)
    peak_val = max(raw_angles) if movement_type == 'squat' else min(raw_angles)
    peak_idx = raw_angles.index(peak_val)

    reference_data = {
        "id": f"ref_{movement_type}_expert_{int(timestamps[-1] * 1000)}",
        "type": movement_type,
        "name": name,
        "description": f"Golden data fisioterapi diekstrak otomatis dari video sumber ({len(raw_angles)} frame).",
        "samplingRateHz": round(fps, 1),
        "totalDurationSeconds": round(len(raw_angles) / fps, 2),
        "angleTimeSeries": raw_angles,
        "keyPhaseIndices": {
            "flexionStart": 0,
            "peakFlexion": peak_idx,
            "extensionComplete": len(raw_angles) - 1
        }
    }

    if not output_json:
        output_json = f"src/constants/golden_{movement_type}_extracted.json"

    with open(output_json, 'w', encoding='utf-8') as f:
        json.dump(reference_data, f, indent=2, ensure_ascii=False)

    print(f"\n[✓] Berhasil mengekstrak {len(raw_angles)} frame data!")
    print(f"[✓] File tersimpan di: {output_json}")
    print(f"[✓] Puncak fleksi: {peak_val}° pada frame {peak_idx}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Ekstraksi Golden Data dari Video Fisioterapi (OA-Motion)")
    parser.add_argument("--video", type=str, default="0", help="Path file video (.mp4) atau index webcam (0)")
    parser.add_argument("--type", type=str, choices=["squat", "sit_to_stand"], default="squat", help="Tipe gerakan")
    parser.add_argument("--name", type=str, default="Squat Fisioterapi Ahli", help="Nama deskriptif gerakan")
    parser.add_argument("--output", type=str, default=None, help="Path output file JSON")
    args = parser.parse_args()

    extract_video_motion(args.video, args.type, args.name, args.output)
