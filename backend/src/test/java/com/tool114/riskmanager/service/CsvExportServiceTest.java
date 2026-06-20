package com.tool114.riskmanager.service;

import com.tool114.riskmanager.dto.RiskRecordResponse;
import com.tool114.riskmanager.entity.RiskRecord;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.io.IOException;
import java.math.BigDecimal;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class CsvExportServiceTest {

    @Mock private RiskRecordService riskRecordService;
    @InjectMocks private CsvExportService csvExportService;

    @Test
    void exportAllRisks_returnsNonEmptyCsv() throws IOException {
        RiskRecordResponse risk = RiskRecordResponse.builder()
                .id(1L)
                .riskTitle("Test Risk")
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

        when(riskRecordService.getAllForExport()).thenReturn(List.of(risk));

        byte[] csv = csvExportService.exportAllRisks();

        assertThat(csv).isNotEmpty();
        String csvString = new String(csv);
        assertThat(csvString).contains("Risk Title");
        assertThat(csvString).contains("Test Risk");
        assertThat(csvString).contains("CYBER_SECURITY");
    }

    @Test
    void exportAllRisks_containsAllRequiredHeaders() throws IOException {
        when(riskRecordService.getAllForExport()).thenReturn(List.of());

        byte[] csv = csvExportService.exportAllRisks();
        String csvString = new String(csv);

        assertThat(csvString).contains("ID");
        assertThat(csvString).contains("Risk Title");
        assertThat(csvString).contains("Category");
        assertThat(csvString).contains("Risk Level");
        assertThat(csvString).contains("Residual Risk");
    }
}
