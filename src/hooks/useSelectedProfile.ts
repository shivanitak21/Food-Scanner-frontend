import { useEffect } from 'react';

import { useProfiles } from '@/hooks/useFoodData';
import { useProfileStore } from '@/state/profileStore';
import type { Profile } from '@/types/models';

export function useSelectedProfile(): {
  profiles: Profile[];
  selected: Profile | null;
  isLoading: boolean;
  isRefetching: boolean;
  isError: boolean;
  error: unknown;
  refetch: () => void;
  select: (id: string) => void;
} {
  const query = useProfiles();
  const selectedProfileId = useProfileStore((state) => state.selectedProfileId);
  const setSelectedProfileId = useProfileStore((state) => state.setSelectedProfileId);
  const profiles = query.data ?? [];
  const selected = profiles.find((profile) => profile.id === selectedProfileId) ?? null;

  useEffect(() => {
    if (profiles.length === 0 || selected) return;
    const next = profiles.find((profile) => profile.isPrimary || profile.role === 'self') ?? profiles[0];
    setSelectedProfileId(next.id);
  }, [profiles, selected, setSelectedProfileId]);

  return {
    profiles,
    selected,
    isLoading: query.isLoading,
    isRefetching: query.isRefetching,
    isError: query.isError,
    error: query.error,
    refetch: () => {
      void query.refetch();
    },
    select: setSelectedProfileId,
  };
}
