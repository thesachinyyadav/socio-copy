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

  console.log('Database initialized successfully');
}

export default db;