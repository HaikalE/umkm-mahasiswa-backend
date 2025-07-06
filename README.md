# 🚀 UMKM Mahasiswa Backend API

**Comprehensive Backend API untuk Platform UMKM & Mahasiswa Indonesia** - Menghubungkan UMKM dengan talenta mahasiswa untuk kolaborasi dan pertumbuhan bisnis digital.

![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15+-blue.svg)
![Express.js](https://img.shields.io/badge/Express.js-4.18+-lightgrey.svg)
![Socket.io](https://img.shields.io/badge/Socket.io-4.7+-orange.svg)
![Docker](https://img.shields.io/badge/Docker-Ready-blue.svg)
![License](https://img.shields.io/badge/License-MIT-yellow.svg)

---

## 📋 Daftar Isi

- [Overview](#-overview)
- [Features](#-features)
- [Tech Stack](#%EF%B8%8F-tech-stack)
- [Quick Start](#-quick-start)
- [Installation](#-installation)
- [API Documentation](#-api-documentation)
- [Database Schema](#-database-schema)
- [Real-time Features](#-real-time-features)
- [Security](#-security)
- [Testing](#-testing)
- [Deployment](#-deployment)
- [Contributing](#-contributing)

---

## 🌟 Overview

Platform digital yang menghubungkan **UMKM (Usaha Mikro Kecil Menengah)** dengan **mahasiswa** untuk saling mendukung pertumbuhan bisnis dan pengembangan skill. UMKM dapat memposting project dan mencari talenta muda, sementara mahasiswa dapat mencari peluang kerja real-world dan membangun portofolio.

### 🎯 Vision & Mission

**Vision:** Menjadi jembatan digital antara UMKM dan mahasiswa Indonesia untuk saling memberdayakan

**Mission:**
- 📈 Meningkatkan digitalisasi UMKM Indonesia
- 🎓 Memberikan pengalaman kerja nyata bagi mahasiswa
- 🤝 Menciptakan ekosistem kolaborasi yang saling menguntungkan
- 💡 Mendorong inovasi dan entrepreneurship

---

## ✨ Features

### 🏢 UMKM Features
- ✅ **Registrasi & Authentication** - Sistem autentikasi JWT + Firebase
- ✅ **Profil Bisnis Lengkap** - Informasi bisnis, lokasi, kontak
- ✅ **Manajemen Produk/Jasa** - Upload, edit, kelola produk dengan gambar
- ✅ **Project Posting** - Post project/job untuk mahasiswa
- ✅ **Real-time Chat** - Komunikasi langsung dengan mahasiswa
- ✅ **Dashboard Analytics** - Statistik penjualan dan performa
- ✅ **Review System** - Rating dan review dari mahasiswa
- ✅ **Notification System** - Notifikasi real-time untuk aktivitas penting

### 🎓 Mahasiswa Features
- ✅ **Profil Mahasiswa** - Universitas, jurusan, skill, portofolio
- ✅ **Portfolio Management** - Upload dan kelola portfolio works
- ✅ **Project Discovery** - Browse dan cari project opportunities
- ✅ **Application System** - Apply ke project dengan cover letter
- ✅ **Real-time Chat** - Komunikasi dengan UMKM
- ✅ **Skill Showcase** - Tampilkan keahlian dan pengalaman
- ✅ **Achievement Tracking** - Track project completed dan rating

### 🔧 Technical Features
- ✅ **RESTful API** - Endpoints lengkap dan terstruktur
- ✅ **Real-time Messaging** - Socket.io untuk chat real-time
- ✅ **File Management** - Upload gambar/dokumen ke Cloudinary
- ✅ **Search & Filter** - Pencarian advanced dengan multiple filter
- ✅ **Pagination** - Efficient data loading
- ✅ **Rate Limiting** - API protection dari spam
- ✅ **Error Handling** - Comprehensive error management
- ✅ **Input Validation** - Validasi data input yang ketat
- ✅ **Security Headers** - CORS, Helmet, XSS protection

---

## 🛠️ Tech Stack

### Backend Core
- **Runtime**: Node.js 18+
- **Framework**: Express.js 4.18+
- **Database**: PostgreSQL 15+ dengan Sequelize ORM
- **Authentication**: JWT + Firebase Auth
- **Real-time**: Socket.io 4.7+

### External Services
- **File Storage**: Cloudinary
- **Push Notifications**: Firebase FCM
- **Email**: SMTP (Gmail/SendGrid)
- **Monitoring**: Optional (Sentry, New Relic)

### DevOps & Deployment
- **Containerization**: Docker + Docker Compose
- **Reverse Proxy**: Nginx
- **Caching**: Redis (optional)
- **CI/CD**: GitHub Actions ready
- **Environment**: Development, Staging, Production

### Development Tools
- **API Testing**: Jest + Supertest
- **Code Quality**: ESLint, Prettier
- **Documentation**: API docs auto-generated
- **Version Control**: Git dengan pre-commit hooks

---

## 🚀 Quick Start

### Menggunakan Docker (Recommended)

```bash
# Clone repository
git clone https://github.com/HaikalE/umkm-mahasiswa-backend.git
cd umkm-mahasiswa-backend

# Setup environment
cp .env.example .env
# Edit .env dengan konfigurasi Anda

# Deploy dengan Docker
./scripts/deploy.sh development

# API akan berjalan di http://localhost:3000
```

### Manual Installation

```bash
# Clone dan setup
git clone https://github.com/HaikalE/umkm-mahasiswa-backend.git
cd umkm-mahasiswa-backend

# Install dependencies
npm install

# Setup environment
cp .env.example .env

# Setup database
npm run db:create
npm run db:migrate
npm run db:seed

# Start development server
npm run dev
```

---

## 📦 Installation

### Prerequisites

- **Node.js** 18+ dan npm
- **PostgreSQL** 15+
- **Docker** & Docker Compose (untuk containerized deployment)
- **Firebase Project** (untuk authentication)
- **Cloudinary Account** (untuk file storage)

### Step-by-Step Setup

#### 1. **Clone Repository**
```bash
git clone https://github.com/HaikalE/umkm-mahasiswa-backend.git
cd umkm-mahasiswa-backend
```

#### 2. **Environment Setup**
```bash
# Copy environment template
cp .env.example .env

# Edit .env file dengan konfigurasi Anda
nano .env
```

**Konfigurasi Required:**
```env
# Database
DB_HOST=localhost
DB_NAME=umkm_mahasiswa_db
DB_USER=postgres
DB_PASSWORD=your_password

# JWT Secrets
JWT_SECRET=your-super-secret-jwt-key
JWT_REFRESH_SECRET=your-refresh-secret

# Firebase (untuk authentication)
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY=your-private-key
FIREBASE_CLIENT_EMAIL=your-client-email

# Cloudinary (untuk file upload)
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

#### 3. **Database Setup**
```bash
# Install dependencies
npm install

# Create database
npm run db:create

# Run migrations
npm run db:migrate

# Seed with sample data (optional)
npm run db:seed
```

#### 4. **Start Development Server**
```bash
npm run dev
```

🎉 **API akan berjalan di**: `http://localhost:3000`

---

## 📚 API Documentation

### Endpoints Overview

| Service | Endpoint | Description |
|---------|----------|-------------|
| **Auth** | `/api/auth/*` | Authentication & registration |
| **Users** | `/api/users/*` | User profile management |
| **UMKM** | `/api/umkm/*` | UMKM business profiles |
| **Students** | `/api/students/*` | Student profiles & portfolio |
| **Products** | `/api/products/*` | Product/service management |
| **Projects** | `/api/projects/*` | Project posting & management |
| **Applications** | `/api/applications/*` | Job application system |
| **Chat** | `/api/chats/*` | Real-time messaging |
| **Reviews** | `/api/reviews/*` | Rating & review system |
| **Uploads** | `/api/uploads/*` | File upload management |

### Quick Examples

#### Authentication
```bash
# Register new user
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "umkm@example.com",
    "password": "password123",
    "full_name": "Warung Makan Sederhana",
    "user_type": "umkm",
    "phone": "081234567890"
  }'

# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "umkm@example.com",
    "password": "password123"
  }'
```

#### Get Products
```bash
curl "http://localhost:3000/api/products?page=1&limit=10&category=kuliner"
```

#### Create Project (Authenticated)
```bash
curl -X POST http://localhost:3000/api/projects \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Website Development",
    "description": "Need a simple website for my restaurant",
    "category": "web_development",
    "budget_min": 2000000,
    "budget_max": 5000000,
    "duration": 30
  }'
```

### Interactive Documentation
Akses dokumentasi lengkap di: **`http://localhost:3000/api/docs`**

### Demo Accounts
```
UMKM Account:
📧 Email: warung.makan.sederhana@gmail.com
🔑 Password: password123

Student Account:
📧 Email: andi.mahasiswa@gmail.com
🔑 Password: password123
```

---

## 🗄️ Database Schema

### Core Tables

#### **users** - Master user data
```sql
- id (UUID, PK)
- email (String, Unique)
- password (String, Hashed)
- user_type (ENUM: 'umkm', 'student')
- full_name (String)
- phone (String)
- avatar_url (String)
- firebase_uid (String, Unique)
- is_verified, is_active (Boolean)
- created_at, updated_at (Timestamp)
```

#### **umkm_profiles** - UMKM business details
```sql
- id (UUID, PK)
- user_id (UUID, FK → users.id)
- business_name (String)
- business_type (ENUM)
- description (Text)
- address, city, province (String)
- website, instagram, whatsapp (String)
- logo_url, banner_url (String)
- rating (Decimal)
- total_reviews, total_products, total_projects (Integer)
```

#### **student_profiles** - Student academic & skill info
```sql
- id (UUID, PK)
- user_id (UUID, FK → users.id)
- university, faculty, major (String)
- semester, graduation_year (Integer)
- skills (JSON Array)
- bio (Text)
- portfolio_url, github_url, linkedin_url, cv_url (String)
- portfolio_files (JSON Array)
- experience_level (ENUM)
- availability (ENUM)
- rating (Decimal)
```

#### **products** - UMKM products/services
```sql
- id (UUID, PK)
- umkm_id (UUID, FK → users.id)
- name, description (String/Text)
- category (ENUM)
- price, discount_price (Decimal)
- images (JSON Array)
- stock_quantity, min_order (Integer)
- rating (Decimal)
- status (ENUM)
```

#### **projects** - Job/project postings
```sql
- id (UUID, PK)
- umkm_id (UUID, FK → users.id)
- title, description (String/Text)
- category (ENUM)
- budget_min, budget_max (Decimal)
- duration (Integer, days)
- required_skills (JSON Array)
- experience_level (ENUM)
- location_type (ENUM: 'remote', 'onsite', 'hybrid')
- status (ENUM)
- max_applicants, total_applicants (Integer)
```

#### **applications** - Student applications
```sql
- id (UUID, PK)
- project_id (UUID, FK → projects.id)
- student_id (UUID, FK → users.id)
- cover_letter (Text)
- proposed_budget, proposed_duration (Decimal/Integer)
- portfolio_links, attachments (JSON Array)
- status (ENUM: 'pending', 'reviewed', 'accepted', 'rejected')
- umkm_notes (Text)
```

#### **chats** - Real-time messaging
```sql
- id (UUID, PK)
- sender_id, receiver_id (UUID, FK → users.id)
- conversation_id (String)
- message (Text)
- message_type (ENUM: 'text', 'image', 'file')
- file_url, file_name (String)
- is_read, is_deleted (Boolean)
- reply_to_id (UUID, FK → chats.id)
```

#### **reviews** - Rating & review system
```sql
- id (UUID, PK)
- reviewer_id, reviewed_id (UUID, FK → users.id)
- product_id (UUID, FK → products.id, nullable)
- project_id (UUID, FK → projects.id, nullable)
- rating (Integer, 1-5)
- comment (Text)
- review_type (ENUM: 'product', 'service', 'collaboration')
- images (JSON Array)
- is_verified (Boolean)
```

#### **notifications** - Push notification system
```sql
- id (UUID, PK)
- user_id (UUID, FK → users.id)
- title, message (String/Text)
- type (ENUM)
- related_id, related_type (UUID/String)
- is_read (Boolean)
- priority (ENUM)
```

### Database Relationships
- **One-to-One**: User ↔ UmkmProfile, User ↔ StudentProfile
- **One-to-Many**: User → Products, User → Projects, Project → Applications
- **Many-to-Many**: Users ↔ Users (via Chats), Users ↔ Users (via Reviews)

---

## 💬 Real-time Features

### Socket.io Implementation

#### Connection & Authentication
```javascript
// Client-side connection
const socket = io('http://localhost:3000');

// Authenticate user
socket.emit('authenticate', {
  token: 'your_jwt_token'
});

socket.on('authenticated', (data) => {
  console.log('Connected as:', data.user.full_name);
});
```

#### Real-time Chat
```javascript
// Join conversation
socket.emit('join_conversation', {
  receiverId: 'target_user_id'
});

// Send message
socket.emit('send_message', {
  receiverId: 'target_user_id',
  message: 'Hello! I\'m interested in your project',
  messageType: 'text'
});

// Listen for new messages
socket.on('new_message', (message) => {
  console.log('New message:', message);
});

// Typing indicators
socket.emit('typing_start', { receiverId: 'target_user_id' });
socket.on('user_typing', (data) => {
  console.log(`${data.user.full_name} is typing...`);
});
```

#### Online Status
```javascript
// Listen for user online/offline status
socket.on('user_online', (data) => {
  console.log(`${data.user.full_name} is now online`);
});

socket.on('user_offline', (data) => {
  console.log(`User went offline at ${data.lastSeen}`);
});
```

### Supported Features
- ✅ **Real-time Messaging** - Instant chat between UMKM & students
- ✅ **Typing Indicators** - Show when someone is typing
- ✅ **Online Status** - See who's online/offline
- ✅ **Message Read Receipts** - Know when messages are read
- ✅ **File Sharing** - Send images, documents in chat
- ✅ **Message Replies** - Reply to specific messages
- ✅ **Push Notifications** - Notify offline users

---

## 🔐 Security

### Authentication & Authorization
- **JWT Tokens** - Stateless authentication dengan refresh mechanism
- **Firebase Auth** - Google, email/password login
- **Role-based Access** - UMKM vs Student permissions
- **Password Security** - bcrypt hashing dengan salt

### API Security
- **Rate Limiting** - Prevent spam dan brute force attacks
- **CORS Configuration** - Cross-origin request control
- **Helmet.js** - Security headers (XSS, CSRF protection)
- **Input Validation** - Comprehensive validation dengan express-validator
- **SQL Injection Protection** - Sequelize ORM parameterized queries

### File Upload Security
- **File Type Validation** - Whitelist allowed file types
- **File Size Limits** - Prevent large file uploads
- **Virus Scanning** - Cloudinary automatic scanning
- **Secure URLs** - Signed URLs untuk private files

### Data Protection
- **Environment Variables** - Sensitive data di environment files
- **Database Encryption** - Sensitive fields encrypted
- **HTTPS Only** - Force HTTPS in production
- **Privacy Controls** - User data privacy settings

---

## 🧪 Testing

### Test Suite
```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run integration tests
./scripts/test.sh

# Run specific test file
npm test -- tests/auth.test.js
```

### Test Categories
- **Unit Tests** - Individual function testing
- **Integration Tests** - API endpoint testing
- **Security Tests** - Authentication & authorization
- **Performance Tests** - Load testing dengan Artillery

### Sample Test
```javascript
// tests/api.test.js
describe('Authentication API', () => {
  test('should register new user successfully', async () => {
    const response = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'test@example.com',
        password: 'password123',
        full_name: 'Test User',
        user_type: 'student'
      })
      .expect(201);
    
    expect(response.body.success).toBe(true);
    expect(response.body.data.user.email).toBe('test@example.com');
  });
});
```

---

## 🚀 Deployment

### Docker Deployment (Recommended)

#### Development
```bash
# Quick deploy development environment
./scripts/deploy.sh development

# Manual Docker commands
docker-compose up -d
```

#### Production
```bash
# Setup production environment
cp .env.example .env.production
# Edit .env.production dengan konfigurasi production

# Deploy production
./scripts/deploy.sh production

# Manual production deploy
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

### Traditional VPS Deployment

```bash
# Install Node.js dan PostgreSQL
# Clone repository
git clone https://github.com/HaikalE/umkm-mahasiswa-backend.git
cd umkm-mahasiswa-backend

# Install dependencies
npm ci --production

# Setup environment
cp .env.example .env.production
# Edit .env.production

# Setup database
npm run db:create
npm run db:migrate

# Start with PM2
npm install -g pm2
pm2 start src/server.js --name "umkm-api"
pm2 startup
pm2 save
```

### Cloud Platform Deployment

#### Heroku
```bash
# Install Heroku CLI
heroku create umkm-mahasiswa-api
heroku addons:create heroku-postgresql:mini
heroku config:set NODE_ENV=production
# Set other environment variables
git push heroku main
```

#### Railway
```bash
# Connect GitHub repository
# Set environment variables in dashboard
# Deploy automatically on push
```

#### DigitalOcean App Platform
```yaml
# .do/app.yaml
name: umkm-mahasiswa-api
services:
- name: api
  source_dir: /
  github:
    repo: HaikalE/umkm-mahasiswa-backend
    branch: main
  build_command: npm ci
  run_command: npm start
  environment_slug: node-js
  instance_count: 1
  instance_size_slug: basic-xxs
  envs:
  - key: NODE_ENV
    value: production
databases:
- name: db
  engine: PG
  version: "15"
```

### Environment Configuration

#### Development
- Single container setup
- Hot reload enabled
- Debug logging
- Sample data seeded

#### Staging
- Production-like environment
- Limited resources
- Testing data

#### Production
- Optimized containers
- Load balancing
- SSL certificates
- Monitoring enabled
- Backup strategies

---

## 📊 Monitoring & Analytics

### Health Monitoring
```bash
# Health check endpoint
curl http://localhost:3000/health

# Application metrics
curl http://localhost:3000/api/metrics
```

### Logging
```javascript
// Structured logging dengan Winston
const logger = require('./utils/logger');

logger.info('User registered', {
  userId: user.id,
  userType: user.user_type,
  email: user.email
});

logger.error('Database connection failed', {
  error: error.message,
  stack: error.stack
});
```

### Performance Monitoring
- **Response Time** - API endpoint performance
- **Database Queries** - Query execution time
- **Memory Usage** - Application memory consumption
- **Error Rates** - Error frequency dan types

---

## 🤝 Contributing

### Development Workflow

1. **Fork repository**
```bash
git clone https://github.com/YOUR_USERNAME/umkm-mahasiswa-backend.git
cd umkm-mahasiswa-backend
```

2. **Create feature branch**
```bash
git checkout -b feature/amazing-feature
```

3. **Setup development environment**
```bash
./scripts/setup.sh
```

4. **Make changes dan test**
```bash
npm run dev
npm test
./scripts/test.sh
```

5. **Commit dengan conventional format**
```bash
git commit -m "feat: add user profile upload feature"
```

6. **Push dan create PR**
```bash
git push origin feature/amazing-feature
```

### Code Style
- **ESLint** - JavaScript linting
- **Prettier** - Code formatting
- **Conventional Commits** - Commit message format
- **JSDoc** - Function documentation

### Contribution Guidelines
- 🐛 **Bug Reports** - Use issue templates
- ✨ **Feature Requests** - Describe use case
- 📖 **Documentation** - Update docs untuk changes
- 🧪 **Tests** - Add tests untuk new features
- 🔍 **Code Review** - All PRs require review

---

## 📄 License

**MIT License** - Feel free to use for educational dan commercial purposes.

See [LICENSE](LICENSE) file for details.

---

## 📞 Support & Contact

### 🆘 Getting Help
- 📖 **Documentation**: [API Docs](http://localhost:3000/api/docs)
- 🐛 **Bug Reports**: [GitHub Issues](https://github.com/HaikalE/umkm-mahasiswa-backend/issues)
- 💬 **Discussions**: [GitHub Discussions](https://github.com/HaikalE/umkm-mahasiswa-backend/discussions)

### 📧 Contact Information
- **Email**: dev@umkm-mahasiswa.id
- **Instagram**: [@umkm.mahasiswa](https://instagram.com/umkm.mahasiswa)
- **LinkedIn**: [UMKM x Mahasiswa Platform](https://linkedin.com/company/umkm-mahasiswa)

### 🌟 Acknowledgments
- **Contributors** - Thank you untuk semua kontributor
- **Open Source Libraries** - Grateful untuk amazing tools
- **Indonesian Tech Community** - Support dan feedback

---

<div align="center">

**Made with ❤️ for Indonesia 🇮🇩**

*Empowering UMKM and Students Through Technology*

[⭐ Star this repo](https://github.com/HaikalE/umkm-mahasiswa-backend) • [🐛 Report Bug](https://github.com/HaikalE/umkm-mahasiswa-backend/issues) • [✨ Request Feature](https://github.com/HaikalE/umkm-mahasiswa-backend/issues)

</div>