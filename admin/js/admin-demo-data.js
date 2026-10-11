/*
  FILE: admin/js/admin-demo-data.js
  PURPOSE: In-memory "backend" used by every admin page (Products,
           Categories, Offers, Tables, Dashboard) when the real API is
           unreachable, so the Admin Dashboard is fully clickable and
           testable end-to-end before the ASP.NET Core backend exists.
  LOGIC:   - Seeded with the SAME catalog (same names, prices, ids) as
             customer/js/demo-data.js and kitchen/js/kitchen-demo-data.js,
             so a product edited here would (in spirit) be the same product
             a customer sees on the menu - one consistent demo dataset
             across all three apps rather than three disconnected ones.
           - Every function below mirrors one endpoint from
             08-API-CONTRACT.md sections 3-6 (Admin catalog, Tables, Staff
             orders, Reports) closely enough that admin/js/*.js never needs
             to know whether it's talking to this file or the real API -
             see shared/js/api-client.js's withFallback().
           - demoTables includes a QrToken per table (matching
             03-DATABASE-SCHEMA.md's RestaurantTable), used by
             admin/js/tables.js to render a demo QR placeholder (a real
             scannable PNG is generated server-side by QRCoder - see
             06-QR-CODE-AND-TABLE-FLOW.md section 4 - so demo mode draws an
             illustrative placeholder instead of pretending to be one).
*/

let demoAdminCategories = [
  { id: 1, name: "Pasta", imageUrl: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=300", displayOrder: 1 },
  { id: 2, name: "Pizza", imageUrl: "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=300", displayOrder: 2 },
  { id: 3, name: "Burger", imageUrl: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=300", displayOrder: 3 },
  { id: 4, name: "Sushi", imageUrl: "https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=300", displayOrder: 4 },
  { id: 5, name: "Sandwiches", imageUrl: "https://images.unsplash.com/photo-1521390188846-e2a3a97453a0?w=300", displayOrder: 5 },
  { id: 6, name: "Desserts", imageUrl: "https://images.unsplash.com/photo-1551024601-bec78aea704b?w=300", displayOrder: 6 }
];

let demoAdminProducts = [
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

let demoAdminOffers = [
  { id: 1, title: "Twin Burger Pack", description: "Get 2 Classic Cheeseburgers + 1 Large French Fries + 1 Family Size Soft Drink.", oldPrice: 400, newPrice: 300, isActive: true, isFeatured: true, badge: "Save 25%", items: [{ productId: 11, quantity: 2 }] },
  { id: 2, title: "Double Large Feast", description: "Choose any 2 Large Pizzas of your choice and receive a free Large Cheesy Garlic Bread.", oldPrice: 450, newPrice: 340, isActive: true, isFeatured: false, badge: "Pizza Night", items: [{ productId: 7, quantity: 1 }, { productId: 6, quantity: 1 }] },
  { id: 3, title: "Tokyo Samurai Platter", description: "Enjoy a diverse 12-piece premium roll selection (California, Dragon, and Spicy Tuna rolls).", oldPrice: 510, newPrice: 390, isActive: true, isFeatured: false, badge: "Sushi Deal", items: [{ productId: 16, quantity: 1 }, { productId: 18, quantity: 1 }, { productId: 17, quantity: 1 }] },
  { id: 4, title: "Italian Romance Duo", description: "1 Chicken Alfredo Pasta + 1 Spaghetti Bolognese + 2 Fresh Crispy Caesar Side Salads.", oldPrice: 330, newPrice: 260, isActive: true, isFeatured: false, badge: "Pasta Combo", items: [{ productId: 1, quantity: 1 }, { productId: 2, quantity: 1 }] },
  { id: 5, title: "Mega Dessert Carnival", description: "1 Molten Lava Cake + 1 Strawberry Cheesecake + 2 Hot Espresso Cups to complete your meal.", oldPrice: 250, newPrice: 190, isActive: true, isFeatured: false, badge: "Sweet Deal", items: [{ productId: 26, quantity: 1 }, { productId: 27, quantity: 1 }] }
];

let demoAdminTables = [
  { id: 1, tableNumber: "01", qrToken: "8b1e2a44-11cd-4a9b-9f00-table01", isActive: true },
  { id: 2, tableNumber: "02", qrToken: "3f7c9d12-88ab-4e33-9a1e-table02", isActive: true },
  { id: 3, tableNumber: "03", qrToken: "d4a6f001-55e9-4c10-8b7a-table03", isActive: true },
  { id: 4, tableNumber: "04", qrToken: "7f3a9c1e-2b6d-4e51-9a08-table04", isActive: true },
  { id: 5, tableNumber: "05 (patio)", qrToken: "1a2b3c4d-99ff-4a11-8e22-table05", isActive: false }
];

let nextAdminCategoryId = 7;
let nextAdminProductId = 31;
let nextAdminOfferId = 6;
let nextAdminTableId = 6;


/* ---------------------------------------------------------------------- *
 * Categories admin mirror (POST/PUT/DELETE /api/admin/categories)
 * ---------------------------------------------------------------------- */
function demoCreateCategory(dto) {
    const category = { id: nextAdminCategoryId++, displayOrder: demoAdminCategories.length + 1, ...dto };
    demoAdminCategories.push(category);
    return category;
}
function demoUpdateCategory(id, dto) {
    const idx = demoAdminCategories.findIndex((c) => c.id === id);
    if (idx === -1) throw new Error("Category not found");
    demoAdminCategories[idx] = { ...demoAdminCategories[idx], ...dto };
    return demoAdminCategories[idx];
}
function demoDeleteCategory(id) {
    demoAdminCategories = demoAdminCategories.filter((c) => c.id !== id);
}

/* ---------------------------------------------------------------------- *
 * Products admin mirror (POST/PUT/PATCH/DELETE /api/admin/products)
 * ---------------------------------------------------------------------- */
function demoCreateProduct(dto) {
    const product = { id: nextAdminProductId++, isAvailable: true, ...dto };
    demoAdminProducts.push(product);
    return product;
}
function demoUpdateProduct(id, dto) {
    const idx = demoAdminProducts.findIndex((p) => p.id === id);
    if (idx === -1) throw new Error("Product not found");
    demoAdminProducts[idx] = { ...demoAdminProducts[idx], ...dto };
    return demoAdminProducts[idx];
}
function demoSetProductAvailability(id, isAvailable) {
    const product = demoAdminProducts.find((p) => p.id === id);
    if (!product) throw new Error("Product not found");
    product.isAvailable = isAvailable;
    return product;
}
function demoDeleteProduct(id) {
    demoAdminProducts = demoAdminProducts.filter((p) => p.id !== id);
}

/* ---------------------------------------------------------------------- *
 * Offers admin mirror (POST/PUT/DELETE /api/admin/offers)
 * ---------------------------------------------------------------------- */
function demoCreateOffer(dto) {
    const offer = { id: nextAdminOfferId++, isActive: true, isFeatured: false, items: [], ...dto };
    demoAdminOffers.push(offer);
    return offer;
}
function demoUpdateOffer(id, dto) {
    const idx = demoAdminOffers.findIndex((o) => o.id === id);
    if (idx === -1) throw new Error("Offer not found");
    if (dto.isFeatured) {
        // Only one offer can be featured at a time, matching
        // 03-DATABASE-SCHEMA.md's Offer.IsFeatured ("marks THE ONE offer").
        demoAdminOffers.forEach((o) => (o.isFeatured = false));
    }
    demoAdminOffers[idx] = { ...demoAdminOffers[idx], ...dto };
    return demoAdminOffers[idx];
}
function demoDeleteOffer(id) {
    demoAdminOffers = demoAdminOffers.filter((o) => o.id !== id);
}

/* ---------------------------------------------------------------------- *
 * Tables admin mirror (GET/POST/PATCH /api/admin/tables, QR code)
 * ---------------------------------------------------------------------- */
function demoListTables() {
    // Returns a COPY, not the live array - a real GET response is never a
    // live reference to server-side state either, and callers (tables.js)
    // independently push newly-created rows onto their own local list, so
    // handing out the live reference here would let both places grow the
    // same underlying array and silently double-count entries (a real bug
    // caught during testing - see the README's "Bugs Found & Fixed"
    // section for the exact symptom this caused).
    return [...demoAdminTables];
}
function demoCreateTable(tableNumber) {
    const table = {
        id: nextAdminTableId++,
        tableNumber,
        qrToken: `demo-${Math.random().toString(36).slice(2, 10)}-${Date.now().toString(36)}`,
        isActive: true,
    };
    demoAdminTables.push(table);
    return table;
}
function demoSetTableActive(id, isActive) {
    const table = demoAdminTables.find((t) => t.id === id);
    if (!table) throw new Error("Table not found");
    table.isActive = isActive;
    return table;
}

/* ---------------------------------------------------------------------- *
 * Dashboard / reports mirror
 * ---------------------------------------------------------------------- */
function demoBestSellersReport(count = 5) {
    return DEMO_BEST_SELLER_IDS.slice(0, count).map((id, i) => ({
        ...demoAdminProducts.find((p) => p.id === id),
        orderCount: 42 - i * 6, // illustrative descending counts
    }));
}
function demoSalesSummary() {
    return {
        ordersToday: 17,
        revenueToday: 6845,
        averageOrderValue: 402.6,
    };
}

const DEMO_BEST_SELLER_IDS = [6, 15, 18, 1, 26];

/* ---------------------------------------------------------------------- *
 * Demo QR "code" - NOT a real, scannable QR. The real one is a PNG
 * generated server-side by the QRCoder library (see
 * 06-QR-CODE-AND-TABLE-FLOW.md section 4); this is only a visual
 * placeholder so the Tables page has something to show and download in
 * demo mode. It is clearly labeled as such everywhere it appears.
 * ---------------------------------------------------------------------- */
function demoQrPlaceholderBlob(table) {
    const size = 9;
    const seed = table.qrToken.split("").reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
    let rng = seed;
    const nextBit = () => {
        rng = (rng * 1103515245 + 12345) & 0x7fffffff;
        return rng % 2;
    };
    let cells = "";
    for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
            const inFinder =
                (x < 3 && y < 3) || (x >= size - 3 && y < 3) || (x < 3 && y >= size - 3);
            const on = inFinder
                ? (x === 1 || y === 1 || x === 0 || y === 0 || x === size - 1 || y === size - 1 ? 1 : 0)
                : nextBit();
            if (on) cells += `<rect x="${x}" y="${y}" width="1" height="1"/>`;
        }
    }
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" fill="#14352A">
        <rect width="${size}" height="${size}" fill="white"/>${cells}</svg>`;
    return new Blob([svg], { type: "image/svg+xml" });
}
