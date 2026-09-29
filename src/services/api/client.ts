import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios';

import { API_URL } from '@/constants/config';
import { getToken } from '@/services/storage/tokenStorage';
import { ApiError, parseErrorBody } from '@/utils/errors';

export const api = axios.create({
  baseURL: API_URL,
  timeout: 20000,
  headers: {
    Accept: 'application/json',
  },
});

let unauthorizedHandler: (() => Promise<void> | void) | null = null;

export function setUnauthorizedHandler(handler: () => Promise<void> | void): void {
  unauthorizedHandler = handler;
}

function isAuthPath(url: string | undefined): boolean {
  if (!url) return false;
  return url.includes('/api/auth/login') || url.includes('/api/auth/register');
}

function toApiError(error: unknown): ApiError {
  if (error instanceof ApiError) return error;
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError;
    if (!axiosError.response) {
      return new ApiError('We could not reach FoodLens. Check your connection and try again.', {
        isNetwork: true,
      });
    }
    const parsed = parseErrorBody(axiosError.response.data, axiosError.response.status);
    return new ApiError(parsed.message, {
      status: axiosError.response.status,
      code: parsed.code,
      fieldErrors: parsed.fieldErrors,
    });
  }
  if (error instanceof Error && error.message) return new ApiError(error.message);
  return new ApiError('Something went wrong. Please try again.');
}

api.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
  if (!API_URL) {
    throw new ApiError('Set EXPO_PUBLIC_API_URL to your FoodLens backend, then restart the app.');
  }

  const token = await getToken();
  if (token) {
    config.headers.set('Authorization', `Bearer ${token}`);
  }

  if (typeof FormData !== 'undefined' && config.data instanceof FormData) {
    config.headers.delete('Content-Type');
  } else if (!config.headers.has('Content-Type')) {
    config.headers.set('Content-Type', 'application/json');
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error: unknown) => {
    const apiError = toApiError(error);
    if (
      axios.isAxiosError(error) &&
      error.response?.status === 401 &&
      !isAuthPath(error.config?.url) &&
      unauthorizedHandler
    ) {
      await unauthorizedHandler();
    }
    return Promise.reject(apiError);
  },
);
