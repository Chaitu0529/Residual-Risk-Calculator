package com.tool114.riskmanager.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.tool114.riskmanager.dto.*;
import com.tool114.riskmanager.entity.RiskRecord;
import com.tool114.riskmanager.security.JwtAuthFilter;
import com.tool114.riskmanager.security.JwtUtil;
import com.tool114.riskmanager.service.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.util.List;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(RiskRecordController.class)
@ActiveProfiles("test")
class RiskRecordControllerTest {

    @Autowired private MockMvc mockMvc;
    @Autowired private ObjectMapper objectMapper;

    @MockBean private RiskRecordService riskRecordService;
    @MockBean private AiIntegrationService aiIntegrationService;
    @MockBean private FileUploadService fileUploadService;
    @MockBean private AuditLogService auditLogService;
    @MockBean private JwtUtil jwtUtil;
    @MockBean private JwtAuthFilter jwtAuthFilter;
    @MockBean private UserDetailsService userDetailsService;

    private RiskRecordResponse sampleResponse;

    @BeforeEach
    void setUp() {
        sampleResponse = RiskRecordResponse.builder()
                .id(1L)
                .riskTitle("Test Risk")
                .category(RiskRecord.RiskCategory.CYBER_SECURITY)
                .likelihood(7)
                .impact(8)
                .inherentRisk(new BigDecimal("56.00"))
                .controlEffectiveness(30)
                .residualRisk(new BigDecimal("39.20"))
                .riskLevel(RiskRecord.RiskLevel.MEDIUM)
                .status(RiskRecord.RiskStatus.OPEN)
                .createdBy("admin")
                .build();
    }

    @Test
    @WithMockUser(roles = "USER")
    void getAllRisks_returns200_withPagedResponse() throws Exception {
        PagedResponse<RiskRecordResponse> paged = PagedResponse.<RiskRecordResponse>builder()
                .content(List.of(sampleResponse))
                .page(0).size(10).totalElements(1).totalPages(1)
                .first(true).last(true)
                .build();

        when(riskRecordService.getAllRisks(any())).thenReturn(paged);

        mockMvc.perform(get("/api/risks"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.content[0].id").value(1));
    }

    @Test
    @WithMockUser(roles = "USER")
    void getRiskById_returns200_whenFound() throws Exception {
        when(riskRecordService.getRiskById(1L)).thenReturn(sampleResponse);

        mockMvc.perform(get("/api/risks/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.riskTitle").value("Test Risk"));
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void createRisk_returns201_withValidRequest() throws Exception {
        RiskRecordRequest request = new RiskRecordRequest();
        request.setRiskTitle("New Risk");
        request.setCategory(RiskRecord.RiskCategory.FINANCIAL);
        request.setLikelihood(5);
        request.setImpact(6);
        request.setControlEffectiveness(20);

        when(riskRecordService.createRisk(any(), any(), any())).thenReturn(sampleResponse);

        mockMvc.perform(post("/api/risks")
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated());
    }

    @Test
    @WithMockUser(roles = "USER")
    void createRisk_returns403_forUserRole() throws Exception {
        RiskRecordRequest request = new RiskRecordRequest();
        request.setRiskTitle("Test");
        request.setCategory(RiskRecord.RiskCategory.FINANCIAL);
        request.setLikelihood(5);
        request.setImpact(5);

        mockMvc.perform(post("/api/risks")
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void deleteRisk_returns200_forAdmin() throws Exception {
        mockMvc.perform(delete("/api/risks/1").with(csrf()))
                .andExpect(status().isOk());
    }
}
