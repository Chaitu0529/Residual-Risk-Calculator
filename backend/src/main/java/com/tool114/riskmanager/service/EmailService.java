package com.tool114.riskmanager.service;

import com.tool114.riskmanager.entity.RiskRecord;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.thymeleaf.TemplateEngine;
import org.thymeleaf.context.Context;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import java.util.List;

@Service
@Slf4j
public class EmailService {

    private final JavaMailSender mailSender;
    private final TemplateEngine templateEngine;

    public EmailService(
            @org.springframework.beans.factory.annotation.Autowired(required = false) JavaMailSender mailSender,
            TemplateEngine templateEngine) {
        this.mailSender = mailSender;
        this.templateEngine = templateEngine;
    }

    @Value("${notification.mail.from:noreply@tool114.com}")
    private String fromEmail;

    @Async
    public void sendCriticalRiskAlert(RiskRecord risk) {
        if (mailSender == null) { log.debug("Mail not configured, skipping critical risk alert"); return; }
        try {
            String subject = "[CRITICAL RISK ALERT] " + risk.getRiskTitle();
            Context context = new Context();
            context.setVariable("risk", risk);
            context.setVariable("alertType", "CRITICAL");
            String html = templateEngine.process("email/risk-alert", context);
            sendHtmlEmail(fromEmail, subject, html);
            log.info("Critical risk alert sent for risk ID: {}", risk.getId());
        } catch (Exception e) {
            log.error("Failed to send critical risk alert: {}", e.getMessage());
        }
    }

    @Async
    public void sendDailyRiskSummary(List<RiskRecord> openRisks) {
        if (mailSender == null) { log.debug("Mail not configured, skipping daily summary"); return; }
        try {
            String subject = "[Daily Summary] Open Risk Records - Tool-114";
            Context context = new Context();
            context.setVariable("risks", openRisks);
            context.setVariable("totalOpen", openRisks.size());
            long criticalCount = openRisks.stream()
                    .filter(r -> RiskRecord.RiskLevel.CRITICAL.equals(r.getRiskLevel()))
                    .count();
            context.setVariable("criticalCount", criticalCount);
            String html = templateEngine.process("email/daily-summary", context);
            sendHtmlEmail(fromEmail, subject, html);
            log.info("Daily risk summary sent, {} open risks", openRisks.size());
        } catch (Exception e) {
            log.error("Failed to send daily risk summary: {}", e.getMessage());
        }
    }

    @Async
    public void sendDeadlineAlert(List<RiskRecord> risks) {
        if (risks.isEmpty()) return;
        if (mailSender == null) { log.debug("Mail not configured, skipping deadline alert"); return; }
        try {
            String subject = "[DEADLINE ALERT] Risks Requiring Immediate Attention";
            Context context = new Context();
            context.setVariable("risks", risks);
            String html = templateEngine.process("email/deadline-alert", context);
            sendHtmlEmail(fromEmail, subject, html);
            log.info("Deadline alert sent for {} risks", risks.size());
        } catch (Exception e) {
            log.error("Failed to send deadline alert: {}", e.getMessage());
        }
    }

    private void sendHtmlEmail(String to, String subject, String htmlContent)
            throws MessagingException {
        MimeMessage message = mailSender.createMimeMessage();
        MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
        helper.setFrom(fromEmail);
        helper.setTo(to);
        helper.setSubject(subject);
        helper.setText(htmlContent, true);
        mailSender.send(message);
    }
}
