import { z } from 'zod';
import { File, Paths } from 'expo-file-system';
import * as ImagePicker from 'expo-image-picker';
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

import { ClayCard } from '@/components/clay-card';
import { config } from '@/constants/config';
import { COLORS, RADIUS, SHADOWS, SPACING } from '@/constants/epmaps-theme';
import { getMeterByCode, meterCodeSchema } from '@/services/meter-api';
import { saveReading } from '@/services/database';
import { syncPendingReadings } from '@/services/sync-service';
import { useAuthStore } from '@/stores/auth-store';
import { useDraftStore } from '@/stores/draft-store';
import type { MeterCondition, ReadingDraft, WaterMeter } from '@/types';

const readingValueSchema = z.coerce.number().finite().nonnegative();

const conditionOptions: { value: MeterCondition; label: string }[] = [
  { value: 'normal', label: 'Normal' },
  { value: 'inaccesible', label: 'Inaccesible' },
  { value: 'dañado', label: 'Dañado' },
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
    const code = employeeCode.trim().toUpperCase();
    const pass = password.trim();

    if (!code || !pass) {
      setErrorMessage('Ingresa el código de empleado y la clave para continuar.');
      return;
    }

    const hardcodedUsers: Record<string, { password: string; name: string }> = {
      'TEC-001': { password: '123456', name: 'Técnico TEC-001' },
    };

    const user = hardcodedUsers[code];

    if (!user || user.password !== pass) {
      setErrorMessage('Código de empleado o clave incorrectos.');
      return;
    }

    signIn(code, user.name);
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

      try {
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
      } catch (error) {
        if (error instanceof Error && error.message.includes('Ya existe una lectura registrada')) {
          setErrorMessage('Ya existe una lectura registrada para este medidor en este mes. No se puede registrar dos veces.');
          setIsSaving(false);
          return;
        }
        throw error;
      }

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
    <View style={styles.screen}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        {!ready ? (
          <View style={styles.center}>
            <Text style={styles.bodyText}>Cargando sesión...</Text>
          </View>
        ) : !technician ? (
          <ScrollView contentContainerStyle={styles.loginContent} keyboardShouldPersistTaps="handled">
            <BrandHeader />
            <ClayCard>
              <Text style={styles.eyebrow}>ACCESO DE DEMOSTRACIÓN</Text>
              <Text style={styles.cardTitle}>Hola, técnico</Text>
              <Text style={styles.bodyText}>
                Ingresa con tu código de empleado para iniciar el recorrido.
              </Text>
              <TextInput
                autoCapitalize="characters"
                placeholder="Código de empleado (ej. TEC-001)"
                placeholderTextColor={COLORS.textMuted}
                value={employeeCode}
                onChangeText={setEmployeeCode}
                style={styles.input}
                accessibilityLabel="Código de empleado"
              />
              <TextInput
                placeholder="Clave"
                placeholderTextColor={COLORS.textMuted}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                style={styles.input}
                accessibilityLabel="Clave"
              />
              <PrimaryButton title="Ingresar a la jornada" onPress={signInAsDemo} />
              <ErrorNotice message={errorMessage} />
            </ClayCard>
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

            <ClayCard style={styles.searchCard}>
              <Text style={styles.eyebrow}>CONSULTAR MEDIDOR</Text>
              <Text style={styles.cardTitle}>Busca por código</Text>
              <Text style={styles.bodyText}>Formato requerido: MED- seguido de 6 dígitos.</Text>
              <View style={styles.searchRow}>
                <TextInput
                  autoCapitalize="characters"
                  autoCorrect={false}
                  maxLength={10}
                  placeholder="MED-000000"
                  placeholderTextColor={COLORS.textMuted}
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
            </ClayCard>

            {meter ? (
              <ClayCard style={styles.meterCard}>
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
                        condition === option.value &&
                          (option.value === 'normal'
                            ? styles.selectedNormal
                            : option.value === 'inaccesible'
                              ? styles.selectedInaccessible
                              : styles.selectedDamaged),
                      ]}>
                      <View
                        style={[
                          styles.conditionDot,
                          option.value === 'normal'
                            ? styles.normalDot
                            : option.value === 'inaccesible'
                              ? styles.inaccessibleDot
                              : styles.damagedDot,
                        ]}
                      />
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
                      placeholderTextColor={COLORS.textMuted}
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
                      placeholderTextColor={COLORS.textMuted}
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
              </ClayCard>
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
            <ClayCard style={styles.modalCard}>
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
            </ClayCard>
          </View>
        </Modal>
      </SafeAreaView>
    </View>
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
  screen: { flex: 1, backgroundColor: COLORS.background },
  safeArea: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loginContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignSelf: 'center',
    width: '100%',
    maxWidth: 560,
    padding: SPACING.xl,
    gap: SPACING.xl,
  },
  loginHero: { alignItems: 'center', gap: SPACING.sm },
  logoMark: {
    width: 64,
    height: 64,
    borderRadius: RADIUS.large,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.electricBlue,
    ...SHADOWS.primary,
  },
  logoMarkText: { color: COLORS.surface, fontSize: 28, fontWeight: '800' },
  brandName: { color: COLORS.textPrimary, fontSize: 25, fontWeight: '800', letterSpacing: -0.5 },
  loginSubtitle: { color: COLORS.textSecondary, fontSize: 14 },
  content: {
    alignSelf: 'center',
    width: '100%',
    maxWidth: 680,
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.base,
    paddingBottom: SPACING.huge,
    gap: SPACING.lg,
  },
  topLine: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  eyebrow: {
    color: COLORS.secondaryBlue,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.1,
  },
  greeting: { color: COLORS.textPrimary, fontSize: 17, fontWeight: '700', marginTop: SPACING.xs },
  signOut: { color: COLORS.secondaryBlue, fontSize: 12, fontWeight: '700', padding: SPACING.sm },
  hero: {
    padding: SPACING.lg,
    minHeight: 162,
    justifyContent: 'center',
    borderRadius: RADIUS.extraLarge,
    backgroundColor: COLORS.surfaceSecondary,
    borderWidth: 1,
    borderColor: COLORS.surface,
  },
  heroMark: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.small,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.sm,
    ...SHADOWS.soft,
  },
  heroDrop: { fontSize: 18, color: COLORS.electricBlue, fontWeight: '800' },
  heroTitle: {
    color: COLORS.textPrimary,
    fontWeight: '800',
    fontSize: 32,
    lineHeight: 36,
    letterSpacing: -0.8,
  },
  heroSubtitle: {
    color: COLORS.textSecondary,
    fontSize: 14,
    lineHeight: 21,
    marginTop: SPACING.sm,
    maxWidth: 310,
  },
  searchCard: { marginBottom: 0 },
  cardTitle: {
    color: COLORS.textPrimary,
    fontSize: 20,
    fontWeight: '800',
    marginTop: SPACING.xs,
    marginBottom: SPACING.xs,
  },
  bodyText: {
    color: COLORS.textSecondary,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: SPACING.md,
  },
  input: {
    color: COLORS.textPrimary,
    minHeight: 52,
    borderRadius: RADIUS.medium,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surfaceSecondary,
    fontSize: 15,
    marginBottom: SPACING.md,
  },
  searchRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    alignItems: 'flex-start',
    marginTop: SPACING.sm,
  },
  searchInput: { flex: 1, marginBottom: 0 },
  primaryButton: {
    minHeight: 52,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: RADIUS.medium,
    paddingHorizontal: SPACING.lg,
    backgroundColor: COLORS.electricBlue,
    ...SHADOWS.primary,
  },
  compactButton: { minWidth: 90, minHeight: 52 },
  primaryButtonText: { color: COLORS.surface, fontSize: 14, fontWeight: '800' },
  disabledButton: { opacity: 0.58 },
  pressedButton: { opacity: 0.9, transform: [{ scale: 0.97 }] },
  helper: {
    color: COLORS.textMuted,
    fontSize: 12,
    lineHeight: 18,
    marginTop: SPACING.sm,
  },
  errorText: {
    color: COLORS.error,
    backgroundColor: COLORS.surfaceSecondary,
    borderWidth: 1,
    borderColor: COLORS.error,
    borderRadius: RADIUS.small,
    overflow: 'hidden',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    fontSize: 13,
    lineHeight: 18,
    marginTop: SPACING.sm,
  },
  noticeText: {
    color: COLORS.success,
    backgroundColor: COLORS.surfaceSecondary,
    borderWidth: 1,
    borderColor: COLORS.success,
    borderRadius: RADIUS.small,
    overflow: 'hidden',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    fontSize: 13,
    marginTop: SPACING.sm,
  },
  meterCard: { marginTop: 0 },
  meterHeading: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  normalChip: {
    backgroundColor: COLORS.surfaceSecondary,
    borderColor: COLORS.success,
    borderWidth: 1,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.pill,
  },
  normalChipText: { color: COLORS.success, fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },
  inaccessibleChip: { borderColor: COLORS.gold },
  inaccessibleChipText: { color: COLORS.gold },
  damagedChip: { borderColor: COLORS.primary },
  damagedChipText: { color: COLORS.primary },
  detailsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: SPACING.md,
    rowGap: SPACING.md,
  },
  detail: { width: '50%', paddingRight: SPACING.sm, gap: SPACING.xs },
  detailWide: { width: '100%' },
  detailLabel: { color: COLORS.textMuted, fontSize: 12 },
  detailValue: { color: COLORS.textPrimary, fontSize: 14, fontWeight: '700', lineHeight: 19 },
  divider: { height: 1, backgroundColor: COLORS.border, marginVertical: SPACING.base },
  sectionTitle: {
    color: COLORS.textPrimary,
    fontSize: 15,
    fontWeight: '800',
    marginBottom: SPACING.md,
  },
  conditionRow: { flexDirection: 'row', gap: SPACING.sm, marginBottom: SPACING.base },
  conditionButton: {
    flex: 1,
    minHeight: 46,
    borderRadius: RADIUS.medium,
    backgroundColor: COLORS.surfaceSecondary,
    borderWidth: 1,
    borderColor: COLORS.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.xs,
    paddingHorizontal: SPACING.xs,
  },
  selectedNormal: { borderColor: COLORS.success, backgroundColor: COLORS.surface },
  selectedInaccessible: { borderColor: COLORS.gold, backgroundColor: COLORS.surface },
  selectedDamaged: { borderColor: COLORS.primary, backgroundColor: COLORS.surface },
  conditionDot: { width: 8, height: 8, borderRadius: 4 },
  normalDot: { backgroundColor: COLORS.success },
  inaccessibleDot: { backgroundColor: COLORS.gold },
  damagedDot: { backgroundColor: COLORS.primary },
  conditionLabel: { color: COLORS.textPrimary, fontSize: 11, fontWeight: '700' },
  fieldLabel: {
    color: COLORS.textPrimary,
    fontSize: 13,
    fontWeight: '700',
    marginBottom: SPACING.sm,
  },
  multilineInput: { minHeight: 84, textAlignVertical: 'top' },
  anomalyCard: {
    backgroundColor: COLORS.surfaceSecondary,
    borderWidth: 1,
    borderColor: COLORS.gold,
    padding: SPACING.md,
    borderRadius: RADIUS.medium,
    marginBottom: SPACING.md,
  },
  anomalyTitle: {
    color: COLORS.deepBlue,
    fontSize: 14,
    fontWeight: '800',
    marginBottom: SPACING.xs,
  },
  anomalyBody: { color: COLORS.textSecondary, fontSize: 12, lineHeight: 18 },
  confirmText: { color: COLORS.deepBlue, fontSize: 13, fontWeight: '800', marginTop: SPACING.sm },
  photoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: SPACING.sm,
    marginBottom: SPACING.xs,
  },
  photoButton: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.small,
    backgroundColor: COLORS.surfaceSecondary,
    borderWidth: 1,
    borderColor: COLORS.secondaryBlue,
  },
  photoButtonText: { color: COLORS.secondaryBlue, fontSize: 12, fontWeight: '800' },
  footerText: {
    textAlign: 'center',
    color: COLORS.textMuted,
    fontSize: 12,
    paddingTop: SPACING.xs,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: `${COLORS.deepBlue}66`,
    justifyContent: 'center',
    padding: SPACING.xl,
  },
  modalCard: { alignSelf: 'stretch' },
  discardButton: { alignItems: 'center', paddingVertical: SPACING.md, marginTop: SPACING.xs },
  discardText: { color: COLORS.textSecondary, fontSize: 13, fontWeight: '700' },
});
