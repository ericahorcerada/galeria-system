import mysql from "mysql2/promise";
import type { Connection } from "mysql2/promise";
import { NextResponse } from "next/server";

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
    multipleStatements: true,
  });
}

async function addColumnIfMissing(connection: Connection, table: string, column: string, definition: string) {
  const [columns] = await connection.query(`SHOW COLUMNS FROM ${table} LIKE ?`, [column]);
  if (Array.isArray(columns) && columns.length === 0) await connection.query(`ALTER TABLE ${table} ADD COLUMN ${definition}`);
}

async function applyProductionSchema(connection: Connection) {
  await addColumnIfMissing(connection, "customers", "password_hash", "password_hash VARCHAR(255) NULL AFTER email");
  await addColumnIfMissing(connection, "customers", "status", "status ENUM('active', 'inactive') DEFAULT 'active' AFTER loyalty_points");
  await connection.query(`CREATE TABLE IF NOT EXISTS artists (artist_id INT AUTO_INCREMENT PRIMARY KEY, name VARCHAR(150) NOT NULL, alias VARCHAR(150) NOT NULL DEFAULT '', bio TEXT, image_url VARCHAR(700) DEFAULT '/placeholder-user.jpg', status ENUM('active', 'inactive') DEFAULT 'active', artworks INT NOT NULL DEFAULT 0, total_sales DECIMAL(12, 2) NOT NULL DEFAULT 0, featured_work VARCHAR(200) NOT NULL DEFAULT '', created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP)`);
  await addColumnIfMissing(connection, "artists", "alias", "alias VARCHAR(150) NOT NULL DEFAULT '' AFTER name");
  await addColumnIfMissing(connection, "artists", "bio", "bio TEXT AFTER alias");
  await addColumnIfMissing(connection, "artists", "image_url", "image_url VARCHAR(700) DEFAULT '/placeholder-user.jpg' AFTER bio");
  await addColumnIfMissing(connection, "artists", "status", "status ENUM('active', 'inactive') DEFAULT 'active' AFTER image_url");
  await addColumnIfMissing(connection, "artists", "artworks", "artworks INT NOT NULL DEFAULT 0 AFTER status");
  await addColumnIfMissing(connection, "artists", "total_sales", "total_sales DECIMAL(12, 2) NOT NULL DEFAULT 0 AFTER artworks");
  await addColumnIfMissing(connection, "artists", "featured_work", "featured_work VARCHAR(200) NOT NULL DEFAULT '' AFTER total_sales");
  await addColumnIfMissing(connection, "artists", "created_at", "created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP AFTER featured_work");
  await addColumnIfMissing(connection, "artists", "updated_at", "updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP AFTER created_at");
  await connection.query(`CREATE TABLE IF NOT EXISTS homepage_settings (id INT PRIMARY KEY DEFAULT 1, eyebrow VARCHAR(200) NOT NULL DEFAULT 'Live Filipino Art Store', title VARCHAR(255) NOT NULL DEFAULT 'Curated art for', highlight VARCHAR(255) NOT NULL DEFAULT 'modern Filipino spaces.', subtitle TEXT, primary_button_text VARCHAR(120) NOT NULL DEFAULT 'Shop Live Collection', primary_button_href VARCHAR(255) NOT NULL DEFAULT '/shop', secondary_button_text VARCHAR(120) NOT NULL DEFAULT 'Create Customer Account', secondary_button_href VARCHAR(255) NOT NULL DEFAULT '/login', background_image_url VARCHAR(700) NOT NULL DEFAULT '/artworks/aznar-manilabay.jpg', featured_image_url VARCHAR(700) NOT NULL DEFAULT '/artworks/bencab-sabel.jpg', featured_title VARCHAR(200) NOT NULL DEFAULT 'Sabel in Motion', featured_subtitle VARCHAR(200) NOT NULL DEFAULT 'Photo-backed seed artwork', created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP)`);
  await addColumnIfMissing(connection, "homepage_settings", "background_image_url", "background_image_url VARCHAR(700) NOT NULL DEFAULT '/artworks/aznar-manilabay.jpg'");
  await addColumnIfMissing(connection, "homepage_settings", "featured_image_url", "featured_image_url VARCHAR(700) NOT NULL DEFAULT '/artworks/bencab-sabel.jpg'");
  await addColumnIfMissing(connection, "homepage_settings", "eyebrow", "eyebrow VARCHAR(200) NOT NULL DEFAULT 'Live Filipino Art Store'");
  await addColumnIfMissing(connection, "homepage_settings", "title", "title VARCHAR(255) NOT NULL DEFAULT 'Curated art for'");
  await addColumnIfMissing(connection, "homepage_settings", "highlight", "highlight VARCHAR(255) NOT NULL DEFAULT 'modern Filipino spaces.'");
  await addColumnIfMissing(connection, "homepage_settings", "subtitle", "subtitle TEXT NULL");
  await addColumnIfMissing(connection, "homepage_settings", "primary_button_text", "primary_button_text VARCHAR(120) NOT NULL DEFAULT 'Shop Live Collection'");
  await addColumnIfMissing(connection, "homepage_settings", "primary_button_href", "primary_button_href VARCHAR(255) NOT NULL DEFAULT '/shop'");
  await addColumnIfMissing(connection, "homepage_settings", "secondary_button_text", "secondary_button_text VARCHAR(120) NOT NULL DEFAULT 'Create Customer Account'");
  await addColumnIfMissing(connection, "homepage_settings", "secondary_button_href", "secondary_button_href VARCHAR(255) NOT NULL DEFAULT '/login'");
  await connection.query(`INSERT IGNORE INTO homepage_settings (id) VALUES (1)`);
  await connection.query(`UPDATE homepage_settings SET eyebrow = 'Live Filipino Art Store' WHERE id = 1 AND eyebrow IS NULL`);
  await connection.query(`UPDATE homepage_settings SET title = 'Curated art for' WHERE id = 1 AND title IS NULL`);
  await connection.query(`UPDATE homepage_settings SET highlight = 'modern Filipino spaces.' WHERE id = 1 AND highlight IS NULL`);
  await connection.query(`UPDATE homepage_settings SET subtitle = 'Browse photo-backed, MySQL-powered artwork listings. Update titles, prices, stock, and images in admin, then see the storefront change live.' WHERE id = 1 AND subtitle IS NULL`);
  await connection.query(`UPDATE homepage_settings SET primary_button_text = 'Shop Live Collection' WHERE id = 1 AND primary_button_text IS NULL`);
  await connection.query(`UPDATE homepage_settings SET primary_button_href = '/shop' WHERE id = 1 AND primary_button_href IS NULL`);
  await connection.query(`UPDATE homepage_settings SET secondary_button_text = 'Create Customer Account' WHERE id = 1 AND secondary_button_text IS NULL`);
  await connection.query(`UPDATE homepage_settings SET secondary_button_href = '/login' WHERE id = 1 AND secondary_button_href IS NULL`);
  await connection.query(`UPDATE homepage_settings SET background_image_url = '/artworks/aznar-manilabay.jpg' WHERE id = 1 AND background_image_url IS NULL`);
  await connection.query(`UPDATE homepage_settings SET featured_image_url = '/artworks/bencab-sabel.jpg' WHERE id = 1 AND featured_image_url IS NULL`);
  await connection.query(`UPDATE homepage_settings SET featured_title = 'Sabel in Motion' WHERE id = 1 AND featured_title IS NULL`);
  await connection.query(`UPDATE homepage_settings SET featured_subtitle = 'Photo-backed seed artwork' WHERE id = 1 AND featured_subtitle IS NULL`);
  await connection.query(`CREATE TABLE IF NOT EXISTS store_artworks (artwork_id INT AUTO_INCREMENT PRIMARY KEY, title VARCHAR(200) NOT NULL, artist_name VARCHAR(100) NOT NULL, description TEXT, category VARCHAR(100) NOT NULL, medium VARCHAR(100), dimensions VARCHAR(100), image_url VARCHAR(500), price DECIMAL(12, 2) NOT NULL, stock_quantity INT NOT NULL DEFAULT 0, status ENUM('active', 'inactive', 'sold_out') DEFAULT 'active', created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP)`);
  await connection.query(`CREATE TABLE IF NOT EXISTS store_orders (order_id INT AUTO_INCREMENT PRIMARY KEY, order_number VARCHAR(40) UNIQUE NOT NULL, customer_id INT, customer_name VARCHAR(150) NOT NULL, email VARCHAR(150) NOT NULL, phone VARCHAR(30) NOT NULL, shipping_address TEXT NOT NULL, shipping_city VARCHAR(100) NOT NULL, shipping_postal_code VARCHAR(30) NOT NULL, shipping_country VARCHAR(100) NOT NULL DEFAULT 'Philippines', subtotal DECIMAL(12, 2) NOT NULL, shipping_fee DECIMAL(12, 2) NOT NULL DEFAULT 0, tax_amount DECIMAL(12, 2) NOT NULL DEFAULT 0, total_amount DECIMAL(12, 2) NOT NULL, payment_method ENUM('cod', 'gcash', 'maya', 'bank_transfer') NOT NULL DEFAULT 'cod', payment_status ENUM('pending', 'paid', 'failed', 'refunded') NOT NULL DEFAULT 'pending', order_status ENUM('pending', 'processing', 'shipped', 'completed', 'cancelled') NOT NULL DEFAULT 'pending', created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, INDEX idx_store_orders_customer_id (customer_id), INDEX idx_store_orders_created_at (created_at), FOREIGN KEY (customer_id) REFERENCES customers(customer_id) ON DELETE SET NULL)`);
  await connection.query(`CREATE TABLE IF NOT EXISTS store_order_items (order_item_id INT AUTO_INCREMENT PRIMARY KEY, order_id INT NOT NULL, artwork_id INT, title VARCHAR(200) NOT NULL, artist_name VARCHAR(100) NOT NULL, quantity INT NOT NULL, unit_price DECIMAL(12, 2) NOT NULL, line_total DECIMAL(12, 2) NOT NULL, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, INDEX idx_store_order_items_order_id (order_id), FOREIGN KEY (order_id) REFERENCES store_orders(order_id) ON DELETE CASCADE, FOREIGN KEY (artwork_id) REFERENCES store_artworks(artwork_id) ON DELETE SET NULL)`);
}

export async function POST(request: Request) {
  if (!isAuthorizedDbMutation(request)) {
    return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });
  }
  try {
    const connection = await getConnection(); 

    const schema = `
      -- Categories table
      CREATE TABLE IF NOT EXISTS categories (
        category_id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      );

      -- Suppliers table
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

      -- Artworks table
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

      -- Prints table (artwork variations)
      CREATE TABLE IF NOT EXISTS prints (
        print_id INT AUTO_INCREMENT PRIMARY KEY,
        artwork_id INT NOT NULL,
        size VARCHAR(50) NOT NULL,
        material VARCHAR(100) NOT NULL,
        price DECIMAL(10, 2) NOT NULL,
        stock_quantity INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (artwork_id) REFERENCES artworks(artwork_id) ON DELETE CASCADE
      );

      -- Products table (general products for POS)
      CREATE TABLE IF NOT EXISTS products (
        product_id INT AUTO_INCREMENT PRIMARY KEY,
        category_id INT,
        supplier_id INT,
        name VARCHAR(200) NOT NULL,
        sku VARCHAR(50) UNIQUE NOT NULL,
        barcode VARCHAR(50) UNIQUE,
        cost_price DECIMAL(10, 2) NOT NULL,
        selling_price DECIMAL(10, 2) NOT NULL,
        stock_qty INT DEFAULT 0,
        reorder_level INT DEFAULT 10,
        unit VARCHAR(20) DEFAULT 'piece',
        status ENUM('active', 'inactive', 'discontinued') DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (category_id) REFERENCES categories(category_id) ON DELETE SET NULL,
        FOREIGN KEY (supplier_id) REFERENCES suppliers(supplier_id) ON DELETE SET NULL
      );

      -- Customers table
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

      -- Cashiers table
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

      -- Discounts table
      CREATE TABLE IF NOT EXISTS discounts (
        discount_id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        type ENUM('percentage', 'fixed') NOT NULL,
        value DECIMAL(10, 2) NOT NULL,
        valid_from DATE,
        valid_until DATE,
        applies_to ENUM('all', 'category', 'product', 'customer') DEFAULT 'all',
        status ENUM('active', 'inactive', 'expired') DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      );

      -- Sales table
      CREATE TABLE IF NOT EXISTS sales (
        sale_id INT AUTO_INCREMENT PRIMARY KEY,
        cashier_id INT,
        customer_id INT,
        sale_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        subtotal DECIMAL(10, 2) NOT NULL,
        discount_amount DECIMAL(10, 2) DEFAULT 0,
        tax_amount DECIMAL(10, 2) DEFAULT 0,
        total_amount DECIMAL(10, 2) NOT NULL,
        payment_method ENUM('cash', 'card', 'gcash', 'maya') DEFAULT 'cash',
        amount_tendered DECIMAL(10, 2),
        change_given DECIMAL(10, 2),
        status ENUM('completed', 'voided', 'refunded') DEFAULT 'completed',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (cashier_id) REFERENCES cashiers(cashier_id) ON DELETE SET NULL,
        FOREIGN KEY (customer_id) REFERENCES customers(customer_id) ON DELETE SET NULL
      );

      -- Sale items table
      CREATE TABLE IF NOT EXISTS sale_items (
        sale_item_id INT AUTO_INCREMENT PRIMARY KEY,
        sale_id INT NOT NULL,
        product_id INT,
        quantity INT NOT NULL,
        unit_price DECIMAL(10, 2) NOT NULL,
        discount_pct DECIMAL(5, 2) DEFAULT 0,
        line_total DECIMAL(10, 2) NOT NULL,
        FOREIGN KEY (sale_id) REFERENCES sales(sale_id) ON DELETE CASCADE,
        FOREIGN KEY (product_id) REFERENCES products(product_id) ON DELETE SET NULL
      );

      -- Purchase orders table
      CREATE TABLE IF NOT EXISTS purchase_orders (
        po_id INT AUTO_INCREMENT PRIMARY KEY,
        supplier_id INT,
        cashier_id INT,
        order_date DATE NOT NULL,
        received_date DATE,
        total_cost DECIMAL(10, 2) NOT NULL,
        status ENUM('pending', 'ordered', 'partial', 'received', 'cancelled') DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (supplier_id) REFERENCES suppliers(supplier_id) ON DELETE SET NULL,
        FOREIGN KEY (cashier_id) REFERENCES cashiers(cashier_id) ON DELETE SET NULL
      );

      -- PO items table
      CREATE TABLE IF NOT EXISTS po_items (
        po_item_id INT AUTO_INCREMENT PRIMARY KEY,
        po_id INT NOT NULL,
        product_id INT,
        qty_ordered INT NOT NULL,
        qty_received INT DEFAULT 0,
        unit_cost DECIMAL(10, 2) NOT NULL,
        FOREIGN KEY (po_id) REFERENCES purchase_orders(po_id) ON DELETE CASCADE,
        FOREIGN KEY (product_id) REFERENCES products(product_id) ON DELETE SET NULL
      );

      -- Stock movements table
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
    `;

    await connection.query(schema);
    await applyProductionSchema(connection);

    await connection.end();

    return NextResponse.json({
      success: true,
      message: "Database schema created successfully!",
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
