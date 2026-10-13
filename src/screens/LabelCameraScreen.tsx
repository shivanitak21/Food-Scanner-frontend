import Ionicons from '@expo/vector-icons/Ionicons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { Fragment, useRef, useState } from 'react';
import { Alert, Image as RNImage, StyleSheet, TextInput, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ScanAnalyzing, ScanChecklist } from '@/components/scan/AnalysisLoader';
import { CameraPermission } from '@/components/scan/CameraPermission';
import { CameraIconButton, FocusRings, GlassShutter, ScanningPill } from '@/components/scan/ScannerChrome';
import { LabelCropper } from '@/components/scan/LabelCropper';
import { AppText } from '@/components/ui/AppText';
import { Glass, glassSurface } from '@/components/ui/Glass';
import { Button } from '@/components/ui/Button';
import { Screen } from '@/components/ui/Screen';
import { LoadingState } from '@/components/ui/StateViews';
import { useProfiles } from '@/hooks/useFoodData';
import { confirmLabel, confirmQuickLabel, previewLabel, type LabelDraft } from '@/services/api/scansApi';
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
    frame: 'Make sure the text is clear.',
    title: 'Capture the package',
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

type IconName = keyof typeof Ionicons.glyphMap;

const SECTION_NAME: Record<Section, string> = { front: 'Package', ingredients: 'Ingredients', nutrition: 'Nutrition' };

const SECTION_ICON: Record<Section, IconName> = {
  front: 'cube-outline',
  ingredients: 'list-outline',
  nutrition: 'nutrition-outline',
};

const STEP_ICON: Record<(typeof PROGRESS)[number]['id'], IconName> = {
  package: 'cube-outline',
  ingredients: 'list-outline',
  nutrition: 'nutrition-outline',
  analysis: 'sparkles-outline',
};

const SECTION_STEP: Record<Section, (typeof PROGRESS)[number]['id']> = {
  front: 'package',
  ingredients: 'ingredients',
  nutrition: 'nutrition',
};

const CAMERA_STEP_LABEL: Record<(typeof PROGRESS)[number]['id'], string> = {
  package: 'Capture the package',
  ingredients: 'Frame the ingredients',
  nutrition: 'Frame the nutrition panel',
  analysis: 'Check it for your family',
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
  const { width, height } = useWindowDimensions();
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
  const [torch, setTorch] = useState(false);

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
      const payload = {
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
      };
      if ((profiles.data ?? []).length > 0) {
        const scan = await confirmLabel(payload);
        scanEvent('analysis_success');
        navigation.replace('AnalysisResult', { scan });
      } else {
        const quick = await confirmQuickLabel(payload);
        scanEvent('analysis_success');
        navigation.replace('AnalysisResult', { quick });
      }
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
      <View style={styles.fill}>
        <StatusBar style="light" />
        <ScanAnalyzing
          imageUri={photos.nutrition ?? photos.ingredients ?? photos.front}
          subtitle={phase === 'reading' ? 'Reading the package' : 'Preparing family insights'}
        />
      </View>
    );
  }

  if (phase === 'prompt' && draft?.prompt) {
    return (
      <Screen edges={['top', 'left', 'right', 'bottom']}>
        <ProgressRow stateFor={progressState} />
        <Glass style={styles.promptCard}>
          <LinearGradient
            colors={[colors.primaryStart, colors.primaryEnd]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.promptIcon}
          >
            <Ionicons name={SECTION_ICON[section]} size={26} color="#FFFFFF" />
          </LinearGradient>
          <AppText variant="label" color={colors.primary}>
            One more photo
          </AppText>
          <AppText variant="display" style={styles.center}>
            {draft.prompt.title}
          </AppText>
          <AppText variant="body" color={colors.textSecondary} style={styles.center}>
            {draft.prompt.message}
          </AppText>
        </Glass>
        <CapturedStrip photos={photos} next={section} />
        {draft.productName ? (
          <View style={styles.productLine}>
            <Ionicons name="pricetag-outline" size={16} color={colors.textSecondary} />
            <AppText variant="headline" numberOfLines={1} style={styles.flex}>
              {[draft.brand, draft.productName].filter(Boolean).join(' ')}
            </AppText>
          </View>
        ) : null}
        <Button
          label={section === 'ingredients' ? 'Capture ingredients' : 'Capture nutrition'}
          icon="camera-outline"
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
        <View style={styles.confirmHead}>
          <View style={[styles.confirmPhoto, { backgroundColor: colors.surfaceMuted }]}>
            {photos.front ?? photos.ingredients ?? photos.nutrition ? (
              <Image source={{ uri: photos.front ?? photos.ingredients ?? photos.nutrition }} style={StyleSheet.absoluteFill} contentFit="cover" />
            ) : (
              <Ionicons name="cube-outline" size={28} color={colors.textTertiary} />
            )}
          </View>
          <View style={styles.flex}>
            <View
              style={[
                styles.statusPill,
                { backgroundColor: draft.sections.ingredients === 'ready' ? `${colors.primary}1F` : `${colors.review}1F` },
              ]}
            >
              <Ionicons
                name={draft.sections.ingredients === 'ready' ? 'checkmark-circle' : 'alert-circle'}
                size={14}
                color={draft.sections.ingredients === 'ready' ? colors.primary : colors.review}
              />
              <AppText variant="label" color={draft.sections.ingredients === 'ready' ? colors.primary : colors.review}>
                {draft.sections.ingredients === 'ready' ? 'Ready' : 'Check this'}
              </AppText>
            </View>
            <AppText variant="display">
              {draft.sections.ingredients === 'ready' ? 'Your product is ready.' : 'We read this'}
            </AppText>
          </View>
        </View>
        <Glass style={styles.fields}>
          <AppText variant="label" color={colors.textTertiary}>
            Product name
          </AppText>
          <TextInput
            value={productName}
            onChangeText={setProductName}
            placeholder="Product name"
            placeholderTextColor={colors.textTertiary}
            accessibilityLabel="Product name"
            style={[styles.input, { color: colors.text, backgroundColor: colors.glassStrong, borderColor: colors.glassBorder }]}
          />
          <AppText variant="label" color={colors.textTertiary}>
            Ingredients
          </AppText>
          <TextInput
            value={ingredientsText}
            onChangeText={setIngredientsText}
            multiline
            placeholder="Ingredients"
            placeholderTextColor={colors.textTertiary}
            accessibilityLabel="Ingredients"
            style={[styles.input, styles.ingredients, { color: colors.text, backgroundColor: colors.glassStrong, borderColor: colors.glassBorder }]}
          />
          {draft.sections.ingredients === 'missing' ? (
            <View style={styles.productLine}>
              <Ionicons name="information-circle-outline" size={16} color={colors.review} />
              <AppText variant="caption" color={colors.review} style={styles.flex}>
                Ingredients are still missing. The result will say there isn’t enough information.
              </AppText>
            </View>
          ) : null}
        </Glass>
        <CapturedStrip photos={photos} />
        {failure ? (
          <AppText variant="caption" color={colors.avoid}>
            {failure}
          </AppText>
        ) : null}
        <Button
          label={draft.sections.ingredients === 'ready' ? 'View results' : 'Check my family'}
          onPress={() => void analyze()}
          disabled={productName.trim().length < 1}
        />
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
  const captured = (['front', 'ingredients', 'nutrition'] as const).filter((id) => photos[id]);
  const lastPhoto = captured.length ? photos[captured[captured.length - 1]] : undefined;
  const ringSize = Math.min(width * 0.74, height * 0.34, 300);
  const checklist = PROGRESS.map((item) => {
    const state = progressState(item.id);
    return {
      label: CAMERA_STEP_LABEL[item.id],
      state: SECTION_STEP[section] === item.id ? ('current' as const) : state === 'done' ? ('done' as const) : ('waiting' as const),
    };
  });
  return (
    <View style={styles.fill}>
      <StatusBar style="light" />
      <CameraView ref={cameraRef} style={styles.fill} facing="back" mode="picture" enableTorch={torch} />
      <LinearGradient
        pointerEvents="none"
        colors={['rgba(12,10,22,0.45)', 'rgba(12,10,22,0)', 'rgba(12,10,22,0.3)']}
        locations={[0, 0.35, 1]}
        style={StyleSheet.absoluteFill}
      />

      <View pointerEvents="box-none" style={[styles.chrome, { paddingTop: insets.top + 8, paddingBottom: insets.bottom + 18 }]}>
        <View style={styles.topBar}>
          <CameraIconButton label="Close scanner" icon="close" onPress={() => navigation.goBack()} />
          <ScanningPill label={failure ? 'Hard to read' : `Scanning · ${SECTION_NAME[section]}`} />
          <CameraIconButton
            label={torch ? 'Turn flash off' : 'Turn flash on'}
            icon={torch ? 'flash' : 'flash-outline'}
            active={torch}
            onPress={() => setTorch((value) => !value)}
          />
        </View>

        <View pointerEvents="none" style={styles.ringStage}>
          <FocusRings size={ringSize} />
        </View>

        <View style={styles.bottom}>
          <ScanChecklist
            title={failure ? 'The package is a little hard to read.' : copy.title}
            subtitle={failure ?? copy.frame}
            live={false}
            items={checklist}
          />
          {failure ? (
            <Button label="Try another angle" variant="secondary" onPress={() => setFailure(null)} />
          ) : null}
          <View style={styles.dock}>
            <View style={styles.thumb}>
              {lastPhoto ? (
                <Image source={{ uri: lastPhoto }} style={StyleSheet.absoluteFill} contentFit="cover" />
              ) : (
                <Ionicons name="images-outline" size={22} color="#FFFFFF" />
              )}
              {captured.length ? (
                <View style={[styles.thumbBadge, { backgroundColor: colors.primary }]}>
                  <AppText variant="caption" color="#FFFFFF" style={styles.badgeText}>
                    {captured.length}
                  </AppText>
                </View>
              ) : null}
            </View>
            <GlassShutter label="Capture package photo" onPress={() => void capture()} />
            <CameraIconButton label="Scan barcode instead" icon="barcode-outline" onPress={() => navigation.replace('BarcodeScanner')} />
          </View>
        </View>
      </View>
    </View>
  );
}

function CapturedStrip({ photos, next }: { photos: Partial<Record<Section, string>>; next?: Section }) {
  const { colors } = useTheme();
  return (
    <View style={styles.strip}>
      {(['front', 'ingredients', 'nutrition'] as const).map((id) => {
        const uri = photos[id];
        const isNext = next === id;
        return (
          <View key={id} style={styles.stripItem}>
            <View
              style={[
                styles.stripThumb,
                glassSurface(colors),
                isNext && { borderColor: colors.primary, borderWidth: 1.5, borderStyle: 'dashed' },
              ]}
            >
              {uri ? (
                <Image source={{ uri }} style={StyleSheet.absoluteFill} contentFit="cover" />
              ) : (
                <Ionicons name={isNext ? 'add' : SECTION_ICON[id]} size={22} color={isNext ? colors.primary : colors.textTertiary} />
              )}
              {uri ? (
                <View style={[styles.stripCheck, { backgroundColor: colors.primary }]}>
                  <Ionicons name="checkmark" size={12} color="#FFFFFF" />
                </View>
              ) : null}
            </View>
            <AppText variant="caption" color={uri || isNext ? colors.text : colors.textTertiary}>
              {SECTION_NAME[id]}
            </AppText>
          </View>
        );
      })}
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
  const dim = light ? 'rgba(255,255,255,0.45)' : colors.textTertiary;
  const line = light ? 'rgba(255,255,255,0.22)' : colors.border;
  return (
    <Glass
      tone={light ? 'dark' : 'auto'}
      blur={light}
      intensity={40}
      radius={22}
      style={styles.progress}
    >
      <View style={styles.progressRow} accessibilityRole="progressbar" accessibilityLabel="Scan progress">
        {PROGRESS.map((item, index) => {
          const state = stateFor(item.id);
          const active = state !== 'waiting';
          return (
            <Fragment key={item.id}>
              {index > 0 ? <View style={[styles.connector, { backgroundColor: active ? colors.primary : line }]} /> : null}
              <View style={styles.step}>
                {state === 'done' ? (
                  <LinearGradient
                    colors={[colors.primaryStart, colors.primaryEnd]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.stepDot}
                  >
                    <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                  </LinearGradient>
                ) : (
                  <View
                    style={[
                      styles.stepDot,
                      state === 'current'
                        ? { backgroundColor: light ? '#FFFFFF' : `${colors.primary}1F`, borderColor: colors.primary, borderWidth: 1.5 }
                        : { borderColor: line, borderWidth: 1 },
                    ]}
                  >
                    <Ionicons name={STEP_ICON[item.id]} size={15} color={state === 'current' ? colors.primary : dim} />
                  </View>
                )}
                <AppText
                  variant="caption"
                  color={active ? (light ? '#FFFFFF' : colors.text) : dim}
                  style={styles.stepLabel}
                  numberOfLines={1}
                >
                  {item.label}
                </AppText>
              </View>
            </Fragment>
          );
        })}
      </View>
    </Glass>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, backgroundColor: '#171713' },
  flex: { flex: 1 },
  center: { textAlign: 'center' },
  pressed: { opacity: 0.8, transform: [{ scale: 0.96 }] },
  chrome: { ...StyleSheet.absoluteFill, paddingHorizontal: 18 },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  ringStage: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  bottom: { gap: 16 },
  dock: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
  },
  thumb: {
    width: 52,
    height: 52,
    borderRadius: 26,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.16)',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.85)',
  },
  thumbBadge: {
    position: 'absolute',
    top: 3,
    right: 3,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: { fontSize: 11, lineHeight: 14 },
  progress: { paddingHorizontal: 14, paddingVertical: 10 },
  progressRow: { flexDirection: 'row', alignItems: 'flex-start' },
  step: { width: 64, alignItems: 'center', gap: 4 },
  stepDot: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  stepLabel: { fontSize: 11 },
  connector: { flex: 1, height: 2, borderRadius: 1, marginTop: 15, marginHorizontal: -10 },
  promptCard: { alignItems: 'center', gap: 8, paddingHorizontal: 20, paddingVertical: 24 },
  promptIcon: {
    width: 60,
    height: 60,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
    boxShadow: '0 10px 24px rgba(255, 87, 34, 0.35)',
  },
  productLine: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  strip: { flexDirection: 'row', gap: 12 },
  stripItem: { flex: 1, alignItems: 'center', gap: 6 },
  stripThumb: {
    alignSelf: 'stretch',
    aspectRatio: 1,
    borderRadius: 20,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stripCheck: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmHead: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  confirmPhoto: {
    width: 76,
    height: 76,
    borderRadius: 22,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    marginBottom: 4,
  },
  fields: { gap: 8, padding: 16 },
  input: { minHeight: 50, borderWidth: 1, borderRadius: 16, fontSize: 16, paddingHorizontal: 14, paddingVertical: 12 },
  ingredients: { minHeight: 130, textAlignVertical: 'top' },
});
