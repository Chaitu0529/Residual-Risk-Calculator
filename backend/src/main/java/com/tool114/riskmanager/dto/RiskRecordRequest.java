package com.tool114.riskmanager.dto;

import com.tool114.riskmanager.entity.RiskRecord;
import jakarta.validation.constraints.*;
import lombok.Data;

@Data
public class RiskRecordRequest {

    @NotBlank(message = "Risk title is required")
    @Size(min = 3, max = 200, message = "Risk title must be between 3 and 200 characters")
    private String riskTitle;

    @Size(max = 5000, message = "Description cannot exceed 5000 characters")
    private String description;

    @NotNull(message = "Category is required")
    private RiskRecord.RiskCategory category;

    @NotNull(message = "Likelihood is required")
    @Min(value = 1, message = "Likelihood must be at least 1")
    @Max(value = 10, message = "Likelihood cannot exceed 10")
    private Integer likelihood;

    @NotNull(message = "Impact is required")
    @Min(value = 1, message = "Impact must be at least 1")
    @Max(value = 10, message = "Impact cannot exceed 10")
    private Integer impact;

    @Min(value = 0, message = "Control effectiveness must be at least 0")
    @Max(value = 100, message = "Control effectiveness cannot exceed 100")
    private Integer controlEffectiveness;

    private RiskRecord.RiskStatus status;
}
