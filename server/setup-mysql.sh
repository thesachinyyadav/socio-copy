#!/bin/bash

# MySQL Setup Script for SOCIO Application
echo "🚀 Setting up MySQL for SOCIO Application..."

# Check if MySQL is installed
if ! command -v mysql &> /dev/null; then
    echo "❌ MySQL is not installed. Please install MySQL Server first."
    echo "Download from: https://dev.mysql.com/downloads/mysql/"
    exit 1
fi

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

echo "✅ MySQL and Node.js are installed."

# Create database and user
echo "📊 Setting up MySQL database..."

read -p "Enter MySQL root password: " -s mysql_root_password
echo

read -p "Enter database name (default: socio_db): " db_name
db_name=${db_name:-socio_db}

read -p "Enter MySQL username for application (default: socio_user): " db_user
db_user=${db_user:-socio_user}

read -p "Enter password for application user: " -s db_password
echo

# Create database and user
mysql -u root -p${mysql_root_password} <<EOF
CREATE DATABASE IF NOT EXISTS ${db_name};
CREATE USER IF NOT EXISTS '${db_user}'@'localhost' IDENTIFIED BY '${db_password}';
GRANT ALL PRIVILEGES ON ${db_name}.* TO '${db_user}'@'localhost';
FLUSH PRIVILEGES;
SELECT 'Database and user created successfully!' as message;
EOF

if [ $? -eq 0 ]; then
    echo "✅ Database setup completed successfully!"
else
    echo "❌ Database setup failed. Please check your MySQL credentials."
    exit 1
fi

# Update .env file
echo "📝 Updating .env file..."
cat > .env << EOF
# Server Configuration
PORT=8000
NODE_ENV=development

# MySQL Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_NAME=${db_name}
DB_USER=${db_user}
DB_PASSWORD=${db_password}

# File Storage Configuration  
UPLOAD_DIR=./uploads

# Supabase Configuration
SUPABASE_URL=https://vkappuaapscvteexogtp.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZrYXBwdWFhcHNjdnRlZXhvZ3RwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NjI1NDA5MiwiZXhwIjoyMDYxODMwMDkyfQ.niUv-xWTFnPpCwDP2p1tLAjciaLqA_miH5KrN6UF3u4
EOF

echo "✅ .env file updated with MySQL configuration!"

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing Node.js dependencies..."
    npm install
fi

echo "🎉 MySQL setup completed successfully!"
echo ""
echo "📋 Next steps:"
echo "1. Make sure all your route files are updated to use MySQL queries"
echo "2. Run 'npm run dev' to start the server"
echo "3. The application will automatically create the required tables"
echo ""
echo "📊 Database Details:"
echo "  - Database: ${db_name}"
echo "  - User: ${db_user}"
echo "  - Host: localhost"
echo "  - Port: 3306"