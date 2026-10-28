import { NativeTabs } from 'expo-router/unstable-native-tabs';
import { StyleSheet } from 'react-native';

import { COLORS } from '@/constants/epmaps-theme';

export default function AppTabs() {
  return (
    <NativeTabs
      backgroundColor={COLORS.surface}
      indicatorColor={COLORS.surfaceSecondary}
      iconColor={{
        default: COLORS.textSecondary,
        selected: COLORS.electricBlue,
      }}
      labelStyle={{
        default: styles.tabLabel,
        selected: styles.selectedTabLabel,
      }}>
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

const styles = StyleSheet.create({
  tabLabel: {
    color: COLORS.textSecondary,
    fontSize: 11,
    fontWeight: '600',
  },
  selectedTabLabel: {
    color: COLORS.electricBlue,
    fontSize: 11,
    fontWeight: '800',
  },
});
