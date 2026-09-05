import type { Point2D, ParallaxVerification } from '@/types/kinematics';

/**
 * Checks whether the user is facing perpendicular (side profile) to the camera
 * to avoid 2D parallax distortion during sagittal knee flexion assessment.
 *
 * In a true lateral (side) view, the horizontal distance between left and right
 * shoulders/hips is minimal compared to the torso height.
 */
export function verifySideProfileAlignment(
  leftShoulder: Point2D,
  rightShoulder: Point2D,
  leftHip: Point2D,
  rightHip: Point2D
): ParallaxVerification {
  const shoulderDeltaX = Math.abs(leftShoulder.x - rightShoulder.x);
  const hipDeltaX = Math.abs(leftHip.x - rightHip.x);

  // Approximate torso height
  const avgShoulderY = (leftShoulder.y + rightShoulder.y) / 2;
  const avgHipY = (leftHip.y + rightHip.y) / 2;
  const torsoHeight = Math.abs(avgHipY - avgShoulderY);

  if (torsoHeight === 0) {
    return {
      isPerpendicular: false,
      shoulderWidthRatio: 1,
      hipWidthRatio: 1,
      message: 'Tubuh tidak terdeteksi dengan jelas.',
    };
  }

  const shoulderRatio = shoulderDeltaX / torsoHeight;
  const hipRatio = hipDeltaX / torsoHeight;

  // In side profile, shoulderRatio and hipRatio should typically be < 0.35
  const isPerpendicular = shoulderRatio <= 0.4 && hipRatio <= 0.35;

  return {
    isPerpendicular,
    shoulderWidthRatio: Math.round(shoulderRatio * 100) / 100,
    hipWidthRatio: Math.round(hipRatio * 100) / 100,
    message: isPerpendicular
      ? 'Posisi tampak samping sudah optimal.'
      : 'Harap putar tubuh tegak lurus menghadap samping kamera.',
  };
}
