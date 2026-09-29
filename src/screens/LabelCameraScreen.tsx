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
type Slot = 'ingredients' | 'nutrition' | 'allergens';

const SLOTS: { id: Slot; label: string }[] = [
  { id: 'ingredients', label: 'Ingredients' },
  { id: 'nutrition', label: 'Nutrition' },
  { id: 'allergens', label: 'Allergen statement' },
];

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
  const [slot, setSlot] = useState<Slot | null>(null);
  const [photos, setPhotos] = useState<Partial<Record<Slot, string>>>({});
  const [pending, setPending] = useState<Photo | null>(null);
  const [draft, setDraft] = useState<LabelDraft | null>(null);
  const [productName, setProductName] = useState(route.params?.productName ?? '');
  const [ingredientsText, setIngredientsText] = useState('');
  const [busy, setBusy] = useState<'read' | 'analyze' | null>(null);
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
      const picture = await cameraRef.current?.takePictureAsync({ quality: 0.85 });
      if (!picture?.uri) {
        Alert.alert('Photo failed', 'The camera did not return a photo. Try again.');
        return;
      }
      const size = await resolveSize(picture.uri, picture.width, picture.height);
      if (Math.min(size.width, size.height) < 480) {
        scanEvent('image_quality_failed');
        Alert.alert('Move closer', 'The label text is too small to read. Fill the frame and hold steady.');
        return;
      }
      scanEvent('document_detected');
      setPending({ uri: picture.uri, ...size });
    } catch (error) {
      Alert.alert('Photo failed', getErrorMessage(error));
    }
  };

  const read = async () => {
    const uris = SLOTS.map((item) => photos[item.id]).filter((uri): uri is string => Boolean(uri));
    if (!photos.ingredients) {
      Alert.alert('Ingredients photo needed', 'Photograph the ingredient list before reading the label.');
      return;
    }
    if ((profiles.data ?? []).length === 0) {
      navigation.navigate('FamilyMemberForm', {});
      return;
    }
    setFailure(null);
    setBusy('read');
    scanEvent('ocr_started');
    try {
      const next = await previewLabel(uris);
      scanEvent(next.sections.ingredients === 'ready' ? 'ocr_success' : 'ocr_low_confidence');
      setDraft(next);
      setProductName(next.productName || productName);
      setIngredientsText(next.ingredientsText);
    } catch (error) {
      scanEvent('ocr_low_confidence');
      setFailure(error instanceof ApiError && error.isNetwork ? 'Label captured. Finish this when you are connected.' : getErrorMessage(error));
    } finally {
      setBusy(null);
    }
  };

  const analyze = async () => {
    if (!draft || ingredientsText.trim().length < 2 || productName.trim().length < 1) return;
    setBusy('analyze');
    scanEvent('analysis_started');
    try {
      const scan = await confirmLabel({
        productName: productName.trim(),
        brand: draft.brand,
        ingredientsText: ingredientsText.trim(),
        contains: draft.contains,
        mayContain: draft.mayContain,
        nutrition: draft.nutrition,
      });
      scanEvent('analysis_success');
      navigation.replace('AnalysisResult', { scan });
    } catch (error) {
      scanEvent('analysis_failed');
      setFailure(getErrorMessage(error));
      setBusy(null);
    }
  };

  if (pending && slot) {
    return (
      <View style={[styles.fill, { backgroundColor: colors.background, paddingTop: insets.top }]}>
        <LabelCropper
          photo={pending}
          onRetake={() => setPending(null)}
          onConfirm={(uri) => {
            setPhotos((current) => ({ ...current, [slot]: uri }));
            setPending(null);
            setSlot(null);
          }}
        />
      </View>
    );
  }

  if (draft) {
    return (
      <Screen edges={['top', 'left', 'right']}>
        <AppText variant="label" color={colors.textTertiary}>
          Needs confirmation
        </AppText>
        <AppText variant="display">We found</AppText>
        {SLOTS.map((item) => (
          <View key={item.id} style={styles.sectionRow}>
            <AppText variant="bodyMedium">{item.label}</AppText>
            <AppText variant="caption" color={draft.sections[item.id === 'allergens' ? 'allergens' : item.id] === 'ready' ? colors.primary : colors.review}>
              {draft.sections[item.id === 'allergens' ? 'allergens' : item.id] === 'ready' ? 'Ready' : 'Needs review'}
            </AppText>
          </View>
        ))}
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
          accessibilityLabel="Ingredients"
          style={[styles.input, styles.ingredients, { color: colors.text, borderColor: colors.border }]}
        />
        {failure ? (
          <AppText variant="caption" color={colors.avoid}>
            {failure}
          </AppText>
        ) : null}
        <Button label="Continue" onPress={() => void analyze()} loading={busy === 'analyze'} />
        <Button label="Retake photos" variant="secondary" onPress={() => setDraft(null)} />
      </Screen>
    );
  }

  if (slot) {
    return (
      <View style={styles.fill}>
        <StatusBar style="light" />
        <CameraView ref={cameraRef} style={styles.fill} facing="back" mode="picture" />
        <View style={[styles.chrome, { paddingTop: insets.top + 8, paddingBottom: insets.bottom + 16 }]}>
          <CameraIconButton label="Back" icon="close" onPress={() => setSlot(null)} />
          <View style={styles.frameWrap}>
            <View style={styles.frame}>
              <ScanLine height={220} />
            </View>
            <AppText variant="bodyMedium" color="#F7F5F0" style={styles.center}>
              Fit the {SLOTS.find((item) => item.id === slot)?.label.toLowerCase()} inside the frame
            </AppText>
          </View>
          <Pressable accessibilityRole="button" accessibilityLabel="Capture" onPress={() => void capture()} style={styles.shutter}>
            <View style={styles.shutterInner} />
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <Screen edges={['top', 'left', 'right']}>
      <AppText variant="label" color={colors.textTertiary}>
        Scan ingredient label
      </AppText>
      <AppText variant="display">Three photos</AppText>
      <AppText variant="body" color={colors.textSecondary}>
        Ingredients, then nutrition, then the allergen statement if it is separate.
      </AppText>
      {SLOTS.map((item) => (
        <Pressable key={item.id} accessibilityRole="button" onPress={() => setSlot(item.id)} style={styles.sectionRow}>
          <AppText variant="headline">{item.label}</AppText>
          <AppText variant="caption" color={photos[item.id] ? colors.primary : colors.textTertiary}>
            {photos[item.id] ? 'Added' : 'Add'}
          </AppText>
        </Pressable>
      ))}
      {failure ? (
        <AppText variant="caption" color={colors.avoid}>
          {failure}
        </AppText>
      ) : null}
      <Button label="Read label" onPress={() => void read()} loading={busy === 'read'} disabled={!photos.ingredients} />
      <Button label="Scan barcode" variant="ghost" onPress={() => navigation.replace('BarcodeScanner')} />
      {busy === 'read' ? <AnalysisLoader subtitle="Reading the label" /> : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, backgroundColor: '#171713' },
  chrome: { ...StyleSheet.absoluteFill, justifyContent: 'space-between', paddingHorizontal: 20, alignItems: 'center' },
  frameWrap: { alignItems: 'center', gap: 16, alignSelf: 'stretch' },
  frame: {
    width: '100%',
    maxWidth: 340,
    height: 220,
    borderRadius: 28,
    borderWidth: 1.5,
    borderColor: 'rgba(247, 245, 240, 0.9)',
    overflow: 'hidden',
  },
  center: { textAlign: 'center' },
  shutter: { width: 74, height: 74, borderRadius: 37, borderWidth: 3, borderColor: '#F7F5F0', alignItems: 'center', justifyContent: 'center' },
  shutterInner: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#F7F5F0' },
  sectionRow: { minHeight: 56, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  input: { minHeight: 48, borderBottomWidth: StyleSheet.hairlineWidth, fontSize: 16, paddingVertical: 8 },
  ingredients: { minHeight: 120, textAlignVertical: 'top' },
});
