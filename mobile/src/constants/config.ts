import { Platform } from 'react-native';

// Set to true to run entirely on local storage — no backend needed.
export const USE_MOCK_API = false;

// Android emulator can't reach the host machine via `localhost` — it maps
// `localhost` to the emulator itself, so it needs the special 10.0.2.2 alias.
// iOS simulator and physical devices on the same network reach `localhost`/LAN fine.
export const API_BASE_URL = __DEV__
  ? Platform.OS === 'android'
    ? 'http://10.0.2.2:8080/api/v1'
    : 'http://localhost:8080/api/v1'
  : 'https://api.btrack.app/api/v1';

export const IAP_PRODUCTS = {
  PREMIUM_MONTHLY_IOS: 'com.btrack.premium.monthly',
  PREMIUM_ANNUAL_IOS: 'com.btrack.premium.annual',
  PREMIUM_MONTHLY_ANDROID: 'com.btrack.premium.monthly',
  PREMIUM_ANNUAL_ANDROID: 'com.btrack.premium.annual',
};

export const FREE_PLAN_LIMITS = {
  MAX_WORKOUT_PLANS: 3,
  MAX_CUSTOM_EXERCISES: 10,
  MAX_PROGRESS_PHOTOS: 5,
  WORKOUT_HISTORY_DAYS: 30,
};

export const QUICK_WATER_AMOUNTS = [150, 250, 350, 500, 750];
