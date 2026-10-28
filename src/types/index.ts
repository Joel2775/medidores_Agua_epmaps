export type MeterCondition = 'normal' | 'inaccesible' | 'dañado';
export type ReadingStatus =
  | 'pending_verification'
  | 'pending_sync'
  | 'syncing'
  | 'synced';

export type Technician = {
  employeeCode: string;
  name: string;
};

export type WaterMeter = {
  id: string;
  code: string;
  accountNumber: string;
  address: string;
  sector: string;
  condition: MeterCondition;
  lastReading: number;
  lastReadingDate: string;
  averageMonthlyConsumption: number;
};

export type MeterReadingRecord = {
  id: string;
  meterId: string;
  meterCode: string;
  readingValue: number | null;
  condition: MeterCondition;
  reasonOrDamageDescription: string;
  photoUri: string | null;
  isAnomalous: boolean;
  status: ReadingStatus;
  createdAt: string;
  monthYear: string;
};

export type ReadingDraft = {
  meter: WaterMeter;
  condition: MeterCondition;
  readingValue: string;
  reasonOrDamageDescription: string;
  photoUri: string | null;
  anomalyConfirmed: boolean;
};
