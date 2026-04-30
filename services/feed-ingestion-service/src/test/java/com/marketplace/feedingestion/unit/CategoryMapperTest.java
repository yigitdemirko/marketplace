package com.marketplace.feedingestion.unit;

import com.marketplace.feedingestion.application.service.CategoryMapper;
import com.marketplace.feedingestion.infrastructure.client.dto.Category;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;

import static org.assertj.core.api.Assertions.assertThat;

class CategoryMapperTest {

    private final CategoryMapper mapper = new CategoryMapper();

    @ParameterizedTest
    @CsvSource({
            "'Electronics > Audio > Audio Components > Headphones', AUDIO",
            "'Electronics > Communications > Telephony > Mobile Phones', PHONES_TABLETS",
            "'Electronics > Computers > Laptops', COMPUTERS",
            "'Electronics > Cameras & Optics > Cameras', CAMERAS",
            "'Electronics > Video Game Consoles', GAMING",
            "'Apparel & Accessories > Shoes', SHOES",
            "'Apparel & Accessories > Jewelry', JEWELRY",
            "'Home & Garden > Kitchen & Dining > Cookware', KITCHEN",
            "'Home & Garden > Furniture', FURNITURE",
            "'Home & Garden > Lawn & Garden', GARDEN",
            "'Health & Beauty > Personal Care', PERSONAL_CARE",
            "'Health & Beauty > Vitamins & Supplements', VITAMINS",
            "'Sporting Goods > Exercise & Fitness', SPORTS_FITNESS",
            "'Food, Beverages & Tobacco > Beverages', BEVERAGES",
            "'Media > Books', BOOKS",
            "'Media > Music', MUSIC",
            "'Vehicles & Parts > Motor Vehicles', AUTOMOTIVE",
            "'Toys & Games > Toys', TOYS_GAMES",
            "'Office Supplies', OFFICE_SUPPLIES",
            "'Animals & Pet Supplies', PET_SUPPLIES",
            "'Some Unknown Category', OTHER",
    })
    void shouldMapGoogleCategoryToEnum(String googleCategory, Category expected) {
        assertThat(mapper.map(googleCategory)).isEqualTo(expected);
    }

    @Test
    void shouldReturnOtherForNullOrBlank() {
        assertThat(mapper.map(null)).isEqualTo(Category.OTHER);
        assertThat(mapper.map("")).isEqualTo(Category.OTHER);
        assertThat(mapper.map("   ")).isEqualTo(Category.OTHER);
    }
}
