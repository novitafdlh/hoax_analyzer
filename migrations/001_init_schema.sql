CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(100) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  role ENUM('admin', 'user') NOT NULL DEFAULT 'user',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS official_news (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  image_path VARCHAR(255) NOT NULL,
  image_hash VARCHAR(255) NOT NULL,
  extracted_text LONGTEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS submissions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  image_path VARCHAR(255) NOT NULL,
  image_hash VARCHAR(255) NOT NULL,
  extracted_text LONGTEXT,
  similarity_score DECIMAL(6,4) DEFAULT 0,
  similarity_label VARCHAR(20),
  system_status VARCHAR(30),
  final_status VARCHAR(30) DEFAULT 'menunggu_validasi',
  submitted_by INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_submissions_user FOREIGN KEY (submitted_by)
    REFERENCES users(id)
    ON DELETE SET NULL
);

CREATE INDEX idx_submissions_final_status ON submissions(final_status);
CREATE INDEX idx_official_news_image_hash ON official_news(image_hash);
