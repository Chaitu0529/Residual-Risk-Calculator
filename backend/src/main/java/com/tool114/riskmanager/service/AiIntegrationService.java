package com.tool114.riskmanager.service;

import com.tool114.riskmanager.dto.RiskRecordResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientResponseException;
import reactor.core.publisher.Mono;

import java.time.Duration;
import java.util.HashMap;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class AiIntegrationService {

    private final WebClient.Builder webClientBuilder;

    @Value("${ai.service.url:http://localhost:5000}")
    private String aiServiceUrl;

    @Value("${ai.service.timeout:60}")
    private int timeoutSeconds;

    public String generateDescription(RiskRecordResponse risk) {
        Map<String, Object> requestBody = new HashMap<>();
        requestBody.put("risk_name", risk.getRiskTitle());
        requestBody.put("description", risk.getDescription());
        requestBody.put("category", risk.getCategory() != null ? risk.getCategory().name() : "");
        requestBody.put("likelihood", risk.getLikelihood());
        requestBody.put("impact", risk.getImpact());

        return callAiService("/describe", requestBody, "description");
    }

    public String generateRecommendations(RiskRecordResponse risk) {
        Map<String, Object> requestBody = new HashMap<>();
        requestBody.put("risk_name", risk.getRiskTitle());
        requestBody.put("description", risk.getDescription());
        requestBody.put("category", risk.getCategory() != null ? risk.getCategory().name() : "");
        requestBody.put("likelihood", risk.getLikelihood());
        requestBody.put("impact", risk.getImpact());
        requestBody.put("residual_risk", risk.getResidualRisk());
        requestBody.put("risk_level", risk.getRiskLevel() != null ? risk.getRiskLevel().name() : "");

        return callAiService("/recommend", requestBody, "recommendations");
    }

    public String generateReport(RiskRecordResponse risk) {
        Map<String, Object> requestBody = new HashMap<>();
        requestBody.put("risk_name", risk.getRiskTitle());
        requestBody.put("description", risk.getDescription());
        requestBody.put("category", risk.getCategory() != null ? risk.getCategory().name() : "");
        requestBody.put("likelihood", risk.getLikelihood());
        requestBody.put("impact", risk.getImpact());
        requestBody.put("inherent_risk", risk.getInherentRisk());
        requestBody.put("control_effectiveness", risk.getControlEffectiveness());
        requestBody.put("residual_risk", risk.getResidualRisk());
        requestBody.put("risk_level", risk.getRiskLevel() != null ? risk.getRiskLevel().name() : "");
        requestBody.put("status", risk.getStatus() != null ? risk.getStatus().name() : "");

        return callAiService("/generate-report", requestBody, "report");
    }

    @SuppressWarnings("unchecked")
    private String callAiService(String endpoint, Map<String, Object> requestBody, String responseKey) {
        try {
            WebClient client = webClientBuilder
                .baseUrl(aiServiceUrl)
                .build();

            Map<String, Object> response = client.post()
                .uri(endpoint)
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(requestBody)
                .retrieve()
                .bodyToMono(Map.class)
                .timeout(Duration.ofSeconds(timeoutSeconds))
                .onErrorResume(WebClientResponseException.class, ex -> {
                    log.error("AI service error {}: {}", endpoint, ex.getMessage());
                    return Mono.just(Map.of(responseKey, getFallbackResponse(endpoint)));
                })
                .onErrorResume(Exception.class, ex -> {
                    log.error("AI service unavailable {}: {}", endpoint, ex.getMessage());
                    return Mono.just(Map.of(responseKey, getFallbackResponse(endpoint)));
                })
                .block();

            if (response != null && response.containsKey(responseKey)) {
                Object value = response.get(responseKey);
                if (value instanceof String s) return s;
                // For reports, serialize as JSON string
                return value.toString();
            }
            return getFallbackResponse(endpoint);
        } catch (Exception e) {
            log.error("Unexpected error calling AI service {}: {}", endpoint, e.getMessage());
            return getFallbackResponse(endpoint);
        }
    }

    private String getFallbackResponse(String endpoint) {
        return switch (endpoint) {
            case "/describe" -> "AI description service is temporarily unavailable. " +
                "Please review the risk details manually and update the description.";
            case "/recommend" -> "[{\"action_type\":\"REVIEW\",\"priority\":\"HIGH\"," +
                "\"description\":\"Conduct a manual risk review and implement appropriate controls.\"}]";
            case "/generate-report" -> "{\"title\":\"Risk Report\",\"summary\":\"AI report service unavailable.\"," +
                "\"overview\":\"Manual review required.\",\"key_findings\":[],\"recommendations\":[]}";
            default -> "AI service temporarily unavailable.";
        };
    }
}
