-- =============================================
-- V2: Create Risk Records Table
-- Uses VARCHAR instead of native PG enums so Hibernate
-- @Enumerated(EnumType.STRING) comparisons work without casting
-- =============================================

CREATE TABLE IF NOT EXISTS risk_records (
    id                    BIGSERIAL     PRIMARY KEY,
    risk_title            VARCHAR(200)  NOT NULL,
    description           TEXT,
    category              VARCHAR(50)   NOT NULL,
    likelihood            INTEGER       NOT NULL CHECK (likelihood BETWEEN 1 AND 10),
    impact                INTEGER       NOT NULL CHECK (impact BETWEEN 1 AND 10),
    inherent_risk         NUMERIC(10,2),
    control_effectiveness INTEGER       DEFAULT 0 CHECK (control_effectiveness BETWEEN 0 AND 100),
    residual_risk         NUMERIC(10,2),
    risk_level            VARCHAR(20),
    status                VARCHAR(20)   NOT NULL DEFAULT 'OPEN',
    ai_description        TEXT,
    ai_recommendations    TEXT,
    ai_report             TEXT,
    attachment_path       VARCHAR(500),
    attachment_name       VARCHAR(255),
    created_by            VARCHAR(50),
    created_at            TIMESTAMP     NOT NULL DEFAULT NOW(),
    updated_at            TIMESTAMP     NOT NULL DEFAULT NOW(),
    deleted_at            TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_risk_category   ON risk_records(category);
CREATE INDEX IF NOT EXISTS idx_risk_status     ON risk_records(status);
CREATE INDEX IF NOT EXISTS idx_risk_level      ON risk_records(risk_level);
CREATE INDEX IF NOT EXISTS idx_risk_created_by ON risk_records(created_by);
CREATE INDEX IF NOT EXISTS idx_risk_deleted_at ON risk_records(deleted_at);
CREATE INDEX IF NOT EXISTS idx_risk_created_at ON risk_records(created_at);
CREATE INDEX IF NOT EXISTS idx_risk_title_gin  ON risk_records USING GIN (to_tsvector('english', risk_title));
