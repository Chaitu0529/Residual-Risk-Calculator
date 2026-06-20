package com.tool114.riskmanager.service;

import com.tool114.riskmanager.entity.AuditLog;
import com.tool114.riskmanager.repository.AuditLogRepository;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuditLogService {

    private final AuditLogRepository auditLogRepository;

    @Async
    public void log(String username, String action, String entityType, Long entityId,
                    String description, HttpServletRequest request) {
        log(username, action, entityType, entityId, description, request, null, null);
    }

    @Async
    public void log(String username, String action, String entityType, Long entityId,
                    String description, HttpServletRequest request,
                    String oldValues, String newValues) {
        try {
            AuditLog auditLog = AuditLog.builder()
                    .username(username != null ? username : "system")
                    .action(action)
                    .entityType(entityType)
                    .entityId(entityId)
                    .description(description)
                    .ipAddress(request != null ? getClientIp(request) : "unknown")
                    .userAgent(request != null ? request.getHeader("User-Agent") : "unknown")
                    .oldValues(oldValues)
                    .newValues(newValues)
                    .status("SUCCESS")
                    .build();
            auditLogRepository.save(auditLog);
        } catch (Exception e) {
            log.error("Failed to create audit log: {}", e.getMessage());
        }
    }

    @Async
    public void logFailure(String username, String action, String description,
                           HttpServletRequest request, String reason) {
        try {
            AuditLog auditLog = AuditLog.builder()
                    .username(username != null ? username : "anonymous")
                    .action(action)
                    .description(description + " | Reason: " + reason)
                    .ipAddress(request != null ? getClientIp(request) : "unknown")
                    .userAgent(request != null ? request.getHeader("User-Agent") : "unknown")
                    .status("FAILURE")
                    .build();
            auditLogRepository.save(auditLog);
        } catch (Exception e) {
            log.error("Failed to create audit failure log: {}", e.getMessage());
        }
    }

    public Page<AuditLog> getAll(Pageable pageable) {
        return auditLogRepository.findAllByOrderByTimestampDesc(pageable);
    }

    public List<AuditLog> getByUsername(String username) {
        return auditLogRepository.findByUsernameOrderByTimestampDesc(username);
    }

    public Page<AuditLog> getByEntity(String entityType, Long entityId, Pageable pageable) {
        return auditLogRepository.findByEntityTypeAndEntityIdOrderByTimestampDesc(
            entityType, entityId, pageable);
    }

    public List<AuditLog> getRecentLogs(int hours) {
        return auditLogRepository.findRecentLogs(
            LocalDateTime.now().minusHours(hours));
    }

    private String getClientIp(HttpServletRequest request) {
        String[] headers = {
            "X-Forwarded-For", "Proxy-Client-IP", "WL-Proxy-Client-IP",
            "HTTP_X_FORWARDED_FOR", "HTTP_X_FORWARDED", "HTTP_FORWARDED_FOR",
            "HTTP_FORWARDED", "HTTP_CLIENT_IP", "HTTP_VIA", "REMOTE_ADDR"
        };
        for (String header : headers) {
            String ip = request.getHeader(header);
            if (ip != null && !ip.isEmpty() && !"unknown".equalsIgnoreCase(ip)) {
                return ip.split(",")[0].trim();
            }
        }
        return request.getRemoteAddr();
    }
}
