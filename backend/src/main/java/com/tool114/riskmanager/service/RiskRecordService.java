package com.tool114.riskmanager.service;

import com.tool114.riskmanager.dto.*;
import com.tool114.riskmanager.entity.RiskRecord;
import com.tool114.riskmanager.exception.ResourceNotFoundException;
import com.tool114.riskmanager.repository.RiskRecordRepository;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.cache.annotation.Caching;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class RiskRecordService {

    private final RiskRecordRepository riskRecordRepository;
    private final AuditLogService auditLogService;
    private final EmailService emailService;

    @Cacheable(value = "risks", key = "'all_' + #pageable.pageNumber + '_' + #pageable.pageSize")
    @Transactional(readOnly = true)
    public PagedResponse<RiskRecordResponse> getAllRisks(Pageable pageable) {
        Page<RiskRecord> page = riskRecordRepository.findAllActive(pageable);
        Page<RiskRecordResponse> mapped = page.map(RiskRecordResponse::fromEntity);
        return PagedResponse.of(mapped);
    }

    @Cacheable(value = "risk", key = "#id")
    @Transactional(readOnly = true)
    public RiskRecordResponse getRiskById(Long id) {
        RiskRecord risk = riskRecordRepository.findActiveById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Risk", "id", id));
        return RiskRecordResponse.fromEntity(risk);
    }

    @Caching(evict = {
        @CacheEvict(value = "risks", allEntries = true),
        @CacheEvict(value = "stats", allEntries = true)
    })
    @Transactional
    public RiskRecordResponse createRisk(RiskRecordRequest request, String username,
                                          HttpServletRequest httpRequest) {
        RiskRecord risk = RiskRecord.builder()
                .riskTitle(sanitizeInput(request.getRiskTitle()))
                .description(sanitizeInput(request.getDescription()))
                .category(request.getCategory())
                .likelihood(request.getLikelihood())
                .impact(request.getImpact())
                .controlEffectiveness(request.getControlEffectiveness() != null
                    ? request.getControlEffectiveness() : 0)
                .status(request.getStatus() != null ? request.getStatus() : RiskRecord.RiskStatus.OPEN)
                .createdBy(username)
                .build();

        RiskRecord saved = riskRecordRepository.save(risk);

        auditLogService.log(username, "CREATE_RISK", "RiskRecord", saved.getId(),
            "Created risk: " + saved.getRiskTitle(), httpRequest);

        // Notify admin for critical risks
        if (RiskRecord.RiskLevel.CRITICAL.equals(saved.getRiskLevel())) {
            emailService.sendCriticalRiskAlert(saved);
        }

        return RiskRecordResponse.fromEntity(saved);
    }

    @Caching(evict = {
        @CacheEvict(value = "risks", allEntries = true),
        @CacheEvict(value = "risk", key = "#id"),
        @CacheEvict(value = "stats", allEntries = true)
    })
    @Transactional
    public RiskRecordResponse updateRisk(Long id, RiskRecordRequest request, String username,
                                          HttpServletRequest httpRequest) {
        RiskRecord existing = riskRecordRepository.findActiveById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Risk", "id", id));

        String oldValues = serializeRisk(existing);

        existing.setRiskTitle(sanitizeInput(request.getRiskTitle()));
        existing.setDescription(sanitizeInput(request.getDescription()));
        existing.setCategory(request.getCategory());
        existing.setLikelihood(request.getLikelihood());
        existing.setImpact(request.getImpact());
        existing.setControlEffectiveness(request.getControlEffectiveness() != null
            ? request.getControlEffectiveness() : 0);
        if (request.getStatus() != null) {
            existing.setStatus(request.getStatus());
        }

        RiskRecord saved = riskRecordRepository.save(existing);
        String newValues = serializeRisk(saved);

        auditLogService.log(username, "UPDATE_RISK", "RiskRecord", saved.getId(),
            "Updated risk: " + saved.getRiskTitle(), httpRequest, oldValues, newValues);

        return RiskRecordResponse.fromEntity(saved);
    }

    @Caching(evict = {
        @CacheEvict(value = "risks", allEntries = true),
        @CacheEvict(value = "risk", key = "#id"),
        @CacheEvict(value = "stats", allEntries = true)
    })
    @Transactional
    public void deleteRisk(Long id, String username, HttpServletRequest httpRequest) {
        RiskRecord existing = riskRecordRepository.findActiveById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Risk", "id", id));

        existing.setDeletedAt(LocalDateTime.now());
        riskRecordRepository.save(existing);

        auditLogService.log(username, "DELETE_RISK", "RiskRecord", id,
            "Soft-deleted risk: " + existing.getRiskTitle(), httpRequest);
    }

    @Transactional(readOnly = true)
    public PagedResponse<RiskRecordResponse> searchRisks(
            String keyword, RiskRecord.RiskCategory category,
            RiskRecord.RiskStatus status, RiskRecord.RiskLevel riskLevel,
            LocalDateTime startDate, LocalDateTime endDate,
            int page, int size, String sortBy, String sortDir) {

        Sort sort = sortDir.equalsIgnoreCase("asc")
            ? Sort.by(sortBy).ascending()
            : Sort.by(sortBy).descending();

        Pageable pageable = PageRequest.of(page, size, sort);

        Page<RiskRecord> results = riskRecordRepository.searchRisks(
            keyword, category, status, riskLevel, startDate, endDate, pageable);

        Page<RiskRecordResponse> mapped = results.map(RiskRecordResponse::fromEntity);
        return PagedResponse.of(mapped);
    }

    @Cacheable(value = "stats")
    @Transactional(readOnly = true)
    public DashboardStatsResponse getStats() {
        long total = riskRecordRepository.countActive();
        long critical = riskRecordRepository.countByRiskLevel(RiskRecord.RiskLevel.CRITICAL);
        long high = riskRecordRepository.countByRiskLevel(RiskRecord.RiskLevel.HIGH);
        long medium = riskRecordRepository.countByRiskLevel(RiskRecord.RiskLevel.MEDIUM);
        long low = riskRecordRepository.countByRiskLevel(RiskRecord.RiskLevel.LOW);
        long open = riskRecordRepository.countByStatus(RiskRecord.RiskStatus.OPEN);
        long mitigated = riskRecordRepository.countByStatus(RiskRecord.RiskStatus.MITIGATED);
        Double avgResidual = riskRecordRepository.averageResidualRisk();

        return DashboardStatsResponse.builder()
                .totalRisks(total)
                .criticalRisks(critical)
                .highRisks(high)
                .mediumRisks(medium)
                .lowRisks(low)
                .openRisks(open)
                .mitigatedRisks(mitigated)
                .averageResidualRisk(avgResidual != null ? Math.round(avgResidual * 100.0) / 100.0 : 0.0)
                .build();
    }

    @Transactional(readOnly = true)
    public List<RiskRecordResponse> getAllForExport() {
        return riskRecordRepository.findAllActiveForExport()
                .stream()
                .map(RiskRecordResponse::fromEntity)
                .collect(Collectors.toList());
    }

    @Caching(evict = {
        @CacheEvict(value = "risk", key = "#id"),
        @CacheEvict(value = "risks", allEntries = true)
    })
    @Transactional
    public RiskRecordResponse updateAiContent(Long id, String aiDescription,
                                               String aiRecommendations, String aiReport) {
        RiskRecord risk = riskRecordRepository.findActiveById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Risk", "id", id));

        if (aiDescription != null) risk.setAiDescription(aiDescription);
        if (aiRecommendations != null) risk.setAiRecommendations(aiRecommendations);
        if (aiReport != null) risk.setAiReport(aiReport);

        return RiskRecordResponse.fromEntity(riskRecordRepository.save(risk));
    }

    @Caching(evict = {
        @CacheEvict(value = "risk", key = "#id"),
        @CacheEvict(value = "risks", allEntries = true)
    })
    @Transactional
    public RiskRecordResponse updateAttachment(Long id, String path, String name) {
        RiskRecord risk = riskRecordRepository.findActiveById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Risk", "id", id));
        risk.setAttachmentPath(path);
        risk.setAttachmentName(name);
        return RiskRecordResponse.fromEntity(riskRecordRepository.save(risk));
    }

    private String sanitizeInput(String input) {
        if (input == null) return null;
        // Strip HTML tags and sanitize
        return input.replaceAll("<[^>]*>", "")
                    .replaceAll("&lt;", "<")
                    .replaceAll("&gt;", ">")
                    .replaceAll("&amp;", "&")
                    .trim();
    }

    private String serializeRisk(RiskRecord risk) {
        return String.format("{title:%s,likelihood:%d,impact:%d,controlEffectiveness:%d,status:%s}",
            risk.getRiskTitle(), risk.getLikelihood(), risk.getImpact(),
            risk.getControlEffectiveness(), risk.getStatus());
    }
}
