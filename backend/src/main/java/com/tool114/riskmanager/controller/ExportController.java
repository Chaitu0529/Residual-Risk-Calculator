package com.tool114.riskmanager.controller;

import com.tool114.riskmanager.service.CsvExportService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.io.IOException;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

@RestController
@RequestMapping("/export")
@RequiredArgsConstructor
@Tag(name = "Export", description = "Data export APIs")
@SecurityRequirement(name = "bearerAuth")
public class ExportController {

    private final CsvExportService csvExportService;

    @GetMapping("/csv")
    @Operation(summary = "Export all risk records as CSV",
               description = "Downloads all active risk records as a UTF-8 CSV file")
    public ResponseEntity<byte[]> exportCsv() throws IOException {
        byte[] csvData = csvExportService.exportAllRisks();
        String filename = "risk_records_"
            + LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd_HHmmss"))
            + ".csv";

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                .contentType(MediaType.parseMediaType("text/csv; charset=UTF-8"))
                .body(csvData);
    }
}
