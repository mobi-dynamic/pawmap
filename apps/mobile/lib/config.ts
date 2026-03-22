import Constants from 'expo-constants';

const envApiBaseUrl = process.env.EXPO_PUBLIC_API_BASE_URL;
const extraApiBaseUrl = Constants.expoConfig?.extra?.apiBaseUrl;
const envDevUserId = process.env.EXPO_PUBLIC_DEV_USER_ID;
const extraDevUserId = Constants.expoConfig?.extra?.devUserId;

export const apiBaseUrl = envApiBaseUrl ?? extraApiBaseUrl ?? 'http://127.0.0.1:8000';
export const devUserId = envDevUserId ?? extraDevUserId ?? '00000000-0000-4000-8000-000000000010';

export function buildApiUrl(path: string) {
  return `${apiBaseUrl.replace(/\/$/, '')}${path.startsWith('/') ? path : `/${path}`}`;
}
