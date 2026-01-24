import React, { useMemo, useCallback } from 'react';
import { SafeAreaView, FlatList, StyleSheet, Text, View } from 'react-native';
import LatexImage from './components/LatexImage';
import { parseLatexContent } from './utils/latexParser';
import { LATEX_DATA, LatexItem } from './latexData';

const RichLatexItem = React.memo(
  ({ content, id }: { content: string; id: string }) => {
    const chunks = useMemo(() => parseLatexContent(content), [content]);
    console.log('id:', id);

    return (
      <View style={styles.itemContainer}>
        <Text
          style={styles.idText}
          // Below is a temporary fix for the numbering alignment issue in 2nd and 10th item. Best way would be to identify if there is any expression present in the first line and then give margin top accordingly
          // style={[
          //   styles.idText,
          //   { marginTop: ['2', '10'].includes(id) ? 11 : 0 },
          // ]}
        >
          {id}.
        </Text>
        <View style={styles.contentWrapper}>
          {chunks.map((chunk, index) => {
            if (chunk.type === 'text') {
              return (
                <Text key={index} style={styles.text}>
                  {chunk.content}
                </Text>
              );
            } else {
              // Renders both Inline and Block math
              return (
                <View
                  key={index}
                  style={
                    chunk.type === 'block'
                      ? styles.blockContainer
                      : styles.inlineContainer
                  }
                >
                  <LatexImage expression={chunk.content} mode={chunk.type} />
                </View>
              );
            }
          })}
        </View>
      </View>
    );
  },
);

export default function App() {
  const renderItem = useCallback(
    ({ item }: { item: LatexItem }) => (
      <RichLatexItem content={item.content} id={item.id} />
    ),
    [],
  );

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.header}>Native LaTeX</Text>
      <FlatList
        data={LATEX_DATA}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        maxToRenderPerBatch={5}
        windowSize={5}
        contentContainerStyle={styles.flatlistContainer}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    fontSize: 20,
    fontWeight: 'bold',
    padding: 20,
    textAlign: 'center',
  },
  flatlistContainer: {
    paddingBottom: 24,
  },
  itemContainer: {
    backgroundColor: '#ffffff',
    padding: 8,
    marginVertical: 6,
    marginHorizontal: 12,
    borderRadius: 8,
    flexDirection: 'row', // ID on left, Content on right
    alignItems: 'flex-start',
  },
  idText: {
    fontWeight: 'bold',
    marginRight: 8,
    fontSize: 16,
  },
  contentWrapper: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap', // CRITICAL: This allows text and images to wrap naturally
    alignItems: 'center', // Aligns text and inline math vertically
  },
  text: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
  blockContainer: {
    width: '100%',
    alignItems: 'center',
    backgroundColor: '#E4E4E4',
    borderRadius: 8,
  },
  inlineContainer: {
    backgroundColor: '#E4E4E4',
    borderRadius: 8,
  },
});
