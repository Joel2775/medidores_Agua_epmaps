import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { useQueryClient } from '@tanstack/react-query';

import { config } from '@/constants/config';
import { COLORS, RADIUS, SHADOWS, SPACING } from '@/constants/epmaps-theme';
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
        <View
          style={[
            styles.dot,
            online === null ? styles.checking : online ? styles.online : styles.offline,
          ]}
        />
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
  wrapper: { paddingHorizontal: SPACING.lg, paddingTop: SPACING.sm },
  banner: {
    minHeight: 40,
    borderRadius: RADIUS.medium,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    ...SHADOWS.soft,
  },
  dot: { width: 9, height: 9, borderRadius: 5 },
  checking: { backgroundColor: COLORS.secondaryBlue },
  online: { backgroundColor: COLORS.success },
  offline: { backgroundColor: COLORS.error },
  label: { color: COLORS.textPrimary, fontSize: 11, fontWeight: '800', letterSpacing: 0.5 },
  pending: { color: COLORS.textSecondary, fontSize: 11, marginLeft: 'auto' },
  demo: {
    color: COLORS.secondaryBlue,
    backgroundColor: COLORS.surfaceSecondary,
    fontSize: 10,
    fontWeight: '800',
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.small,
  },
  error: {
    color: COLORS.error,
    fontSize: 12,
    marginTop: SPACING.xs,
    paddingHorizontal: SPACING.xs,
  },
});
