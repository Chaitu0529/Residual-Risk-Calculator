package com.tool114.riskmanager.service;

import com.tool114.riskmanager.entity.RiskRecord;
import com.tool114.riskmanager.repository.RiskRecordRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class ScheduledJobService {

    private final RiskRecordRepository riskRecordRepository;
    private final EmailService emailService;

    /**
     * Sends daily risk summary at 8:00 AM every day
     */
    @Scheduled(cron = "${notification.mail.daily-reminder-cron:0 0 8 * * ?}")
    public void sendDailyRiskReminder() {
        log.info("Running daily risk reminder job");
        try {
            List<RiskRecord> openRisks = riskRecordRepository.findOpenRisks();
            if (!openRisks.isEmpty()) {
                emailService.sendDailyRiskSummary(openRisks);
            }
            log.info("Daily reminder sent for {} open risks", openRisks.size());
        } catch (Exception e) {
            log.error("Daily reminder job failed: {}", e.getMessage());
        }
    }

    /**
     * Sends deadline alerts at 9:00 AM every day for critical/high risks
     */
    @Scheduled(cron = "${notification.mail.deadline-alert-cron:0 0 9 * * ?}")
    public void sendDeadlineAlerts() {
        log.info("Running deadline alert job");
        try {
            List<RiskRecord> criticalHighRisks = riskRecordRepository.findOpenRisks()
                    .stream()
                    .filter(r -> RiskRecord.RiskLevel.CRITICAL.equals(r.getRiskLevel())
                              || RiskRecord.RiskLevel.HIGH.equals(r.getRiskLevel()))
                    .collect(Collectors.toList());

            if (!criticalHighRisks.isEmpty()) {
                emailService.sendDeadlineAlert(criticalHighRisks);
            }
            log.info("Deadline alerts sent for {} critical/high risks", criticalHighRisks.size());
        } catch (Exception e) {
            log.error("Deadline alert job failed: {}", e.getMessage());
        }
    }
}
