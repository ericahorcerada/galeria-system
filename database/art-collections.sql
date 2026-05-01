CREATE TABLE IF NOT EXISTS art_collections (
  collection_id INT NOT NULL PRIMARY KEY,
  name VARCHAR(160) NOT NULL,
  slug VARCHAR(180) NULL,
  description TEXT NULL,
  image_url VARCHAR(500) NULL,
  hero_image_url VARCHAR(500) NULL,
  artwork_count INT NOT NULL DEFAULT 0,
  featured_artists TEXT NULL,
  collection_year INT NOT NULL DEFAULT 2024,
  curator VARCHAR(200) NULL,
  explore_button_text VARCHAR(120) NOT NULL DEFAULT 'Explore Collection',
  artwork_ids TEXT NULL,
  status ENUM('active','inactive') NOT NULL DEFAULT 'active',
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

INSERT IGNORE INTO art_collections
(collection_id, name, slug, description, image_url, hero_image_url, artwork_count, featured_artists, collection_year, curator, explore_button_text, artwork_ids, status, sort_order)
VALUES
(1, 'Contemporary Masters', 'contemporary-masters', 'Featuring works by renowned contemporary Filipino artists', '/artworks/bencab-sabel.jpg', '/artworks/bencab-sabel.jpg', 24, '["BenCab","Ronald Ventura","Elmer Borlongan"]', 2024, 'Galeria Butuan City Curatorial Team', 'Explore Collection', '[5,26,27]', 'active', 1),
(2, 'Classical Heritage', 'classical-heritage', 'Timeless pieces from the masters of Filipino classical art', '/artworks/amorsolo-mayon.jpg', '/artworks/amorsolo-mayon.jpg', 18, '["Fernando Amorsolo","Juan Luna","Felix Resurreccion Hidalgo"]', 2024, 'Dr. Maria Rodriguez', 'Explore Collection', '[3,4,6,21,22]', 'active', 2),
(3, 'Modern Expressions', 'modern-expressions', 'Bold, contemporary works pushing artistic boundaries', '/artworks/deejae-jeepney.jpg', '/artworks/deejae-jeepney.jpg', 32, '["Ang Kiukok","Vicente Manansala","Hernando Ocampo"]', 2024, 'Prof. Carlos Mendoza', 'Explore Collection', '[7,8,9,15,24,25]', 'active', 3),
(4, 'Emerging Artists', 'emerging-artists', 'Discover new talents and fresh perspectives in Philippine art', '/artworks/ventura-terraces.jpg', '/artworks/ventura-terraces.jpg', 15, '["Ronald Ventura","Jomike Tejido","Dee Jae Paeste"]', 2024, 'Galeria Butuan City New Voices Program', 'Explore Collection', '[10,11,12,13,14,16,17,18,19,20,28,29,30]', 'active', 4);
