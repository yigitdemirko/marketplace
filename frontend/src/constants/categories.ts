export const CATEGORIES = [
  // Electronics
  { id: 'ELECTRONICS', label: 'Consumer Electronics & Gadgets' },
  { id: 'COMPUTERS', label: 'Computers & Laptops' },
  { id: 'PHONES_TABLETS', label: 'Phones & Tablets' },
  { id: 'CAMERAS', label: 'Cameras & Photography' },
  { id: 'AUDIO', label: 'Audio & Headphones' },
  { id: 'GAMING', label: 'Gaming' },
  { id: 'WEARABLES', label: 'Wearables & Smart Devices' },

  // Home & Living
  { id: 'HOME_OUTDOOR', label: 'Home & Outdoor' },
  { id: 'FURNITURE', label: 'Furniture' },
  { id: 'KITCHEN', label: 'Kitchen & Dining' },
  { id: 'GARDEN', label: 'Garden & Tools' },
  { id: 'HOME_APPLIANCES', label: 'Home Appliances' },

  // Fashion
  { id: 'MENS_CLOTHING', label: "Men's Clothing" },
  { id: 'WOMENS_CLOTHING', label: "Women's Clothing" },
  { id: 'KIDS_CLOTHING', label: "Kids' Clothing" },
  { id: 'SHOES', label: 'Shoes & Footwear' },
  { id: 'BAGS', label: 'Bags & Luggage' },
  { id: 'JEWELRY', label: 'Jewelry & Accessories' },
  { id: 'WATCHES', label: 'Watches' },

  // Health, Beauty & Sports
  { id: 'HEALTH_BEAUTY', label: 'Health & Beauty' },
  { id: 'VITAMINS', label: 'Vitamins & Supplements' },
  { id: 'PERSONAL_CARE', label: 'Personal Care' },
  { id: 'SPORTS_FITNESS', label: 'Sports & Fitness' },

  // Food & Grocery
  { id: 'FOOD_GROCERY', label: 'Food & Grocery' },
  { id: 'BEVERAGES', label: 'Beverages' },

  // Books & Media
  { id: 'BOOKS', label: 'Books' },
  { id: 'MUSIC', label: 'Music' },
  { id: 'MOVIES_TV', label: 'Movies & TV' },
  { id: 'SOFTWARE', label: 'Software & Apps' },

  // Automotive
  { id: 'AUTOMOTIVE', label: 'Automotive' },

  // Baby & Kids
  { id: 'BABY', label: 'Baby Products' },
  { id: 'TOYS_GAMES', label: 'Toys & Games' },

  // Office & Business
  { id: 'OFFICE_SUPPLIES', label: 'Office Supplies' },
  { id: 'INDUSTRIAL', label: 'Industrial & Scientific' },

  // Pets
  { id: 'PET_SUPPLIES', label: 'Pet Supplies' },

  // Other
  { id: 'OTHER', label: 'Other' },
] as const

export type CategoryId = (typeof CATEGORIES)[number]['id']

export function getCategoryLabel(id: string): string {
  return CATEGORIES.find((c) => c.id === id)?.label ?? id
}
