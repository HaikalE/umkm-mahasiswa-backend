# 🚀 UMKM Mahasiswa Backend API

**Comprehensive Backend API untuk Platform UMKM & Mahasiswa Indonesia** - Menghubungkan UMKM dengan talenta mahasiswa untuk kolaborasi dan pertumbuhan bisnis digital.

![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15+-blue.svg)
![Express.js](https://img.shields.io/badge/Express.js-4.18+-lightgrey.svg)
![Socket.io](https://img.shields.io/badge/Socket.io-4.7+-orange.svg)
![Docker](https://img.shields.io/badge/Docker-Ready-blue.svg)
![License](https://img.shields.io/badge/License-MIT-yellow.svg)

---

## ✨ **LATEST UPDATES - Enhanced Student Application Management** ✨

### 🚀 **NEW: Comprehensive Student APIs - v1.1.0**
- **✅ ENHANCED**: `GET /api/students/my-applications` - Advanced filtering and search
- **✅ NEW**: `GET /api/students/applications/stats` - Application statistics dashboard
- **✅ NEW**: `GET /api/students/applications/history` - Time-based application history
- **✅ NEW**: `GET /api/students/applications/:id/details` - Detailed application info
- **✅ NEW**: `GET /api/students/active-project/payment` - Payment tracking for active projects
- **✅ NEW**: `GET /api/students/profile/completion` - Profile completion percentage
- **✅ NEW**: `GET /api/students/earnings/summary` - Earnings and payment summary
- **✅ NEW**: `GET /api/students/performance/metrics` - Performance analytics
- **✅ ENHANCED**: Better error handling and response formatting across all endpoints

### 🔧 **Backend Integration Improvements**
- **🛠️ Fixed**: Student dashboard API responses now include all required data
- **🔄 Enhanced**: Application withdrawal functionality with proper status tracking
- **📊 Improved**: Real-time data synchronization between frontend and backend
- **🔒 Secured**: Enhanced validation and error handling for all new endpoints
- **⚡ Optimized**: Better query performance with proper database indexing

### 📱 **Frontend-Backend Sync**
Perfect integration with the new **MyApplicationsPage** component:
- Real-time application status updates
- Advanced filtering and search capabilities
- Comprehensive application details modal
- Seamless error handling and user feedback

---

## 🚀 Quick Start (Development)

### **Prerequisites**
- Node.js 18+ dan npm
- PostgreSQL 15+
- Git

### **Langkah Cepat (5 menit setup) ⚡**

```bash
# 1. Clone repository
git clone https://github.com/HaikalE/umkm-mahasiswa-backend.git
cd umkm-mahasiswa-backend

# 2. Auto setup (RECOMMENDED)
chmod +x setup.sh
./setup.sh

# 3. Setup database (pastikan PostgreSQL sudah running)
createdb umkm_mahasiswa_db
# Edit .env file - ganti DB_PASSWORD dengan password PostgreSQL kamu

# 4. Start development server
npm run dev

# ✅ API akan berjalan di http://localhost:3000
```

### **Manual Setup (Alternative)**

```bash
# Install dependencies
npm install

# Setup environment
cp .env.development .env
# Edit .env - ganti DB_PASSWORD dengan password PostgreSQL kamu

# Create uploads directory
mkdir uploads

# Setup database
npm run db:create  # optional
npm run db:migrate # optional
npm run db:seed    # optional - untuk data sample

# Start development server
npm run dev
```

---

## ⚠️ TROUBLESHOOTING - APP CRASH FIXES

### ❌ **Problem: App Crashes After "Cloudinary not configured" Message**

**✅ FIXED! Updated: 08 Juli 2025**

The crash issue has been **completely resolved**. If you're still experiencing crashes:

#### **Solution 1: Update to Latest Version**
```bash
git pull origin main
npm install
npm run dev
```

#### **Solution 2: Check Error Messages**
The app now provides detailed error messages. Look for:
- ❌ Database connection errors
- ❌ Missing model files
- ❌ Environment configuration issues

#### **Solution 3: Quick Fix Commands**
```bash
# Create .env file if missing
cp .env.development .env

# Ensure uploads directory exists
mkdir -p uploads

# Check database connection
createdb umkm_mahasiswa_db

# Start with verbose logging
npm run dev
```

### 🗄️ **Database Connection Issues**

**Error: "Unable to start server: Database connection failed"**

#### **Quick Fix:**
```bash
# 1. Start PostgreSQL service
# Windows: Start PostgreSQL service from Services
# macOS: brew services start postgresql  
# Linux: sudo systemctl start postgresql

# 2. Create database
createdb umkm_mahasiswa_db

# 3. Test connection
psql -U postgres -h localhost -d umkm_mahasiswa_db

# 4. Update .env file
# Edit DB_PASSWORD in .env file
```

#### **For Ubuntu/Debian:**
```bash
sudo systemctl start postgresql
sudo -u postgres psql
CREATE DATABASE umkm_mahasiswa_db;
\q
```

#### **For Windows (XAMPP/PostgreSQL installer):**
- Start PostgreSQL service from Control Panel
- Use pgAdmin or command line to create database

### 🔐 **Services Configuration (All Optional)**

**✅ Firebase is OPTIONAL** - The app works with JWT authentication only:
- Default .env disables Firebase
- Local JWT authentication works perfectly

**✅ Cloudinary is OPTIONAL** - The app uses local file storage by default:
- Files stored in `uploads/` directory
- Accessible at `http://localhost:3000/uploads/filename`

### 🔧 **Common Error Solutions**

| Error Message | Solution |
|---------------|----------|
| `MODULE_NOT_FOUND` | Run `npm install` |
| `ECONNREFUSED` | Start PostgreSQL service |
| `database "umkm_mahasiswa_db" does not exist` | Run `createdb umkm_mahasiswa_db` |
| `permission denied` | Run `chmod +x setup.sh` |
| `Port 3000 already in use` | Kill process: `sudo lsof -t -i tcp:3000 \| xargs kill -9` |
| `Firebase initialization failed` | Normal - Firebase is optional in development |
| `Cloudinary not configured` | Normal - Using local storage instead |

### 🆘 **Still Having Issues?**

1. **Check the logs** - Look for specific error messages
2. **Test endpoints** - Visit `http://localhost:3000/health`
3. **Verify setup** - Run `./setup.sh` again
4. **Create an issue** - [GitHub Issues](https://github.com/HaikalE/umkm-mahasiswa-backend/issues)

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

### 🎓 **Enhanced Student Features - NEW!**
- ✅ **Profil Mahasiswa** - Universitas, jurusan, skill, portofolio
- ✅ **Portfolio Management** - Upload dan kelola portfolio works
- ✅ **Project Discovery** - Browse dan cari project opportunities
- ✅ **📊 Advanced Application System** - Enhanced tracking dan management
- ✅ **📈 Application Statistics** - Real-time stats dashboard
- ✅ **🔍 Smart Search & Filter** - Advanced application filtering
- ✅ **💰 Payment Tracking** - Monitor earnings dan payment status
- ✅ **📊 Performance Metrics** - Track success rate dan ratings
- ✅ **🎯 Profile Completion** - Automated completion tracking
- ✅ **Real-time Chat** - Komunikasi dengan UMKM
- ✅ **Skill Showcase** - Tampilkan keahlian dan pengalaman
- ✅ **Achievement Tracking** - Track project completed dan rating

### 🔧 Technical Features
- ✅ **RESTful API** - Endpoints lengkap dan terstruktur
- ✅ **Real-time Messaging** - Socket.io untuk chat real-time
- ✅ **File Management** - Upload gambar/dokumen ke Cloudinary atau local storage
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
- **Authentication**: JWT + Firebase Auth (optional)
- **Real-time**: Socket.io 4.7+

### External Services
- **File Storage**: Cloudinary (optional - fallback ke local storage)
- **Push Notifications**: Firebase FCM (optional)
- **Email**: SMTP (Gmail/SendGrid) (optional)
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

## 📦 Installation

### Prerequisites

- **Node.js** 18+ dan npm
- **PostgreSQL** 15+
- **Docker** & Docker Compose (untuk containerized deployment)
- **Firebase Project** (optional - untuk authentication)
- **Cloudinary Account** (optional - untuk file storage)

### Step-by-Step Setup

#### 1. **Clone Repository**
```bash
git clone https://github.com/HaikalE/umkm-mahasiswa-backend.git
cd umkm-mahasiswa-backend
```

#### 2. **Environment Setup**
```bash
# Copy environment template
cp .env.development .env

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

# Firebase (untuk authentication) - Optional
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY=your-private-key
FIREBASE_CLIENT_EMAIL=your-client-email

# Cloudinary (untuk file upload) - Optional
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

#### 3. **Database Setup**
```bash
# Install dependencies
npm install

# Create database
createdb umkm_mahasiswa_db

# Run migrations (optional)
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

## 📚 **Enhanced API Documentation**

### **🎓 Student Endpoints - ENHANCED**

#### **Application Management**
```bash
# Get my applications with advanced filtering
GET /api/students/my-applications?status=pending&search=web&page=1&limit=10

# Get application statistics
GET /api/students/applications/stats

# Get application history
GET /api/students/applications/history?timeframe=month

# Get detailed application info
GET /api/students/applications/:id/details
```

#### **Dashboard & Analytics**
```bash
# Enhanced dashboard stats
GET /api/students/dashboard/stats

# Get opportunities with smart matching
GET /api/students/dashboard/opportunities

# Profile completion tracking
GET /api/students/profile/completion

# Performance metrics
GET /api/students/performance/metrics

# Earnings summary
GET /api/students/earnings/summary
```

#### **Active Project Management**
```bash
# Get active project details
GET /api/students/active-project/details

# Get project payment information
GET /api/students/active-project/payment

# Upload project deliverables
POST /api/students/active-project/deliverables

# Request project completion
POST /api/students/active-project/request-completion
```

### Traditional Endpoints Overview

| Service | Endpoint | Description |
|---------|----------|-------------|
| **Auth** | `/api/auth/*` | Authentication & registration |
| **Users** | `/api/users/*` | User profile management |
| **UMKM** | `/api/umkm/*` | UMKM business profiles |
| **Students** | `/api/students/*` | **Enhanced** student management |
| **Products** | `/api/products/*` | Product/service management |
| **Projects** | `/api/projects/*` | Project posting & management |
| **Applications** | `/api/applications/*` | Job application system |
| **Chat** | `/api/chats/*` | Real-time messaging |
| **Reviews** | `/api/reviews/*` | Rating & review system |
| **Uploads** | `/api/uploads/*` | File upload management |

### Quick Examples

#### Enhanced Student Application Tracking
```bash
# Get application stats
curl -H "Authorization: Bearer YOUR_TOKEN" \
     "http://localhost:3000/api/students/applications/stats"

# Response:
{
  "success": true,
  "data": {
    "pending": 5,
    "accepted": 2,
    "rejected": 1,
    "withdrawn": 0,
    "total": 8
  }
}
```

#### Get My Applications with Search
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
     "http://localhost:3000/api/students/my-applications?search=website&status=pending"
```

#### Profile Completion Tracking
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
     "http://localhost:3000/api/students/profile/completion"

# Response:
{
  "success": true,
  "data": {
    "completion_percentage": 85,
    "completed_fields": 85,
    "total_fields": 100
  }
}
```

### Interactive Documentation
Akses dokumentasi lengkap di: **`http://localhost:3000/api/docs`**

### Test Enhanced Endpoints
```bash
# Health check
curl http://localhost:3000/health

# API info
curl http://localhost:3000/api

# Test student dashboard (requires auth)
curl -H "Authorization: Bearer YOUR_TOKEN" \
     http://localhost:3000/api/students/dashboard/stats
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

#### **student_profiles** - Enhanced student info
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
- total_projects_completed (Integer) -- Enhanced tracking
- portfolio_views (Integer) -- New field
```

#### **applications** - Enhanced application tracking
```sql
- id (UUID, PK)
- project_id (UUID, FK → projects.id)
- student_id (UUID, FK → users.id)
- cover_letter (Text)
- proposed_budget (Decimal)
- proposed_duration (Integer)
- status (ENUM: 'pending', 'accepted', 'rejected', 'withdrawn', 'completed')
- review_notes (Text) -- UMKM feedback
- student_notes (Text) -- Student notes
- applied_at, reviewed_at (Timestamp)
```

#### **payments** - New payment tracking
```sql
- id (UUID, PK)
- project_id (UUID, FK → projects.id)
- student_id (UUID, FK → users.id)
- umkm_id (UUID, FK → users.id)
- amount (Decimal)
- status (ENUM: 'pending', 'completed', 'failed')
- payment_method (String)
- transaction_id (String)
- created_at, updated_at (Timestamp)
```

### Database Relationships
- **One-to-One**: User ↔ UmkmProfile, User ↔ StudentProfile
- **One-to-Many**: User → Products, User → Projects, Project → Applications, Project → Payments
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
```

### Supported Features
- ✅ **Real-time Messaging** - Instant chat between UMKM & students
- ✅ **Typing Indicators** - Show when someone is typing
- ✅ **Online Status** - See who's online/offline
- ✅ **Message Read Receipts** - Know when messages are read
- ✅ **File Sharing** - Send images, documents in chat
- ✅ **Push Notifications** - Notify offline users

---

## 🔐 Security

### Authentication & Authorization
- **JWT Tokens** - Stateless authentication dengan refresh mechanism
- **Firebase Auth** - Google, email/password login (optional)
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
- **Secure URLs** - Signed URLs untuk private files

---

## 🧪 Testing

### Test Suite
```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run integration tests
npm run test:integration

# Run specific test file
npm test -- tests/auth.test.js

# Test new student endpoints
npm test -- tests/students.test.js
```

### Test Categories
- **Unit Tests** - Individual function testing
- **Integration Tests** - API endpoint testing
- **Security Tests** - Authentication & authorization
- **Performance Tests** - Load testing

---

## 🚀 Deployment

### Docker Deployment (Recommended)

#### Development
```bash
# Quick deploy development environment
docker-compose up -d

# Or use deployment script
./scripts/deploy.sh development
```

#### Production
```bash
# Setup production environment
cp .env.development .env.production
# Edit .env.production dengan konfigurasi production

# Deploy production
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
cp .env.development .env.production
# Edit .env.production

# Setup database
createdb umkm_mahasiswa_db

# Start with PM2
npm install -g pm2
pm2 start src/server.js --name "umkm-api"
pm2 startup
pm2 save
```

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
./setup.sh
```

4. **Make changes dan test**
```bash
npm run dev
npm test
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

---

## 🚨 **CHANGELOG - v1.1.0 (Current Release)**

### ✅ **Major Features Added**
- **📊 Enhanced Student Dashboard**: Comprehensive application management
- **🔍 Advanced Search & Filter**: Smart application filtering system
- **📈 Analytics & Statistics**: Real-time dashboard metrics
- **💰 Payment Tracking**: Earnings and payment status monitoring
- **🎯 Profile Completion**: Automated profile completion tracking
- **⚡ Performance Metrics**: Success rate and rating analytics

### 🛠️ **Technical Improvements**
- **API Response Optimization**: Faster query performance
- **Error Handling Enhancement**: Better error messages and handling
- **Database Query Optimization**: Improved query efficiency
- **Validation Enhancement**: Stronger input validation across all endpoints
- **Security Improvements**: Enhanced authentication and authorization

### 🔗 **Frontend Integration**
- **Perfect Sync**: Seamless integration with MyApplicationsPage component
- **Real-time Updates**: Live status synchronization
- **Enhanced Error Handling**: User-friendly error feedback
- **Responsive API Design**: Optimized for mobile and desktop

---

<div align="center">

**Made with ❤️ for Indonesia 🇮🇩**

*Empowering UMKM and Students Through Technology*

[⭐ Star this repo](https://github.com/HaikalE/umkm-mahasiswa-backend) • [🐛 Report Bug](https://github.com/HaikalE/umkm-mahasiswa-backend/issues) • [✨ Request Feature](https://github.com/HaikalE/umkm-mahasiswa-backend/issues)

</div>