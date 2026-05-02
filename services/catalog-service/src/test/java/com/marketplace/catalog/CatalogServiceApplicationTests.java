package com.marketplace.catalog;

import com.marketplace.catalog.infrastructure.client.InventoryClient;
import com.marketplace.catalog.infrastructure.messaging.ProductEventPublisher;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.testcontainers.containers.MongoDBContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import software.amazon.awssdk.services.s3.S3Client;

@SpringBootTest
@Testcontainers
class CatalogServiceApplicationTests {

    @Container
    @ServiceConnection
    static MongoDBContainer mongodb = new MongoDBContainer("mongo:7-jammy");

    @MockitoBean
    ProductEventPublisher eventPublisher;

    @MockitoBean
    InventoryClient inventoryClient;

    @MockitoBean
    S3Client s3Client;

    @Test
    void contextLoads() {
    }

}
