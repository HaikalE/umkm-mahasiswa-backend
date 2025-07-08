# 🔧 SQL Syntax Error Fix - "syntax error at or near USING"

## Masalah yang Diperbaiki

**Error**: `syntax error at or near "USING"` saat sync model `payments`

Masalah ini terjadi karena konflik constraint, ENUM types, atau index naming pada model Payment yang menyebabkan PostgreSQL tidak bisa membuat constraint dengan benar.

## Root Cause Analysis

### Penyebab Umum SQL Syntax Error:
1. **Unique Constraint Conflict** - Constraint dengan nama sama sudah ada
2. **ENUM Type Conflict** - ENUM types yang bertabrakan
3. **Index Naming Issues** - Index dengan nama yang sudah digunakan
4. **Foreign Key Constraints** - Multiple foreign keys ke table yang sama
5. **PostgreSQL Version Compatibility** - SQL syntax tidak kompatibel

### Error yang Ditemukan:
- Model Payment memiliki unique constraint yang bermasalah
- ENUM types untuk payment_phase, payment_method, dll. conflict
- Index naming tidak unique

## Solusi yang Diterapkan

### 1. **Fixed Payment Model** 🔧
- ❌ Removed problematic unique constraint at index level
- ✅ Replaced with model-level validation
- ✅ Added explicit index naming to prevent conflicts
- ✅ Enhanced hooks for auto-calculation

### 2. **Migration Scripts** 🛠️
- **`migrate-payment-table.js`** - Safe migration for existing databases
- **`reset-payments-table.js`** - Force reset with complete cleanup
- Checks for existing constraints before making changes
- Handles ENUM type conflicts

### 3. **Enhanced Error Diagnosis** 🔍
- Server.js now provides specific error diagnosis
- Targeted solutions for different SQL error types
- Better error messages with actionable recommendations

## Cara Menggunakan

### Opsi 1: Automatic Fix (Recommended)

```bash
# Server akan auto-detect dan fix masalah
npm start
```

Server akan:
- Detect SQL syntax errors
- Provide specific error diagnosis
- Suggest targeted solutions

### Opsi 2: Manual Migration (Safe)

```bash
# Fix payments table specifically
npm run db:fix:payments

# Then start server
npm start
```

### Opsi 3: Force Reset (Emergency Only)

```bash
# WARNING: Akan menghapus semua data payments!
npm run db:reset:payments

# Then start server
npm start
```

## Command Reference

### Database Fix Commands

```bash
# Fix missing columns (projects table)
npm run db:fix
npm run db:migrate:projects

# Fix payments table issues
npm run db:fix:payments
npm run db:migrate:payments

# Emergency reset payments table (DATA LOSS!)
npm run db:reset:payments

# Full database migration
npm run db:migrate

# Check server health
npm run health
```

### Environment Variables untuk Control

```env
# Disable automatic schema changes
DB_DISABLE_ALTER=true

# Force recreation (WARNING: data loss)
DB_FORCE_SYNC=true

# Development mode with auto-sync
NODE_ENV=development
```

## Error Types & Solutions

### 1. **"syntax error at or near USING"**
```bash
# Solution
npm run db:fix:payments
```

### 2. **"column does not exist"**
```bash
# Solution  
npm run db:fix
```

### 3. **"relation does not exist"**
```bash
# Solution
npm run db:migrate
```

### 4. **"already exists" conflicts**
```bash
# Solution
npm run db:reset:payments  # WARNING: data loss
```

### 5. **ENUM type conflicts**
```bash
# Handled automatically by migration scripts
npm run db:fix:payments
```

## Manual Recovery (Emergency)

Jika semua script gagal, lakukan manual recovery:

### 1. Connect ke PostgreSQL
```sql
psql -d your_database_name
```

### 2. Drop problematic table
```sql
DROP TABLE IF EXISTS payments CASCADE;
```

### 3. Clean ENUM types
```sql
DROP TYPE IF EXISTS "enum_payments_payment_phase" CASCADE;
DROP TYPE IF EXISTS "enum_payments_payment_method" CASCADE;
DROP TYPE IF EXISTS "enum_payments_payment_gateway" CASCADE;
DROP TYPE IF EXISTS "enum_payments_status" CASCADE;
```

### 4. Restart server
```bash
npm start
```

## Verification

Setelah fix, verifikasi bahwa:

### ✅ Server Starts Successfully
```bash
npm start

# Expected output:
# ✅ Database connection established successfully.
# ✅ Database synchronized successfully.
# 🚀 Server is running on port 3000
```

### ✅ Payments Table Working
```bash
# Check health endpoint
curl http://localhost:3000/health

# Should return status: "OK"
```

### ✅ API Endpoints Accessible
```bash
# Test API documentation
curl http://localhost:3000/api/docs
```

## Prevention

### Best Practices untuk Menghindari SQL Errors:

1. **Explicit Index Naming**
   ```javascript
   indexes: [
     {
       fields: ['column_name'],
       name: 'table_column_idx'  // Always name indexes explicitly
     }
   ]
   ```

2. **Model-level Validation vs DB Constraints**
   ```javascript
   // ✅ Good: Model validation
   validate: {
     uniqueCheck() {
       // Custom validation logic
     }
   }
   
   // ❌ Avoid: Complex DB constraints in Sequelize
   ```

3. **Safe Migration Practices**
   ```javascript
   // Check before adding
   const tableDescription = await queryInterface.describeTable('table_name');
   if (!tableDescription.column_name) {
     await queryInterface.addColumn('table_name', 'column_name', definition);
   }
   ```

4. **Environment-specific Sync**
   ```javascript
   // Different strategies per environment
   const syncOptions = {
     force: false,  // Never force in production
     alter: isDevelopment  // Only alter in development
   };
   ```

## Files Modified

### Core Fixes:
- `src/database/models/Payment.js` - Fixed model constraints
- `src/server.js` - Enhanced error diagnosis

### Migration Scripts:
- `src/database/migrate-payment-table.js` - Safe migration
- `src/database/reset-payments-table.js` - Force reset

### Configuration:
- `package.json` - Added new scripts
- `docs/PAYMENT_SQL_FIX.md` - This documentation

## Support

### Jika Masih Ada Masalah:

1. **Check PostgreSQL version compatibility**
   ```bash
   psql --version
   ```

2. **Review PostgreSQL logs**
   ```bash
   # Linux/Mac
   tail -f /var/log/postgresql/postgresql-*.log
   
   # Windows
   # Check Event Viewer atau PostgreSQL log directory
   ```

3. **Verify database permissions**
   ```bash
   # Connect and check permissions
   psql -d your_database_name -c "\du"
   ```

4. **Database connection test**
   ```bash
   # Test connection
   psql -d your_database_name -c "SELECT version();"
   ```

### Contact Information:
- 📧 **Email**: dev@umkm-mahasiswa.id
- 🐛 **Bug Reports**: [GitHub Issues](https://github.com/HaikalE/umkm-mahasiswa-backend/issues)
- 📚 **Documentation**: [Repository Wiki](https://github.com/HaikalE/umkm-mahasiswa-backend)

---

## Quick Fix Summary

**For immediate resolution:**

```bash
# 1. Pull latest fixes
git pull origin main

# 2. Fix payments table
npm run db:fix:payments

# 3. Start server
npm start

# 4. Verify working
curl http://localhost:3000/health
```

**Success indicators:**
- ✅ No SQL syntax errors in console
- ✅ Server starts on port 3000
- ✅ Health check returns "OK"
- ✅ API documentation accessible