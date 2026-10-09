import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { CameraView, useCameraPermissions, type BarcodeScanningResult, type BarcodeType } from 'expo-camera';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef, useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AnalysisLoader } from '@/components/scan/AnalysisLoader';
import { CameraPermission } from '@/components/scan/CameraPermission';
import { CameraIconButton, ScanLine, ScanModes } from '@/components/scan/ScannerChrome';
import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { LoadingState } from '@/components/ui/StateViews';
import { useProfiles, useScanMutations } from '@/hooks/useFoodData';
import { quickScanBarcode } from '@/services/api/scansApi';
import { useTheme } from '@/theme/ThemeProvider';
import type { RootStackParamList } from '@/types/navigation';
import { ApiError } from '@/utils/errors';
import { warningHaptic, successHaptic } from '@/utils/haptics';
import { scanEvent } from '@/utils/scanEvents';

type Props = NativeStackScreenProps<RootStackParamList, 'BarcodeScanner'>;
type FailureKind = 'product' | 'network' | 'lookup' | null;

const BARCODE_TYPES: BarcodeType[] = [
  'ean13',
  'ean8',
  'upc_a',
  'upc_e',
  'code128',
  'code39',
  'code93',
  'itf14',
  'codabar',
  'qr',
  'pdf417',
  'aztec',
  'datamatrix',
];
const HINTS = ['Place the barcode inside the frame', 'Move closer', 'Hold steady', 'More light'];
const FINDER_HEIGHT = 168;

function productCode(value: string, type?: string): string | null {
  const code = value.replace(/[\s-]/g, '');
  const matrix = type === 'qr' || type === 'pdf417' || type === 'aztec' || type === 'datamatrix';
  if (matrix && !/^\d{8,14}$/.test(code)) return null;
  if (!/^[0-9A-Za-z]{4,32}$/.test(code)) return null;
  return code;
}

export function BarcodeScannerScreen({ navigation }: Props) {
  const { colors, radius } = useTheme();
  const insets = useSafeAreaInsets();
  const [permission, requestPermission] = useCameraPermissions();
  const profiles = useProfiles();
  const { barcode } = useScanMutations();
  const locked = useRef(false);
  const [torch, setTorch] = useState(false);
  const [zoom, setZoom] = useState(0);
  const [hint, setHint] = useState(0);
  const [statusLine, setStatusLine] = useState('Place the barcode inside the frame');
  const [analyzing, setAnalyzing] = useState(false);
  const [failure, setFailure] = useState<FailureKind>(null);
  const [foundCode, setFoundCode] = useState<string | null>(null);
  const [manual, setManual] = useState('');

  useEffect(() => {
    scanEvent('camera_started');
  }, []);

  useEffect(() => {
    if (analyzing || failure) return;
    const hints = setInterval(() => setHint((value) => (value + 1) % HINTS.length), 2400);
    const closer = setTimeout(() => setZoom(0.18), 5000);
    return () => {
      clearInterval(hints);
      clearTimeout(closer);
    };
  }, [analyzing, failure]);

  if (!permission) return <LoadingState message="Checking camera access" />;
  if (!permission.granted) {
    return (
      <CameraPermission
        canAskAgain={permission.canAskAgain}
        onRequest={() => void requestPermission()}
        onClose={() => navigation.goBack()}
      />
    );
  }

  const finishError = (error: unknown) => {
    void warningHaptic();
    setAnalyzing(false);
    if (error instanceof ApiError && error.isNetwork) {
      scanEvent('barcode_lookup_failed');
      setFailure('network');
      return;
    }
    if (error instanceof ApiError && (error.code === 'PRODUCT_NOT_FOUND' || error.status === 404)) {
      scanEvent('barcode_lookup_not_found');
      setFailure('product');
      return;
    }
    scanEvent('barcode_lookup_failed');
    setFailure('lookup');
  };

  const lookup = (code: string) => {
    const family = (profiles.data ?? []).length > 0;
    locked.current = true;
    setFoundCode(code);
    setStatusLine('Looking up product...');
    setAnalyzing(true);
    setFailure(null);
    scanEvent('barcode_lookup_started');
    void successHaptic();
    if (family) {
      barcode.mutate(
        { barcode: code },
        {
          onSuccess: (scan) => {
            scanEvent('barcode_lookup_success');
            scanEvent('analysis_success');
            navigation.replace('AnalysisResult', { scan });
          },
          onError: finishError,
        },
      );
      return;
    }
    void quickScanBarcode({ barcode: code }).then(
      (quick) => {
        scanEvent('barcode_lookup_success');
        scanEvent('analysis_success');
        navigation.replace('AnalysisResult', { quick });
      },
      finishError,
    );
  };

  const onBarcodeScanned = (result: BarcodeScanningResult) => {
    if (locked.current || failure) return;
    const code = productCode(result.data ?? '', result.type);
    if (!code) return;
    scanEvent('barcode_detected');
    setStatusLine('Barcode detected');
    lookup(code);
  };

  const retry = () => {
    locked.current = false;
    setFailure(null);
    setAnalyzing(false);
    setFoundCode(null);
    setStatusLine(HINTS[0]);
  };

  return (
    <View style={styles.fill}>
      <StatusBar style={analyzing ? 'dark' : 'light'} />
      <CameraView
        style={styles.fill}
        facing="back"
        mode="picture"
        zoom={zoom}
        enableTorch={torch}
        barcodeScannerSettings={{ barcodeTypes: BARCODE_TYPES }}
        onBarcodeScanned={analyzing || failure ? undefined : onBarcodeScanned}
      />
      {analyzing ? (
        <View style={[styles.processing, { backgroundColor: colors.background, paddingTop: insets.top }]}>
          <AnalysisLoader subtitle={foundCode ? 'Looking up product' : 'Checking this barcode'} />
        </View>
      ) : (
        <View style={[styles.chrome, { paddingTop: insets.top + 8, paddingBottom: insets.bottom + 16 }]}>
          <View style={styles.toolbar}>
            <CameraIconButton label="Close scanner" icon="close" onPress={() => navigation.goBack()} />
            <CameraIconButton
              label={torch ? 'Turn torch off' : 'Turn torch on'}
              icon={torch ? 'flashlight' : 'flashlight-outline'}
              onPress={() => setTorch((value) => !value)}
            />
          </View>
          <View style={styles.finderWrap}>
            <View style={styles.finder}>
              <ScanLine height={FINDER_HEIGHT} />
            </View>
            <AppText variant="bodyMedium" color="#F7F5F0" style={styles.caption}>
              {failure ? statusLine : HINTS[hint]}
            </AppText>
          </View>
          {failure ? (
            <View style={[styles.failure, { backgroundColor: colors.background, borderRadius: radius.lg }]}>
              <AppText variant="headline" style={styles.captionDark}>
                {failure === 'product' ? 'We found the barcode, but not this product.' : failure === 'network' ? 'Barcode detected' : "Can't find the barcode yet"}
              </AppText>
              <AppText variant="caption" color={colors.textSecondary} style={styles.captionDark}>
                {failure === 'product'
                  ? "Let's read the package instead."
                  : failure === 'network'
                    ? 'Product lookup is unavailable.'
                    : 'Move closer, keep the barcode flat, and add more light.'}
              </AppText>
              {failure === 'product' ? (
                <>
                  <Button label="Scan package" onPress={() => navigation.replace('LabelCamera', { barcode: foundCode ?? undefined })} />
                  <Button label="Try again" variant="secondary" onPress={retry} />
                </>
              ) : (
                <Button label="Try again" onPress={retry} />
              )}
              <TextInput
                value={manual}
                onChangeText={setManual}
                placeholder="Enter barcode"
                placeholderTextColor={colors.textTertiary}
                keyboardType="number-pad"
                accessibilityLabel="Enter barcode"
                style={[styles.input, { color: colors.text, borderColor: colors.border }]}
              />
              <Button
                label="Look up barcode"
                variant="ghost"
                onPress={() => {
                  const code = productCode(manual);
                  if (!code) return;
                  lookup(code);
                }}
              />
            </View>
          ) : (
            <ScanModes mode="barcode" onBarcode={() => undefined} onLabel={() => navigation.replace('LabelCamera')} />
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, backgroundColor: '#171713' },
  chrome: { ...StyleSheet.absoluteFill, justifyContent: 'space-between', paddingHorizontal: 20 },
  toolbar: { flexDirection: 'row', justifyContent: 'space-between' },
  finderWrap: { alignItems: 'center', gap: 18 },
  finder: {
    width: '100%',
    maxWidth: 300,
    height: FINDER_HEIGHT,
    borderRadius: 28,
    borderWidth: 1.5,
    borderColor: 'rgba(247, 245, 240, 0.9)',
    overflow: 'hidden',
  },
  caption: { textAlign: 'center' },
  captionDark: { textAlign: 'center' },
  processing: { ...StyleSheet.absoluteFill },
  failure: { padding: 18, gap: 10 },
  input: { minHeight: 48, borderBottomWidth: StyleSheet.hairlineWidth, fontSize: 16, paddingHorizontal: 4 },
});
