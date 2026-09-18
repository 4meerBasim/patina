import { router } from 'expo-router';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import Animated, { Easing, SlideInDown } from 'react-native-reanimated';

import { GroupedCard, RowSeparator } from '@/components/native/grouped-list';
import { SegmentedControl } from '@/components/native/segmented-control';
import { Colors } from '@/constants/theme';
import { formatDollars, parseAmount } from '@/lib/amount';

const NET_WORTH = 1284930.42;
const DEFAULT_PRICE = 248.2;

const sheetEnter = SlideInDown.duration(400).easing(Easing.bezier(0.2, 0.8, 0.2, 1));

export default function NativeAdd() {
  const [assetType, setAssetType] = useState(0);
  const [shares, setShares] = useState('50');
  const [price, setPrice] = useState('');
  const [notes, setNotes] = useState('');

  const sharesValue = parseAmount(shares) ?? 0;
  const priceValue = parseAmount(price) ?? DEFAULT_PRICE;
  const amount = sharesValue * priceValue;
  const percent = ((amount / NET_WORTH) * 100).toFixed(2);

  return (
    <View style={styles.root}>
      <View style={styles.fadedCard} />
      <Animated.View entering={sheetEnter} style={styles.sheet}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={64}
          style={styles.sheetInner}>
          <View style={styles.grabber} />
          <View style={styles.navRow}>
            <Pressable accessibilityRole="button" hitSlop={12} onPress={() => router.back()}>
              <Text style={styles.navAction}>Cancel</Text>
            </Pressable>
            <Text style={styles.navTitle}>New Holding</Text>
            <Pressable accessibilityRole="button" hitSlop={12} onPress={() => router.back()}>
              <Text style={styles.navAction}>Add</Text>
            </Pressable>
          </View>

          <ScrollView
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            automaticallyAdjustKeyboardInsets={Platform.OS === 'ios'}>
            <SegmentedControl
              options={['Stock', 'Crypto', 'Property', 'Cash', 'Savings']}
              selectedIndex={assetType}
              onSelect={setAssetType}
              style={styles.segment}
            />

            <GroupedCard style={styles.firstCard}>
              <View style={styles.row}>
                <Text style={styles.rowLabel}>Security</Text>
                <Text style={styles.rowValueMuted}>Apple · AAPL</Text>
                <RowSeparator inset={16} />
              </View>
              <View style={styles.row}>
                <Text style={styles.rowLabel}>Shares</Text>
                <TextInput
                  accessibilityLabel="Shares"
                  style={styles.input}
                  value={shares}
                  onChangeText={setShares}
                  autoFocus
                  keyboardType="decimal-pad"
                  cursorColor={Colors.brass}
                  selectionColor={Colors.brass}
                />
                <RowSeparator inset={16} />
              </View>
              <View style={styles.row}>
                <Text style={styles.rowLabel}>Price per share</Text>
                <TextInput
                  accessibilityLabel="Price per share"
                  style={styles.input}
                  value={price}
                  onChangeText={setPrice}
                  placeholder="$248.20"
                  placeholderTextColor={Colors.disabled}
                  keyboardType="decimal-pad"
                  cursorColor={Colors.brass}
                  selectionColor={Colors.brass}
                />
                <RowSeparator inset={16} />
              </View>
              <View style={styles.row}>
                <Text style={styles.rowLabel}>Acquired</Text>
                <View style={styles.acquiredChip}>
                  <Text style={styles.acquiredText}>Today</Text>
                </View>
              </View>
            </GroupedCard>

            <Text style={styles.footnote}>
              Adds {formatDollars(amount)} · {percent}% of net worth
            </Text>

            <GroupedCard style={styles.secondCard}>
              <View style={styles.row}>
                <Text style={styles.rowLabel}>Account</Text>
                <Text style={styles.rowValueMuted}>Interactive Brokers ›</Text>
                <RowSeparator inset={16} />
              </View>
              <View style={styles.row}>
                <Text style={styles.rowLabel}>Notes</Text>
                <TextInput
                  accessibilityLabel="Notes"
                  style={styles.input}
                  value={notes}
                  onChangeText={setNotes}
                  placeholder="Optional"
                  placeholderTextColor={Colors.disabled}
                  cursorColor={Colors.brass}
                  selectionColor={Colors.brass}
                />
              </View>
            </GroupedCard>
          </ScrollView>
        </KeyboardAvoidingView>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.black,
  },
  fadedCard: {
    position: 'absolute',
    top: 44,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: Colors.ink,
    borderRadius: 40,
    opacity: 0.5,
    transform: [{ scale: 0.92 }],
    transformOrigin: 'top',
  },
  sheet: {
    position: 'absolute',
    top: 64,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: Colors.surface2,
    borderTopLeftRadius: 38,
    borderTopRightRadius: 38,
    paddingHorizontal: 16,
  },
  sheetInner: {
    flex: 1,
  },
  grabber: {
    width: 36,
    height: 5,
    borderRadius: 3,
    backgroundColor: Colors.disabled,
    marginTop: 8,
    alignSelf: 'center',
  },
  navRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: 56,
  },
  navAction: {
    fontSize: 17,
    fontWeight: '600',
    color: Colors.brass,
  },
  navTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: Colors.bone,
  },
  segment: {
    marginTop: 8,
  },
  firstCard: {
    marginTop: 24,
  },
  secondCard: {
    marginTop: 24,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    minHeight: 48,
    paddingHorizontal: 16,
  },
  rowLabel: {
    fontSize: 17,
    lineHeight: 22,
    fontWeight: '400',
    color: Colors.bone,
  },
  rowValueMuted: {
    fontSize: 17,
    lineHeight: 22,
    fontWeight: '400',
    color: Colors.ash,
    fontVariant: ['tabular-nums'],
  },
  input: {
    flex: 1,
    textAlign: 'right',
    fontSize: 17,
    lineHeight: 22,
    fontWeight: '400',
    color: Colors.bone,
    padding: 0,
    marginLeft: 16,
    fontVariant: ['tabular-nums'],
  },
  acquiredChip: {
    backgroundColor: Colors.segmentTrack,
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  acquiredText: {
    fontSize: 15,
    color: Colors.ash,
  },
  footnote: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '400',
    color: Colors.slate,
    marginTop: 8,
    marginHorizontal: 16,
    fontVariant: ['tabular-nums'],
  },
});
