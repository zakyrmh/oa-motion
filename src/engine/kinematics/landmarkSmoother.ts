import type { Point2D, Point3D } from '@/types/kinematics';

const MIN_VISIBILITY = 0.6;
const MIN_PRESENCE = 0.5;

type Landmark = Point2D | Point3D;

function isConfident(landmark: Landmark): boolean {
  return (landmark.visibility ?? 1) >= MIN_VISIBILITY
    && (landmark.presence ?? 1) >= MIN_PRESENCE;
}

function blend(previous: Landmark | undefined, current: Landmark, alpha: number): Landmark {
  if (!previous) return { ...current };
  const next = {
    ...current,
    x: previous.x + alpha * (current.x - previous.x),
    y: previous.y + alpha * (current.y - previous.y),
  };
  if ('z' in current && 'z' in previous) {
    return {
      ...next,
      z: previous.z + alpha * (current.z - previous.z),
    } as Point3D;
  }
  return next;
}

export class LandmarkSmoother {
  private previousImage: Point2D[] = [];
  private previousWorld: Point3D[] = [];
  private readonly alpha: number;

  constructor(alpha = 0.35) {
    this.alpha = alpha;
  }

  public filter(
    imageLandmarks: Point2D[],
    worldLandmarks: Point3D[],
    requiredIndices: number[]
  ): { imageLandmarks: Point2D[]; worldLandmarks: Point3D[] } | null {
    if (imageLandmarks.length < 33 || worldLandmarks.length < 33) return null;

    const requiredLandmarks = requiredIndices.map((index) => ({
      image: imageLandmarks[index],
      world: worldLandmarks[index],
    }));
    if (requiredLandmarks.some(({ image, world }) => !image || !world || !isConfident(image) || !isConfident(world))) {
      return null;
    }

    const smoothedImage = imageLandmarks.map((landmark, index) => {
      if (!isConfident(landmark) && this.previousImage[index]) return this.previousImage[index];
      return blend(this.previousImage[index], landmark, this.alpha) as Point2D;
    });
    const smoothedWorld = worldLandmarks.map((landmark, index) => {
      if (!isConfident(landmark) && this.previousWorld[index]) return this.previousWorld[index];
      return blend(this.previousWorld[index], landmark, this.alpha) as Point3D;
    });
    this.previousImage = smoothedImage;
    this.previousWorld = smoothedWorld;

    return { imageLandmarks: smoothedImage, worldLandmarks: smoothedWorld };
  }

  public reset(): void {
    this.previousImage = [];
    this.previousWorld = [];
  }
}