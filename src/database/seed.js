const bcrypt = require('bcryptjs');
const db = require('./models');
const { User, UmkmProfile, StudentProfile, Product, Project, Application, Review, Notification } = db;

async function seedDatabase() {
  try {
    console.log('🌱 Starting database seeding...');
    
    // Clear existing data (only in development)
    if (process.env.NODE_ENV === 'development') {
      await db.sequelize.sync({ force: true });
      console.log('🧹 Cleared existing data.');
    }
    
    // Hash password for demo users
    const hashedPassword = await bcrypt.hash('password123', 10);
    
    // Create demo UMKM users
    console.log('👥 Creating demo UMKM users...');
    const umkmUsers = await User.bulkCreate([
      {
        email: 'warung.makan.sederhana@gmail.com',
        password: hashedPassword,
        full_name: 'Ibu Sari',
        user_type: 'umkm',
        phone: '081234567890',
        is_verified: true
      },
      {
        email: 'toko.fashion.trendy@gmail.com',
        password: hashedPassword,
        full_name: 'Pak Budi',
        user_type: 'umkm',
        phone: '081234567891',
        is_verified: true
      },
      {
        email: 'digital.agency.kreatif@gmail.com',
        password: hashedPassword,
        full_name: 'Maya Putri',
        user_type: 'umkm',
        phone: '081234567892',
        is_verified: true
      }
    ]);
    
    // Create UMKM profiles
    console.log('🏢 Creating UMKM profiles...');
    await UmkmProfile.bulkCreate([
      {
        user_id: umkmUsers[0].id,
        business_name: 'Warung Makan Sederhana',
        business_type: 'kuliner',
        description: 'Warung makan keluarga yang menyajikan masakan rumahan dengan rasa yang lezat dan harga terjangkau.',
        address: 'Jl. Sudirman No. 123',
        city: 'Jakarta',
        province: 'DKI Jakarta',
        rating: 4.5,
        total_reviews: 25
      },
      {
        user_id: umkmUsers[1].id,
        business_name: 'Toko Fashion Trendy',
        business_type: 'fashion',
        description: 'Toko fashion yang menjual pakaian trendy untuk remaja dan dewasa muda dengan harga kompetitif.',
        address: 'Jl. Malioboro No. 45',
        city: 'Yogyakarta',
        province: 'DIY',
        rating: 4.2,
        total_reviews: 18
      },
      {
        user_id: umkmUsers[2].id,
        business_name: 'Digital Agency Kreatif',
        business_type: 'teknologi',
        description: 'Agency digital yang membantu UMKM dalam transformasi digital dan pemasaran online.',
        address: 'Jl. Asia Afrika No. 67',
        city: 'Bandung',
        province: 'Jawa Barat',
        rating: 4.8,
        total_reviews: 32,
        is_premium: true
      }
    ]);
    
    // Create demo student users
    console.log('🎓 Creating demo student users...');
    const studentUsers = await User.bulkCreate([
      {
        email: 'andi.mahasiswa@gmail.com',
        password: hashedPassword,
        full_name: 'Andi Pratama',
        user_type: 'student',
        phone: '081234567893',
        is_verified: true
      },
      {
        email: 'siti.developer@gmail.com',
        password: hashedPassword,
        full_name: 'Siti Nurhaliza',
        user_type: 'student',
        phone: '081234567894',
        is_verified: true
      },
      {
        email: 'rizki.designer@gmail.com',
        password: hashedPassword,
        full_name: 'Rizki Ramadhan',
        user_type: 'student',
        phone: '081234567895',
        is_verified: true
      }
    ]);
    
    // Create student profiles
    console.log('📚 Creating student profiles...');
    await StudentProfile.bulkCreate([
      {
        user_id: studentUsers[0].id,
        university: 'Universitas Indonesia',
        faculty: 'Fakultas Ilmu Komputer',
        major: 'Teknik Informatika',
        semester: 6,
        graduation_year: 2024,
        skills: [
          { name: 'JavaScript', level: 'intermediate' },
          { name: 'React', level: 'intermediate' },
          { name: 'Node.js', level: 'beginner' }
        ],
        bio: 'Mahasiswa Teknik Informatika yang passionate dalam web development dan ingin berkontribusi membantu UMKM.',
        experience_level: 'intermediate',
        availability: 'available',
        rating: 4.3,
        total_reviews: 8
      },
      {
        user_id: studentUsers[1].id,
        university: 'Institut Teknologi Bandung',
        faculty: 'Sekolah Teknik Elektro dan Informatika',
        major: 'Sistem dan Teknologi Informasi',
        semester: 8,
        graduation_year: 2024,
        skills: [
          { name: 'Python', level: 'advanced' },
          { name: 'Django', level: 'intermediate' },
          { name: 'Machine Learning', level: 'intermediate' }
        ],
        bio: 'Mahasiswa STI ITB yang berfokus pada pengembangan sistem informasi dan analisis data.',
        experience_level: 'advanced',
        availability: 'available',
        rating: 4.7,
        total_reviews: 12
      },
      {
        user_id: studentUsers[2].id,
        university: 'Universitas Gadjah Mada',
        faculty: 'Fakultas Teknik',
        major: 'Desain Komunikasi Visual',
        semester: 4,
        graduation_year: 2025,
        skills: [
          { name: 'UI/UX Design', level: 'intermediate' },
          { name: 'Figma', level: 'advanced' },
          { name: 'Adobe Illustrator', level: 'intermediate' }
        ],
        bio: 'Mahasiswa DKV UGM yang senang mendesain dan membantu UMKM dalam branding visual.',
        experience_level: 'intermediate',
        availability: 'available',
        rating: 4.1,
        total_reviews: 5
      }
    ]);
    
    // Create demo products
    console.log('🛍️ Creating demo products...');
    await Product.bulkCreate([
      {
        umkm_id: umkmUsers[0].id,
        name: 'Nasi Gudeg Yogya',
        description: 'Nasi gudeg khas Yogyakarta dengan cita rasa autentik dan bumbu yang meresap.',
        category: 'kuliner',
        price: 15000,
        discount_price: 12000,
        currency: 'IDR',
        tags: ['gudeg', 'yogyakarta', 'nasi', 'makanan'],
        stock_quantity: 50,
        rating: 4.6,
        total_reviews: 28,
        total_sold: 150
      },
      {
        umkm_id: umkmUsers[1].id,
        name: 'Kaos Distro Kekinian',
        description: 'Kaos distro dengan desain unik dan bahan berkualitas tinggi.',
        category: 'fashion',
        price: 85000,
        currency: 'IDR',
        tags: ['kaos', 'distro', 'fashion', 'trendy'],
        stock_quantity: 25,
        rating: 4.3,
        total_reviews: 15,
        total_sold: 78
      }
    ]);
    
    // Create demo projects
    console.log('💼 Creating demo projects...');
    const projects = await Project.bulkCreate([
      {
        umkm_id: umkmUsers[0].id,
        title: 'Pembuatan Website Warung Makan',
        description: 'Membutuhkan website sederhana untuk menampilkan menu makanan dan informasi warung. Website harus responsive dan mudah digunakan.',
        category: 'web_development',
        budget_min: 2000000,
        budget_max: 3500000,
        currency: 'IDR',
        payment_type: 'fixed',
        duration: 30,
        required_skills: ['HTML', 'CSS', 'JavaScript', 'Responsive Design'],
        experience_level: 'beginner',
        location_type: 'remote',
        status: 'open',
        priority: 'medium',
        max_applicants: 10
      },
      {
        umkm_id: umkmUsers[2].id,
        title: 'Desain Logo dan Branding',
        description: 'Membutuhkan designer untuk membuat logo dan paket branding lengkap untuk startup teknologi.',
        category: 'graphic_design',
        budget_min: 1500000,
        budget_max: 2500000,
        currency: 'IDR',
        payment_type: 'fixed',
        duration: 14,
        required_skills: ['Logo Design', 'Branding', 'Adobe Illustrator', 'Figma'],
        experience_level: 'intermediate',
        location_type: 'remote',
        status: 'open',
        priority: 'high',
        max_applicants: 5,
        is_featured: true
      }
    ]);
    
    // Create demo applications
    console.log('📝 Creating demo applications...');
    await Application.bulkCreate([
      {
        project_id: projects[0].id,
        student_id: studentUsers[0].id,
        cover_letter: 'Saya tertarik dengan proyek pembuatan website warung makan ini. Saya memiliki pengalaman dalam web development dan siap membantu digitalisasi UMKM.',
        proposed_budget: 2500000,
        proposed_duration: 25,
        status: 'pending'
      },
      {
        project_id: projects[1].id,
        student_id: studentUsers[2].id,
        cover_letter: 'Saya adalah mahasiswa DKV dengan pengalaman desain logo dan branding. Portfolio saya dapat dilihat di profil. Siap bekerja sesuai timeline yang ditetapkan.',
        proposed_budget: 2000000,
        proposed_duration: 12,
        status: 'reviewed'
      }
    ]);
    
    // Create demo reviews
    console.log('⭐ Creating demo reviews...');
    await Review.bulkCreate([
      {
        reviewer_id: studentUsers[0].id,
        reviewed_id: umkmUsers[2].id,
        rating: 5,
        comment: 'Sangat profesional dan hasil kerja memuaskan. Komunikasi lancar dan deadline tepat waktu.',
        review_type: 'collaboration'
      },
      {
        reviewer_id: umkmUsers[1].id,
        reviewed_id: studentUsers[1].id,
        rating: 4,
        comment: 'Mahasiswa yang kompeten dan mudah diajak kerjasama. Hasil pekerjaan sesuai ekspektasi.',
        review_type: 'collaboration'
      }
    ]);
    
    // Create demo notifications
    console.log('🔔 Creating demo notifications...');
    await Notification.bulkCreate([
      {
        user_id: umkmUsers[0].id,
        title: 'Aplikasi Baru Diterima',
        message: 'Anda menerima aplikasi baru dari Andi Pratama untuk proyek website warung makan.',
        type: 'new_application',
        related_type: 'application',
        priority: 'medium'
      },
      {
        user_id: studentUsers[0].id,
        title: 'Selamat Datang!',
        message: 'Selamat datang di platform UMKM x Mahasiswa. Lengkapi profil Anda untuk mendapatkan peluang project terbaik.',
        type: 'system_announcement',
        priority: 'low'
      }
    ]);
    
    console.log('✅ Demo users created:');
    console.log('   UMKM: warung.makan.sederhana@gmail.com (password: password123)');
    console.log('   UMKM: toko.fashion.trendy@gmail.com (password: password123)');
    console.log('   UMKM: digital.agency.kreatif@gmail.com (password: password123)');
    console.log('   Student: andi.mahasiswa@gmail.com (password: password123)');
    console.log('   Student: siti.developer@gmail.com (password: password123)');
    console.log('   Student: rizki.designer@gmail.com (password: password123)');
    
    console.log('🎉 Database seeding completed successfully!');
    
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    throw error;
  } finally {
    await db.sequelize.close();
  }
}

// Run seeding if called directly
if (require.main === module) {
  seedDatabase()
    .then(() => {
      console.log('Seeding completed, exiting...');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Seeding failed:', error);
      process.exit(1);
    });
}

module.exports = seedDatabase;