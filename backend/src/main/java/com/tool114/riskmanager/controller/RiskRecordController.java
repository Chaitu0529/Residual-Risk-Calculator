package com.tool114.riskmanager.controller;

import com.tool114.riskmanager.dto.*;
import com.tool114.riskmanager.entity.RiskRecord;
import com.tool114.riskmanager.service.*;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDateTime;

@RestController
@RequestMapping("/api/risks")
@RequiredArgsConstructor
@Tag(name = "Risk Records", description = "Risk Record CRUD and AI generation APIs")
@SecurityRequirement(name = "bearerAuth")
public class RiskRecordController {

    private final RiskRecordService riskRecordService;
    private final AiIntegrationService aiIntegrationService;
    private final FileUploadService fileUploadService;
    private final AuditLogService auditLogService;

    @GetMapping
    @Operation(summary = "Get all risk records with pagination")
    public ResponseEntity<ApiResponse<PagedResponse<RiskRecordResponse>>> getAllRisks(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir) {

        Sort sort = sortDir.equalsIgnoreCase("asc")
            ? Sort.by(sortBy).ascending()
            : Sort.by(sortBy).descending();
        Pageable pageable = PageRequest.of(page, size, sort);

        PagedResponse<RiskRecordResponse> response = riskRecordService.getAllRisks(pageable);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get a risk record by ID")
    public ResponseEntity<ApiResponse<RiskRecordResponse>> getRiskById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(riskRecordService.getRiskById(id)));
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Create a new risk record")
    public ResponseEntity<ApiResponse<RiskRecordResponse>> createRisk(
            @Valid @RequestBody RiskRecordRequest request,
            @AuthenticationPrincipal UserDetails userDetails,
            HttpServletRequest httpRequest) {
        RiskRecordResponse response = riskRecordService.createRisk(
            request, userDetails.getUsername(), httpRequest);
        return ResponseEntity.status(201).body(ApiResponse.success("Risk created successfully", response));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Update a risk record")
    public ResponseEntity<ApiResponse<RiskRecordResponse>> updateRisk(
            @PathVariable Long id,
            @Valid @RequestBody RiskRecordRequest request,
            @AuthenticationPrincipal UserDetails userDetails,
            HttpServletRequest httpRequest) {
        RiskRecordResponse response = riskRecordService.updateRisk(
            id, request, userDetails.getUsername(), httpRequest);
        return ResponseEntity.ok(ApiResponse.success("Risk updated successfully", response));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Soft-delete a risk record")
    public ResponseEntity<ApiResponse<Void>> deleteRisk(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails,
            HttpServletRequest httpRequest) {
        riskRecordService.deleteRisk(id, userDetails.getUsername(), httpRequest);
        return ResponseEntity.ok(ApiResponse.success("Risk deleted successfully", null));
    }

    @GetMapping("/search")
    @Operation(summary = "Search and filter risk records")
    public ResponseEntity<ApiResponse<PagedResponse<RiskRecordResponse>>> searchRisks(
            @Parameter(description = "Search keyword") @RequestParam(required = false) String keyword,
            @Parameter(description = "Filter by category") @RequestParam(required = false) RiskRecord.RiskCategory category,
            @Parameter(description = "Filter by status") @RequestParam(required = false) RiskRecord.RiskStatus status,
            @Parameter(description = "Filter by risk level") @RequestParam(required = false) RiskRecord.RiskLevel riskLevel,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir) {

        PagedResponse<RiskRecordResponse> response = riskRecordService.searchRisks(
            keyword, category, status, riskLevel, startDate, endDate, page, size, sortBy, sortDir);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PostMapping("/{id}/ai/describe")
    @Operation(summary = "Generate AI description for a risk")
    public ResponseEntity<ApiResponse<RiskRecordResponse>> generateDescription(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails,
            HttpServletRequest httpRequest) {
        RiskRecordResponse risk = riskRecordService.getRiskById(id);
        String description = aiIntegrationService.generateDescription(risk);
        RiskRecordResponse updated = riskRecordService.updateAiContent(id, description, null, null);
        auditLogService.log(userDetails.getUsername(), "AI_DESCRIBE", "RiskRecord", id,
            "Generated AI description", httpRequest);
        return ResponseEntity.ok(ApiResponse.success("AI description generated", updated));
    }

    @PostMapping("/{id}/ai/recommend")
    @Operation(summary = "Generate AI recommendations for a risk")
    public ResponseEntity<ApiResponse<RiskRecordResponse>> generateRecommendations(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails,
            HttpServletRequest httpRequest) {
        RiskRecordResponse risk = riskRecordService.getRiskById(id);
        String recommendations = aiIntegrationService.generateRecommendations(risk);
        RiskRecordResponse updated = riskRecordService.updateAiContent(id, null, recommendations, null);
        auditLogService.log(userDetails.getUsername(), "AI_RECOMMEND", "RiskRecord", id,
            "Generated AI recommendations", httpRequest);
        return ResponseEntity.ok(ApiResponse.success("AI recommendations generated", updated));
    }

    @PostMapping("/{id}/ai/report")
    @Operation(summary = "Generate AI report for a risk")
    public ResponseEntity<ApiResponse<RiskRecordResponse>> generateReport(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails,
            HttpServletRequest httpRequest) {
        RiskRecordResponse risk = riskRecordService.getRiskById(id);
        String report = aiIntegrationService.generateReport(risk);
        RiskRecordResponse updated = riskRecordService.updateAiContent(id, null, null, report);
        auditLogService.log(userDetails.getUsername(), "AI_REPORT", "RiskRecord", id,
            "Generated AI report", httpRequest);
        return ResponseEntity.ok(ApiResponse.success("AI report generated", updated));
    }

    @PostMapping("/{id}/upload")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Upload attachment for a risk record")
    public ResponseEntity<ApiResponse<RiskRecordResponse>> uploadAttachment(
            @PathVariable Long id,
            @RequestParam("file") MultipartFile file,
            @AuthenticationPrincipal UserDetails userDetails,
            HttpServletRequest httpRequest) throws Exception {
        String storedPath = fileUploadService.storeFile(file);
        RiskRecordResponse updated = riskRecordService.updateAttachment(
            id, storedPath, file.getOriginalFilename());
        auditLogService.log(userDetails.getUsername(), "UPLOAD_FILE", "RiskRecord", id,
            "Uploaded file: " + file.getOriginalFilename(), httpRequest);
        return ResponseEntity.ok(ApiResponse.success("File uploaded successfully", updated));
    }
}
