import { Image } from 'expo-image';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import { useMemo, useState } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle, useSharedValue } from 'react-native-reanimated';

import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { useTheme } from '@/theme/ThemeProvider';

type Photo = {
  uri: string;
  width: number;
  height: number;
};

function clampTranslation(
  tx: number,
  ty: number,
  userScale: number,
  baseW: number,
  baseH: number,
  cropW: number,
  cropH: number,
) {
  'worklet';
  const renderedW = baseW * userScale;
  const renderedH = baseH * userScale;
  const maxX = Math.max(0, (renderedW - cropW) / 2);
  const maxY = Math.max(0, (renderedH - cropH) / 2);
  return {
    x: Math.min(maxX, Math.max(-maxX, tx)),
    y: Math.min(maxY, Math.max(-maxY, ty)),
  };
}

export function LabelCropper({
  photo,
  onRetake,
  onConfirm,
  title = 'Frame the label',
  hint = 'Drag and pinch so the text fills the frame, then confirm or retake.',
}: {
  photo: Photo;
  onRetake: () => void;
  onConfirm: (uri: string) => void;
  title?: string;
  hint?: string;
}) {
  const { colors, radius } = useTheme();
  const { width: windowWidth } = useWindowDimensions();
  const [busy, setBusy] = useState(false);
  const cropW = Math.min(windowWidth - 40, 420);
  const cropH = Math.round(cropW * 0.78);
  const coverScale = Math.max(cropW / photo.width, cropH / photo.height);
  const baseW = photo.width * coverScale;
  const baseH = photo.height * coverScale;

  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const savedX = useSharedValue(0);
  const savedY = useSharedValue(0);

  const gesture = useMemo(() => {
    const pinch = Gesture.Pinch()
      .onUpdate((event) => {
        scale.value = Math.min(4, Math.max(1, savedScale.value * event.scale));
      })
      .onEnd(() => {
        const next = clampTranslation(translateX.value, translateY.value, scale.value, baseW, baseH, cropW, cropH);
        translateX.value = next.x;
        translateY.value = next.y;
        savedScale.value = scale.value;
        savedX.value = next.x;
        savedY.value = next.y;
      });

    const pan = Gesture.Pan()
      .onUpdate((event) => {
        const next = clampTranslation(
          savedX.value + event.translationX,
          savedY.value + event.translationY,
          scale.value,
          baseW,
          baseH,
          cropW,
          cropH,
        );
        translateX.value = next.x;
        translateY.value = next.y;
      })
      .onEnd(() => {
        savedX.value = translateX.value;
        savedY.value = translateY.value;
      });

    return Gesture.Simultaneous(pinch, pan);
  }, [baseH, baseW, cropH, cropW, savedScale, savedX, savedY, scale, translateX, translateY]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }, { translateY: translateY.value }, { scale: scale.value }],
  }));

  const confirm = async () => {
    setBusy(true);
    try {
      const userScale = scale.value;
      const totalScale = coverScale * userScale;
      const renderedW = photo.width * totalScale;
      const renderedH = photo.height * totalScale;
      const left = cropW / 2 + translateX.value - renderedW / 2;
      const top = cropH / 2 + translateY.value - renderedH / 2;
      let originX = Math.max(0, Math.round((0 - left) / totalScale));
      let originY = Math.max(0, Math.round((0 - top) / totalScale));
      let width = Math.max(1, Math.round(cropW / totalScale));
      let height = Math.max(1, Math.round(cropH / totalScale));
      if (originX + width > photo.width) width = Math.max(1, photo.width - originX);
      if (originY + height > photo.height) height = Math.max(1, photo.height - originY);

      const result = await manipulateAsync(
        photo.uri,
        [
          { crop: { originX, originY, width, height } },
          { resize: { width: Math.min(width, 1600) } },
        ],
        { compress: 0.82, format: SaveFormat.JPEG },
      );
      onConfirm(result.uri);
    } catch {
      onConfirm(photo.uri);
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={styles.wrap}>
      <AppText variant="headline" style={styles.center}>
        {title}
      </AppText>
      <AppText variant="body" color={colors.textSecondary} style={styles.center}>
        {hint}
      </AppText>
      <View
        style={[
          styles.frame,
          {
            width: cropW,
            height: cropH,
            borderRadius: radius.lg,
            borderColor: colors.primary,
            backgroundColor: colors.inverse,
          },
        ]}
      >
        <GestureDetector gesture={gesture}>
          <Animated.View style={[{ width: baseW, height: baseH, position: 'absolute', left: (cropW - baseW) / 2, top: (cropH - baseH) / 2 }, animatedStyle]}>
            <Image source={{ uri: photo.uri }} style={styles.image} contentFit="fill" accessibilityLabel="Captured ingredient label" />
          </Animated.View>
        </GestureDetector>
      </View>
      <View style={styles.actions}>
        <Button label="Retake" variant="secondary" onPress={onRetake} disabled={busy} />
        <Button label="Use photo" onPress={() => void confirm()} loading={busy} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    padding: 20,
  },
  center: {
    textAlign: 'center',
  },
  frame: {
    overflow: 'hidden',
    borderWidth: 2,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  actions: {
    alignSelf: 'stretch',
    gap: 10,
  },
});
