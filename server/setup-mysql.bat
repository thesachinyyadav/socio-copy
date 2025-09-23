@echo off
REM MySQL Setup Script for SOCIO Application
echo 🚀 Setting up MySQL for SOCIO Application...

REM Check if MySQL is installed
where mysql >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ MySQL is not installed. Please install MySQL Server first.
    echo Download from: https://dev.mysql.com/downloads/mysql/
    pause
    exit /b 1
)

REM Check if Node.js is installed
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ Node.js is not installed. Please install Node.js first.
    pause
    exit /b 1
)

echo ✅ MySQL and Node.js are installed.

REM Get database configuration from user
set /p mysql_root_password="Enter MySQL root password: "
set /p db_name="Enter database name (default: socio_db): "
if "%db_name%"=="" set db_name=socio_db

set /p db_user="Enter MySQL username for application (default: socio_user): "
if "%db_user%"=="" set db_user=socio_user

set /p db_password="Enter password for application user: "

echo 📊 Setting up MySQL database...

REM Create SQL script
(
echo CREATE DATABASE IF NOT EXISTS %db_name%;
echo CREATE USER IF NOT EXISTS '%db_user%'@'localhost' IDENTIFIED BY '%db_password%';
echo GRANT ALL PRIVILEGES ON %db_name%.* TO '%db_user%'@'localhost';
echo FLUSH PRIVILEGES;
echo SELECT 'Database and user created successfully!' as message;
) > temp_setup.sql

REM Execute SQL script
mysql -u root -p%mysql_root_password% < temp_setup.sql

if %errorlevel% equ 0 (
    echo ✅ Database setup completed successfully!
    del temp_setup.sql
) else (
    echo ❌ Database setup failed. Please check your MySQL credentials.
    del temp_setup.sql
    pause
    exit /b 1
)

REM Update .env file
echo 📝 Updating .env file...
(
echo # Server Configuration
echo PORT=8000
echo NODE_ENV=development
echo.
echo # MySQL Database Configuration
echo DB_HOST=localhost
echo DB_PORT=3306
echo DB_NAME=%db_name%
echo DB_USER=%db_user%
echo DB_PASSWORD=%db_password%
echo.
echo # File Storage Configuration  
echo UPLOAD_DIR=./uploads
echo.
echo # Supabase Configuration
echo SUPABASE_URL=https://vkappuaapscvteexogtp.supabase.co
echo SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZrYXBwdWFhcHNjdnRlZXhvZ3RwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NjI1NDA5MiwiZXhwIjoyMDYxODMwMDkyfQ.niUv-xWTFnPpCwDP2p1tLAjciaLqA_miH5KrN6UF3u4
) > .env

echo ✅ .env file updated with MySQL configuration!

REM Install dependencies if needed
if not exist "node_modules" (
    echo 📦 Installing Node.js dependencies...
    npm install
)

echo 🎉 MySQL setup completed successfully!
echo.
echo 📋 Next steps:
echo 1. Make sure all your route files are updated to use MySQL queries
echo 2. Run 'npm run dev' to start the server
echo 3. The application will automatically create the required tables
echo.
echo 📊 Database Details:
echo   - Database: %db_name%
echo   - User: %db_user%
echo   - Host: localhost
echo   - Port: 3306

pause