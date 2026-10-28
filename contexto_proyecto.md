# Contexto del proyecto: medidoresAgua

## Resumen

- Aplicación: medidoresAgua
- Paquete npm: medidoresaguaia
- Versión: 1.0.0
- Framework: expo ~57.0.31, react 19.2.3, react-native 0.86.3, expo-router ~57.0.29, @tanstack/react-query ^5.105.0, expo-sqlite ~57.0.4, zustand ^5.0.16, zod ^4.6.7

### Comandos
- `npm run start`: `expo start`
- `npm run reset-project`: `node ./scripts/reset-project.js`
- `npm run android`: `expo run:android`
- `npm run ios`: `expo run:ios`
- `npm run web`: `expo start --web`
- `npm run lint`: `expo lint`

### Exclusiones
Se omiten `.env*`, dependencias, archivos de bloqueo, recursos binarios y carpetas generadas (`dist/`, `.expo/`, `android/`, `ios/`).
Los valores de entorno se pueden consultar en `.env.example`; los archivos `.env` locales nunca se exportan.

## Archivos del proyecto

### `.github\SKILLS\proyecto-skill\SKILL.md`

```text
---
name: proyecto-skill
description: Guía y genera paso a paso la arquitectura, reglas de negocio y flujos de la aplicación móvil de EPMAPS en React Native con Expo SDK 57, TypeScript, Glassmorfismo, Zustand, SQLite, TanStack Query y Zod (requisitos R1 a R10).
---

# Generador del Proyecto EPMAPS: Registro de Lecturas de Medidores de Agua

Esta skill automatiza la arquitectura, el diseño visual y la estructuración del código para la aplicación móvil de la empresa de agua potable EPMAPS (Distrito Metropolitano de Quito). Garantiza el cumplimiento total de los 10 requisitos técnicos (R1 a R10), evita penalizaciones por diseño genérico y prepara la argumentación técnica para la defensa oral.

## Cuándo usar
- Cuando el usuario solicite construir, estructurar, diseñar o explicar la solución móvil para la Prueba Técnica de EPMAPS en React Native con Expo SDK 57 y TypeScript.
- Cuando se necesite una guía paso a paso con Glassmorfismo, manejo offline con SQLite, Zustand, TanStack Query y las explicaciones teóricas para la defensa.

---

## Pasos de Ejecución

### 1. Definición del Estilo Visual (Glassmorfismo Anti-Penalización)
- **Diseño Glassmórfico:** Utiliza `expo-blur` (`BlurView`), `expo-linear-gradient` y bordes semitransparentes (`rgba(255,255,255,0.4)`) sobre fondos con gradientes de tonos agua/azul para evitar la penalización de -5 puntos por diseño genérico de IA.
- **Microinteracciones e Indicadores:** Implementa tarjetas de cristal esmerilado con sombras suaves y chips de estado reflectantes (Verde: Normal, Naranja: Inaccesible, Rojo: Dañado).

---

### 2. Capa de Datos y Modelos de Dominio (`src/types/index.ts` & `src/constants/config.ts`)
- **Validación Estricta de Código (R2):** Define la expresión regular `^MED-\d{6}$` utilizando `Zod`. La aplicación no debe realizar peticiones HTTP ni consultas a la API si el código no coincide exactamente con el formato `MED-` seguido de 6 dígitos numéricos.
- **Modelos de Datos:** Configura la estructura TypeScript para `Technician`, `WaterMeter` y `MeterReadingRecord` respetando todos los campos requeridos por la rúbrica (dirección, sector, número de cuenta, estado, última lectura, fecha y consumo promedio mensual).

---

### 3. Autenticación Persistente y Borradores (R1 & R8 - Zustand + AsyncStorage)
- **Gestión de Sesión (R1):** Crea un `authStore` con `zustand` y `@react-native-async-storage/async-storage`. El técnico ingresa con su código de empleado y clave; la sesión se mantiene al reiniciar la app y solo se elimina al presionar "Cerrar Sesión".
- **Captura Ininterrumpida / Recuperación de Borrador (R8):** Implementa un `draftStore` para guardar automáticamente el estado del formulario de lectura a medida que el usuario ingresa datos. Al abrir la app, si existe un proceso cancelado o la app se cerró inesperadamente, se despliega una alerta o modal ofreciendo **Continuar la captura pendiente** (restaurando los campos ingresados) o **Descartarla**.

---

### 4. Caché de Medidores y Modo Offline (R3 & R4 - TanStack Query)
- **Estrategia Offline-First:** Configura `@tanstack/react-query` con un `staleTime` prolongado (ej. `Infinity` durante la jornada) y `gcTime` de 24 horas.
- **Persistencia en Caché (R3):** Al consultar un medidor con red, sus datos se almacenan en caché. Al activar el Modo Avión y consultar el mismo medidor nuevamente, la app muestra los 7 datos guardados sin lanzar error HTTP ni solicitar una nueva descarga.
- **Marca Transitoria Offline (R4):** Cuando se registra una lectura sin conexión a internet, la lectura se guarda localmente y se marca automáticamente con el estado `'pending_verification'`, indicando que se comparará con la lectura anterior en cuanto se recupere la señal.

---

### 5. Base de Datos Local y Registro Físico (R4, R7, R9, R10 - `expo-sqlite` & `expo-file-system`)
- **Esquema de Base de Datos SQLite:** Inicializa una tabla `pending_readings` en `expo-sqlite` que almacene: `meterId`, `readingValue`, `condition` (`normal`, `inaccesible`, `dañado`), `reasonOrDamageDescription`, `photoUri`, `isAnomalous`, `status` (`pending_verification`, `pending_sync`, `synced`), `createdAt` y `monthYear` (`MM-YYYY`).
- **Control Estricto de Duplicidad Mensual (R10):** Antes de guardar, la app ejecuta un `SELECT` en SQLite para verificar que no exista una lectura previa registrada para el mismo `meterId` y `monthYear`.
- **Persistencia de Fotografías (R7):** Al capturar una foto con `expo-image-picker` o `expo-camera`, copia la imagen al directorio local permanente con `expo-file-system` (`FileSystem.documentDirectory`). Esto garantiza que la foto sobreviva al reinicio del dispositivo.

---

### 6. Reglas de Negocio Complejas y Validaciones Dinámicas (R5, R6, R7)
- **Matriz de Estado del Medidor (R5):**
  - **Normal:** Campo `lectura` obligatorio.
  - **Inaccesible:** Campo `motivo` obligatorio. Se deshabilita y bloquea la entrada de lectura.
  - **Dañado:** Campo `descripción del daño` obligatorio. Campo `lectura` opcional.
- **Cálculo de Consumo Anómalo y Advertencia (R6):**
  - Calcula `Consumo = Lectura Actual - Última Lectura`.
  - Si `Consumo > (Consumo Promedio Mensual * 3)`, despliega una advertencia visual destacada (alerta o modal glassmórfico) donde el técnico debe presionar un botón para **confirmar que revisó el medidor de agua**.
- **Reglas de Obligatoriedad de Fotos y Permisos (R7):**
  - La fotografía del medidor se vuelve **OBLIGATORIA** únicamente si:
    1. El consumo es anómalo (supera el triple del promedio R6).
    2. El estado del medidor es `dañado`.
  - En los demás casos (`normal` o `inaccesible`), la foto es **opcional**.
  - Si el usuario deniega el permiso de la cámara, se muestra un modal explicativo ("Se requiere la cámara para respaldar evidencias de lecturas anómalas/dañadas"). Si la foto no es obligatoria para el caso actual, se le permite continuar el proceso sin tomar la foto.

---

### 7. Sincronización Automática e Indicador Global de Red (R9)
- **Monitoreo Global de Conexión (`ConnectionBanner.tsx`):** Un banner visible en todas las pantallas conectado a `@react-native-community/netinfo` y SQLite que muestra en tiempo real:
  - Estado de Red: `🟢 EN LÍNEA` / `🔴 SIN CONEXIÓN (OFFLINE)`.
  - Contador de lecturas pendientes por enviar.
- **Sincronización Automática e Idempotente (R9):**
  - Escucha la transición de offline a online con `NetInfo`.
  - Al recuperar la señal, ejecuta automáticamente un servicio en segundo plano (`syncService.ts`) que recorre las lecturas pendientes de SQLite y las envía a MockAPI.
  - Marca cada registro como `synced` para evitar duplicados en caso de cortes intermitentes durante el envío.
- **Inmutabilidad de Lecturas (R10):** Permite editar o corregir la lectura en el formulario o en la lista local solo mientras su estado sea `pending_verification` o `pending_sync`. Deshabilita la edición en cuanto el estado cambie a `synced`.

---

### 8. Guion de Justificación para la Defensa Oral (4 Puntos)
Prepara las respuestas técnicas clave para la evaluación sin apoyo de IA:
1. **¿Por qué React Query sobre Fetch/Axios directo?** Por la gestión nativa de caché, eliminación de peticiones duplicadas, reintentos automáticos y desacoplamiento del estado de red.
2. **¿Por qué SQLite y no solo AsyncStorage?** AsyncStorage no es adecuado para consultas estructuradas o filtrados por mes/medidor (`monthYear`). SQLite garantiza transacciones ACID e inmutabilidad de los registros locales.
3. **¿Por qué Zustand sobre Redux o Context API?** Zustand consume menos boilerplate, no sufre de re-renders innecesarios en React Native y facilita la persistencia selectiva de la sesión y borradores.

---

## Gotchas y Verificaciones de Seguridad
- **Validación R2 estricta:** Asegúrate de validar la longitud y la expresión regular del código del medidor antes de invocar la consulta de React Query para no realizar peticiones innecesarias a MockAPI.
- **Persistencia de Fotos (R7):** Nunca guardes solo la URI temporal devuelta por la cámara; muévela a `FileSystem.documentDirectory` para evitar que el sistema operativo limpie la memoria caché al reiniciar el teléfono.
- **Prevención de Envíos Duplicados (R9):** Al sincronizar, actualiza de inmediato el flag de la base de datos local a `syncing` o `synced` antes de realizar el siguiente envío para evitar condiciones de carrera (race conditions).
```

### `.gitignore`

```text
# Learn more https://docs.github.com/en/get-started/getting-started-with-git/ignoring-files

# dependencies
node_modules/

# Expo
.expo/
dist/
web-build/
expo-env.d.ts

# Native
.kotlin/
*.orig.*
*.jks
*.p8
*.p12
*.key
*.mobileprovision

# Metro
.metro-health-check*

# debug
npm-debug.*
yarn-debug.*
yarn-error.*

# macOS
.DS_Store
*.pem

# local env files
.env
.env.*
!.env.example
.env*.local

# typescript
*.tsbuildinfo

example

# generated native folders
/ios
/android
```

### `AGENTS.md`

````text
This is an Expo/React Native mobile application. Prioritize mobile-first patterns, performance, and cross-platform compatibility.

## Expo has changed — do not trust your training data

Expo ships breaking changes every SDK release. APIs you remember are likely renamed, moved, or removed. Before writing any code that touches an Expo, EAS, or React Native API:

1. Read the major version of the `expo` package in `package.json`.
2. Fetch the matching versioned docs: `https://docs.expo.dev/versions/v<major>.0.0/`
3. For anything else, fetch https://docs.expo.dev/llms.txt — an index of all Expo docs with corrections to common LLM misconceptions. Follow its links to the specific page you need; never answer from memory.

## Commands

Use `bunx` instead of `npx` if the project uses bun (`bun.lock` present).

```bash
npx expo install <package>  # ALWAYS use instead of npm/yarn/pnpm/bun add — resolves SDK-compatible versions
npx expo start              # start the dev server
npx expo lint               # lint
npx tsc --noEmit            # typecheck
npx expo-doctor             # diagnose dependency and config issues
npx expo install --fix      # fix incompatible package versions
```

Run lint and typecheck before declaring any task done.

## Navigation & Routing

- Use **Expo Router** for all navigation. Routes live in `src/app/` — every file there is a screen, `_layout.tsx` files define navigators. Keep non-route code (components, hooks, utils) outside `src/app/`.
- Import `Link`, `router`, and `useLocalSearchParams` from `expo-router`.
- Docs: https://docs.expo.dev/router/introduction.md

## Building with EAS

Use EAS to build, sign, and submit the app in the cloud (`eas build`, `eas submit`) and to ship over-the-air updates (`eas update`) — no local Xcode or Android Studio required. Run EAS CLI as `bunx eas-cli <command>` in Bun projects, or `npx eas-cli@latest <command>` otherwise; substitute that for bare `eas` in docs examples.
Docs: https://docs.expo.dev/eas/index.md

## Rules

- If `ios/` and `android/` directories do not exist, they are generated (Continuous Native Generation). Never create or edit them by hand — configure native behavior in `app.json` and config plugins.
- Expo Go only includes its bundled native modules. After adding a library with native code, the app needs a development build: `npx expo run:ios|android` locally, or `eas build --profile development`.
- Prefer recommended Expo modules over third-party libraries, and check your available skills before adding dependencies. Docs: https://docs.expo.dev/versions/latest/index.md
````

### `app.json`

```text
{
  "expo": {
    "name": "medidoresAgua",
    "slug": "medidores-agua",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/images/icon.png",
    "scheme": "medidoresaguaia",
    "userInterfaceStyle": "automatic",
    "ios": {
      "icon": "./assets/expo.icon"
    },
    "android": {
      "adaptiveIcon": {
        "backgroundColor": "#E6F4FE",
        "foregroundImage": "./assets/images/android-icon-foreground.png",
        "backgroundImage": "./assets/images/android-icon-background.png",
        "monochromeImage": "./assets/images/android-icon-monochrome.png"
      },
      "predictiveBackGestureEnabled": false,
      "package": "com.joel2775.medidoresagua"
    },
    "web": {
      "output": "static",
      "favicon": "./assets/images/favicon.png"
    },
    "plugins": [
      [
        "expo-router",
        {
          "headers": {
            "Cross-Origin-Embedder-Policy": "credentialless",
            "Cross-Origin-Opener-Policy": "same-origin"
          }
        }
      ],
      [
        "expo-image-picker",
        {
          "cameraPermission": "Se requiere la cámara para respaldar evidencias de lecturas anómalas o medidores dañados.",
          "photosPermission": "Permite seleccionar una foto como evidencia de la lectura del medidor.",
          "microphonePermission": false
        }
      ],
      [
        "expo-splash-screen",
        {
          "backgroundColor": "#208AEF",
          "image": "./assets/images/splash-icon.png",
          "imageWidth": 76
        }
      ],
      "expo-sqlite"
    ],
    "experiments": {
      "typedRoutes": true,
      "reactCompiler": true
    }
  }
}
```

### `eslint.config.js`

```text
// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require("eslint-config-expo/flat");

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ["dist/*"],
  }
]);
```

### `expo-env.d.ts`

```text
/// <reference types="expo/types" />

// NOTE: This file should not be edited and should be in your git ignore
```

### `export_context.js`

```text
const fs = require('fs');
const path = require('path');

const ROOT_DIR = __dirname;
const OUTPUT_FILE = 'contexto_proyecto.md';
const MAX_FILE_SIZE = 150 * 1024;
const IGNORED_DIRS = new Set([
  '.expo',
  '.git',
  '.vscode',
  '.claude',
  'android',
  'assets',
  'coverage',
  'dist',
  'ios',
  'node_modules',
  '.tamagui',
]);
const IGNORED_FILES = new Set([
  OUTPUT_FILE,
  'package-lock.json',
  'yarn.lock',
  'pnpm-lock.yaml',
  'bun.lock',
  'bun.lockb',
  '.DS_Store',
]);
const ALLOWED_EXTENSIONS = new Set([
  '.cjs',
  '.css',
  '.html',
  '.js',
  '.json',
  '.md',
  '.mjs',
  '.ps1',
  '.sh',
  '.ts',
  '.tsx',
  '.yaml',
  '.yml',
]);
const ALLOWED_DOTFILES = new Set(['.gitignore']);

function isEnvironmentFile(fileName) {
  return fileName === '.env' || fileName.startsWith('.env.');
}

function shouldIncludeFile(fileName) {
  if (IGNORED_FILES.has(fileName) || isEnvironmentFile(fileName)) {
    return false;
  }

  if (fileName.endsWith('.lock') || fileName.endsWith('.map')) {
    return false;
  }

  return ALLOWED_EXTENSIONS.has(path.extname(fileName)) || ALLOWED_DOTFILES.has(fileName);
}

function collectFiles(directory, files = []) {
  const entries = fs.readdirSync(directory, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(directory, entry.name);

    if (entry.isDirectory()) {
      if (!IGNORED_DIRS.has(entry.name)) {
        collectFiles(fullPath, files);
      }
      continue;
    }

    if (!entry.isFile() || !shouldIncludeFile(entry.name)) {
      continue;
    }

    const stats = fs.statSync(fullPath);
    if (stats.size > MAX_FILE_SIZE) {
      console.warn(`Omitido por tamaño (${Math.round(stats.size / 1024)} KB): ${path.relative(ROOT_DIR, fullPath)}`);
      continue;
    }

    files.push(fullPath);
  }

  return files;
}

function getProjectSummary() {
  const packagePath = path.join(ROOT_DIR, 'package.json');
  if (!fs.existsSync(packagePath)) {
    return 'No se encontró package.json.';
  }

  const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
  const appConfigPath = path.join(ROOT_DIR, 'app.json');
  const appConfig = fs.existsSync(appConfigPath)
    ? JSON.parse(fs.readFileSync(appConfigPath, 'utf8'))
    : {};
  const projectName = appConfig.expo?.name ?? packageJson.name ?? 'No definido';
  const dependencies = packageJson.dependencies ?? {};
  const relevantPackages = [
    'expo',
    'react',
    'react-native',
    'expo-router',
    '@tanstack/react-query',
    'expo-sqlite',
    'zustand',
    'zod',
  ];
  const framework = relevantPackages
    .filter((name) => dependencies[name])
    .map((name) => `${name} ${dependencies[name]}`)
    .join(', ');
  const scripts = Object.entries(packageJson.scripts ?? {})
    .map(([name, command]) => `- \`npm run ${name}\`: \`${command}\``)
    .join('\n');

  return [
    `- Aplicación: ${projectName}`,
    `- Paquete npm: ${packageJson.name ?? 'No definido'}`,
    `- Versión: ${packageJson.version ?? 'No definida'}`,
    `- Framework: ${framework || 'No definido'}`,
    '',
    '### Comandos',
    scripts || 'No hay comandos definidos.',
    '',
    '### Exclusiones',
    'Se omiten `.env*`, dependencias, archivos de bloqueo, recursos binarios y carpetas generadas (`dist/`, `.expo/`, `android/`, `ios/`).',
    'Los valores de entorno se pueden consultar en `.env.example`; los archivos `.env` locales nunca se exportan.',
  ].join('\n');
}

function getCodeFence(content) {
  const longestFence = content.match(/`{3,}/g)?.reduce((longest, fence) =>
    Math.max(longest, fence.length), 2
  ) ?? 2;
  return '`'.repeat(longestFence + 1);
}

function buildContext() {
  const files = collectFiles(ROOT_DIR).sort((left, right) =>
    path.relative(ROOT_DIR, left).localeCompare(path.relative(ROOT_DIR, right))
  );
  const packageJson = JSON.parse(fs.readFileSync(path.join(ROOT_DIR, 'package.json'), 'utf8'));
  const appConfigPath = path.join(ROOT_DIR, 'app.json');
  const appConfig = fs.existsSync(appConfigPath)
    ? JSON.parse(fs.readFileSync(appConfigPath, 'utf8'))
    : {};
  const projectName = appConfig.expo?.name ?? packageJson.name ?? 'aplicación';
  const sections = [
    `# Contexto del proyecto: ${projectName}`,
    '',
    '## Resumen',
    '',
    getProjectSummary(),
    '',
    '## Archivos del proyecto',
  ];

  for (const filePath of files) {
    const relativePath = path.relative(ROOT_DIR, filePath);
    const content = fs.readFileSync(filePath, 'utf8').trimEnd();
    const fence = getCodeFence(content);
    sections.push('', `### \`${relativePath}\``, '', `${fence}text`, content, fence);
  }

  const outputPath = path.join(ROOT_DIR, OUTPUT_FILE);
  fs.writeFileSync(outputPath, `${sections.join('\n')}\n`, 'utf8');

  const outputSize = fs.statSync(outputPath).size;
  console.log(`Contexto generado: ${OUTPUT_FILE}`);
  console.log(`Archivos incluidos: ${files.length}`);
  console.log(`Tamaño: ${(outputSize / 1024).toFixed(1)} KB`);
}

try {
  buildContext();
} catch (error) {
  console.error('No se pudo generar el contexto del proyecto:', error.message);
  process.exitCode = 1;
}
```

### `metro.config.js`

```text
// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);
config.resolver.assetExts.push('wasm');

module.exports = config;
```

### `package.json`

```text
{
  "name": "medidoresaguaia",
  "main": "expo-router/entry",
  "version": "1.0.0",
  "dependencies": {
    "@expo/ui": "~57.0.26",
    "@react-native-async-storage/async-storage": "2.2.0",
    "@react-native-community/netinfo": "12.0.1",
    "@tanstack/react-query": "^5.105.0",
    "expo": "~57.0.31",
    "expo-blur": "~57.0.3",
    "expo-constants": "~57.0.22",
    "expo-dev-client": "~57.0.20",
    "expo-device": "~57.0.2",
    "expo-file-system": "~57.0.7",
    "expo-font": "~57.0.4",
    "expo-glass-effect": "~57.0.4",
    "expo-image": "~57.0.5",
    "expo-image-picker": "~57.0.20",
    "expo-linear-gradient": "~57.0.2",
    "expo-linking": "~57.0.13",
    "expo-router": "~57.0.29",
    "expo-splash-screen": "~57.0.10",
    "expo-sqlite": "~57.0.4",
    "expo-status-bar": "~57.0.1",
    "expo-symbols": "~57.0.3",
    "expo-system-ui": "~57.0.4",
    "expo-web-browser": "~57.0.3",
    "react": "19.2.3",
    "react-dom": "19.2.3",
    "react-native": "0.86.3",
    "react-native-gesture-handler": "~2.32.0",
    "react-native-reanimated": "4.5.1",
    "react-native-safe-area-context": "~5.7.0",
    "react-native-screens": "~4.26.0",
    "react-native-web": "~0.21.0",
    "react-native-worklets": "0.10.1",
    "zod": "^4.6.7",
    "zustand": "^5.0.16"
  },
  "devDependencies": {
    "@types/react": "~19.2.2",
    "eslint": "^9.0.0",
    "eslint-config-expo": "~57.0.2",
    "typescript": "~6.0.3"
  },
  "scripts": {
    "start": "expo start",
    "reset-project": "node ./scripts/reset-project.js",
    "android": "expo run:android",
    "ios": "expo run:ios",
    "web": "expo start --web",
    "lint": "expo lint"
  },
  "private": true
}
```

### `README.md`

````text
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
````

### `scripts\reset-project.js`

```text
#!/usr/bin/env node

/**
 * This script is used to reset the project to a blank state.
 * It deletes or moves the /src and /scripts directories to /example based on user input and creates a new /src/app directory with an index.tsx and _layout.tsx file.
 * You can remove the `reset-project` script from package.json and safely delete this file after running it.
 */

const fs = require("fs");
const path = require("path");
const readline = require("readline");

const root = process.cwd();
const oldDirs = ["src", "scripts"];
const exampleDir = "example";
const newAppDir = "src/app";
const exampleDirPath = path.join(root, exampleDir);

const indexContent = `import { Text, View, StyleSheet } from "react-native";

export default function Index() {
  return (
    <View style={styles.container}>
      <Text>Edit src/app/index.tsx to edit this screen.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});
`;

const layoutContent = `import { Stack } from "expo-router";

export default function RootLayout() {
  return <Stack />;
}
`;

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const moveDirectories = async (userInput) => {
  try {
    if (userInput === "y") {
      // Create the app-example directory
      await fs.promises.mkdir(exampleDirPath, { recursive: true });
      console.log(`📁 /${exampleDir} directory created.`);
    }

    // Move old directories to new app-example directory or delete them
    for (const dir of oldDirs) {
      const oldDirPath = path.join(root, dir);
      if (fs.existsSync(oldDirPath)) {
        if (userInput === "y") {
          const newDirPath = path.join(root, exampleDir, dir);
          await fs.promises.rename(oldDirPath, newDirPath);
          console.log(`➡️ /${dir} moved to /${exampleDir}/${dir}.`);
        } else {
          await fs.promises.rm(oldDirPath, { recursive: true, force: true });
          console.log(`❌ /${dir} deleted.`);
        }
      } else {
        console.log(`➡️ /${dir} does not exist, skipping.`);
      }
    }

    // Create new /src/app directory
    const newAppDirPath = path.join(root, newAppDir);
    await fs.promises.mkdir(newAppDirPath, { recursive: true });
    console.log("\n📁 New /src/app directory created.");

    // Create index.tsx
    const indexPath = path.join(newAppDirPath, "index.tsx");
    await fs.promises.writeFile(indexPath, indexContent);
    console.log("📄 src/app/index.tsx created.");

    // Create _layout.tsx
    const layoutPath = path.join(newAppDirPath, "_layout.tsx");
    await fs.promises.writeFile(layoutPath, layoutContent);
    console.log("📄 src/app/_layout.tsx created.");

    console.log("\n✅ Project reset complete. Next steps:");
    console.log(
      `1. Run \`npx expo start\` to start a development server.\n2. Edit src/app/index.tsx to edit the main screen.\n3. Put all your application code in /src, only screens and layout files should be in /src/app.${
        userInput === "y"
          ? `\n4. Delete the /${exampleDir} directory when you're done referencing it.`
          : ""
      }`
    );
  } catch (error) {
    console.error(`❌ Error during script execution: ${error.message}`);
  }
};

rl.question(
  "Do you want to move existing files to /example instead of deleting them? (Y/n): ",
  (answer) => {
    const userInput = answer.trim().toLowerCase() || "y";
    if (userInput === "y" || userInput === "n") {
      moveDirectories(userInput).finally(() => rl.close());
    } else {
      console.log("❌ Invalid input. Please enter 'Y' or 'N'.");
      rl.close();
    }
  }
);
```

### `src\app\_layout.tsx`

```text
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { DarkTheme, DefaultTheme, ThemeProvider } from 'expo-router';
import { useColorScheme, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { ConnectionBanner } from '@/components/connection-banner';
import AppTabs from '@/components/app-tabs';
import { config } from '@/constants/config';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: config.queryStaleTime,
      gcTime: config.queryGcTime,
      retry: 1,
    },
  },
});

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
          <View style={{ flex: 1, backgroundColor: '#E8F7F9' }}>
            <ConnectionBanner />
            <AppTabs />
          </View>
        </ThemeProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
```

### `src\app\explore.tsx`

```text
import { LinearGradient } from 'expo-linear-gradient';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { GlassCard } from '@/components/glass-card';
import { getReadings, updatePendingReadingValue } from '@/services/database';
import type { MeterReadingRecord, ReadingStatus } from '@/types';

const statusLabels: Record<ReadingStatus, string> = {
  pending_verification: 'Pendiente de verificación',
  pending_sync: 'Pendiente de envío',
  syncing: 'Sincronizando',
  synced: 'Sincronizada',
};

export default function HistoryScreen() {
  const queryClient = useQueryClient();
  const readingsQuery = useQuery({
    queryKey: ['readings'],
    queryFn: getReadings,
  });
  const [selectedReading, setSelectedReading] = useState<MeterReadingRecord | null>(null);
  const [editedValue, setEditedValue] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [savedMessage, setSavedMessage] = useState('');

  async function saveEdit() {
    if (!selectedReading) return;
    const value = Number(editedValue);
    if (!editedValue.trim() || !Number.isFinite(value) || value < 0) {
      setErrorMessage('Ingresa una lectura válida, igual o mayor que cero.');
      return;
    }

    try {
      await updatePendingReadingValue(selectedReading.id, value);
      setSelectedReading(null);
      setErrorMessage('');
      setSavedMessage('Lectura actualizada.');
      await queryClient.invalidateQueries({ queryKey: ['readings'] });
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'No se pudo actualizar la lectura.');
    }
  }

  return (
    <LinearGradient colors={['#DDF5F7', '#EAF3FF', '#F6FBFC']} style={styles.gradient}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}>
          <Text style={styles.eyebrow}>BITÁCORA LOCAL</Text>
          <Text style={styles.title}>Lecturas</Text>
          <Text style={styles.subtitle}>
            Registros guardados en este dispositivo. Las lecturas sincronizadas son inmutables.
          </Text>

          {savedMessage ? <Text style={styles.success}>{savedMessage}</Text> : null}
          {readingsQuery.isLoading ? <Text style={styles.empty}>Cargando lecturas...</Text> : null}
          {readingsQuery.error ? (
            <Text style={styles.error}>
              {readingsQuery.error instanceof Error
                ? readingsQuery.error.message
                : 'No se pudo cargar el historial.'}
            </Text>
          ) : null}
          {!readingsQuery.isLoading && readingsQuery.data?.length === 0 ? (
            <GlassCard>
              <Text style={styles.emptyTitle}>Aún no hay registros</Text>
              <Text style={styles.empty}>Las lecturas que guardes aparecerán aquí.</Text>
            </GlassCard>
          ) : null}

          {readingsQuery.data?.map((reading) => {
            const canEdit =
              (reading.status === 'pending_verification' || reading.status === 'pending_sync') &&
              reading.condition !== 'inaccesible';
            const statusColor = reading.status === 'synced' ? '#18865D' : '#A66B22';

            return (
              <GlassCard key={reading.id} style={styles.readingCard}>
                <View style={styles.heading}>
                  <View>
                    <Text style={styles.code}>{reading.meterCode}</Text>
                    <Text style={styles.date}>
                      {new Date(reading.createdAt).toLocaleDateString('es-EC')} · {reading.monthYear}
                    </Text>
                  </View>
                  <View style={[styles.statusChip, { backgroundColor: `${statusColor}16` }]}>
                    <Text style={[styles.statusText, { color: statusColor }]}>
                      {statusLabels[reading.status]}
                    </Text>
                  </View>
                </View>

                <View style={styles.divider} />
                <Detail label="Estado" value={reading.condition} />
                <Detail
                  label="Lectura"
                  value={reading.readingValue === null ? 'No registrada' : `${reading.readingValue} m³`}
                />
                {reading.reasonOrDamageDescription ? (
                  <Detail label="Observación" value={reading.reasonOrDamageDescription} />
                ) : null}
                {reading.isAnomalous ? <Text style={styles.anomaly}>Consumo anómalo revisado</Text> : null}
                {reading.photoUri ? <Text style={styles.photo}>Evidencia guardada en el dispositivo</Text> : null}
                {canEdit ? (
                  <Pressable
                    accessibilityRole="button"
                    onPress={() => {
                      setSelectedReading(reading);
                      setEditedValue(reading.readingValue === null ? '' : String(reading.readingValue));
                      setErrorMessage('');
                    }}
                    style={styles.editButton}>
                    <Text style={styles.editText}>Editar lectura pendiente</Text>
                  </Pressable>
                ) : (
                  <Text style={styles.locked}>Registro bloqueado para edición</Text>
                )}
              </GlassCard>
            );
          })}
        </ScrollView>

        <Modal
          visible={Boolean(selectedReading)}
          transparent
          animationType="fade"
          onRequestClose={() => setSelectedReading(null)}>
          <View style={styles.modalBackdrop}>
            <GlassCard style={styles.modalCard}>
              <Text style={styles.eyebrow}>CORREGIR REGISTRO PENDIENTE</Text>
              <Text style={styles.modalTitle}>{selectedReading?.meterCode}</Text>
              <Text style={styles.subtitle}>La edición se guarda únicamente en el dispositivo.</Text>
              <Text style={styles.fieldLabel}>Lectura actual (m³)</Text>
              <TextInput
                keyboardType="decimal-pad"
                value={editedValue}
                onChangeText={(value) => setEditedValue(value.replace(',', '.'))}
                style={styles.input}
                accessibilityLabel="Editar lectura"
              />
              {errorMessage ? <Text style={styles.error}>{errorMessage}</Text> : null}
              <Pressable onPress={() => void saveEdit()} style={styles.saveButton}>
                <Text style={styles.saveText}>Guardar cambios</Text>
              </Pressable>
              <Pressable onPress={() => setSelectedReading(null)} style={styles.cancelButton}>
                <Text style={styles.cancelText}>Cancelar</Text>
              </Pressable>
            </GlassCard>
          </View>
        </Modal>
      </SafeAreaView>
    </LinearGradient>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.detail}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  safeArea: { flex: 1 },
  content: { paddingHorizontal: 20, paddingTop: 22, paddingBottom: 36, gap: 14 },
  eyebrow: { color: '#188194', fontSize: 10, fontWeight: '800', letterSpacing: 1.2 },
  title: { color: '#14364D', fontSize: 32, fontWeight: '800', letterSpacing: -0.8, marginTop: -7 },
  subtitle: { color: '#5D7480', fontSize: 13, lineHeight: 19, marginTop: -5, marginBottom: 4 },
  readingCard: { marginBottom: 0 },
  heading: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 },
  code: { color: '#18364D', fontSize: 17, fontWeight: '800' },
  date: { color: '#778A94', fontSize: 11, marginTop: 4 },
  statusChip: { borderRadius: 12, paddingHorizontal: 8, paddingVertical: 6, maxWidth: 140 },
  statusText: { fontSize: 9, lineHeight: 12, textAlign: 'center', fontWeight: '800' },
  divider: { height: 1, backgroundColor: 'rgba(38,97,115,0.13)', marginVertical: 13 },
  detail: { marginBottom: 8 },
  detailLabel: { color: '#778A94', fontSize: 10, marginBottom: 2 },
  detailValue: { color: '#294958', fontSize: 13, fontWeight: '600', lineHeight: 18 },
  anomaly: { color: '#9C4B13', fontSize: 11, fontWeight: '700', marginTop: 2 },
  photo: { color: '#176A55', fontSize: 11, marginTop: 5 },
  editButton: {
    backgroundColor: 'rgba(18,122,142,0.1)',
    borderRadius: 12,
    minHeight: 39,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
  },
  editText: { color: '#0B7083', fontSize: 12, fontWeight: '800' },
  locked: { color: '#778A94', fontSize: 11, marginTop: 12, textAlign: 'center' },
  emptyTitle: { color: '#18364D', fontSize: 16, fontWeight: '800', marginBottom: 6 },
  empty: { color: '#5D7480', fontSize: 13, lineHeight: 19 },
  success: { color: '#176A55', backgroundColor: '#E0F5EB', padding: 11, borderRadius: 12, fontSize: 12 },
  error: { color: '#9C3333', backgroundColor: '#FFEEEB', padding: 10, borderRadius: 12, fontSize: 12, marginTop: 5 },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(16,43,58,0.34)', justifyContent: 'center', padding: 24 },
  modalCard: { alignSelf: 'stretch' },
  modalTitle: { color: '#16374E', fontSize: 19, fontWeight: '800', marginTop: 7, marginBottom: 8 },
  fieldLabel: { color: '#355361', fontSize: 12, fontWeight: '700', marginBottom: 7 },
  input: {
    color: '#18364A',
    minHeight: 49,
    borderRadius: 14,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: 'rgba(43,102,121,0.16)',
    backgroundColor: 'rgba(255,255,255,0.76)',
    fontSize: 15,
    marginBottom: 12,
  },
  saveButton: { minHeight: 46, justifyContent: 'center', alignItems: 'center', borderRadius: 14, backgroundColor: '#0C788B' },
  saveText: { color: '#FFFFFF', fontSize: 13, fontWeight: '800' },
  cancelButton: { alignItems: 'center', paddingVertical: 12, marginTop: 3 },
  cancelText: { color: '#617985', fontSize: 13, fontWeight: '700' },
});
```

### `src\app\index.tsx`

```text
import { z } from 'zod';
import { File, Paths } from 'expo-file-system';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Keyboard,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import NetInfo from '@react-native-community/netinfo';

import { GlassCard } from '@/components/glass-card';
import { config } from '@/constants/config';
import { getMeterByCode, meterCodeSchema } from '@/services/meter-api';
import { saveReading } from '@/services/database';
import { syncPendingReadings } from '@/services/sync-service';
import { useAuthStore } from '@/stores/auth-store';
import { useDraftStore } from '@/stores/draft-store';
import type { MeterCondition, ReadingDraft, WaterMeter } from '@/types';

const readingValueSchema = z.coerce.number().finite().nonnegative();

const conditionOptions: { value: MeterCondition; label: string; color: string }[] = [
  { value: 'normal', label: 'Normal', color: '#18865D' },
  { value: 'inaccesible', label: 'Inaccesible', color: '#D98226' },
  { value: 'dañado', label: 'Dañado', color: '#C84646' },
];

export default function HomeScreen() {
  const queryClient = useQueryClient();
  const { technician, ready, signIn, signOut } = useAuthStore();
  const draft = useDraftStore((state) => state.draft);
  const setDraft = useDraftStore((state) => state.setDraft);
  const clearDraft = useDraftStore((state) => state.clearDraft);

  const [employeeCode, setEmployeeCode] = useState('');
  const [password, setPassword] = useState('');
  const [meterCode, setMeterCode] = useState('');
  const [requestedCode, setRequestedCode] = useState('');
  const [restoredMeter, setRestoredMeter] = useState<WaterMeter | null>(null);
  const [condition, setCondition] = useState<MeterCondition>('normal');
  const [readingValue, setReadingValue] = useState('');
  const [reason, setReason] = useState('');
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [anomalyConfirmed, setAnomalyConfirmed] = useState(false);
  const [notice, setNotice] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [draftPromptVisible, setDraftPromptVisible] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const draftPromptShown = useRef(false);

  const meterQuery = useQuery({
    queryKey: ['meter', requestedCode],
    queryFn: () => getMeterByCode(requestedCode),
    enabled: requestedCode.length > 0,
  });

  const meter = meterQuery.data ?? restoredMeter;
  const numericReading = readingValueSchema.safeParse(readingValue);
  const consumption = numericReading.success && meter ? numericReading.data - meter.lastReading : null;
  const isAnomalous =
    condition === 'normal' &&
    consumption !== null &&
    meter !== null &&
    consumption > meter.averageMonthlyConsumption * 3;
  const photoRequired = isAnomalous || condition === 'dañado';

  useEffect(() => {
    if (!ready || !technician || !draft || draftPromptShown.current) return;
    draftPromptShown.current = true;
    const timer = setTimeout(() => setDraftPromptVisible(true), 0);
    return () => clearTimeout(timer);
  }, [draft, ready, technician]);

  useEffect(() => {
    if (!meter) return;
    setDraft({
      meter,
      condition,
      readingValue,
      reasonOrDamageDescription: reason,
      photoUri,
      anomalyConfirmed,
    });
  }, [anomalyConfirmed, condition, meter, photoUri, readingValue, reason, setDraft]);

  function signInAsDemo() {
    if (!employeeCode.trim() || !password) {
      setErrorMessage('Ingresa el código de empleado y la clave para continuar.');
      return;
    }

    signIn(employeeCode.trim(), `Técnico ${employeeCode.trim()}`);
    setPassword('');
    setErrorMessage('');
  }

  function lookUpMeter() {
    Keyboard.dismiss();
    setNotice('');
    setErrorMessage('');
    setRestoredMeter(null);
    setRequestedCode('');

    const parsedCode = meterCodeSchema.safeParse(meterCode);
    if (!parsedCode.success) {
      setErrorMessage(parsedCode.error.issues[0]?.message ?? 'El código no es válido.');
      return;
    }

    setRequestedCode(parsedCode.data);
  }

  function continueDraft(savedDraft: ReadingDraft) {
    setMeterCode(savedDraft.meter.code);
    setRestoredMeter(savedDraft.meter);
    setRequestedCode('');
    setCondition(savedDraft.condition);
    setReadingValue(savedDraft.readingValue);
    setReason(savedDraft.reasonOrDamageDescription);
    setPhotoUri(savedDraft.photoUri);
    setAnomalyConfirmed(savedDraft.anomalyConfirmed);
    setDraftPromptVisible(false);
  }

  async function takePhoto() {
    setErrorMessage('');
    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        Alert.alert(
          'Permiso de cámara',
          'Se requiere la cámara para respaldar evidencias de lecturas anómalas o medidores dañados.'
        );
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        quality: 0.75,
        allowsEditing: false,
      });
      if (result.canceled) return;

      const asset = result.assets[0];
      if (!asset) {
        setErrorMessage('La cámara no devolvió una imagen. Inténtalo nuevamente.');
        return;
      }

      const extension = asset.fileName?.split('.').pop()?.toLowerCase() || 'jpg';
      const destination = new File(Paths.document, `evidencia-medidor-${Date.now()}.${extension}`);
      new File(asset.uri).copy(destination);
      setPhotoUri(destination.uri);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'No se pudo guardar la fotografía.');
    }
  }

  async function submitReading() {
    if (!meter) return;
    setNotice('');
    setErrorMessage('');

    if (condition === 'inaccesible' && !reason.trim()) {
      setErrorMessage('Indica el motivo por el que no fue posible acceder al medidor.');
      return;
    }
    if (condition === 'dañado' && !reason.trim()) {
      setErrorMessage('Describe el daño encontrado en el medidor.');
      return;
    }

    let value: number | null = null;
    if (condition !== 'inaccesible' && readingValue.trim()) {
      const parsedValue = readingValueSchema.safeParse(readingValue);
      if (!parsedValue.success) {
        setErrorMessage('La lectura debe ser un número igual o mayor que cero.');
        return;
      }
      value = parsedValue.data;
      if (value < meter.lastReading) {
        setErrorMessage('La lectura actual no puede ser menor que la lectura anterior.');
        return;
      }
    }
    if (condition === 'normal' && value === null) {
      setErrorMessage('Ingresa la lectura actual del medidor.');
      return;
    }
    if (condition === 'dañado' && readingValue.trim() && value === null) {
      setErrorMessage('Verifica el valor de lectura ingresado.');
      return;
    }

    const currentConsumption = value === null ? null : value - meter.lastReading;
    const anomaly =
      condition === 'normal' &&
      currentConsumption !== null &&
      currentConsumption > meter.averageMonthlyConsumption * 3;

    if (anomaly && !anomalyConfirmed) {
      setErrorMessage('Confirma que revisaste el medidor antes de guardar el consumo anómalo.');
      return;
    }
    if ((anomaly || condition === 'dañado') && !photoUri) {
      setErrorMessage('La foto es obligatoria para lecturas anómalas o medidores dañados.');
      return;
    }

    setIsSaving(true);
    try {
      const network = await NetInfo.fetch();
      const online = network.isConnected === true && network.isInternetReachable !== false;
      const now = new Date();
      const monthYear = `${String(now.getMonth() + 1).padStart(2, '0')}-${now.getFullYear()}`;
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

      await saveReading({
        id,
        meterId: meter.id,
        meterCode: meter.code,
        readingValue: value,
        condition,
        reasonOrDamageDescription: reason.trim(),
        photoUri,
        isAnomalous: anomaly,
        status: online ? 'pending_sync' : 'pending_verification',
        createdAt: now.toISOString(),
        monthYear,
      });

      clearDraft();
      setReadingValue('');
      setReason('');
      setPhotoUri(null);
      setAnomalyConfirmed(false);
      setCondition('normal');
      setRequestedCode('');
      setRestoredMeter(null);
      setMeterCode('');
      setNotice(
        online
          ? 'Lectura guardada localmente. Quedó pendiente de sincronización.'
          : 'Lectura guardada sin conexión. Se verificará al recuperar la señal.'
      );
      await queryClient.invalidateQueries({ queryKey: ['readings'] });

      if (online && !config.demoMode) {
        try {
          await syncPendingReadings();
          setNotice('Lectura guardada y sincronizada.');
        } catch (error) {
          setErrorMessage(
            error instanceof Error
              ? `La lectura quedó guardada; sincronización pendiente: ${error.message}`
              : 'La lectura quedó guardada; no se pudo completar la sincronización.'
          );
        }
        await queryClient.invalidateQueries({ queryKey: ['readings'] });
      }
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'No se pudo guardar la lectura.');
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <LinearGradient colors={['#DDF5F7', '#EAF3FF', '#F6FBFC']} style={styles.gradient}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        {!ready ? (
          <View style={styles.center}>
            <Text style={styles.bodyText}>Cargando sesión...</Text>
          </View>
        ) : !technician ? (
          <ScrollView contentContainerStyle={styles.loginContent} keyboardShouldPersistTaps="handled">
            <BrandHeader />
            <GlassCard>
              <Text style={styles.eyebrow}>ACCESO DE DEMOSTRACIÓN</Text>
              <Text style={styles.cardTitle}>Hola, técnico</Text>
              <Text style={styles.bodyText}>
                Ingresa con tu código de empleado para iniciar el recorrido.
              </Text>
              <TextInput
                autoCapitalize="characters"
                placeholder="Código de empleado"
                placeholderTextColor="#8295A1"
                value={employeeCode}
                onChangeText={setEmployeeCode}
                style={styles.input}
                accessibilityLabel="Código de empleado"
              />
              <TextInput
                placeholder="Clave"
                placeholderTextColor="#8295A1"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                style={styles.input}
                accessibilityLabel="Clave"
              />
              <PrimaryButton title="Ingresar a la jornada" onPress={signInAsDemo} />
              <Text style={styles.helper}>
                En modo demo los datos son locales; configura autenticación de servidor antes de producción.
              </Text>
              <ErrorNotice message={errorMessage} />
            </GlassCard>
          </ScrollView>
        ) : (
          <ScrollView
            contentContainerStyle={styles.content}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}>
            <View style={styles.topLine}>
              <View>
                <Text style={styles.eyebrow}>JORNADA DE CAMPO</Text>
                <Text style={styles.greeting}>Hola, {technician.name}</Text>
              </View>
              <Pressable onPress={signOut} hitSlop={10} accessibilityRole="button">
                <Text style={styles.signOut}>Cerrar sesión</Text>
              </Pressable>
            </View>

            <View style={styles.hero}>
              <View style={styles.heroMark}><Text style={styles.heroDrop}>◉</Text></View>
              <Text style={styles.heroTitle}>Lecturas con{'\n'}confianza.</Text>
              <Text style={styles.heroSubtitle}>
                Consulta el medidor y registra su lectura, incluso sin conexión.
              </Text>
            </View>

            <GlassCard style={styles.searchCard}>
              <Text style={styles.eyebrow}>CONSULTAR MEDIDOR</Text>
              <Text style={styles.cardTitle}>Busca por código</Text>
              <Text style={styles.bodyText}>Formato requerido: MED- seguido de 6 dígitos.</Text>
              <View style={styles.searchRow}>
                <TextInput
                  autoCapitalize="characters"
                  autoCorrect={false}
                  maxLength={10}
                  placeholder="MED-000000"
                  placeholderTextColor="#8295A1"
                  value={meterCode}
                  onChangeText={setMeterCode}
                  style={[styles.input, styles.searchInput]}
                  accessibilityLabel="Código del medidor"
                />
                <PrimaryButton
                  title={meterQuery.isFetching ? '...' : 'Buscar'}
                  onPress={lookUpMeter}
                  disabled={meterQuery.isFetching}
                  compact
                />
              </View>
              {meterQuery.isFetching ? <Text style={styles.helper}>Consultando medidor...</Text> : null}
              {meterQuery.error ? (
                <ErrorNotice
                  message={
                    meterQuery.error instanceof Error
                      ? meterQuery.error.message
                      : 'No se pudo consultar el medidor.'
                  }
                />
              ) : null}
              <ErrorNotice message={errorMessage} />
              <Notice message={notice} />
            </GlassCard>

            {meter ? (
              <GlassCard style={styles.meterCard}>
                <View style={styles.meterHeading}>
                  <View>
                    <Text style={styles.eyebrow}>MEDIDOR ENCONTRADO</Text>
                    <Text style={styles.cardTitle}>{meter.code}</Text>
                  </View>
                  <View
                    style={[
                      styles.normalChip,
                      meter.condition === 'inaccesible' && styles.inaccessibleChip,
                      meter.condition === 'dañado' && styles.damagedChip,
                    ]}>
                    <Text
                      style={[
                        styles.normalChipText,
                        meter.condition === 'inaccesible' && styles.inaccessibleChipText,
                        meter.condition === 'dañado' && styles.damagedChipText,
                      ]}>
                      {meter.condition.toUpperCase()}
                    </Text>
                  </View>
                </View>
                <View style={styles.detailsGrid}>
                  <MeterDetail label="Dirección" value={meter.address} wide />
                  <MeterDetail label="Sector" value={meter.sector} />
                  <MeterDetail label="Cuenta" value={meter.accountNumber} />
                  <MeterDetail label="Última lectura" value={`${meter.lastReading} m³`} />
                  <MeterDetail
                    label="Promedio mensual"
                    value={`${meter.averageMonthlyConsumption} m³`}
                  />
                </View>
                <View style={styles.divider} />

                <Text style={styles.sectionTitle}>Estado del medidor</Text>
                <View style={styles.conditionRow}>
                  {conditionOptions.map((option) => (
                    <Pressable
                      key={option.value}
                      accessibilityRole="radio"
                      accessibilityState={{ selected: condition === option.value }}
                      onPress={() => {
                        setCondition(option.value);
                        setAnomalyConfirmed(false);
                      }}
                      style={[
                        styles.conditionButton,
                        condition === option.value && {
                          borderColor: option.color,
                          backgroundColor: `${option.color}12`,
                        },
                      ]}>
                      <View style={[styles.conditionDot, { backgroundColor: option.color }]} />
                      <Text style={styles.conditionLabel}>{option.label}</Text>
                    </Pressable>
                  ))}
                </View>

                {condition !== 'inaccesible' ? (
                  <>
                    <Text style={styles.fieldLabel}>Lectura actual (m³){condition === 'dañado' ? ' · opcional' : ''}</Text>
                    <TextInput
                      keyboardType="decimal-pad"
                      placeholder="Ej. 146"
                      placeholderTextColor="#8295A1"
                      value={readingValue}
                      onChangeText={(value) => {
                        setReadingValue(value.replace(',', '.'));
                        setAnomalyConfirmed(false);
                      }}
                      style={styles.input}
                      accessibilityLabel="Lectura actual en metros cúbicos"
                    />
                  </>
                ) : null}

                {condition === 'inaccesible' || condition === 'dañado' ? (
                  <>
                    <Text style={styles.fieldLabel}>
                      {condition === 'inaccesible' ? 'Motivo de inaccesibilidad' : 'Descripción del daño'}
                    </Text>
                    <TextInput
                      multiline
                      placeholder={
                        condition === 'inaccesible'
                          ? 'Ej. predio cerrado, acceso bloqueado...'
                          : 'Describe lo observado en el medidor...'
                      }
                      placeholderTextColor="#8295A1"
                      value={reason}
                      onChangeText={setReason}
                      style={[styles.input, styles.multilineInput]}
                      accessibilityLabel={
                        condition === 'inaccesible' ? 'Motivo de inaccesibilidad' : 'Descripción del daño'
                      }
                    />
                  </>
                ) : null}

                {isAnomalous ? (
                  <Pressable
                    onPress={() => setAnomalyConfirmed((confirmed) => !confirmed)}
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked: anomalyConfirmed }}
                    style={styles.anomalyCard}>
                    <Text style={styles.anomalyTitle}>Consumo inusual · {consumption} m³</Text>
                    <Text style={styles.anomalyBody}>
                      Supera tres veces el promedio mensual. Revisa el medidor y confirma antes de guardar.
                    </Text>
                    <Text style={styles.confirmText}>
                      {anomalyConfirmed ? '✓ Revisión confirmada' : '□ Confirmo que revisé el medidor'}
                    </Text>
                  </Pressable>
                ) : null}

                <View style={styles.photoHeader}>
                  <Text style={styles.fieldLabel}>Fotografía de evidencia{photoRequired ? ' · obligatoria' : ' · opcional'}</Text>
                  <Pressable onPress={() => void takePhoto()} style={styles.photoButton}>
                    <Text style={styles.photoButtonText}>{photoUri ? 'Repetir foto' : 'Abrir cámara'}</Text>
                  </Pressable>
                </View>
                {photoUri ? (
                  <Text style={styles.helper}>Foto guardada en el dispositivo para esta lectura.</Text>
                ) : null}
                <ErrorNotice message={errorMessage} />
                <PrimaryButton
                  title={isSaving ? 'Guardando...' : 'Guardar lectura'}
                  onPress={() => void submitReading()}
                  disabled={isSaving}
                />
              </GlassCard>
            ) : null}

            <Text style={styles.footerText}>EPMAPS · Agua para Quito</Text>
          </ScrollView>
        )}

        <Modal
          visible={draftPromptVisible && Boolean(draft)}
          transparent
          animationType="fade"
          onRequestClose={() => setDraftPromptVisible(false)}>
          <View style={styles.modalBackdrop}>
            <GlassCard style={styles.modalCard}>
              <Text style={styles.eyebrow}>BORRADOR GUARDADO</Text>
              <Text style={styles.cardTitle}>¿Continuar la captura?</Text>
              <Text style={styles.bodyText}>
                Encontramos datos pendientes para {draft?.meter.code}. Puedes continuar o descartarlos.
              </Text>
              <PrimaryButton
                title="Continuar captura"
                onPress={() => draft && continueDraft(draft)}
              />
              <Pressable
                onPress={() => {
                  clearDraft();
                  setDraftPromptVisible(false);
                }}
                style={styles.discardButton}>
                <Text style={styles.discardText}>Descartar borrador</Text>
              </Pressable>
            </GlassCard>
          </View>
        </Modal>
      </SafeAreaView>
    </LinearGradient>
  );
}

function BrandHeader() {
  return (
    <View style={styles.loginHero}>
      <View style={styles.logoMark}><Text style={styles.logoMarkText}>M</Text></View>
      <Text style={styles.brandName}>medidoresAgua</Text>
      <Text style={styles.loginSubtitle}>Registro móvil de lecturas · Quito</Text>
    </View>
  );
}

function MeterDetail({ label, value, wide = false }: { label: string; value: string; wide?: boolean }) {
  return (
    <View style={[styles.detail, wide && styles.detailWide]}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  );
}

function PrimaryButton({
  title,
  onPress,
  disabled = false,
  compact = false,
}: {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  compact?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.primaryButton,
        compact && styles.compactButton,
        disabled && styles.disabledButton,
        pressed && !disabled && styles.pressedButton,
      ]}>
      <Text style={styles.primaryButtonText}>{title}</Text>
    </Pressable>
  );
}

function ErrorNotice({ message }: { message: string }) {
  return message ? <Text accessibilityRole="alert" style={styles.errorText}>{message}</Text> : null;
}

function Notice({ message }: { message: string }) {
  return message ? <Text style={styles.noticeText}>{message}</Text> : null;
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  safeArea: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loginContent: { flexGrow: 1, justifyContent: 'center', padding: 22, gap: 24 },
  loginHero: { alignItems: 'center', gap: 8 },
  logoMark: {
    width: 58,
    height: 58,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0A778B',
    shadowColor: '#15566B',
    shadowOpacity: 0.2,
    shadowRadius: 14,
    elevation: 3,
  },
  logoMarkText: { color: '#FFFFFF', fontSize: 28, fontWeight: '800' },
  brandName: { color: '#14364D', fontSize: 24, fontWeight: '800', letterSpacing: -0.5 },
  loginSubtitle: { color: '#66808D', fontSize: 14 },
  content: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 36, gap: 18 },
  topLine: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  eyebrow: { color: '#188194', fontSize: 10, fontWeight: '800', letterSpacing: 1.2 },
  greeting: { color: '#14364D', fontSize: 17, fontWeight: '700', marginTop: 4 },
  signOut: { color: '#547381', fontSize: 12, fontWeight: '700', padding: 8 },
  hero: { paddingVertical: 8, minHeight: 140, justifyContent: 'center' },
  heroMark: {
    width: 31,
    height: 31,
    borderRadius: 11,
    backgroundColor: 'rgba(17,121,140,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 9,
  },
  heroDrop: { fontSize: 18, color: '#11798C', fontWeight: '800' },
  heroTitle: { color: '#14364D', fontWeight: '800', fontSize: 34, lineHeight: 37, letterSpacing: -1 },
  heroSubtitle: { color: '#58727F', fontSize: 14, lineHeight: 21, marginTop: 7, maxWidth: 310 },
  searchCard: { marginBottom: 0 },
  cardTitle: { color: '#16374E', fontSize: 20, fontWeight: '800', marginTop: 7, marginBottom: 5 },
  bodyText: { color: '#5D7480', fontSize: 14, lineHeight: 20, marginBottom: 12 },
  input: {
    color: '#18364A',
    minHeight: 50,
    borderRadius: 14,
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: 'rgba(43,102,121,0.16)',
    backgroundColor: 'rgba(255,255,255,0.76)',
    fontSize: 15,
    marginBottom: 12,
  },
  searchRow: { flexDirection: 'row', gap: 8, alignItems: 'flex-start', marginTop: 8 },
  searchInput: { flex: 1, marginBottom: 0 },
  primaryButton: {
    minHeight: 49,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 15,
    paddingHorizontal: 18,
    backgroundColor: '#0C788B',
    shadowColor: '#0C788B',
    shadowOpacity: 0.18,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    elevation: 2,
  },
  compactButton: { minWidth: 90, minHeight: 50 },
  primaryButtonText: { color: '#FFFFFF', fontSize: 14, fontWeight: '800' },
  disabledButton: { opacity: 0.58 },
  pressedButton: { opacity: 0.82, transform: [{ scale: 0.99 }] },
  helper: { color: '#708590', fontSize: 12, lineHeight: 18, marginTop: 8 },
  errorText: {
    color: '#9C3333',
    backgroundColor: 'rgba(255,237,235,0.92)',
    borderRadius: 12,
    overflow: 'hidden',
    paddingHorizontal: 11,
    paddingVertical: 9,
    fontSize: 13,
    lineHeight: 18,
    marginTop: 10,
  },
  noticeText: {
    color: '#176A55',
    backgroundColor: 'rgba(223,247,237,0.92)',
    borderRadius: 12,
    overflow: 'hidden',
    paddingHorizontal: 11,
    paddingVertical: 9,
    fontSize: 13,
    marginTop: 10,
  },
  meterCard: { marginTop: 0 },
  meterHeading: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  normalChip: { backgroundColor: '#E1F4EB', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20 },
  normalChipText: { color: '#16805B', fontSize: 9, fontWeight: '800', letterSpacing: 0.6 },
  inaccessibleChip: { backgroundColor: '#FFF0D9' },
  inaccessibleChipText: { color: '#A96819' },
  damagedChip: { backgroundColor: '#FCE7E5' },
  damagedChipText: { color: '#B53C3C' },
  detailsGrid: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 10, rowGap: 12 },
  detail: { width: '50%', paddingRight: 8, gap: 3 },
  detailWide: { width: '100%' },
  detailLabel: { color: '#778A94', fontSize: 11 },
  detailValue: { color: '#1C3A4D', fontSize: 14, fontWeight: '700', lineHeight: 19 },
  divider: { height: 1, backgroundColor: 'rgba(38,97,115,0.13)', marginVertical: 17 },
  sectionTitle: { color: '#1B3C50', fontSize: 15, fontWeight: '800', marginBottom: 10 },
  conditionRow: { flexDirection: 'row', gap: 7, marginBottom: 16 },
  conditionButton: {
    flex: 1,
    minHeight: 41,
    borderRadius: 13,
    backgroundColor: 'rgba(255,255,255,0.58)',
    borderWidth: 1,
    borderColor: 'rgba(43,102,121,0.13)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingHorizontal: 5,
  },
  conditionDot: { width: 7, height: 7, borderRadius: 4 },
  conditionLabel: { color: '#294958', fontSize: 11, fontWeight: '700' },
  fieldLabel: { color: '#355361', fontSize: 12, fontWeight: '700', marginBottom: 7 },
  multilineInput: { minHeight: 84, textAlignVertical: 'top' },
  anomalyCard: {
    backgroundColor: '#FFF3E7',
    borderWidth: 1,
    borderColor: '#F3C791',
    padding: 14,
    borderRadius: 16,
    marginBottom: 15,
  },
  anomalyTitle: { color: '#9C4B13', fontSize: 14, fontWeight: '800', marginBottom: 5 },
  anomalyBody: { color: '#805B3B', fontSize: 12, lineHeight: 18 },
  confirmText: { color: '#935017', fontSize: 13, fontWeight: '800', marginTop: 9 },
  photoHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 5 },
  photoButton: {
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 12,
    backgroundColor: 'rgba(18,122,142,0.1)',
  },
  photoButtonText: { color: '#0B7083', fontSize: 12, fontWeight: '800' },
  footerText: { textAlign: 'center', color: '#7D929B', fontSize: 11, paddingTop: 4 },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(16,43,58,0.34)',
    justifyContent: 'center',
    padding: 24,
  },
  modalCard: { alignSelf: 'stretch' },
  discardButton: { alignItems: 'center', paddingVertical: 13, marginTop: 2 },
  discardText: { color: '#617985', fontSize: 13, fontWeight: '700' },
});
```

### `src\components\animated-icon.module.css`

```text
.expoLogoBackground {
  background-image: linear-gradient(180deg, #3c9ffe, #0274df);
  border-radius: 40px;
  width: 128px;
  height: 128px;
}
```

### `src\components\animated-icon.tsx`

```text
import { Image } from 'expo-image';
import * as SplashScreen from 'expo-splash-screen';
import { useState } from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';
import Animated, { Easing, Keyframe } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

const INITIAL_SCALE_FACTOR = Dimensions.get('screen').height / 90;
const DURATION = 600;

export function AnimatedSplashOverlay() {
  const [animate, setAnimate] = useState(false);
  const [visible, setVisible] = useState(true);

  if (!visible) return null;

  const splashKeyframe = new Keyframe({
    0: {
      transform: [{ scale: 1 }],
      opacity: 1,
    },
    20: {
      opacity: 1,
    },
    70: {
      opacity: 0,
      easing: Easing.elastic(0.7),
    },
    100: {
      opacity: 0,
      transform: [{ scale: 1 }],
      easing: Easing.elastic(0.7),
    },
  });

  const image = <Image style={styles.image} source={require('@/assets/images/expo-logo.png')} />;

  return animate ? (
    <Animated.View
      entering={splashKeyframe.duration(DURATION).withCallback((finished) => {
        'worklet';
        if (finished) {
          scheduleOnRN(setVisible, false);
        }
      })}
      style={styles.splashOverlay}>
      {image}
    </Animated.View>
  ) : (
    <View
      onLayout={() => {
        SplashScreen.hideAsync().finally(() => {
          setAnimate(true);
        });
      }}
      style={styles.splashOverlay}>
      {image}
    </View>
  );
}

const keyframe = new Keyframe({
  0: {
    transform: [{ scale: INITIAL_SCALE_FACTOR }],
  },
  100: {
    transform: [{ scale: 1 }],
    easing: Easing.elastic(0.7),
  },
});

const logoKeyframe = new Keyframe({
  0: {
    transform: [{ scale: 1.3 }],
    opacity: 0,
  },
  40: {
    transform: [{ scale: 1.3 }],
    opacity: 0,
    easing: Easing.elastic(0.7),
  },
  100: {
    opacity: 1,
    transform: [{ scale: 1 }],
    easing: Easing.elastic(0.7),
  },
});

const glowKeyframe = new Keyframe({
  0: {
    transform: [{ rotateZ: '0deg' }],
  },
  100: {
    transform: [{ rotateZ: '7200deg' }],
  },
});

export function AnimatedIcon() {
  return (
    <View style={styles.iconContainer}>
      <Animated.View entering={glowKeyframe.duration(60 * 1000 * 4)} style={styles.glow}>
        <Image style={styles.glow} source={require('@/assets/images/logo-glow.png')} />
      </Animated.View>

      <Animated.View entering={keyframe.duration(DURATION)} style={styles.background} />
      <Animated.View style={styles.imageContainer} entering={logoKeyframe.duration(DURATION)}>
        <Image style={styles.image} source={require('@/assets/images/expo-logo.png')} />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  imageContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  glow: {
    width: 201,
    height: 201,
    position: 'absolute',
  },
  iconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 128,
    height: 128,
    zIndex: 100,
  },
  image: {
    width: 76,
    height: 71,
  },
  background: {
    borderRadius: 40,
    experimental_backgroundImage: `linear-gradient(180deg, #3C9FFE, #0274DF)`,
    width: 128,
    height: 128,
    position: 'absolute',
  },
  splashOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: '#208AEF',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
});
```

### `src\components\animated-icon.web.tsx`

```text
import { Image } from 'expo-image';
import { StyleSheet, View } from 'react-native';
import Animated, { Keyframe, Easing } from 'react-native-reanimated';

import classes from './animated-icon.module.css';
const DURATION = 300;

export function AnimatedSplashOverlay() {
  return null;
}

const keyframe = new Keyframe({
  0: {
    transform: [{ scale: 0 }],
  },
  60: {
    transform: [{ scale: 1.2 }],
    easing: Easing.elastic(1.2),
  },
  100: {
    transform: [{ scale: 1 }],
    easing: Easing.elastic(1.2),
  },
});

const logoKeyframe = new Keyframe({
  0: {
    opacity: 0,
  },
  60: {
    transform: [{ scale: 1.2 }],
    opacity: 0,
    easing: Easing.elastic(1.2),
  },
  100: {
    transform: [{ scale: 1 }],
    opacity: 1,
    easing: Easing.elastic(1.2),
  },
});

const glowKeyframe = new Keyframe({
  0: {
    transform: [{ rotateZ: '-180deg' }, { scale: 0.8 }],
    opacity: 0,
  },
  [DURATION / 1000]: {
    transform: [{ rotateZ: '0deg' }, { scale: 1 }],
    opacity: 1,
    easing: Easing.elastic(0.7),
  },
  100: {
    transform: [{ rotateZ: '7200deg' }],
  },
});

export function AnimatedIcon() {
  return (
    <View style={styles.iconContainer}>
      <Animated.View entering={glowKeyframe.duration(60 * 1000 * 4)} style={styles.glow}>
        <Image style={styles.glow} source={require('@/assets/images/logo-glow.png')} />
      </Animated.View>

      <Animated.View style={styles.background} entering={keyframe.duration(DURATION)}>
        <div className={classes.expoLogoBackground} />
      </Animated.View>

      <Animated.View style={styles.imageContainer} entering={logoKeyframe.duration(DURATION)}>
        <Image style={styles.image} source={require('@/assets/images/expo-logo.png')} />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    width: '100%',
    zIndex: 1000,
    position: 'absolute',
    top: 128 / 2 + 138,
  },
  imageContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  glow: {
    width: 201,
    height: 201,
    position: 'absolute',
  },
  iconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 128,
    height: 128,
  },
  image: {
    position: 'absolute',
    width: 76,
    height: 71,
  },
  background: {
    width: 128,
    height: 128,
    position: 'absolute',
  },
});
```

### `src\components\app-tabs.tsx`

```text
import { NativeTabs } from 'expo-router/unstable-native-tabs';
import { useColorScheme } from 'react-native';

import { Colors } from '@/constants/theme';

export default function AppTabs() {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'unspecified' ? 'light' : scheme];

  return (
    <NativeTabs
      backgroundColor={colors.background}
      indicatorColor={colors.backgroundElement}
      labelStyle={{ selected: { color: colors.text } }}>
      <NativeTabs.Trigger name="index">
        <NativeTabs.Trigger.Label>Consulta</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          src={require('@/assets/images/tabIcons/home.png')}
          renderingMode="template"
        />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="explore">
        <NativeTabs.Trigger.Label>Historial</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          src={require('@/assets/images/tabIcons/explore.png')}
          renderingMode="template"
        />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
```

### `src\components\app-tabs.web.tsx`

```text
import {
  Tabs,
  TabList,
  TabTrigger,
  TabSlot,
  TabTriggerSlotProps,
  TabListProps,
} from 'expo-router/ui';
import { SymbolView } from 'expo-symbols';
import { Pressable, useColorScheme, View, StyleSheet } from 'react-native';

import { ExternalLink } from './external-link';
import { ThemedText } from './themed-text';
import { ThemedView } from './themed-view';

import { Colors, MaxContentWidth, Spacing } from '@/constants/theme';

export default function AppTabs() {
  return (
    <Tabs>
      <TabSlot style={{ height: '100%' }} />
      <TabList asChild>
        <CustomTabList>
          <TabTrigger name="home" href="/" asChild>
            <TabButton>Consulta</TabButton>
          </TabTrigger>
          <TabTrigger name="explore" href="/explore" asChild>
            <TabButton>Historial</TabButton>
          </TabTrigger>
        </CustomTabList>
      </TabList>
    </Tabs>
  );
}

export function TabButton({ children, isFocused, ...props }: TabTriggerSlotProps) {
  return (
    <Pressable {...props} style={({ pressed }) => pressed && styles.pressed}>
      <ThemedView
        type={isFocused ? 'backgroundSelected' : 'backgroundElement'}
        style={styles.tabButtonView}>
        <ThemedText type="small" themeColor={isFocused ? 'text' : 'textSecondary'}>
          {children}
        </ThemedText>
      </ThemedView>
    </Pressable>
  );
}

export function CustomTabList(props: TabListProps) {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'unspecified' ? 'light' : scheme];

  return (
    <View {...props} style={styles.tabListContainer}>
      <ThemedView type="backgroundElement" style={styles.innerContainer}>
        <ThemedText type="smallBold" style={styles.brandText}>
          medidoresAgua
        </ThemedText>

        {props.children}

        <ExternalLink href="https://docs.expo.dev" asChild>
          <Pressable style={styles.externalPressable}>
            <ThemedText type="link">Docs</ThemedText>
            <SymbolView
              tintColor={colors.text}
              name={{ ios: 'arrow.up.right.square', web: 'link' }}
              size={12}
            />
          </Pressable>
        </ExternalLink>
      </ThemedView>
    </View>
  );
}

const styles = StyleSheet.create({
  tabListContainer: {
    position: 'absolute',
    width: '100%',
    padding: Spacing.three,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
  },
  innerContainer: {
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.five,
    borderRadius: Spacing.five,
    flexDirection: 'row',
    alignItems: 'center',
    flexGrow: 1,
    gap: Spacing.two,
    maxWidth: MaxContentWidth,
  },
  brandText: {
    marginRight: 'auto',
  },
  pressed: {
    opacity: 0.7,
  },
  tabButtonView: {
    paddingVertical: Spacing.one,
    paddingHorizontal: Spacing.three,
    borderRadius: Spacing.three,
  },
  externalPressable: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.one,
    marginLeft: Spacing.three,
  },
});
```

### `src\components\connection-banner.tsx`

```text
import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { useQueryClient } from '@tanstack/react-query';

import { config } from '@/constants/config';
import { getPendingCount } from '@/services/database';
import { syncPendingReadings } from '@/services/sync-service';

export function ConnectionBanner() {
  const queryClient = useQueryClient();
  const [online, setOnline] = useState<boolean | null>(null);
  const [pendingCount, setPendingCount] = useState(0);
  const [syncError, setSyncError] = useState<string | null>(null);

  useEffect(() => {
    let previousOnline: boolean | null = null;
    let mounted = true;

    const refreshCount = async () => {
      try {
        const count = await getPendingCount();
        if (mounted) setPendingCount(count);
      } catch (error) {
        if (mounted) {
          setSyncError(error instanceof Error ? error.message : 'No se pudo consultar la base local.');
        }
      }
    };

    const unsubscribe = NetInfo.addEventListener((state) => {
      const connected = state.isConnected === true && state.isInternetReachable !== false;
      setOnline(connected);

      if (connected && previousOnline !== true && !config.demoMode) {
        void syncPendingReadings()
          .then(() => {
            if (mounted) {
              setSyncError(null);
              void queryClient.invalidateQueries({ queryKey: ['readings'] });
            }
          })
          .catch((error: unknown) => {
            if (mounted) {
              setSyncError(error instanceof Error ? error.message : 'No se pudo sincronizar.');
            }
          })
          .finally(() => void refreshCount());
      }

      previousOnline = connected;
      void refreshCount();
    });

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, [queryClient]);

  return (
    <View style={styles.wrapper}>
      <View style={styles.banner}>
        <View style={[styles.dot, online ? styles.online : styles.offline]} />
        <Text style={styles.label}>
          {online === null ? 'VERIFICANDO RED' : online ? 'EN LÍNEA' : 'SIN CONEXIÓN'}
        </Text>
        <Text style={styles.pending}>{pendingCount} pendientes</Text>
        {config.demoMode && <Text style={styles.demo}>DEMO</Text>}
      </View>
      {syncError ? <Text style={styles.error}>{syncError}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { paddingHorizontal: 20, paddingTop: 8 },
  banner: {
    minHeight: 34,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.82)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.72)',
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  dot: { width: 8, height: 8, borderRadius: 4 },
  online: { backgroundColor: '#16845B' },
  offline: { backgroundColor: '#D84C4C' },
  label: { color: '#18364D', fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },
  pending: { color: '#526A78', fontSize: 10, marginLeft: 'auto' },
  demo: {
    color: '#176A85',
    backgroundColor: '#DDF3F5',
    fontSize: 9,
    fontWeight: '800',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 8,
  },
  error: { color: '#9F2D2D', fontSize: 12, marginTop: 4, paddingHorizontal: 4 },
});
```

### `src\components\external-link.tsx`

```text
import { Href, Link } from 'expo-router';
import { openBrowserAsync, WebBrowserPresentationStyle } from 'expo-web-browser';
import { type ComponentProps } from 'react';

type Props = Omit<ComponentProps<typeof Link>, 'href'> & { href: Href & string };

export function ExternalLink({ href, ...rest }: Props) {
  return (
    <Link
      target="_blank"
      {...rest}
      href={href}
      onPress={async (event) => {
        if (process.env.EXPO_OS !== 'web') {
          // Prevent the default behavior of linking to the default browser on native.
          event.preventDefault();
          // Open the link in an in-app browser.
          await openBrowserAsync(href, {
            presentationStyle: WebBrowserPresentationStyle.AUTOMATIC,
          });
        }
      }}
    />
  );
}
```

### `src\components\glass-card.tsx`

```text
import { BlurView } from 'expo-blur';
import type { PropsWithChildren } from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';

type GlassCardProps = PropsWithChildren<{ style?: ViewStyle }>;

export function GlassCard({ children, style }: GlassCardProps) {
  return (
    <View style={[styles.shell, style]}>
      <BlurView intensity={28} tint="light" style={styles.blur}>
        {children}
      </BlurView>
    </View>
  );
}

const styles = StyleSheet.create({
  shell: {
    overflow: 'hidden',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.82)',
    backgroundColor: 'rgba(255,255,255,0.66)',
    shadowColor: '#14576A',
    shadowOpacity: 0.1,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 3,
  },
  blur: { padding: 18, backgroundColor: 'rgba(255,255,255,0.2)' },
});
```

### `src\components\hint-row.tsx`

```text
import type { ReactNode } from 'react';
import { View, StyleSheet } from 'react-native';

import { ThemedText } from './themed-text';
import { ThemedView } from './themed-view';

import { Spacing } from '@/constants/theme';

type HintRowProps = {
  title?: string;
  hint?: ReactNode;
};

export function HintRow({ title = 'Try editing', hint = 'app/index.tsx' }: HintRowProps) {
  return (
    <View style={styles.stepRow}>
      <ThemedText type="small">{title}</ThemedText>
      <ThemedView type="backgroundSelected" style={styles.codeSnippet}>
        <ThemedText themeColor="textSecondary">{hint}</ThemedText>
      </ThemedView>
    </View>
  );
}

const styles = StyleSheet.create({
  stepRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  codeSnippet: {
    borderRadius: Spacing.two,
    paddingVertical: Spacing.half,
    paddingHorizontal: Spacing.two,
  },
});
```

### `src\components\themed-text.tsx`

```text
import { Platform, StyleSheet, Text, type TextProps } from 'react-native';

import { Fonts, ThemeColor } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export type ThemedTextProps = TextProps & {
  type?: 'default' | 'title' | 'small' | 'smallBold' | 'subtitle' | 'link' | 'linkPrimary' | 'code';
  themeColor?: ThemeColor;
};

export function ThemedText({ style, type = 'default', themeColor, ...rest }: ThemedTextProps) {
  const theme = useTheme();

  return (
    <Text
      style={[
        { color: theme[themeColor ?? 'text'] },
        type === 'default' && styles.default,
        type === 'title' && styles.title,
        type === 'small' && styles.small,
        type === 'smallBold' && styles.smallBold,
        type === 'subtitle' && styles.subtitle,
        type === 'link' && styles.link,
        type === 'linkPrimary' && styles.linkPrimary,
        type === 'code' && styles.code,
        style,
      ]}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  small: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: 500,
  },
  smallBold: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: 700,
  },
  default: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: 500,
  },
  title: {
    fontSize: 48,
    fontWeight: 600,
    lineHeight: 52,
  },
  subtitle: {
    fontSize: 32,
    lineHeight: 44,
    fontWeight: 600,
  },
  link: {
    lineHeight: 30,
    fontSize: 14,
  },
  linkPrimary: {
    lineHeight: 30,
    fontSize: 14,
    color: '#3c87f7',
  },
  code: {
    fontFamily: Fonts.mono,
    fontWeight: Platform.select({ android: 700 }) ?? 500,
    fontSize: 12,
  },
});
```

### `src\components\themed-view.tsx`

```text
import { View, type ViewProps } from 'react-native';

import { ThemeColor } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export type ThemedViewProps = ViewProps & {
  lightColor?: string;
  darkColor?: string;
  type?: ThemeColor;
};

export function ThemedView({ style, lightColor, darkColor, type, ...otherProps }: ThemedViewProps) {
  const theme = useTheme();

  return <View style={[{ backgroundColor: theme[type ?? 'background'] }, style]} {...otherProps} />;
}
```

### `src\components\ui\collapsible.tsx`

```text
import { SymbolView } from 'expo-symbols';
import { PropsWithChildren, useState } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export function Collapsible({ children, title }: PropsWithChildren & { title: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const theme = useTheme();

  return (
    <ThemedView>
      <Pressable
        style={({ pressed }) => [styles.heading, pressed && styles.pressedHeading]}
        onPress={() => setIsOpen((value) => !value)}>
        <ThemedView type="backgroundElement" style={styles.button}>
          <SymbolView
            name={{ ios: 'chevron.right', android: 'chevron_right', web: 'chevron_right' }}
            size={14}
            weight="bold"
            tintColor={theme.text}
            style={{ transform: [{ rotate: isOpen ? '-90deg' : '90deg' }] }}
          />
        </ThemedView>

        <ThemedText type="small">{title}</ThemedText>
      </Pressable>
      {isOpen && (
        <Animated.View entering={FadeIn.duration(200)}>
          <ThemedView type="backgroundElement" style={styles.content}>
            {children}
          </ThemedView>
        </Animated.View>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  heading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  pressedHeading: {
    opacity: 0.7,
  },
  button: {
    width: Spacing.four,
    height: Spacing.four,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    marginTop: Spacing.three,
    borderRadius: Spacing.three,
    marginLeft: Spacing.four,
    padding: Spacing.four,
  },
});
```

### `src\components\web-badge.tsx`

```text
import { version } from 'expo/package.json';
import { Image } from 'expo-image';
import { useColorScheme, StyleSheet } from 'react-native';

import { ThemedText } from './themed-text';
import { ThemedView } from './themed-view';

import { Spacing } from '@/constants/theme';

export function WebBadge() {
  const scheme = useColorScheme();

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="code" themeColor="textSecondary" style={styles.versionText}>
        v{version}
      </ThemedText>
      <Image
        source={
          scheme === 'dark'
            ? require('@/assets/images/expo-badge-white.png')
            : require('@/assets/images/expo-badge.png')
        }
        style={styles.badgeImage}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: Spacing.five,
    alignItems: 'center',
    gap: Spacing.two,
  },
  versionText: {
    textAlign: 'center',
  },
  badgeImage: {
    width: 123,
    aspectRatio: 123 / 24,
  },
});
```

### `src\constants\config.ts`

```text
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
```

### `src\constants\theme.ts`

```text
/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import '@/global.css';

import { Platform } from 'react-native';

export const Colors = {
  light: {
    text: '#000000',
    background: '#ffffff',
    backgroundElement: '#F0F0F3',
    backgroundSelected: '#E0E1E6',
    textSecondary: '#60646C',
  },
  dark: {
    text: '#ffffff',
    background: '#000000',
    backgroundElement: '#212225',
    backgroundSelected: '#2E3135',
    textSecondary: '#B0B4BA',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;
```

### `src\global.css`

```text
:root {
  --font-display:
    Spline Sans, Inter, ui-sans-serif, system-ui, sans-serif, Apple Color Emoji, Segoe UI Emoji,
    Segoe UI Symbol, Noto Color Emoji;
  --font-mono:
    ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, Liberation Mono, Courier New, monospace;
  --font-rounded: 'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif;
  --font-serif: Georgia, 'Times New Roman', serif;
}
```

### `src\hooks\use-color-scheme.ts`

```text
export { useColorScheme } from 'react-native';
```

### `src\hooks\use-color-scheme.web.ts`

```text
import { useSyncExternalStore } from 'react';
import { useColorScheme as useRNColorScheme } from 'react-native';

const subscribe = () => () => {};

/**
 * To support static rendering, this value needs to be re-calculated on the client side for web
 */
export function useColorScheme() {
  const colorScheme = useRNColorScheme();
  return useSyncExternalStore(
    subscribe,
    () => colorScheme ?? 'light',
    () => 'light'
  );
}
```

### `src\hooks\use-theme.ts`

```text
/**
 * Learn more about light and dark modes:
 * https://docs.expo.dev/guides/color-schemes/
 */

import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export function useTheme() {
  const scheme = useColorScheme();
  const theme = scheme === 'unspecified' ? 'light' : scheme;

  return Colors[theme];
}
```

### `src\services\database.ts`

```text
import * as SQLite from 'expo-sqlite';

import type { MeterReadingRecord, ReadingStatus } from '@/types';

let databasePromise: Promise<SQLite.SQLiteDatabase> | undefined;

async function openDatabase() {
  if (!databasePromise) {
    databasePromise = (async () => {
      const database = await SQLite.openDatabaseAsync('medidores-agua.db');
      await database.execAsync(`
        PRAGMA journal_mode = WAL;
        CREATE TABLE IF NOT EXISTS pending_readings (
          id TEXT PRIMARY KEY NOT NULL,
          meterId TEXT NOT NULL,
          meterCode TEXT NOT NULL,
          readingValue REAL,
          condition TEXT NOT NULL CHECK (condition IN ('normal', 'inaccesible', 'dañado')),
          reasonOrDamageDescription TEXT NOT NULL DEFAULT '',
          photoUri TEXT,
          isAnomalous INTEGER NOT NULL DEFAULT 0,
          status TEXT NOT NULL CHECK (status IN ('pending_verification', 'pending_sync', 'syncing', 'synced')),
          createdAt TEXT NOT NULL,
          monthYear TEXT NOT NULL,
          UNIQUE (meterId, monthYear)
        );
        CREATE INDEX IF NOT EXISTS pending_readings_status_idx ON pending_readings(status);
      `);
      await database.runAsync(
        "UPDATE pending_readings SET status = 'pending_sync' WHERE status = 'syncing'"
      );
      return database;
    })();
  }

  return databasePromise;
}

function mapReading(row: Omit<MeterReadingRecord, 'isAnomalous'> & { isAnomalous: number }) {
  return { ...row, isAnomalous: Boolean(row.isAnomalous) } satisfies MeterReadingRecord;
}

export async function saveReading(record: MeterReadingRecord) {
  const database = await openDatabase();

  await database.withExclusiveTransactionAsync(async (transaction) => {
    const duplicate = await transaction.getFirstAsync<{ id: string }>(
      'SELECT id FROM pending_readings WHERE meterId = ? AND monthYear = ?',
      record.meterId,
      record.monthYear
    );
    if (duplicate) {
      throw new Error('Ya existe una lectura registrada para este medidor durante este mes.');
    }

    await transaction.runAsync(
      `INSERT INTO pending_readings (
        id, meterId, meterCode, readingValue, condition, reasonOrDamageDescription,
        photoUri, isAnomalous, status, createdAt, monthYear
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      record.id,
      record.meterId,
      record.meterCode,
      record.readingValue,
      record.condition,
      record.reasonOrDamageDescription,
      record.photoUri,
      Number(record.isAnomalous),
      record.status,
      record.createdAt,
      record.monthYear
    );
  });
}

export async function getReadings() {
  const database = await openDatabase();
  const rows = await database.getAllAsync<
    Omit<MeterReadingRecord, 'isAnomalous'> & { isAnomalous: number }
  >('SELECT * FROM pending_readings ORDER BY createdAt DESC');
  return rows.map(mapReading);
}

export async function getPendingReadings() {
  const database = await openDatabase();
  const rows = await database.getAllAsync<
    Omit<MeterReadingRecord, 'isAnomalous'> & { isAnomalous: number }
  >(
    "SELECT * FROM pending_readings WHERE status IN ('pending_verification', 'pending_sync') ORDER BY createdAt ASC"
  );
  return rows.map(mapReading);
}

export async function getPendingCount() {
  const database = await openDatabase();
  const result = await database.getFirstAsync<{ count: number }>(
    "SELECT COUNT(*) AS count FROM pending_readings WHERE status IN ('pending_verification', 'pending_sync', 'syncing')"
  );
  return result?.count ?? 0;
}

export async function setReadingStatus(id: string, status: ReadingStatus) {
  const database = await openDatabase();
  await database.runAsync('UPDATE pending_readings SET status = ? WHERE id = ?', status, id);
}

export async function updatePendingReadingValue(id: string, readingValue: number) {
  const database = await openDatabase();
  const result = await database.runAsync(
    `UPDATE pending_readings SET readingValue = ?
     WHERE id = ? AND status IN ('pending_verification', 'pending_sync')`,
    readingValue,
    id
  );

  if (result.changes === 0) {
    throw new Error('Esta lectura ya fue sincronizada y no se puede editar.');
  }
}
```

### `src\services\meter-api.ts`

```text
import { z } from 'zod';

import { config, getMetersUrl } from '@/constants/config';
import type { WaterMeter } from '@/types';

export const meterCodeSchema = z.string().regex(/^MED-\d{6}$/, 'Ingresa un código con formato MED-000000.');

const meterSchema = z.object({
  id: z.union([z.string(), z.number()]).transform(String),
  code: meterCodeSchema,
  accountNumber: z.union([z.string(), z.number()]).transform(String),
  address: z.string(),
  sector: z.string(),
  condition: z.enum(['normal', 'inaccesible', 'dañado']).default('normal'),
  lastReading: z.coerce.number(),
  lastReadingDate: z.string(),
  averageMonthlyConsumption: z.coerce.number(),
});

const demoMeters: WaterMeter[] = [
  {
    id: 'demo-1',
    code: 'MED-000001',
    accountNumber: '1700000001',
    address: 'Av. 6 de Diciembre y Naciones Unidas',
    sector: 'Iñaquito',
    condition: 'normal',
    lastReading: 128,
    lastReadingDate: '2026-09-27',
    averageMonthlyConsumption: 18,
  },
  {
    id: 'demo-2',
    code: 'MED-000002',
    accountNumber: '1700000002',
    address: 'Calle García Moreno N4-12',
    sector: 'Centro Histórico',
    condition: 'normal',
    lastReading: 356,
    lastReadingDate: '2026-09-27',
    averageMonthlyConsumption: 24,
  },
  {
    id: 'demo-3',
    code: 'MED-000003',
    accountNumber: '1700000003',
    address: 'Av. Amazonas y Japón',
    sector: 'La Carolina',
    condition: 'normal',
    lastReading: 82,
    lastReadingDate: '2026-09-27',
    averageMonthlyConsumption: 12,
  },
];

export async function getMeterByCode(code: string): Promise<WaterMeter> {
  const parsedCode = meterCodeSchema.safeParse(code);
  if (!parsedCode.success) {
    throw new Error(parsedCode.error.issues[0]?.message ?? 'El código del medidor no es válido.');
  }

  if (config.demoMode) {
    const meter = demoMeters.find((item) => item.code === code);
    if (!meter) {
      throw new Error('No encontramos ese medidor en los datos de demostración.');
    }
    return meter;
  }

  const response = await fetch(`${getMetersUrl()}?code=${encodeURIComponent(code)}`);
  if (!response.ok) {
    throw new Error(`MockAPI no pudo consultar el medidor (${response.status}).`);
  }

  const payload: unknown = await response.json();
  const items = Array.isArray(payload) ? payload : [payload];
  const matchingMeter = items.find(
    (item) => typeof item === 'object' && item !== null && 'code' in item && item.code === code
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
```

### `src\services\sync-service.ts`

```text
import { config, getReadingsUrl } from '@/constants/config';
import { getPendingReadings, setReadingStatus } from '@/services/database';

async function readingAlreadyExists(readingId: string) {
  const response = await fetch(`${getReadingsUrl()}?clientId=${encodeURIComponent(readingId)}`);
  if (!response.ok) {
    throw new Error(`No se pudo comprobar la sincronización de la lectura (${response.status}).`);
  }

  const payload: unknown = await response.json();
  return Array.isArray(payload) && payload.some(
    (item) =>
      typeof item === 'object' &&
      item !== null &&
      'clientId' in item &&
      item.clientId === readingId
  );
}

export async function syncPendingReadings() {
  if (config.demoMode) {
    return 0;
  }

  const pending = await getPendingReadings();
  let synced = 0;

  for (const reading of pending) {
    await setReadingStatus(reading.id, 'syncing');

    try {
      if (!(await readingAlreadyExists(reading.id))) {
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
      await setReadingStatus(reading.id, 'pending_sync');
      throw error;
    }
  }

  return synced;
}
```

### `src\stores\auth-store.ts`

```text
import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import type { Technician } from '@/types';

type AuthState = {
  technician: Technician | null;
  ready: boolean;
  signIn: (employeeCode: string, name: string) => void;
  signOut: () => void;
  setReady: (ready: boolean) => void;
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      technician: null,
      ready: false,
      signIn: (employeeCode, name) => set({ technician: { employeeCode, name } }),
      signOut: () => set({ technician: null }),
      setReady: (ready) => set({ ready }),
    }),
    {
      name: 'medidores-agua-session',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ technician: state.technician }) as AuthState,
      onRehydrateStorage: () => (state) => state?.setReady(true),
    }
  )
);
```

### `src\stores\draft-store.ts`

```text
import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import type { ReadingDraft } from '@/types';

type DraftState = {
  draft: ReadingDraft | null;
  setDraft: (draft: ReadingDraft) => void;
  clearDraft: () => void;
};

export const useDraftStore = create<DraftState>()(
  persist(
    (set) => ({
      draft: null,
      setDraft: (draft) => set({ draft }),
      clearDraft: () => set({ draft: null }),
    }),
    {
      name: 'medidores-agua-reading-draft',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ draft: state.draft }) as DraftState,
    }
  )
);
```

### `src\types\index.ts`

```text
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
```

### `src\types\styles.d.ts`

```text
declare module '*.module.css' {
  const classes: Record<string, string>;
  export default classes;
}

declare module '*.css';
```

### `tsconfig.json`

```text
{
  "extends": "expo/tsconfig.base",
  "compilerOptions": {
    "strict": true,
    "paths": {
      "@/*": [
        "./src/*"
      ],
      "@/assets/*": [
        "./assets/*"
      ]
    }
  },
  "include": [
    "**/*.ts",
    "**/*.tsx",
    ".expo/types/**/*.ts",
    "expo-env.d.ts"
  ]
}
```
