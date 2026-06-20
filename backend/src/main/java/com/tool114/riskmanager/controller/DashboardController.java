package com.tool114.riskmanager.controller;

import com.tool114.riskmanager.dto.ApiResponse;
import com.tool114.riskmanager.dto.DashboardStatsResponse;
import com.tool114.riskmanager.service.RiskRecordService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
@Tag(name = "Dashboard", description = "Dashboard statistics and analytics APIs")
@SecurityRequirement(name = "bearerAuth")
public class DashboardController {

    private final RiskRecordService riskRecordService;

    @GetMapping("/stats")
    @Operation(summary = "Get dashboard statistics",
               description = "Returns total, critical, high, medium, low, open, mitigated risks and average residual risk")
    public ResponseEntity<ApiResponse<DashboardStatsResponse>> getStats() {
        return ResponseEntity.ok(ApiResponse.success(riskRecordService.getStats()));
    }
}
