ALTER TABLE subscriptions
    ADD COLUMN stripe_customer_id     VARCHAR(255),
    ADD COLUMN stripe_subscription_id VARCHAR(255);

CREATE INDEX idx_subscriptions_stripe_customer_id ON subscriptions(stripe_customer_id);

-- Apple/Google/Stripe can all redeliver webhook events on retry; every webhook
-- handler checks this table before acting so a redelivery is a no-op.
CREATE TABLE processed_webhook_events (
    event_id     VARCHAR(255) PRIMARY KEY,
    source       VARCHAR(20) NOT NULL,
    processed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);
