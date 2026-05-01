package com.marketplace.search.application.service;

import com.marketplace.search.domain.model.ProductDocument;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class ReindexService {

    private final SearchService searchService;
    private final RestTemplate restTemplate;

    @Value("${app.product-service.url:http://localhost:8082}")
    private String productServiceUrl;

    public int reindexAll() {
        int page = 0;
        int size = 100;
        int total = 0;
        boolean hasMore = true;

        while (hasMore) {
            String url = UriComponentsBuilder
                    .fromHttpUrl(productServiceUrl + "/api/v1/products")
                    .queryParam("page", page)
                    .queryParam("size", size)
                    .toUriString();

            ResponseEntity<Map<String, Object>> response = restTemplate.exchange(
                    url, HttpMethod.GET, null,
                    new ParameterizedTypeReference<>() {});

            if (response.getBody() == null) break;

            List<Map<String, Object>> content = (List<Map<String, Object>>) response.getBody().get("content");
            if (content == null || content.isEmpty()) break;

            List<ProductDocument> docs = content.stream().map(this::toDocument).toList();
            docs.forEach(searchService::indexProduct);

            total += docs.size();
            log.info("Reindex progress: {} products indexed (page {})", total, page);

            Boolean last = (Boolean) response.getBody().get("last");
            hasMore = !Boolean.TRUE.equals(last);
            page++;
        }

        log.info("Reindex complete: {} total products indexed", total);
        return total;
    }

    private ProductDocument toDocument(Map<String, Object> p) {
        return ProductDocument.builder()
                .id((String) p.get("id"))
                .sellerId((String) p.get("sellerId"))
                .name((String) p.get("name"))
                .description((String) p.get("description"))
                .price(p.get("price") != null ? new BigDecimal(p.get("price").toString()) : null)
                .stock(p.get("stock") != null ? ((Number) p.get("stock")).intValue() : null)
                .categoryId((String) p.get("categoryId"))
                .locale((String) p.get("locale"))
                .brand((String) p.get("brand"))
                .images((List<String>) p.get("images"))
                .attributes((Map<String, String>) p.get("attributes"))
                .active(Boolean.TRUE.equals(p.get("active")))
                .build();
    }
}
