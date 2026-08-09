-- Create initial SUPER_ADMIN user
-- Password: Admin@12345 (BCrypt hash, cost factor 12)
-- IMPORTANT: Change this password immediately after first login
INSERT INTO users (email, password_hash, first_name, last_name, role, is_email_verified, is_onboarding_complete)
VALUES (
    'admin@btrack.app',
    '$2y$12$skMSpe0ULXheRUIFzrxqQuAI5dm7R8S0L9fopb/3o/3ZNgF1RzoJS',  -- Admin@12345
    'System',
    'Admin',
    'SUPER_ADMIN',
    TRUE,
    TRUE
) ON CONFLICT (email) DO UPDATE SET role = 'SUPER_ADMIN';

-- Create profile for admin user
INSERT INTO user_profiles (user_id)
SELECT id FROM users WHERE email = 'admin@btrack.app'
ON CONFLICT (user_id) DO NOTHING;

-- Create subscription for admin user
INSERT INTO subscriptions (user_id, plan, status)
SELECT id, 'PREMIUM_ANNUAL', 'ACTIVE' FROM users WHERE email = 'admin@btrack.app'
ON CONFLICT (user_id) DO NOTHING;
