export const categories = [
  {
    name: 'Pizza',
    slug: 'pizza',
    description: 'Các loại pizza hảo hạng với topping đa dạng',
    sortOrder: 1,
    isActive: true,
  },
  {
    name: 'Burger',
    slug: 'burger',
    description: 'Bánh mì kẹp burger thơm ngon',
    sortOrder: 2,
    isActive: true,
  },
  {
    name: 'Mỳ Ý',
    slug: 'my-y',
    description: 'Mỳ Ý sốt đặc biệt',
    sortOrder: 3,
    isActive: true,
  },
  {
    name: 'Đồ uống',
    slug: 'do-uong',
    description: 'Nước uống các loại',
    sortOrder: 4,
    isActive: true,
  },
  {
    name: 'Combo',
    slug: 'combo',
    description: 'combo giá quá hời',
    sortOrder: 5,
    isActive: true,
  },
  {
    name: 'Khai vị',
    slug: 'khai-vi',
    description: 'Món khai vị kích thích vị giác',
    sortOrder: 6,
    isActive: true,
  },
  {
    name: 'Cà phê',
    slug: 'ca-phe',
    description: 'Các loại cà phê đặc biệt',
    sortOrder: 7,
    isActive: true,
  },
  {
    name: 'Tráng miệng',
    slug: 'trang-mieng',
    description: 'Món ngọt, bánh, tráng miệng',
    sortOrder: 8,
    isActive: true,
  },
  {
    name: 'Salad',
    slug: 'salad',
    description: 'Salad tươi ngon bổ dưỡng',
    sortOrder: 9,
    isActive: true,
  },
  {
    name: 'Súp',
    slug: 'sup',
    description: 'Súp nóng hổi thơm ngon',
    sortOrder: 10,
    isActive: true,
  },
  {
    name: 'Gà rán',
    slug: 'ga-ran',
    description: 'Gà rán giòn tan',
    sortOrder: 11,
    isActive: true,
  },
];

export const ingredients = [
  {
    name: 'Viền phô mai',
    description: 'Cheese-stuffed crust',
    price: 179000,
    imageUrl: 'https://cdn.dodostatic.net/static/Img/Ingredients/99f5cb91225b4875bd06a26d2e842106.png',
    isActive: true,
    isRequired: true,
    categoryId: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    name: 'Mozzarella kem',
    description: 'Creamy mozzarella cheese',
    price: 79000,
    imageUrl: 'https://cdn.dodostatic.net/static/Img/Ingredients/cdea869ef287426386ed634e6099a5ba.png',
    isActive: true,
    isRequired: false,
    categoryId: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    name: 'Phô mai Cheddar',
    description: 'Sharp cheddar cheese',
    price: 79000,
    imageUrl: 'https://cdn.dodostatic.net/static/Img/Ingredients/000D3A22FA54A81411E9AFA69C1FE796',
    isActive: true,
    isRequired: true,
    categoryId: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    name: 'Ớt Jalapeno cay',
    description: 'Spicy jalapeno peppers',
    price: 59000,
    imageUrl: 'https://cdn.dodostatic.net/static/Img/Ingredients/11ee95b6bfdf98fb88a113db92d7b3df.png',
    isActive: true,
    isRequired: true,
    categoryId: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    name: 'Gà mềm',
    description: 'Tender chicken',
    price: 79000,
    imageUrl: 'https://cdn.dodostatic.net/static/Img/Ingredients/000D3A39D824A82E11E9AFA5B328D35A',
    isActive: true,
    isRequired: false,
    categoryId: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    name: 'Nấm mỡ',
    description: 'Fresh mushrooms',
    price: 59000,
    imageUrl: 'https://cdn.dodostatic.net/static/Img/Ingredients/000D3A22FA54A81411E9AFA67259A324',
    isActive: true,
    isRequired: false,
    categoryId: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    name: 'Giăm bông',
    description: 'Cured ham',
    price: 79000,
    imageUrl: 'https://cdn.dodostatic.net/static/Img/Ingredients/000D3A39D824A82E11E9AFA61B9A8D61',
    isActive: true,
    isRequired: true,
    categoryId: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    name: 'Xúc xích Pepperoni cay',
    description: 'Spicy pepperoni sausage',
    price: 79000,
    imageUrl: 'https://cdn.dodostatic.net/static/Img/Ingredients/000D3A22FA54A81411E9AFA6258199C3',
    isActive: true,
    isRequired: false,
    categoryId: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    name: 'Xúc xích Chorizo cay',
    description: 'Spicy chorizo sausage',
    price: 79000,
    imageUrl: 'https://cdn.dodostatic.net/static/Img/Ingredients/000D3A22FA54A81411E9AFA62D5D6027',
    isActive: true,
    isRequired: false,
    categoryId: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    name: 'Dưa chuột muối chua',
    description: 'Pickled cucumbers',
    price: 59000,
    imageUrl: 'https://cdn.dodostatic.net/static/Img/Ingredients/000D3A21DA51A81211E9EA89958D782B',
    isActive: true,
    isRequired: false,
    categoryId: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    name: 'Cà chua tươi',
    description: 'Fresh tomatoes',
    price: 59000,
    imageUrl: 'https://cdn.dodostatic.net/static/Img/Ingredients/000D3A39D824A82E11E9AFA7AC1A1D67',
    isActive: true,
    isRequired: true,
    categoryId: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    name: 'Hành tây đỏ',
    description: 'Red onions',
    price: 59000,
    imageUrl: 'https://cdn.dodostatic.net/static/Img/Ingredients/000D3A22FA54A81411E9AFA60AE6464C',
    isActive: true,
    isRequired: true,
    categoryId: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    name: 'Dứa tươi',
    description: 'Fresh pineapple',
    price: 59000,
    imageUrl: 'https://cdn.dodostatic.net/static/Img/Ingredients/000D3A21DA51A81211E9AFA6795BA2A0',
    isActive: true,
    isRequired: false,
    categoryId: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    name: 'Rau thơm Ý',
    description: 'Italian herbs',
    price: 39000,
    imageUrl: 'https://cdn.dodostatic.net/static/Img/Ingredients/370dac9ed21e4bffaf9bc2618d258734.png',
    isActive: true,
    isRequired: false,
    categoryId: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    name: 'Ớt chuông ngọt',
    description: 'Sweet bell peppers',
    price: 59000,
    imageUrl: 'https://cdn.dodostatic.net/static/Img/Ingredients/000D3A22FA54A81411E9AFA63F774C1B',
    isActive: true,
    isRequired: false,
    categoryId: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    name: 'Phô mai Feta viên',
    description: 'Feta cheese cubes',
    price: 79000,
    imageUrl: 'https://cdn.dodostatic.net/static/Img/Ingredients/000D3A39D824A82E11E9AFA6B0FFC349',
    isActive: true,
    isRequired: false,
    categoryId: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    name: 'Thịt viên',
    description: 'Meatballs',
    price: 79000,
    imageUrl: 'https://cdn.dodostatic.net/static/Img/Ingredients/b2f3a5d5afe44516a93cfc0d2ee60088.png',
    isActive: true,
    isRequired: false,
    categoryId: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
  },

  // ⭐ NEW INGREDIENT 19
  {
    name: 'Tôm sú',
    description: 'Fresh shrimp',
    price: 99000,
    imageUrl: 'https://cdn.dodostatic.net/static/Img/Ingredients/11ee95b6bfdf98fb88a113db92d7b3df.png',
    isActive: true,
    isRequired: false,
    categoryId: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
  },

  // ⭐ NEW INGREDIENT 20
  {
    name: 'Thịt xông khói',
    description: 'Smoked bacon',
    price: 89000,
    imageUrl: 'https://cdn.dodostatic.net/static/Img/Ingredients/000D3A39D824A82E11E9AFA61B9A8D61',
    isActive: true,
    isRequired: false,
    categoryId: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
  },

  // ⭐ NEW INGREDIENT 21
  {
    name: 'Cá ngừ mayo',
    description: 'Tuna with mayonnaise',
    price: 69000,
    imageUrl: 'https://cdn.dodostatic.net/static/Img/Ingredients/000D3A39D824A82E11E9AFA7AC1A1D67',
    isActive: true,
    isRequired: false,
    categoryId: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
  },

  // ⭐ NEW INGREDIENT 22
  {
    name: 'Hành phi giòn',
    description: 'Crispy fried shallots',
    price: 39000,
    imageUrl: 'https://cdn.dodostatic.net/static/Img/Ingredients/370dac9ed21e4bffaf9bc2618d258734.png',
    isActive: true,
    isRequired: false,
    categoryId: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
  },

  // ⭐ NEW INGREDIENT 23
  {
    name: 'Tương BBQ',
    description: 'BBQ sauce topping',
    price: 29000,
    imageUrl: 'https://cdn.dodostatic.net/static/Img/Ingredients/cdea869ef287426386ed634e6099a5ba.png',
    isActive: true,
    isRequired: true,
    categoryId: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
  },

  // ⭐ NEW INGREDIENT 24
  {
    name: 'Xốt Mayonnaise',
    description: 'Japanese mayo drizzle',
    price: 19000,
    imageUrl: 'https://cdn.dodostatic.net/static/Img/Ingredients/000D3A22FA54A81411E9AFA63F774C1B',
    isActive: true,
    isRequired: true,
    categoryId: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
  },

  // ⭐ NEW INGREDIENT 25
  {
    name: 'Trứng bắc thảo',
    description: 'Century egg slices',
    price: 89000,
    imageUrl: 'https://cdn.dodostatic.net/static/Img/Ingredients/000D3A21DA51A81211E9AFA6795BA2A0',
    isActive: true,
    isRequired: false,
    categoryId: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];


export const products = [
  // Pizza (4 sản phẩm)
  {
    name: 'Pizza Phô Mai',
    slug: 'pizza-pho-mai',
    description: 'Pizza phủ phô mai mozzarella thơm béo',
    basePrice: 120000,
    imageUrl: 'https://media.dodostatic.com/image/r:292x292/11ef93517b036e5ca67b43ca2ba0ef12.avif',
    isActive: true,
    isFeatured: true,
    categoryId: 1,
  },
  {
    name: 'Pizza Hải Sản',
    slug: 'pizza-hai-san',
    description: 'Pizza hải sản cao cấp với tôm, mực tươi ngon',
    basePrice: 145000,
    imageUrl: 'https://media.dodostatic.com/image/r:292x292/11ef935194a894b3a481b3ef98075096.avif',
    isActive: true,
    isFeatured: true,
    categoryId: 1,
  },
  {
    name: 'Pizza Pepperoni',
    slug: 'pizza-pepperoni',
    description: 'Pizza xúc xích Pepperoni cay nồng',
    basePrice: 135000,
    imageUrl: 'https://media.dodostatic.com/image/r:233x233/11ef9351d1f5c9e8be730e2e763cba07.avif',
    isActive: true,
    isFeatured: true,
    categoryId: 1,
  },
  {
    name: 'Pizza 4 Loại Thịt',
    slug: 'pizza-4-loai-thit',
    description: 'Pizza với 4 loại thịt hảo hạng',
    basePrice: 155000,
    imageUrl: 'https://media.dodostatic.com/image/r:233x233/11ef93515fa332bda9b7b15cc0b8c873.avif',
    isActive: true,
    isFeatured: false,
    categoryId: 1,
  },

  {
    name: 'Pizza Bò Nướng',
    slug: 'pizza-bo-nuong',
    description: 'Pizza bò nướng sốt BBQ đậm đà',
    basePrice: 149000,
    imageUrl: 'https://media.dodostatic.com/image/r:292x292/11ef9351d610b20cbcc4e63c9a238c32.avif',
    isActive: true,
    isFeatured: false,
    categoryId: 1,
  },
  {
    name: 'Pizza Gà Teriyaki',
    slug: 'pizza-ga-teriyaki',
    description: 'Pizza thịt gà sốt Teriyaki thơm ngọt kiểu Nhật',
    basePrice: 139000,
    imageUrl: 'https://media.dodostatic.com/image/r:292x292/11ef93518d5de7e09f2b719c55c3823d.avif',
    isActive: true,
    isFeatured: true,
    categoryId: 1,
  },
  {
    name: 'Pizza Bò Phô Mai',
    slug: 'pizza-bo-pho-mai',
    description: 'Pizza bò kết hợp phô mai cheddar và mozzarella béo ngậy',
    basePrice: 159000,
    imageUrl: 'https://media.dodostatic.com/image/r:292x292/11ef9351bf0ef91eb9cf872d88bc8ece.avif',
    isActive: true,
    isFeatured: false,
    categoryId: 1,
  },
  {
    name: 'Pizza Xúc Xích Đức',
    slug: 'pizza-xuc-xich-duc',
    description: 'Pizza xúc xích Đức thơm lừng kiểu Âu',
    basePrice: 129000,
    imageUrl: 'https://media.dodostatic.com/image/r:292x292/11ef93516417e6ea8bdfcf95e3449b32.avif',
    isActive: true,
    isFeatured: false,
    categoryId: 1,
  },
  {
    name: 'Pizza Rau Củ Chay',
    slug: 'pizza-rau-cu-chay',
    description: 'Pizza thuần chay với nấm, bắp, ớt chuông và olive',
    basePrice: 115000,
    imageUrl: 'https://media.dodostatic.com/image/r:292x292/11ef935163004266ad84c221766fd39c.avif',
    isActive: true,
    isFeatured: true,
    categoryId: 1,
  },
  {
    name: 'Pizza Thịt Xông Khói',
    slug: 'pizza-thit-xong-khoi',
    description: 'Pizza thịt xông khói giòn thơm, đậm vị',
    basePrice: 145000,
    imageUrl: 'https://media.dodostatic.com/image/r:233x233/11ef93512bd8d956b7fe3c6534a97d5a.avif',
    isActive: true,
    isFeatured: false,
    categoryId: 1,
  },
  {
    name: 'Pizza Hawaiian',
    slug: 'pizza-hawaiian',
    description: 'Pizza dứa và thịt nguội tạo hương vị tươi ngọt đặc trưng',
    basePrice: 130000,
    imageUrl: 'https://media.dodostatic.com/image/r:233x233/11ef9351a4f993c7b7cb436a6f64e87d.avif',
    isActive: true,
    isFeatured: true,
    categoryId: 1,
  },
  {
    name: 'Pizza 4 Cheese',
    slug: 'pizza-4-cheese',
    description: 'Pizza kết hợp 4 loại phô mai thơm béo đặc biệt',
    basePrice: 165000,
    imageUrl: 'https://media.dodostatic.com/image/r:233x233/11ef9351a2530f42b52c6a76e3b708ea.avif',
    isActive: true,
    isFeatured: true,
    categoryId: 1,
  },
  {
    name: 'Pizza Thập Cẩm',
    slug: 'pizza-thap-cam',
    description: 'Pizza đầy đủ topping: thịt, xúc xích, rau củ và phô mai',
    basePrice: 150000,
    imageUrl: 'https://media.dodostatic.com/image/r:233x233/11ef9351d8042727bce761da4bb6ab25.avif',
    isActive: true,
    isFeatured: false,
    categoryId: 1,
  },
  {
    name: 'Pizza Nấm Kem',
    slug: 'pizza-nam-kem',
    description: 'Pizza sốt kem nấm thơm béo, thích hợp cho người thích vị nhẹ',
    basePrice: 125000,
    imageUrl: 'https://media.dodostatic.com/image/r:233x233/11ef935177a867ffa2a236cf7d966a82.avif',
    isActive: true,
    isFeatured: false,
    categoryId: 1,
  },

  // Burger (3 sản phẩm)
  {
    name: 'Burger Bò',
    slug: 'burger-bo',
    description: 'Burger bò nướng thơm lừng',
    basePrice: 85000,
    imageUrl: 'https://media.dodostatic.net/image/r:292x292/11EE796FF0059B799A17F57A9E64C725.webp',
    isActive: true,
    isFeatured: false,
    categoryId: 2,
  },
  {
    name: 'Burger Gà',
    slug: 'burger-ga',
    description: 'Burger gà giòn rụm',
    basePrice: 78000,
    imageUrl: 'https://media.dodostatic.net/image/r:292x292/11EE796FF0059B799A17F57A9E64C725.webp',
    isActive: true,
    isFeatured: false,
    categoryId: 2,
  },
  {
    name: 'Burger Phô Mai',
    slug: 'burger-pho-mai',
    description: 'Burger phô mai béo ngậy',
    basePrice: 82000,
    imageUrl: 'https://media.dodostatic.net/image/r:292x292/11EE796FF0059B799A17F57A9E64C725.webp',
    isActive: true,
    isFeatured: true,
    categoryId: 2,
  },

  // Mỳ Ý (3 sản phẩm)
  {
    name: 'Mỳ Ý Bò Bằm',
    slug: 'my-y-bo-bam',
    description: 'Mỳ Ý sốt bò bằm đậm đà',
    basePrice: 92000,
    imageUrl: 'https://media.dodostatic.com/image/r:233x233/11ef93584c9054ef9b657f6145a806e4.avif',
    isActive: true,
    isFeatured: true,
    categoryId: 3,
  },
  {
    name: 'Mỳ Ý Sốt Kem',
    slug: 'my-y-sot-kem',
    description: 'Mỳ Ý sốt kem béo ngậy',
    basePrice: 98000,
    imageUrl: 'https://media.dodostatic.com/image/r:233x233/11ef93584c9054ef9b657f6145a806e4.avif',
    isActive: true,
    isFeatured: false,
    categoryId: 3,
  },
  {
    name: 'Mỳ Ý Hải Sản',
    slug: 'my-y-hai-san',
    description: 'Mỳ Ý hải sản sốt cà chua',
    basePrice: 115000,
    imageUrl: 'https://media.dodostatic.com/image/r:233x233/11ef935840297bab88e4aae1632cb9bd.avif',
    isActive: true,
    isFeatured: false,
    categoryId: 3,
  },

  // Đồ uống (2 sản phẩm)
  {
    name: 'Pepsi',
    slug: 'pepsi',
    description: 'Pepsi lon 330ml tươi mát',
    basePrice: 20000,
    imageUrl: 'https://media.dodostatic.net/image/r:292x292/11EE7D61B044583596548A59078BBD33.webp',
    isActive: true,
    isFeatured: false,
    categoryId: 4,
  },
  {
    name: 'Nước Cam Ép',
    slug: 'nuoc-cam-ep',
    description: 'Nước cam tươi ép 100%',
    basePrice: 35000,
    imageUrl: 'https://media.dodostatic.net/image/r:292x292/11EE7D61B044583596548A59078BBD33.webp',
    isActive: true,
    isFeatured: false,
    categoryId: 4,
  },

  // Khai vị (2 sản phẩm)
  {
    name: 'Khoai Tây Chiên',
    slug: 'khoai-tay-chien',
    description: 'Khoai tây chiên giòn rụm',
    basePrice: 38000,
    imageUrl: 'https://media.dodostatic.net/image/r:292x292/11EE796F96D11392A2F6DD73599921B9.webp',
    isActive: true,
    isFeatured: false,
    categoryId: 6,
  },
  {
    name: 'Gà Viên Chiên',
    slug: 'ga-vien-chien',
    description: 'Gà viên chiên sốt đặc biệt',
    basePrice: 45000,
    imageUrl: 'https://media.dodostatic.com/image/r:233x233/11ef935898342902a80f69edfead7a32.avif',
    isActive: true,
    isFeatured: true,
    categoryId: 6,
  },

  // Cà phê (1 sản phẩm)
  {
    name: 'Cà Phê Đen',
    slug: 'ca-phe-den',
    description: 'Cà phê đen nguyên chất',
    basePrice: 32000,
    imageUrl: 'https://media.dodostatic.net/image/r:292x292/11EE7D61B0C26A3F85D97A78FEEE00AD.webp',
    isActive: true,
    isFeatured: false,
    categoryId: 7,
  },
];

export const productVariants = [
  // ============================================================
  // GROUP 1: PIZZA (Sinh đủ 2 loại đế: Mỏng & Bình thường cho mọi size)
  // Quy tắc giá: 15cm (+0), 20cm (+15k), 25cm (+25k)
  // ============================================================

  // --- Pizza Phô Mai (productId: 1) ---
  { name: 'Nhỏ (15cm) - Đế Mỏng', size: '15cm', type: 'Mỏng', modifiedPrice: 0, isComboItem: true, isActive: true, productId: 1 },
  { name: 'Nhỏ (15cm) - Đế Bình thường', size: '15cm', type: 'Bình thường', modifiedPrice: 0, isComboItem: true, isActive: true, productId: 1 },
  { name: 'Trung (20cm) - Đế Mỏng', size: '20cm', type: 'Mỏng', modifiedPrice: 15000, isComboItem: false, isActive: true, productId: 1 },
  { name: 'Trung (20cm) - Đế Bình thường', size: '20cm', type: 'Bình thường', modifiedPrice: 15000, isComboItem: false, isActive: true, productId: 1 },
  { name: 'Lớn (25cm) - Đế Mỏng', size: '25cm', type: 'Mỏng', modifiedPrice: 25000, isComboItem: false, isActive: true, productId: 1 },
  { name: 'Lớn (25cm) - Đế Bình thường', size: '25cm', type: 'Bình thường', modifiedPrice: 25000, isComboItem: false, isActive: true, productId: 1 },

  // --- Pizza Hải Sản (productId: 2) ---
  { name: 'Nhỏ (15cm) - Đế Mỏng', size: '15cm', type: 'Mỏng', modifiedPrice: 0, isComboItem: true, isActive: true, productId: 2 },
  { name: 'Nhỏ (15cm) - Đế Bình thường', size: '15cm', type: 'Bình thường', modifiedPrice: 0, isComboItem: true, isActive: true, productId: 2 },
  { name: 'Trung (20cm) - Đế Mỏng', size: '20cm', type: 'Mỏng', modifiedPrice: 15000, isComboItem: false, isActive: true, productId: 2 },
  { name: 'Trung (20cm) - Đế Bình thường', size: '20cm', type: 'Bình thường', modifiedPrice: 15000, isComboItem: false, isActive: true, productId: 2 },
  { name: 'Lớn (25cm) - Đế Mỏng', size: '25cm', type: 'Mỏng', modifiedPrice: 25000, isComboItem: false, isActive: true, productId: 2 },
  { name: 'Lớn (25cm) - Đế Bình thường', size: '25cm', type: 'Bình thường', modifiedPrice: 25000, isComboItem: false, isActive: true, productId: 2 },

  // --- Pizza Pepperoni (productId: 3) ---
  { name: 'Nhỏ (15cm) - Đế Mỏng', size: '15cm', type: 'Mỏng', modifiedPrice: 0, isComboItem: true, isActive: true, productId: 3 },
  { name: 'Nhỏ (15cm) - Đế Bình thường', size: '15cm', type: 'Bình thường', modifiedPrice: 0, isComboItem: true, isActive: true, productId: 3 },
  { name: 'Trung (20cm) - Đế Mỏng', size: '20cm', type: 'Mỏng', modifiedPrice: 15000, isComboItem: false, isActive: true, productId: 3 },
  { name: 'Trung (20cm) - Đế Bình thường', size: '20cm', type: 'Bình thường', modifiedPrice: 15000, isComboItem: false, isActive: true, productId: 3 },
  { name: 'Lớn (25cm) - Đế Mỏng', size: '25cm', type: 'Mỏng', modifiedPrice: 25000, isComboItem: false, isActive: true, productId: 3 },
  { name: 'Lớn (25cm) - Đế Bình thường', size: '25cm', type: 'Bình thường', modifiedPrice: 25000, isComboItem: false, isActive: true, productId: 3 },

  // --- Pizza 4 Loại Thịt (productId: 4) ---
  { name: 'Nhỏ (15cm) - Đế Mỏng', size: '15cm', type: 'Mỏng', modifiedPrice: 0, isComboItem: true, isActive: true, productId: 4 },
  { name: 'Nhỏ (15cm) - Đế Bình thường', size: '15cm', type: 'Bình thường', modifiedPrice: 0, isComboItem: true, isActive: true, productId: 4 },
  { name: 'Trung (20cm) - Đế Mỏng', size: '20cm', type: 'Mỏng', modifiedPrice: 15000, isComboItem: false, isActive: true, productId: 4 },
  { name: 'Trung (20cm) - Đế Bình thường', size: '20cm', type: 'Bình thường', modifiedPrice: 15000, isComboItem: false, isActive: true, productId: 4 },
  { name: 'Lớn (25cm) - Đế Mỏng', size: '25cm', type: 'Mỏng', modifiedPrice: 25000, isComboItem: false, isActive: true, productId: 4 },
  { name: 'Lớn (25cm) - Đế Bình thường', size: '25cm', type: 'Bình thường', modifiedPrice: 25000, isComboItem: false, isActive: true, productId: 4 },

  { name: 'Nhỏ (15cm) - Đế Mỏng', size: '15cm', type: 'Mỏng', modifiedPrice: 0, isComboItem: true, isActive: true, productId: 16 },
  { name: 'Nhỏ (15cm) - Đế Bình thường', size: '15cm', type: 'Bình thường', modifiedPrice: 0, isComboItem: true, isActive: true, productId: 16 },
  { name: 'Trung (20cm) - Đế Mỏng', size: '20cm', type: 'Mỏng', modifiedPrice: 15000, isComboItem: false, isActive: true, productId: 16 },
  { name: 'Trung (20cm) - Đế Bình thường', size: '20cm', type: 'Bình thường', modifiedPrice: 15000, isComboItem: false, isActive: true, productId: 16 },
  { name: 'Lớn (25cm) - Đế Mỏng', size: '25cm', type: 'Mỏng', modifiedPrice: 25000, isComboItem: false, isActive: true, productId: 16 },
  { name: 'Lớn (25cm) - Đế Bình thường', size: '25cm', type: 'Bình thường', modifiedPrice: 25000, isComboItem: false, isActive: true, productId: 16 },

  { name: 'Nhỏ (15cm) - Đế Mỏng', size: '15cm', type: 'Mỏng', modifiedPrice: 0, isComboItem: true, isActive: true, productId: 5 },
  { name: 'Nhỏ (15cm) - Đế Bình thường', size: '15cm', type: 'Bình thường', modifiedPrice: 0, isComboItem: true, isActive: true, productId: 5 },
  { name: 'Trung (20cm) - Đế Mỏng', size: '20cm', type: 'Mỏng', modifiedPrice: 15000, isComboItem: false, isActive: true, productId: 5 },
  { name: 'Trung (20cm) - Đế Bình thường', size: '20cm', type: 'Bình thường', modifiedPrice: 15000, isComboItem: false, isActive: true, productId: 5 },
  { name: 'Lớn (25cm) - Đế Mỏng', size: '25cm', type: 'Mỏng', modifiedPrice: 25000, isComboItem: false, isActive: true, productId: 5 },
  { name: 'Lớn (25cm) - Đế Bình thường', size: '25cm', type: 'Bình thường', modifiedPrice: 25000, isComboItem: false, isActive: true, productId: 5 },

  // productId: 6
  { name: 'Nhỏ (15cm) - Đế Mỏng', size: '15cm', type: 'Mỏng', modifiedPrice: 0, isComboItem: true, isActive: true, productId: 6 },
  { name: 'Nhỏ (15cm) - Đế Bình thường', size: '15cm', type: 'Bình thường', modifiedPrice: 0, isComboItem: true, isActive: true, productId: 6 },
  { name: 'Trung (20cm) - Đế Mỏng', size: '20cm', type: 'Mỏng', modifiedPrice: 15000, isComboItem: false, isActive: true, productId: 6 },
  { name: 'Trung (20cm) - Đế Bình thường', size: '20cm', type: 'Bình thường', modifiedPrice: 15000, isComboItem: false, isActive: true, productId: 6 },
  { name: 'Lớn (25cm) - Đế Mỏng', size: '25cm', type: 'Mỏng', modifiedPrice: 25000, isComboItem: false, isActive: true, productId: 6 },
  { name: 'Lớn (25cm) - Đế Bình thường', size: '25cm', type: 'Bình thường', modifiedPrice: 25000, isComboItem: false, isActive: true, productId: 6 },

  // productId: 7
  { name: 'Nhỏ (15cm) - Đế Mỏng', size: '15cm', type: 'Mỏng', modifiedPrice: 0, isComboItem: true, isActive: true, productId: 7 },
  { name: 'Nhỏ (15cm) - Đế Bình thường', size: '15cm', type: 'Bình thường', modifiedPrice: 0, isComboItem: true, isActive: true, productId: 7 },
  { name: 'Trung (20cm) - Đế Mỏng', size: '20cm', type: 'Mỏng', modifiedPrice: 15000, isComboItem: false, isActive: true, productId: 7 },
  { name: 'Trung (20cm) - Đế Bình thường', size: '20cm', type: 'Bình thường', modifiedPrice: 15000, isComboItem: false, isActive: true, productId: 7 },
  { name: 'Lớn (25cm) - Đế Mỏng', size: '25cm', type: 'Mỏng', modifiedPrice: 25000, isComboItem: false, isActive: true, productId: 7 },
  { name: 'Lớn (25cm) - Đế Bình thường', size: '25cm', type: 'Bình thường', modifiedPrice: 25000, isComboItem: false, isActive: true, productId: 7 },

  // productId: 8
  { name: 'Nhỏ (15cm) - Đế Mỏng', size: '15cm', type: 'Mỏng', modifiedPrice: 0, isComboItem: true, isActive: true, productId: 8 },
  { name: 'Nhỏ (15cm) - Đế Bình thường', size: '15cm', type: 'Bình thường', modifiedPrice: 0, isComboItem: true, isActive: true, productId: 8 },
  { name: 'Trung (20cm) - Đế Mỏng', size: '20cm', type: 'Mỏng', modifiedPrice: 15000, isComboItem: false, isActive: true, productId: 8 },
  { name: 'Trung (20cm) - Đế Bình thường', size: '20cm', type: 'Bình thường', modifiedPrice: 15000, isComboItem: false, isActive: true, productId: 8 },
  { name: 'Lớn (25cm) - Đế Mỏng', size: '25cm', type: 'Mỏng', modifiedPrice: 25000, isComboItem: false, isActive: true, productId: 8 },
  { name: 'Lớn (25cm) - Đế Bình thường', size: '25cm', type: 'Bình thường', modifiedPrice: 25000, isComboItem: false, isActive: true, productId: 8 },

  // productId: 9
  { name: 'Nhỏ (15cm) - Đế Mỏng', size: '15cm', type: 'Mỏng', modifiedPrice: 0, isComboItem: true, isActive: true, productId: 9 },
  { name: 'Nhỏ (15cm) - Đế Bình thường', size: '15cm', type: 'Bình thường', modifiedPrice: 0, isComboItem: true, isActive: true, productId: 9 },
  { name: 'Trung (20cm) - Đế Mỏng', size: '20cm', type: 'Mỏng', modifiedPrice: 15000, isComboItem: false, isActive: true, productId: 9 },
  { name: 'Trung (20cm) - Đế Bình thường', size: '20cm', type: 'Bình thường', modifiedPrice: 15000, isComboItem: false, isActive: true, productId: 9 },
  { name: 'Lớn (25cm) - Đế Mỏng', size: '25cm', type: 'Mỏng', modifiedPrice: 25000, isComboItem: false, isActive: true, productId: 9 },
  { name: 'Lớn (25cm) - Đế Bình thường', size: '25cm', type: 'Bình thường', modifiedPrice: 25000, isComboItem: false, isActive: true, productId: 9 },

  // productId: 10
  { name: 'Nhỏ (15cm) - Đế Mỏng', size: '15cm', type: 'Mỏng', modifiedPrice: 0, isComboItem: true, isActive: true, productId: 10 },
  { name: 'Nhỏ (15cm) - Đế Bình thường', size: '15cm', type: 'Bình thường', modifiedPrice: 0, isComboItem: true, isActive: true, productId: 10 },
  { name: 'Trung (20cm) - Đế Mỏng', size: '20cm', type: 'Mỏng', modifiedPrice: 15000, isComboItem: false, isActive: true, productId: 10 },
  { name: 'Trung (20cm) - Đế Bình thường', size: '20cm', type: 'Bình thường', modifiedPrice: 15000, isComboItem: false, isActive: true, productId: 10 },
  { name: 'Lớn (25cm) - Đế Mỏng', size: '25cm', type: 'Mỏng', modifiedPrice: 25000, isComboItem: false, isActive: true, productId: 10 },
  { name: 'Lớn (25cm) - Đế Bình thường', size: '25cm', type: 'Bình thường', modifiedPrice: 25000, isComboItem: false, isActive: true, productId: 10 },

  // productId: 11
  { name: 'Nhỏ (15cm) - Đế Mỏng', size: '15cm', type: 'Mỏng', modifiedPrice: 0, isComboItem: true, isActive: true, productId: 11 },
  { name: 'Nhỏ (15cm) - Đế Bình thường', size: '15cm', type: 'Bình thường', modifiedPrice: 0, isComboItem: true, isActive: true, productId: 11 },
  { name: 'Trung (20cm) - Đế Mỏng', size: '20cm', type: 'Mỏng', modifiedPrice: 15000, isComboItem: false, isActive: true, productId: 11 },
  { name: 'Trung (20cm) - Đế Bình thường', size: '20cm', type: 'Bình thường', modifiedPrice: 15000, isComboItem: false, isActive: true, productId: 11 },
  { name: 'Lớn (25cm) - Đế Mỏng', size: '25cm', type: 'Mỏng', modifiedPrice: 25000, isComboItem: false, isActive: true, productId: 11 },
  { name: 'Lớn (25cm) - Đế Bình thường', size: '25cm', type: 'Bình thường', modifiedPrice: 25000, isComboItem: false, isActive: true, productId: 11 },

  // productId: 12
  { name: 'Nhỏ (15cm) - Đế Mỏng', size: '15cm', type: 'Mỏng', modifiedPrice: 0, isComboItem: true, isActive: true, productId: 12 },
  { name: 'Nhỏ (15cm) - Đế Bình thường', size: '15cm', type: 'Bình thường', modifiedPrice: 0, isComboItem: true, isActive: true, productId: 12 },
  { name: 'Trung (20cm) - Đế Mỏng', size: '20cm', type: 'Mỏng', modifiedPrice: 15000, isComboItem: false, isActive: true, productId: 12 },
  { name: 'Trung (20cm) - Đế Bình thường', size: '20cm', type: 'Bình thường', modifiedPrice: 15000, isComboItem: false, isActive: true, productId: 12 },
  { name: 'Lớn (25cm) - Đế Mỏng', size: '25cm', type: 'Mỏng', modifiedPrice: 25000, isComboItem: false, isActive: true, productId: 12 },
  { name: 'Lớn (25cm) - Đế Bình thường', size: '25cm', type: 'Bình thường', modifiedPrice: 25000, isComboItem: false, isActive: true, productId: 12 },

  // productId: 13
  { name: 'Nhỏ (15cm) - Đế Mỏng', size: '15cm', type: 'Mỏng', modifiedPrice: 0, isComboItem: true, isActive: true, productId: 13 },
  { name: 'Nhỏ (15cm) - Đế Bình thường', size: '15cm', type: 'Bình thường', modifiedPrice: 0, isComboItem: true, isActive: true, productId: 13 },
  { name: 'Trung (20cm) - Đế Mỏng', size: '20cm', type: 'Mỏng', modifiedPrice: 15000, isComboItem: false, isActive: true, productId: 13 },
  { name: 'Trung (20cm) - Đế Bình thường', size: '20cm', type: 'Bình thường', modifiedPrice: 15000, isComboItem: false, isActive: true, productId: 13 },
  { name: 'Lớn (25cm) - Đế Mỏng', size: '25cm', type: 'Mỏng', modifiedPrice: 25000, isComboItem: false, isActive: true, productId: 13 },
  { name: 'Lớn (25cm) - Đế Bình thường', size: '25cm', type: 'Bình thường', modifiedPrice: 25000, isComboItem: false, isActive: true, productId: 13 },

  // productId: 14
  { name: 'Nhỏ (15cm) - Đế Mỏng', size: '15cm', type: 'Mỏng', modifiedPrice: 0, isComboItem: true, isActive: true, productId: 14 },
  { name: 'Nhỏ (15cm) - Đế Bình thường', size: '15cm', type: 'Bình thường', modifiedPrice: 0, isComboItem: true, isActive: true, productId: 14 },
  { name: 'Trung (20cm) - Đế Mỏng', size: '20cm', type: 'Mỏng', modifiedPrice: 15000, isComboItem: false, isActive: true, productId: 14 },
  { name: 'Trung (20cm) - Đế Bình thường', size: '20cm', type: 'Bình thường', modifiedPrice: 15000, isComboItem: false, isActive: true, productId: 14 },
  { name: 'Lớn (25cm) - Đế Mỏng', size: '25cm', type: 'Mỏng', modifiedPrice: 25000, isComboItem: false, isActive: true, productId: 14 },
  { name: 'Lớn (25cm) - Đế Bình thường', size: '25cm', type: 'Bình thường', modifiedPrice: 25000, isComboItem: false, isActive: true, productId: 14 },
  // ============================================================
  // GROUP 2: BURGER (Chỉ có type Bình thường)
  // Quy tắc giá: 15cm (+0), 20cm (+12k), 25cm (+20k)
  // ============================================================

  // --- Burger Bò (productId: 5) ---
  { name: 'Cỡ Nhỏ', size: '15cm', type: 'Bình thường', modifiedPrice: 0, isComboItem: true, isActive: true, productId: 5 },
  { name: 'Cỡ Vừa', size: '20cm', type: 'Bình thường', modifiedPrice: 12000, isComboItem: true, isActive: true, productId: 5 },
  { name: 'Cỡ Lớn', size: '25cm', type: 'Bình thường', modifiedPrice: 20000, isComboItem: false, isActive: true, productId: 5 },

  // --- Burger Gà (productId: 6) ---
  { name: 'Cỡ Nhỏ', size: '15cm', type: 'Bình thường', modifiedPrice: 0, isComboItem: true, isActive: true, productId: 6 },
  { name: 'Cỡ Vừa', size: '20cm', type: 'Bình thường', modifiedPrice: 12000, isComboItem: true, isActive: true, productId: 6 },
  { name: 'Cỡ Lớn', size: '25cm', type: 'Bình thường', modifiedPrice: 20000, isComboItem: false, isActive: true, productId: 6 },

  // --- Burger Phô Mai (productId: 7) ---
  { name: 'Cỡ Nhỏ', size: '15cm', type: 'Bình thường', modifiedPrice: 0, isComboItem: true, isActive: true, productId: 7 },
  { name: 'Cỡ Vừa', size: '20cm', type: 'Bình thường', modifiedPrice: 12000, isComboItem: true, isActive: true, productId: 7 },
  { name: 'Cỡ Lớn', size: '25cm', type: 'Bình thường', modifiedPrice: 20000, isComboItem: false, isActive: true, productId: 7 },

  // ============================================================
  // GROUP 3: MỲ Ý (Chỉ có type Bình thường)
  // Quy tắc giá: 15cm (+0), 20cm (+10k), 25cm (+18k)
  // ============================================================

  // --- Mỳ Ý Bò Bằm (productId: 8) ---
  { name: 'Cỡ Nhỏ', size: '15cm', type: 'Bình thường', modifiedPrice: 0, isComboItem: true, isActive: true, productId: 8 },
  { name: 'Cỡ Vừa', size: '20cm', type: 'Bình thường', modifiedPrice: 10000, isComboItem: false, isActive: true, productId: 8 },
  { name: 'Cỡ Lớn', size: '25cm', type: 'Bình thường', modifiedPrice: 18000, isComboItem: false, isActive: true, productId: 8 },

  // --- Mỳ Ý Sốt Kem (productId: 9) ---
  { name: 'Cỡ Nhỏ', size: '15cm', type: 'Bình thường', modifiedPrice: 0, isComboItem: true, isActive: true, productId: 9 },
  { name: 'Cỡ Vừa', size: '20cm', type: 'Bình thường', modifiedPrice: 10000, isComboItem: false, isActive: true, productId: 9 },
  { name: 'Cỡ Lớn', size: '25cm', type: 'Bình thường', modifiedPrice: 18000, isComboItem: false, isActive: true, productId: 9 },

  // --- Mỳ Ý Hải Sản (productId: 10) ---
  { name: 'Cỡ Nhỏ', size: '15cm', type: 'Bình thường', modifiedPrice: 0, isComboItem: true, isActive: true, productId: 10 },
  { name: 'Cỡ Vừa', size: '20cm', type: 'Bình thường', modifiedPrice: 10000, isComboItem: false, isActive: true, productId: 10 },
  { name: 'Cỡ Lớn', size: '25cm', type: 'Bình thường', modifiedPrice: 18000, isComboItem: false, isActive: true, productId: 10 },

  // ============================================================
  // GROUP 4: ĐỒ UỐNG (Chỉ có type Bình thường)
  // Quy tắc giá: 15cm (+0), 20cm (+8k), 25cm (+15k)
  // ============================================================

  // --- Pepsi (productId: 11) ---
  { name: 'Cỡ Nhỏ', size: '15cm', type: 'Bình thường', modifiedPrice: 0, isComboItem: true, isActive: true, productId: 11 },
  { name: 'Cỡ Vừa', size: '20cm', type: 'Bình thường', modifiedPrice: 8000, isComboItem: false, isActive: true, productId: 11 },
  { name: 'Cỡ Lớn', size: '25cm', type: 'Bình thường', modifiedPrice: 15000, isComboItem: false, isActive: true, productId: 11 },

  // --- Nước Cam Ép (productId: 12) ---
  { name: 'Cỡ Nhỏ', size: '15cm', type: 'Bình thường', modifiedPrice: 0, isComboItem: true, isActive: true, productId: 12 },
  { name: 'Cỡ Vừa', size: '20cm', type: 'Bình thường', modifiedPrice: 8000, isComboItem: false, isActive: true, productId: 12 },
  { name: 'Cỡ Lớn', size: '25cm', type: 'Bình thường', modifiedPrice: 15000, isComboItem: false, isActive: true, productId: 12 },

  // ============================================================
  // GROUP 5: MÓN PHỤ (Chỉ có type Bình thường)
  // Quy tắc giá: 15cm (+0), 20cm (+7k), 25cm (+12k)
  // ============================================================

  // --- Khoai Tây Chiên (productId: 13) ---
  { name: 'Cỡ Nhỏ', size: '15cm', type: 'Bình thường', modifiedPrice: 0, isComboItem: true, isActive: true, productId: 13 },
  { name: 'Cỡ Vừa', size: '20cm', type: 'Bình thường', modifiedPrice: 7000, isComboItem: false, isActive: true, productId: 13 },
  { name: 'Cỡ Lớn', size: '25cm', type: 'Bình thường', modifiedPrice: 12000, isComboItem: false, isActive: true, productId: 13 },

  // --- Gà Viên Chiên (productId: 14) ---
  { name: 'Cỡ Nhỏ', size: '15cm', type: 'Bình thường', modifiedPrice: 0, isComboItem: true, isActive: true, productId: 14 },
  { name: 'Cỡ Vừa', size: '20cm', type: 'Bình thường', modifiedPrice: 7000, isComboItem: false, isActive: true, productId: 14 },
  { name: 'Cỡ Lớn', size: '25cm', type: 'Bình thường', modifiedPrice: 12000, isComboItem: false, isActive: true, productId: 14 },

  // --- Cà Phê Đen (productId: 15) ---
  { name: 'Cỡ Nhỏ', size: '15cm', type: 'Bình thường', modifiedPrice: 0, isComboItem: true, isActive: true, productId: 15 },
  { name: 'Cỡ Vừa', size: '20cm', type: 'Bình thường', modifiedPrice: 7000, isComboItem: false, isActive: true, productId: 15 },
  { name: 'Cỡ Lớn', size: '25cm', type: 'Bình thường', modifiedPrice: 12000, isComboItem: false, isActive: true, productId: 15 },
];

export const productIngredients = [
  // Pizza Phô Mai (productId: 1) - 3 ingredients gốc + 5 mới
  { productId: 1, ingredientId: 1, isDefault: true, quantity: 2 },
  { productId: 1, ingredientId: 10, isDefault: false, quantity: 1 },
  { productId: 1, ingredientId: 15, isDefault: false, quantity: 1 },
  // Thêm mới cho productId 1
  { productId: 1, ingredientId: 24, isDefault: false, quantity: 1 },
  { productId: 1, ingredientId: 5, isDefault: false, quantity: 3 },
  { productId: 1, ingredientId: 2, isDefault: false, quantity: 3 },
  { productId: 1, ingredientId: 17, isDefault: true, quantity: 3 },
  { productId: 1, ingredientId: 11, isDefault: false, quantity: 1 },
  // Pizza Hải Sản (productId: 2) - 3 ingredients gốc + 5 mới
  { productId: 2, ingredientId: 1, isDefault: false, quantity: 1 },
  { productId: 2, ingredientId: 3, isDefault: false, quantity: 1 },
  { productId: 2, ingredientId: 14, isDefault: false, quantity: 1 },
  // Thêm mới cho productId 2
  { productId: 2, ingredientId: 2, isDefault: false, quantity: 3 },
  { productId: 2, ingredientId: 5, isDefault: false, quantity: 3 },
  { productId: 2, ingredientId: 9, isDefault: true, quantity: 1 },
  { productId: 2, ingredientId: 10, isDefault: true, quantity: 3 },
  { productId: 2, ingredientId: 20, isDefault: false, quantity: 1 },
  // Pizza Pepperoni (productId: 3) - 3 ingredients gốc + 5 mới
  { productId: 3, ingredientId: 1, isDefault: false, quantity: 1 },
  { productId: 3, ingredientId: 2, isDefault: false, quantity: 2 },
  { productId: 3, ingredientId: 9, isDefault: true, quantity: 1 },
  // Thêm mới cho productId 3
  { productId: 3, ingredientId: 11, isDefault: false, quantity: 2 },
  { productId: 3, ingredientId: 14, isDefault: true, quantity: 1 },
  { productId: 3, ingredientId: 8, isDefault: false, quantity: 1 },
  { productId: 3, ingredientId: 3, isDefault: false, quantity: 2 },
  { productId: 3, ingredientId: 17, isDefault: false, quantity: 2 },
  // Pizza 4 Loại Thịt (productId: 4) - 3 ingredients gốc + 5 mới
  { productId: 4, ingredientId: 2, isDefault: false, quantity: 1 },
  { productId: 4, ingredientId: 4, isDefault: false, quantity: 1 },
  { productId: 4, ingredientId: 5, isDefault: false, quantity: 1 },
  // Thêm mới cho productId 4
  { productId: 4, ingredientId: 15, isDefault: false, quantity: 3 },
  { productId: 4, ingredientId: 23, isDefault: false, quantity: 2 },
  { productId: 4, ingredientId: 12, isDefault: true, quantity: 3 },
  { productId: 4, ingredientId: 14, isDefault: false, quantity: 3 },
  { productId: 4, ingredientId: 3, isDefault: true, quantity: 3 },
  // Burger Bò (productId: 5) - 3 ingredients gốc + 5 mới
  { productId: 5, ingredientId: 4, isDefault: false, quantity: 1 },
  { productId: 5, ingredientId: 13, isDefault: true, quantity: 1 },
  { productId: 5, ingredientId: 17, isDefault: false, quantity: 1 },
  // Thêm mới cho productId 5
  { productId: 5, ingredientId: 8, isDefault: false, quantity: 2 },
  { productId: 5, ingredientId: 18, isDefault: false, quantity: 1 },
  { productId: 5, ingredientId: 3, isDefault: false, quantity: 2 },
  { productId: 5, ingredientId: 2, isDefault: false, quantity: 2 },
  { productId: 5, ingredientId: 5, isDefault: true, quantity: 1 },
  // Burger Gà (productId: 6) - 3 ingredients gốc + 5 mới
  { productId: 6, ingredientId: 16, isDefault: false, quantity: 1 },
  { productId: 6, ingredientId: 17, isDefault: false, quantity: 1 },
  { productId: 6, ingredientId: 12, isDefault: false, quantity: 1 },
  // Thêm mới cho productId 6
  { productId: 6, ingredientId: 13, isDefault: true, quantity: 3 },
  { productId: 6, ingredientId: 7, isDefault: true, quantity: 3 },
  { productId: 6, ingredientId: 14, isDefault: false, quantity: 1 },
  { productId: 6, ingredientId: 9, isDefault: false, quantity: 2 },
  { productId: 6, ingredientId: 21, isDefault: false, quantity: 3 },
  // Burger Phô Mai (productId: 7) - 3 ingredients gốc + 5 mới
  { productId: 7, ingredientId: 11, isDefault: false, quantity: 2 },
  { productId: 7, ingredientId: 10, isDefault: true, quantity: 1 },
  { productId: 7, ingredientId: 9, isDefault: false, quantity: 1 },
  // Thêm mới cho productId 7
  { productId: 7, ingredientId: 1, isDefault: false, quantity: 1 },
  { productId: 7, ingredientId: 21, isDefault: false, quantity: 2 },
  { productId: 7, ingredientId: 8, isDefault: false, quantity: 2 },
  { productId: 7, ingredientId: 7, isDefault: true, quantity: 1 },
  { productId: 7, ingredientId: 14, isDefault: false, quantity: 1 },
  // Mỳ Ý Bò Bằm (productId: 8) - 3 ingredients gốc + 5 mới
  { productId: 8, ingredientId: 2, isDefault: true, quantity: 1 },
  { productId: 8, ingredientId: 5, isDefault: false, quantity: 1 },
  { productId: 8, ingredientId: 7, isDefault: false, quantity: 1 },
  // Thêm mới cho productId 8
  { productId: 8, ingredientId: 24, isDefault: false, quantity: 1 },
  { productId: 8, ingredientId: 19, isDefault: false, quantity: 3 },
  { productId: 8, ingredientId: 16, isDefault: false, quantity: 3 },
  { productId: 8, ingredientId: 18, isDefault: true, quantity: 3 },
  { productId: 8, ingredientId: 8, isDefault: false, quantity: 2 },
  // Mỳ Ý Sốt Kem (productId: 9) - 3 ingredients gốc + 5 mới
  { productId: 9, ingredientId: 15, isDefault: true, quantity: 1 },
  { productId: 9, ingredientId: 12, isDefault: false, quantity: 1 },
  { productId: 9, ingredientId: 9, isDefault: true, quantity: 1 },
  // Thêm mới cho productId 9
  { productId: 9, ingredientId: 8, isDefault: false, quantity: 1 },
  { productId: 9, ingredientId: 5, isDefault: false, quantity: 3 },
  { productId: 9, ingredientId: 20, isDefault: false, quantity: 3 },
  { productId: 9, ingredientId: 19, isDefault: false, quantity: 3 },
  { productId: 9, ingredientId: 3, isDefault: false, quantity: 2 },
  // Mỳ Ý Hải Sản (productId: 10) - 3 ingredients gốc + 5 mới
  { productId: 10, ingredientId: 4, isDefault: false, quantity: 1 },
  { productId: 10, ingredientId: 6, isDefault: false, quantity: 1 },
  { productId: 10, ingredientId: 11, isDefault: true, quantity: 1 },
  // Thêm mới cho productId 10
  { productId: 10, ingredientId: 16, isDefault: false, quantity: 3 },
  { productId: 10, ingredientId: 23, isDefault: false, quantity: 3 },
  { productId: 10, ingredientId: 18, isDefault: false, quantity: 3 },
  { productId: 10, ingredientId: 20, isDefault: true, quantity: 1 },
  { productId: 10, ingredientId: 12, isDefault: false, quantity: 2 },
  // Pepsi (productId: 11) - 3 ingredients gốc + 5 mới
  { productId: 11, ingredientId: 5, isDefault: true, quantity: 1 },
  { productId: 11, ingredientId: 8, isDefault: false, quantity: 1 },
  { productId: 11, ingredientId: 12, isDefault: false, quantity: 1 },
  // Thêm mới cho productId 11
  { productId: 11, ingredientId: 7, isDefault: false, quantity: 3 },
  { productId: 11, ingredientId: 18, isDefault: false, quantity: 3 },
  { productId: 11, ingredientId: 1, isDefault: false, quantity: 3 },
  { productId: 11, ingredientId: 4, isDefault: true, quantity: 1 },
  { productId: 11, ingredientId: 11, isDefault: false, quantity: 1 },
  // Nước Cam Ép (productId: 12) - 3 ingredients gốc + 5 mới
  { productId: 12, ingredientId: 4, isDefault: false, quantity: 1 },
  { productId: 12, ingredientId: 7, isDefault: false, quantity: 1 },
  { productId: 12, ingredientId: 9, isDefault: false, quantity: 1 },
  // Thêm mới cho productId 12
  { productId: 12, ingredientId: 21, isDefault: true, quantity: 2 },
  { productId: 12, ingredientId: 6, isDefault: false, quantity: 1 },
  { productId: 12, ingredientId: 20, isDefault: true, quantity: 2 },
  { productId: 12, ingredientId: 1, isDefault: false, quantity: 1 },
  { productId: 12, ingredientId: 23, isDefault: false, quantity: 3 },
  // Khoai Tây Chiên (productId: 13) - 3 ingredients gốc + 5 mới
  { productId: 13, ingredientId: 13, isDefault: false, quantity: 1 },
  { productId: 13, ingredientId: 12, isDefault: false, quantity: 1 },
  { productId: 13, ingredientId: 11, isDefault: false, quantity: 1 },
  // Thêm mới cho productId 13
  { productId: 13, ingredientId: 3, isDefault: false, quantity: 1 },
  { productId: 13, ingredientId: 14, isDefault: true, quantity: 3 },
  { productId: 13, ingredientId: 19, isDefault: false, quantity: 2 },
  { productId: 13, ingredientId: 8, isDefault: true, quantity: 1 },
  { productId: 13, ingredientId: 16, isDefault: false, quantity: 3 },
  // Gà Viên Chiên (productId: 14) - 3 ingredients gốc + 5 mới
  { productId: 14, ingredientId: 13, isDefault: false, quantity: 1 },
  { productId: 14, ingredientId: 15, isDefault: false, quantity: 1 },
  { productId: 14, ingredientId: 16, isDefault: true, quantity: 1 },
  // Thêm mới cho productId 14
  { productId: 14, ingredientId: 10, isDefault: false, quantity: 3 },
  { productId: 14, ingredientId: 14, isDefault: false, quantity: 1 },
  { productId: 14, ingredientId: 3, isDefault: false, quantity: 1 },
  { productId: 14, ingredientId: 24, isDefault: false, quantity: 2 },
  { productId: 14, ingredientId: 12, isDefault: true, quantity: 3 },
  // Cà Phê Đen (productId: 15) - 3 ingredients gốc + 5 mới
  { productId: 15, ingredientId: 11, isDefault: false, quantity: 1 },
  { productId: 15, ingredientId: 3, isDefault: false, quantity: 1 },
  { productId: 15, ingredientId: 8, isDefault: true, quantity: 1 },
  // Thêm mới cho productId 15
  { productId: 15, ingredientId: 21, isDefault: false, quantity: 1 },
  { productId: 15, ingredientId: 10, isDefault: true, quantity: 1 },
  { productId: 15, ingredientId: 22, isDefault: false, quantity: 1 },
  { productId: 15, ingredientId: 1, isDefault: false, quantity: 2 },
  { productId: 15, ingredientId: 4, isDefault: false, quantity: 1 },
];


export const combos = [
  {
    name: 'Combo Tiệc Gia Đình',
    slug: 'combo-tiec-gia-dinh',
    description: '2 Pizza lớn + 4 Pepsi + Khoai tây chiên - Hoàn hảo cho 4-6 người',
    price: 450000,
    imageUrl: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRL2JXlI_jC3yO5E35xC4x28ahdE7nyWTHBuA&s',
    isActive: true,
    isFeatured: true,
    categoryId: 5,
  },
  {
    name: 'Combo Sinh Viên',
    slug: 'combo-sinh-vien',
    description: '1 Pizza trung + 1 Pepsi - Tiết kiệm cho bạn trẻ',
    price: 139000,
    imageUrl: 'https://www.zpizza.vn/img/images/zalo-04.jpg',
    isActive: true,
    isFeatured: true,
    categoryId: 5,
  },
  {
    name: 'Combo Pizza Đôi',
    slug: 'combo-pizza-doi',
    description: '2 Pizza size M + 2 Nước ngọt - Cho 2-3 người',
    price: 299000,
    imageUrl: 'hhttps://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRUb_MIVIsstMTmba5thxwDUhVL1t9Dkeqf1g&s',
    isActive: true,
    isFeatured: true,
    categoryId: 5,
  },
  {
    name: 'Combo Burger Gia Đình',
    slug: 'combo-burger-gia-dinh',
    description: '4 Burger + 4 Pepsi + 2 Khoai tây chiên',
    price: 380000,
    imageUrl: 'https://png.pngtree.com/png-vector/20250817/ourmid/pngtree-classic-pizza-burger-hot-dog-set-png-image_17020679.webp',
    isActive: true,
    isFeatured: false,
    categoryId: 5,
  },
  {
    name: 'Combo Trưa Văn Phòng',
    slug: 'combo-trua-van-phong',
    description: '1 Mỳ Ý + 1 Nước cam + 1 Cà phê',
    price: 149000,
    imageUrl: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcToNCoK1KeOEFZ5CyQ7mM_05p9xAAe5JMQqWg&s',
    isActive: true,
    isFeatured: true,
    categoryId: 5,
  },
  {
    name: 'Combo Hẹn Hò',
    slug: 'combo-hen-ho',
    description: '1 Pizza lớn + 2 Nước cam + 1 Gà viên chiên',
    price: 259000,
    imageUrl: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQMbJ64UwuVuqPMItOSBiKUZR3P2W0ImBUvrg&s',
    isActive: true,
    isFeatured: true,
    categoryId: 5,
  },
  {
    name: 'Combo Xem Phim',
    slug: 'combo-xem-phim',
    description: '2 Burger + 2 Pepsi lớn + 1 Khoai tây chiên lớn',
    price: 229000,
    imageUrl: 'https://png.pngtree.com/png-clipart/20240624/original/pngtree-pizza-and-fast-food-snacks-express-delivery-png-image_15403607.png',
    isActive: true,
    isFeatured: false,
    categoryId: 5,
  },
  {
    name: 'Combo Tiệc Nhỏ',
    slug: 'combo-tiec-nho',
    description: '3 Pizza trung + 6 Pepsi + 2 Gà viên chiên',
    price: 550000,
    imageUrl: 'https://png.pngtree.com/png-clipart/20240308/original/pngtree-individual-small-pizza-png-image_14540680.png',
    isActive: true,
    isFeatured: false,
    categoryId: 5,
  },
  {
    name: 'Combo Sáng Nhanh',
    slug: 'combo-sang-nhanh',
    description: '1 Burger + 1 Cà phê đen',
    price: 99000,
    imageUrl: 'https://png.pngtree.com/png-vector/20240807/ourmid/pngtree-pizza-burgers-and-fast-food-meals-png-image_13163209.png',
    isActive: true,
    isFeatured: false,
    categoryId: 5,
  },
  {
    name: 'Combo Mỳ Ý Đặc Biệt',
    slug: 'combo-my-y-dac-biet',
    description: '2 Mỳ Ý + 2 Nước cam + 1 Khoai tây chiên',
    price: 269000,
    imageUrl: 'https://media.dodostatic.com/image/r:233x233/11eec6d827adfd26a9e97561a6da72c7.avif',
    isActive: true,
    isFeatured: true,
    categoryId: 5,
  },
  {
    name: 'Combo Siêu Tiết Kiệm',
    slug: 'combo-sieu-tiet-kiem',
    description: '1 Pizza nhỏ + 1 Pepsi nhỏ',
    price: 109000,
    imageUrl: 'https://media.dodostatic.com/image/r:233x233/11eec6d827adfd26a9e97561a6da72c7.avif',
    isActive: true,
    isFeatured: false,
    categoryId: 5,
  },
  {
    name: 'Combo Cuối Tuần',
    slug: 'combo-cuoi-tuan',
    description: '2 Pizza lớn + 1 Mỳ Ý + 4 Pepsi + 2 Gà viên',
    price: 599000,
    imageUrl: 'https://media.dodostatic.com/image/r:233x233/11eec6d827adfd26a9e97561a6da72c7.avif',
    isActive: true,
    isFeatured: true,
    categoryId: 5,
  },
  {
    name: 'Combo Trưa Nhanh',
    slug: 'combo-trua-nhanh',
    description: '1 Burger lớn + 1 Khoai tây + 1 Pepsi',
    price: 129000,
    imageUrl: 'https://media.dodostatic.com/image/r:233x233/11eec6d827adfd26a9e97561a6da72c7.avif',
    isActive: true,
    isFeatured: false,
    categoryId: 5,
  },
  {
    name: 'Combo Pizza Hải Sản',
    slug: 'combo-pizza-hai-san',
    description: '1 Pizza Hải Sản lớn + 2 Nước cam + 1 Khoai tây',
    price: 289000,
    imageUrl: 'https://media.dodostatic.com/image/r:233x233/11eec6d827adfd26a9e97561a6da72c7.avif',
    isActive: true,
    isFeatured: true,
    categoryId: 5,
  },
  {
    name: 'Combo Đêm Khuya',
    slug: 'combo-dem-khuya',
    description: '2 Burger + 2 Gà viên + 2 Pepsi lớn',
    price: 319000,
    imageUrl: 'https://media.dodostatic.com/image/r:233x233/11eec6d827adfd26a9e97561a6da72c7.avif',
    isActive: true,
    isFeatured: false,
    categoryId: 5,
  },
]


export const comboItems = [
  // Combo 1: Combo Tiệc Gia Đình
  { comboId: 1, productId: 1, productVariantId: 3, quantity: 2 },   // Pizza Phô Mai - Lớn
  { comboId: 1, productId: 11, productVariantId: 32, quantity: 4 }, // Pepsi - Vừa
  { comboId: 1, productId: 13, productVariantId: 38, quantity: 1 }, // Khoai tây chiên - Thường

  // Combo 2: Combo Sinh Viên
  { comboId: 2, productId: 1, productVariantId: 2, quantity: 1 },   // Pizza Phô Mai - Trung
  { comboId: 2, productId: 11, productVariantId: 31, quantity: 1 }, // Pepsi - Nhỏ

  // Combo 3: Combo Pizza Đôi
  { comboId: 3, productId: 3, productVariantId: 8, quantity: 2 },   // Pizza Pepperoni - Trung
  { comboId: 3, productId: 12, productVariantId: 34, quantity: 2 }, // Nước cam - Nhỏ

  // Combo 4: Combo Burger Gia Đình
  { comboId: 4, productId: 5, productVariantId: 13, quantity: 4 },  // Burger Bò - Thường
  { comboId: 4, productId: 11, productVariantId: 32, quantity: 4 }, // Pepsi - Vừa

  // Combo 5: Combo Trưa Văn Phòng
  { comboId: 5, productId: 8, productVariantId: 22, quantity: 1 },  // Mỳ Ý Bò Bằm - Nhỏ
  { comboId: 5, productId: 12, productVariantId: 35, quantity: 1 }, // Nước cam - Vừa
  { comboId: 5, productId: 15, productVariantId: 44, quantity: 1 }, // Cà phê đen - Thường

  // Combo 6: Combo Hẹn Hò
  { comboId: 6, productId: 2, productVariantId: 6, quantity: 1 },   // Pizza Hải Sản - Lớn
  { comboId: 6, productId: 12, productVariantId: 35, quantity: 2 }, // Nước cam - Vừa
  { comboId: 6, productId: 14, productVariantId: 41, quantity: 1 }, // Gà viên chiên - Thường
];




// Example ProductIngredients (assuming some default ingredients for products)


// Example Users
export const users = [
  {
    email: 'admin@example.com',
    password: 'Admin@123',  // Sẽ được hash tự động bởi @BeforeValidate hook
    name: 'Nguyễn Văn Admin',
    avatar: 'https://i.pravatar.cc/150?img=1',
    phone: '0901234567',
    role: 'SUPER_ADMIN',
    isActive: true,
    googleId: null,
    authProvider: 'local',
    refreshToken: null,
    passwordResetToken: null,
    passwordResetExpires: null,
    passwordChangeAt: null,
    isEmailVerified: true,
  },
  {
    email: 'user1@example.com',
    password: 'User@123',
    name: 'Trần Thị Hương',
    avatar: 'https://i.pravatar.cc/150?img=5',
    phone: '0912345678',
    role: 'USER',
    isActive: true,
    googleId: null,
    authProvider: 'local',
    refreshToken: null,
    passwordResetToken: null,
    passwordResetExpires: null,
    passwordChangeAt: null,
    isEmailVerified: true,
  },
  {
    email: 'user2@example.com',
    password: 'User@123',
    name: 'Lê Văn Minh',
    avatar: 'https://i.pravatar.cc/150?img=12',
    phone: '0923456789',
    role: 'USER',
    isActive: true,
    googleId: null,
    authProvider: 'local',
    refreshToken: null,
    passwordResetToken: null,
    passwordResetExpires: null,
    passwordChangeAt: null,
    isEmailVerified: true,
  },
  {
    email: 'google.user@gmail.com',
    password: null,  // Google user không có password
    name: 'Phạm Thị Lan',
    avatar: 'https://lh3.googleusercontent.com/a/default-user',
    phone: '0934567890',
    role: 'USER',
    isActive: true,
    googleId: 'google_123456789',
    authProvider: 'google',
    refreshToken: null,
    passwordResetToken: null,
    passwordResetExpires: null,
    passwordChangeAt: null,
    isEmailVerified: true,
  },
  {
    email: 'user3@example.com',
    password: 'User@123',
    name: 'Hoàng Văn Nam',
    avatar: 'https://i.pravatar.cc/150?img=33',
    phone: '0945678901',
    role: 'USER',
    isActive: true,
    googleId: null,
    authProvider: 'local',
    refreshToken: null,
    passwordResetToken: null,
    passwordResetExpires: null,
    passwordChangeAt: null,
    isEmailVerified: false,  // User chưa verify email
  },
];


// Example Addresses
export const addresses = [
  // User 1 (Admin) - 2 addresses
  {
    recipientName: 'Nguyễn Văn Admin',
    recipientPhone: '0901234567',
    street: '123 Trần Duy Hưng',
    city: 'Hà Nội',
    district: 'Cầu Giấy',
    ward: 'Dịch Vọng',
    longitude: 105.8042,
    latitude: 21.0285,
    isDefault: true,
    sessionId: null,
    userId: 1,
  },
  {
    recipientName: 'Nguyễn Văn Admin',
    recipientPhone: '0901234567',
    street: '456 Nguyễn Trãi',
    city: 'Hà Nội',
    district: 'Thanh Xuân',
    ward: 'Khương Trung',
    longitude: 105.8142,
    latitude: 21.0185,
    isDefault: false,
    sessionId: null,
    userId: 1,
  },

  // User 2 (Trần Thị Hương) - 2 addresses
  {
    recipientName: 'Trần Thị Hương',
    recipientPhone: '0912345678',
    street: '789 Lê Văn Việt',
    city: 'Hồ Chí Minh',
    district: 'Quận 9',
    ward: 'Tăng Nhơn Phú A',
    longitude: 106.7797,
    latitude: 10.8501,
    isDefault: true,
    sessionId: null,
    userId: 2,
  },
  {
    recipientName: 'Trần Thị Hương',
    recipientPhone: '0912345678',
    street: '321 Võ Văn Ngân',
    city: 'Hồ Chí Minh',
    district: 'Thủ Đức',
    ward: 'Linh Chiểu',
    longitude: 106.7597,
    latitude: 10.8601,
    isDefault: false,
    sessionId: null,
    userId: 2,
  },

  // User 3 (Lê Văn Minh) - 2 addresses
  {
    recipientName: 'Lê Văn Minh',
    recipientPhone: '0923456789',
    street: '147 Ngô Quyền',
    city: 'Đà Nẵng',
    district: 'Sơn Trà',
    ward: 'Thọ Quang',
    longitude: 108.2422,
    latitude: 16.0644,
    isDefault: true,
    sessionId: null,
    userId: 3,
  },
  {
    recipientName: 'Lê Văn Minh',
    recipientPhone: '0923456789',
    street: '258 Hùng Vương',
    city: 'Đà Nẵng',
    district: 'Hải Châu',
    ward: 'Hải Châu 1',
    longitude: 108.2122,
    latitude: 16.0444,
    isDefault: false,
    sessionId: null,
    userId: 3,
  },

  // User 4 (Phạm Thị Lan - Google) - 2 addresses
  {
    recipientName: 'Phạm Thị Lan',
    recipientPhone: '0934567890',
    street: '369 Nguyễn Văn Linh',
    city: 'Cần Thơ',
    district: 'Ninh Kiều',
    ward: 'Cái Khế',
    longitude: 105.7669,
    latitude: 10.0352,
    isDefault: true,
    sessionId: null,
    userId: 4,
  },
  {
    recipientName: 'Phạm Thị Lan',
    recipientPhone: '0934567890',
    street: '741 Trần Hưng Đạo',
    city: 'Cần Thơ',
    district: 'Ninh Kiều',
    ward: 'An Nghiệp',
    longitude: 105.7569,
    latitude: 10.0252,
    isDefault: false,
    sessionId: null,
    userId: 4,
  },

  // User 5 (Hoàng Văn Nam) - 2 addresses
  {
    recipientName: 'Hoàng Văn Nam',
    recipientPhone: '0945678901',
    street: '852 Lạch Tray',
    city: 'Hải Phòng',
    district: 'Ngô Quyền',
    ward: 'Lạch Tray',
    longitude: 106.6981,
    latitude: 20.8549,
    isDefault: true,
    sessionId: null,
    userId: 5,
  },
  {
    recipientName: 'Hoàng Văn Nam',
    recipientPhone: '0945678901',
    street: '963 Tô Hiệu',
    city: 'Hải Phòng',
    district: 'Lê Chân',
    ward: 'Vĩnh Niệm',
    longitude: 106.6881,
    latitude: 20.8649,
    isDefault: false,
    sessionId: null,
    userId: 5,
  },
  {
    recipientName: 'Khach Vang Lai 1',
    recipientPhone: '0987000001',
    street: '12 Le Loi',
    city: 'Da Nang',
    district: 'Hai Chau',
    ward: 'Thach Thang',
    longitude: 108.2197,
    latitude: 16.0757,
    isDefault: false,
    sessionId: 'guest-order-1',
    userId: null,
  },
  {
    recipientName: 'Khach Vang Lai 2',
    recipientPhone: '0987000002',
    street: '45 Tran Phu',
    city: 'Ha Noi',
    district: 'Ba Dinh',
    ward: 'Quan Thanh',
    longitude: 105.8461,
    latitude: 21.0402,
    isDefault: false,
    sessionId: 'guest-order-2',
    userId: null,
  },
];


// Example Orders
export const orders = [
  {
    orderNumber: 'ORD202511240001',
    orderStatus: 'Đã giao hàng',
    paymentMethod: 'Thanh toán khi nhận hàng',
    paymentStatus: 'Đã thanh toán',
    subTotal: 290000,
    deliveryFee: 25000,
    discount: 0,
    finalTotal: 315000,
    notes: 'Giao hàng trước 6h chiều',
    momoTransId: null,
    momoRequestId: null,
    paidAt: '2025-11-20T14:30:00.000Z',
    cancelledReason: null,
    cancelledAt: null,
    userId: 1,
    addressId: 1,
  },
  {
    orderNumber: 'ORD202511240002',
    orderStatus: 'Đang chuẩn bị',
    paymentMethod: 'Chuyển khoản ngân hàng (SePay)',
    paymentStatus: 'Đã thanh toán',
    subTotal: 450000,
    deliveryFee: 0,
    discount: 50000,
    finalTotal: 400000,
    notes: null,
    momoTransId: 'MOMO456789',
    momoRequestId: 'REQ456789',
    paidAt: '2025-11-24T08:15:00.000Z',
    cancelledReason: null,
    cancelledAt: null,
    userId: 2,
    addressId: 3,
  },
  {
    orderNumber: 'ORD202511240003',
    orderStatus: 'Đã giao hàng',
    paymentMethod: 'Thanh toán khi nhận hàng',
    paymentStatus: 'Đã thanh toán',
    subTotal: 340000,
    deliveryFee: 25000,
    discount: 20000,
    finalTotal: 345000,
    notes: 'Gọi trước khi giao',
    momoTransId: null,
    momoRequestId: null,
    paidAt: '2025-11-22T16:45:00.000Z',
    cancelledReason: null,
    cancelledAt: null,
    userId: 3,
    addressId: 5,
  },
  {
    orderNumber: 'ORD202511240004',
    orderStatus: 'Đã giao hàng',
    paymentMethod: 'Chuyển khoản ngân hàng (SePay)',
    paymentStatus: 'Đã thanh toán',
    subTotal: 115000,
    deliveryFee: 25000,
    discount: 0,
    finalTotal: 140000,
    notes: null,
    momoTransId: 'MOMO234567',
    momoRequestId: 'REQ234567',
    paidAt: '2025-11-24T10:00:00.000Z',
    cancelledReason: null,
    cancelledAt: null,
    userId: 1,
    addressId: 2,
  },
  {
    orderNumber: 'ORD202511240005',
    orderStatus: 'Đang chờ',
    paymentMethod: 'Thanh toán khi nhận hàng',
    paymentStatus: 'Chờ thanh toán',
    subTotal: 278000,
    deliveryFee: 25000,
    discount: 0,
    finalTotal: 303000,
    notes: null,
    momoTransId: null,
    momoRequestId: null,
    paidAt: null,
    cancelledReason: null,
    cancelledAt: null,
    userId: null,
    addressId: 11,
  },
  {
    orderNumber: 'ORD202511240006',
    orderStatus: 'Đã giao hàng',
    paymentMethod: 'Chuyển khoản ngân hàng (SePay)',
    paymentStatus: 'Đã thanh toán',
    subTotal: 215000,
    deliveryFee: 25000,
    discount: 20000,
    finalTotal: 220000,
    notes: 'Giao hàng trước 6h chiều',
    momoTransId: 'MOMO789012',
    momoRequestId: 'REQ789012',
    paidAt: '2025-11-21T12:30:00.000Z',
    cancelledReason: null,
    cancelledAt: null,
    userId: 2,
    addressId: 4,
  },
  {
    orderNumber: 'ORD202511240007',
    orderStatus: 'Đã hủy',
    paymentMethod: 'Thanh toán khi nhận hàng',
    paymentStatus: 'Hoàn tiền',
    subTotal: 170000,
    deliveryFee: 25000,
    discount: 0,
    finalTotal: 195000,
    notes: null,
    momoTransId: null,
    momoRequestId: null,
    paidAt: null,
    cancelledReason: 'Khách hủy đơn',
    cancelledAt: '2025-11-23T09:15:00.000Z',
    userId: 3,
    addressId: 6,
  },
  {
    orderNumber: 'ORD202511240008',
    orderStatus: 'Đã giao hàng',
    paymentMethod: 'Chuyển khoản ngân hàng (SePay)',
    paymentStatus: 'Đã thanh toán',
    subTotal: 299000,
    deliveryFee: 25000,
    discount: 0,
    finalTotal: 324000,
    notes: 'Gọi trước khi giao',
    momoTransId: 'MOMO345678',
    momoRequestId: 'REQ345678',
    paidAt: '2025-11-19T15:20:00.000Z',
    cancelledReason: null,
    cancelledAt: null,
    userId: 1,
    addressId: 1,
  },
  {
    orderNumber: 'ORD202511240009',
    orderStatus: 'Đang chuẩn bị',
    paymentMethod: 'Thanh toán khi nhận hàng',
    paymentStatus: 'Chờ thanh toán',
    subTotal: 195000,
    deliveryFee: 25000,
    discount: 20000,
    finalTotal: 200000,
    notes: null,
    momoTransId: null,
    momoRequestId: null,
    paidAt: null,
    cancelledReason: null,
    cancelledAt: null,
    userId: 2,
    addressId: 4,
  },
  {
    orderNumber: 'ORD202511240010',
    orderStatus: 'Đã giao hàng',
    paymentMethod: 'Chuyển khoản ngân hàng (SePay)',
    paymentStatus: 'Đã thanh toán',
    subTotal: 380000,
    deliveryFee: 0,
    discount: 50000,
    finalTotal: 330000,
    notes: null,
    momoTransId: 'MOMO567890',
    momoRequestId: 'REQ567890',
    paidAt: '2025-11-18T11:00:00.000Z',
    cancelledReason: null,
    cancelledAt: null,
    userId: 3,
    addressId: 5,
  },
  {
    orderNumber: 'ORD202511240011',
    orderStatus: 'Sẵn sàng',
    paymentMethod: 'Thanh toán khi nhận hàng',
    paymentStatus: 'Đã thanh toán',
    subTotal: 156000,
    deliveryFee: 25000,
    discount: 0,
    finalTotal: 181000,
    notes: 'Giao hàng trước 6h chiều',
    momoTransId: null,
    momoRequestId: null,
    paidAt: '2025-11-24T13:10:00.000Z',
    cancelledReason: null,
    cancelledAt: null,
    userId: 1,
    addressId: 1,
  },
  {
    orderNumber: 'ORD202511240012',
    orderStatus: 'Đã hủy',
    paymentMethod: 'Chuyển khoản ngân hàng (SePay)',
    paymentStatus: 'Thanh toán thất bại',
    subTotal: 420000,
    deliveryFee: 0,
    discount: 0,
    finalTotal: 420000,
    notes: null,
    momoTransId: 'MOMO123456',
    momoRequestId: 'REQ123456',
    paidAt: null,
    cancelledReason: 'Khách hủy đơn',
    cancelledAt: '2025-11-24T07:30:00.000Z',
    userId: null,
    addressId: 12,
  },
];


// Example OrderItems
export const orderItems = [
  // Order 1: Pizza + Pepsi
  { orderId: 1, productId: 1, productVariantId: 3, comboId: null, quantity: 2 },    // OrderItem 1: Pizza Phô Mai Lớn x2 ✅
  { orderId: 1, productId: 11, productVariantId: 32, comboId: null, quantity: 2 },  // OrderItem 2: Pepsi Vừa x2 ✅

  // Order 2: Combo
  { orderId: 2, productId: null, productVariantId: null, comboId: 1, quantity: 1 }, // OrderItem 3: Combo Tiệc Gia Đình

  // Order 3: Burger + Khoai tây
  { orderId: 3, productId: 5, productVariantId: 14, comboId: null, quantity: 3 },   // OrderItem 4: Burger Bò Lớn x3 ✅
  { orderId: 3, productId: 13, productVariantId: 38, comboId: null, quantity: 1 },  // OrderItem 5: Khoai tây Thường ✅

  // Order 4: Mỳ Ý
  { orderId: 4, productId: 8, productVariantId: 23, comboId: null, quantity: 1 },   // OrderItem 6: Mỳ Ý Bò Bằm Thường ✅

  // Order 5: Combo x2
  { orderId: 5, productId: null, productVariantId: null, comboId: 2, quantity: 2 }, // OrderItem 7: Combo Sinh Viên x2

  // Order 6: Pizza Hải Sản + Nước cam
  { orderId: 6, productId: 2, productVariantId: 6, comboId: null, quantity: 1 },    // OrderItem 8: Pizza Hải Sản Lớn ✅
  { orderId: 6, productId: 12, productVariantId: 35, comboId: null, quantity: 1 },  // OrderItem 9: Nước cam Vừa ✅

  // Order 7: Burger Gà
  { orderId: 7, productId: 6, productVariantId: 17, comboId: null, quantity: 2 },   // OrderItem 10: Burger Gà Lớn x2 ✅

  // Order 8: Combo Pizza Đôi
  { orderId: 8, productId: null, productVariantId: null, comboId: 3, quantity: 1 }, // OrderItem 11: Combo Pizza Đôi

  // Order 9: Pizza Pepperoni
  { orderId: 9, productId: 3, productVariantId: 8, comboId: null, quantity: 1 },    // OrderItem 12: Pizza Pepperoni Trung ✅
];



// Example OrderItemIngredients
export const orderItemIngredients = [
  // OrderItem 1 (Pizza Phô Mai Lớn x2): Thêm topping
  { orderItemId: 1, ingredientId: 8, quantity: 1 },   // Xúc xích Pepperoni
  { orderItemId: 1, ingredientId: 6, quantity: 1 },   // Nấm Tươi

  // OrderItem 4 (Burger Bò Lớn x3): Thêm topping
  { orderItemId: 4, ingredientId: 19, quantity: 2 },  // Thịt xông khói x2
  { orderItemId: 4, ingredientId: 3, quantity: 1 },   // Phô mai Cheddar

  // OrderItem 5 (Khoai tây Thường): Thêm topping
  { orderItemId: 5, ingredientId: 22, quantity: 1 },  // Tương BBQ
  { orderItemId: 5, ingredientId: 23, quantity: 1 },  // Xốt Mayonnaise

  // OrderItem 6 (Mỳ Ý Bò Bằm): Thêm topping
  { orderItemId: 6, ingredientId: 3, quantity: 1 },   // Phô mai Cheddar
  { orderItemId: 6, ingredientId: 14, quantity: 1 },  // Rau thơm Ý

  // OrderItem 8 (Pizza Hải Sản): Thêm topping
  { orderItemId: 8, ingredientId: 18, quantity: 1 },  // Tôm sú
  { orderItemId: 8, ingredientId: 15, quantity: 1 },  // Ớt chuông ngọt

  // OrderItem 10 (Burger Gà x2): Thêm topping
  { orderItemId: 10, ingredientId: 10, quantity: 1 }, // Dưa chuột muối chua
  { orderItemId: 10, ingredientId: 23, quantity: 1 }, // Xốt Mayonnaise
];



// Example Carts
export const carts = [
  {
    userId: 1,      // User đã đăng nhập
    sessionId: null,
  },
  {
    userId: null,   // Guest user
    sessionId: 'jbxvs6yafykqht1jw8p3m9n2c4d5e7f6',
  },
  {
    userId: 2,      // User đã đăng nhập
    sessionId: null,
  },
  {
    userId: null,   // Guest user
    sessionId: 'wonx6g7fa7w4j0069k8l2m3n4p5q6r7s',
  },
  {
    userId: 3,      // User đã đăng nhập
    sessionId: null,
  },
];


// Example CartItems
export const cartItems = [
  // Cart 1 (User 1): Mua Pizza lẻ + Combo
  {
    cartId: 1,
    productId: 1,              // Pizza Phô Mai
    productVariantId: 3,       // Lớn (variant 3 thuộc product 1) ✅
    comboId: null,             // Không phải combo
    quantity: 1,
  },
  {
    cartId: 1,
    productId: null,           // Combo item lưu productId = null
    productVariantId: null,    // Null vì đây là combo
    comboId: 1,                // Combo Tiệc Gia Đình
    quantity: 1,
  },

  // Cart 2 (Guest): Mua Burger
  {
    cartId: 2,
    productId: 5,              // Burger Bò
    productVariantId: 14,      // Lớn (variant 14 thuộc product 5) ✅
    comboId: null,
    quantity: 2,
  },

  // Cart 3 (User 2): Mua Mỳ Ý
  {
    cartId: 3,
    productId: 8,              // Mỳ Ý Bò Bằm
    productVariantId: 23,      // Thường (variant 23 thuộc product 8) ✅
    comboId: null,
    quantity: 1,
  },

  // Cart 4 (Guest): Mua Combo
  {
    cartId: 4,
    productId: null,           // Combo item lưu productId = null
    productVariantId: null,    // Null vì là combo
    comboId: 2,                // Combo Sinh Viên
    quantity: 1,
  },
]



// Example CartItemIngredients
export const cartItemsIngredients = [
  // CartItem 1 (Pizza Phô Mai Lớn): Thêm 2 loại topping
  {
    cartItemId: 1,
    ingredientId: 8,       // Xúc xích Pepperoni
    quantity: 1,
  },
  {
    cartItemId: 1,
    ingredientId: 6,       // Nấm Tươi
    quantity: 1,
  },

  // CartItem 3 (Burger Bò): Thêm bacon
  {
    cartItemId: 3,
    ingredientId: 19,      // Thịt xông khói
    quantity: 1
  },

  // CartItem 4 (Mỳ Ý Bò Bằm): Thêm 2 loại topping
  {
    cartItemId: 4,
    ingredientId: 3,       // Phô mai Cheddar
    quantity: 1,
  },
  {
    cartItemId: 4,
    ingredientId: 14,      // Rau thơm Ý
    quantity: 1,
  },
];



// Example Coupons
export const coupons = [
  // Active coupons
  {
    code: 'WELCOME2024',
    name: 'Giảm giá chào mừng thành viên mới',
    description: 'Giảm 50.000đ cho đơn hàng đầu tiên',
    type: 'FIXED',
    value: 50000,
    minOrderAmount: 200000,
    maxUsers: 100,
    currentUsers: 35,
    validFrom: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),  // 30 ngày trước
    validTo: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),    // 30 ngày sau
    isActive: true,
  },
  {
    code: 'FREESHIP',
    name: 'Miễn phí vận chuyển',
    description: 'Miễn phí ship cho đơn từ 150k',
    type: 'FIXED',
    value: 25000,
    minOrderAmount: 150000,
    maxUsers: 200,
    currentUsers: 87,
    validFrom: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
    validTo: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
    isActive: true,
  },
  {
    code: 'DISCOUNT20',
    name: 'Giảm 20%',
    description: 'Giảm 20% tối đa 100.000đ',
    type: 'PERCENT',
    value: 20,
    minOrderAmount: 300000,
    maxUsers: 50,
    currentUsers: 28,
    validFrom: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
    validTo: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000),
    isActive: true,
  },
  {
    code: 'PIZZA50K',
    name: 'Giảm 50K cho Pizza',
    description: 'Giảm 50.000đ khi mua Pizza',
    type: 'FIXED',
    value: 50000,
    minOrderAmount: 250000,
    maxUsers: 150,
    currentUsers: 92,
    validFrom: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
    validTo: new Date(Date.now() + 40 * 24 * 60 * 60 * 1000),
    isActive: true,
  },
  {
    code: 'COMBO100K',
    name: 'Giảm 100K cho Combo',
    description: 'Giảm 100.000đ khi mua Combo từ 400k',
    type: 'FIXED',
    value: 100000,
    minOrderAmount: 400000,
    maxUsers: 80,
    currentUsers: 45,
    validFrom: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    validTo: new Date(Date.now() + 55 * 24 * 60 * 60 * 1000),
    isActive: true,
  },
  {
    code: 'SALE15',
    name: 'Giảm 15% cuối tuần',
    description: 'Giảm 15% cho đơn hàng cuối tuần',
    type: 'PERCENT',
    value: 15,
    minOrderAmount: 200000,
    maxUsers: 120,
    currentUsers: 67,
    validFrom: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    validTo: new Date(Date.now() + 23 * 24 * 60 * 60 * 1000),
    isActive: true,
  },

  // Expired coupons
  {
    code: 'NEWYEAR2024',
    name: 'Tết 2024',
    description: 'Giảm 200.000đ dịp Tết Nguyên Đán',
    type: 'FIXED',
    value: 200000,
    minOrderAmount: 500000,
    maxUsers: 50,
    currentUsers: 50,  // Đã hết quota
    validFrom: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
    validTo: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),  // Đã hết hạn
    isActive: false,
  },
  {
    code: 'SUMMER2024',
    name: 'Hè sôi động',
    description: 'Giảm 30% mùa hè',
    type: 'PERCENT',
    value: 30,
    minOrderAmount: 350000,
    maxUsers: 100,
    currentUsers: 100,  // Đã hết quota
    validFrom: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000),
    validTo: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),  // Đã hết hạn
    isActive: false,
  },

  // Future coupons
  {
    code: 'CHRISTMAS2024',
    name: 'Giáng sinh 2024',
    description: 'Giảm 150.000đ dịp Noel',
    type: 'FIXED',
    value: 150000,
    minOrderAmount: 450000,
    maxUsers: 200,
    currentUsers: 0,
    validFrom: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),  // Chưa có hiệu lực
    validTo: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
    isActive: true,
  },
  {
    code: 'BLACKFRIDAY',
    name: 'Black Friday 2024',
    description: 'Giảm 25% Black Friday',
    type: 'PERCENT',
    value: 25,
    minOrderAmount: 300000,
    maxUsers: 300,
    currentUsers: 0,
    validFrom: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),  // Chưa có hiệu lực
    validTo: new Date(Date.now() + 35 * 24 * 60 * 60 * 1000),
    isActive: true,
  },
];


// Example UserCoupons
export const userCoupons = [
  // User 1 (Admin) - 2 coupons
  {
    isUsed: true,
    usedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),  // Dùng 5 ngày trước
    userId: 1,
    couponId: 1,  // WELCOME2024
  },
  {
    isUsed: false,
    usedAt: null,
    userId: 1,
    couponId: 3,  // DISCOUNT20
  },

  // User 2 - 3 coupons
  {
    isUsed: true,
    usedAt: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000),
    userId: 2,
    couponId: 2,  // FREESHIP
  },
  {
    isUsed: true,
    usedAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000),
    userId: 2,
    couponId: 4,  // PIZZA50K
  },
  {
    isUsed: false,
    usedAt: null,
    userId: 2,
    couponId: 6,  // SALE15
  },

  // User 3 - 2 coupons
  {
    isUsed: false,
    usedAt: null,
    userId: 3,
    couponId: 1,  // WELCOME2024
  },
  {
    isUsed: true,
    usedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    userId: 3,
    couponId: 5,  // COMBO100K
  },

  // User 4 (Google user) - 2 coupons
  {
    isUsed: false,
    usedAt: null,
    userId: 4,
    couponId: 2,  // FREESHIP
  },
  {
    isUsed: false,
    usedAt: null,
    userId: 4,
    couponId: 9,  // CHRISTMAS2024 (future coupon)
  },

  // User 5 - 1 coupon
  {
    isUsed: false,
    usedAt: null,
    userId: 5,
    couponId: 3,  // DISCOUNT20
  },
];


// Example Reviews
export const reviews = [
  // Review 1: User 1 review Pizza Phô Mai (Order 1)
  {
    rating: 5,
    comment: 'Pizza rất ngon, phô mai thơm béo, đế bánh giòn vừa phải. Giao hàng đúng giờ, nhân viên nhiệt tình. Sẽ ủng hộ tiếp!',
    productId: 1,      // Pizza Phô Mai
    userId: 1,         // Nguyễn Văn An
    orderId: 1,        // Order đã giao hàng
  },

  // Review 2: User 3 review Burger Bò (Order 3)
  {
    rating: 4,
    comment: 'Burger khá ngon, thịt bò mềm và đậm đà. Tuy nhiên phần khoai tây chiên hơi ít. Nhìn chung vẫn hài lòng với chất lượng.',
    productId: 5,      // Burger Bò
    userId: 3,         // Lê Văn Minh
    orderId: 3,        // Order đã giao hàng
  },

  // Review 3: User 2 review Pizza Hải Sản (Order 6)
  {
    rating: 5,
    comment: 'Tuyệt vời! Hải sản tươi ngon, tôm và mực rất chất lượng. Sốt vừa miệng, không quá mặn. Đáng tiền, sẽ order lại nhiều lần nữa.',
    productId: 2,      // Pizza Hải Sản
    userId: 2,         // Trần Thị Hương
    orderId: 6,        // Order đã giao hàng
  },

  // Review 4: User 1 review Mỳ Ý Bò Bằm (Order 4)
  {
    rating: 3,
    comment: 'Mỳ Ý ổn nhưng không xuất sắc lắm. Sốt bò bằm hơi loãng, mong shop cải thiện phần sốt đặc hơn một chút. Mỳ thì vẫn ngon.',
    productId: 8,      // Mỳ Ý Bò Bằm
    userId: 1,         // Nguyễn Văn An
    orderId: 4,        // Order đã giao hàng
  },

  // Review 5: User 1 review Combo Pizza Đôi (Order 8)
  {
    rating: 5,
    comment: 'Combo rất hợp lý về giá! 2 pizza size M vừa đủ cho gia đình 4 người. Nước ngọt mát lạnh, pizza vẫn còn nóng khi nhận. Highly recommended!',
    productId: 3,      // Pizza Pepperoni (đại diện cho combo)
    userId: 1,         // Nguyễn Văn An
    orderId: 8,        // Order đã giao hàng
  },
];
