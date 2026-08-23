// Minimal stand-in for react-native-iap's native module surface — enough for
// modules that import from it to load under Jest without touching StoreKit/
// Play Billing, which don't exist in a Node test environment.
export enum ErrorCode {
  E_UNKNOWN = 'E_UNKNOWN',
  E_USER_CANCELLED = 'E_USER_CANCELLED',
  E_ITEM_UNAVAILABLE = 'E_ITEM_UNAVAILABLE',
}

export const useIAP = jest.fn(() => ({
  connected: false,
  subscriptions: [],
  promotedProductsIOS: [],
  purchaseHistory: [],
  availablePurchases: [],
  currentPurchase: undefined,
  currentPurchaseError: undefined,
  initConnectionError: undefined,
  finishTransaction: jest.fn(),
  getAvailablePurchases: jest.fn(),
  getPurchaseHistory: jest.fn(),
  getProducts: jest.fn(),
  getSubscriptions: jest.fn(),
  requestPurchase: jest.fn(),
  requestSubscription: jest.fn(),
}));
