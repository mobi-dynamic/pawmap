import Constants from 'expo-constants';

const envApiBaseUrl = process.env.EXPO_PUBLIC_API_BASE_URL;
const extraApiBaseUrl = Constants.expoConfig?.extra?.apiBaseUrl;

export const apiBaseUrl = envApiBaseUrl ?? extraApiBaseUrl ?? 'http://127.0.0.1:8000';

export function buildApiUrl(path: string) {
  return `${apiBaseUrl.replace(/\/$/, '')}${path.startsWith('/') ? path : `/${path}`}`;
}
