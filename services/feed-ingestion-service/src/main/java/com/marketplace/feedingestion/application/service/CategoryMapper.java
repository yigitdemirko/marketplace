package com.marketplace.feedingestion.application.service;

import com.marketplace.feedingestion.infrastructure.client.dto.Category;
import org.springframework.stereotype.Component;

@Component
public class CategoryMapper {

    public Category map(String googleCategory) {
        if (googleCategory == null || googleCategory.isBlank()) {
            return Category.OTHER;
        }
        String c = googleCategory.toLowerCase();

        if (c.contains("headphone") || c.contains("audio") || c.contains("speaker")) return Category.AUDIO;
        if (c.contains("phone") || c.contains("tablet")) return Category.PHONES_TABLETS;
        if (c.contains("laptop") || c.contains("computer")) return Category.COMPUTERS;
        if (c.contains("camera")) return Category.CAMERAS;
        if (c.contains("video game") || c.contains("console") || c.contains("gaming")) return Category.GAMING;
        if (c.contains("watch")) return Category.WATCHES;
        if (c.contains("wearable") || c.contains("smart device")) return Category.WEARABLES;

        if (c.contains("men") && c.contains("clothing")) return Category.MENS_CLOTHING;
        if (c.contains("women") && c.contains("clothing")) return Category.WOMENS_CLOTHING;
        if (c.contains("baby") && c.contains("clothing")) return Category.KIDS_CLOTHING;
        if ((c.contains("kid") || c.contains("children")) && c.contains("clothing")) return Category.KIDS_CLOTHING;
        if (c.contains("baby")) return Category.BABY;
        if (c.contains("shoe") || c.contains("footwear")) return Category.SHOES;
        if (c.contains("bag") || c.contains("luggage") || c.contains("backpack")) return Category.BAGS;
        if (c.contains("jewelry") || c.contains("jewellery")) return Category.JEWELRY;

        if (c.contains("kitchen") || c.contains("dining") || c.contains("cookware")) return Category.KITCHEN;
        if (c.contains("furniture")) return Category.FURNITURE;
        if (c.contains("garden") || c.contains("outdoor power") || c.contains("lawn")) return Category.GARDEN;
        if (c.contains("home") && c.contains("appliance")) return Category.HOME_APPLIANCES;
        if (c.contains("appliance")) return Category.HOME_APPLIANCES;

        if (c.contains("vitamin") || c.contains("supplement")) return Category.VITAMINS;
        if (c.contains("personal care") || c.contains("hygiene")) return Category.PERSONAL_CARE;
        if (c.contains("beauty") || c.contains("cosmetic") || c.contains("makeup")) return Category.HEALTH_BEAUTY;
        if (c.contains("sport") || c.contains("fitness") || c.contains("exercise")) return Category.SPORTS_FITNESS;
        if (c.contains("health")) return Category.HEALTH_BEAUTY;

        if (c.contains("beverage") || c.contains("drink") || c.contains("coffee") || c.contains("tea")) return Category.BEVERAGES;
        if (c.contains("food") || c.contains("grocery") || c.contains("snack")) return Category.FOOD_GROCERY;

        if (c.contains("book")) return Category.BOOKS;
        if (c.contains("music")) return Category.MUSIC;
        if (c.contains("movie") || c.contains(" tv") || c.contains("video")) return Category.MOVIES_TV;
        if (c.contains("software") || c.contains(" app")) return Category.SOFTWARE;

        if (c.contains("automotive") || c.contains("vehicle") || c.contains("motor")) return Category.AUTOMOTIVE;

        if (c.contains("toy") || c.contains("game")) return Category.TOYS_GAMES;

        if (c.contains("office")) return Category.OFFICE_SUPPLIES;
        if (c.contains("industrial") || c.contains("scientific")) return Category.INDUSTRIAL;

        if (c.contains("pet") || c.contains("animal")) return Category.PET_SUPPLIES;

        if (c.contains("home")) return Category.HOME_OUTDOOR;
        if (c.contains("electronic")) return Category.ELECTRONICS;

        return Category.OTHER;
    }
}
