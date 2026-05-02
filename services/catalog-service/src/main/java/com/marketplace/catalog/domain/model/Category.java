package com.marketplace.catalog.domain.model;

public enum Category {

    // Electronics
    ELECTRONICS("Consumer Electronics & Gadgets"),
    COMPUTERS("Computers & Laptops"),
    PHONES_TABLETS("Phones & Tablets"),
    CAMERAS("Cameras & Photography"),
    AUDIO("Audio & Headphones"),
    GAMING("Gaming"),
    WEARABLES("Wearables & Smart Devices"),

    // Home & Living
    HOME_OUTDOOR("Home & Outdoor"),
    FURNITURE("Furniture"),
    KITCHEN("Kitchen & Dining"),
    GARDEN("Garden & Tools"),
    HOME_APPLIANCES("Home Appliances"),

    // Fashion
    MENS_CLOTHING("Men's Clothing"),
    WOMENS_CLOTHING("Women's Clothing"),
    KIDS_CLOTHING("Kids' Clothing"),
    SHOES("Shoes & Footwear"),
    BAGS("Bags & Luggage"),
    JEWELRY("Jewelry & Accessories"),
    WATCHES("Watches"),

    // Health, Beauty & Sports
    HEALTH_BEAUTY("Health & Beauty"),
    VITAMINS("Vitamins & Supplements"),
    PERSONAL_CARE("Personal Care"),
    SPORTS_FITNESS("Sports & Fitness"),

    // Food & Grocery
    FOOD_GROCERY("Food & Grocery"),
    BEVERAGES("Beverages"),

    // Books & Media
    BOOKS("Books"),
    MUSIC("Music"),
    MOVIES_TV("Movies & TV"),
    SOFTWARE("Software & Apps"),

    // Automotive
    AUTOMOTIVE("Automotive"),

    // Baby & Kids
    BABY("Baby Products"),
    TOYS_GAMES("Toys & Games"),

    // Office & Business
    OFFICE_SUPPLIES("Office Supplies"),
    INDUSTRIAL("Industrial & Scientific"),

    // Pets
    PET_SUPPLIES("Pet Supplies"),

    // Other
    OTHER("Other");

    private final String displayName;

    Category(String displayName) {
        this.displayName = displayName;
    }

    public String getDisplayName() {
        return displayName;
    }
}
