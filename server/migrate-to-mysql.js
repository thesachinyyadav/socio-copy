import { createConnection } from 'mysql2/promise';
import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// SQLite connection
const sqliteDbPath = path.join(__dirname, 'data', 'socio-copy.db');

async function migrateData() {
  let sqliteDb = null;
  let mysqlConnection = null;

  try {
    console.log('🚀 Starting data migration from SQLite to MySQL...');

    // Check if SQLite database exists
    try {
      sqliteDb = new Database(sqliteDbPath);
      console.log('✅ Connected to SQLite database');
    } catch (error) {
      console.log('ℹ️  No SQLite database found. Skipping data migration.');
      return;
    }

    // Connect to MySQL
    mysqlConnection = await createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'socio_db',
    });
    console.log('✅ Connected to MySQL database');

    // Migrate users table
    console.log('👥 Migrating users...');
    const users = sqliteDb.prepare('SELECT * FROM users').all();
    if (users.length > 0) {
      for (const user of users) {
        try {
          await mysqlConnection.execute(`
            INSERT INTO users (id, auth_uuid, email, name, avatar_url, is_organiser, course, register_number, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE
            auth_uuid = VALUES(auth_uuid),
            name = VALUES(name),
            avatar_url = VALUES(avatar_url),
            is_organiser = VALUES(is_organiser),
            course = VALUES(course),
            register_number = VALUES(register_number)
          `, [
            user.id,
            user.auth_uuid,
            user.email,
            user.name,
            user.avatar_url,
            user.is_organiser ? true : false,
            user.course,
            user.register_number,
            user.created_at
          ]);
        } catch (error) {
          console.warn(`⚠️  Warning migrating user ${user.email}:`, error.message);
        }
      }
      console.log(`✅ Migrated ${users.length} users`);
    }

    // Migrate events table
    console.log('📅 Migrating events...');
    const events = sqliteDb.prepare('SELECT * FROM events').all();
    if (events.length > 0) {
      for (const event of events) {
        try {
          await mysqlConnection.execute(`
            INSERT INTO events (
              id, event_id, title, description, event_date, event_time, end_date, venue, 
              category, department_access, claims_applicable, registration_fee, 
              participants_per_team, max_participants, event_image_url, banner_url, pdf_url,
              contact_email, contact_phone, event_heads, created_by, created_at
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE
            title = VALUES(title),
            description = VALUES(description),
            event_date = VALUES(event_date),
            event_time = VALUES(event_time),
            end_date = VALUES(end_date),
            venue = VALUES(venue),
            category = VALUES(category)
          `, [
            event.id,
            event.event_id,
            event.title,
            event.description,
            event.event_date,
            event.event_time,
            event.end_date,
            event.venue,
            event.category,
            event.department_access ? JSON.parse(event.department_access) : null,
            event.claims_applicable ? true : false,
            event.registration_fee,
            event.participants_per_team,
            event.max_participants,
            event.event_image_url,
            event.banner_url,
            event.pdf_url,
            event.contact_email,
            event.contact_phone,
            event.event_heads ? JSON.parse(event.event_heads) : null,
            event.created_by,
            event.created_at
          ]);
        } catch (error) {
          console.warn(`⚠️  Warning migrating event ${event.title}:`, error.message);
        }
      }
      console.log(`✅ Migrated ${events.length} events`);
    }

    // Migrate registrations table
    console.log('📝 Migrating registrations...');
    const registrations = sqliteDb.prepare('SELECT * FROM registrations').all();
    if (registrations.length > 0) {
      for (const registration of registrations) {
        try {
          await mysqlConnection.execute(`
            INSERT INTO registrations (
              id, registration_id, event_id, user_email, registration_type,
              individual_name, individual_email, individual_register_number,
              team_name, team_leader_name, team_leader_email, team_leader_register_number,
              teammates, qr_code_data, qr_code_generated_at, created_at
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE
            user_email = VALUES(user_email),
            registration_type = VALUES(registration_type)
          `, [
            registration.id,
            registration.registration_id,
            registration.event_id,
            registration.user_email,
            registration.registration_type,
            registration.individual_name,
            registration.individual_email,
            registration.individual_register_number,
            registration.team_name,
            registration.team_leader_name,
            registration.team_leader_email,
            registration.team_leader_register_number,
            registration.teammates ? JSON.parse(registration.teammates) : null,
            registration.qr_code_data,
            registration.qr_code_generated_at,
            registration.created_at
          ]);
        } catch (error) {
          console.warn(`⚠️  Warning migrating registration ${registration.registration_id}:`, error.message);
        }
      }
      console.log(`✅ Migrated ${registrations.length} registrations`);
    }

    // Migrate attendance_status table
    console.log('✅ Migrating attendance status...');
    const attendanceRecords = sqliteDb.prepare('SELECT * FROM attendance_status').all();
    if (attendanceRecords.length > 0) {
      for (const record of attendanceRecords) {
        try {
          await mysqlConnection.execute(`
            INSERT INTO attendance_status (id, registration_id, event_id, status, marked_at, marked_by, created_at)
            VALUES (?, ?, ?, ?, ?, ?, NOW())
            ON DUPLICATE KEY UPDATE
            status = VALUES(status),
            marked_at = VALUES(marked_at),
            marked_by = VALUES(marked_by)
          `, [
            record.id,
            record.registration_id,
            record.event_id,
            record.status || 'absent',
            record.marked_at,
            record.marked_by
          ]);
        } catch (error) {
          console.warn(`⚠️  Warning migrating attendance record:`, error.message);
        }
      }
      console.log(`✅ Migrated ${attendanceRecords.length} attendance records`);
    }

    console.log('🎉 Data migration completed successfully!');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    if (sqliteDb) {
      sqliteDb.close();
    }
    if (mysqlConnection) {
      await mysqlConnection.end();
    }
  }
}

// Run migration if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  migrateData();
}

export { migrateData };