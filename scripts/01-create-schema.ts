import mysql from "mysql2/promise";
import dotenv from "dotenv";
import path from "path";

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

async function createSchema() {
  console.log("Connecting to MySQL...");
  console.log("Host:", process.env.MYSQL_HOST);
  console.log("Port:", process.env.MYSQL_PORT);
  console.log("Database:", process.env.MYSQL_DATABASE);
  console.log("User:", process.env.MYSQL_USER);
  
  if (!process.env.MYSQL_HOST || !process.env.MYSQL_USER || !process.env.MYSQL_PASSWORD) {
    throw new Error("Missing required MySQL environment variables. Please check .env.local file.");
  }

  const connection = await mysql.createConnection({
    host: process.env.MYSQL_HOST,
    port: Number(process.env.MYSQL_PORT) || 3306,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE,
    multipleStatements: true,
    ssl: {
      rejectUnauthorized: false
    }
  });

  console.log("Connected to MySQL database!");

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

  try {
    await connection.query(schema);
    console.log("Schema created successfully!");
  } catch (error) {
    console.error("Error creating schema:", error);
    throw error;
  } finally {
    await connection.end();
  }
}

createSchema().catch(console.error);
