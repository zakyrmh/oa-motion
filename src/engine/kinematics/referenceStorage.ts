import type { MovementType, ReferenceMovement } from '@/types/kinematics';
import { STORAGE_KEYS } from '@/constants/storageKeys';

const DATABASE_NAME = 'oa_motion_reference_database';
const STORE_NAME = 'reference_movements';

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DATABASE_NAME, 1);
    request.onupgradeneeded = () => {
      request.result.createObjectStore(STORE_NAME, { keyPath: 'type' });
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export function getSavedReferenceMovement(type: MovementType): ReferenceMovement | null {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.REFERENCE_MOVEMENTS);
    if (!saved) return null;
    const movements = JSON.parse(saved) as Partial<Record<MovementType, ReferenceMovement>>;
    const movement = movements[type];
    return movement?.angleTimeSeries?.length ? movement : null;
  } catch {
    return null;
  }
}

export async function saveReferenceMovement(movement: ReferenceMovement): Promise<void> {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.REFERENCE_MOVEMENTS);
    const movements = saved
      ? JSON.parse(saved) as Partial<Record<MovementType, ReferenceMovement>>
      : {};
    movements[movement.type] = movement;
    localStorage.setItem(STORAGE_KEYS.REFERENCE_MOVEMENTS, JSON.stringify(movements));
    await persistReferenceMovement(movement);
  } catch {
    throw new Error('Data referensi tidak dapat disimpan di perangkat ini.');
  }
}

export async function persistReferenceMovement(movement: ReferenceMovement): Promise<void> {
  const database = await openDatabase();
  await new Promise<void>((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, 'readwrite');
    transaction.objectStore(STORE_NAME).put(movement);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
  database.close();
}

export async function hydrateReferenceMovements(): Promise<void> {
  const database = await openDatabase();
  const movements = await new Promise<ReferenceMovement[]>((resolve, reject) => {
    const request = database.transaction(STORE_NAME, 'readonly').objectStore(STORE_NAME).getAll();
    request.onsuccess = () => resolve(request.result as ReferenceMovement[]);
    request.onerror = () => reject(request.error);
  });
  database.close();
  if (movements.length) {
    localStorage.setItem(
      STORAGE_KEYS.REFERENCE_MOVEMENTS,
      JSON.stringify(Object.fromEntries(movements.map((movement) => [movement.type, movement])))
    );
  }
}