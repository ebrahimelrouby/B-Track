import type { Subscription as IapSubscription } from 'react-native-iap';

export function displayPrice(sub: IapSubscription | undefined, fallback: string): string {
  if (!sub) return fallback;
  if ('localizedPrice' in sub && sub.localizedPrice) return sub.localizedPrice;
  if ('subscriptionOfferDetails' in sub) {
    const phase = sub.subscriptionOfferDetails?.[0]?.pricingPhases?.pricingPhaseList?.[0];
    if (phase?.formattedPrice) return phase.formattedPrice;
  }
  return fallback;
}
