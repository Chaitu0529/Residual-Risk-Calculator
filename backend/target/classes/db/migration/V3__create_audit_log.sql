-- =============================================
-- V3: Create Audit Log Table
-- =============================================

CREATE TABLE IF NOT EXISTS audit_log (
    id          BIGSERIAL    PRIMARY KEY,
    username    VARCHAR(50)  NOT NULL,
    action      VARCHAR(50)  NOT NULL,
    entity_type VARCHAR(50),
    entity_id   BIGINT,
    description TEXT,
    ip_address  VARCHAR(50),
    user_agent  VARCHAR(500),
    old_values  TEXT,
    new_values  TEXT,
    status      VARCHAR(20)  NOT NULL DEFAULT 'SUCCESS',
    timestamp   TIMESTAMP    NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_audit_username  ON audit_log(username);
CREATE INDEX IF NOT EXISTS idx_audit_action    ON audit_log(action);
CREATE INDEX IF NOT EXISTS idx_audit_entity    ON audit_log(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_timestamp ON audit_log(timestamp DESC);
