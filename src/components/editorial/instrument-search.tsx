import { memo, useCallback, useEffect, useState } from 'react';
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type ListRenderItem,
} from 'react-native';

import { Colors, Fonts } from '@/constants/theme';
import type { Instrument, InstrumentKind } from '@/data/types';
import { useInstrumentSearchProvider } from '@/store';

type InstrumentSearchProps = {
  onPick: (instrument: Instrument) => void;
};

const KIND_LABEL: Record<InstrumentKind, string> = {
  stock: 'Stock',
  etf: 'Fund',
  crypto: 'Crypto',
};

const ResultRow = memo(function ResultRow({
  instrument,
  onPick,
}: {
  instrument: Instrument;
  onPick: (instrument: Instrument) => void;
}) {
  const onPress = useCallback(() => onPick(instrument), [instrument, onPick]);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${instrument.name}, ${instrument.symbol}`}
      style={styles.row}
      onPress={onPress}>
      <Text style={styles.name}>{instrument.name}</Text>
      <Text style={styles.meta}>
        {instrument.symbol} · {KIND_LABEL[instrument.kind]}
      </Text>
    </Pressable>
  );
});

function EmptyResults() {
  return <Text style={styles.empty}>No instrument matches that.</Text>;
}

export function InstrumentSearch({ onPick }: InstrumentSearchProps) {
  const provider = useInstrumentSearchProvider();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Instrument[]>([]);

  useEffect(() => {
    let active = true;
    void provider.search(query).then((matches) => {
      if (active) setResults(matches);
    });
    return () => {
      active = false;
    };
  }, [provider, query]);

  const renderItem = useCallback<ListRenderItem<Instrument>>(
    ({ item }) => <ResultRow instrument={item} onPick={onPick} />,
    [onPick],
  );
  const keyExtractor = useCallback((item: Instrument) => item.id, []);

  return (
    <View style={styles.container}>
      <TextInput
        accessibilityLabel="Search by name or symbol"
        style={styles.field}
        value={query}
        onChangeText={setQuery}
        autoFocus
        autoCapitalize="characters"
        autoCorrect={false}
        placeholder="Name or symbol"
        placeholderTextColor={Colors.slate}
        cursorColor={Colors.brass}
        selectionColor={Colors.brass}
      />
      <FlatList
        data={results}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        showsVerticalScrollIndicator={false}
        style={styles.list}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={EmptyResults}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginTop: 16,
  },
  field: {
    fontFamily: Fonts.newsreaderLight32,
    fontSize: 32,
    lineHeight: 40,
    color: Colors.bone,
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: Colors.brass,
  },
  list: {
    flex: 1,
    marginTop: 12,
  },
  listContent: {
    paddingBottom: 24,
  },
  row: {
    minHeight: 48,
    justifyContent: 'center',
    paddingVertical: 8,
    gap: 2,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.hairline,
  },
  name: {
    fontFamily: Fonts.newsreader20,
    fontSize: 20,
    lineHeight: 28,
    color: Colors.bone,
    textAlign: 'auto',
  },
  meta: {
    fontFamily: Fonts.manrope,
    fontSize: 13,
    lineHeight: 18,
    color: Colors.slate,
    textAlign: 'auto',
  },
  empty: {
    fontFamily: Fonts.manrope,
    fontSize: 15,
    lineHeight: 22,
    color: Colors.slate,
    marginTop: 24,
    textAlign: 'auto',
  },
});
