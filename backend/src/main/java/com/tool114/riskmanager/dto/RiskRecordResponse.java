package com.tool114.riskmanager.dto;

import com.tool114.riskmanager.entity.RiskRecord;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class RiskRecordResponse {
    private Long id;
    private String riskTitle;
    private String description;
    private RiskRecord.RiskCategory category;
    private Integer likelihood;
    private Integer impact;
    private BigDecimal inherentRisk;
    private Integer controlEffectiveness;
    private BigDecimal residualRisk;
    private RiskRecord.RiskLevel riskLevel;
    private RiskRecord.RiskStatus status;
    private String aiDescription;
    private String aiRecommendations;
    private String aiReport;
    private String attachmentName;
    private String createdBy;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static RiskRecordResponse fromEntity(RiskRecord r) {
        return RiskRecordResponse.builder()
                .id(r.getId())
                .riskTitle(r.getRiskTitle())
                .description(r.getDescription())
                .category(r.getCategory())
                .likelihood(r.getLikelihood())
                .impact(r.getImpact())
                .inherentRisk(r.getInherentRisk())
                .controlEffectiveness(r.getControlEffectiveness())
                .residualRisk(r.getResidualRisk())
                .riskLevel(r.getRiskLevel())
                .status(r.getStatus())
                .aiDescription(r.getAiDescription())
                .aiRecommendations(r.getAiRecommendations())
                .aiReport(r.getAiReport())
                .attachmentName(r.getAttachmentName())
                .createdBy(r.getCreatedBy())
                .createdAt(r.getCreatedAt())
                .updatedAt(r.getUpdatedAt())
                .build();
    }
}
