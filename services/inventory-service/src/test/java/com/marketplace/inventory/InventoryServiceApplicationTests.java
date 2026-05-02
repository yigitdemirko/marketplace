package com.marketplace.inventory;

import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.test.context.ActiveProfiles;
import org.testcontainers.containers.MongoDBContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

@Tag("integration")
@SpringBootTest(properties = "inventory.bootstrap.enabled=false")
@Testcontainers
@ActiveProfiles("test")
class InventoryServiceApplicationTests {

    @Container
    @ServiceConnection
    static MongoDBContainer mongo = new MongoDBContainer("mongo:7-jammy");

    @Test
    void contextLoads() {
    }
}
