# 🔧 Database Sync Issue Fix

## Masalah yang Diperbaiki

**Error**: `column "started_at" does not exist`

Masalah ini terjadi ketika model database memiliki kolom yang tidak ada di database fisik, sehingga gagal membuat index.

## Solusi yang Diterapkan

### 1. **Enhanced Database Sync** (Otomatis)
- Server.js diupdate untuk menggunakan `alter: true` di development
- Akan otomatis menyesuaikan struktur database dengan model
- Data existing tetap aman

### 2. **Manual Migration Script** (Manual)
- Script khusus untuk menambahkan kolom yang hilang
- Aman untuk database production
- Tidak akan menghilangkan data

## Cara Menggunakan

### Opsi 1: Automatic Sync (Recommended untuk Development)

```bash
# Jalankan server dengan auto-sync
npm start
```

Server akan otomatis:
- Mendeteksi perbedaan schema
- Menambahkan kolom yang hilang
- Membuat index yang diperlukan

### Opsi 2: Manual Migration

```bash
# Jalankan migration khusus untuk Project table
npm run db:migrate:projects

# Atau menggunakan shortcut
npm run db:fix
```

### Opsi 3: Full Database Migration

```bash
# Migration lengkap semua table
npm run db:migrate
```

## Environment Variables

Untuk kontrol lebih detail:

```env
# Disable automatic alter (jika tidak ingin auto-sync)
DB_DISABLE_ALTER=true

# Force recreation database (WARNING: data loss)
DB_FORCE_SYNC=true
```

## Troubleshooting

### Error: "column does not exist"
```bash
npm run db:fix
```

### Error: "index already exists"
- Ini normal, index akan di-skip jika sudah ada

### Ingin reset database completely (Development only)
```bash
# WARNING: Akan menghapus semua data
DB_FORCE_SYNC=true npm start
```

### Production Migration
```bash
# Untuk production, gunakan manual migration
NODE_ENV=production npm run db:migrate:projects
```

## Files yang Diubah

1. **src/server.js** - Enhanced sync logic
2. **src/database/migrate-project-columns.js** - Manual migration script  
3. **package.json** - Added migration scripts

## Verifikasi Fix

Setelah menjalankan fix, server harus bisa start tanpa error:

```bash
npm start
```

Output yang diharapkan:
```
✅ Database connection established successfully.
✅ Database synchronized successfully.
🚀 Server is running on port 3000
```

## Next Steps

1. Test semua endpoints API
2. Verify data integrity
3. Run application tests
4. Deploy to staging/production

## Support

Jika masih ada masalah, check:
- Database credentials di .env
- PostgreSQL service running
- Network connectivity
- Log files untuk detail error