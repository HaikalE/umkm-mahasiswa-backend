const db = require('../database/models');
const { Product, User, UmkmProfile, Review } = db;
const { asyncHandler } = require('../middleware/error');
const { Op } = require('sequelize');
const { deleteFromCloudinary, getPublicIdFromUrl } = require('../config/cloudinary');

// @desc    Get all products
// @route   GET /api/products
// @access  Public
const getAllProducts = asyncHandler(async (req, res) => {
  const { 
    page = 1, 
    limit = 12, 
    category, 
    city, 
    price_min, 
    price_max, 
    sort = 'created_at', 
    order = 'DESC',
    search
  } = req.query;
  
  const offset = (page - 1) * limit;
  
  // Build where clause
  const whereClause = {
    status: 'active'
  };
  
  if (category) {
    whereClause.category = category;
  }
  
  if (price_min || price_max) {
    whereClause.price = {};
    if (price_min) whereClause.price[Op.gte] = price_min;
    if (price_max) whereClause.price[Op.lte] = price_max;
  }
  
  if (search) {
    whereClause[Op.or] = [
      { name: { [Op.iLike]: `%${search}%` } },
      { description: { [Op.iLike]: `%${search}%` } },
      { '$umkm.umkmProfile.business_name$': { [Op.iLike]: `%${search}%` } }
    ];
  }
  
  // UMKM filter
  const umkmWhere = {};
  if (city) {
    umkmWhere.city = { [Op.iLike]: `%${city}%` };
  }
  
  const { count, rows } = await Product.findAndCountAll({
    where: whereClause,
    include: [
      {
        model: User,
        as: 'umkm',
        attributes: ['id', 'full_name', 'avatar_url'],
        include: [
          {
            model: UmkmProfile,
            as: 'umkmProfile',
            attributes: ['business_name', 'business_type', 'city', 'rating'],
            where: umkmWhere
          }
        ]
      }
    ],
    limit: parseInt(limit),
    offset: parseInt(offset),
    order: [[sort, order.toUpperCase()]],
    distinct: true
  });
  
  res.json({
    success: true,
    data: {
      products: rows,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(count / limit)
      }
    }
  });
});

// @desc    Get product by ID
// @route   GET /api/products/:id
// @access  Public
const getProductById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  const product = await Product.findOne({
    where: { id, status: 'active' },
    include: [
      {
        model: User,
        as: 'umkm',
        attributes: ['id', 'full_name', 'avatar_url'],
        include: [
          {
            model: UmkmProfile,
            as: 'umkmProfile',
            attributes: ['business_name', 'business_type', 'city', 'rating', 'total_reviews']
          }
        ]
      },
      {
        model: Review,
        as: 'reviews',
        limit: 5,
        order: [['created_at', 'DESC']],
        include: [
          {
            model: User,
            as: 'reviewer',
            attributes: ['id', 'full_name', 'avatar_url']
          }
        ]
      }
    ]
  });
  
  if (!product) {
    return res.status(404).json({
      success: false,
      message: 'Product not found'
    });
  }
  
  // Increment view count
  await product.increment('view_count');
  
  res.json({
    success: true,
    data: product
  });
});

// @desc    Create new product
// @route   POST /api/products
// @access  Private (UMKM only)
const createProduct = asyncHandler(async (req, res) => {
  const umkmId = req.user.id;
  const productData = {
    ...req.body,
    umkm_id: umkmId
  };
  
  const product = await Product.create(productData);
  
  // Update UMKM total products count
  await UmkmProfile.increment('total_products', {
    where: { user_id: umkmId }
  });
  
  // Get created product with relations
  const createdProduct = await Product.findByPk(product.id, {
    include: [
      {
        model: User,
        as: 'umkm',
        attributes: ['id', 'full_name', 'avatar_url'],
        include: [
          {
            model: UmkmProfile,
            as: 'umkmProfile',
            attributes: ['business_name', 'business_type', 'city']
          }
        ]
      }
    ]
  });
  
  res.status(201).json({
    success: true,
    message: 'Product created successfully',
    data: createdProduct
  });
});

// @desc    Update product
// @route   PUT /api/products/:id
// @access  Private (UMKM owner only)
const updateProduct = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const umkmId = req.user.id;
  
  const product = await Product.findOne({
    where: { id, umkm_id: umkmId }
  });
  
  if (!product) {
    return res.status(404).json({
      success: false,
      message: 'Product not found or unauthorized'
    });
  }
  
  await product.update(req.body);
  
  // Get updated product with relations
  const updatedProduct = await Product.findByPk(product.id, {
    include: [
      {
        model: User,
        as: 'umkm',
        attributes: ['id', 'full_name', 'avatar_url'],
        include: [
          {
            model: UmkmProfile,
            as: 'umkmProfile',
            attributes: ['business_name', 'business_type', 'city']
          }
        ]
      }
    ]
  });
  
  res.json({
    success: true,
    message: 'Product updated successfully',
    data: updatedProduct
  });
});

// @desc    Delete product
// @route   DELETE /api/products/:id
// @access  Private (UMKM owner only)
const deleteProduct = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const umkmId = req.user.id;
  
  const product = await Product.findOne({
    where: { id, umkm_id: umkmId }
  });
  
  if (!product) {
    return res.status(404).json({
      success: false,
      message: 'Product not found or unauthorized'
    });
  }
  
  // Delete product images from cloudinary
  if (product.images && product.images.length > 0) {
    for (const imageUrl of product.images) {
      const publicId = getPublicIdFromUrl(imageUrl);
      if (publicId) {
        await deleteFromCloudinary(publicId);
      }
    }
  }
  
  await product.destroy();
  
  // Update UMKM total products count
  await UmkmProfile.decrement('total_products', {
    where: { user_id: umkmId }
  });
  
  res.json({
    success: true,
    message: 'Product deleted successfully'
  });
});

// @desc    Upload product images
// @route   POST /api/products/:id/images
// @access  Private (UMKM owner only)
const uploadProductImages = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const umkmId = req.user.id;
  
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'No images uploaded'
    });
  }
  
  const product = await Product.findOne({
    where: { id, umkm_id: umkmId }
  });
  
  if (!product) {
    return res.status(404).json({
      success: false,
      message: 'Product not found or unauthorized'
    });
  }
  
  const imageUrls = req.files.map(file => file.path);
  const currentImages = product.images || [];
  const updatedImages = [...currentImages, ...imageUrls];
  
  await product.update({ images: updatedImages });
  
  res.json({
    success: true,
    message: 'Images uploaded successfully',
    data: {
      images: updatedImages
    }
  });
});

// @desc    Get product categories
// @route   GET /api/products/categories
// @access  Public
const getCategories = asyncHandler(async (req, res) => {
  const categories = [
    { value: 'kuliner', label: 'Kuliner & Makanan' },
    { value: 'fashion', label: 'Fashion & Pakaian' },
    { value: 'teknologi', label: 'Teknologi' },
    { value: 'kerajinan', label: 'Kerajinan Tangan' },
    { value: 'jasa', label: 'Jasa & Layanan' },
    { value: 'perdagangan', label: 'Perdagangan' },
    { value: 'pertanian', label: 'Pertanian' },
    { value: 'lainnya', label: 'Lainnya' }
  ];
  
  res.json({
    success: true,
    data: categories
  });
});

// @desc    Get featured products
// @route   GET /api/products/featured
// @access  Public
const getFeaturedProducts = asyncHandler(async (req, res) => {
  const { limit = 6 } = req.query;
  
  const products = await Product.findAll({
    where: {
      status: 'active',
      is_featured: true
    },
    include: [
      {
        model: User,
        as: 'umkm',
        attributes: ['id', 'full_name', 'avatar_url'],
        include: [
          {
            model: UmkmProfile,
            as: 'umkmProfile',
            attributes: ['business_name', 'business_type', 'city', 'rating']
          }
        ]
      }
    ],
    limit: parseInt(limit),
    order: [['rating', 'DESC'], ['view_count', 'DESC']]
  });
  
  res.json({
    success: true,
    data: products
  });
});

module.exports = {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  uploadProductImages,
  getCategories,
  getFeaturedProducts
};