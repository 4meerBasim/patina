import { router } from 'expo-router';
import { useState } from 'react';
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import Animated, { Easing, SlideInDown } from 'react-native-reanimated';

import { Caption } from '@/components/editorial/caption';
import { InstrumentSearch } from '@/components/editorial/instrument-search';
import { Colors, Fonts } from '@/constants/theme';
import type { Account, AssetClass, Instrument, InstrumentKind } from '@/data/types';
import { formatDollars, parseAmount } from '@/lib/amount';
import { useAccounts, useDataActions, useHoldings, useNetWorth } from '@/store';

const FALLBACK_PRICE = 248.2;

const KIND_NOUN: Record<InstrumentKind, string> = {
  stock: 'stock',
  etf: 'fund',
  crypto: 'crypto',
};

function assetClassFor(kind: InstrumentKind): AssetClass {
  return kind === 'crypto' ? 'crypto' : 'stocks';
}

function accountFor(accounts: Account[], kind: InstrumentKind): Account | undefined {
  const preferred = kind === 'crypto' ? 'exchange' : 'brokerage';
  return accounts.find((account) => account.kind === preferred) ?? accounts[0];
}

export default function AddHoldingScreen() {
  const [instrument, setInstrument] = useState<Instrument | null>(null);
  const [quantity, setQuantity] = useState('50');
  const [price, setPrice] = useState('');
  const [isQuantityFocused, setIsQuantityFocused] = useState(true);
  const [isPriceFocused, setIsPriceFocused] = useState(false);

  const netWorth = useNetWorth();
  const holdings = useHoldings();
  const accounts = useAccounts();
  const { addHolding, updateHolding, addTransaction } = useDataActions();

  const existing = instrument
    ? holdings.find((holding) => holding.instrumentId === instrument.id)
    : undefined;
  const defaultPrice =
    existing && existing.quantity > 0 ? existing.value / existing.quantity : FALLBACK_PRICE;

  const quantityValue = parseAmount(quantity) ?? 0;
  const priceValue = parseAmount(price) ?? defaultPrice;
  const total = quantityValue * priceValue;
  const weight = netWorth.total > 0 ? (total / netWorth.total) * 100 : 0;

  const onSubmit = async () => {
    if (!instrument || quantityValue <= 0) {
      router.back();
      return;
    }
    const currency = instrument.currency;
    let holdingId: string;
    let accountId: string;
    if (existing) {
      holdingId = existing.id;
      accountId = existing.accountId;
      await updateHolding({
        id: existing.id,
        accountId: existing.accountId,
        assetClass: existing.assetClass,
        instrumentId: existing.instrumentId,
        name: existing.name,
        quantity: existing.quantity + quantityValue,
        currency: existing.currency,
      });
    } else {
      const account = accountFor(accounts, instrument.kind);
      if (!account) {
        router.back();
        return;
      }
      accountId = account.id;
      holdingId = await addHolding({
        accountId,
        assetClass: assetClassFor(instrument.kind),
        instrumentId: instrument.id,
        name: null,
        quantity: quantityValue,
        currency,
      });
    }
    await addTransaction({
      holdingId,
      accountId,
      type: 'buy',
      quantity: quantityValue,
      price: priceValue,
      amount: -total,
      currency,
      date: new Date().toISOString().slice(0, 10),
      note: null,
    });
    router.back();
  };

  return (
    <View style={styles.backdrop}>
      <Animated.View
        style={styles.sheet}
        entering={SlideInDown.duration(400).easing(Easing.bezier(0.2, 0.8, 0.2, 1))}>
        <KeyboardAvoidingView
          style={styles.content}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={70}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Close"
            hitSlop={{ top: 24, bottom: 24, left: 24, right: 24 }}
            style={styles.grabberHit}
            onPress={() => router.back()}>
            <View style={styles.grabber} />
          </Pressable>

          <Caption>New holding</Caption>

          {instrument ? (
            <Pressable style={styles.fill} accessible={false} onPress={Keyboard.dismiss}>
              <View style={styles.sentence}>
                <Text style={styles.sentenceText}>A </Text>
                <View style={styles.fragment}>
                  <Text style={[styles.sentenceText, styles.fragmentText]}>
                    {KIND_NOUN[instrument.kind]}
                  </Text>
                </View>
                <Text style={styles.sentenceText}> — </Text>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`${instrument.name}, ${instrument.symbol}. Change instrument`}
                  hitSlop={{ top: 10, bottom: 10, left: 6, right: 6 }}
                  style={styles.fragment}
                  onPress={() => setInstrument(null)}>
                  <Text style={[styles.sentenceText, styles.fragmentText]}>
                    {instrument.name}, {instrument.symbol}
                  </Text>
                </Pressable>
                <Text style={styles.sentenceText}> —</Text>
              </View>

              <Text style={styles.question}>How much?</Text>

              <View style={styles.inputs}>
                <View style={styles.inputColumn}>
                  <Caption>Quantity</Caption>
                  <TextInput
                    accessibilityLabel="Quantity"
                    style={[
                      styles.field,
                      isQuantityFocused ? styles.fieldFocused : styles.fieldBlurred,
                    ]}
                    value={quantity}
                    onChangeText={setQuantity}
                    onFocus={() => setIsQuantityFocused(true)}
                    onBlur={() => setIsQuantityFocused(false)}
                    autoFocus
                    keyboardType="decimal-pad"
                    cursorColor={Colors.brass}
                    selectionColor={Colors.brass}
                  />
                </View>
                <View style={styles.inputColumn}>
                  <Caption>Price</Caption>
                  <TextInput
                    accessibilityLabel="Price"
                    style={[
                      styles.field,
                      isPriceFocused ? styles.fieldFocused : styles.fieldBlurred,
                    ]}
                    value={price}
                    onChangeText={setPrice}
                    onFocus={() => setIsPriceFocused(true)}
                    onBlur={() => setIsPriceFocused(false)}
                    placeholder={formatDollars(defaultPrice)}
                    placeholderTextColor={Colors.slate}
                    keyboardType="decimal-pad"
                    cursorColor={Colors.brass}
                    selectionColor={Colors.brass}
                  />
                </View>
              </View>

              <Text style={styles.live}>
                That&apos;s <Text style={styles.liveTotal}>{formatDollars(total)}</Text> ·{' '}
                {weight.toFixed(2)}% of net worth
              </Text>

              <View style={styles.spacer} />

              <View style={styles.footer}>
                <Text style={styles.step}>3 of 4 · acquired date next</Text>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Next"
                  style={styles.nextButton}
                  onPress={() => {
                    void onSubmit();
                  }}>
                  <Text style={styles.nextLabel}>Next</Text>
                </Pressable>
              </View>
            </Pressable>
          ) : (
            <>
              <Text style={styles.question}>What are you adding?</Text>
              <InstrumentSearch onPick={setInstrument} />
            </>
          )}
        </KeyboardAvoidingView>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: Colors.ink,
  },
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 70,
    bottom: 0,
    backgroundColor: Colors.surface2,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 14,
  },
  fill: {
    flex: 1,
  },
  grabberHit: {
    alignSelf: 'center',
    marginBottom: 20,
  },
  grabber: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.hairline,
  },
  sentence: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'flex-start',
    marginTop: 12,
  },
  sentenceText: {
    fontFamily: Fonts.newsreader24,
    fontSize: 24,
    lineHeight: 32,
    color: Colors.ash,
  },
  fragment: {
    height: 29,
    borderBottomWidth: 1,
    borderBottomColor: Colors.brass,
  },
  fragmentText: {
    color: Colors.bone,
  },
  question: {
    fontFamily: Fonts.newsreader24,
    fontSize: 24,
    lineHeight: 32,
    color: Colors.bone,
    marginTop: 28,
  },
  inputs: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 20,
  },
  inputColumn: {
    flex: 1,
  },
  field: {
    fontFamily: Fonts.newsreaderLight32,
    fontSize: 32,
    lineHeight: 40,
    color: Colors.bone,
    fontVariant: ['tabular-nums'],
    paddingVertical: 6,
    borderBottomWidth: 1,
  },
  fieldFocused: {
    borderBottomColor: Colors.brass,
  },
  fieldBlurred: {
    borderBottomColor: Colors.hairline,
  },
  live: {
    fontFamily: Fonts.manrope,
    fontSize: 15,
    lineHeight: 22,
    color: Colors.ash,
    fontVariant: ['tabular-nums'],
    marginTop: 20,
  },
  liveTotal: {
    color: Colors.bone,
  },
  spacer: {
    flex: 1,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 12,
  },
  step: {
    fontFamily: Fonts.manrope,
    fontSize: 13,
    color: Colors.slate,
  },
  nextButton: {
    height: 48,
    paddingHorizontal: 22,
    backgroundColor: Colors.brass,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextLabel: {
    fontFamily: Fonts.manropeSemiBold,
    fontSize: 15,
    color: Colors.ink,
  },
});
