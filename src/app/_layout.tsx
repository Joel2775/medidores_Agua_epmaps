import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { DefaultTheme, ThemeProvider } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { ConnectionBanner } from '@/components/connection-banner';
import AppTabs from '@/components/app-tabs';
import { config } from '@/constants/config';
import { COLORS } from '@/constants/epmaps-theme';

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
  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider value={DefaultTheme}>
          <View style={styles.container}>
            <ConnectionBanner />
            <AppTabs />
          </View>
        </ThemeProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
});
