# 🏗️ TECHNICAL SPECIFICATION - KCP ORGANICS

## 📋 Document Overview
**Project:** KCP Organics E-Commerce Platform  
**Version:** 1.0 (Production Ready)  
**Last Updated:** May 12, 2026  
**Status:** Complete Architecture Defined  

---

## 1. SYSTEM ARCHITECTURE

### 🔄 Request Flow Diagram

```
┌──────────────────┐
│   User Browser   │
│  (Frontend HTML) │
└────────┬─────────┘
         │ HTTP Request
         ▼
┌──────────────────────────────────────┐
│      Express.js Server (Port 5000)   │
├──────────────────────────────────────┤
│ ✓ Route Handler                      │
│ ✓ Authentication Middleware          │
│ ✓ Validation Middleware              │
│ ✓ Error Handling                     │
└────────┬─────────────────────────────┘
         │ Database Query
         ▼
┌──────────────────────────────────────┐
│  MongoDB Database                    │
│  (Mongoose ODM)                      │
├──────────────────────────────────────┤
│ ✓ Collections (Users, Products, etc) │
│ ✓ Indexes for Performance            │
│ ✓ Data Validation Schemas            │
└──────────────────────────────────────┘
```

### 🌐 Data Flow: Shopping Cart → Order

```
1. USER ADDS ITEM TO CART
   Frontend JS → localStorage (cart data)
   
2. USER CHECKOUT
   Frontend Form Submit → POST /api/orders
   
3. BACKEND PROCESSES ORDER
   ├─ Validate user authenticated
   ├─ Validate stock available
   ├─ Create order document
   ├─ Decrement product stock
   ├─ Clear user cart
   └─ Send notifications
   
4. SEND NOTIFICATIONS
   ├─ WhatsApp (admin + customer)
   ├─ Email (customer)
   ├─ Telegram (admin)
   └─ SMS (optional)
   
5. RESPONSE TO FRONTEND
   Order confirmation → Display receipt
```

---

## 2. DATABASE SCHEMA

### 📊 Collections & Documents

#### **Users Collection**
```javascript
{
  _id: ObjectId,
  email: "user@example.com",           // Unique, indexed
  password: "$2b$10$hashed...",        // bcrypt hashed
  firstName: "John",
  lastName: "Doe",
  phone: "+91-9876543210",
  addresses: [
    {
      type: "home",
      street: "123 Main St",
      city: "Bangalore",
      state: "Karnataka",
      postal: "560001",
      country: "India",
      isDefault: true
    }
  ],
  wishlists: [ObjectId],               // Reference to wishlist IDs
  createdAt: ISODate("2026-01-15"),
  lastLogin: ISODate("2026-05-12"),
  role: "customer"                     // customer|admin
}
```

#### **Products Collection**
```javascript
{
  _id: ObjectId,
  name: "Organic Honey",               // Unique, indexed
  category: "honey",                   // Indexed
  description: "Pure raw honey...",
  price: 299.99,
  currency: "INR",
  stock: 150,                          // Current inventory
  sku: "HONEY-001",                    // Unique product code
  images: [
    {
      url: "/uploads/honey-1.jpg",
      alt: "Honey in jar",
      isDefault: true
    }
  ],
  rating: 4.5,
  reviews: 23,
  tags: ["organic", "raw", "raw"],
  specifications: {
    weight: "500ml",
    type: "Raw",
    source: "Karnataka"
  },
  createdAt: ISODate("2025-01-01"),
  updatedAt: ISODate("2026-05-12")
}
```

#### **Orders Collection**
```javascript
{
  _id: ObjectId,
  orderNumber: "ORD-2026-001234",      // Unique, user-facing
  userId: ObjectId,                    // Reference to user
  items: [
    {
      productId: ObjectId,
      productName: "Organic Honey",
      quantity: 2,
      price: 299.99,
      subtotal: 599.98
    }
  ],
  shippingAddress: {
    name: "John Doe",
    street: "123 Main St",
    city: "Bangalore",
    postal: "560001",
    phone: "+91-9876543210"
  },
  totalAmount: 599.98,
  shippingCost: 50,
  discount: 0,
  finalTotal: 649.98,
  paymentMethod: "credit_card",
  paymentStatus: "completed",          // pending|completed|failed
  orderStatus: "processing",           // processing|shipped|delivered|cancelled
  trackingNumber: "TRK123456789",
  timeline: [
    {
      status: "processing",
      timestamp: ISODate("2026-05-12"),
      note: "Order confirmed"
    },
    {
      status: "shipped",
      timestamp: ISODate("2026-05-13"),
      note: "Dispatched from warehouse"
    }
  ],
  createdAt: ISODate("2026-05-12"),
  updatedAt: ISODate("2026-05-13"),
  estimatedDelivery: ISODate("2026-05-17")
}
```

#### **Cart Collection** (Alternative to localStorage)
```javascript
{
  _id: ObjectId,
  userId: ObjectId,                    // Unique per user
  items: [
    {
      productId: ObjectId,
      quantity: 2,
      addedAt: ISODate("2026-05-12")
    }
  ],
  totalItems: 2,
  lastModified: ISODate("2026-05-12")
}
```

#### **Reviews Collection**
```javascript
{
  _id: ObjectId,
  productId: ObjectId,
  userId: ObjectId,
  rating: 5,                           // 1-5 stars
  title: "Excellent product!",
  comment: "Great quality honey, highly recommended",
  verified: true,                      // Verified purchase
  helpful: {
    yes: 12,
    no: 2
  },
  createdAt: ISODate("2026-04-15"),
  updatedAt: ISODate("2026-05-12")
}
```

#### **Videos Collection**
```javascript
{
  _id: ObjectId,
  title: "Company Overview",
  category: "about-us",                // about-us|home
  url: "https://youtube.com/watch?v=...",
  thumbnailUrl: "https://...",
  description: "Learn about KCP Organics",
  duration: 300,                       // Seconds
  views: 1523,
  isActive: true,
  order: 1,
  createdAt: ISODate("2026-05-01"),
  createdBy: ObjectId                  // Reference to admin
}
```

#### **Coupons Collection**
```javascript
{
  _id: ObjectId,
  code: "ORGANIC20",                   // Unique, uppercase
  discountType: "percentage",          // percentage|fixed
  discountValue: 20,                   // 20% or ₹20
  maxUsage: 100,
  currentUsage: 42,
  minOrderAmount: 500,
  expiryDate: ISODate("2026-12-31"),
  isActive: true,
  createdAt: ISODate("2026-05-01")
}
```

#### **Messages Collection**
```javascript
{
  _id: ObjectId,
  senderName: "John Doe",
  senderEmail: "john@example.com",
  senderPhone: "+91-9876543210",
  subject: "Product inquiry",
  message: "I want to know more about...",
  priority: "normal",                  // low|normal|high|urgent
  status: "new",                       // new|read|responded|closed
  response: "Thank you for reaching out...",
  respondedBy: ObjectId,               // Reference to admin
  respondedAt: ISODate("2026-05-12"),
  createdAt: ISODate("2026-05-12")
}
```

#### **Wishlists Collection**
```javascript
{
  _id: ObjectId,
  userId: ObjectId,
  products: [ObjectId],                // Array of product IDs
  createdAt: ISODate("2026-05-01"),
  updatedAt: ISODate("2026-05-12")
}
```

#### **Admins Collection**
```javascript
{
  _id: ObjectId,
  email: "admin@kcporganics.com",
  password: "$2b$10$hashed...",
  role: "admin",
  permissions: [
    "manage_products",
    "manage_orders",
    "manage_users",
    "manage_videos",
    "view_analytics"
  ],
  lastLogin: ISODate("2026-05-12"),
  createdAt: ISODate("2025-01-01")
}
```

---

## 3. API ENDPOINTS

### 🔐 Authentication Endpoints

#### POST `/api/auth/signup`
**Purpose:** User registration  
**Authentication:** None required

**Request:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "firstName": "John",
  "lastName": "Doe",
  "phone": "+91-9876543210"
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Account created successfully",
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "_id": "507f1f77bcf86cd799439011",
    "email": "user@example.com"
  }
}
```

---

#### POST `/api/auth/login`
**Purpose:** User login  
**Authentication:** None required

**Request:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "_id": "507f1f77bcf86cd799439011",
    "email": "user@example.com",
    "firstName": "John"
  }
}
```

---

### 📦 Product Endpoints

#### GET `/api/products`
**Purpose:** List all products with filtering  
**Authentication:** None required  
**Query Parameters:**
- `category=honey` - Filter by category
- `page=1` - Pagination (default: 1, 20 items per page)
- `sort=price` - Sort by: name, price, rating
- `search=organic` - Search keyword

**Response (200):**
```json
{
  "success": true,
  "total": 234,
  "page": 1,
  "pages": 12,
  "products": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "name": "Organic Honey",
      "price": 299.99,
      "stock": 150,
      "category": "honey",
      "image": "/uploads/honey.jpg",
      "rating": 4.5,
      "reviews": 23
    }
  ]
}
```

---

#### GET `/api/products/:id`
**Purpose:** Get single product details  
**Authentication:** None required

**Response (200):**
```json
{
  "success": true,
  "product": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "Organic Honey",
    "price": 299.99,
    "stock": 150,
    "category": "honey",
    "description": "Pure raw organic honey...",
    "images": [...],
    "rating": 4.5,
    "reviews": [...]
  }
}
```

---

#### GET `/api/products/stock/by-name`
**Purpose:** Check stock for specific product  
**Authentication:** None required  
**Query:**
- `name=Organic Honey` - Product name

**Response (200):**
```json
{
  "success": true,
  "product": "Organic Honey",
  "stock": 150,
  "status": "in-stock"  // in-stock|low-stock|out-of-stock
}
```

---

#### POST `/api/products` (Admin Only)
**Purpose:** Create new product  
**Authentication:** Required (admin token)

**Request:**
```json
{
  "name": "New Product",
  "category": "honey",
  "price": 399.99,
  "stock": 100,
  "description": "Product description",
  "images": ["url1", "url2"]
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Product created",
  "product": { "..." }
}
```

---

#### PUT `/api/products/:id` (Admin Only)
**Purpose:** Update product  
**Authentication:** Required (admin token)

**Response (200):**
```json
{
  "success": true,
  "message": "Product updated",
  "product": { "..." }
}
```

---

#### DELETE `/api/products/:id` (Admin Only)
**Purpose:** Delete product  
**Authentication:** Required (admin token)

**Response (200):**
```json
{
  "success": true,
  "message": "Product deleted"
}
```

---

### 🛒 Cart Endpoints

#### GET `/api/cart`
**Purpose:** Get user's cart  
**Authentication:** Required

**Response (200):**
```json
{
  "success": true,
  "cart": {
    "_id": "507f1f77bcf86cd799439011",
    "items": [
      {
        "productId": "507f1f77bcf86cd799439012",
        "quantity": 2
      }
    ],
    "totalItems": 2
  }
}
```

---

#### POST `/api/cart/add`
**Purpose:** Add item to cart  
**Authentication:** Required

**Request:**
```json
{
  "productId": "507f1f77bcf86cd799439012",
  "quantity": 2
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Item added to cart",
  "cart": { "..." }
}
```

---

### 📋 Order Endpoints

#### POST `/api/orders`
**Purpose:** Create new order  
**Authentication:** Required

**Request:**
```json
{
  "items": [
    {
      "productId": "507f1f77bcf86cd799439012",
      "quantity": 2
    }
  ],
  "shippingAddress": {
    "street": "123 Main St",
    "city": "Bangalore",
    "postal": "560001"
  },
  "paymentMethod": "credit_card"
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Order created successfully",
  "order": {
    "_id": "507f1f77bcf86cd799439011",
    "orderNumber": "ORD-2026-001234",
    "finalTotal": 649.98,
    "orderStatus": "processing"
  }
}
```

---

#### GET `/api/orders/:userId`
**Purpose:** Get user's orders  
**Authentication:** Required

**Response (200):**
```json
{
  "success": true,
  "orders": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "orderNumber": "ORD-2026-001234",
      "finalTotal": 649.98,
      "orderStatus": "processing",
      "createdAt": "2026-05-12T10:30:00Z"
    }
  ]
}
```

---

#### PATCH `/api/orders/:id` (Admin Only)
**Purpose:** Update order status  
**Authentication:** Required (admin token)

**Request:**
```json
{
  "orderStatus": "shipped",
  "trackingNumber": "TRK123456789"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Order updated",
  "order": { "..." }
}
```

---

### ⭐ Review Endpoints

#### POST `/api/reviews`
**Purpose:** Submit product review  
**Authentication:** Required

**Request:**
```json
{
  "productId": "507f1f77bcf86cd799439012",
  "rating": 5,
  "title": "Excellent!",
  "comment": "Great product, highly recommended"
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Review submitted",
  "review": { "..." }
}
```

---

#### GET `/api/reviews/:productId`
**Purpose:** Get product reviews  
**Authentication:** None required

**Response (200):**
```json
{
  "success": true,
  "reviews": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "rating": 5,
      "title": "Excellent!",
      "comment": "Great product...",
      "userName": "John D.",
      "createdAt": "2026-05-10"
    }
  ],
  "averageRating": 4.5,
  "totalReviews": 23
}
```

---

### 🎥 Video Endpoints

#### GET `/api/videos`
**Purpose:** Get videos for About Us or Home  
**Authentication:** None required  
**Query:**
- `category=about-us` - Filter by category

**Response (200):**
```json
{
  "success": true,
  "videos": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "title": "Company Overview",
      "url": "https://youtube.com/watch?v=...",
      "thumbnailUrl": "https://...",
      "views": 1523,
      "duration": 300
    }
  ]
}
```

---

#### POST `/api/videos` (Admin Only)
**Purpose:** Add new video  
**Authentication:** Required (admin token)

**Request:**
```json
{
  "title": "Company Tour",
  "category": "about-us",
  "url": "https://youtube.com/watch?v=...",
  "description": "Tour of our facility"
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Video added",
  "video": { "..." }
}
```

---

### 💬 Message Endpoints

#### POST `/api/messages`
**Purpose:** Submit contact form  
**Authentication:** None required

**Request:**
```json
{
  "senderName": "John Doe",
  "senderEmail": "john@example.com",
  "senderPhone": "+91-9876543210",
  "subject": "Product inquiry",
  "message": "I want to know more about..."
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Message received, we'll respond soon"
}
```

---

#### GET `/api/messages` (Admin Only)
**Purpose:** Get all messages  
**Authentication:** Required (admin token)

**Response (200):**
```json
{
  "success": true,
  "messages": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "senderName": "John Doe",
      "subject": "Product inquiry",
      "status": "new",
      "createdAt": "2026-05-12T10:30:00Z"
    }
  ]
}
```

---

## 4. AUTHENTICATION & SECURITY

### 🔐 JWT Implementation

**How It Works:**
1. User logs in with email/password
2. Server verifies credentials
3. Server creates JWT token with user ID
4. Frontend stores token in localStorage
5. Frontend sends token in Authorization header
6. Server verifies token on each request

**Token Structure:**
```
Header.Payload.Signature
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI1MDdmMWY3N2JjZjg2Y2Q3OTk0MzkwMTEiLCJpYXQiOjE2Mjk2NTc0NDF9.signature
```

**Request with Token:**
```javascript
fetch('/api/orders', {
  headers: {
    'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIs...'
  }
})
```

### 🛡️ Security Measures

| Measure | Implementation |
|---------|-----------------|
| **Password Hashing** | bcryptjs (10 rounds) |
| **HTTPS/TLS** | Enforced in production |
| **CORS** | Configured for frontend domain |
| **Rate Limiting** | 100 requests/minute per IP |
| **Input Validation** | Joi/express-validator |
| **SQL Injection** | MongoDB (not SQL) |
| **XSS Protection** | HTML encoding, CSP headers |
| **CSRF Token** | Generated on form submissions |
| **JWT Secret** | 32-character random string |

---

## 5. ERROR HANDLING

### Standard Error Response Format

```json
{
  "success": false,
  "message": "Error description",
  "error": {
    "code": "INVALID_INPUT",
    "details": ["field1 is required", "field2 must be number"]
  }
}
```

### Common HTTP Status Codes

| Status | Meaning | Example |
|--------|---------|---------|
| **200** | OK | GET /api/products successful |
| **201** | Created | POST /api/orders successful |
| **400** | Bad Request | Missing required fields |
| **401** | Unauthorized | Token expired or missing |
| **403** | Forbidden | Not admin, cannot access |
| **404** | Not Found | Product ID doesn't exist |
| **500** | Server Error | Database connection failed |

---

## 6. PERFORMANCE OPTIMIZATION

### 📊 Database Indexes

```javascript
// Products
db.products.createIndex({ category: 1 })
db.products.createIndex({ name: 1 })
db.products.createIndex({ _id: 1, stock: 1 })

// Orders
db.orders.createIndex({ userId: 1 })
db.orders.createIndex({ orderNumber: 1 })
db.orders.createIndex({ createdAt: -1 })

// Users
db.users.createIndex({ email: 1 }, { unique: true })
```

### 🚀 Caching Strategy

**Frontend (Browser Cache):**
- Product images: 7 days
- Static CSS/JS: 30 days
- API responses: 1 minute

**Backend (Redis Optional):**
- Product list: 5 minutes
- Product details: 10 minutes
- User data: 1 hour

### 📈 Pagination

**Products List:**
- Page size: 20 items
- Default: Page 1
- Query: `GET /api/products?page=2`

---

## 7. DEPLOYMENT SPECIFICATIONS

### 🖥️ Server Requirements

| Component | Minimum | Recommended |
|-----------|---------|-------------|
| **CPU** | 1 core | 2+ cores |
| **RAM** | 512MB | 2GB+ |
| **Storage** | 10GB | 50GB+ (for images) |
| **Node.js** | v14 | v18+ |
| **MongoDB** | v4.4 | v5.0+ |
| **Uptime** | 95% | 99.9%+ |

### 🌍 Hosting Recommendations

**Development:**
- Local machine with MongoDB

**Staging:**
- Render.com free tier or AWS free tier
- MongoDB Atlas free (512MB)

**Production:**
- AWS EC2 (t3.small or t3.medium)
- MongoDB Atlas (paid tier)
- CDN (CloudFront or Cloudflare)
- Email service (SendGrid)

---

## 8. MONITORING & OBSERVABILITY

### 📊 Key Metrics to Track

```
Application:
- Page load time (target: <2s)
- API response time (target: <500ms)
- Error rate (target: <1%)
- Uptime (target: 99.9%)

Database:
- Connection pool usage
- Query performance (p95 < 100ms)
- Database size
- Backup success rate

Security:
- Failed login attempts
- API rate limit violations
- Unauthorized access attempts
```

### 🔔 Alerts to Configure

```
IF uptime < 99% THEN page::ops
IF error_rate > 5% THEN page::ops
IF db_query_time_p95 > 500ms THEN page::ops
IF failed_logins > 50/hour THEN page::security
```

---

## 9. SCALABILITY ROADMAP

**Phase 1 (0-10k visitors/month):**
- Single server, single database
- No caching needed

**Phase 2 (10k-100k visitors/month):**
- Load balancer
- Database read replicas
- Redis caching

**Phase 3 (100k-1M visitors/month):**
- Horizontal scaling (multiple servers)
- Database sharding
- CDN for static content
- Microservices architecture

---

## 10. DISASTER RECOVERY

### 📋 Backup Strategy

**Database:**
- Daily automated backups
- 30-day retention
- Monthly full backups (1-year retention)
- Test restore monthly

**Files/Images:**
- S3 versioning enabled
- Cross-region replication
- Weekly backups to cold storage

### 🔄 Failover Plan

1. Automatic failover to standby database
2. Load balancer redirects traffic
3. Alert team of outage
4. Switch to read-only mode if needed
5. Restore from backup within 1 hour

---

**Document Version:** 1.0  
**Status:** Ready for Implementation  
**Last Review:** May 12, 2026  

