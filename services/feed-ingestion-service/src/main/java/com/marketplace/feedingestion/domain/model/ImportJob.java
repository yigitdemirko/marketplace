package com.marketplace.feedingestion.domain.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "import_jobs")
@Getter
@Setter
@NoArgsConstructor
public class ImportJob {

    @Id
    private UUID id;

    @Column(name = "seller_id", nullable = false)
    private String sellerId;

    @Column(name = "file_name", nullable = false, length = 512)
    private String fileName;

    @Column(name = "total_items", nullable = false)
    private int totalItems;

    @Column(name = "success_count", nullable = false)
    private int successCount;

    @Column(name = "failure_count", nullable = false)
    private int failureCount;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 32)
    private ImportStatus status;

    @Column(columnDefinition = "TEXT")
    private String errors;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "completed_at")
    private LocalDateTime completedAt;

    public static ImportJob create(String sellerId, String fileName) {
        ImportJob job = new ImportJob();
        job.setId(UUID.randomUUID());
        job.setSellerId(sellerId);
        job.setFileName(fileName);
        job.setStatus(ImportStatus.PROCESSING);
        job.setCreatedAt(LocalDateTime.now());
        return job;
    }
}
