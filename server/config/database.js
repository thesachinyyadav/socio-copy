import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create database connection
const dbPath = path.join(__dirname, '..', 'data', 'socio-copy.db');
const db = new Database(dbPath);

// Enable foreign keys
db.pragma('foreign_keys = ON');

// Initialize database with schema
export function initializeDatabase() {
  // Users table
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY DEFAULT (hex(randomblob(16))),
      auth_uuid TEXT UNIQUE,
      email TEXT UNIQUE NOT NULL,
      name TEXT,
      avatar_url TEXT,
      is_organiser BOOLEAN DEFAULT 0,
      course TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Events table
  db.exec(`
    CREATE TABLE IF NOT EXISTS events (
      id TEXT PRIMARY KEY DEFAULT (hex(randomblob(16))),
      event_id TEXT UNIQUE NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      event_date DATE,
      event_time TIME,
      end_date DATE,
      venue TEXT,
      category TEXT,
      department_access TEXT, -- JSON string for array
      claims_applicable BOOLEAN DEFAULT 0,
      registration_fee REAL,
      participants_per_team INTEGER,
      max_participants INTEGER,
      event_image_url TEXT,
      banner_url TEXT,
      pdf_url TEXT,
      rules TEXT, -- JSON string
      schedule TEXT, -- JSON string
      prizes TEXT, -- JSON string for array
      organizer_email TEXT,
      organizer_phone TEXT,
      whatsapp_invite_link TEXT,
      organizing_dept TEXT,
      fest TEXT,
      created_by TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      registration_deadline DATETIME,
      total_participants INTEGER DEFAULT 0
    )
  `);

  // Fests table (fixing table name from 'fest' to 'fests')
  db.exec(`
    CREATE TABLE IF NOT EXISTS fests (
      id TEXT PRIMARY KEY DEFAULT (hex(randomblob(16))),
      fest_id TEXT UNIQUE NOT NULL,
      fest_title TEXT NOT NULL,
      description TEXT,
      opening_date DATE,
      closing_date DATE,
      fest_image_url TEXT,
      organizing_dept TEXT,
      department_access TEXT, -- JSON string for array
      category TEXT,
      contact_email TEXT,
      contact_phone TEXT,
      event_heads TEXT, -- JSON string for array
      created_by TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Registrations table
  db.exec(`
    CREATE TABLE IF NOT EXISTS registrations (
      id TEXT PRIMARY KEY DEFAULT (hex(randomblob(16))),
      registration_id TEXT UNIQUE NOT NULL,
      event_id TEXT,
      user_email TEXT,
      registration_type TEXT CHECK (registration_type IN ('individual', 'team')),
      individual_name TEXT,
      individual_email TEXT,
      individual_register_number TEXT,
      team_name TEXT,
      team_leader_name TEXT,
      team_leader_email TEXT,
      team_leader_register_number TEXT,
      teammates TEXT, -- JSON string
      qr_code_data TEXT, -- QR code payload for attendance scanning
      qr_code_generated_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (event_id) REFERENCES events(event_id)
    )
  `);

  // Attendance status table
  db.exec(`
    CREATE TABLE IF NOT EXISTS attendance_status (
      id TEXT PRIMARY KEY DEFAULT (hex(randomblob(16))),
      registration_id TEXT,
      event_id TEXT,
      status TEXT CHECK (status IN ('attended', 'absent')),
      marked_at DATETIME,
      marked_by TEXT,
      UNIQUE(registration_id),
      FOREIGN KEY (registration_id) REFERENCES registrations(id),
      FOREIGN KEY (event_id) REFERENCES events(event_id)
    )
  `);

  // Notifications table
  db.exec(`
    CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY DEFAULT (hex(randomblob(16))),
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      type TEXT CHECK (type IN ('info', 'success', 'warning', 'error')),
      event_id TEXT,
      event_title TEXT,
      action_url TEXT,
      recipient_email TEXT NOT NULL,
      is_read BOOLEAN DEFAULT 0,
      read_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // QR scan logs table for audit trail
  db.exec(`
    CREATE TABLE IF NOT EXISTS qr_scan_logs (
      id TEXT PRIMARY KEY DEFAULT (hex(randomblob(16))),
      registration_id TEXT,
      event_id TEXT,
      scanned_by TEXT,
      scan_timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      scan_result TEXT CHECK (scan_result IN ('success', 'invalid', 'duplicate', 'expired')),
      scanner_info TEXT, -- JSON string with device/browser info
      FOREIGN KEY (registration_id) REFERENCES registrations(id),
      FOREIGN KEY (event_id) REFERENCES events(event_id)
    )
  `);

  console.log('Database initialized successfully');

  // Run migrations
  runMigrations();
}

// Migration function to handle schema updates
function runMigrations() {
  // Check if auth_uuid column exists, if not add it
  try {
    const columns = db.pragma("table_info(users)");
    const hasAuthUuid = columns.some(col => col.name === 'auth_uuid');
    
    if (!hasAuthUuid) {
      console.log('Adding auth_uuid column to users table...');
      // Add column without UNIQUE constraint first
      db.exec('ALTER TABLE users ADD COLUMN auth_uuid TEXT');
      console.log('auth_uuid column added successfully');
      
      // Note: We'll handle uniqueness at the application level since SQLite
      // doesn't allow adding UNIQUE constraint to existing table with data
    }
  } catch (error) {
    console.error('Migration error for users table:', error);
  }

  // Check if max_participants column exists in events table, if not add it
  try {
    const eventColumns = db.pragma("table_info(events)");
    const hasMaxParticipants = eventColumns.some(col => col.name === 'max_participants');
    
    if (!hasMaxParticipants) {
      console.log('Adding max_participants column to events table...');
      db.exec('ALTER TABLE events ADD COLUMN max_participants INTEGER');
      console.log('max_participants column added successfully');
    }
  } catch (error) {
    console.error('Migration error for events table:', error);
  }
}

export default db;