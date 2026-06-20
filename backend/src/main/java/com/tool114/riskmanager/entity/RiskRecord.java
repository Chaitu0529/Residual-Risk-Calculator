package com.tool114.riskmanager.entity;

import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;

@Entity
@Table(name = "risk_records", indexes = {
    @Index(name = "idx_risk_category", columnList = "category"),
    @Index(name = "idx_risk_status", columnList = "status"),
    @Index(name = "idx_risk_level", columnList = "risk_level"),
    @Index(name = "idx_risk_created_by", columnList = "created_by"),
    @Index(name = "idx_risk_deleted_at", columnList = "deleted_at")
})
@EntityListeners(AuditingEntityListener.class)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RiskRecord {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "risk_title", nullable = false, length = 200)
    private String riskTitle;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(name = "category", nullable = false, length = 50)
    private RiskCategory category;

    @Column(name = "likelihood", nullable = false)
    private Integer likelihood;

    @Column(name = "impact", nullable = false)
    private Integer impact;

    @Column(name = "inherent_risk", precision = 10, scale = 2)
    private BigDecimal inherentRisk;

    @Column(name = "control_effectiveness")
    private Integer controlEffectiveness;

    @Column(name = "residual_risk", precision = 10, scale = 2)
    private BigDecimal residualRisk;

    @Enumerated(EnumType.STRING)
    @Column(name = "risk_level", length = 20)
    private RiskLevel riskLevel;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    @Builder.Default
    private RiskStatus status = RiskStatus.OPEN;

    @Column(name = "ai_description", columnDefinition = "TEXT")
    private String aiDescription;

    @Column(name = "ai_recommendations", columnDefinition = "TEXT")
    private String aiRecommendations;

    @Column(name = "ai_report", columnDefinition = "TEXT")
    private String aiReport;

    @Column(name = "attachment_path")
    private String attachmentPath;

    @Column(name = "attachment_name")
    private String attachmentName;

    @Column(name = "created_by", length = 50)
    private String createdBy;

    @CreatedDate
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @LastModifiedDate
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Column(name = "deleted_at")
    private LocalDateTime deletedAt;

    /**
     * Calculates Inherent Risk = Likelihood × Impact
     * Calculates Residual Risk = Inherent Risk × (100 - Control Effectiveness) / 100
     * Assigns Risk Level based on Residual Risk value
     */
    @PrePersist
    @PreUpdate
    public void calculateRiskValues() {
        if (likelihood != null && impact != null) {
            this.inherentRisk = BigDecimal.valueOf((long) likelihood * impact)
                    .setScale(2, RoundingMode.HALF_UP);

            if (controlEffectiveness != null && inherentRisk != null) {
                BigDecimal factor = BigDecimal.valueOf(100 - controlEffectiveness)
                        .divide(BigDecimal.valueOf(100), 4, RoundingMode.HALF_UP);
                this.residualRisk = inherentRisk.multiply(factor)
                        .setScale(2, RoundingMode.HALF_UP);
                this.riskLevel = determineRiskLevel(residualRisk.doubleValue());
            } else {
                this.residualRisk = this.inherentRisk;
                this.riskLevel = determineRiskLevel(inherentRisk.doubleValue());
            }
        }
    }

    private RiskLevel determineRiskLevel(double value) {
        if (value <= 20) return RiskLevel.LOW;
        if (value <= 50) return RiskLevel.MEDIUM;
        if (value <= 80) return RiskLevel.HIGH;
        return RiskLevel.CRITICAL;
    }

    public boolean isDeleted() {
        return deletedAt != null;
    }

    public enum RiskCategory {
        FINANCIAL, OPERATIONAL, CYBER_SECURITY, COMPLIANCE,
        REPUTATIONAL, STRATEGIC, TECHNOLOGY, SUPPLY_CHAIN,
        HUMAN_RESOURCES, LEGAL
    }

    public enum RiskStatus {
        OPEN, IN_PROGRESS, MITIGATED, ACCEPTED, CLOSED
    }

    public enum RiskLevel {
        LOW, MEDIUM, HIGH, CRITICAL
    }
}
