package com.tool114.riskmanager.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class DashboardStatsResponse {
    private long totalRisks;
    private long criticalRisks;
    private long highRisks;
    private long mediumRisks;
    private long lowRisks;
    private long openRisks;
    private long mitigatedRisks;
    private double averageResidualRisk;
}
