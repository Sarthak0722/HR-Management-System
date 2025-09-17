# HR Management System (HRMS)

A comprehensive microservices-based HR Management System built with Node.js, Express, TypeScript, React, and Docker. Features include employee management, leave tracking, HR policy Q&A with AI, and role-based access control.

## 🏗️ Architecture

This project follows a microservices architecture with the following services:

- **auth-service**: JWT-based authentication and user management
- **hr-service**: Employee CRUD operations and leave approval
- **employee-service**: Employee profile and leave request management
- **rag-service**: AI-powered HR policy Q&A using Groq LLM
- **frontend**: React + TypeScript web application
- **postgres**: PostgreSQL database

## 🚀 Features

### Authentication & Authorization
- JWT-based authentication with HTTP-only cookies
- Role-based access control (HR vs Employee)
- Secure password hashing with bcrypt
- Session management

### Employee Management (HR)
- Create, read, update, delete employees
- Employee statistics and department breakdown
- Bulk operations support

### Leave Management
- Request, approve, reject leave applications
- Multiple leave types (sick, vacation, personal, maternity, paternity)
- Leave status tracking and history
- Overlap detection and validation

### AI-Powered HR Assistant
- RAG (Retrieval-Augmented Generation) pipeline
- HR policy Q&A using Groq LLM API
- Semantic search with sentence transformers
- Confidence scoring and source attribution

### Frontend Features
- Modern React + TypeScript interface
- Responsive design with Tailwind CSS
- Role-based dashboard routing
- Real-time notifications with react-hot-toast
- State management with Zustand

## 🛠️ Tech Stack

### Backend
- **Node.js** with **Express.js**
- **TypeScript** for type safety
- **Prisma** ORM with PostgreSQL
- **JWT** for authentication
- **Winston** + **Morgan** for logging
- **Swagger** for API documentation
- **Zod** for validation

### Frontend
- **React 18** with **TypeScript**
- **React Router** for navigation
- **Tailwind CSS** for styling
- **Zustand** for state management
- **React Hook Form** with **Zod** validation
- **Axios** for API calls
- **Lucide React** for icons

### AI/ML
- **Groq LLM API** for text generation
- **@xenova/transformers** for embeddings
- **Sentence Transformers** for semantic search
- **In-memory vector storage** for embeddings

### DevOps
- **Docker** and **Docker Compose**
- **pnpm** workspaces for monorepo management
- **ESLint** + **Prettier** for code quality

## 📋 Prerequisites

- Node.js 18+ 
- pnpm 8+
- Docker and Docker Compose
- Groq API key (for RAG service)

## 🚀 Quick Start

### 1. Clone the Repository
```bash
git clone <repository-url>
cd HRMS2
```

### 2. Environment Setup
Create a `.env` file in the root directory:
```env
# Database
DATABASE_URL=postgresql://hrms_user:hrms_password@localhost:5432/hrms

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-in-production

# Groq API (for RAG service)
GROQ_API_KEY=your-groq-api-key

# Service URLs
AUTH_SERVICE_URL=http://localhost:3001
HR_SERVICE_URL=http://localhost:3002
EMPLOYEE_SERVICE_URL=http://localhost:3003
RAG_SERVICE_URL=http://localhost:3004
FRONTEND_URL=http://localhost:3000
```

### 3. Install Dependencies
```bash
pnpm install
```

### 4. Database Setup
```bash
# Generate Prisma client
pnpm --filter auth-service db:generate

# Run migrations
pnpm --filter auth-service db:migrate

# Seed database
pnpm --filter auth-service db:seed
```

### 5. Start with Docker Compose
```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f
```

### 6. Alternative: Development Mode
```bash
# Start all services in development mode
pnpm dev
```

## 🔧 Development

### Project Structure
```
HRMS2/
├── services/
│   ├── auth-service/          # Authentication service
│   ├── hr-service/           # HR management service
│   ├── employee-service/     # Employee self-service
│   └── rag-service/          # AI Q&A service
├── frontend/                 # React frontend
├── docker-compose.yml        # Docker orchestration
├── package.json             # Root package.json
└── README.md
```

### Available Scripts
```bash
# Development
pnpm dev                     # Start all services in dev mode
pnpm build                   # Build all services
pnpm lint                    # Lint all services
pnpm format                  # Format code with Prettier

# Docker
pnpm docker:up               # Start with Docker Compose
pnpm docker:down             # Stop Docker Compose

# Database
pnpm db:migrate              # Run Prisma migrations
```

### API Documentation
Each service provides Swagger documentation:
- Auth Service: http://localhost:3001/docs
- HR Service: http://localhost:3002/docs
- Employee Service: http://localhost:3003/docs
- RAG Service: http://localhost:3004/docs

## 🔐 Authentication

### Demo Credentials
- **HR User**: hr@company.com / hr123456
- **Employee User**: employee@company.com / emp123456

### JWT Token
- Stored in HTTP-only cookies
- 7-day expiration
- Role-based access control
- Automatic refresh handling

## 🤖 AI Features

### RAG Pipeline
1. **Embedding Generation**: HR policies are embedded using sentence transformers
2. **Vector Storage**: Embeddings stored in-memory with metadata
3. **Semantic Search**: User queries are embedded and matched against policy embeddings
4. **LLM Generation**: Relevant policies are sent to Groq LLM for answer generation
5. **Source Attribution**: Answers include confidence scores and source policies

### HR Policies Dataset
The system includes 10 comprehensive HR policies covering:
- Leave management
- Work hours and attendance
- Code of conduct
- Performance management
- Benefits and compensation
- IT and security
- Dress code
- Training and development
- Termination and resignation
- Health and safety

## 📊 Database Schema

### Core Entities
- **User**: Authentication and role management
- **EmployeeProfile**: Employee personal and professional information
- **Leave**: Leave requests with approval workflow

### Relationships
- User 1:1 EmployeeProfile
- User 1:N Leave (employee can have multiple leave requests)
- Leave N:1 User (approved by HR user)

## 🐳 Docker Configuration

### Services
- **postgres**: PostgreSQL 15 with persistent volume
- **auth-service**: Port 3001
- **hr-service**: Port 3002
- **employee-service**: Port 3003
- **rag-service**: Port 3004
- **frontend**: Port 3000

### Networking
All services communicate through a custom Docker network (`hrms-network`) with service discovery.

## 🔍 Monitoring & Logging

### Logging
- **Winston** for structured logging
- **Morgan** for HTTP request logging
- Log files: `logs/combined.log`, `logs/error.log`
- Console output in development

### Health Checks
Each service provides health endpoints:
- `/health` - Basic health status
- Service-specific health checks for dependencies

## 🧪 Testing

### API Testing
Use the Swagger documentation or tools like Postman/Insomnia to test API endpoints.

### Frontend Testing
```bash
cd frontend
pnpm test
```

## 🚀 Deployment

### Production Considerations
1. **Environment Variables**: Update all secrets and URLs
2. **Database**: Use managed PostgreSQL service
3. **Security**: Enable HTTPS, update CORS settings
4. **Monitoring**: Add application monitoring (e.g., Prometheus, Grafana)
5. **Scaling**: Consider horizontal scaling for high-traffic scenarios

### Docker Production
```bash
# Build production images
docker-compose -f docker-compose.prod.yml build

# Deploy
docker-compose -f docker-compose.prod.yml up -d
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📝 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions:
1. Check the API documentation
2. Review the logs for error details
3. Ensure all environment variables are set
4. Verify Docker services are running

## 🔄 Roadmap

- [ ] Complete HR and Employee management interfaces
- [ ] Add email notifications
- [ ] Implement file upload for documents
- [ ] Add advanced reporting and analytics
- [ ] Implement real-time notifications with WebSockets
- [ ] Add mobile app support
- [ ] Implement audit logging
- [ ] Add multi-tenant support
