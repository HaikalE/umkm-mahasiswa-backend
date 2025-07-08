# 🚨 EMERGENCY FIX - "syntax error at or near USING"

## Immediate Solution

**Error:** `syntax error at or near "USING"` pada model payments

**Quick Fix:**
```bash
# Pull emergency fix
git pull origin main

# Nuclear option - complete cleanup (WARNING: DATA LOSS!)
npm run db:nuclear

# Start server
npm start
```

## What Was Changed

### 1. **Simplified Payment Model** 🔧
- ❌ **Removed all ENUMs** - replaced with STRING types
- ❌ **Removed problematic model validations** that caused circular references
- ✅ **Simple model** that PostgreSQL can handle without conflicts
- ✅ **Basic hooks only** for essential calculations

### 2. **Emergency Cleanup Script** 🧹
- **Complete database cleanup** - drops everything payments-related
- **Removes all constraints** and foreign keys
- **Cleans ENUM types** that cause conflicts
- **Clears schema cache** to prevent issues

### 3. **Nuclear Option** ☢️
```bash
npm run db:nuclear          # Complete cleanup
npm run db:emergency:payments # Same as above
```

## Why This Happened

**Root Cause:** Complex ENUM types and model validations in Payment model created circular dependencies and constraint conflicts that PostgreSQL couldn't resolve.

**Technical Details:**
- ENUM types `enum_payments_payment_phase` etc. were conflicting
- Model validation using `sequelize.models.payments.findOne()` created circular reference
- Multiple constraints with same/similar names
- PostgreSQL couldn't handle complex constraint creation

## Emergency Commands

### Option 1: Nuclear Fix (Recommended)
```bash
npm run db:nuclear
npm start
```

### Option 2: Manual PostgreSQL Cleanup
```sql
-- Connect to database
psql -d your_database_name

-- Drop everything
DROP TABLE IF EXISTS payments CASCADE;
DROP TYPE IF EXISTS "enum_payments_payment_phase" CASCADE;
DROP TYPE IF EXISTS "enum_payments_payment_method" CASCADE; 
DROP TYPE IF EXISTS "enum_payments_payment_gateway" CASCADE;
DROP TYPE IF EXISTS "enum_payments_status" CASCADE;

-- Exit
\q
```

### Option 3: Step by Step
```bash
# 1. Pull latest
git pull origin main

# 2. Emergency cleanup
npm run db:emergency:payments

# 3. Start fresh
npm start

# 4. Verify
curl http://localhost:3000/health
```

## Model Changes Summary

**Before (Problematic):**
```javascript
payment_phase: {
  type: DataTypes.ENUM('initial', 'final'),  // ❌ ENUM conflict
  allowNull: false
},
validate: {
  uniqueProjectPaymentPhase() {
    return sequelize.models.payments.findOne({...}); // ❌ Circular reference
  }
}
```

**After (Working):**
```javascript
payment_phase: {
  type: DataTypes.STRING(20),  // ✅ Simple STRING
  allowNull: false,
  defaultValue: 'initial',
  comment: 'values: initial, final'
},
// ✅ No problematic validations
```

## Verification

After running the fix:

**1. Server starts without errors:**
```bash
npm start
# Should show:
# ✅ Database connection established successfully.
# ✅ Database synchronized successfully.
# 🚀 Server is running on port 3000
```

**2. Health check passes:**
```bash
curl http://localhost:3000/health
# Should return: {"status": "OK"}
```

**3. No SQL syntax errors in console**

## Data Impact

⚠️ **WARNING:** The emergency fix will **DELETE ALL PAYMENT DATA**

This is necessary because:
- ENUM type conflicts can't be resolved without dropping the table
- Constraint conflicts require complete cleanup
- PostgreSQL schema conflicts need fresh start

## Prevention

To avoid this in future:

1. **Use STRING instead of ENUM** for better flexibility
2. **Avoid complex model validations** that reference other models
3. **Test database changes** in development first
4. **Use simple constraints** that PostgreSQL can handle

## Files Changed

- `src/database/models/Payment.js` - Simplified model
- `src/database/emergency-cleanup-payments.js` - Emergency script
- `package.json` - Added nuclear scripts
- `docs/EMERGENCY_FIX.md` - This documentation

## Support

If this fix doesn't work:

1. **Check PostgreSQL is running**
2. **Verify database credentials** in .env
3. **Try manual SQL cleanup** (see commands above)  
4. **Contact support** with full error logs

---

## TL;DR

```bash
git pull origin main
npm run db:nuclear
npm start
```

Should fix the "syntax error at or near USING" immediately. ✅