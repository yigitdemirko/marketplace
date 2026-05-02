package com.marketplace.common.messaging;

public final class KafkaTopics {

    private KafkaTopics() {}

    public static final String ORDER_CREATED = "order.created";
    public static final String ORDER_CANCELLED = "order.cancelled";

    public static final String STOCK_RESERVED = "stock.reserved";
    public static final String STOCK_RESERVATION_FAILED = "stock.reservation.failed";
    public static final String STOCK_RESERVATION_EXPIRED = "stock.reservation.expired";
    public static final String STOCK_CHANGED = "stock.changed";

    public static final String PAYMENT_COMPLETED = "payment.completed";
    public static final String PAYMENT_FAILED = "payment.failed";

    public static final String PRODUCT_CREATED = "product.created";
    public static final String PRODUCT_UPDATED = "product.updated";
    public static final String PRODUCT_DELETED = "product.deleted";
}
