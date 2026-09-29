import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { fetchMe } from '@/services/api/authApi';
import { fetchProduct } from '@/services/api/productsApi';
import { createProfile, deleteProfile, fetchProfiles, updateProfile } from '@/services/api/profilesApi';
import { fetchScanHistory, scanBarcode, scanLabel } from '@/services/api/scansApi';
import { useAuthStore } from '@/state/authStore';
import type { ProfileInput } from '@/types/models';

export function useCurrentUser() {
  const status = useAuthStore((state) => state.status);
  const setUser = useAuthStore((state) => state.setUser);
  const cached = useAuthStore((state) => state.user);

  return useQuery({
    queryKey: ['user'],
    queryFn: async () => {
      const user = await fetchMe();
      setUser(user);
      return user;
    },
    enabled: status === 'authenticated',
    placeholderData: cached ?? undefined,
  });
}

export function useProfiles() {
  const status = useAuthStore((state) => state.status);
  return useQuery({
    queryKey: ['profiles'],
    queryFn: fetchProfiles,
    enabled: status === 'authenticated',
  });
}

export function useScanHistory() {
  const status = useAuthStore((state) => state.status);
  return useQuery({
    queryKey: ['scans', 'history'],
    queryFn: fetchScanHistory,
    enabled: status === 'authenticated',
  });
}

export function useProduct(productId: string | undefined) {
  return useQuery({
    queryKey: ['products', productId],
    queryFn: () => fetchProduct(productId as string),
    enabled: Boolean(productId),
  });
}

export function useProfileMutations() {
  const queryClient = useQueryClient();

  const invalidate = async () => {
    await queryClient.invalidateQueries({ queryKey: ['profiles'] });
  };

  const create = useMutation({
    mutationFn: (input: ProfileInput) => createProfile(input),
    onSuccess: invalidate,
  });

  const update = useMutation({
    mutationFn: ({ id, input }: { id: string; input: ProfileInput }) => updateProfile(id, input),
    onSuccess: invalidate,
  });

  const remove = useMutation({
    mutationFn: (id: string) => deleteProfile(id),
    onSuccess: invalidate,
  });

  return { create, update, remove };
}

export function useScanMutations() {
  const queryClient = useQueryClient();

  const invalidate = async () => {
    await queryClient.invalidateQueries({ queryKey: ['scans', 'history'] });
  };

  const barcode = useMutation({
    mutationFn: scanBarcode,
    onSuccess: invalidate,
  });

  const label = useMutation({
    mutationFn: scanLabel,
    onSuccess: invalidate,
  });

  return { barcode, label };
}
