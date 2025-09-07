CREATE DATABASE IF NOT EXISTS sharebite;
USE sharebite;

-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create food table
CREATE TABLE IF NOT EXISTS food (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    quantity VARCHAR(100) NOT NULL,
    user_id INT NOT NULL,
    claimed_by INT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (claimed_by) REFERENCES users(id) ON DELETE SET NULL
);

-- Insert some sample data for testing
INSERT INTO users (name, email, password) VALUES 
('John Donor', 'donor@test.com', '$2a$08$rNMq0j8.t1GzFEqWGkuTVeoKqYnVZGjrA.7h2C1L5.KhWFO2nQm6.'),
('Jane Receiver', 'receiver@test.com', '$2a$08$rNMq0j8.t1GzFEqWGkuTVeoKqYnVZGjrA.7h2C1L5.KhWFO2nQm6.');

-- Sample food donations (password for both test users is "password123")
INSERT INTO food (name, quantity, user_id, claimed_by) VALUES 
('Fresh Vegetables', '5 kg mixed vegetables', 1, NULL),
('Cooked Rice', 'Serves 20 people', 1, NULL),
('Bread Loaves', '10 fresh bread loaves', 1, 2);

-- Show the created tables
SHOW TABLES;

-- Display sample data
SELECT 'Users Table:' as '';
SELECT * FROM users;

SELECT 'Food Table:' as '';
SELECT f.*, u.name as donor_name, claimed.name as claimed_by_name 
FROM food f 
LEFT JOIN users u ON f.user_id = u.id 
LEFT JOIN users claimed ON f.claimed_by = claimed.id;