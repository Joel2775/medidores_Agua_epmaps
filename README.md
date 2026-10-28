# medidoresAgua

Aplicación móvil de registro de lecturas de medidores de agua para técnicos de campo. Está construida con Expo SDK 57, React Native y TypeScript.

## Inicio rápido

```bash
npm install
npx expo start
```

La app inicia en modo de demostración (`EXPO_PUBLIC_DEMO_MODE=true`): usa tres medidores locales de ejemplo, no realiza llamadas a MockAPI y guarda lecturas y borradores en el dispositivo.

## Configuración de MockAPI

La URL base y las rutas se configuran en `.env`; el archivo local no debe subirse al repositorio. Usa `.env.example` como referencia:

```env
EXPO_PUBLIC_API_URL=https://YOUR_PROJECT_ID.mockapi.io
EXPO_PUBLIC_DEMO_MODE=false
EXPO_PUBLIC_METERS_RESOURCE=meters
EXPO_PUBLIC_READINGS_RESOURCE=readings
```

Crea los recursos `meters` y `readings` en MockAPI con estos campos:

- `meters`: `code` (`MED-` y seis dígitos), `accountNumber`, `address`, `sector`, `condition` (`normal`, `inaccesible` o `dañado`), `lastReading`, `lastReadingDate` y `averageMonthlyConsumption`.
- `readings`: el servicio crea las lecturas con `clientId`, `meterId`, `meterCode`, `readingValue`, `condition`, `reasonOrDamageDescription`, `photoUri`, `isAnomalous`, `status`, `createdAt` y `monthYear`. `clientId` se usa para comprobar reintentos de sincronización.

Al consultar se usa `GET /<recurso-medidores>?code=MED-000001`. La sincronización consulta `GET /<recurso-lecturas>?clientId=<id>` antes de crear un registro con `POST /<recurso-lecturas>`. Si MockAPI devuelve un esquema diferente, la app informa el error en vez de aceptar datos incompletos.

Las variables `EXPO_PUBLIC_*` se incorporan al bundle de la aplicación y no son secretas. No pongas contraseñas, tokens ni claves privadas en ellas. El acceso de técnico que viene con esta entrega es únicamente de demostración y no autentica contra un servidor. Las fotografías se conservan en el almacenamiento permanente del dispositivo; MockAPI no recibe ni aloja el archivo de imagen.

La compilación web de SQLite requiere compatibilidad con WASM y que el servidor de despliegue use las cabeceras `Cross-Origin-Embedder-Policy: credentialless` y `Cross-Origin-Opener-Policy: same-origin`, incluidas en la configuración de Expo Router.

## Funcionalidad

- Validación estricta del código de medidor antes de habilitar una consulta.
- Caché de medidores con TanStack Query.
- Registro en SQLite con prevención de duplicados por medidor y mes.
- Borradores persistidos y opción para continuar o descartar la captura pendiente.
- Validaciones según estado, advertencia y confirmación de consumo anómalo, y evidencia fotográfica cuando es obligatoria.
- Banner global de conectividad, estado de sincronización y edición únicamente de lecturas no sincronizadas.

En modo real, al recuperar la conexión se sincronizan los registros locales con MockAPI. La clave de idempotencia `clientId` permite comprobar si una lectura ya fue creada antes de reintentar.
