import { Platform } from 'react-native';

// Set to true to run entirely on local storage — no backend needed.
export const USE_MOCK_API = false;

// Android emulator can't reach the host machine via `localhost` — it maps
// `localhost` to the emulator itself, so it needs the special 10.0.2.2 alias.
// iOS Simulator shares the Mac's network stack, so `localhost` works there —
// but a physical iOS device is a separate device on the network and `localhost`
// would resolve to the phone itself, not the Mac. Use the Mac's LAN IP for
// iOS too; it works for both the Simulator and a physical device on the same
// Wi-Fi network. Update this if your machine's LAN IP changes (check with
// `ipconfig getifaddr en0`).
const DEV_LAN_IP = '192.168.1.2';

export const API_BASE_URL = __DEV__
  ? Platform.OS === 'android'
    ? 'http://10.0.2.2:8080/api/v1'
    : `http://${DEV_LAN_IP}:8080/api/v1`
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
