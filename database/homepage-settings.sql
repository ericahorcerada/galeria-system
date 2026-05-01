CREATE TABLE IF NOT EXISTS homepage_settings (
  id INT PRIMARY KEY DEFAULT 1,
  eyebrow VARCHAR(200) NOT NULL DEFAULT 'Live Filipino Art Store',
  title VARCHAR(255) NOT NULL DEFAULT 'Curated art for',
  highlight VARCHAR(255) NOT NULL DEFAULT 'modern Filipino spaces.',
  subtitle TEXT NULL,
  primary_button_text VARCHAR(120) NOT NULL DEFAULT 'Shop Live Collection',
  primary_button_href VARCHAR(255) NOT NULL DEFAULT '/shop',
  secondary_button_text VARCHAR(120) NOT NULL DEFAULT 'Create Customer Account',
  secondary_button_href VARCHAR(255) NOT NULL DEFAULT '/login',
  background_image_url VARCHAR(700) NOT NULL DEFAULT '/artworks/aznar-manilabay.jpg',
  featured_image_url VARCHAR(700) NOT NULL DEFAULT '/artworks/bencab-sabel.jpg',
  featured_title VARCHAR(200) NOT NULL DEFAULT 'Sabel in Motion',
  featured_subtitle VARCHAR(200) NOT NULL DEFAULT 'Photo-backed seed artwork',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

INSERT IGNORE INTO homepage_settings (
  id, eyebrow, title, highlight, subtitle, primary_button_text, primary_button_href,
  secondary_button_text, secondary_button_href, background_image_url, featured_image_url,
  featured_title, featured_subtitle
) VALUES (
  1,
  'Live Filipino Art Store',
  'Curated art for',
  'modern Filipino spaces.',
  'Browse photo-backed, MySQL-powered artwork listings. Update titles, prices, stock, and images in admin, then see the storefront change live.',
  'Shop Live Collection',
  '/shop',
  'Create Customer Account',
  '/login',
  '/artworks/aznar-manilabay.jpg',
  '/artworks/bencab-sabel.jpg',
  'Sabel in Motion',
  'Photo-backed seed artwork'
);

UPDATE homepage_settings SET eyebrow = 'Live Filipino Art Store' WHERE id = 1 AND eyebrow IS NULL;
UPDATE homepage_settings SET title = 'Curated art for' WHERE id = 1 AND title IS NULL;
UPDATE homepage_settings SET highlight = 'modern Filipino spaces.' WHERE id = 1 AND highlight IS NULL;
UPDATE homepage_settings SET subtitle = 'Browse photo-backed, MySQL-powered artwork listings. Update titles, prices, stock, and images in admin, then see the storefront change live.' WHERE id = 1 AND subtitle IS NULL;
UPDATE homepage_settings SET primary_button_text = 'Shop Live Collection' WHERE id = 1 AND primary_button_text IS NULL;
UPDATE homepage_settings SET primary_button_href = '/shop' WHERE id = 1 AND primary_button_href IS NULL;
UPDATE homepage_settings SET secondary_button_text = 'Create Customer Account' WHERE id = 1 AND secondary_button_text IS NULL;
UPDATE homepage_settings SET secondary_button_href = '/login' WHERE id = 1 AND secondary_button_href IS NULL;
UPDATE homepage_settings SET background_image_url = '/artworks/aznar-manilabay.jpg' WHERE id = 1 AND background_image_url IS NULL;
UPDATE homepage_settings SET featured_image_url = '/artworks/bencab-sabel.jpg' WHERE id = 1 AND featured_image_url IS NULL;
UPDATE homepage_settings SET featured_title = 'Sabel in Motion' WHERE id = 1 AND featured_title IS NULL;
UPDATE homepage_settings SET featured_subtitle = 'Photo-backed seed artwork' WHERE id = 1 AND featured_subtitle IS NULL;
