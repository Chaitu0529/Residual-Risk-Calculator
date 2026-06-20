package com.tool114.riskmanager.service;

import com.tool114.riskmanager.dto.RiskRecordRequest;
import com.tool114.riskmanager.dto.RiskRecordResponse;
import com.tool114.riskmanager.entity.RiskRecord;
import com.tool114.riskmanager.exception.ResourceNotFoundException;
import com.tool114.riskmanager.repository.RiskRecordRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class RiskRecordServiceTest {

    @Mock private RiskRecordRepository riskRecordRepository;
    @Mock private AuditLogService auditLogService;
    @Mock private EmailService emailService;

    @InjectMocks
    private RiskRecordService riskRecordService;

    private RiskRecord sampleRisk;

    @BeforeEach
    void setUp() {
        sampleRisk = RiskRecord.builder()
                .id(1L)
                .riskTitle("Test Cyber Risk")
                .description("Test description")
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
    void getRiskById_returnsResponse_whenFound() {
        when(riskRecordRepository.findActiveById(1L)).thenReturn(Optional.of(sampleRisk));

        RiskRecordResponse response = riskRecordService.getRiskById(1L);

        assertThat(response.getId()).isEqualTo(1L);
        assertThat(response.getRiskTitle()).isEqualTo("Test Cyber Risk");
        assertThat(response.getRiskLevel()).isEqualTo(RiskRecord.RiskLevel.MEDIUM);
    }

    @Test
    void getRiskById_throwsException_whenNotFound() {
        when(riskRecordRepository.findActiveById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> riskRecordService.getRiskById(99L))
            .isInstanceOf(ResourceNotFoundException.class)
            .hasMessageContaining("Risk not found");
    }

    @Test
    void createRisk_savesAndReturnsResponse() {
        RiskRecordRequest request = new RiskRecordRequest();
        request.setRiskTitle("New Risk");
        request.setDescription("Description");
        request.setCategory(RiskRecord.RiskCategory.FINANCIAL);
        request.setLikelihood(5);
        request.setImpact(6);
        request.setControlEffectiveness(20);

        when(riskRecordRepository.save(any(RiskRecord.class))).thenReturn(sampleRisk);
        doNothing().when(auditLogService).log(any(), any(), any(), any(), any(), any());

        RiskRecordResponse response = riskRecordService.createRisk(request, "admin", null);

        assertThat(response).isNotNull();
        verify(riskRecordRepository, times(1)).save(any(RiskRecord.class));
    }

    @Test
    void deleteRisk_softDeletes_existingRisk() {
        when(riskRecordRepository.findActiveById(1L)).thenReturn(Optional.of(sampleRisk));
        when(riskRecordRepository.save(any(RiskRecord.class))).thenReturn(sampleRisk);
        doNothing().when(auditLogService).log(any(), any(), any(), any(), any(), any());

        riskRecordService.deleteRisk(1L, "admin", null);

        verify(riskRecordRepository).save(argThat(r -> r.getDeletedAt() != null));
    }

    @Test
    void deleteRisk_throwsException_whenNotFound() {
        when(riskRecordRepository.findActiveById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> riskRecordService.deleteRisk(99L, "admin", null))
            .isInstanceOf(ResourceNotFoundException.class);
    }
}
