import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import { useRef, useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { Screen } from '@/components/ui/Screen';
import { LoadingState } from '@/components/ui/StateViews';
import { useProfiles } from '@/hooks/useFoodData';
import { clearHealthContext, extractHealthContext, saveHealthContext } from '@/services/api/profilesApi';
import { useTheme } from '@/theme/ThemeProvider';
import type { HealthBiomarker, HealthInterpretation, HealthRecommendation } from '@/types/models';
import type { RootStackParamList } from '@/types/navigation';
import { getErrorMessage } from '@/utils/errors';

type Props = NativeStackScreenProps<RootStackParamList, 'HealthContext'>;
type Step = 'intro' | 'camera' | 'review' | 'saved';

const INTERPRETATIONS: HealthInterpretation[] = ['elevated', 'borderline', 'normal', 'low'];

export function HealthContextScreen({ navigation, route }: Props) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const cameraRef = useRef<CameraView>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const profiles = useProfiles();
  const existing = (profiles.data ?? []).find((profile) => profile.id === route.params.profileId);
  const saved = existing?.healthContext;
  const [step, setStep] = useState<Step>(saved && saved.biomarkers.length + saved.dietaryRecommendations.length > 0 ? 'saved' : 'intro');
  const [biomarkers, setBiomarkers] = useState<HealthBiomarker[]>(saved?.biomarkers ?? []);
  const [notes, setNotes] = useState<HealthRecommendation[]>(saved?.dietaryRecommendations ?? []);
  const [paused, setPaused] = useState(saved?.paused ?? false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const readPage = async (file: { uri: string; name?: string; type?: string }) => {
    setError(null);
    setBusy(true);
    try {
      const draft = await extractHealthContext(route.params.profileId, file);
      setBiomarkers(draft.biomarkers);
      setNotes(draft.dietaryRecommendations);
      setStep('review');
    } catch (caught) {
      setError(getErrorMessage(caught));
    } finally {
      setBusy(false);
    }
  };

  const capture = async () => {
    const picture = await cameraRef.current?.takePictureAsync({ quality: 0.8 });
    if (!picture?.uri) {
      setError('The camera did not return a photo.');
      return;
    }
    await readPage({ uri: picture.uri, name: 'report.jpg', type: 'image/jpeg' });
  };

  const upload = async () => {
    setError(null);
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setError('Allow photo access to upload a report page.');
      return;
    }
    const picked = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
    });
    if (picked.canceled || !picked.assets[0]) return;
    const asset = picked.assets[0];
    const type = asset.mimeType === 'image/jpg' ? 'image/jpeg' : asset.mimeType;
    try {
      if (type === 'image/jpeg' || type === 'image/png' || type === 'image/webp') {
        const name = type === 'image/png' ? 'report.png' : type === 'image/webp' ? 'report.webp' : 'report.jpg';
        await readPage({ uri: asset.uri, name, type });
        return;
      }
      const converted = await manipulateAsync(asset.uri, [], { compress: 0.85, format: SaveFormat.JPEG });
      await readPage({ uri: converted.uri, name: 'report.jpg', type: 'image/jpeg' });
    } catch (caught) {
      setError(getErrorMessage(caught));
    }
  };

  const confirm = async () => {
    setBusy(true);
    setError(null);
    try {
      await saveHealthContext(route.params.profileId, {
        enabled: true,
        paused,
        biomarkers,
        dietaryRecommendations: notes,
        reportCount: 1,
      });
      await profiles.refetch();
      setStep('saved');
    } catch (caught) {
      setError(getErrorMessage(caught));
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    setBusy(true);
    try {
      await clearHealthContext(route.params.profileId);
      await profiles.refetch();
      setBiomarkers([]);
      setNotes([]);
      setPaused(false);
      setStep('intro');
    } catch (caught) {
      setError(getErrorMessage(caught));
    } finally {
      setBusy(false);
    }
  };

  if (step === 'camera') {
    if (!permission) return <LoadingState message="Camera" />;
    if (!permission.granted) {
      return (
        <Screen>
          <AppText variant="title">Camera access</AppText>
          <Button label="Allow camera" onPress={() => void requestPermission()} />
          <Button label="Upload a photo" variant="secondary" onPress={() => void upload()} loading={busy} />
          <Button label="Back" variant="ghost" onPress={() => setStep('intro')} />
          {error ? (
            <AppText variant="caption" color={colors.avoid}>
              {error}
            </AppText>
          ) : null}
        </Screen>
      );
    }
    return (
      <View style={[styles.fill, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
        <CameraView ref={cameraRef} style={styles.fill} facing="back" mode="picture" />
        <View style={styles.cameraCopy}>
          <AppText variant="bodyMedium" color="#F7F5F0" style={styles.center}>
            {busy ? 'Reading the page' : 'Photograph one page of the report'}
          </AppText>
          <Button label={busy ? 'Reading' : 'Capture'} onPress={() => void capture()} loading={busy} />
          <Button label="Upload a photo" variant="inverse" onPress={() => void upload()} disabled={busy} />
          <Button label="Cancel" variant="secondary" onPress={() => setStep('intro')} />
          {error ? (
            <AppText variant="caption" color="#F7F5F0" style={styles.center}>
              {error}
            </AppText>
          ) : null}
        </View>
      </View>
    );
  }

  if (step === 'review') {
    return (
      <Screen edges={['top', 'left', 'right']}>
        <AppText variant="label" color={colors.textTertiary}>
          Confirm before saving
        </AppText>
        <AppText variant="display">Health information found</AppText>
        <AppText variant="body" color={colors.textSecondary}>
          Nothing is saved until you confirm. This is not a diagnosis.
        </AppText>
        {biomarkers.map((item, index) => (
          <View key={`${item.name}-${index}`} style={styles.block}>
            <TextInput
              value={item.name}
              onChangeText={(name) => setBiomarkers((current) => current.map((row, rowIndex) => (rowIndex === index ? { ...row, name } : row)))}
              accessibilityLabel="Name"
              style={[styles.input, { color: colors.text, borderColor: colors.border }]}
            />
            <AppText variant="caption" color={colors.textSecondary}>
              {[item.value, item.unit].filter((part) => part !== null && part !== undefined && part !== '').join(' ')}
            </AppText>
            <View style={styles.chips}>
              {INTERPRETATIONS.map((option) => (
                <Pressable
                  key={option}
                  accessibilityRole="button"
                  onPress={() =>
                    setBiomarkers((current) => current.map((row, rowIndex) => (rowIndex === index ? { ...row, interpretation: option } : row)))
                  }
                >
                  <AppText variant="caption" color={item.interpretation === option ? colors.primary : colors.textTertiary}>
                    {option}
                  </AppText>
                </Pressable>
              ))}
            </View>
          </View>
        ))}
        {notes.map((item, index) => (
          <TextInput
            key={`${item.recommendation}-${index}`}
            value={item.recommendation}
            onChangeText={(recommendation) => setNotes((current) => current.map((row, rowIndex) => (rowIndex === index ? { ...row, recommendation } : row)))}
            accessibilityLabel="Dietary note"
            style={[styles.input, { color: colors.text, borderColor: colors.border }]}
          />
        ))}
        {biomarkers.length + notes.length === 0 ? (
          <AppText variant="body" color={colors.textSecondary}>
            No nutrition-related values were read. Photograph or upload the page again.
          </AppText>
        ) : null}
        {error ? (
          <AppText variant="caption" color={colors.avoid}>
            {error}
          </AppText>
        ) : null}
        <Button label="Confirm" onPress={() => void confirm()} loading={busy} disabled={biomarkers.length + notes.length === 0} />
        <Button label="Choose another page" variant="secondary" onPress={() => setStep('intro')} />
      </Screen>
    );
  }

  if (step === 'saved') {
    const count = (saved?.biomarkers.length ?? biomarkers.length) + (saved?.dietaryRecommendations.length ?? notes.length);
    return (
      <Screen edges={['top', 'left', 'right']}>
        <AppText variant="label" color={colors.textTertiary}>
          Report
        </AppText>
        <AppText variant="display">{count} confirmed {count === 1 ? 'item' : 'items'}</AppText>
        <AppText variant="body" color={colors.textSecondary}>
          {paused ? 'Paused for future scans.' : 'Used only to decide which nutrition details to surface.'}
        </AppText>
        <Button label={paused ? 'Resume' : 'Pause'} variant="secondary" onPress={() => void saveHealthContext(route.params.profileId, {
          enabled: true,
          paused: !paused,
          biomarkers: saved?.biomarkers ?? biomarkers,
          dietaryRecommendations: saved?.dietaryRecommendations ?? notes,
          reportCount: saved?.reportCount ?? 1,
        }).then(() => {
          setPaused((value) => !value);
          return profiles.refetch();
        })} />
        <Button label="Replace" variant="secondary" onPress={() => setStep('intro')} />
        <Button label="Delete" variant="danger" onPress={() => void remove()} loading={busy} />
        {error ? (
          <AppText variant="caption" color={colors.avoid}>
            {error}
          </AppText>
        ) : null}
      </Screen>
    );
  }

  return (
    <Screen edges={['top', 'left', 'right']}>
      <AppText variant="label" color={colors.textTertiary}>
        Optional
      </AppText>
      <AppText variant="display">Report</AppText>
      <AppText variant="body" color={colors.textSecondary}>
        Photograph a page, or upload one you already have. Your health information is sensitive. Information you confirm is used only to personalize food insights for this profile. It is not a diagnosis, and it is not shared as a medical detail in the family summary.
      </AppText>
      {error ? (
        <AppText variant="caption" color={colors.avoid}>
          {error}
        </AppText>
      ) : null}
      <Button label="Take a photo" icon="camera-outline" onPress={() => setStep('camera')} />
      <Button label={busy ? 'Reading' : 'Upload a photo'} icon="image-outline" variant="secondary" onPress={() => void upload()} loading={busy} />
      <Button label="Not now" variant="ghost" onPress={() => navigation.goBack()} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, backgroundColor: '#171713' },
  cameraCopy: { position: 'absolute', left: 20, right: 20, bottom: 28, gap: 10 },
  center: { textAlign: 'center' },
  block: { gap: 6, paddingVertical: 8 },
  chips: { flexDirection: 'row', gap: 14, minHeight: 44, alignItems: 'center' },
  input: { minHeight: 48, borderBottomWidth: StyleSheet.hairlineWidth, fontSize: 16 },
});
