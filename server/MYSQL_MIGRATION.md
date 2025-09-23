# MySQL Migration Guide for SOCIO Application

This guide will help you migrate your SOCIO application from SQLite to MySQL.

## Prerequisites

1. **MySQL Server** installed and running
   - Download from: https://dev.mysql.com/downloads/mysql/
   - Ensure MySQL service is running

2. **Node.js** and **npm** installed
   - Your existing Node.js setup should work

## Quick Setup (Recommended)

### For Windows:
```cmd
cd server
setup-mysql.bat
```

### For Linux/Mac:
```bash
cd server
chmod +x setup-mysql.sh
./setup-mysql.sh
```

## Manual Setup

### 1. Install MySQL Dependencies
```bash
npm install mysql2
```

### 2. Create MySQL Database and User

Log into MySQL as root:
```sql
mysql -u root -p
```

Create database and user:
```sql
CREATE DATABASE socio_db;
CREATE USER 'socio_user'@'localhost' IDENTIFIED BY 'your_password';
GRANT ALL PRIVILEGES ON socio_db.* TO 'socio_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

### 3. Update Environment Variables

Edit your `.env` file in the server directory:
```env
# Server Configuration
PORT=8000
NODE_ENV=development

# MySQL Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_NAME=socio_db
DB_USER=socio_user
DB_PASSWORD=your_password

# File Storage Configuration  
UPLOAD_DIR=./uploads

# Supabase Configuration (keep existing values)
SUPABASE_URL=https://vkappuaapscvteexogtp.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_existing_key
```

### 4. Migrate Existing Data (Optional)

If you have existing SQLite data to migrate:
```bash
node migrate-to-mysql.js
```

### 5. Start the Server
```bash
npm run dev
```

## What Changed

### Database Configuration
- **Old**: SQLite with `better-sqlite3`
- **New**: MySQL with `mysql2`
- **Location**: `server/config/database.js`

### Key Differences

1. **Connection Model**:
   - SQLite: Direct file access
   - MySQL: Network connection with connection pooling

2. **Data Types**:
   - SQLite: Dynamic typing
   - MySQL: Strict typing with proper data types

3. **JSON Support**:
   - SQLite: JSON as TEXT
   - MySQL: Native JSON data type

4. **Boolean Values**:
   - SQLite: 0/1 integers
   - MySQL: TRUE/FALSE booleans

5. **Auto-increment IDs**:
   - SQLite: `hex(randomblob(16))`
   - MySQL: `UUID()` function

### Query Changes

All database queries have been updated from prepared statements to async/await:

**Old (SQLite)**:
```javascript
const stmt = db.prepare("SELECT * FROM users");
const users = stmt.all();
```

**New (MySQL)**:
```javascript
const users = await queryAll("SELECT * FROM users");
```

## File Changes Made

### Updated Files:
- ✅ `server/config/database.js` - New MySQL configuration
- ✅ `server/routes/userRoutes.js` - Updated to async MySQL queries
- ✅ `server/index.js` - Updated to use MySQL database initialization
- ✅ `server/.env` - Updated with MySQL configuration

### Files That Need Updates:
- ⏳ `server/routes/eventRoutes.js`
- ⏳ `server/routes/eventRoutes_secured.js`
- ⏳ `server/routes/registrationRoutes.js`
- ⏳ `server/routes/attendanceRoutes.js`
- ⏳ `server/routes/notificationRoutes.js`
- ⏳ `server/routes/festRoutes.js`

## Testing

After setup, test the connection:

1. Start the server: `npm run dev`
2. Check console for: "Database initialized successfully with MySQL"
3. Test API endpoints to ensure they work

## Troubleshooting

### Common Issues:

1. **Connection Refused**:
   - Ensure MySQL server is running
   - Check host, port, username, password in .env

2. **Permission Denied**:
   - Verify database user has correct permissions
   - Re-run GRANT statements

3. **Table Not Found**:
   - Ensure database initialization completed
   - Check for error messages in console

4. **Data Type Errors**:
   - MySQL is stricter with data types than SQLite
   - Check for null/undefined values in queries

### Getting Help:
If you encounter issues:
1. Check server console for error messages
2. Verify MySQL server is running: `mysql -u socio_user -p socio_db`
3. Test connection with a simple query

## Performance Benefits

MySQL offers several advantages over SQLite:
- Better concurrent access
- Improved performance for large datasets
- Better suited for production environments
- Built-in replication and backup features
- More advanced indexing capabilities

## Next Steps

After successful migration:
1. ✅ Test all API endpoints
2. ✅ Verify data integrity
3. ✅ Update remaining route files
4. ✅ Test authentication flow
5. ✅ Test file upload functionality
6. ✅ Deploy to production environment