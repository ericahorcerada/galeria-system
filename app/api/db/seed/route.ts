import mysql from "mysql2/promise";
import { NextResponse } from "next/server";
import { STORE_ARTWORKS } from "@/lib/bootstrap-data";
import { hashPassword } from "@/lib/password";
import { ensureDefaultArtists } from "@/lib/artists";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function isAuthorizedDbMutation(request: Request) {
  const expectedToken = process.env.DB_ADMIN_TOKEN;
  return Boolean(expectedToken && request.headers.get("x-db-admin-token") === expectedToken);
}

async function getConnection() {
  return mysql.createConnection({
    host: process.env.MYSQL_HOST,
    port: Number(process.env.MYSQL_PORT) || 3306,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE,
  });
}

async function addColumnIfMissing(connection: Awaited<ReturnType<typeof getConnection>>, table: string, column: string, definition: string) {
  const [columns] = await connection.query(`SHOW COLUMNS FROM ${table} LIKE ?`, [column]);
  if (Array.isArray(columns) && columns.length === 0) {
    await connection.query(`ALTER TABLE ${table} ADD COLUMN ${definition}`);
  }
}

export async function POST(request: Request) {
  if (!isAuthorizedDbMutation(request)) {
    return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });
  }
  let connection;
  
  try {
    connection = await getConnection(); 

    await addColumnIfMissing(connection, "customers", "password_hash", "password_hash VARCHAR(255) NULL AFTER email");
    await addColumnIfMissing(connection, "customers", "status", "status ENUM('active', 'inactive') DEFAULT 'active' AFTER loyalty_points");

    await ensureDefaultArtists();

    // ==========================================
    // CATEGORIES - Real art categories
    // ========================================== 
    await connection.query(`
      INSERT IGNORE INTO categories (name, description) VALUES
      ('Contemporary Art', 'Modern artistic expressions reflecting current themes and techniques'),
      ('Traditional Filipino', 'Art celebrating Philippine heritage, landscapes, and cultural motifs'),
      ('Abstract', 'Non-representational art focusing on shapes, colors, and forms'),
      ('Photography', 'Fine art photography prints from renowned Filipino photographers'),
      ('Illustration', 'Digital and traditional illustrations, character art, and graphic designs'),
      ('Nature & Landscape', 'Scenic views, flora, fauna, and natural wonders of the Philippines'),
      ('Portrait', 'Human figure and portraiture works'),
      ('Street Art', 'Urban art, graffiti-inspired works, and modern pop culture'),
      ('Sculpture', 'Three-dimensional art pieces and sculptures'),
      ('Mixed Media', 'Artworks combining multiple materials and techniques')
    `);

    // ==========================================
    // SUPPLIERS - Real Philippine art suppliers
    // ========================================== 
    await connection.query(`
      INSERT IGNORE INTO suppliers (name, contact_person, phone, email, address) VALUES
      ('Artline Trading Corp.', 'Ramon Villaverde', '+63 2 8893 1234', 'orders@artlinetrading.ph', '1234 Butuan City Ave, Butuan City, Butuan City'),
      ('Deovir Art Supplies', 'Maria Santos', '+63 2 8721 5678', 'wholesale@deovir.com', '345 P. Noval St., Sampaloc, Butuan City'),
      ('National Book Store - Corporate', 'Jose Ramos', '+63 2 8631 8061', 'corporate@nationalbookstore.com.ph', '4/F Quad Alpha Centrum, 125 Pioneer St., Mandaluyong City'),
      ('Canvas & Co. Butuan City', 'Patricia Lim', '+63 917 812 3456', 'supply@canvasandco.ph', '789 Jupiter St., Bel-Air, Butuan City'),
      ('Artisans Philippines Inc.', 'Miguel Reyes', '+63 2 8812 9090', 'sales@artisansph.com', '567 Shaw Blvd., Pasig City'),
      ('Print Masters PH', 'Anna Cruz', '+63 918 234 5678', 'orders@printmastersph.com', '890 EDSA, Quezon City'),
      ('Frame It Right Studio', 'Carlos Mendoza', '+63 2 8456 7890', 'frames@frameitright.ph', '123 Tomas Morato Ave., Quezon City'),
      ('The Paper Company', 'Elena Soriano', '+63 919 345 6789', 'sales@papercompany.ph', '456 Ortigas Ave., San Juan City'),
      ('Goldcrest Supplies Corp.', 'Henry Tan', '+63 2 8567 8901', 'orders@goldcrestsupplies.com', '789 Aurora Blvd., Cubao, Quezon City'),
      ('Art Central Distribution', 'Grace Fernandez', '+63 920 456 7890', 'wholesale@artcentral.ph', '234 Ayala Ave., Butuan City')
    `);

    // ==========================================
    // ARTWORKS - Real Filipino artists and their works
    // ========================================== 
    await connection.query(`
      INSERT IGNORE INTO artworks (title, artist_name, description, category_id, image_url) VALUES
      ('Spoliarium Reimagined', 'BenCab', 'A contemporary interpretation of the classic Philippine masterpiece, exploring themes of colonial struggle and national identity.', 1, '/artworks/bencab-spoliarium.jpg'),
      ('Sabel Series No. 47', 'BenCab', 'Part of the iconic Sabel series featuring the wandering woman of Baguio, rendered in BenCabs distinctive style.', 1, '/artworks/bencab-sabel.jpg'),
      ('Ifugao Rice Terraces at Dawn', 'Ronald Ventura', 'A hyperrealistic portrayal of the Banaue Rice Terraces with surrealist elements woven throughout.', 2, '/artworks/ventura-terraces.jpg'),
      ('Grayground', 'Ronald Ventura', 'Multi-layered work combining classical painting techniques with contemporary imagery and social commentary.', 1, '/artworks/ventura-grayground.jpg'),
      ('Kalabaw at Takipsilim', 'Ang Kiukok', 'A powerful expressionist work depicting the Filipino water buffalo against a dramatic sunset.', 2, '/artworks/kiukok-kalabaw.jpg'),
      ('Fishermen of Batangas', 'Ang Kiukok', 'Bold, angular forms depicting the daily lives of Filipino fishermen, showcasing Kiukoks unique cubist-expressionist style.', 2, '/artworks/kiukok-fishermen.jpg'),
      ('Mayon Volcano at Sunset', 'Fernando Amorsolo', 'A reproduction of Amorsolos masterful depiction of the perfect cone of Mayon Volcano bathed in golden light.', 6, '/artworks/amorsolo-mayon.jpg'),
      ('Rice Planting', 'Fernando Amorsolo', 'Classic rural Philippine scene showing farmers working in verdant rice paddies under the tropical sun.', 2, '/artworks/amorsolo-rice.jpg'),
      ('Palawan Underground River', 'Juvenal Sanso', 'Ethereal landscape of the Puerto Princesa Underground River with Sansos signature dreamlike quality.', 6, '/artworks/sanso-palawan.jpg'),
      ('Chocolate Hills of Bohol', 'Vicente Manansala', 'Transparent cubist interpretation of Bohols famous geological formation during the dry season.', 6, '/artworks/manansala-bohol.jpg'),
      ('Archipelago Dreams', 'Arturo Luz', 'Minimalist geometric composition inspired by the scattered islands of the Philippine archipelago.', 3, '/artworks/luz-archipelago.jpg'),
      ('Urban Rhythms Butuan City', 'Roberto Chabet', 'Conceptual piece exploring the chaos and harmony of Butuan City city life through abstract forms.', 3, '/artworks/chabet-urban.jpg'),
      ('Coral Symphony', 'Lao Lianben', 'Abstract meditation on the coral reefs of Tubbataha, using rich blues and organic shapes.', 3, '/artworks/lianben-coral.jpg'),
      ('Mindanao Patterns', 'Abdulmari Imao', 'Traditional Maranao okir patterns reimagined in a large-scale contemporary format.', 3, '/artworks/imao-mindanao.jpg'),
      ('Jeepney Culture', 'George Tapan', 'Documentary photograph capturing the vibrant, decorated jeepneys of Butuan City streets.', 4, '/artworks/tapan-jeepney.jpg'),
      ('Sinulog Festival', 'Jake Verzosa', 'Stunning capture of the colorful Sinulog Festival dancers in Cebu City.', 4, '/artworks/verzosa-sinulog.jpg'),
      ('Batanes Stone Houses', 'Veejay Villafranca', 'Moody landscape photography of the iconic stone houses in Batanes.', 4, '/artworks/villafranca-batanes.jpg'),
      ('Butuan City Bay Sunset', 'Jes Aznar', 'Award-winning photograph of Butuan City Bays famous sunset with silhouetted vendors.', 4, '/artworks/aznar-manilabay.jpg'),
      ('Diwata ng Kagubatan', 'Kerby Rosanes', 'Intricate ink illustration of a forest diwata surrounded by Philippine flora and fauna.', 5, '/artworks/rosanes-diwata.jpg'),
      ('Trese: Santelmo', 'Kajo Baldisimo', 'Original artwork from the acclaimed Trese comic series featuring the mysterious santelmo.', 5, '/artworks/baldisimo-trese.jpg'),
      ('Bakunawa Rising', 'Mervin Malonzo', 'Dramatic illustration of the mythological sea serpent Bakunawa swallowing the moon.', 5, '/artworks/malonzo-bakunawa.jpg'),
      ('Alamat Characters', 'Tori Tadiar', 'Character design sheet featuring heroes from Philippine mythology.', 5, '/artworks/tadiar-alamat.jpg'),
      ('Portrait of a Filipina', 'Juan Luna', 'Reproduction of Lunas elegant portrait showcasing Filipino beauty and grace.', 7, '/artworks/luna-filipina.jpg'),
      ('Katipunero', 'Felix Resurreccion Hidalgo', 'Powerful portrait of a Philippine revolutionary, capturing the spirit of the Katipunan.', 7, '/artworks/hidalgo-katipunero.jpg'),
      ('Lola Basyang', 'Elmer Borlongan', 'Contemporary portrait of the beloved storyteller figure in Filipino folklore.', 7, '/artworks/borlongan-lola.jpg'),
      ('Butuan City Graffiti: Bahay Kubo', 'Kris Abrigo', 'Urban street art interpretation of the traditional Filipino bamboo house.', 8, '/artworks/abrigo-bahay.jpg'),
      ('Jeepney Pop Art', 'Dee Jae Pa', 'Pop art style celebration of the iconic Philippine jeepney with bold colors.', 8, '/artworks/deejae-jeepney.jpg'),
      ('Tondo Murals', 'AG Sano', 'Documentary print of the colorful murals found in Tondo, Butuan City.', 8, '/artworks/sano-tondo.jpg'),
      ('Kapre na Puno', 'Kawayan de Guia', 'Mixed media sculpture combining traditional materials with contemporary elements.', 10, '/artworks/kawayan-kapre.jpg'),
      ('Waves of Boracay', 'Rodel Tapaya', 'Large-scale mixed media work depicting the mythological narrative of Boracay Island.', 10, '/artworks/tapaya-boracay.jpg')
    `);

    // ==========================================
    // PRINTS - Various sizes and materials with realistic pricing
    // ========================================== 
    
    const [artworks] = await connection.query("SELECT artwork_id FROM artworks") as any;
    
    const sizes = ['8x10', '11x14', '16x20', '18x24', '24x36'];
    const materials = [
      { name: 'Matte Photo Paper', priceMultiplier: 1 },
      { name: 'Glossy Photo Paper', priceMultiplier: 1.15 },
      { name: 'Canvas', priceMultiplier: 2.5 },
      { name: 'Fine Art Paper', priceMultiplier: 1.8 },
      { name: 'Metal Print', priceMultiplier: 3.2 },
    ];
    
    const basePrices: Record<string, number> = {
      '8x10': 850,
      '11x14': 1200,
      '16x20': 1800,
      '18x24': 2400,
      '24x36': 3500,
    };

    for (const artwork of artworks) {
      for (const size of sizes) {
        for (const material of materials) {
          const price = Math.round(basePrices[size] * material.priceMultiplier);
          const stockQty = Math.floor(Math.random() * 50) + 5;
          
          await connection.query(
            `INSERT IGNORE INTO prints (artwork_id, size, material, price, stock_quantity) VALUES (?, ?, ?, ?, ?)`,
            [artwork.artwork_id, size, material.name, price, stockQty]
          );
        }
      }
    }

    // ==========================================
    // PRODUCTS - Art supplies and merchandise
    // ========================================== 
    await connection.query(`
      INSERT IGNORE INTO products (category_id, supplier_id, name, sku, barcode, cost_price, selling_price, stock_qty, reorder_level, unit, status) VALUES
      (1, 7, 'Black Wood Frame 8x10', 'FRM-BLK-8X10', '4801234567001', 280.00, 450.00, 45, 15, 'piece', 'active'),
      (1, 7, 'Black Wood Frame 11x14', 'FRM-BLK-11X14', '4801234567002', 380.00, 595.00, 38, 12, 'piece', 'active'),
      (1, 7, 'Black Wood Frame 16x20', 'FRM-BLK-16X20', '4801234567003', 520.00, 850.00, 25, 10, 'piece', 'active'),
      (1, 7, 'Black Wood Frame 18x24', 'FRM-BLK-18X24', '4801234567004', 680.00, 1100.00, 20, 8, 'piece', 'active'),
      (1, 7, 'Black Wood Frame 24x36', 'FRM-BLK-24X36', '4801234567005', 950.00, 1500.00, 15, 5, 'piece', 'active'),
      (1, 7, 'White Wood Frame 8x10', 'FRM-WHT-8X10', '4801234567006', 280.00, 450.00, 42, 15, 'piece', 'active'),
      (1, 7, 'White Wood Frame 11x14', 'FRM-WHT-11X14', '4801234567007', 380.00, 595.00, 35, 12, 'piece', 'active'),
      (1, 7, 'Natural Oak Frame 11x14', 'FRM-OAK-11X14', '4801234567008', 450.00, 750.00, 28, 10, 'piece', 'active'),
      (1, 7, 'Natural Oak Frame 16x20', 'FRM-OAK-16X20', '4801234567009', 620.00, 995.00, 22, 8, 'piece', 'active'),
      (1, 7, 'Walnut Premium Frame 18x24', 'FRM-WAL-18X24', '4801234567010', 850.00, 1350.00, 18, 6, 'piece', 'active'),
      (3, 1, 'Acrylic Paint Set 24 Colors', 'ART-ACR-24', '4801234567011', 420.00, 695.00, 60, 20, 'set', 'active'),
      (3, 1, 'Oil Paint Set 12 Colors', 'ART-OIL-12', '4801234567012', 680.00, 1100.00, 35, 15, 'piece', 'active'),
      (3, 1, 'Watercolor Set 36 Colors', 'ART-WTR-36', '4801234567013', 520.00, 850.00, 45, 18, 'set', 'active'),
      (3, 2, 'Professional Brush Set 12pc', 'ART-BRS-12', '4801234567014', 380.00, 625.00, 55, 20, 'set', 'active'),
      (3, 2, 'Canvas Pad A3 10 Sheets', 'ART-CVS-A3', '4801234567015', 180.00, 295.00, 80, 30, 'pad', 'active'),
      (3, 2, 'Sketch Pad A4 50 Sheets', 'ART-SKT-A4', '4801234567016', 95.00, 165.00, 120, 40, 'pad', 'active'),
      (3, 8, 'Cotton Canvas Roll 1m x 5m', 'ART-CVR-1X5', '4801234567017', 1200.00, 1950.00, 15, 5, 'roll', 'active'),
      (3, 8, 'Fine Art Paper A2 25 Sheets', 'ART-FAP-A2', '4801234567018', 650.00, 1050.00, 25, 10, 'pack', 'active'),
      (5, 5, 'ArtSpace Tote Bag', 'MRC-TOT-001', '4801234567019', 120.00, 295.00, 100, 30, 'piece', 'active'),
      (5, 5, 'ArtSpace Notebook A5', 'MRC-NBK-A5', '4801234567020', 85.00, 195.00, 150, 50, 'piece', 'active'),
      (5, 5, 'ArtSpace Postcards Set 10', 'MRC-PST-10', '4801234567021', 45.00, 125.00, 200, 60, 'set', 'active'),
      (5, 5, 'ArtSpace Sticker Pack', 'MRC-STK-001', '4801234567022', 25.00, 75.00, 250, 80, 'pack', 'active'),
      (5, 5, 'Art Print Poster Tube', 'MRC-TUB-001', '4801234567023', 35.00, 85.00, 180, 50, 'piece', 'active'),
      (5, 9, 'Gift Card P500', 'GFT-500', '4801234567024', 500.00, 500.00, 50, 20, 'piece', 'active'),
      (5, 9, 'Gift Card P1000', 'GFT-1000', '4801234567025', 1000.00, 1000.00, 40, 15, 'piece', 'active'),
      (5, 9, 'Gift Card P2500', 'GFT-2500', '4801234567026', 2500.00, 2500.00, 25, 10, 'piece', 'active'),
      (5, 9, 'Gift Card P5000', 'GFT-5000', '4801234567027', 5000.00, 5000.00, 15, 5, 'piece', 'active'),
      (4, 6, 'Custom Print Service 8x10', 'SVC-PRT-8X10', '4801234567028', 180.00, 350.00, 999, 10, 'service', 'active'),
      (4, 6, 'Custom Print Service 11x14', 'SVC-PRT-11X14', '4801234567029', 280.00, 495.00, 999, 10, 'service', 'active'),
      (4, 6, 'Custom Print Service 16x20', 'SVC-PRT-16X20', '4801234567030', 420.00, 750.00, 999, 10, 'service', 'active'),
      (4, 6, 'Custom Framing Service', 'SVC-FRM-CUS', '4801234567031', 350.00, 650.00, 999, 10, 'service', 'active'),
      (1, 10, 'Limited Edition Box Set', 'PRE-BOX-001', '4801234567032', 2500.00, 4500.00, 10, 3, 'set', 'active'),
      (1, 10, 'Collector Frame Gold 16x20', 'FRM-GLD-16X20', '4801234567033', 1800.00, 2950.00, 8, 3, 'piece', 'active'),
      (1, 10, 'Museum Glass Upgrade', 'SVC-MSG-001', '4801234567034', 800.00, 1500.00, 20, 5, 'service', 'active')
    `);

    // ==========================================
    // CUSTOMERS - Real Filipino names
    // ========================================== 
    await connection.query(`
      INSERT IGNORE INTO customers (full_name, phone, email, loyalty_points) VALUES
      ('Maria Clara Santos', '+63 917 123 4567', 'maria.santos@gmail.com', 2450),
      ('Juan Dela Cruz', '+63 918 234 5678', 'juan.delacruz@yahoo.com', 1820),
      ('Andres Bonifacio Jr.', '+63 919 345 6789', 'andres.bonifacio@outlook.com', 3200),
      ('Gabriela Silang', '+63 920 456 7890', 'gabriela.silang@gmail.com', 890),
      ('Jose Rizal III', '+63 921 567 8901', 'jose.rizal3@gmail.com', 4500),
      ('Emilio Aguinaldo', '+63 922 678 9012', 'emilio.aguinaldo@yahoo.com', 1200),
      ('Melchora Aquino', '+63 923 789 0123', 'melchora.aquino@gmail.com', 2100),
      ('Diego Silang', '+63 924 890 1234', 'diego.silang@outlook.com', 780),
      ('Trinidad Tecson', '+63 925 901 2345', 'trinidad.tecson@gmail.com', 1650),
      ('Apolinario Mabini', '+63 926 012 3456', 'apolinario.mabini@yahoo.com', 3800),
      ('Corazon Reyes', '+63 927 123 4567', 'cora.reyes@gmail.com', 950),
      ('Fernando Garcia', '+63 928 234 5678', 'fernando.garcia@outlook.com', 2200),
      ('Patricia Villanueva', '+63 929 345 6789', 'patricia.villanueva@gmail.com', 1400),
      ('Roberto Mendoza', '+63 930 456 7890', 'roberto.mendoza@yahoo.com', 3100),
      ('Isabella Cruz', '+63 931 567 8901', 'isabella.cruz@gmail.com', 680),
      ('Miguel Ramos', '+63 932 678 9012', 'miguel.ramos@outlook.com', 2800),
      ('Sophia Tan', '+63 933 789 0123', 'sophia.tan@gmail.com', 1950),
      ('Rafael Santos', '+63 934 890 1234', 'rafael.santos@yahoo.com', 4200),
      ('Carmen Lim', '+63 935 901 2345', 'carmen.lim@gmail.com', 1100),
      ('Antonio Fernandez', '+63 936 012 3456', 'antonio.fernandez@outlook.com', 2650)
    `);

    // ==========================================
    // CASHIERS - Staff members
    // ========================================== 
    const passwordHash = await hashPassword("artspace2024");
    
    await connection.query(`
      INSERT IGNORE INTO cashiers (full_name, username, password_hash, role, status) VALUES
      ('Admin User', 'admin', '${passwordHash}', 'admin', 'active'),
      ('Supervisor One', 'supervisor1', '${passwordHash}', 'supervisor', 'active'),
      ('Maria Concepcion', 'maria.c', '${passwordHash}', 'cashier', 'active'),
      ('John Paul Reyes', 'johnpaul.r', '${passwordHash}', 'cashier', 'active'),
      ('Angela Marcos', 'angela.m', '${passwordHash}', 'cashier', 'active'),
      ('Benedict Santos', 'benedict.s', '${passwordHash}', 'cashier', 'active'),
      ('Christine Lim', 'christine.l', '${passwordHash}', 'cashier', 'on_leave'),
      ('Daniel Cruz', 'daniel.c', '${passwordHash}', 'cashier', 'active')
    `);

    const seededPasswordHash = passwordHash;
    const staffAccounts = [
      { fullName: "Admin User", username: "admin", role: "admin", status: "active" },
      { fullName: "Supervisor One", username: "supervisor1", role: "supervisor", status: "active" },
      { fullName: "Maria Concepcion", username: "maria.c", role: "cashier", status: "active" },
      { fullName: "John Paul Reyes", username: "johnpaul.r", role: "cashier", status: "active" },
      { fullName: "Angela Marcos", username: "angela.m", role: "cashier", status: "active" },
      { fullName: "Benedict Santos", username: "benedict.s", role: "cashier", status: "active" },
      { fullName: "Christine Lim", username: "christine.l", role: "cashier", status: "on_leave" },
      { fullName: "Daniel Cruz", username: "daniel.c", role: "cashier", status: "active" },
    ];
    for (const account of staffAccounts) {
      await connection.query(`INSERT INTO cashiers (full_name, username, password_hash, role, status) VALUES (?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE full_name = VALUES(full_name), password_hash = VALUES(password_hash), role = VALUES(role), status = VALUES(status)`, [account.fullName, account.username, seededPasswordHash, account.role, account.status]);
    }
    await connection.query(`INSERT INTO customers (full_name, phone, email, password_hash, status, loyalty_points) VALUES (?, ?, ?, ?, 'active', 0) ON DUPLICATE KEY UPDATE full_name = VALUES(full_name), phone = VALUES(phone), password_hash = VALUES(password_hash), status = 'active'`, ["Demo Customer", "+63 900 000 0000", "customer@galeria.ph", seededPasswordHash]);
    for (const artwork of STORE_ARTWORKS) {
      await connection.query(`INSERT INTO store_artworks (artwork_id, title, artist_name, description, category, medium, dimensions, image_url, price, stock_quantity, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active') ON DUPLICATE KEY UPDATE title = VALUES(title), artist_name = VALUES(artist_name), description = VALUES(description), category = VALUES(category), medium = VALUES(medium), dimensions = VALUES(dimensions), image_url = VALUES(image_url), price = VALUES(price), stock_quantity = VALUES(stock_quantity), status = VALUES(status)`, [artwork.id, artwork.title, artwork.artist, artwork.description, artwork.category, artwork.medium, artwork.dimensions, artwork.image, artwork.price, artwork.stock]);
    }

    // ==========================================
    // DISCOUNTS - Active promotions
    // ========================================== 
    await connection.query(`
      INSERT IGNORE INTO discounts (name, type, value, valid_from, valid_until, applies_to, status) VALUES
      ('Summer Sale 2024', 'percentage', 15.00, '2024-04-01', '2024-06-30', 'all', 'active'),
      ('Senior Citizen Discount', 'percentage', 20.00, '2024-01-01', '2025-12-31', 'customer', 'active'),
      ('PWD Discount', 'percentage', 20.00, '2024-01-01', '2025-12-31', 'customer', 'active'),
      ('First Purchase Bonus', 'fixed', 100.00, '2024-01-01', '2025-12-31', 'customer', 'active'),
      ('Bulk Order Discount', 'percentage', 10.00, '2024-01-01', '2025-12-31', 'all', 'active'),
      ('Holiday Special', 'percentage', 25.00, '2024-12-15', '2024-12-31', 'all', 'active'),
      ('Student Discount', 'percentage', 15.00, '2024-01-01', '2025-12-31', 'customer', 'active'),
      ('Loyalty Member 10%', 'percentage', 10.00, '2024-01-01', '2025-12-31', 'customer', 'active'),
      ('Framing Bundle', 'fixed', 200.00, '2024-01-01', '2025-12-31', 'category', 'active'),
      ('Art Supplies Week', 'percentage', 20.00, '2024-05-01', '2024-05-07', 'category', 'active')
    `);

    // ==========================================
    // SALES - Historical sales data (30 days)
    // ========================================== 
    
    const paymentMethods = ['cash', 'card', 'gcash', 'maya'];
    
    for (let daysAgo = 30; daysAgo >= 0; daysAgo--) {
      const numSales = Math.floor(Math.random() * 15) + 5;
      
      for (let i = 0; i < numSales; i++) {
        const cashierId = Math.floor(Math.random() * 6) + 3;
        const customerId = Math.random() > 0.3 ? Math.floor(Math.random() * 20) + 1 : null;
        const subtotal = Math.floor(Math.random() * 15000) + 500;
        const discountAmount = Math.random() > 0.7 ? Math.floor(subtotal * 0.1) : 0;
        const taxAmount = Math.floor((subtotal - discountAmount) * 0.12);
        const totalAmount = subtotal - discountAmount + taxAmount;
        const paymentMethod = paymentMethods[Math.floor(Math.random() * paymentMethods.length)];
        const amountTendered = paymentMethod === 'cash' ? Math.ceil(totalAmount / 100) * 100 + (Math.random() > 0.5 ? 100 : 0) : totalAmount;
        const changeGiven = amountTendered - totalAmount;
        
        await connection.query(`
          INSERT INTO sales (cashier_id, customer_id, sale_date, subtotal, discount_amount, tax_amount, total_amount, payment_method, amount_tendered, change_given, status)
          VALUES (?, ?, DATE_SUB(NOW(), INTERVAL ? DAY), ?, ?, ?, ?, ?, ?, ?, 'completed')
        `, [cashierId, customerId, daysAgo, subtotal, discountAmount, taxAmount, totalAmount, paymentMethod, amountTendered, changeGiven]);
      }
    }

    // ==========================================
    // SALE ITEMS - Items for each sale
    // ========================================== 
    
    const [sales] = await connection.query("SELECT sale_id, subtotal FROM sales") as any;
    const [products] = await connection.query("SELECT product_id, selling_price FROM products") as any;
    
    for (const sale of sales) {
      const numItems = Math.floor(Math.random() * 4) + 1;
      
      for (let i = 0; i < numItems; i++) {
        const product = products[Math.floor(Math.random() * products.length)];
        const quantity = Math.floor(Math.random() * 3) + 1;
        const unitPrice = product.selling_price;
        const discountPct = Math.random() > 0.8 ? Math.floor(Math.random() * 15) : 0;
        const lineTotal = Math.floor(unitPrice * quantity * (1 - discountPct / 100));
        
        await connection.query(`
          INSERT INTO sale_items (sale_id, product_id, quantity, unit_price, discount_pct, line_total)
          VALUES (?, ?, ?, ?, ?, ?)
        `, [sale.sale_id, product.product_id, quantity, unitPrice, discountPct, lineTotal]);
      }
    }

    // ==========================================
    // PURCHASE ORDERS - Restocking orders
    // ========================================== 
    await connection.query(`
      INSERT IGNORE INTO purchase_orders (supplier_id, cashier_id, order_date, received_date, total_cost, status) VALUES
      (1, 1, '2024-04-01', '2024-04-05', 45000.00, 'received'),
      (2, 1, '2024-04-05', '2024-04-08', 32500.00, 'received'),
      (7, 2, '2024-04-10', '2024-04-14', 28750.00, 'received'),
      (6, 1, '2024-04-15', '2024-04-18', 52000.00, 'received'),
      (3, 2, '2024-04-20', '2024-04-24', 18500.00, 'received'),
      (5, 1, '2024-04-22', NULL, 35000.00, 'ordered'),
      (8, 2, '2024-04-25', NULL, 22000.00, 'ordered'),
      (10, 1, '2024-04-28', NULL, 48500.00, 'pending')
    `);

    // ==========================================
    // PO ITEMS - Purchase order line items
    // ========================================== 
    const [poList] = await connection.query("SELECT po_id, status FROM purchase_orders") as any;
    
    for (const po of poList) {
      const numItems = Math.floor(Math.random() * 5) + 2;
      
      for (let i = 0; i < numItems; i++) {
        const product = products[Math.floor(Math.random() * products.length)];
        const qtyOrdered = Math.floor(Math.random() * 50) + 10;
        const qtyReceived = po.status === 'received' ? qtyOrdered : 
                           po.status === 'partial' ? Math.floor(qtyOrdered * 0.6) : 0;
        const unitCost = Math.floor(Math.random() * 800) + 100;
        
        await connection.query(`
          INSERT INTO po_items (po_id, product_id, qty_ordered, qty_received, unit_cost)
          VALUES (?, ?, ?, ?, ?)
        `, [po.po_id, product.product_id, qtyOrdered, qtyReceived, unitCost]);
      }
    }

    // ==========================================
    // STOCK MOVEMENTS - Inventory tracking
    // ========================================== 
    const movementTypes = ['in', 'out', 'adjustment', 'return', 'damage'];
    const reasons: Record<string, string[]> = {
      'in': ['PO Received', 'Return to Stock', 'Initial Stock', 'Transfer In'],
      'out': ['Sale', 'Transfer Out', 'Display Sample', 'Gift'],
      'adjustment': ['Inventory Count', 'System Correction', 'Price Change', 'Category Update'],
      'return': ['Customer Return', 'Defective Return', 'Wrong Item', 'Size Exchange'],
      'damage': ['Water Damage', 'Shipping Damage', 'Store Damage', 'Expired']
    };

    for (let i = 0; i < 100; i++) {
      const productId = products[Math.floor(Math.random() * products.length)].product_id;
      const cashierId = Math.floor(Math.random() * 8) + 1;
      const type = movementTypes[Math.floor(Math.random() * movementTypes.length)];
      const quantity = type === 'in' ? Math.floor(Math.random() * 30) + 5 : 
                      type === 'damage' ? Math.floor(Math.random() * 3) + 1 :
                      Math.floor(Math.random() * 10) + 1;
      const reason = reasons[type][Math.floor(Math.random() * reasons[type].length)];
      const daysAgo = Math.floor(Math.random() * 60);
      
      await connection.query(`
        INSERT INTO stock_movements (product_id, cashier_id, type, quantity, reason, moved_at)
        VALUES (?, ?, ?, ?, ?, DATE_SUB(NOW(), INTERVAL ? DAY))
      `, [productId, cashierId, type, quantity, reason, daysAgo]);
    }   

    await connection.end();

    return NextResponse.json({
      success: true,
      message: "Database seeded successfully with live data!",
      summary: {
        categories: 10,
        suppliers: 10,
        artworks: 30,
        artists: 8,
        prints: "750 (variations of artworks)",
        products: 34,
        customers: 20,
        cashiers: 8,
        customerLogin: "customer@galeria.ph",
        adminLogin: "admin",
        seededLoginPassword: "artspace2024",
        discounts: 10,
        sales: "300+ (30 days history)",
        saleItems: "800+",
        purchaseOrders: 8,
        poItems: "24+",
        stockMovements: 100
      }
    });
  } catch (error) {
    if (connection) {
      await connection.end();
    }
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
