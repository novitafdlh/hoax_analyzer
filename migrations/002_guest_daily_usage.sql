CREATE TABLE IF NOT EXISTS guest_daily_usage (
  id INT AUTO_INCREMENT PRIMARY KEY,
  date_key DATE NOT NULL,
  client_identifier VARCHAR(255) NOT NULL,
  usage_count INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uniq_guest_daily_usage (date_key, client_identifier)
);
