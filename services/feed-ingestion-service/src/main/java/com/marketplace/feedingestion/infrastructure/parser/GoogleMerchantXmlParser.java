package com.marketplace.feedingestion.infrastructure.parser;

import com.fasterxml.jackson.databind.DeserializationFeature;
import com.fasterxml.jackson.dataformat.xml.XmlMapper;
import com.marketplace.feedingestion.infrastructure.parser.dto.GoogleMerchantFeed;
import com.marketplace.feedingestion.infrastructure.parser.dto.GoogleMerchantItem;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.io.InputStream;
import java.util.Collections;
import java.util.List;

@Slf4j
@Component
public class GoogleMerchantXmlParser {

    private final XmlMapper xmlMapper;

    public GoogleMerchantXmlParser() {
        this.xmlMapper = new XmlMapper();
        this.xmlMapper.configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false);
    }

    public List<GoogleMerchantItem> parse(InputStream inputStream) throws IOException {
        GoogleMerchantFeed feed = xmlMapper.readValue(inputStream, GoogleMerchantFeed.class);
        if (feed == null || feed.getChannel() == null || feed.getChannel().getItems() == null) {
            log.warn("Parsed feed has no items");
            return Collections.emptyList();
        }
        return feed.getChannel().getItems();
    }
}
