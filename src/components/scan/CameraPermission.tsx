import { Linking, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { Screen } from '@/components/ui/Screen';
import { EmptyState } from '@/components/ui/StateViews';

export function CameraPermission({
  canAskAgain,
  onRequest,
  onClose,
}: {
  canAskAgain: boolean;
  onRequest: () => void;
  onClose: () => void;
}) {
  return (
    <Screen
      edges={['top', 'left', 'right', 'bottom']}
      footer={
        <View style={{ gap: 10 }}>
          <Button
            label={canAskAgain ? 'Allow camera' : 'Open Settings'}
            onPress={() => {
              if (canAskAgain) onRequest();
              else void Linking.openSettings();
            }}
          />
          <Button label="Go back" variant="secondary" onPress={onClose} />
        </View>
      }
    >
      <EmptyState
        icon="camera-outline"
        title="Camera access"
        message={
          canAskAgain
            ? 'FoodLens uses the camera to scan barcodes and photograph ingredient labels.'
            : 'Camera access is turned off. Enable it in Settings to scan food.'
        }
      />
    </Screen>
  );
}
