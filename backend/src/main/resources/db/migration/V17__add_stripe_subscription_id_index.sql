-- Stripe webhook handlers (customer.subscription.updated/deleted) look up by
-- stripe_subscription_id on every delivery; its sibling stripe_customer_id
-- got an index in V16, this one was missed.
CREATE INDEX idx_subscriptions_stripe_subscription_id ON subscriptions(stripe_subscription_id);
