/*
  FILE: customer/js/demo-data.js
  PURPOSE: Local stand-in for the backend's catalog data (Categories,
           Products, Offers, RestaurantInfo), used ONLY when
           customer/js/api.js cannot reach the real API
           (GET /api/categories, /api/products, /api/offers,
           /api/restaurant-info - see 08-API-CONTRACT.md section 1).
  LOGIC:   - This is the *exact* 30-item / 6-category / 5-offer menu that
             used to be hardcoded directly in HTMLPage1.html, extracted
             programmatically (not retyped) and reshaped into the same
             CategoryDto / ProductDto / OfferDto / RestaurantInfoDto shapes
             03-DATABASE-SCHEMA.md and 08-API-CONTRACT.md describe, with
             sequential integer ids the way a real database would assign
             them (Category.Id, Product.Id, Offer.Id).
           - Two data bugs present in the original hardcoded HTML are fixed
             here (documented in the README's "Fixes to Pre-Existing Data"
             section):
               1. The old "Best Seller" highlight ("Chicken Ranch Supreme",
                  EGP 210) did not match any real product on the menu. It is
                  replaced by DEMO_BEST_SELLER_IDS, five real product ids -
                  matching how 03-DATABASE-SCHEMA.md says best-sellers must
                  work ("computed on demand ... not a flag").
               2. The old "Best Offer" highlight ("The Ultimate Combo", EGP
                  250) did not match any of the five real combo offers. It is
                  replaced by offer id 1 (Twin Burger Pack), which now
                  carries isFeatured: true - matching how
                  03-DATABASE-SCHEMA.md says the Offer.IsFeatured flag works.
           - offerDemoData[].items is a best-effort OfferItem breakdown
             (which real products + quantities each combo is made of),
             filled in only where the offer's own description names a
             product that exists in the catalog below. It's illustrative,
             not a claim about the restaurant's real combo composition.
*/

const demoCategories = [
  { id: 1, name: "Pasta", imageUrl: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=300", displayOrder: 1 },
  { id: 2, name: "Pizza", imageUrl: "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=300", displayOrder: 2 },
  { id: 3, name: "Burger", imageUrl: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=300", displayOrder: 3 },
  { id: 4, name: "Sushi", imageUrl: "https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=300", displayOrder: 4 },
  { id: 5, name: "Sandwiches", imageUrl: "https://images.unsplash.com/photo-1521390188846-e2a3a97453a0?w=300", displayOrder: 5 },
  { id: 6, name: "Desserts", imageUrl: "https://images.unsplash.com/photo-1551024601-bec78aea704b?w=300", displayOrder: 6 }
];

const demoProducts = [
  { id: 1, categoryId: 1, name: "Chicken Alfredo Fettuccine", description: "Rich creamy white sauce, grilled chicken breast slices, fresh mushrooms.", price: 140, imageUrl: "https://images.unsplash.com/photo-1645112411341-6c4fd023714a?w=200", isAvailable: true },
  { id: 2, categoryId: 1, name: "Spaghetti Bolognese", description: "Traditional slow-cooked Italian minced beef ragu, parmesan cheese.", price: 130, imageUrl: "https://images.unsplash.com/photo-1546549032-9571cd6b27df?w=200", isAvailable: true },
  { id: 3, categoryId: 1, name: "Penne Arrabbiata", description: "Spicy garlic tomato sauce, fresh basil leaves, premium olive oil oil.", price: 110, imageUrl: "https://images.unsplash.com/photo-1608897013039-887f21d8c804?w=200", isAvailable: true },
  { id: 4, categoryId: 1, name: "Creamy Basil Pesto", description: "Penne tossed in rich basil pesto cream, roasted pine nuts, parmesan.", price: 150, imageUrl: "https://images.unsplash.com/photo-1551183053-bf91a1d81141?w=200", isAvailable: true },
  { id: 5, categoryId: 1, name: "Classic Baked Lasagna", description: "Layers of pasta sheet, savory beef filling, rich b\u00e9chamel, melted mozzarella.", price: 175, imageUrl: "https://images.unsplash.com/photo-1619895092538-128341789043?w=200", isAvailable: true },
  { id: 6, categoryId: 2, name: "Chicken Ranch Pizza", description: "Grilled chicken cubes, signature ranch, mozzarella, tomatoes, jalapenos.", price: 180, imageUrl: "https://images.unsplash.com/photo-1534308983496-4fabb1a015ee?w=200", isAvailable: true },
  { id: 7, categoryId: 2, name: "Margherita Classic", description: "Authentic Italian tomato sauce, fresh buffalo mozzarella, fresh basil, olive oil.", price: 120, imageUrl: "https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?w=200", isAvailable: true },
  { id: 8, categoryId: 2, name: "Beef Pepperoni Feast", description: "Loaded premium beef pepperoni slices, extra mozzarella cheese, oregano.", price: 165, imageUrl: "https://images.unsplash.com/photo-1628840042765-356cda07504e?w=200", isAvailable: true },
  { id: 9, categoryId: 2, name: "Smoky BBQ Chicken", description: "Barbecue chicken strips, red onions, bell peppers, sweet smoky glaze.", price: 175, imageUrl: "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=200", isAvailable: true },
  { id: 10, categoryId: 2, name: "Garden Vegetarian", description: "Mushrooms, colorful bell peppers, sweet corn, black olives, onions.", price: 135, imageUrl: "https://images.unsplash.com/photo-1571407970349-bc81e7e96d47?w=200", isAvailable: true },
  { id: 11, categoryId: 3, name: "Classic Cheeseburger", description: "Flame-grilled angus beef, melted cheddar cheese, fresh lettuce, secret sauce.", price: 150, imageUrl: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=200", isAvailable: true },
  { id: 12, categoryId: 3, name: "Mushroom Swiss Angus", description: "Sauteed fresh mushroom mix, melted creamy Swiss cheese, truffle mayo.", price: 170, imageUrl: "https://images.unsplash.com/photo-1586190848861-99aa4a171e90?w=200", isAvailable: true },
  { id: 13, categoryId: 3, name: "Spicy Crispy Zinger", description: "Fiery deep-fried chicken breast, spicy sauce, pickles, shredded lettuce.", price: 145, imageUrl: "https://images.unsplash.com/photo-1625813506062-0aeb1d7a094b?w=200", isAvailable: true },
  { id: 14, categoryId: 3, name: "Texas BBQ Beef Bacon", description: "Beef bacon slices, crispy fried onion rings, sweet BBQ glaze, cheddar.", price: 185, imageUrl: "https://images.unsplash.com/photo-1553979459-d2229ba7433b?w=200", isAvailable: true },
  { id: 15, categoryId: 3, name: "Monster Double Smash", description: "Two smashed crispy beef patties, double cheddar layers, caramelized onions.", price: 210, imageUrl: "https://images.unsplash.com/photo-1594212699903-ec8a3eca50f5?w=200", isAvailable: true },
  { id: 16, categoryId: 4, name: "California Roll (4 Pcs)", description: "Crab sticks, avocado, crisp cucumber, coated with flying fish roe.", price: 120, imageUrl: "https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=200", isAvailable: true },
  { id: 17, categoryId: 4, name: "Spicy Tuna Crunch (4 Pcs)", description: "Fresh yellowfin tuna, spicy sriracha mayo mix, tempura flakes.", price: 145, imageUrl: "https://images.unsplash.com/photo-1611143669185-af224c5e3252?w=200", isAvailable: true },
  { id: 18, categoryId: 4, name: "Golden Dragon Roll (4 Pcs)", description: "Crispy shrimp tempura, wrapped in unagi eel slices and fresh avocado.", price: 160, imageUrl: "https://images.unsplash.com/photo-1617196034183-421b4917c92d?w=200", isAvailable: true },
  { id: 19, categoryId: 4, name: "Salmon Nigiri (3 Pcs)", description: "Hand-pressed vinegared rice topped with fresh premium raw salmon slices.", price: 95, imageUrl: "https://images.unsplash.com/photo-1553621042-f6e147245754?w=200", isAvailable: true },
  { id: 20, categoryId: 4, name: "Philadelphia Roll (4 Pcs)", description: "Fresh salmon, velvety cream cheese layer, crisp avocado elements.", price: 140, imageUrl: "https://images.unsplash.com/photo-1583623025817-d180a2221d0a?w=200", isAvailable: true },
  { id: 21, categoryId: 5, name: "Classic Triple Club", description: "Toasted bread layers, smoked turkey, grilled chicken, egg, cheddar, mayo.", price: 115, imageUrl: "https://images.unsplash.com/photo-1567620832903-9fc6debc209f?w=200", isAvailable: true },
  { id: 22, categoryId: 5, name: "Philly Ribeye Cheesesteak", description: "Saut\u00e9ed ribeye steak strips, caramelized peppers and onions, melted provolone.", price: 165, imageUrl: "https://images.unsplash.com/photo-1521390188846-e2a3a97453a0?w=200", isAvailable: true },
  { id: 23, categoryId: 5, name: "Tuscan Caprese Panini", description: "Fresh mozzarella, vine tomatoes, aromatic basil pesto sauce, pressed ciabatta.", price: 90, imageUrl: "https://images.unsplash.com/photo-1539252554453-80ab65ce3586?w=200", isAvailable: true },
  { id: 24, categoryId: 5, name: "Smoked Turkey & Emmental", description: "Premium cold smoked turkey slices, matured Emmental cheese, dijon mustard hint.", price: 105, imageUrl: "https://images.unsplash.com/photo-1509722747041-616f39b57569?w=200", isAvailable: true },
  { id: 25, categoryId: 5, name: "Spicy Jalapeno Tuna Melt", description: "Flaked white tuna mix, spicy jalapenos, melted gouda cheese, toasted sourdough.", price: 95, imageUrl: "https://images.unsplash.com/photo-1540713434306-585de5e8b61a?w=200", isAvailable: true },
  { id: 26, categoryId: 6, name: "Chocolate Molten Lava Cake", description: "Warm dark chocolate cake with a rich molten center, served with vanilla scoop.", price: 85, imageUrl: "https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=200", isAvailable: true },
  { id: 27, categoryId: 6, name: "New York Strawberry Cheesecake", description: "Classic dense cheesecake base topped with rich sweet strawberry compote.", price: 90, imageUrl: "https://images.unsplash.com/photo-1533134242443-d4fd215305ad?w=200", isAvailable: true },
  { id: 28, categoryId: 6, name: "Italian Espresso Tiramisu", description: "Ladyfingers soaked in espresso coffee, layered with whipped mascarpone cream.", price: 95, imageUrl: "https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=200", isAvailable: true },
  { id: 29, categoryId: 6, name: "Red Velvet Pastry Layer", description: "Fluffy red velvet cake layers with sweet traditional cream cheese frosting.", price: 80, imageUrl: "https://images.unsplash.com/photo-1563729784474-d77dbb933a9e?w=200", isAvailable: true },
  { id: 30, categoryId: 6, name: "Belgian Chocolate Waffles", description: "Fresh golden baked waffles smothered with premium milk and white Belgian chocolate.", price: 110, imageUrl: "https://images.unsplash.com/photo-1551024601-bec78aea704b?w=200", isAvailable: true }
];

const demoOffers = [
  { id: 1, title: "Twin Burger Pack", description: "Get 2 Classic Cheeseburgers + 1 Large French Fries + 1 Family Size Soft Drink.", oldPrice: 400, newPrice: 300, isActive: true, isFeatured: true, badge: "Save 25%", items: [{ productId: 11, quantity: 2 }] },
  { id: 2, title: "Double Large Feast", description: "Choose any 2 Large Pizzas of your choice and receive a free Large Cheesy Garlic Bread.", oldPrice: 450, newPrice: 340, isActive: true, isFeatured: false, badge: "Pizza Night", items: [{ productId: 7, quantity: 1 }, { productId: 6, quantity: 1 }] },
  { id: 3, title: "Tokyo Samurai Platter", description: "Enjoy a diverse 12-piece premium roll selection (California, Dragon, and Spicy Tuna rolls).", oldPrice: 510, newPrice: 390, isActive: true, isFeatured: false, badge: "Sushi Deal", items: [{ productId: 16, quantity: 1 }, { productId: 18, quantity: 1 }, { productId: 17, quantity: 1 }] },
  { id: 4, title: "Italian Romance Duo", description: "1 Chicken Alfredo Pasta + 1 Spaghetti Bolognese + 2 Fresh Crispy Caesar Side Salads.", oldPrice: 330, newPrice: 260, isActive: true, isFeatured: false, badge: "Pasta Combo", items: [{ productId: 1, quantity: 1 }, { productId: 2, quantity: 1 }] },
  { id: 5, title: "Mega Dessert Carnival", description: "1 Molten Lava Cake + 1 Strawberry Cheesecake + 2 Hot Espresso Cups to complete your meal.", oldPrice: 250, newPrice: 190, isActive: true, isFeatured: false, badge: "Sweet Deal", items: [{ productId: 26, quantity: 1 }, { productId: 27, quantity: 1 }] }
];

const DEMO_BEST_SELLER_IDS = [6, 15, 18, 1, 26];

const demoRestaurantInfo = {
  aboutText: "We craft an exceptional culinary journey combining pristine ingredients with modern dining convenience. Located in the heart of the city, welcoming you daily from 9:00 AM to 12:00 AM.",
  openingHours: "9:00 AM - 12:00 AM",
  certificates: [
    "\ud83c\udfc6 Best Digital Hospitality Experience Award 2025.",
    "\ud83c\udfc5 International HACCP Food Safety Certification.",
    "\u2b50 4.9/5 Rating by Top Culinary Critics."
  ],
  establishedYear: 2022
};

// Mirrors GET /api/products/best-sellers?days=&count= against the local
// catalog above (see the header comment for why these five ids were chosen).
function demoBestSellers({ count = 5 } = {}) {
    return DEMO_BEST_SELLER_IDS.slice(0, count)
        .map((id) => demoProducts.find((p) => p.id === id))
        .filter(Boolean);
}

// Mirrors GET /api/products?category=&search=
function demoProductList({ category, search } = {}) {
    const term = (search || "").toLowerCase().trim();
    return demoProducts.filter((p) => {
        // Number(category) so this matches whether the caller passes a
        // numeric id or a query-string-style string ("2") - the real
        // ProductsController does the equivalent int.TryParse server-side,
        // so this stub should accept the same shapes it does.
        const matchesCategory = !category || category === "all" || p.categoryId === Number(category);
        const haystack = (p.name + " " + p.description).toLowerCase();
        const matchesSearch = !term || haystack.includes(term);
        return matchesCategory && matchesSearch;
    });
}
