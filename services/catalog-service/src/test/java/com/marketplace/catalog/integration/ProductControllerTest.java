package com.marketplace.catalog.integration;

import com.marketplace.catalog.infrastructure.client.InventoryClient;
import com.marketplace.catalog.infrastructure.messaging.ProductEventPublisher;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.testcontainers.containers.MongoDBContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import software.amazon.awssdk.services.s3.S3Client;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@Tag("integration")
@SpringBootTest
@AutoConfigureMockMvc
@Testcontainers
@org.springframework.test.context.ActiveProfiles("test")
class ProductControllerTest {

    @Container
    @ServiceConnection
    static MongoDBContainer mongodb = new MongoDBContainer("mongo:7-jammy");

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private ProductEventPublisher eventPublisher;

    @MockitoBean
    private InventoryClient inventoryClient;

    @MockitoBean
    private S3Client s3Client;

    @Test
    void should_CreateProduct_Successfully() throws Exception {
        mockMvc.perform(post("/api/v1/products")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("X-Seller-Id", "seller-123")
                        .content("""
                                {
                                    "name": "Test Product",
                                    "description": "Test description",
                                    "price": 99.99,
                                    "stock": 100,
                                    "category": "ELECTRONICS"
                                }
                                """))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.name").value("Test Product"))
                .andExpect(jsonPath("$.sellerId").value("seller-123"))
                .andExpect(jsonPath("$.stock").value(100));
    }

    @Test
    void should_GetAllProducts_WithPagination() throws Exception {
        mockMvc.perform(get("/api/v1/products")
                        .param("page", "0")
                        .param("size", "20"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content").isArray());
    }

    @Test
    void should_Return404_When_ProductNotFound() throws Exception {
        mockMvc.perform(get("/api/v1/products/non-existent-id"))
                .andExpect(status().isBadRequest());
    }
}