-- =============================================
-- V4: Seed Data - Admin User + 30 Risk Records
-- =============================================

-- Admin user (password: Admin@123456)
-- BCrypt $2a$10$ hash verified against Spring Security BCryptPasswordEncoder
INSERT INTO users (username, email, password, full_name, is_active)
VALUES (
    'admin',
    'admin@tool114.com',
    '$2a$10$wGtKlcE9V1uYb5WyjauGw.7Dz/dEG1pAloW7MveZsAXX2vOdX9dZm',
    'System Administrator',
    true
) ON CONFLICT (username) DO NOTHING;

-- Regular user (password: User@123456)
-- BCrypt $2a$10$ hash verified against Spring Security BCryptPasswordEncoder
INSERT INTO users (username, email, password, full_name, is_active)
VALUES (
    'analyst',
    'analyst@tool114.com',
    '$2a$10$vDulcXDxlxyIP1J4zx2CsOvp8YBVLcbxHKij.8K2pBN.HPFglrmbq',
    'Risk Analyst',
    true
) ON CONFLICT (username) DO NOTHING;

-- Assign roles
INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id FROM users u, roles r
WHERE u.username = 'admin' AND r.name = 'ROLE_ADMIN'
ON CONFLICT DO NOTHING;

INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id FROM users u, roles r
WHERE u.username = 'admin' AND r.name = 'ROLE_USER'
ON CONFLICT DO NOTHING;

INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id FROM users u, roles r
WHERE u.username = 'analyst' AND r.name = 'ROLE_USER'
ON CONFLICT DO NOTHING;

-- =============================================
-- 30 Realistic Risk Records
-- =============================================

INSERT INTO risk_records (risk_title, description, category, likelihood, impact, inherent_risk, control_effectiveness, residual_risk, risk_level, status, created_by)
VALUES

-- 1. Banking Fraud
('Online Banking Fraud via Credential Theft',
 'Attackers use phishing and credential stuffing to gain unauthorized access to customer banking accounts, leading to fraudulent transactions.',
 'FINANCIAL', 9, 9, 81.00, 30, 56.70, 'HIGH', 'OPEN', 'admin'),

-- 2. Phishing Attack
('Enterprise-Wide Phishing Campaign',
 'Sophisticated spear-phishing emails targeting executives and finance teams to steal credentials and initiate wire transfers.',
 'CYBER_SECURITY', 8, 8, 64.00, 40, 38.40, 'MEDIUM', 'IN_PROGRESS', 'admin'),

-- 3. Data Breach
('Customer PII Data Breach via Misconfigured S3 Bucket',
 'Sensitive customer personally identifiable information exposed due to misconfigured cloud storage bucket with public read access.',
 'CYBER_SECURITY', 7, 10, 70.00, 20, 56.00, 'HIGH', 'OPEN', 'admin'),

-- 4. Cloud Outage
('Critical Cloud Infrastructure Outage',
 'Primary cloud provider experiences region-wide outage causing complete service disruption for all customer-facing applications.',
 'TECHNOLOGY', 5, 10, 50.00, 50, 25.00, 'MEDIUM', 'MITIGATED', 'admin'),

-- 5. Compliance Failure
('GDPR Non-Compliance - Data Retention Violation',
 'Customer data retained beyond the legally mandated period due to insufficient automated data purging processes.',
 'COMPLIANCE', 6, 8, 48.00, 60, 19.20, 'LOW', 'IN_PROGRESS', 'admin'),

-- 6. Insider Threat
('Malicious Insider Data Exfiltration',
 'Privileged employee or contractor with access to sensitive systems intentionally exfiltrates intellectual property or customer data.',
 'OPERATIONAL', 4, 10, 40.00, 35, 26.00, 'MEDIUM', 'OPEN', 'admin'),

-- 7. Ransomware
('Ransomware Attack on Core Banking Systems',
 'Ransomware encrypts critical banking system files and databases, demanding payment for decryption keys and causing operational shutdown.',
 'CYBER_SECURITY', 7, 10, 70.00, 25, 52.50, 'HIGH', 'OPEN', 'admin'),

-- 8. DDoS Attack
('Distributed Denial of Service Attack on Payment Gateway',
 'Coordinated DDoS attack targeting the payment processing gateway, rendering it unavailable to customers and merchants.',
 'CYBER_SECURITY', 8, 7, 56.00, 45, 30.80, 'MEDIUM', 'MITIGATED', 'admin'),

-- 9. Supply Chain Attack
('Third-Party Software Supply Chain Compromise',
 'Malicious code injected into a widely-used third-party library or software package that is part of the production build pipeline.',
 'SUPPLY_CHAIN', 5, 9, 45.00, 20, 36.00, 'MEDIUM', 'OPEN', 'admin'),

-- 10. Credential Theft
('API Key Exposure in Public Repository',
 'Developer accidentally commits API keys, database credentials, or service account tokens to a public code repository.',
 'CYBER_SECURITY', 7, 8, 56.00, 55, 25.20, 'MEDIUM', 'CLOSED', 'admin'),

-- 11. SQL Injection
('SQL Injection Attack on Customer Portal',
 'Attacker exploits unvalidated input fields in the customer portal to execute malicious SQL queries against the production database.',
 'CYBER_SECURITY', 6, 9, 54.00, 70, 16.20, 'LOW', 'MITIGATED', 'admin'),

-- 12. Regulatory Fine
('Anti-Money Laundering Compliance Failure',
 'Inadequate transaction monitoring and suspicious activity reporting processes lead to AML compliance violations and regulatory sanctions.',
 'COMPLIANCE', 5, 9, 45.00, 40, 27.00, 'MEDIUM', 'IN_PROGRESS', 'admin'),

-- 13. Zero-Day Exploit
('Zero-Day Vulnerability in Core Banking Platform',
 'An unpatched zero-day vulnerability in the core banking software is actively exploited by threat actors before vendor patch availability.',
 'CYBER_SECURITY', 4, 10, 40.00, 15, 34.00, 'MEDIUM', 'OPEN', 'admin'),

-- 14. Business Email Compromise
('CEO Fraud / Business Email Compromise',
 'Attackers impersonate C-suite executives via email to instruct finance teams to initiate large unauthorized wire transfers.',
 'FINANCIAL', 7, 8, 56.00, 50, 28.00, 'MEDIUM', 'OPEN', 'admin'),

-- 15. Data Loss
('Accidental Deletion of Production Database',
 'Human error during maintenance procedures results in accidental deletion of production database without adequate backup verification.',
 'OPERATIONAL', 3, 10, 30.00, 80, 6.00, 'LOW', 'MITIGATED', 'admin'),

-- 16. Mobile App Vulnerability
('Critical Vulnerability in Mobile Banking Application',
 'Security flaw in the mobile banking application allows attackers to bypass authentication and access other users'' account information.',
 'CYBER_SECURITY', 6, 8, 48.00, 55, 21.60, 'MEDIUM', 'IN_PROGRESS', 'admin'),

-- 17. Social Engineering
('Social Engineering Attack Targeting IT Help Desk',
 'Attackers impersonate employees to manipulate IT help desk staff into resetting passwords or granting unauthorized system access.',
 'OPERATIONAL', 7, 7, 49.00, 40, 29.40, 'MEDIUM', 'OPEN', 'admin'),

-- 18. Vendor Risk
('Critical Vendor Business Continuity Failure',
 'Key technology vendor goes out of business or experiences catastrophic failure, disrupting critical services and data access.',
 'SUPPLY_CHAIN', 3, 9, 27.00, 30, 18.90, 'LOW', 'ACCEPTED', 'admin'),

-- 19. Cryptojacking
('Unauthorized Cryptocurrency Mining on Corporate Infrastructure',
 'Malware installs cryptocurrency mining software on corporate servers, consuming resources and potentially exposing sensitive data.',
 'CYBER_SECURITY', 6, 5, 30.00, 60, 12.00, 'LOW', 'MITIGATED', 'admin'),

-- 20. Privilege Escalation
('Privilege Escalation via Misconfigured IAM Policies',
 'Overly permissive Identity and Access Management policies allow low-privilege users to escalate to administrative access.',
 'CYBER_SECURITY', 6, 8, 48.00, 45, 26.40, 'MEDIUM', 'IN_PROGRESS', 'admin'),

-- 21. Fraud
('Payment Card Skimming at ATM Network',
 'Physical card skimming devices installed on ATMs capture customer card data and PINs for subsequent fraudulent transactions.',
 'FINANCIAL', 5, 7, 35.00, 50, 17.50, 'LOW', 'OPEN', 'admin'),

-- 22. Reputational Risk
('Negative Social Media Campaign Targeting Brand',
 'Coordinated negative social media campaign damages organizational reputation, affecting customer trust and business relationships.',
 'REPUTATIONAL', 6, 6, 36.00, 30, 25.20, 'MEDIUM', 'OPEN', 'analyst'),

-- 23. Data Residency
('Cloud Data Residency Violation - Cross-Border Transfer',
 'Customer data inadvertently transferred to cloud regions in jurisdictions not compliant with data residency requirements.',
 'COMPLIANCE', 5, 7, 35.00, 65, 12.25, 'LOW', 'MITIGATED', 'analyst'),

-- 24. Access Control
('Unauthorized Access to Sensitive Financial Reports',
 'Inadequate access controls allow unauthorized personnel to view confidential financial reports and board documents.',
 'OPERATIONAL', 5, 7, 35.00, 70, 10.50, 'LOW', 'CLOSED', 'analyst'),

-- 25. Third-Party Breach
('Third-Party Processor Data Breach Exposing Customer Data',
 'A payment processing partner experiences a data breach, compromising customer card data processed through their systems.',
 'SUPPLY_CHAIN', 6, 9, 54.00, 25, 40.50, 'MEDIUM', 'OPEN', 'analyst'),

-- 26. Physical Security
('Unauthorized Physical Access to Data Center',
 'Tailgating or social engineering enables unauthorized individuals to gain physical access to the primary data center facility.',
 'OPERATIONAL', 3, 8, 24.00, 75, 6.00, 'LOW', 'MITIGATED', 'analyst'),

-- 27. AI Model Misuse
('AI Model Poisoning Attack on Fraud Detection',
 'Adversarial actors manipulate training data to poison the fraud detection AI model, causing it to approve fraudulent transactions.',
 'TECHNOLOGY', 4, 9, 36.00, 30, 25.20, 'MEDIUM', 'OPEN', 'analyst'),

-- 28. Regulatory Change
('Sudden Regulatory Requirement Change - Capital Adequacy',
 'New regulatory requirements mandate significant increases in capital reserves, impacting operational liquidity and investment capacity.',
 'COMPLIANCE', 7, 7, 49.00, 20, 39.20, 'MEDIUM', 'IN_PROGRESS', 'analyst'),

-- 29. Key Person Risk
('Critical System Knowledge Loss - Key Employee Departure',
 'Departure of key technical staff members creates significant knowledge gaps for critical legacy systems and operational processes.',
 'HUMAN_RESOURCES', 6, 6, 36.00, 40, 21.60, 'MEDIUM', 'OPEN', 'analyst'),

-- 30. Advanced Persistent Threat
('Nation-State APT Targeting Financial Infrastructure',
 'State-sponsored advanced persistent threat actor conducts long-term campaign targeting financial infrastructure for espionage or sabotage.',
 'CYBER_SECURITY', 4, 10, 40.00, 20, 32.00, 'MEDIUM', 'OPEN', 'admin');
