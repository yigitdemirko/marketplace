package com.marketplace.feedingestion.infrastructure.parser.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.dataformat.xml.annotation.JacksonXmlElementWrapper;
import com.fasterxml.jackson.dataformat.xml.annotation.JacksonXmlProperty;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
public class GoogleMerchantItem {

    @JacksonXmlProperty(namespace = "http://base.google.com/ns/1.0", localName = "id")
    private String id;

    @JacksonXmlProperty(localName = "title")
    private String title;

    @JacksonXmlProperty(localName = "description")
    private String description;

    @JacksonXmlProperty(localName = "link")
    private String link;

    @JacksonXmlProperty(namespace = "http://base.google.com/ns/1.0", localName = "image_link")
    private String imageLink;

    @JacksonXmlElementWrapper(useWrapping = false)
    @JacksonXmlProperty(namespace = "http://base.google.com/ns/1.0", localName = "additional_image_link")
    private List<String> additionalImageLinks;

    @JacksonXmlProperty(namespace = "http://base.google.com/ns/1.0", localName = "availability")
    private String availability;

    @JacksonXmlProperty(namespace = "http://base.google.com/ns/1.0", localName = "price")
    private String price;

    @JacksonXmlProperty(namespace = "http://base.google.com/ns/1.0", localName = "brand")
    private String brand;

    @JacksonXmlProperty(namespace = "http://base.google.com/ns/1.0", localName = "condition")
    private String condition;

    @JacksonXmlProperty(namespace = "http://base.google.com/ns/1.0", localName = "google_product_category")
    private String googleProductCategory;

    @JacksonXmlProperty(namespace = "http://base.google.com/ns/1.0", localName = "product_type")
    private String productType;

    @JacksonXmlProperty(namespace = "http://base.google.com/ns/1.0", localName = "gtin")
    private String gtin;

    @JacksonXmlProperty(namespace = "http://base.google.com/ns/1.0", localName = "mpn")
    private String mpn;

    @JacksonXmlProperty(namespace = "http://base.google.com/ns/1.0", localName = "quantity")
    private Integer quantity;
}
