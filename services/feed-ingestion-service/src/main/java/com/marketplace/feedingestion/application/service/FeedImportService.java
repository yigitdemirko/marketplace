package com.marketplace.feedingestion.application.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.marketplace.common.exception.NotFoundException;
import com.marketplace.feedingestion.api.v1.dto.response.ImportJobResponse;
import com.marketplace.feedingestion.api.v1.dto.response.ImportRowError;
import com.marketplace.feedingestion.domain.model.ImportJob;
import com.marketplace.feedingestion.domain.model.ImportStatus;
import com.marketplace.feedingestion.domain.repository.ImportJobRepository;
import com.marketplace.feedingestion.infrastructure.client.CatalogGateway;
import com.marketplace.feedingestion.infrastructure.client.dto.BatchCreateFailure;
import com.marketplace.feedingestion.infrastructure.client.dto.BatchCreateResponse;
import com.marketplace.feedingestion.infrastructure.client.dto.Category;
import com.marketplace.feedingestion.infrastructure.client.dto.CreateProductRequest;
import com.marketplace.feedingestion.infrastructure.parser.GoogleMerchantXmlParser;
import com.marketplace.feedingestion.infrastructure.parser.dto.GoogleMerchantItem;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Slf4j
@Service
@RequiredArgsConstructor
public class FeedImportService {

    private static final Pattern PRICE_NUMBER = Pattern.compile("\\d+([.,]\\d+)?");
    private static final int DEFAULT_STOCK_IN_STOCK = 100;

    private final ImportJobRepository importJobRepository;
    private final GoogleMerchantXmlParser parser;
    private final CategoryMapper categoryMapper;
    private final CatalogGateway catalogGateway;
    private final ObjectMapper objectMapper;

    @Transactional
    public ImportJobResponse importFeed(String sellerId, MultipartFile file) {
        ImportJob job = ImportJob.create(sellerId, file.getOriginalFilename());
        importJobRepository.save(job);

        List<ImportRowError> rowErrors = new ArrayList<>();
        List<GoogleMerchantItem> items;
        try {
            items = parser.parse(file.getInputStream());
        } catch (IOException ex) {
            log.error("Failed to parse XML for job {}", job.getId(), ex);
            return finalizeFailed(job, "Failed to parse XML: " + ex.getMessage());
        }

        List<CreateProductRequest> validRequests = new ArrayList<>();
        List<Integer> validIndexes = new ArrayList<>();

        for (int i = 0; i < items.size(); i++) {
            GoogleMerchantItem item = items.get(i);
            try {
                CreateProductRequest request = mapToRequest(item);
                validRequests.add(request);
                validIndexes.add(i);
            } catch (Exception ex) {
                rowErrors.add(new ImportRowError(i, item.getId(), ex.getMessage()));
            }
        }

        int totalItems = items.size();
        int successCount = 0;

        if (!validRequests.isEmpty()) {
            try {
                BatchCreateResponse response = catalogGateway.createBatch(sellerId, validRequests);
                successCount = response.successCount();
                if (response.failures() != null) {
                    for (BatchCreateFailure failure : response.failures()) {
                        int originalIndex = validIndexes.get(failure.index());
                        String productId = items.get(originalIndex).getId();
                        rowErrors.add(new ImportRowError(originalIndex, productId, failure.message()));
                    }
                }
            } catch (Exception ex) {
                log.error("Batch create call failed for job {}", job.getId(), ex);
                return finalizeFailed(job, "Product service call failed: " + ex.getMessage());
            }
        }

        job.setTotalItems(totalItems);
        job.setSuccessCount(successCount);
        job.setFailureCount(totalItems - successCount);
        job.setStatus(ImportStatus.COMPLETED);
        job.setErrors(serializeErrors(rowErrors));
        job.setCompletedAt(LocalDateTime.now());
        importJobRepository.save(job);

        return toResponse(job, rowErrors);
    }

    @Transactional(readOnly = true)
    public Page<ImportJobResponse> listImports(String sellerId, Pageable pageable) {
        return importJobRepository.findBySellerIdOrderByCreatedAtDesc(sellerId, pageable)
                .map(job -> toResponse(job, deserializeErrors(job.getErrors())));
    }

    @Transactional(readOnly = true)
    public ImportJobResponse getImport(UUID jobId, String sellerId) {
        ImportJob job = importJobRepository.findById(jobId)
                .orElseThrow(() -> new NotFoundException("IMPORT_JOB_NOT_FOUND", "İçe aktarma işi bulunamadı: " + jobId));
        if (!job.getSellerId().equals(sellerId)) {
            throw new NotFoundException("IMPORT_JOB_NOT_FOUND", "İçe aktarma işi bulunamadı: " + jobId);
        }
        return toResponse(job, deserializeErrors(job.getErrors()));
    }

    private CreateProductRequest mapToRequest(GoogleMerchantItem item) {
        if (item.getId() == null || item.getId().isBlank()) {
            throw new IllegalArgumentException("Missing g:id");
        }
        if (item.getTitle() == null || item.getTitle().isBlank()) {
            throw new IllegalArgumentException("Missing title");
        }

        BigDecimal price = parsePrice(item.getPrice());
        if (price == null) {
            throw new IllegalArgumentException("Invalid or missing g:price");
        }

        int stock = resolveStock(item);
        Category category = categoryMapper.map(item.getGoogleProductCategory());

        List<String> images = new ArrayList<>();
        if (item.getImageLink() != null && !item.getImageLink().isBlank()) {
            images.add(item.getImageLink());
        }
        if (item.getAdditionalImageLinks() != null) {
            for (String link : item.getAdditionalImageLinks()) {
                if (link != null && !link.isBlank()) {
                    images.add(link);
                }
            }
        }

        Map<String, String> attributes = new HashMap<>();
        putIfPresent(attributes, "gtin", item.getGtin());
        putIfPresent(attributes, "mpn", item.getMpn());
        putIfPresent(attributes, "condition", item.getCondition());
        putIfPresent(attributes, "googleProductCategory", item.getGoogleProductCategory());
        putIfPresent(attributes, "productType", item.getProductType());
        putIfPresent(attributes, "externalId", item.getId());

        return new CreateProductRequest(
                item.getTitle(),
                item.getDescription() != null ? item.getDescription() : item.getTitle(),
                price,
                stock,
                category,
                item.getBrand(),
                images,
                attributes
        );
    }

    private BigDecimal parsePrice(String price) {
        if (price == null || price.isBlank()) {
            return null;
        }
        Matcher m = PRICE_NUMBER.matcher(price);
        if (!m.find()) {
            return null;
        }
        try {
            return new BigDecimal(m.group().replace(",", "."));
        } catch (NumberFormatException ex) {
            return null;
        }
    }

    private int resolveStock(GoogleMerchantItem item) {
        if (item.getQuantity() != null && item.getQuantity() >= 0) {
            return item.getQuantity();
        }
        String availability = item.getAvailability();
        if (availability != null && availability.toLowerCase().contains("out of stock")) {
            return 0;
        }
        return DEFAULT_STOCK_IN_STOCK;
    }

    private void putIfPresent(Map<String, String> attrs, String key, String value) {
        if (value != null && !value.isBlank()) {
            attrs.put(key, value);
        }
    }

    private ImportJobResponse finalizeFailed(ImportJob job, String message) {
        List<ImportRowError> errors = List.of(new ImportRowError(-1, null, message));
        job.setStatus(ImportStatus.FAILED);
        job.setErrors(serializeErrors(errors));
        job.setCompletedAt(LocalDateTime.now());
        importJobRepository.save(job);
        return toResponse(job, errors);
    }

    private String serializeErrors(List<ImportRowError> errors) {
        if (errors == null || errors.isEmpty()) {
            return null;
        }
        try {
            return objectMapper.writeValueAsString(errors);
        } catch (Exception ex) {
            log.warn("Failed to serialize errors", ex);
            return null;
        }
    }

    private List<ImportRowError> deserializeErrors(String json) {
        if (json == null || json.isBlank()) {
            return Collections.emptyList();
        }
        try {
            return objectMapper.readValue(json, new TypeReference<List<ImportRowError>>() {});
        } catch (Exception ex) {
            log.warn("Failed to deserialize errors json", ex);
            return Collections.emptyList();
        }
    }

    private ImportJobResponse toResponse(ImportJob job, List<ImportRowError> errors) {
        return new ImportJobResponse(
                job.getId(),
                job.getSellerId(),
                job.getFileName(),
                job.getTotalItems(),
                job.getSuccessCount(),
                job.getFailureCount(),
                job.getStatus(),
                errors,
                job.getCreatedAt(),
                job.getCompletedAt()
        );
    }
}
