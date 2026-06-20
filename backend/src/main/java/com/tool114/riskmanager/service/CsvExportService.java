package com.tool114.riskmanager.service;

import com.tool114.riskmanager.dto.RiskRecordResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.csv.CSVFormat;
import org.apache.commons.csv.CSVPrinter;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.OutputStreamWriter;
import java.io.PrintWriter;
import java.nio.charset.StandardCharsets;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class CsvExportService {

    private final RiskRecordService riskRecordService;

    public byte[] exportAllRisks() throws IOException {
        List<RiskRecordResponse> risks = riskRecordService.getAllForExport();

        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        // BOM for Excel UTF-8 compatibility
        baos.write(new byte[]{(byte) 0xEF, (byte) 0xBB, (byte) 0xBF});

        try (PrintWriter writer = new PrintWriter(new OutputStreamWriter(baos, StandardCharsets.UTF_8));
             CSVPrinter csvPrinter = new CSVPrinter(writer, CSVFormat.DEFAULT
                 .withHeader(
                     "ID", "Risk Title", "Description", "Category",
                     "Likelihood", "Impact", "Inherent Risk",
                     "Control Effectiveness (%)", "Residual Risk", "Risk Level",
                     "Status", "Created By", "Created At", "Updated At"
                 ))) {

            for (RiskRecordResponse risk : risks) {
                csvPrinter.printRecord(
                    risk.getId(),
                    sanitizeCsvValue(risk.getRiskTitle()),
                    sanitizeCsvValue(risk.getDescription()),
                    risk.getCategory() != null ? risk.getCategory().name() : "",
                    risk.getLikelihood(),
                    risk.getImpact(),
                    risk.getInherentRisk(),
                    risk.getControlEffectiveness(),
                    risk.getResidualRisk(),
                    risk.getRiskLevel() != null ? risk.getRiskLevel().name() : "",
                    risk.getStatus() != null ? risk.getStatus().name() : "",
                    sanitizeCsvValue(risk.getCreatedBy()),
                    risk.getCreatedAt(),
                    risk.getUpdatedAt()
                );
            }
            csvPrinter.flush();
        }

        return baos.toByteArray();
    }

    /**
     * Prevents CSV injection by prefixing dangerous characters
     */
    private String sanitizeCsvValue(String value) {
        if (value == null) return "";
        String sanitized = value.trim();
        // CSV injection prevention
        if (sanitized.startsWith("=") || sanitized.startsWith("+") ||
            sanitized.startsWith("-") || sanitized.startsWith("@") ||
            sanitized.startsWith("\t") || sanitized.startsWith("\r")) {
            sanitized = "'" + sanitized;
        }
        return sanitized;
    }
}
