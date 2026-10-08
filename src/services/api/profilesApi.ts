import { api } from '@/services/api/client';
import type { HealthContext, Profile, ProfileInput } from '@/types/models';
import { ApiError } from '@/utils/errors';
import { normalizeProfile, normalizeProfiles } from '@/utils/normalize';

function payload(input: ProfileInput) {
  return {
    name: input.name.trim(),
    role: input.role,
    ageGroup: input.ageGroup,
    age: input.age,
    dateOfBirth: input.dateOfBirth,
    diet: input.diet,
    dietaryPreferences: input.dietaryPreferences,
    allergies: input.allergies,
    limits: input.limits,
    goals: input.goals,
    lifeStage: input.lifeStage,
    notes: input.notes,
    isPrimary: input.isPrimary,
  };
}

export async function fetchProfiles(): Promise<Profile[]> {
  const response = await api.get('/api/profiles');
  return normalizeProfiles(response.data);
}

export async function createProfile(input: ProfileInput): Promise<Profile> {
  const response = await api.post('/api/profiles', payload(input));
  const profile = normalizeProfile(response.data);
  if (!profile) {
    throw new ApiError('The profile was saved, but the response could not be read.');
  }
  return profile;
}

export async function updateProfile(id: string, input: ProfileInput): Promise<Profile> {
  const response = await api.put(`/api/profiles/${encodeURIComponent(id)}`, payload(input));
  const profile = normalizeProfile(response.data);
  if (!profile) {
    throw new ApiError('The profile was updated, but the response could not be read.');
  }
  return profile;
}

export async function deleteProfile(id: string): Promise<void> {
  await api.delete(`/api/profiles/${encodeURIComponent(id)}`);
}

export async function extractHealthContext(
  profileId: string,
  file: { uri: string; name?: string; type?: string },
): Promise<HealthContext> {
  const type = file.type === 'image/png' || file.type === 'image/webp' ? file.type : 'image/jpeg';
  const name = file.name ?? (type === 'image/png' ? 'report.png' : type === 'image/webp' ? 'report.webp' : 'report.jpg');
  const form = new FormData();
  form.append('image', { uri: file.uri, name, type } as unknown as Blob);
  const response = await api.post(`/api/profiles/${encodeURIComponent(profileId)}/health/extract`, form, { timeout: 60000 });
  const profile = normalizeProfile({ healthContext: response.data, name: 'draft', id: 'draft' });
  return (
    profile?.healthContext ?? {
      enabled: false,
      paused: false,
      biomarkers: [],
      dietaryRecommendations: [],
      reportCount: 0,
    }
  );
}

export async function saveHealthContext(profileId: string, input: HealthContext): Promise<Profile> {
  const response = await api.put(`/api/profiles/${encodeURIComponent(profileId)}/health`, {
    enabled: input.enabled,
    paused: input.paused,
    biomarkers: input.biomarkers.filter((item) => item.name.trim()).map((item) => ({ ...item, confirmedByUser: true })),
    dietaryRecommendations: input.dietaryRecommendations
      .filter((item) => item.recommendation.trim())
      .map((item) => ({ ...item, confirmedByUser: true })),
  });
  const profile = normalizeProfile(response.data);
  if (!profile) throw new ApiError('The health context was saved, but the response could not be read.');
  return profile;
}

export async function clearHealthContext(profileId: string): Promise<Profile> {
  const response = await api.delete(`/api/profiles/${encodeURIComponent(profileId)}/health`);
  const profile = normalizeProfile(response.data);
  if (!profile) throw new ApiError('The health context was removed, but the response could not be read.');
  return profile;
}
