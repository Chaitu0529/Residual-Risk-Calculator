package com.tool114.riskmanager.entity;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;

import java.math.BigDecimal;

import static org.assertj.core.api.Assertions.assertThat;

class RiskRecordTest {

    @Test
    void calculateRiskValues_inherentRisk_isLikelihoodTimesImpact() {
        RiskRecord risk = buildRisk(7, 8, 0);
        risk.calculateRiskValues();

        assertThat(risk.getInherentRisk())
            .isEqualByComparingTo(new BigDecimal("56.00"));
    }

    @Test
    void calculateRiskValues_residualRisk_appliesControlEffectiveness() {
        RiskRecord risk = buildRisk(7, 8, 50);
        risk.calculateRiskValues();

        // Residual = 56 * (100-50)/100 = 28.00
        assertThat(risk.getResidualRisk())
            .isEqualByComparingTo(new BigDecimal("28.00"));
    }

    @ParameterizedTest
    @CsvSource({
        "1,  1, 0,  LOW",     // residual = 1
        "5,  4, 0,  MEDIUM",  // residual = 20 → LOW boundary
        "6,  4, 0,  MEDIUM",  // residual = 24
        "8,  7, 0,  HIGH",    // residual = 56
        "9,  9, 0,  CRITICAL" // residual = 81
    })
    void calculateRiskValues_riskLevel_assignedCorrectly(
            int likelihood, int impact, int controlEffectiveness, String expectedLevel) {
        RiskRecord risk = buildRisk(likelihood, impact, controlEffectiveness);
        risk.calculateRiskValues();

        assertThat(risk.getRiskLevel().name()).isEqualTo(expectedLevel);
    }

    @Test
    void riskLevel_low_when_residualBetween0And20() {
        RiskRecord risk = buildRisk(2, 5, 80); // inherent=10, residual=2
        risk.calculateRiskValues();
        assertThat(risk.getRiskLevel()).isEqualTo(RiskRecord.RiskLevel.LOW);
    }

    @Test
    void riskLevel_critical_when_residualAbove80() {
        RiskRecord risk = buildRisk(9, 10, 0); // residual = 90
        risk.calculateRiskValues();
        assertThat(risk.getRiskLevel()).isEqualTo(RiskRecord.RiskLevel.CRITICAL);
    }

    @Test
    void isDeleted_returnsFalse_whenDeletedAtIsNull() {
        RiskRecord risk = new RiskRecord();
        assertThat(risk.isDeleted()).isFalse();
    }

    @Test
    void defaultStatus_isOpen() {
        RiskRecord risk = RiskRecord.builder()
                .riskTitle("Test")
                .build();
        assertThat(risk.getStatus()).isEqualTo(RiskRecord.RiskStatus.OPEN);
    }

    @Test
    void calculateRiskValues_noControlEffectiveness_residualEqualsInherent() {
        RiskRecord risk = buildRisk(5, 6, 0);
        risk.calculateRiskValues();
        assertThat(risk.getResidualRisk())
            .isEqualByComparingTo(risk.getInherentRisk());
    }

    @Test
    void calculateRiskValues_100PercentControl_residualIsZero() {
        RiskRecord risk = buildRisk(10, 10, 100);
        risk.calculateRiskValues();
        assertThat(risk.getResidualRisk())
            .isEqualByComparingTo(BigDecimal.ZERO.setScale(2));
    }

    private RiskRecord buildRisk(int likelihood, int impact, int controlEffectiveness) {
        return RiskRecord.builder()
                .riskTitle("Test Risk")
                .category(RiskRecord.RiskCategory.CYBER_SECURITY)
                .likelihood(likelihood)
                .impact(impact)
                .controlEffectiveness(controlEffectiveness)
                .status(RiskRecord.RiskStatus.OPEN)
                .build();
    }
}
