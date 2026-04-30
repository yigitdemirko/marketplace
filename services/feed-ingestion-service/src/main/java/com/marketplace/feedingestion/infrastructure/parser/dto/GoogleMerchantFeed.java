package com.marketplace.feedingestion.infrastructure.parser.dto;

import com.fasterxml.jackson.dataformat.xml.annotation.JacksonXmlProperty;
import com.fasterxml.jackson.dataformat.xml.annotation.JacksonXmlRootElement;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@JacksonXmlRootElement(localName = "rss")
public class GoogleMerchantFeed {

    @JacksonXmlProperty(localName = "channel")
    private GoogleMerchantChannel channel;
}
