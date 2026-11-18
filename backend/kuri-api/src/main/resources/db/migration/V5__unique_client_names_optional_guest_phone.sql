ALTER TABLE user_profile
    ALTER COLUMN phone DROP NOT NULL;

CREATE UNIQUE INDEX user_profile_name_unique_idx
    ON user_profile (lower(btrim(name)));
