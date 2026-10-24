import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View, type ColorValue } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { GroupedCard, RowSeparator } from '@/components/native/grouped-list';
import { Switch } from '@/components/native/switch';
import { Colors } from '@/constants/theme';
import type { Locale, NumeralSystem } from '@/data/settings';
import { CURRENCIES } from '@/data/types';
import { appearanceLabel, applyAppearance, nextAppearance } from '@/lib/appearance';
import { formatCurrency, toArabicNumerals } from '@/lib/money';
import { useBiometricSetting } from '@/lib/use-biometric-setting';
import { useDataManagement } from '@/lib/use-data-management';
import { useDataActions, useLiabilities, useSettings } from '@/store';

const LOCALE_LABEL: Record<Locale, string> = {
  en: 'English',
  ar: 'Arabic',
};

const NUMERAL_LABEL: Record<NumeralSystem, string> = {
  latin: '0 1 2 3',
  arabic: toArabicNumerals('0 1 2 3'),
};

function Chevron() {
  return (
    <Svg width={8} height={14} viewBox="0 0 8 14">
      <Path
        d="M1 1l6 6-6 6"
        stroke={Colors.disabled}
        strokeWidth={2}
        fill="none"
        strokeLinecap="round"
      />
    </Svg>
  );
}

function LinkedRow({
  color,
  name,
  status,
  statusColor,
  hasSeparator,
}: {
  color: ColorValue;
  name: string;
  status: string;
  statusColor: ColorValue;
  hasSeparator: boolean;
}) {
  return (
    <View style={styles.linkedRow}>
      <View style={[styles.square, { backgroundColor: color }]} />
      <Text style={styles.linkedName}>{name}</Text>
      <Text style={[styles.linkedStatus, { color: statusColor }]}>{status}</Text>
      <Chevron />
      {hasSeparator ? <RowSeparator inset={58} /> : null}
    </View>
  );
}

function NavRow({
  label,
  value,
  onPress,
  hasSeparator,
}: {
  label: string;
  value: string;
  onPress: () => void;
  hasSeparator: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${label}, ${value}`}
      accessibilityHint="Cycles to the next option"
      hitSlop={8}
      style={styles.navRow}
      onPress={onPress}>
      <Text style={styles.navLabel}>{label}</Text>
      <Text style={styles.navValue}>{value}</Text>
      <Chevron />
      {hasSeparator ? <RowSeparator inset={16} /> : null}
    </Pressable>
  );
}

function ActionRow({
  label,
  destructive,
  hint,
  onPress,
  hasSeparator,
}: {
  label: string;
  destructive?: boolean;
  hint?: string;
  onPress: () => void;
  hasSeparator: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={hint}
      hitSlop={8}
      style={styles.actionRow}
      onPress={onPress}>
      <Text style={[styles.actionLabel, destructive ? styles.actionLabelDestructive : null]}>
        {label}
      </Text>
      {hasSeparator ? <RowSeparator inset={16} /> : null}
    </Pressable>
  );
}

export default function NativeSettings() {
  const settings = useSettings();
  const liabilities = useLiabilities();
  const owed = liabilities.reduce((sum, liability) => sum + liability.balance, 0);
  const { updateSettings } = useDataActions();
  const { enabled: biometricEnabled, available: biometricAvailable, setEnabled: setBiometricEnabled } =
    useBiometricSetting();
  const { exportData, importData, confirmDelete } = useDataManagement();

  const cycleLocale = () =>
    void updateSettings({ locale: settings.locale === 'en' ? 'ar' : 'en' });
  const cycleNumerals = () =>
    void updateSettings({
      numeralSystem: settings.numeralSystem === 'latin' ? 'arabic' : 'latin',
    });
  const cycleAppearance = () => {
    const next = nextAppearance(settings.appearance);
    applyAppearance(next);
    void updateSettings({ appearance: next });
  };
  const cycleCurrency = () => {
    const next = CURRENCIES[(CURRENCIES.indexOf(settings.baseCurrency) + 1) % CURRENCIES.length];
    void updateSettings({ baseCurrency: next });
  };

  return (
    <View style={styles.root}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.largeTitle}>Settings</Text>
        </View>

        <View style={styles.profileCard}>
          <View style={styles.profileAvatar}>
            <Text style={styles.profileLetter}>R</Text>
          </View>
          <View style={styles.profileBody}>
            <Text style={styles.profileName}>Rania Haddad</Text>
            <Text style={styles.profileSub}>{`Apple ID, iCloud sync, ${settings.baseCurrency} base`}</Text>
          </View>
          <Chevron />
        </View>

        <Text style={styles.sectionHeader}>Linked accounts</Text>
        <GroupedCard>
          <LinkedRow
            color={Colors.verdigris}
            name="Interactive Brokers"
            status="9:12 AM"
            statusColor={Colors.ash}
            hasSeparator
          />
          <LinkedRow
            color={Colors.brass}
            name="Coinbase"
            status="9:12 AM"
            statusColor={Colors.ash}
            hasSeparator
          />
          <LinkedRow
            color={Colors.umber}
            name="Chase"
            status="Reconnect"
            statusColor={Colors.copper}
            hasSeparator={false}
          />
        </GroupedCard>

        <Text style={styles.sectionHeader}>Language &amp; numbers</Text>
        <GroupedCard>
          <NavRow label="Language" value={LOCALE_LABEL[settings.locale]} onPress={cycleLocale} hasSeparator />
          <NavRow
            label="Numerals"
            value={NUMERAL_LABEL[settings.numeralSystem]}
            onPress={cycleNumerals}
            hasSeparator
          />
          <NavRow
            label="Base currency"
            value={settings.baseCurrency}
            onPress={cycleCurrency}
            hasSeparator
          />
          <NavRow
            label="Appearance"
            value={appearanceLabel(settings.appearance)}
            onPress={cycleAppearance}
            hasSeparator={false}
          />
        </GroupedCard>

        <Text style={styles.sectionHeader}>Net worth</Text>
        <GroupedCard>
          <NavRow
            label="Liabilities"
            value={
              liabilities.length === 0
                ? 'None'
                : formatCurrency(owed, settings.baseCurrency, {
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0,
                  })
            }
            onPress={() => router.push('/native/liabilities')}
            hasSeparator={false}
          />
        </GroupedCard>

        <Text style={styles.sectionHeader}>Privacy</Text>
        <GroupedCard>
          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>Blur figures on launch</Text>
            <Switch
              value={settings.privacyBlur}
              onValueChange={(next) => void updateSettings({ privacyBlur: next })}
              accessibilityLabel="Blur figures on launch"
            />
            <RowSeparator inset={16} />
          </View>
          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>App lock</Text>
            {biometricAvailable === false ? (
              <Text style={styles.unavailable}>Unavailable</Text>
            ) : (
              <Switch
                value={biometricEnabled}
                onValueChange={(next) => void setBiometricEnabled(next)}
                accessibilityLabel="App lock"
              />
            )}
          </View>
        </GroupedCard>

        <Text style={styles.sectionHeader}>Data</Text>
        <GroupedCard>
          <ActionRow label="Export all data" onPress={() => void exportData()} hasSeparator />
          <ActionRow label="Import data" onPress={() => void importData()} hasSeparator />
          <ActionRow
            label="Delete all data"
            destructive
            hint="Permanently removes all data on this device"
            onPress={confirmDelete}
            hasSeparator={false}
          />
        </GroupedCard>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.ink,
  },
  content: {
    paddingTop: 60,
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 44,
  },
  largeTitle: {
    fontSize: 34,
    lineHeight: 41,
    fontWeight: '700',
    letterSpacing: 0.4,
    color: Colors.bone,
  },
  profileCard: {
    marginTop: 20,
    backgroundColor: Colors.surface1,
    borderRadius: 26,
    padding: 16,
    flexDirection: 'row',
    gap: 16,
    alignItems: 'center',
  },
  profileAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.hairline,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileLetter: {
    fontSize: 24,
    fontWeight: '600',
    color: Colors.bone,
  },
  profileBody: {
    flex: 1,
  },
  profileName: {
    fontSize: 20,
    lineHeight: 25,
    fontWeight: '600',
    color: Colors.bone,
  },
  profileSub: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '400',
    color: Colors.ash,
  },
  sectionHeader: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '400',
    textTransform: 'uppercase',
    color: Colors.slate,
    marginTop: 24,
    marginBottom: 8,
    marginLeft: 16,
  },
  linkedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minHeight: 52,
    paddingHorizontal: 16,
  },
  square: {
    width: 30,
    height: 30,
    borderRadius: 7,
  },
  linkedName: {
    flex: 1,
    fontSize: 17,
    lineHeight: 22,
    fontWeight: '400',
    color: Colors.bone,
  },
  linkedStatus: {
    fontSize: 15,
  },
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 48,
    paddingHorizontal: 16,
  },
  navLabel: {
    flex: 1,
    fontSize: 17,
    lineHeight: 22,
    fontWeight: '400',
    color: Colors.bone,
  },
  navValue: {
    fontSize: 17,
    lineHeight: 22,
    fontWeight: '400',
    color: Colors.ash,
    marginRight: 8,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 48,
    paddingHorizontal: 16,
  },
  switchLabel: {
    flex: 1,
    fontSize: 17,
    lineHeight: 22,
    fontWeight: '400',
    color: Colors.bone,
  },
  unavailable: {
    fontSize: 17,
    lineHeight: 22,
    fontWeight: '400',
    color: Colors.ash,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 48,
    paddingHorizontal: 16,
  },
  actionLabel: {
    flex: 1,
    fontSize: 17,
    lineHeight: 22,
    fontWeight: '400',
    color: Colors.bone,
  },
  actionLabelDestructive: {
    color: Colors.destructive,
  },
});
