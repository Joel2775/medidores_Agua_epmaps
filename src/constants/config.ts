const apiUrl = process.env.EXPO_PUBLIC_API_URL?.trim().replace(/\/+$/, '');
const demoMode = process.env.EXPO_PUBLIC_DEMO_MODE !== 'false';

export const config = {
  apiUrl,
  demoMode,
  metersResource: process.env.EXPO_PUBLIC_METERS_RESOURCE?.trim() || 'meters',
  readingsResource: process.env.EXPO_PUBLIC_READINGS_RESOURCE?.trim() || 'readings',
  queryStaleTime: Infinity,
  queryGcTime: 24 * 60 * 60 * 1000,
} as const;

export function getApiResourceUrl(resource: string) {
  if (!config.apiUrl) {
    throw new Error('Configura EXPO_PUBLIC_API_URL en el archivo .env para conectar MockAPI.');
  }

  return `${config.apiUrl}/${resource.replace(/^\/+|\/+$/g, '')}`;
}

export function getMetersUrl() {
  return getApiResourceUrl(config.metersResource);
}

export function getReadingsUrl() {
  return getApiResourceUrl(config.readingsResource);
}
