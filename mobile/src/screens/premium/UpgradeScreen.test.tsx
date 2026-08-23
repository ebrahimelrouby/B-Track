import { displayPrice } from './displayPrice';
import type { Subscription as IapSubscription } from 'react-native-iap';

describe('displayPrice', () => {
  it('returns the fallback when no product data is available yet', () => {
    expect(displayPrice(undefined, '$9.99')).toBe('$9.99');
  });

  it('uses localizedPrice for an iOS subscription product', () => {
    const iosSub = {
      platform: 'ios',
      type: 'subs',
      productId: 'com.btrack.premium.monthly',
      title: 'Monthly',
      description: 'Monthly premium',
      price: '9.99',
      currency: 'USD',
      localizedPrice: '$9.99',
    } as unknown as IapSubscription;

    expect(displayPrice(iosSub, '$0.00')).toBe('$9.99');
  });

  it('uses the first offer\'s formatted price for an Android subscription product', () => {
    const androidSub = {
      platform: 'android',
      productType: 'subs',
      name: 'annual',
      title: 'Annual',
      description: 'Annual premium',
      productId: 'com.btrack.premium.annual',
      subscriptionOfferDetails: [
        {
          basePlanId: 'annual-base',
          offerId: null,
          offerToken: 'token-abc',
          pricingPhases: { pricingPhaseList: [{ formattedPrice: '$59.99', priceCurrencyCode: 'USD', billingPeriod: 'P1Y', billingCycleCount: 0, recurrenceMode: 1 }] },
          offerTags: [],
        },
      ],
    } as unknown as IapSubscription;

    expect(displayPrice(androidSub, '$0.00')).toBe('$59.99');
  });

  it('falls back when an Android product has no offer details yet', () => {
    const androidSub = {
      platform: 'android',
      productType: 'subs',
      name: 'annual',
      title: 'Annual',
      description: 'Annual premium',
      productId: 'com.btrack.premium.annual',
      subscriptionOfferDetails: [],
    } as unknown as IapSubscription;

    expect(displayPrice(androidSub, '$59.99')).toBe('$59.99');
  });
});
