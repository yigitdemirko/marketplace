export const CATEGORIES = [
  // Electronics
  { id: 'ELECTRONICS', label: 'Tüketici Elektroniği & Gadget' },
  { id: 'COMPUTERS', label: 'Bilgisayar & Laptop' },
  { id: 'PHONES_TABLETS', label: 'Telefon & Tablet' },
  { id: 'CAMERAS', label: 'Kamera & Fotoğraf' },
  { id: 'AUDIO', label: 'Ses & Kulaklık' },
  { id: 'GAMING', label: 'Oyun' },
  { id: 'WEARABLES', label: 'Giyilebilir & Akıllı Cihazlar' },

  // Home & Living
  { id: 'HOME_OUTDOOR', label: 'Ev & Bahçe' },
  { id: 'FURNITURE', label: 'Mobilya' },
  { id: 'KITCHEN', label: 'Mutfak & Yemek' },
  { id: 'GARDEN', label: 'Bahçe & Aletler' },
  { id: 'HOME_APPLIANCES', label: 'Beyaz Eşya' },

  // Fashion
  { id: 'MENS_CLOTHING', label: 'Erkek Giyim' },
  { id: 'WOMENS_CLOTHING', label: 'Kadın Giyim' },
  { id: 'KIDS_CLOTHING', label: 'Çocuk Giyim' },
  { id: 'SHOES', label: 'Ayakkabı' },
  { id: 'BAGS', label: 'Çanta & Bavul' },
  { id: 'JEWELRY', label: 'Takı & Aksesuar' },
  { id: 'WATCHES', label: 'Saat' },

  // Health, Beauty & Sports
  { id: 'HEALTH_BEAUTY', label: 'Sağlık & Güzellik' },
  { id: 'VITAMINS', label: 'Vitamin & Takviye' },
  { id: 'PERSONAL_CARE', label: 'Kişisel Bakım' },
  { id: 'SPORTS_FITNESS', label: 'Spor & Fitness' },

  // Food & Grocery
  { id: 'FOOD_GROCERY', label: 'Gıda & Market' },
  { id: 'BEVERAGES', label: 'İçecek' },

  // Books & Media
  { id: 'BOOKS', label: 'Kitap' },
  { id: 'MUSIC', label: 'Müzik' },
  { id: 'MOVIES_TV', label: 'Film & Dizi' },
  { id: 'SOFTWARE', label: 'Yazılım & Uygulama' },

  // Automotive
  { id: 'AUTOMOTIVE', label: 'Otomotiv' },

  // Baby & Kids
  { id: 'BABY', label: 'Bebek Ürünleri' },
  { id: 'TOYS_GAMES', label: 'Oyuncak & Oyun' },

  // Office & Business
  { id: 'OFFICE_SUPPLIES', label: 'Ofis Malzemeleri' },
  { id: 'INDUSTRIAL', label: 'Endüstriyel & Bilimsel' },

  // Pets
  { id: 'PET_SUPPLIES', label: 'Evcil Hayvan' },

  // Other
  { id: 'OTHER', label: 'Diğer' },
] as const

export type CategoryId = (typeof CATEGORIES)[number]['id']

export function getCategoryLabel(id: string): string {
  return CATEGORIES.find((c) => c.id === id)?.label ?? id
}
