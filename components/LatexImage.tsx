import React, { useState, useEffect, memo } from 'react';
import {
  Image,
  Text,
  StyleSheet,
  ActivityIndicator,
  Dimensions,
  ScrollView,
  View,
} from 'react-native';
import NativeLatexRenderer from '../specs/NativeLatexRenderer';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type Props = {
  expression: string;
  mode: 'inline' | 'block';
};

const LatexImage = memo(({ expression, mode }: Props) => {
  const [data, setData] = useState<{
    uri: string;
    width: number;
    height: number;
  } | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const render = async () => {
      try {
        const textSize = 16;
        const result = await NativeLatexRenderer.renderLatex(
          expression,
          textSize,
        );
        if (isMounted) setData(result);
      } catch (e) {
        if (isMounted) setError(true);
      }
    };
    render();
    return () => {
      isMounted = false;
    };
  }, [expression, mode]);

  if (error) {
    return <Text style={styles.errorText}>[Invalid]</Text>;
  }

  if (!data) {
    return (
      <ActivityIndicator
        size="small"
        color="#999"
        style={{ marginHorizontal: 5 }}
      />
    );
  }

  // FIX 2: Check if the image is wider than the screen
  const isOverflowing = data.width > SCREEN_WIDTH - 60; // 24 margin + 16 padding + 14 idText + 6 buffer

  const imageElement = (
    <Image
      source={{ uri: data.uri }}
      style={{
        width: data.width,
        height: data.height,
      }}
      resizeMode="contain"
    />
  );

  // If it fits, just return the image
  if (!isOverflowing) {
    return imageElement;
  }

  // If it's too big (like Case 7), make it scrollable!
  return (
    <ScrollView
      style={{
        flexGrow: 0, // to remove unnecessary extra height of scroll view that was coming in case 5
        paddingVertical: 4,
      }}
      horizontal
    >
      {imageElement}
    </ScrollView>
  );
});

const styles = StyleSheet.create({
  errorText: {
    color: 'red',
    fontSize: 12,
    backgroundColor: '#ffebeb',
  },
});

export default LatexImage;
