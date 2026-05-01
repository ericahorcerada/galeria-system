CREATE TABLE IF NOT EXISTS artists (
  artist_id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  alias VARCHAR(150) NOT NULL DEFAULT '',
  bio TEXT,
  image_url VARCHAR(700) DEFAULT '/placeholder-user.jpg',
  status ENUM('active', 'inactive') DEFAULT 'active',
  artworks INT NOT NULL DEFAULT 0,
  total_sales DECIMAL(12, 2) NOT NULL DEFAULT 0,
  featured_work VARCHAR(200) NOT NULL DEFAULT '',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

ALTER TABLE artists ADD COLUMN IF NOT EXISTS alias VARCHAR(150) NOT NULL DEFAULT '';
ALTER TABLE artists ADD COLUMN IF NOT EXISTS bio TEXT;
ALTER TABLE artists ADD COLUMN IF NOT EXISTS image_url VARCHAR(700) DEFAULT '/placeholder-user.jpg';
ALTER TABLE artists ADD COLUMN IF NOT EXISTS status ENUM('active', 'inactive') DEFAULT 'active';
ALTER TABLE artists ADD COLUMN IF NOT EXISTS artworks INT NOT NULL DEFAULT 0;
ALTER TABLE artists ADD COLUMN IF NOT EXISTS total_sales DECIMAL(12, 2) NOT NULL DEFAULT 0;
ALTER TABLE artists ADD COLUMN IF NOT EXISTS featured_work VARCHAR(200) NOT NULL DEFAULT '';
ALTER TABLE artists ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE artists ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;

INSERT IGNORE INTO artists (artist_id, name, alias, bio, image_url, status, artworks, total_sales, featured_work) VALUES
(1, 'Benedicto Cabrera', 'BenCab', 'National Artist of the Philippines, known for his iconic Sabel series and depictions of Filipino life and culture.', '/images/artists/artist-1.svg', 'active', 45, 2340000, 'Sabel in the Wind'),
(2, 'Fernando Amorsolo', 'Grand Old Man of Philippine Art', 'First National Artist, celebrated for his mastery of light and romanticized depictions of Philippine rural life.', '/images/artists/artist-2.svg', 'active', 38, 3150000, 'Rice Planting'),
(3, 'Ronald Ventura', 'Master of Hyperrealism', 'Contemporary artist known for layered imagery combining hyperrealism with pop culture and religious iconography.', '/images/artists/artist-3.svg', 'active', 32, 4200000, 'Grayground'),
(4, 'Ang Kiukok', 'Master of Philippine Expressionism', 'Known for his powerful visual imagery, angular forms, and emotionally charged paintings.', '/images/artists/artist-4.svg', 'active', 28, 1890000, 'Fishermen of Batangas'),
(5, 'Juan Luna', 'Filipino Master', 'One of the first Filipino artists to gain international recognition, known for historical and allegorical works.', '/images/artists/artist-5.svg', 'active', 15, 5600000, 'Portrait of a Filipina'),
(6, 'Vicente Manansala', 'Transparent Cubism Pioneer', 'National Artist known for developing transparent cubism and interpreting Filipino life through layered forms.', '/images/artists/artist-6.svg', 'active', 22, 1450000, 'Chocolate Hills of Bohol'),
(7, 'Arturo Luz', 'Modernist Master', 'National Artist recognized for elegant minimalist compositions, linear forms, and geometric abstraction.', '/images/artists/artist-7.svg', 'active', 18, 2100000, 'Archipelago Dreams'),
(8, 'Juvenal Sanso', 'Poet of Forms', 'Known for dreamlike landscapes and expressive compositions inspired by nature and memory.', '/images/artists/artist-8.svg', 'active', 20, 1750000, 'Palawan Underground River');
