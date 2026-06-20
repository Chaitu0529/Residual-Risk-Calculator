package com.tool114.riskmanager.repository;

import com.tool114.riskmanager.entity.RiskRecord;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface RiskRecordRepository extends JpaRepository<RiskRecord, Long> {

    // Soft-delete aware queries
    @Query("SELECT r FROM RiskRecord r WHERE r.deletedAt IS NULL")
    List<RiskRecord> findAllActive();

    @Query("SELECT r FROM RiskRecord r WHERE r.deletedAt IS NULL")
    Page<RiskRecord> findAllActive(Pageable pageable);

    @Query("SELECT r FROM RiskRecord r WHERE r.id = :id AND r.deletedAt IS NULL")
    Optional<RiskRecord> findActiveById(@Param("id") Long id);

    // Search with filters
    @Query("""
        SELECT r FROM RiskRecord r
        WHERE r.deletedAt IS NULL
        AND (:keyword IS NULL OR LOWER(r.riskTitle) LIKE LOWER(CONCAT('%', :keyword, '%'))
             OR LOWER(r.description) LIKE LOWER(CONCAT('%', :keyword, '%')))
        AND (:category IS NULL OR r.category = :category)
        AND (:status IS NULL OR r.status = :status)
        AND (:riskLevel IS NULL OR r.riskLevel = :riskLevel)
        AND (:startDate IS NULL OR r.createdAt >= :startDate)
        AND (:endDate IS NULL OR r.createdAt <= :endDate)
        """)
    Page<RiskRecord> searchRisks(
        @Param("keyword") String keyword,
        @Param("category") RiskRecord.RiskCategory category,
        @Param("status") RiskRecord.RiskStatus status,
        @Param("riskLevel") RiskRecord.RiskLevel riskLevel,
        @Param("startDate") LocalDateTime startDate,
        @Param("endDate") LocalDateTime endDate,
        Pageable pageable
    );

    // Stats queries
    @Query("SELECT COUNT(r) FROM RiskRecord r WHERE r.deletedAt IS NULL")
    long countActive();

    @Query("SELECT COUNT(r) FROM RiskRecord r WHERE r.deletedAt IS NULL AND r.riskLevel = :level")
    long countByRiskLevel(@Param("level") RiskRecord.RiskLevel level);

    @Query("SELECT COUNT(r) FROM RiskRecord r WHERE r.deletedAt IS NULL AND r.status = :status")
    long countByStatus(@Param("status") RiskRecord.RiskStatus status);

    @Query("SELECT AVG(r.residualRisk) FROM RiskRecord r WHERE r.deletedAt IS NULL AND r.residualRisk IS NOT NULL")
    Double averageResidualRisk();

    // For CSV export - all active records
    @Query("SELECT r FROM RiskRecord r WHERE r.deletedAt IS NULL ORDER BY r.createdAt DESC")
    List<RiskRecord> findAllActiveForExport();

    // For email reminder - open risks
    @Query("SELECT r FROM RiskRecord r WHERE r.deletedAt IS NULL AND r.status = 'OPEN' ORDER BY r.inherentRisk DESC")
    List<RiskRecord> findOpenRisks();

    // Count by category for analytics
    @Query("SELECT r.category, COUNT(r) FROM RiskRecord r WHERE r.deletedAt IS NULL GROUP BY r.category")
    List<Object[]> countByCategory();

    // Risk trend by month
    @Query("""
        SELECT FUNCTION('DATE_TRUNC', 'month', r.createdAt), COUNT(r), AVG(r.residualRisk)
        FROM RiskRecord r
        WHERE r.deletedAt IS NULL
        AND r.createdAt >= :since
        GROUP BY FUNCTION('DATE_TRUNC', 'month', r.createdAt)
        ORDER BY FUNCTION('DATE_TRUNC', 'month', r.createdAt)
        """)
    List<Object[]> findMonthlyTrend(@Param("since") LocalDateTime since);
}
