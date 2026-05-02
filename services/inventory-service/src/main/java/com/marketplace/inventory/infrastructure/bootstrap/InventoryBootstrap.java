package com.marketplace.inventory.infrastructure.bootstrap;

import com.marketplace.inventory.domain.model.ProductStock;
import com.marketplace.inventory.domain.repository.ProductStockRepository;
import com.mongodb.ConnectionString;
import com.mongodb.client.MongoClient;
import com.mongodb.client.MongoClients;
import lombok.extern.slf4j.Slf4j;
import org.bson.Document;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;

@Slf4j
@Component
@ConditionalOnProperty(name = "inventory.bootstrap.enabled", havingValue = "true", matchIfMissing = true)
public class InventoryBootstrap implements ApplicationRunner {

    private final ProductStockRepository repository;
    private final String productMongoUri;

    public InventoryBootstrap(ProductStockRepository repository,
                              @Value("${inventory.bootstrap.product-mongo-uri}") String productMongoUri) {
        this.repository = repository;
        this.productMongoUri = productMongoUri;
    }

    @Override
    public void run(ApplicationArguments args) {
        if (repository.count() > 0) {
            log.info("Inventory already seeded ({} entries), skipping bootstrap", repository.count());
            return;
        }
        log.info("Inventory empty, bootstrapping from product_db at {}", productMongoUri);

        ConnectionString conn = new ConnectionString(productMongoUri);
        try (MongoClient client = MongoClients.create(conn)) {
            MongoTemplate productTemplate = new MongoTemplate(client, conn.getDatabase());
            List<Document> products = productTemplate.find(
                    Query.query(Criteria.where("active").is(true)),
                    Document.class,
                    "products"
            );
            List<ProductStock> snapshot = new ArrayList<>(products.size());
            for (Document p : products) {
                String productId = p.getString("_id");
                String sellerId = p.getString("sellerId");
                Integer stock = p.getInteger("stock");
                if (productId == null || sellerId == null || stock == null) continue;
                snapshot.add(ProductStock.builder()
                        .productId(productId)
                        .sellerId(sellerId)
                        .stock(stock)
                        .build());
            }
            if (!snapshot.isEmpty()) {
                repository.saveAll(snapshot);
            }
            log.info("Bootstrap complete: seeded {} stock entries", snapshot.size());
        } catch (Exception e) {
            log.error("Inventory bootstrap failed — manual seed required", e);
        }
    }
}
