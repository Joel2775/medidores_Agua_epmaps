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