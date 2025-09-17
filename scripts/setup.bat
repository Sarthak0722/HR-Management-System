@echo off
echo 🚀 Setting up HR Management System...

REM Check if pnpm is installed
pnpm --version >nul 2>&1
if errorlevel 1 (
    echo ❌ pnpm is not installed. Please install pnpm first:
    echo npm install -g pnpm
    pause
    exit /b 1
)

REM Check if Docker is installed
docker --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Docker is not installed. Please install Docker first.
    pause
    exit /b 1
)

REM Check if Docker Compose is installed
docker-compose --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Docker Compose is not installed. Please install Docker Compose first.
    pause
    exit /b 1
)

REM Copy environment file
if not exist .env (
    echo 📝 Creating .env file from template...
    copy env.example .env
    echo ⚠️  Please update .env file with your configuration before proceeding.
    echo    Especially set your GROQ_API_KEY for the RAG service to work.
    pause
)

REM Install dependencies
echo 📦 Installing dependencies...
pnpm install

REM Generate Prisma client
echo 🔧 Generating Prisma client...
pnpm --filter auth-service db:generate

REM Start database
echo 🐘 Starting PostgreSQL database...
docker-compose up -d postgres

REM Wait for database to be ready
echo ⏳ Waiting for database to be ready...
timeout /t 10 /nobreak >nul

REM Run migrations
echo 🗄️  Running database migrations...
pnpm --filter auth-service db:migrate

REM Seed database
echo 🌱 Seeding database...
pnpm --filter auth-service db:seed

echo ✅ Setup complete!
echo.
echo 🎉 You can now start the application:
echo    Development mode: pnpm dev
echo    Docker mode: docker-compose up -d
echo.
echo 📚 Access points:
echo    Frontend: http://localhost:3000
echo    Auth Service API: http://localhost:3001/docs
echo    HR Service API: http://localhost:3002/docs
echo    Employee Service API: http://localhost:3003/docs
echo    RAG Service API: http://localhost:3004/docs
echo.
echo 🔐 Demo credentials:
echo    HR: hr@company.com / hr123456
echo    Employee: employee@company.com / emp123456
pause
