import { z } from 'zod';

import { getMetersUrl } from '@/constants/config';
import type { WaterMeter } from '@/types';

export const meterCodeSchema = z.string().regex(/^MED-\d{6}$/, 'Ingresa un código con formato MED-000000.');

const meterSchema = z.object({
  id: z
    .union([z.string(), z.number()])
    .optional()
    .transform((val) => {
      if (val === undefined || val === null || val === '') {
        return `mock-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      }
      return String(val);
    }),
  code: meterCodeSchema,
  accountNumber: z.union([z.string(), z.number()]).transform(String),
  address: z.string(),
  sector: z.string(),
  condition: z
    .preprocess((val) => {
      if (typeof val !== 'string') return val;
      return String(val).trim().toLowerCase();
    }, z.enum(['normal', 'inaccesible', 'dañado']))
    .catch('normal'),
  lastReading: z.coerce.number(),
  lastReadingDate: z.string(),
  averageMonthlyConsumption: z.coerce.number(),
});

export async function getMeterByCode(code: string): Promise<WaterMeter> {
  const parsedCode = meterCodeSchema.safeParse(code);
  if (!parsedCode.success) {
    throw new Error(parsedCode.error.issues[0]?.message ?? 'El código del medidor no es válido.');
  }

  const response = await fetch(`${getMetersUrl()}?code=${encodeURIComponent(code)}`);
  if (!response.ok) {
    throw new Error(`MockAPI no pudo consultar el medidor (${response.status}).`);
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

  const matchingMeter = items.find(
    (item) => typeof item === 'object' && item !== null && 'code' in item && (item as Record<string, unknown>).code === code
  );
  const result = meterSchema.safeParse(matchingMeter);

  if (!result.success) {
    throw new Error(
      matchingMeter
        ? 'El medidor recibido no coincide con el esquema configurado.'
        : 'No encontramos ese código en MockAPI.'
    );
  }

  return result.data;
}
