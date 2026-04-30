package com.marketplace.feedingestion.unit;

import com.marketplace.feedingestion.infrastructure.parser.GoogleMerchantXmlParser;
import com.marketplace.feedingestion.infrastructure.parser.dto.GoogleMerchantItem;
import org.junit.jupiter.api.Test;

import java.io.InputStream;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

class GoogleMerchantXmlParserTest {

    private final GoogleMerchantXmlParser parser = new GoogleMerchantXmlParser();

    @Test
    void shouldParseSampleFeedWithThreeItems() throws Exception {
        try (InputStream is = getClass().getResourceAsStream("/sample-feed.xml")) {
            List<GoogleMerchantItem> items = parser.parse(is);

            assertThat(items).hasSize(3);

            GoogleMerchantItem first = items.get(0);
            assertThat(first.getId()).isEqualTo("SKU-001");
            assertThat(first.getTitle()).isEqualTo("Wireless Bluetooth Headphones");
            assertThat(first.getPrice()).isEqualTo("129.99 USD");
            assertThat(first.getBrand()).isEqualTo("SoundCore");
            assertThat(first.getQuantity()).isEqualTo(50);
            assertThat(first.getImageLink()).isEqualTo("https://sample.example.com/images/sku-001.jpg");
            assertThat(first.getAdditionalImageLinks()).hasSize(2);
            assertThat(first.getGoogleProductCategory()).contains("Headphones");
        }
    }

    @Test
    void shouldHandleItemWithoutQuantity() throws Exception {
        try (InputStream is = getClass().getResourceAsStream("/sample-feed.xml")) {
            List<GoogleMerchantItem> items = parser.parse(is);
            GoogleMerchantItem third = items.get(2);

            assertThat(third.getId()).isEqualTo("SKU-003");
            assertThat(third.getQuantity()).isNull();
            assertThat(third.getAvailability()).isEqualTo("out of stock");
        }
    }
}
