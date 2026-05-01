-- GALERIA BUTUAN CITY LIVE MYSQL SCHEMA + PHOTO SEED
-- Paste this into the same MySQL database used by MYSQL_DATABASE.
-- Demo credentials after running this file:
--   Admin:    admin / artspace2024
--   Customer: customer@galeria.ph / artspace2024

CREATE DATABASE IF NOT EXISTS galeria_manila CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE galeria_manila;

SET FOREIGN_KEY_CHECKS = 0;

CREATE TABLE IF NOT EXISTS categories (
  category_id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS suppliers (
  supplier_id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  contact_person VARCHAR(100),
  phone VARCHAR(20),
  email VARCHAR(100),
  address TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS customers (
  customer_id INT AUTO_INCREMENT PRIMARY KEY,
  full_name VARCHAR(100) NOT NULL,
  phone VARCHAR(20),
  email VARCHAR(100) UNIQUE,
  password_hash VARCHAR(255) NULL,
  loyalty_points INT DEFAULT 0,
  status ENUM('active', 'inactive') DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS cashiers (
  cashier_id INT AUTO_INCREMENT PRIMARY KEY,
  full_name VARCHAR(100) NOT NULL,
  username VARCHAR(50) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('cashier', 'supervisor', 'admin') DEFAULT 'cashier',
  status ENUM('active', 'inactive', 'on_leave') DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS products (
  product_id INT AUTO_INCREMENT PRIMARY KEY,
  category_id INT,
  supplier_id INT,
  name VARCHAR(200) NOT NULL,
  sku VARCHAR(50) UNIQUE NOT NULL,
  barcode VARCHAR(50) UNIQUE,
  cost_price DECIMAL(10,2) NOT NULL,
  selling_price DECIMAL(10,2) NOT NULL,
  stock_qty INT DEFAULT 0,
  reorder_level INT DEFAULT 10,
  unit VARCHAR(20) DEFAULT 'piece',
  status ENUM('active', 'inactive', 'discontinued') DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (category_id) REFERENCES categories(category_id) ON DELETE SET NULL,
  FOREIGN KEY (supplier_id) REFERENCES suppliers(supplier_id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS artworks (
  artwork_id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  artist_name VARCHAR(100) NOT NULL,
  description TEXT,
  category_id INT,
  image_url VARCHAR(500),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (category_id) REFERENCES categories(category_id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS prints (
  print_id INT AUTO_INCREMENT PRIMARY KEY,
  artwork_id INT NOT NULL,
  size VARCHAR(50) NOT NULL,
  material VARCHAR(100) NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  stock_quantity INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (artwork_id) REFERENCES artworks(artwork_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS discounts (
  discount_id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  type ENUM('percentage', 'fixed') NOT NULL,
  value DECIMAL(10,2) NOT NULL,
  valid_from DATE,
  valid_until DATE,
  applies_to ENUM('all', 'category', 'product', 'customer') DEFAULT 'all',
  status ENUM('active', 'inactive', 'expired') DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS sales (
  sale_id INT AUTO_INCREMENT PRIMARY KEY,
  cashier_id INT,
  customer_id INT,
  sale_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  subtotal DECIMAL(10,2) NOT NULL,
  discount_amount DECIMAL(10,2) DEFAULT 0,
  tax_amount DECIMAL(10,2) DEFAULT 0,
  total_amount DECIMAL(10,2) NOT NULL,
  payment_method ENUM('cash', 'card', 'gcash', 'maya') DEFAULT 'cash',
  amount_tendered DECIMAL(10,2),
  change_given DECIMAL(10,2),
  status ENUM('completed', 'voided', 'refunded') DEFAULT 'completed',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (cashier_id) REFERENCES cashiers(cashier_id) ON DELETE SET NULL,
  FOREIGN KEY (customer_id) REFERENCES customers(customer_id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS sale_items (
  sale_item_id INT AUTO_INCREMENT PRIMARY KEY,
  sale_id INT NOT NULL,
  product_id INT,
  quantity INT NOT NULL,
  unit_price DECIMAL(10,2) NOT NULL,
  discount_pct DECIMAL(5,2) DEFAULT 0,
  line_total DECIMAL(10,2) NOT NULL,
  FOREIGN KEY (sale_id) REFERENCES sales(sale_id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(product_id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS purchase_orders (
  po_id INT AUTO_INCREMENT PRIMARY KEY,
  supplier_id INT,
  cashier_id INT,
  order_date DATE NOT NULL,
  received_date DATE,
  total_cost DECIMAL(10,2) NOT NULL,
  status ENUM('pending', 'ordered', 'partial', 'received', 'cancelled') DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (supplier_id) REFERENCES suppliers(supplier_id) ON DELETE SET NULL,
  FOREIGN KEY (cashier_id) REFERENCES cashiers(cashier_id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS po_items (
  po_item_id INT AUTO_INCREMENT PRIMARY KEY,
  po_id INT NOT NULL,
  product_id INT,
  qty_ordered INT NOT NULL,
  qty_received INT DEFAULT 0,
  unit_cost DECIMAL(10,2) NOT NULL,
  FOREIGN KEY (po_id) REFERENCES purchase_orders(po_id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(product_id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS stock_movements (
  movement_id INT AUTO_INCREMENT PRIMARY KEY,
  product_id INT,
  cashier_id INT,
  type ENUM('in', 'out', 'adjustment', 'return', 'damage') NOT NULL,
  quantity INT NOT NULL,
  reason TEXT,
  moved_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES products(product_id) ON DELETE SET NULL,
  FOREIGN KEY (cashier_id) REFERENCES cashiers(cashier_id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS store_artworks (
  artwork_id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  artist_name VARCHAR(100) NOT NULL,
  description TEXT,
  category VARCHAR(100) NOT NULL,
  medium VARCHAR(100),
  dimensions VARCHAR(100),
  image_url VARCHAR(500),
  price DECIMAL(12,2) NOT NULL,
  stock_quantity INT NOT NULL DEFAULT 0,
  status ENUM('active', 'inactive', 'sold_out') DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS store_orders (
  order_id INT AUTO_INCREMENT PRIMARY KEY,
  order_number VARCHAR(40) UNIQUE NOT NULL,
  customer_id INT,
  customer_name VARCHAR(150) NOT NULL,
  email VARCHAR(150) NOT NULL,
  phone VARCHAR(30) NOT NULL,
  shipping_address TEXT NOT NULL,
  shipping_city VARCHAR(100) NOT NULL,
  shipping_postal_code VARCHAR(30) NOT NULL,
  shipping_country VARCHAR(100) NOT NULL DEFAULT 'Philippines',
  subtotal DECIMAL(12,2) NOT NULL,
  shipping_fee DECIMAL(12,2) NOT NULL DEFAULT 0,
  tax_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  total_amount DECIMAL(12,2) NOT NULL,
  payment_method ENUM('cod', 'gcash', 'maya', 'bank_transfer') NOT NULL DEFAULT 'cod',
  payment_status ENUM('pending', 'paid', 'failed', 'refunded') NOT NULL DEFAULT 'pending',
  order_status ENUM('pending', 'processing', 'shipped', 'completed', 'cancelled') NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_store_orders_customer_id (customer_id),
  INDEX idx_store_orders_created_at (created_at),
  FOREIGN KEY (customer_id) REFERENCES customers(customer_id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS store_order_items (
  order_item_id INT AUTO_INCREMENT PRIMARY KEY,
  order_id INT NOT NULL,
  artwork_id INT,
  title VARCHAR(200) NOT NULL,
  artist_name VARCHAR(100) NOT NULL,
  quantity INT NOT NULL,
  unit_price DECIMAL(12,2) NOT NULL,
  line_total DECIMAL(12,2) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_store_order_items_order_id (order_id),
  FOREIGN KEY (order_id) REFERENCES store_orders(order_id) ON DELETE CASCADE,
  FOREIGN KEY (artwork_id) REFERENCES store_artworks(artwork_id) ON DELETE SET NULL
);

SET FOREIGN_KEY_CHECKS = 1;

-- Safe migration for older DBs that were created before customer auth fields existed.
DELIMITER $$
DROP PROCEDURE IF EXISTS add_column_if_missing $$
CREATE PROCEDURE add_column_if_missing(IN p_table_name VARCHAR(64), IN p_column_name VARCHAR(64), IN p_column_definition TEXT)
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = p_table_name AND COLUMN_NAME = p_column_name
  ) THEN
    SET @ddl = CONCAT('ALTER TABLE ', p_table_name, ' ADD COLUMN ', p_column_definition);
    PREPARE stmt FROM @ddl;
    EXECUTE stmt;
    DEALLOCATE PREPARE stmt;
  END IF;
END $$
DELIMITER ;
CALL add_column_if_missing('customers', 'password_hash', 'password_hash VARCHAR(255) NULL AFTER email');
CALL add_column_if_missing('customers', 'status', 'status ENUM(''active'', ''inactive'') DEFAULT ''active'' AFTER loyalty_points');
DROP PROCEDURE IF EXISTS add_column_if_missing;

SET @galeria_password_hash = 'scrypt$galeria_seed_2026$6563a2be6c2c34372fc2546879b679cac3d18b94ca72b421293e3354b93a952368807bbfbfeb2a67cabdaa91202fa7298b1fad7a34b6369944000b5871fb55e1';

INSERT INTO cashiers (full_name, username, password_hash, role, status) VALUES
  ('Admin User', 'admin', @galeria_password_hash, 'admin', 'active'),
  ('Supervisor One', 'supervisor1', @galeria_password_hash, 'supervisor', 'active'),
  ('Maria Concepcion', 'maria.c', @galeria_password_hash, 'cashier', 'active'),
  ('John Paul Reyes', 'johnpaul.r', @galeria_password_hash, 'cashier', 'active')
ON DUPLICATE KEY UPDATE full_name = VALUES(full_name), password_hash = VALUES(password_hash), role = VALUES(role), status = VALUES(status);

INSERT INTO customers (full_name, phone, email, password_hash, loyalty_points, status) VALUES
  ('Demo Customer', '+63 900 000 0000', 'customer@galeria.ph', @galeria_password_hash, 0, 'active')
ON DUPLICATE KEY UPDATE full_name = VALUES(full_name), phone = VALUES(phone), password_hash = VALUES(password_hash), status = 'active';

INSERT INTO categories (category_id, name, description) VALUES
  (1, 'Contemporary Art', 'Modern gallery artworks and prints'),
  (2, 'Traditional Filipino', 'Works inspired by Philippine culture and heritage'),
  (3, 'Photography', 'Fine art and documentary photo prints'),
  (4, 'Nature & Landscape', 'Philippine scenery, flora, seas, and mountains'),
  (5, 'Illustration', 'Graphic and folklore-inspired illustrations'),
  (6, 'Abstract', 'Non-representational forms, color, and pattern'),
  (7, 'Street Art', 'Urban and pop-culture inspired pieces'),
  (8, 'Mixed Media', 'Layered material-inspired art prints')
ON DUPLICATE KEY UPDATE name = VALUES(name), description = VALUES(description);

INSERT INTO suppliers (supplier_id, name, contact_person, phone, email, address) VALUES
  (1, 'Galeria Butuan City House Supplier', 'Operations Team', '+63 2 8123 4567', 'supplier@galeria.ph', 'Butuan City, Philippines')
ON DUPLICATE KEY UPDATE name = VALUES(name), contact_person = VALUES(contact_person), phone = VALUES(phone), email = VALUES(email), address = VALUES(address);

INSERT INTO products (product_id, category_id, supplier_id, name, sku, barcode, cost_price, selling_price, stock_qty, reorder_level, unit, status) VALUES
  (1, 1, 1, 'Museum Quality Art Print A3', 'PRINT-A3-001', '480000000001', 250.00, 850.00, 25, 5, 'piece', 'active'),
  (2, 1, 1, 'Archival Canvas Print 18x24', 'CANVAS-18X24-001', '480000000002', 520.00, 1800.00, 16, 4, 'piece', 'active'),
  (3, 1, 1, 'Black Gallery Frame 16x20', 'FRAME-16X20-BLK', '480000000003', 450.00, 1200.00, 15, 5, 'piece', 'active')
ON DUPLICATE KEY UPDATE name = VALUES(name), barcode = VALUES(barcode), cost_price = VALUES(cost_price), selling_price = VALUES(selling_price), stock_qty = VALUES(stock_qty), reorder_level = VALUES(reorder_level), unit = VALUES(unit), status = VALUES(status);

-- These images are bundled in public/artworks, so the storefront does not depend on external hotlinks.
-- Admin CRUD can later replace any image_url with /uploads/artworks/... or a remote free image URL.
INSERT INTO store_artworks (artwork_id, title, artist_name, description, category, medium, dimensions, image_url, price, stock_quantity, status) VALUES
  (1, 'Butuan City Bay Golden Hour', 'Isabel Reyes', 'A warm limited-edition print inspired by the layered sunsets and harbor light of Butuan City Bay.', 'Photography', 'Archival pigment print', '18 x 24 inches', '/artworks/aznar-manilabay.jpg', 4200.00, 12, 'active'),
  (2, 'Bahay Kubo Afternoon', 'Miguel Abrigo', 'A vibrant contemporary scene celebrating the Filipino bahay kubo as a symbol of home and rural memory.', 'Traditional Filipino', 'Fine art print', '18 x 24 inches', '/artworks/abrigo-bahay.jpg', 3800.00, 10, 'active'),
  (3, 'Mayon Afterglow', 'Clara Santos', 'A dramatic landscape print featuring Mayon Volcano under a glowing late-afternoon sky.', 'Nature & Landscape', 'Archival pigment print', '20 x 30 inches', '/artworks/amorsolo-mayon.jpg', 5600.00, 8, 'active'),
  (4, 'Harvest Light', 'Rafael Cruz', 'A nostalgic countryside composition inspired by rice fields, labor, and golden Philippine sunlight.', 'Traditional Filipino', 'Canvas print', '24 x 36 inches', '/artworks/amorsolo-rice.jpg', 6500.00, 6, 'active'),
  (5, 'Sabel in Motion', 'Nina Caballero', 'A graceful contemporary figure study exploring cloth, movement, and urban resilience.', 'Contemporary Art', 'Giclee print on cotton rag', '18 x 24 inches', '/artworks/bencab-sabel.jpg', 7800.00, 5, 'active'),
  (6, 'Spoliarium Memory Study', 'Andres Luna Studio', 'A solemn historical study print with museum-inspired composition and dramatic contrast.', 'Classical', 'Fine art reproduction print', '24 x 36 inches', '/artworks/bencab-spoliarium.jpg', 9200.00, 4, 'active'),
  (7, 'Jeepney Pop Route', 'Paolo Dela Cruz', 'A bold pop-art celebration of Butuan City jeepney culture, color, and street typography.', 'Street Art', 'Digital art print', '16 x 20 inches', '/artworks/deejae-jeepney.jpg', 3400.00, 15, 'active'),
  (8, 'Fishermen Before Dawn', 'Lito Mercado', 'Angular modern figures and coastal blues capture the rhythm of Filipino fishing communities.', 'Modern', 'Mixed media print', '20 x 30 inches', '/artworks/kiukok-fishermen.jpg', 6900.00, 7, 'active'),
  (9, 'Kalabaw at Dusk', 'Mateo Lim', 'An expressive countryside print centered on the kalabaw as a symbol of strength and endurance.', 'Modern', 'Canvas print', '18 x 24 inches', '/artworks/kiukok-kalabaw.jpg', 5900.00, 9, 'active'),
  (10, 'Sinulog Motion', 'Bianca Verzosa', 'A festival photography print filled with movement, textile detail, and celebratory color.', 'Photography', 'Archival photo print', '18 x 24 inches', '/artworks/verzosa-sinulog.jpg', 4800.00, 11, 'active'),
  (11, 'Batanes Stone House', 'Vera Francisco', 'A quiet landscape photograph of Batanes stone houses, wind, and northern island stillness.', 'Photography', 'Archival photo print', '20 x 30 inches', '/artworks/villafranca-batanes.jpg', 5200.00, 8, 'active'),
  (12, 'Mindanao Okir Rhythm', 'Samira Imao', 'A pattern-led abstract print inspired by Mindanao okir forms and brasswork traditions.', 'Abstract', 'Giclee print', '18 x 24 inches', '/artworks/imao-mindanao.jpg', 5100.00, 10, 'active'),
  (13, 'Coral Current', 'Leo Lianben', 'An abstract marine composition inspired by Philippine reefs, currents, and coral forms.', 'Abstract', 'Fine art print', '20 x 30 inches', '/artworks/lianben-coral.jpg', 5400.00, 8, 'active'),
  (14, 'Archipelago Lines', 'Arturo Butuan City', 'Minimal geometric forms arranged like islands across a quiet visual field.', 'Abstract', 'Screenprint-style digital print', '18 x 24 inches', '/artworks/luz-archipelago.jpg', 4600.00, 12, 'active'),
  (15, 'Bohol Hills in Green', 'Vic Manalo', 'A fresh interpretation of the Chocolate Hills with softened light and layered greens.', 'Nature & Landscape', 'Canvas print', '24 x 36 inches', '/artworks/manansala-bohol.jpg', 6200.00, 6, 'active'),
  (16, 'Palawan Blue Passage', 'Julian Sanso Studio', 'A dreamlike seascape print inspired by Palawan water, limestone, and tropical calm.', 'Nature & Landscape', 'Archival pigment print', '20 x 30 inches', '/artworks/sanso-palawan.jpg', 6800.00, 5, 'active'),
  (17, 'Diwata Garden', 'Karina Rosanes', 'Intricate folklore illustration featuring a diwata framed by Philippine flora.', 'Illustration', 'Ink-style art print', '16 x 20 inches', '/artworks/rosanes-diwata.jpg', 3900.00, 14, 'active'),
  (18, 'Bakunawa Moonrise', 'Mervin Alonzo', 'A mythic illustration print of Bakunawa rising through a moonlit sea.', 'Illustration', 'Digital illustration print', '18 x 24 inches', '/artworks/malonzo-bakunawa.jpg', 4100.00, 13, 'active'),
  (19, 'Alamat Character Sheet', 'Tori Dalisay', 'A character-design print inspired by heroes and creatures from Philippine legends.', 'Illustration', 'Digital illustration print', '16 x 20 inches', '/artworks/tadiar-alamat.jpg', 3600.00, 15, 'active'),
  (20, 'Santelmo Night', 'Kajo Studio', 'A moody graphic-art print inspired by urban legends and supernatural Butuan City nights.', 'Illustration', 'Graphic print', '16 x 20 inches', '/artworks/baldisimo-trese.jpg', 4400.00, 9, 'active'),
  (21, 'Katipunero Portrait', 'Felix Hidalgo Studio', 'A historical portrait print honoring courage, resistance, and the revolutionary spirit.', 'Portrait', 'Fine art reproduction print', '18 x 24 inches', '/artworks/hidalgo-katipunero.jpg', 5700.00, 7, 'active'),
  (22, 'Filipina in Sepia', 'Luna Heritage Studio', 'An elegant portrait print with classical styling and warm sepia tones.', 'Portrait', 'Fine art reproduction print', '18 x 24 inches', '/artworks/luna-filipina.jpg', 6100.00, 6, 'active'),
  (23, 'Lola Basyang Stories', 'Emilio Borlongan', 'A gentle contemporary portrait print inspired by family stories and oral tradition.', 'Portrait', 'Canvas print', '20 x 30 inches', '/artworks/borlongan-lola.jpg', 5300.00, 8, 'active'),
  (24, 'Tondo Wall Color', 'Antonio Sano', 'A documentary street-art print reflecting community murals and urban color.', 'Street Art', 'Photo print', '18 x 24 inches', '/artworks/sano-tondo.jpg', 3300.00, 12, 'active'),
  (25, 'Urban Butuan City Rhythm', 'Roberto Chabet Studio', 'A conceptual city-inspired print balancing street geometry with abstract form.', 'Contemporary Art', 'Mixed media print', '20 x 30 inches', '/artworks/chabet-urban.jpg', 4900.00, 10, 'active'),
  (26, 'Terraces Dreamscape', 'Ron Ventura Studio', 'A layered landscape print blending rice terraces with surreal contemporary textures.', 'Contemporary Art', 'Canvas print', '24 x 36 inches', '/artworks/ventura-terraces.jpg', 8900.00, 4, 'active'),
  (27, 'Grayground Edition', 'R. Ventura Studio', 'A monochrome-inspired contemporary piece with layered forms and urban tension.', 'Contemporary Art', 'Giclee print', '24 x 36 inches', '/artworks/ventura-grayground.jpg', 9400.00, 3, 'active'),
  (28, 'Kapre Tree', 'Kawayan Studio', 'A mixed-media inspired print referencing folklore, forest memory, and sculptural texture.', 'Mixed Media', 'Mixed media print', '18 x 24 inches', '/artworks/kawayan-kapre.jpg', 4700.00, 7, 'active'),
  (29, 'Boracay Myth Waves', 'Rodel Tapaya Studio', 'A mythological island print with dense narrative detail and tropical wave forms.', 'Mixed Media', 'Canvas print', '24 x 36 inches', '/artworks/tapaya-boracay.jpg', 7400.00, 5, 'active'),
  (30, 'Jeepney Commute', 'George Tapan Studio', 'A bright street photography print capturing the everyday energy of public transport.', 'Photography', 'Archival photo print', '18 x 24 inches', '/artworks/tapan-jeepney.jpg', 4500.00, 10, 'active')
ON DUPLICATE KEY UPDATE
  title = VALUES(title),
  artist_name = VALUES(artist_name),
  description = VALUES(description),
  category = VALUES(category),
  medium = VALUES(medium),
  dimensions = VALUES(dimensions),
  image_url = VALUES(image_url),
  price = VALUES(price),
  stock_quantity = VALUES(stock_quantity),
  status = VALUES(status);
