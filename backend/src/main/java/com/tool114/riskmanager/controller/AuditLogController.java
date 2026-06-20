package com.tool114.riskmanager.controller;

import com.tool114.riskmanager.dto.ApiResponse;
import com.tool114.riskmanager.dto.PagedResponse;
import com.tool114.riskmanager.entity.AuditLog;
import com.tool114.riskmanager.service.AuditLogService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/audit")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
@Tag(name = "Audit Log", description = "Audit trail APIs (Admin only)")
@SecurityRequirement(name = "bearerAuth")
public class AuditLogController {

    private final AuditLogService auditLogService;

    @GetMapping
    @Operation(summary = "Get all audit logs with pagination")
    public ResponseEntity<ApiResponse<PagedResponse<AuditLog>>> getAllLogs(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Page<AuditLog> auditPage = auditLogService.getAll(PageRequest.of(page, size));
        return ResponseEntity.ok(ApiResponse.success(PagedResponse.of(auditPage)));
    }

    @GetMapping("/recent")
    @Operation(summary = "Get recent audit logs (last 24 hours)")
    public ResponseEntity<ApiResponse<List<AuditLog>>> getRecentLogs(
            @RequestParam(defaultValue = "24") int hours) {
        return ResponseEntity.ok(ApiResponse.success(auditLogService.getRecentLogs(hours)));
    }

    @GetMapping("/user/{username}")
    @Operation(summary = "Get audit logs by username")
    public ResponseEntity<ApiResponse<List<AuditLog>>> getLogsByUser(@PathVariable String username) {
        return ResponseEntity.ok(ApiResponse.success(auditLogService.getByUsername(username)));
    }
}
