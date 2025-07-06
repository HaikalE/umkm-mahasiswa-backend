# 🚀 UMKM Mahasiswa Platform API Documentation

## Base URL
```
Development: http://localhost:3000/api
Production: https://api.umkm-mahasiswa.id/api
```

## Authentication

This API uses JWT (JSON Web Tokens) for authentication. Include the token in the Authorization header:

```
Authorization: Bearer <your_jwt_token>
```

## Response Format

All API responses follow this standard format:

```json
{
  "success": true,
  "message": "Operation successful",
  "data": {},
  "pagination": {
    "total": 100,
    "page": 1,
    "limit": 10,
    "pages": 10
  }
}
```

## Authentication Endpoints

### Register User
```http
POST /auth/register
```

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "full_name": "John Doe",
  "user_type": "umkm", // or "student"
  "phone": "081234567890"
}
```

**Response:**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "full_name": "John Doe",
      "user_type": "umkm"
    },
    "tokens": {
      "accessToken": "jwt_token",
      "refreshToken": "refresh_token"
    }
  }
}
```

### Login User
```http
POST /auth/login
```

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

### Firebase Authentication
```http
POST /auth/firebase-login
```

**Request Body:**
```json
{
  "firebaseToken": "firebase_id_token",
  "user_type": "student",
  "full_name": "John Doe"
}
```

## User Management

### Get User Profile
```http
GET /users/profile
Authorization: Bearer <token>
```

### Update Profile
```http
PUT /users/profile
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "full_name": "John Doe Updated",
  "phone": "081234567890"
}
```

### Upload Avatar
```http
POST /users/upload-avatar
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

**Form Data:**
- `avatar`: Image file (max 5MB)

## UMKM Endpoints

### Get All UMKM
```http
GET /umkm?page=1&limit=12&business_type=kuliner&city=Jakarta
```

**Query Parameters:**
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 12, max: 100)
- `business_type`: Filter by business type
- `city`: Filter by city
- `search`: Search in business name/description
- `sort`: Sort field (default: created_at)
- `order`: Sort order (ASC|DESC, default: DESC)

### Get UMKM by ID
```http
GET /umkm/:id
```

### Update UMKM Profile
```http
PUT /umkm/profile
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "business_name": "Warung Makan Sederhana",
  "business_type": "kuliner",
  "description": "Warung makan keluarga...",
  "address": "Jl. Sudirman No. 123",
  "city": "Jakarta",
  "province": "DKI Jakarta",
  "website": "https://warungmakan.com",
  "instagram": "@warungmakan",
  "whatsapp": "081234567890"
}
```

## Product Endpoints

### Get All Products
```http
GET /products?page=1&limit=12&category=kuliner&price_min=10000&price_max=100000
```

### Get Product by ID
```http
GET /products/:id
```

### Create Product (UMKM only)
```http
POST /products
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "name": "Nasi Gudeg Yogya",
  "description": "Nasi gudeg khas Yogyakarta...",
  "category": "kuliner",
  "price": 15000,
  "discount_price": 12000,
  "tags": ["gudeg", "yogyakarta", "nasi"],
  "stock_quantity": 50,
  "min_order": 1
}
```

### Upload Product Images
```http
POST /products/:id/images
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

**Form Data:**
- `images`: Image files (max 5 files, 10MB each)

## Project Endpoints

### Get All Projects
```http
GET /projects?page=1&limit=12&category=web_development&experience_level=beginner
```

### Create Project (UMKM only)
```http
POST /projects
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "title": "Pembuatan Website Warung Makan",
  "description": "Membutuhkan website sederhana...",
  "category": "web_development",
  "budget_min": 2000000,
  "budget_max": 3500000,
  "payment_type": "fixed",
  "duration": 30,
  "required_skills": ["HTML", "CSS", "JavaScript"],
  "experience_level": "beginner",
  "location_type": "remote",
  "max_applicants": 10
}
```

## Application Endpoints

### Create Application (Student only)
```http
POST /applications
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "project_id": "project_uuid",
  "cover_letter": "Saya tertarik dengan proyek ini...",
  "proposed_budget": 2500000,
  "proposed_duration": 25,
  "portfolio_links": ["https://portfolio.com"]
}
```

### Get My Applications
```http
GET /applications?status=pending
Authorization: Bearer <token>
```

### Accept Application (UMKM only)
```http
PATCH /applications/:id/accept
Authorization: Bearer <token>
```

## Chat Endpoints

### Get Conversations
```http
GET /chats
Authorization: Bearer <token>
```

### Get Messages
```http
GET /chats/:conversationId/messages?page=1&limit=50
Authorization: Bearer <token>
```

### Send Message
```http
POST /chats/:conversationId/messages
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "message": "Hello, I'm interested in your project",
  "message_type": "text"
}
```

### Upload Chat File
```http
POST /chats/upload
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

## Review Endpoints

### Create Review
```http
POST /reviews
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "reviewed_id": "user_uuid",
  "rating": 5,
  "comment": "Excellent work!",
  "review_type": "collaboration",
  "project_id": "project_uuid"
}
```

### Get Reviews by User
```http
GET /reviews/user/:userId?type=received&page=1
```

## File Upload Endpoints

### Upload Avatar
```http
POST /uploads/avatar
Authorization: Bearer <token>
```

### Upload Product Images
```http
POST /uploads/products
Authorization: Bearer <token>
```

### Upload Portfolio Files
```http
POST /uploads/portfolios
Authorization: Bearer <token>
```

## WebSocket Events (Socket.io)

### Authentication
```javascript
socket.emit('authenticate', {
  token: 'your_jwt_token'
});
```

### Join Conversation
```javascript
socket.emit('join_conversation', {
  receiverId: 'user_uuid'
});
```

### Send Message
```javascript
socket.emit('send_message', {
  receiverId: 'user_uuid',
  message: 'Hello!',
  messageType: 'text'
});
```

### Listen for Events
```javascript
// New message received
socket.on('new_message', (message) => {
  console.log('New message:', message);
});

// User typing
socket.on('user_typing', (data) => {
  console.log('User typing:', data.user.full_name);
});

// User online/offline
socket.on('user_online', (data) => {
  console.log('User online:', data.user);
});
```

## Error Codes

| Code | Description |
|------|-------------|
| 400 | Bad Request - Invalid input |
| 401 | Unauthorized - Invalid or missing token |
| 403 | Forbidden - Insufficient permissions |
| 404 | Not Found - Resource not found |
| 422 | Validation Error - Input validation failed |
| 429 | Too Many Requests - Rate limit exceeded |
| 500 | Internal Server Error |

## Rate Limiting

- General API: 100 requests per 15 minutes per IP
- Authentication: 5 requests per minute per IP
- File uploads: 10 requests per minute per user

## File Upload Limits

| Type | Max Size | Max Files | Formats |
|------|----------|-----------|----------|
| Avatar | 5MB | 1 | jpg, png, webp |
| Product Images | 10MB | 5 | jpg, png, webp |
| Portfolio | 20MB | 10 | jpg, png, pdf, doc |
| Chat Files | 25MB | 1 | All formats |
| Review Images | 5MB | 3 | jpg, png, webp |

## Pagination

All list endpoints support pagination:

**Query Parameters:**
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10, max: 100)

**Response:**
```json
{
  "data": {
    "items": [],
    "pagination": {
      "total": 100,
      "page": 1,
      "limit": 10,
      "pages": 10
    }
  }
}
```

## Search and Filtering

Most endpoints support search and filtering:

**Common Parameters:**
- `search`: Full-text search
- `sort`: Sort field
- `order`: Sort order (ASC|DESC)
- `category`: Filter by category
- `status`: Filter by status

## Testing

Use the demo accounts for testing:

**UMKM Account:**
- Email: `warung.makan.sederhana@gmail.com`
- Password: `password123`

**Student Account:**
- Email: `andi.mahasiswa@gmail.com`
- Password: `password123`

## Support

For API support, contact:
- Email: dev@umkm-mahasiswa.id
- Documentation: http://localhost:3000/api/docs
- Health Check: http://localhost:3000/health