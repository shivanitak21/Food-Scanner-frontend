import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { StatusBar } from 'expo-status-bar';
import { useRef, useState } from 'react';
import { Alert, Image as RNImage, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AnalysisLoader } from '@/components/scan/AnalysisLoader';
import { CameraPermission } from '@/components/scan/CameraPermission';
import { CameraIconButton, ScanLine } from '@/components/scan/ScannerChrome';
import { LabelCropper } from '@/components/scan/LabelCropper';
import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { Screen } from '@/components/ui/Screen';
import { LoadingState } from '@/components/ui/StateViews';
import { useProfiles } from '@/hooks/useFoodData';
import { confirmLabel, previewLabel, type LabelDraft } from '@/services/api/scansApi';
import { useTheme } from '@/theme/ThemeProvider';
import type { RootStackParamList } from '@/types/navigation';
import { ApiError, getErrorMessage } from '@/utils/errors';
import { scanEvent } from '@/utils/scanEvents';

type Props = NativeStackScreenProps<RootStackParamList, 'LabelCamera'>;
type Photo = { uri: string; width: number; height: number };
type Section = 'front' | 'ingredients' | 'nutrition';
type Phase = 'camera' | 'crop' | 'reading' | 'prompt' | 'confirm' | 'analyzing';

const PROGRESS: { id: 'package' | 'ingredients' | 'nutrition' | 'analysis'; label: string }[] = [
  { id: 'package', label: 'Package' },
  { id: 'ingredients', label: 'Ingredients' },
  { id: 'nutrition', label: 'Nutrition' },
  { id: 'analysis', label: 'Analysis' },
];

const CAPTURE_COPY: Record<Section, { frame: string; title: string; hint: string }> = {
  front: {
    frame: 'Move the package into frame',
    title: 'Frame the front',
    hint: 'Include the brand and product name.',
  },
  ingredients: {
    frame: 'Fit the ingredient list in the frame',
    title: 'Frame the ingredients',
    hint: 'Include the ingredient list and any allergen statement.',
  },
  nutrition: {
    frame: 'Fit the nutrition panel in the frame',
    title: 'Frame the nutrition panel',
    hint: 'Include the serving size and the nutrient numbers.',
  },
};

async function resolveSize(uri: string, width: number, height: number): Promise<{ width: number; height: number }> {
  if (width > 0 && height > 0) return { width, height };
  return new Promise((resolve, reject) => {
    RNImage.getSize(uri, (nextWidth, nextHeight) => resolve({ width: nextWidth, height: nextHeight }), reject);
  });
}

export function LabelCameraScreen({ navigation, route }: Props) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const cameraRef = useRef<CameraView>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const profiles = useProfiles();
  const [section, setSection] = useState<Section>('front');
  const [phase, setPhase] = useState<Phase>('camera');
  const [photos, setPhotos] = useState<Partial<Record<Section, string>>>({});
  const [pending, setPending] = useState<Photo | null>(null);
  const [draft, setDraft] = useState<LabelDraft | null>(null);
  const [productName, setProductName] = useState(route.params?.productName ?? '');
  const [ingredientsText, setIngredientsText] = useState('');
  const [failure, setFailure] = useState<string | null>(null);

  if (!permission) return <LoadingState message="Checking camera access" />;
  if (!permission.granted) {
    return (
      <CameraPermission canAskAgain={permission.canAskAgain} onRequest={() => void requestPermission()} onClose={() => navigation.goBack()} />
    );
  }

  const capture = async () => {
    scanEvent('capture_taken');
    try {
      const picture = await cameraRef.current?.takePictureAsync({ quality: 0.72 });
      if (!picture?.uri) {
        Alert.alert('Photo failed', 'The camera did not return a photo. Try again.');
        return;
      }
      const size = await resolveSize(picture.uri, picture.width, picture.height);
      if (Math.min(size.width, size.height) < 480) {
        scanEvent('image_quality_failed');
        setFailure('Move closer and keep the package steady.');
        return;
      }
      setFailure(null);
      setPending({ uri: picture.uri, ...size });
      setPhase('crop');
    } catch (error) {
      Alert.alert('Photo failed', getErrorMessage(error));
    }
  };

  const read = async (nextPhotos: Partial<Record<Section, string>>) => {
    const uris = (['front', 'ingredients', 'nutrition'] as const)
      .map((id) => nextPhotos[id])
      .filter((uri): uri is string => Boolean(uri));
    if (uris.length === 0) return;
    if ((profiles.data ?? []).length === 0) {
      navigation.navigate('FamilyMemberForm', {});
      return;
    }
    setPhase('reading');
    setFailure(null);
    scanEvent('ocr_started');
    try {
      const next = await previewLabel(uris);
      scanEvent(next.sections.ingredients === 'ready' ? 'ocr_success' : 'ocr_low_confidence');
      setDraft(next);
      setProductName(next.productName || productName);
      setIngredientsText(next.ingredientsText);
      if (next.nextCapture) {
        setSection(next.nextCapture);
        setPhase('prompt');
        return;
      }
      setPhase('confirm');
    } catch (error) {
      scanEvent('ocr_low_confidence');
      const unreadable = error instanceof ApiError && error.code === 'LABEL_UNREADABLE';
      setFailure(
        unreadable
          ? "We couldn't read the package."
          : error instanceof ApiError && error.isNetwork
            ? 'The photo is saved on this phone. Finish this when you are connected.'
            : getErrorMessage(error),
      );
      setPhase('camera');
    }
  };

  const analyze = async () => {
    if (!draft || productName.trim().length < 1) return;
    setPhase('analyzing');
    scanEvent('analysis_started');
    try {
      const scan = await confirmLabel({
        productName: productName.trim(),
        brand: draft.brand,
        variant: draft.variant,
        category: draft.category,
        claims: draft.claims,
        barcode: route.params?.barcode,
        ingredientsText: ingredientsText.trim(),
        contains: draft.contains,
        mayContain: draft.mayContain,
        nutrition: draft.nutrition,
        imageUri: photos.front ?? photos.ingredients ?? photos.nutrition,
      });
      scanEvent('analysis_success');
      navigation.replace('AnalysisResult', { scan });
    } catch (error) {
      scanEvent('analysis_failed');
      setFailure(getErrorMessage(error));
      setPhase('confirm');
    }
  };

  const progressState = (id: (typeof PROGRESS)[number]['id']) => {
    if (id === 'analysis') return phase === 'analyzing' ? 'current' : 'waiting';
    if (!draft) return id === 'package' && photos.front ? 'current' : 'waiting';
    if (id === 'package') return draft.sections.package === 'ready' || photos.front ? 'done' : 'waiting';
    return draft.sections[id] === 'ready' ? 'done' : phase === 'prompt' && section === id ? 'current' : 'waiting';
  };

  if (phase === 'crop' && pending) {
    const copy = CAPTURE_COPY[section];
    return (
      <View style={[styles.fill, { backgroundColor: colors.background, paddingTop: insets.top }]}>
        <LabelCropper
          photo={pending}
          title={copy.title}
          hint={copy.hint}
          onRetake={() => {
            setPending(null);
            setPhase('camera');
          }}
          onConfirm={(uri) => {
            const nextPhotos = { ...photos, [section]: uri };
            setPhotos(nextPhotos);
            setPending(null);
            void read(nextPhotos);
          }}
        />
      </View>
    );
  }

  if (phase === 'reading' || phase === 'analyzing') {
    return (
      <View style={[styles.fill, { backgroundColor: colors.background, paddingTop: insets.top }]}>
        <AnalysisLoader subtitle={phase === 'reading' ? 'Reading the package' : 'Preparing family insights'} />
      </View>
    );
  }

  if (phase === 'prompt' && draft?.prompt) {
    return (
      <Screen edges={['top', 'left', 'right', 'bottom']}>
        <ProgressRow stateFor={progressState} />
        <AppText variant="display">{draft.prompt.title}</AppText>
        <AppText variant="body" color={colors.textSecondary}>
          {draft.prompt.message}
        </AppText>
        {draft.productName ? (
          <AppText variant="headline">{[draft.brand, draft.productName].filter(Boolean).join(' ')}</AppText>
        ) : null}
        <Button
          label={section === 'ingredients' ? 'Capture ingredients' : 'Capture nutrition'}
          onPress={() => setPhase('camera')}
        />
        <Button
          label="Assess with what we have"
          variant="secondary"
          onPress={() => setPhase('confirm')}
        />
      </Screen>
    );
  }

  if (phase === 'confirm' && draft) {
    return (
      <Screen edges={['top', 'left', 'right']}>
        <ProgressRow stateFor={progressState} />
        <AppText variant="label" color={colors.textTertiary}>
          Please confirm
        </AppText>
        <AppText variant="display">We read this</AppText>
        <TextInput
          value={productName}
          onChangeText={setProductName}
          placeholder="Product name"
          placeholderTextColor={colors.textTertiary}
          accessibilityLabel="Product name"
          style={[styles.input, { color: colors.text, borderColor: colors.border }]}
        />
        <TextInput
          value={ingredientsText}
          onChangeText={setIngredientsText}
          multiline
          placeholder="Ingredients"
          placeholderTextColor={colors.textTertiary}
          accessibilityLabel="Ingredients"
          style={[styles.input, styles.ingredients, { color: colors.text, borderColor: colors.border }]}
        />
        {draft.sections.ingredients === 'missing' ? (
          <AppText variant="caption" color={colors.review}>
            Ingredients are still missing. The result will say there isn't enough information.
          </AppText>
        ) : null}
        {failure ? (
          <AppText variant="caption" color={colors.avoid}>
            {failure}
          </AppText>
        ) : null}
        <Button label="Check my family" onPress={() => void analyze()} disabled={productName.trim().length < 1} />
        <Button
          label="Retake this photo"
          variant="secondary"
          onPress={() => {
            setSection(draft.sections.ingredients === 'missing' ? 'ingredients' : 'nutrition');
            setPhase('camera');
          }}
        />
      </Screen>
    );
  }

  const copy = CAPTURE_COPY[section];
  return (
    <View style={styles.fill}>
      <StatusBar style="light" />
      <CameraView ref={cameraRef} style={styles.fill} facing="back" mode="picture" />
      <View style={[styles.chrome, { paddingTop: insets.top + 8, paddingBottom: insets.bottom + 16 }]}>
        <View style={styles.toolbar}>
          <CameraIconButton label="Close scanner" icon="close" onPress={() => navigation.goBack()} />
          <ProgressRow stateFor={progressState} light />
        </View>
        <View style={styles.frameWrap}>
          <View style={styles.frame}>
            <ScanLine height={220} />
          </View>
          <AppText variant="bodyMedium" color="#F7F5F0" style={styles.center}>
            {failure ?? copy.frame}
          </AppText>
        </View>
        <View style={styles.bottom}>
          {failure ? (
            <Button label="Try another angle" variant="secondary" onPress={() => setFailure(null)} />
          ) : null}
          <Pressable accessibilityRole="button" accessibilityLabel="Capture package photo" onPress={() => void capture()} style={styles.shutter}>
            <View style={styles.shutterInner} />
          </Pressable>
          <Pressable accessibilityRole="button" accessibilityLabel="Scan barcode instead" onPress={() => navigation.replace('BarcodeScanner')} style={styles.textLink}>
            <AppText variant="bodyMedium" color="#F7F5F0">
              Scan barcode instead
            </AppText>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

function ProgressRow({
  stateFor,
  light = false,
}: {
  stateFor: (id: (typeof PROGRESS)[number]['id']) => 'done' | 'current' | 'waiting';
  light?: boolean;
}) {
  const { colors } = useTheme();
  return (
    <View style={styles.progress} accessibilityRole="progressbar" accessibilityLabel="Scan progress">
      {PROGRESS.map((item) => {
        const state = stateFor(item.id);
        const color = state === 'waiting' ? (light ? 'rgba(247,245,240,0.55)' : colors.textTertiary) : light ? '#F7F5F0' : colors.primary;
        return (
          <AppText key={item.id} variant="caption" color={color}>
            {state === 'done' ? '✓ ' : state === 'current' ? '○ ' : '○ '}
            {item.label}
          </AppText>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, backgroundColor: '#171713' },
  chrome: { ...StyleSheet.absoluteFill, justifyContent: 'space-between', paddingHorizontal: 20 },
  toolbar: { gap: 12 },
  frameWrap: { alignItems: 'center', gap: 16, alignSelf: 'stretch' },
  frame: {
    width: '100%',
    maxWidth: 340,
    height: 220,
    borderRadius: 28,
    borderWidth: 1.5,
    borderColor: 'rgba(247, 245, 240, 0.9)',
    overflow: 'hidden',
    alignSelf: 'center',
  },
  center: { textAlign: 'center' },
  bottom: { alignItems: 'center', gap: 12 },
  shutter: { width: 74, height: 74, borderRadius: 37, borderWidth: 3, borderColor: '#F7F5F0', alignItems: 'center', justifyContent: 'center' },
  shutterInner: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#F7F5F0' },
  textLink: { minHeight: 44, justifyContent: 'center' },
  input: { minHeight: 48, borderBottomWidth: StyleSheet.hairlineWidth, fontSize: 16, paddingVertical: 8 },
  ingredients: { minHeight: 120, textAlignVertical: 'top' },
  progress: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
});
