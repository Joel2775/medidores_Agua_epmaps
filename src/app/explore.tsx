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

import { ClayCard } from '@/components/clay-card';
import { COLORS, RADIUS, SHADOWS, SPACING } from '@/constants/epmaps-theme';
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
    <View style={styles.screen}>
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
            <ClayCard>
              <Text style={styles.emptyTitle}>Aún no hay registros</Text>
              <Text style={styles.empty}>Las lecturas que guardes aparecerán aquí.</Text>
            </ClayCard>
          ) : null}

          {readingsQuery.data?.map((reading) => {
            const canEdit =
              (reading.status === 'pending_verification' || reading.status === 'pending_sync') &&
              reading.condition !== 'inaccesible';
            const statusStyle =
              reading.status === 'synced'
                ? { chip: styles.syncedChip, text: styles.syncedText }
                : reading.status === 'syncing'
                  ? { chip: styles.syncingChip, text: styles.syncingText }
                  : { chip: styles.pendingChip, text: styles.pendingText };

            let lockedMessage = 'Registro bloqueado para edición.';
            if (reading.status === 'synced') {
              lockedMessage = 'Lectura ya enviada. No se puede editar.';
            } else if (reading.status === 'syncing') {
              lockedMessage = 'Sincronizando... No se puede editar mientras se envía.';
            } else if (reading.condition === 'inaccesible') {
              lockedMessage = 'No se puede editar la lectura para medidores inaccesibles.';
            }

            return (
              <ClayCard key={reading.id} style={styles.readingCard}>
                <View style={styles.heading}>
                  <View>
                    <Text style={styles.code}>{reading.meterCode}</Text>
                    <Text style={styles.date}>
                      {new Date(reading.createdAt).toLocaleDateString('es-EC')} · {reading.monthYear}
                    </Text>
                  </View>
                  <View style={[styles.statusChip, statusStyle.chip]}>
                    <Text style={[styles.statusText, statusStyle.text]}>
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
                      setSavedMessage('');
                    }}
                    style={styles.editButton}>
                    <Text style={styles.editText}>Editar lectura pendiente</Text>
                  </Pressable>
                ) : (
                  <Text style={styles.locked}>{lockedMessage}</Text>
                )}
              </ClayCard>
            );
          })}
        </ScrollView>

        <Modal
          visible={Boolean(selectedReading)}
          transparent
          animationType="fade"
          onRequestClose={() => setSelectedReading(null)}>
          <View style={styles.modalBackdrop}>
            <ClayCard style={styles.modalCard}>
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
            </ClayCard>
          </View>
        </Modal>
      </SafeAreaView>
    </View>
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
  screen: { flex: 1, backgroundColor: COLORS.background },
  safeArea: { flex: 1 },
  content: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.xl,
    paddingBottom: SPACING.huge,
    gap: SPACING.md,
  },
  eyebrow: {
    color: COLORS.secondaryBlue,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.1,
  },
  title: {
    color: COLORS.textPrimary,
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: -0.8,
    marginTop: -SPACING.xs,
  },
  subtitle: {
    color: COLORS.textSecondary,
    fontSize: 14,
    lineHeight: 20,
    marginTop: -SPACING.xs,
    marginBottom: SPACING.xs,
  },
  readingCard: { marginBottom: 0 },
  heading: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: SPACING.sm,
  },
  code: { color: COLORS.textPrimary, fontSize: 17, fontWeight: '800' },
  date: { color: COLORS.textMuted, fontSize: 12, marginTop: SPACING.xs },
  statusChip: {
    borderRadius: RADIUS.pill,
    borderWidth: 1,
    backgroundColor: COLORS.surfaceSecondary,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.sm,
    maxWidth: 150,
  },
  syncedChip: { borderColor: COLORS.success },
  syncingChip: { borderColor: COLORS.secondaryBlue },
  pendingChip: { borderColor: COLORS.gold },
  statusText: { fontSize: 10, lineHeight: 13, textAlign: 'center', fontWeight: '800' },
  syncedText: { color: COLORS.success },
  syncingText: { color: COLORS.secondaryBlue },
  pendingText: { color: COLORS.gold },
  divider: { height: 1, backgroundColor: COLORS.border, marginVertical: SPACING.md },
  detail: { marginBottom: SPACING.sm },
  detailLabel: { color: COLORS.textMuted, fontSize: 12, marginBottom: SPACING.xs },
  detailValue: { color: COLORS.textPrimary, fontSize: 14, fontWeight: '600', lineHeight: 19 },
  anomaly: { color: COLORS.gold, fontSize: 12, fontWeight: '700', marginTop: SPACING.xs },
  photo: { color: COLORS.success, fontSize: 12, marginTop: SPACING.xs },
  editButton: {
    backgroundColor: COLORS.surfaceSecondary,
    borderColor: COLORS.secondaryBlue,
    borderWidth: 1,
    borderRadius: RADIUS.medium,
    minHeight: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: SPACING.md,
    ...SHADOWS.soft,
  },
  editText: { color: COLORS.secondaryBlue, fontSize: 13, fontWeight: '800' },
  locked: { color: COLORS.textMuted, fontSize: 12, marginTop: SPACING.md, textAlign: 'center' },
  emptyTitle: { color: COLORS.textPrimary, fontSize: 17, fontWeight: '800', marginBottom: SPACING.sm },
  empty: { color: COLORS.textSecondary, fontSize: 14, lineHeight: 20 },
  success: {
    color: COLORS.success,
    backgroundColor: COLORS.surfaceSecondary,
    borderWidth: 1,
    borderColor: COLORS.success,
    padding: SPACING.md,
    borderRadius: RADIUS.small,
    fontSize: 13,
  },
  error: {
    color: COLORS.error,
    backgroundColor: COLORS.surfaceSecondary,
    borderWidth: 1,
    borderColor: COLORS.error,
    padding: SPACING.md,
    borderRadius: RADIUS.small,
    fontSize: 13,
    marginTop: SPACING.xs,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: `${COLORS.deepBlue}66`,
    justifyContent: 'center',
    padding: SPACING.xl,
  },
  modalCard: { alignSelf: 'stretch' },
  modalTitle: {
    color: COLORS.textPrimary,
    fontSize: 20,
    fontWeight: '800',
    marginTop: SPACING.xs,
    marginBottom: SPACING.sm,
  },
  fieldLabel: {
    color: COLORS.textPrimary,
    fontSize: 13,
    fontWeight: '700',
    marginBottom: SPACING.sm,
  },
  input: {
    color: COLORS.textPrimary,
    minHeight: 52,
    borderRadius: RADIUS.medium,
    paddingHorizontal: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surfaceSecondary,
    fontSize: 15,
    marginBottom: SPACING.md,
  },
  saveButton: {
    minHeight: 52,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: RADIUS.medium,
    backgroundColor: COLORS.electricBlue,
    ...SHADOWS.primary,
  },
  saveText: { color: COLORS.surface, fontSize: 14, fontWeight: '800' },
  cancelButton: { alignItems: 'center', paddingVertical: SPACING.md, marginTop: SPACING.xs },
  cancelText: { color: COLORS.textSecondary, fontSize: 14, fontWeight: '700' },
});
