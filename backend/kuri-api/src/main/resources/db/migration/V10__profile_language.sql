ALTER TABLE user_profile ADD COLUMN preferred_language varchar(5) NOT NULL DEFAULT 'en'
    CHECK (preferred_language IN ('en', 'zh-CN'));
