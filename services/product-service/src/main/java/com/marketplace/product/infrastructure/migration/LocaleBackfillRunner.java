package com.marketplace.product.infrastructure.migration;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class LocaleBackfillRunner implements CommandLineRunner {

    private final MongoTemplate mongoTemplate;

    @Value("${app.locale-backfill.enabled:true}")
    private boolean enabled;

    @Override
    public void run(String... args) {
        if (!enabled) {
            log.info("Locale backfill disabled, skipping.");
            return;
        }
        Query query = new Query(Criteria.where("locale").exists(false));
        Update update = new Update().set("locale", "EN");
        var result = mongoTemplate.updateMulti(query, update, "products");
        log.info("Locale backfill complete: {} documents updated to EN", result.getModifiedCount());
    }
}
