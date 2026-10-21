import { memo, useCallback, useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { RowSeparator } from '@/components/native/grouped-list';
import { Colors } from '@/constants/theme';
import type { Instrument, InstrumentKind } from '@/data/types';
import { useInstrumentSearchProvider } from '@/store';

type InstrumentPickerProps = {
  selected: Instrument | null;
  onSelect: (instrument: Instrument) => void;
};

const KIND_LABEL: Record<InstrumentKind, string> = {
  stock: 'Stock',
  etf: 'Fund',
  crypto: 'Crypto',
};

const ResultRow = memo(function ResultRow({
  instrument,
  onSelect,
}: {
  instrument: Instrument;
  onSelect: (instrument: Instrument) => void;
}) {
  const onPress = useCallback(() => onSelect(instrument), [instrument, onSelect]);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${instrument.name}, ${instrument.symbol}`}
      style={styles.resultRow}
      onPress={onPress}>
      <Text style={styles.resultName} numberOfLines={1}>
        {instrument.name}
      </Text>
      <Text style={styles.resultMeta}>
        {instrument.symbol} · {KIND_LABEL[instrument.kind]}
      </Text>
      <RowSeparator inset={16} />
    </Pressable>
  );
});

export function InstrumentPicker({ selected, onSelect }: InstrumentPickerProps) {
  const provider = useInstrumentSearchProvider();
  const [expanded, setExpanded] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Instrument[]>([]);

  useEffect(() => {
    if (!expanded) return;
    let active = true;
    void provider.search(query).then((matches) => {
      if (active) setResults(matches);
    });
    return () => {
      active = false;
    };
  }, [expanded, provider, query]);

  const pick = useCallback(
    (instrument: Instrument) => {
      onSelect(instrument);
      setExpanded(false);
      setQuery('');
    },
    [onSelect],
  );

  const toggle = useCallback(() => setExpanded((value) => !value), []);

  const valueLabel = selected ? `${selected.name} · ${selected.symbol}` : 'Choose';

  return (
    <View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={
          selected ? `Security, ${selected.name} ${selected.symbol}` : 'Choose a security'
        }
        accessibilityState={{ expanded }}
        style={styles.headerRow}
        onPress={toggle}>
        <Text style={styles.label}>Security</Text>
        <Text style={[styles.value, !selected && styles.valuePlaceholder]} numberOfLines={1}>
          {valueLabel}
        </Text>
        <RowSeparator inset={16} />
      </Pressable>
      {expanded ? (
        <View>
          <View style={styles.searchRow}>
            <TextInput
              accessibilityLabel="Search by name or symbol"
              style={styles.searchInput}
              value={query}
              onChangeText={setQuery}
              autoFocus
              autoCapitalize="characters"
              autoCorrect={false}
              placeholder="Name or symbol"
              placeholderTextColor={Colors.disabled}
              cursorColor={Colors.brass}
              selectionColor={Colors.brass}
            />
            <RowSeparator inset={16} />
          </View>
          {results.map((instrument) => (
            <ResultRow key={instrument.id} instrument={instrument} onSelect={pick} />
          ))}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    minHeight: 48,
    paddingHorizontal: 16,
  },
  label: {
    fontSize: 17,
    lineHeight: 22,
    fontWeight: '400',
    color: Colors.bone,
  },
  value: {
    flexShrink: 1,
    marginStart: 16,
    fontSize: 17,
    lineHeight: 22,
    fontWeight: '400',
    color: Colors.ash,
    textAlign: 'auto',
  },
  valuePlaceholder: {
    color: Colors.slate,
  },
  searchRow: {
    minHeight: 48,
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  searchInput: {
    fontSize: 17,
    lineHeight: 22,
    fontWeight: '400',
    color: Colors.bone,
    padding: 0,
    paddingVertical: 12,
    textAlign: 'auto',
  },
  resultRow: {
    minHeight: 48,
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 2,
  },
  resultName: {
    fontSize: 17,
    lineHeight: 22,
    fontWeight: '400',
    color: Colors.bone,
    textAlign: 'auto',
  },
  resultMeta: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '400',
    color: Colors.ash,
    textAlign: 'auto',
  },
});
