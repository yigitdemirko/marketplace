package com.marketplace.feedingestion.unit;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.marketplace.feedingestion.api.v1.dto.response.ImportJobResponse;
import com.marketplace.feedingestion.application.service.CategoryMapper;
import com.marketplace.feedingestion.application.service.FeedImportService;
import com.marketplace.feedingestion.domain.model.ImportJob;
import com.marketplace.feedingestion.domain.model.ImportStatus;
import com.marketplace.feedingestion.domain.repository.ImportJobRepository;
import com.marketplace.feedingestion.infrastructure.client.CatalogGateway;
import com.marketplace.feedingestion.infrastructure.client.CatalogUnavailableException;
import com.marketplace.feedingestion.infrastructure.client.dto.BatchCreateFailure;
import com.marketplace.feedingestion.infrastructure.client.dto.BatchCreateResponse;
import com.marketplace.feedingestion.infrastructure.client.dto.Category;
import com.marketplace.feedingestion.infrastructure.parser.GoogleMerchantXmlParser;
import com.marketplace.feedingestion.infrastructure.parser.dto.GoogleMerchantItem;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@Tag("unit")
@ExtendWith(MockitoExtension.class)
class FeedImportServiceTest {

    @Mock
    private ImportJobRepository importJobRepository;

    @Mock
    private GoogleMerchantXmlParser parser;

    @Mock
    private CategoryMapper categoryMapper;

    @Mock
    private CatalogGateway catalogGateway;

    @InjectMocks
    private FeedImportService service;

    private MultipartFile dummyXml() {
        return new MockMultipartFile("file", "feed.xml", "application/xml", "<rss/>".getBytes());
    }

    private GoogleMerchantItem item(String id, String title, String price) {
        GoogleMerchantItem i = new GoogleMerchantItem();
        i.setId(id);
        i.setTitle(title);
        i.setPrice(price);
        i.setBrand("Brand");
        i.setQuantity(5);
        return i;
    }

    @BeforeEach
    void setUp() {
        // ObjectMapper is final field on the @InjectMocks subject; set via spy of the real type
        org.springframework.test.util.ReflectionTestUtils.setField(service, "objectMapper", new ObjectMapper());
        lenient().when(importJobRepository.save(any(ImportJob.class))).thenAnswer(inv -> inv.getArgument(0));
        lenient().when(categoryMapper.map(any())).thenReturn(Category.ELECTRONICS);
    }

    @Test
    void should_FinalizeJobAsFailed_When_ParserThrows() throws IOException {
        when(parser.parse(any(InputStream.class))).thenThrow(new IOException("malformed XML"));

        ImportJobResponse response = service.importFeed("seller-1", dummyXml());

        assertThat(response.status()).isEqualTo(ImportStatus.FAILED);
        assertThat(response.errors()).hasSize(1);
        assertThat(response.errors().get(0).message()).contains("Failed to parse XML");
        verify(catalogGateway, never()).createBatch(anyString(), any());
    }

    @Test
    void should_TrackInvalidRows_AsParseErrors_BeforeCallingCatalog() throws IOException {
        when(parser.parse(any(InputStream.class))).thenReturn(List.of(
                item("p1", "Valid", "100 TL"),
                item("p2", null, "50 TL"),                  // missing title → row error
                item(null, "No ID", "30 TL"),                // missing id → row error
                item("p4", "BadPrice", "free")               // unparseable price → row error
        ));
        when(catalogGateway.createBatch(anyString(), any()))
                .thenReturn(new BatchCreateResponse(1, 1, 0, List.of("p1"), List.of()));

        ImportJobResponse response = service.importFeed("seller-1", dummyXml());

        assertThat(response.status()).isEqualTo(ImportStatus.COMPLETED);
        assertThat(response.totalItems()).isEqualTo(4);
        assertThat(response.successCount()).isEqualTo(1);
        assertThat(response.failureCount()).isEqualTo(3);
        assertThat(response.errors()).hasSize(3);
        assertThat(response.errors()).extracting("index").containsExactlyInAnyOrder(1, 2, 3);
    }

    @Test
    void should_MapBatchFailures_BackTo_OriginalRowIndexes() throws IOException {
        when(parser.parse(any(InputStream.class))).thenReturn(List.of(
                item("p1", null, "10 TL"),       // index 0 invalid (parse-time)
                item("p2", "Good", "20 TL"),     // index 1 valid → batch index 0
                item("p3", "Also Good", "30 TL") // index 2 valid → batch index 1
        ));
        when(catalogGateway.createBatch(anyString(), any()))
                .thenReturn(new BatchCreateResponse(2, 1, 1, List.of("p2"),
                        List.of(new BatchCreateFailure(1, "Duplicate SKU"))));

        ImportJobResponse response = service.importFeed("seller-1", dummyXml());

        assertThat(response.totalItems()).isEqualTo(3);
        assertThat(response.successCount()).isEqualTo(1);
        assertThat(response.failureCount()).isEqualTo(2);
        // batch failure index=1 → originalIndex=2, productId=p3
        assertThat(response.errors()).extracting("index").contains(2);
        assertThat(response.errors())
                .anyMatch(e -> "p3".equals(e.productId()) && "Duplicate SKU".equals(e.message()));
    }

    @Test
    void should_FinalizeJobAsFailed_When_CatalogGatewayUnavailable() throws IOException {
        when(parser.parse(any(InputStream.class))).thenReturn(List.of(item("p1", "Valid", "10 TL")));
        when(catalogGateway.createBatch(anyString(), any()))
                .thenThrow(new CatalogUnavailableException("Catalog unavailable", null));

        ImportJobResponse response = service.importFeed("seller-1", dummyXml());

        assertThat(response.status()).isEqualTo(ImportStatus.FAILED);
        assertThat(response.errors().get(0).message()).contains("Product service call failed");
    }

    @Test
    void should_NotCallCatalog_When_AllRowsInvalid() throws IOException {
        when(parser.parse(any(InputStream.class))).thenReturn(List.of(
                item(null, null, null),
                item("p1", null, "10 TL")
        ));

        ImportJobResponse response = service.importFeed("seller-1", dummyXml());

        assertThat(response.status()).isEqualTo(ImportStatus.COMPLETED);
        assertThat(response.successCount()).isZero();
        assertThat(response.failureCount()).isEqualTo(2);
        verify(catalogGateway, never()).createBatch(anyString(), any());
    }

    @Test
    void should_ReturnImport_When_OwnedBySeller() {
        ImportJob job = ImportJob.create("seller-1", "feed.xml");
        when(importJobRepository.findById(job.getId())).thenReturn(Optional.of(job));

        ImportJobResponse response = service.getImport(job.getId(), "seller-1");

        assertThat(response.id()).isEqualTo(job.getId());
        assertThat(response.sellerId()).isEqualTo("seller-1");
    }

    @Test
    void should_Throw_When_SellerRequestsAnotherSellersImport() {
        ImportJob job = ImportJob.create("owner", "feed.xml");
        when(importJobRepository.findById(job.getId())).thenReturn(Optional.of(job));

        assertThatThrownBy(() -> service.getImport(job.getId(), "attacker"))
                .isInstanceOf(com.marketplace.common.exception.NotFoundException.class);
    }

    @Test
    void should_Throw_When_ImportJobIdUnknown() {
        UUID id = UUID.randomUUID();
        when(importJobRepository.findById(id)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.getImport(id, "seller-1"))
                .isInstanceOf(com.marketplace.common.exception.NotFoundException.class);
    }

    @Test
    void should_PersistJobAsCompleted_When_ImportSucceeds() throws IOException {
        when(parser.parse(any(InputStream.class)))
                .thenReturn(List.of(item("p1", "Good", "10 TL")));
        when(catalogGateway.createBatch(anyString(), any()))
                .thenReturn(new BatchCreateResponse(1, 1, 0, List.of("p1"), List.of()));

        service.importFeed("seller-1", dummyXml());

        ArgumentCaptor<ImportJob> captor = ArgumentCaptor.forClass(ImportJob.class);
        verify(importJobRepository, org.mockito.Mockito.atLeastOnce()).save(captor.capture());

        ImportJob saved = captor.getAllValues().get(captor.getAllValues().size() - 1);
        assertThat(saved.getStatus()).isEqualTo(ImportStatus.COMPLETED);
        assertThat(saved.getCompletedAt()).isNotNull();
    }
}
