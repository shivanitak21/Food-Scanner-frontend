import { useEffect, useState } from 'react';

import { useProfileStore } from '@/state/profileStore';
import { useSettingsStore } from '@/state/settingsStore';

export function usePersistedStoresReady(): boolean {
  const [ready, setReady] = useState(
    () => useSettingsStore.persist.hasHydrated() && useProfileStore.persist.hasHydrated(),
  );

  useEffect(() => {
    const update = () => {
      setReady(useSettingsStore.persist.hasHydrated() && useProfileStore.persist.hasHydrated());
    };
    update();
    const unsubSettings = useSettingsStore.persist.onFinishHydration(update);
    const unsubProfile = useProfileStore.persist.onFinishHydration(update);
    return () => {
      unsubSettings();
      unsubProfile();
    };
  }, []);

  return ready;
}
