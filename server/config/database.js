import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

// Create connection pool for better performance
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'socio_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Initialize database with schema
export async function initializeDatabase() {
  try {
    console.log('🔍 Checking MySQL connection...');
    
    // Test connection first
    const connection = await pool.getConnection();
    await connection.ping();
    connection.release();
    console.log('✅ MySQL connection successful');

    // Create database if it doesn't exist
    const setupConnection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
    });

    await setupConnection.execute(`CREATE DATABASE IF NOT EXISTS \`${process.env.DB_NAME || 'socio_db'}\``);
    await setupConnection.end();

    console.log('✅ Database created/verified successfully');

    // Create tables
    await createTables();
    console.log('✅ Database initialized successfully with MySQL');
  } catch (error) {
    console.error('❌ Database initialization error:', error.message);
    
    if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.error('🔧 Please check your MySQL credentials in .env file');
      console.error('💡 Or run the setup script: npm run setup-mysql');
    } else if (error.code === 'ECONNREFUSED') {
      console.error('🔧 MySQL server is not running. Please start MySQL service.');
    }
    
    throw error;
  }
}

async function createTables() {
  try {
    // Users table
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
        auth_uuid VARCHAR(255) UNIQUE,
        email VARCHAR(255) UNIQUE NOT NULL,
        name VARCHAR(255),
        avatar_url TEXT,
        is_organiser BOOLEAN DEFAULT FALSE,
        course VARCHAR(255),
        register_number VARCHAR(100),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_email (email),
        INDEX idx_auth_uuid (auth_uuid)
      )
    `);

    // Events table
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS events (
        id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
        event_id VARCHAR(255) UNIQUE NOT NULL,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        event_date DATE,
        event_time TIME,
        end_date DATE,
        venue VARCHAR(255),
        category VARCHAR(100),
        department_access JSON,
        claims_applicable BOOLEAN DEFAULT FALSE,
        registration_fee DECIMAL(10,2),
        participants_per_team INTEGER,
        max_participants INTEGER,
        event_image_url TEXT,
        banner_url TEXT,
        pdf_url TEXT,
        contact_email VARCHAR(255),
        contact_phone VARCHAR(20),
        event_heads JSON,
        created_by VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_event_id (event_id),
        INDEX idx_category (category),
        INDEX idx_event_date (event_date)
      )
    `);

    // Registrations table
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS registrations (
        id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
        registration_id VARCHAR(255) UNIQUE NOT NULL,
        event_id VARCHAR(255),
        user_email VARCHAR(255),
        registration_type ENUM('individual', 'team'),
        individual_name VARCHAR(255),
        individual_email VARCHAR(255),
        individual_register_number VARCHAR(100),
        team_name VARCHAR(255),
        team_leader_name VARCHAR(255),
        team_leader_email VARCHAR(255),
        team_leader_register_number VARCHAR(100),
        teammates JSON,
        qr_code_data TEXT,
        qr_code_generated_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_registration_id (registration_id),
        INDEX idx_event_id (event_id),
        FOREIGN KEY (event_id) REFERENCES events(event_id) ON DELETE CASCADE
      )
    `);

    // Attendance status table
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS attendance_status (
        id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
        registration_id VARCHAR(255),
        event_id VARCHAR(255),
        status ENUM('attended', 'absent') DEFAULT 'absent',
        marked_at TIMESTAMP,
        marked_by VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY unique_attendance (registration_id),
        INDEX idx_event_id (event_id),
        FOREIGN KEY (registration_id) REFERENCES registrations(registration_id) ON DELETE CASCADE,
        FOREIGN KEY (event_id) REFERENCES events(event_id) ON DELETE CASCADE
      )
    `);

    // Notifications table
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS notifications (
        id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
        title VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        type ENUM('info', 'success', 'warning', 'error') DEFAULT 'info',
        event_id VARCHAR(255),
        event_title VARCHAR(255),
        action_url TEXT,
        recipient_email VARCHAR(255) NOT NULL,
        is_read BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_recipient (recipient_email),
        INDEX idx_event_id (event_id),
        INDEX idx_created_at (created_at)
      )
    `);

    // QR scan logs table
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS qr_scan_logs (
        id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
        registration_id VARCHAR(255),
        event_id VARCHAR(255),
        scan_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        scan_result ENUM('success', 'invalid', 'duplicate', 'expired') DEFAULT 'success',
        scanner_info JSON,
        INDEX idx_registration_id (registration_id),
        INDEX idx_event_id (event_id),
        INDEX idx_scan_timestamp (scan_timestamp),
        FOREIGN KEY (registration_id) REFERENCES registrations(registration_id) ON DELETE CASCADE,
        FOREIGN KEY (event_id) REFERENCES events(event_id) ON DELETE CASCADE
      )
    `);

    console.log('All tables created successfully');
  } catch (error) {
    console.error('Error creating tables:', error);
    throw error;
  }
}

// Helper function to execute queries
export async function executeQuery(query, params = []) {
  try {
    const [results] = await pool.execute(query, params);
    return results;
  } catch (error) {
    console.error('Query execution error:', error);
    throw error;
  }
}

// Helper function to get a single row
export async function queryOne(query, params = []) {
  try {
    const [results] = await pool.execute(query, params);
    return results[0] || null;
  } catch (error) {
    console.error('Query one execution error:', error);
    throw error;
  }
}

// Helper function to get all rows
export async function queryAll(query, params = []) {
  try {
    const [results] = await pool.execute(query, params);
    return results;
  } catch (error) {
    console.error('Query all execution error:', error);
    throw error;
  }
}

// Function to close the connection pool
export async function closeDatabase() {
  try {
    await pool.end();
    console.log('Database connection pool closed');
  } catch (error) {
    console.error('Error closing database:', error);
  }
}

export { pool };
export default pool;