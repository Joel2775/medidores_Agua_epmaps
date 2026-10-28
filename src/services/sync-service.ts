import { config, getReadingsUrl } from '@/constants/config';
import { getPendingReadings, setReadingStatus } from '@/services/database';

let isSyncing = false;

async function readingAlreadyExists(readingId: string) {
  try {
    const response = await fetch(`${getReadingsUrl()}?clientId=${encodeURIComponent(readingId)}`);

    if (response.status === 404) {
      return false;
    }

    if (!response.ok) {
      throw new Error(`No se pudo comprobar la sincronización de la lectura (${response.status}).`);
    }

    const payload: unknown = await response.json();
    let items: unknown[] = [];

    if (Array.isArray(payload)) {
      items = payload;
    } else if (payload && typeof payload === 'object') {
      const obj = payload as Record<string, unknown>;
      if (Array.isArray(obj.value)) {
        items = obj.value;
      } else if (Array.isArray(obj.data)) {
        items = obj.data;
      } else if (Array.isArray(obj.items)) {
        items = obj.items;
      } else {
        items = [payload];
      }
    }

    return items.some(
      (item) =>
        typeof item === 'object' &&
        item !== null &&
        (('clientId' in item && (item as Record<string, unknown>).clientId === readingId) ||
          ('id' in item && (item as Record<string, unknown>).id === readingId))
    );
  } catch (error) {
    throw error;
  }
}

export async function syncPendingReadings() {
  if (config.demoMode) {
    return 0;
  }

  if (isSyncing) {
    return 0;
  }

  isSyncing = true;

  try {
    const pending = await getPendingReadings();
    let synced = 0;
    let hadError = false;
    let lastError: unknown = null;

    for (const reading of pending) {
      await setReadingStatus(reading.id, 'syncing');

      try {
        const exists = await readingAlreadyExists(reading.id);
        if (!exists) {
          const response = await fetch(getReadingsUrl(), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...reading, clientId: reading.id }),
          });

          if (!response.ok) {
            throw new Error(`MockAPI rechazó la lectura ${reading.meterCode} (${response.status}).`);
          }
        }

        await setReadingStatus(reading.id, 'synced');
        synced += 1;
      } catch (error) {
        hadError = true;
        lastError = error;
        await setReadingStatus(reading.id, 'pending_sync');
      }
    }

    if (hadError && lastError) {
      throw lastError instanceof Error ? lastError : new Error('Error al sincronizar lecturas pendientes.');
    }

    return synced;
  } finally {
    isSyncing = false;
  }
}
