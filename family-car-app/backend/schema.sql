-- Family Car Management System - Database Schema
-- MySQL 8.0+

-- Create database
CREATE DATABASE IF NOT EXISTS family_car_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE family_car_db;

-- ============================================
-- Table: cgroups
-- ============================================
CREATE TABLE IF NOT EXISTS cgroups (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    car_model VARCHAR(100) DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- Table: users
-- ============================================
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    group_id INT NOT NULL,
    username VARCHAR(50) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    is_admin BOOLEAN DEFAULT FALSE,
    fuel_balance DECIMAL(10,2) DEFAULT 0.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (group_id) REFERENCES cgroups(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    INDEX idx_username (username),
    INDEX idx_group_id (group_id),
    INDEX idx_is_admin (is_admin)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- Table: reservations
-- ============================================
CREATE TABLE IF NOT EXISTS reservations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    group_id INT NOT NULL,
    start_time DATETIME NOT NULL,
    end_time DATETIME NOT NULL,
    status ENUM('pending', 'approved', 'completed', 'cancelled') DEFAULT 'pending',
    notes TEXT DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    FOREIGN KEY (group_id) REFERENCES cgroups(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    
    INDEX idx_group_time (group_id, start_time, end_time),
    INDEX idx_user_id (user_id),
    INDEX idx_status (status),
    INDEX idx_start_time (start_time),
    
    CONSTRAINT chk_end_after_start CHECK (end_time > start_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- Table: fuel_logs
-- ============================================
CREATE TABLE IF NOT EXISTS fuel_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    reservation_id INT NOT NULL,
    user_id INT NOT NULL,
    fuel_before DECIMAL(5,2) NOT NULL COMMENT 'Fuel level before (0-100%)',
    fuel_after DECIMAL(5,2) NOT NULL COMMENT 'Fuel level after (0-100%)',
    fuel_added_liters DECIMAL(6,2) DEFAULT 0.00 COMMENT 'Fuel added during trip',
    cost_paid DECIMAL(8,2) DEFAULT 0.00 COMMENT 'Cost paid for fuel',
    logged_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (reservation_id) REFERENCES reservations(id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    
    INDEX idx_reservation_id (reservation_id),
    INDEX idx_user_id (user_id),
    INDEX idx_logged_at (logged_at),
    
    CONSTRAINT chk_fuel_range CHECK (fuel_before >= 0 AND fuel_before <= 100 AND fuel_after >= 0 AND fuel_after <= 100),
    CONSTRAINT chk_fuel_added CHECK (fuel_added_liters >= 0),
    CONSTRAINT chk_cost_paid CHECK (cost_paid >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- Table: rules
-- ============================================
CREATE TABLE IF NOT EXISTS rules (
    id INT AUTO_INCREMENT PRIMARY KEY,
    group_id INT NOT NULL,
    rule_type VARCHAR(50) NOT NULL COMMENT 'Type: min_fuel_level, max_reservation_hours, etc.',
    rule_value VARCHAR(255) NOT NULL COMMENT 'Value for the rule',
    description TEXT DEFAULT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (group_id) REFERENCES cgroups(id) ON DELETE CASCADE ON UPDATE CASCADE,
    
    INDEX idx_group_type (group_id, rule_type, is_active),
    INDEX idx_rule_type (rule_type),
    
    UNIQUE KEY unique_active_rule (group_id, rule_type, is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- Trigger: Update fuel_balance after fuel_log insert
-- ============================================
DELIMITER //

CREATE TRIGGER trg_update_fuel_balance_insert
AFTER INSERT ON fuel_logs
FOR EACH ROW
BEGIN
    DECLARE fuel_consumed DECIMAL(10,2);
    DECLARE fuel_added DECIMAL(10,2);
    DECLARE net_fuel DECIMAL(10,2);
    
    -- Calculate fuel consumed (negative) and added (positive)
    SET fuel_consumed = NEW.fuel_before - NEW.fuel_after;
    SET fuel_added = NEW.fuel_added_liters / 100.0 * 50; -- Assuming 50L tank, convert liters to %
    SET net_fuel = fuel_consumed - fuel_added;
    
    -- Update user's fuel balance
    UPDATE users 
    SET fuel_balance = fuel_balance + NEW.cost_paid - (net_fuel * 1.5) -- $1.5 per liter equivalent
    WHERE id = NEW.user_id;
END//

DELIMITER ;

-- ============================================
-- Seed Data (Optional - for development)
-- ============================================

-- Insert a default group
INSERT INTO cgroups (name, car_model) VALUES 
('Smith Family', 'Toyota Camry 2020');

-- Insert default admin user (password: admin123)
-- Password hash generated with bcrypt
INSERT INTO users (group_id, username, password_hash, full_name, is_admin) VALUES 
(1, 'admin', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5lJ3qVGvLqVSu', 'Admin User', TRUE);

-- Insert sample regular users (password: user123)
INSERT INTO users (group_id, username, password_hash, full_name, is_admin) VALUES 
(1, 'john', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5lJ3qVGvLqVSu', 'John Smith', FALSE),
(1, 'jane', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5lJ3qVGvLqVSu', 'Jane Smith', FALSE);

-- Insert default rules
INSERT INTO rules (group_id, rule_type, rule_value, description) VALUES
(1, 'min_fuel_level', '25', 'Minimum fuel level when returning the car (%)'),
(1, 'max_reservation_hours', '24', 'Maximum reservation duration in hours'),
(1, 'advance_booking_days', '30', 'How many days in advance users can book'),
(1, 'admin_approval_required', 'false', 'Whether reservations require admin approval');

-- ============================================
-- Useful Queries for Development
-- ============================================

-- Check for overlapping reservations
-- SELECT * FROM reservations 
-- WHERE group_id = ? 
--   AND status NOT IN ('cancelled')
--   AND (
--     (start_time <= ? AND end_time > ?) OR 
--     (start_time < ? AND end_time >= ?) OR
--     (start_time >= ? AND end_time <= ?)
--   );

-- Get user's fuel balance summary
-- SELECT 
--     u.full_name,
--     u.fuel_balance,
--     COUNT(fl.id) as total_trips,
--     SUM(fl.fuel_added_liters) as total_fuel_added,
--     SUM(fl.cost_paid) as total_paid
-- FROM users u
-- LEFT JOIN fuel_logs fl ON u.id = fl.user_id
-- WHERE u.group_id = ?
-- GROUP BY u.id;
