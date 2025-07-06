const { PricingTier, Project, Application } = require('../database/models');
const { validationResult } = require('express-validator');
const { Op } = require('sequelize');
const logger = require('../utils/logger');

class PricingController {
  /**
   * Get pricing tiers by category and skill level
   * GET /api/pricing/categories
   */
  static async getPricingByCategory(req, res) {
    try {
      const { category, skill_level } = req.query;

      let whereClause = { is_active: true };
      if (category) whereClause.category = category;
      if (skill_level) whereClause.skill_level = skill_level;

      const pricingTiers = await PricingTier.findAll({
        where: whereClause,
        order: [
          ['category', 'ASC'],
          [['skill_level'], 'ASC'] // Order by skill level progression
        ]
      });

      // Group by category for better organization
      const groupedPricing = pricingTiers.reduce((acc, tier) => {
        if (!acc[tier.category]) {
          acc[tier.category] = [];
        }
        acc[tier.category].push({
          skill_level: tier.skill_level,
          min_price: parseFloat(tier.min_price),
          max_price: parseFloat(tier.max_price),
          recommended_price: parseFloat(tier.recommended_price),
          currency: tier.currency,
          price_per: tier.price_per,
          description: tier.description,
          examples: tier.examples,
          effective_date: tier.effective_date
        });
        return acc;
      }, {});

      res.json({
        success: true,
        data: {
          pricing_tiers: groupedPricing,
          categories: Object.keys(groupedPricing),
          last_updated: pricingTiers.length > 0 ? Math.max(...pricingTiers.map(p => new Date(p.updated_at))) : null
        }
      });

    } catch (error) {
      logger.error('Error fetching pricing categories', {
        error: error.message,
        query: req.query
      });

      res.status(500).json({
        success: false,
        message: 'Failed to fetch pricing information',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  /**
   * Suggest price for a project based on category, skills, and complexity
   * POST /api/pricing/suggest
   */
  static async suggestPrice(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation errors',
          errors: errors.array()
        });
      }

      const { 
        category, 
        required_skills = [], 
        experience_level = 'beginner',
        duration = 7, // days
        complexity_factors = {},
        project_scope = 'small' // small, medium, large
      } = req.body;

      // Get base pricing for category and experience level
      const basePricing = await PricingTier.findOne({
        where: {
          category: category,
          skill_level: experience_level,
          is_active: true
        }
      });

      if (!basePricing) {
        return res.status(404).json({
          success: false,
          message: `No pricing data found for category: ${category} and skill level: ${experience_level}`
        });
      }

      // Base price calculation
      let suggestedPrice = parseFloat(basePricing.recommended_price);
      const minPrice = parseFloat(basePricing.min_price);
      const maxPrice = parseFloat(basePricing.max_price);

      // Complexity multipliers
      let complexityMultiplier = 1.0;

      // Skill complexity factor (more skills = higher price)
      if (required_skills.length > 3) {
        complexityMultiplier += (required_skills.length - 3) * 0.1; // +10% per additional skill
      }

      // Duration factor
      if (duration > 30) {
        complexityMultiplier += 0.3; // +30% for long projects
      } else if (duration > 14) {
        complexityMultiplier += 0.15; // +15% for medium projects
      } else if (duration <= 3) {
        complexityMultiplier += 0.2; // +20% for urgent projects
      }

      // Project scope factor
      const scopeMultipliers = {
        'small': 1.0,
        'medium': 1.4,
        'large': 2.0,
        'enterprise': 3.0
      };
      complexityMultiplier *= (scopeMultipliers[project_scope] || 1.0);

      // Custom complexity factors
      if (complexity_factors.has_backend) complexityMultiplier += 0.2;
      if (complexity_factors.has_database) complexityMultiplier += 0.15;
      if (complexity_factors.has_api_integration) complexityMultiplier += 0.15;
      if (complexity_factors.has_payment_system) complexityMultiplier += 0.25;
      if (complexity_factors.has_admin_panel) complexityMultiplier += 0.2;
      if (complexity_factors.is_responsive) complexityMultiplier += 0.1;
      if (complexity_factors.has_animation) complexityMultiplier += 0.1;

      // Apply multiplier
      suggestedPrice *= complexityMultiplier;

      // Ensure price is within bounds
      suggestedPrice = Math.max(minPrice, Math.min(maxPrice * 1.5, suggestedPrice)); // Allow up to 150% of max for very complex projects

      // Calculate price ranges
      const priceRange = {
        min: Math.round(suggestedPrice * 0.8), // 20% below suggested
        recommended: Math.round(suggestedPrice),
        max: Math.round(suggestedPrice * 1.3) // 30% above suggested
      };

      // Get market data for comparison
      const marketData = await PricingController._getMarketAnalysis(category, experience_level);

      // Calculate pricing breakdown
      const breakdown = {
        base_price: parseFloat(basePricing.recommended_price),
        complexity_multiplier: Math.round(complexityMultiplier * 100) / 100,
        complexity_factors: {
          skill_count: required_skills.length,
          duration_days: duration,
          project_scope: project_scope,
          technical_complexity: complexity_factors
        },
        final_calculation: `${basePricing.recommended_price} × ${complexityMultiplier} = ${suggestedPrice}`
      };

      logger.info('Price suggestion calculated', {
        category: category,
        experience_level: experience_level,
        suggestedPrice: priceRange.recommended,
        complexityMultiplier: complexityMultiplier
      });

      res.json({
        success: true,
        data: {
          suggested_pricing: {
            currency: 'IDR',
            price_range: priceRange,
            pricing_tier: {
              category: category,
              skill_level: experience_level,
              base_range: {
                min: minPrice,
                max: maxPrice,
                recommended: parseFloat(basePricing.recommended_price)
              }
            }
          },
          breakdown: breakdown,
          market_analysis: marketData,
          recommendations: PricingController._generatePricingRecommendations(priceRange, complexity_factors, marketData)
        }
      });

    } catch (error) {
      logger.error('Error suggesting price', {
        error: error.message,
        body: req.body
      });

      res.status(500).json({
        success: false,
        message: 'Failed to suggest pricing',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  /**
   * Create or update pricing tier (Admin only)
   * POST /api/pricing/admin/tiers
   */
  static async createPricingTier(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation errors',
          errors: errors.array()
        });
      }

      // Check if user is admin (you'll need to implement admin check)
      if (req.user.user_type !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Admin access required'
        });
      }

      const {
        category,
        skill_level,
        min_price,
        max_price,
        recommended_price,
        currency = 'IDR',
        price_per = 'project',
        complexity_factors,
        market_rate_data,
        description,
        examples
      } = req.body;

      // Check if pricing tier already exists
      const existingTier = await PricingTier.findOne({
        where: { category, skill_level }
      });

      if (existingTier) {
        // Update existing tier
        await existingTier.update({
          min_price,
          max_price,
          recommended_price,
          currency,
          price_per,
          complexity_factors,
          market_rate_data,
          description,
          examples,
          effective_date: new Date(),
          created_by: req.user.id
        });

        res.json({
          success: true,
          message: 'Pricing tier updated successfully',
          data: existingTier
        });
      } else {
        // Create new tier
        const newTier = await PricingTier.create({
          category,
          skill_level,
          min_price,
          max_price,
          recommended_price,
          currency,
          price_per,
          complexity_factors,
          market_rate_data,
          description,
          examples,
          is_active: true,
          effective_date: new Date(),
          created_by: req.user.id
        });

        res.status(201).json({
          success: true,
          message: 'Pricing tier created successfully',
          data: newTier
        });
      }

      logger.info('Pricing tier created/updated', {
        category,
        skill_level,
        adminId: req.user.id
      });

    } catch (error) {
      logger.error('Error creating pricing tier', {
        error: error.message,
        body: req.body,
        userId: req.user?.id
      });

      res.status(500).json({
        success: false,
        message: 'Failed to create pricing tier',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  /**
   * Get pricing analytics and market trends
   * GET /api/pricing/analytics
   */
  static async getPricingAnalytics(req, res) {
    try {
      const { category, period = '30' } = req.query; // period in days
      const periodDays = parseInt(period);

      // Get recent projects for market analysis
      const dateFilter = new Date(Date.now() - periodDays * 24 * 60 * 60 * 1000);
      
      let whereClause = {
        created_at: { [Op.gte]: dateFilter },
        status: { [Op.in]: ['completed', 'in_progress'] }
      };
      
      if (category) {
        whereClause.category = category;
      }

      const recentProjects = await Project.findAll({
        where: whereClause,
        attributes: ['category', 'budget_min', 'budget_max', 'experience_level', 'duration', 'created_at']
      });

      // Calculate market statistics
      const analytics = PricingController._calculateMarketAnalytics(recentProjects);

      // Get pricing trends by category
      const categoryTrends = await PricingController._getCategoryTrends(recentProjects);

      // Get demand analysis
      const demandAnalysis = await PricingController._getDemandAnalysis(periodDays);

      res.json({
        success: true,
        data: {
          period_days: periodDays,
          market_overview: analytics,
          category_trends: categoryTrends,
          demand_analysis: demandAnalysis,
          analysis_date: new Date(),
          projects_analyzed: recentProjects.length
        }
      });

    } catch (error) {
      logger.error('Error fetching pricing analytics', {
        error: error.message,
        query: req.query
      });

      res.status(500).json({
        success: false,
        message: 'Failed to fetch pricing analytics',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  /**
   * Private helper methods
   */

  static async _getMarketAnalysis(category, skill_level) {
    try {
      // Get recent projects in same category and skill level
      const recentProjects = await Project.findAll({
        where: {
          category: category,
          experience_level: skill_level,
          created_at: { [Op.gte]: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }, // Last 30 days
          status: { [Op.in]: ['completed', 'in_progress', 'open'] }
        },
        attributes: ['budget_min', 'budget_max']
      });

      if (recentProjects.length === 0) {
        return {
          projects_analyzed: 0,
          market_trend: 'insufficient_data'
        };
      }

      const budgets = recentProjects.map(p => (parseFloat(p.budget_min) + parseFloat(p.budget_max)) / 2);
      const avgMarketPrice = budgets.reduce((sum, price) => sum + price, 0) / budgets.length;
      const medianPrice = budgets.sort()[Math.floor(budgets.length / 2)];

      return {
        projects_analyzed: recentProjects.length,
        average_market_price: Math.round(avgMarketPrice),
        median_market_price: Math.round(medianPrice),
        price_range: {
          min: Math.min(...budgets),
          max: Math.max(...budgets)
        },
        market_trend: avgMarketPrice > medianPrice ? 'increasing' : 'stable'
      };
    } catch (error) {
      return { projects_analyzed: 0, market_trend: 'error' };
    }
  }

  static _calculateMarketAnalytics(projects) {
    if (projects.length === 0) {
      return { message: 'No projects found for analysis' };
    }

    const budgets = projects.map(p => (parseFloat(p.budget_min || 0) + parseFloat(p.budget_max || 0)) / 2);
    const avgBudget = budgets.reduce((sum, b) => sum + b, 0) / budgets.length;

    return {
      total_projects: projects.length,
      average_budget: Math.round(avgBudget),
      budget_distribution: {
        low: budgets.filter(b => b < 2000000).length,
        medium: budgets.filter(b => b >= 2000000 && b < 5000000).length,
        high: budgets.filter(b => b >= 5000000).length
      },
      popular_experience_levels: this._getMostCommon(projects.map(p => p.experience_level)),
      average_duration: Math.round(projects.reduce((sum, p) => sum + (p.duration || 0), 0) / projects.length)
    };
  }

  static async _getCategoryTrends(projects) {
    const categoryStats = {};
    
    projects.forEach(project => {
      if (!categoryStats[project.category]) {
        categoryStats[project.category] = {
          count: 0,
          total_budget: 0,
          durations: []
        };
      }
      
      categoryStats[project.category].count++;
      categoryStats[project.category].total_budget += (parseFloat(project.budget_min || 0) + parseFloat(project.budget_max || 0)) / 2;
      categoryStats[project.category].durations.push(project.duration || 0);
    });

    // Calculate averages
    Object.keys(categoryStats).forEach(category => {
      const stats = categoryStats[category];
      stats.average_budget = Math.round(stats.total_budget / stats.count);
      stats.average_duration = Math.round(stats.durations.reduce((sum, d) => sum + d, 0) / stats.durations.length);
      delete stats.total_budget;
      delete stats.durations;
    });

    return categoryStats;
  }

  static async _getDemandAnalysis(periodDays) {
    try {
      const totalProjects = await Project.count({
        where: {
          created_at: { [Op.gte]: new Date(Date.now() - periodDays * 24 * 60 * 60 * 1000) }
        }
      });

      const totalApplications = await Application.count({
        where: {
          created_at: { [Op.gte]: new Date(Date.now() - periodDays * 24 * 60 * 60 * 1000) }
        }
      });

      return {
        projects_posted: totalProjects,
        applications_submitted: totalApplications,
        average_applications_per_project: totalProjects > 0 ? Math.round(totalApplications / totalProjects) : 0,
        market_activity: totalProjects > 10 ? 'high' : totalProjects > 5 ? 'medium' : 'low'
      };
    } catch (error) {
      return { error: 'Failed to analyze demand' };
    }
  }

  static _generatePricingRecommendations(priceRange, complexityFactors, marketData) {
    const recommendations = [];

    if (marketData.projects_analyzed > 5) {
      if (priceRange.recommended > marketData.average_market_price * 1.2) {
        recommendations.push({
          type: 'warning',
          message: 'Your suggested price is significantly above market average. Consider competitive pricing.'
        });
      } else if (priceRange.recommended < marketData.average_market_price * 0.8) {
        recommendations.push({
          type: 'suggestion',
          message: 'You could potentially charge more based on current market rates.'
        });
      }
    }

    if (complexityFactors.has_payment_system) {
      recommendations.push({
        type: 'info',
        message: 'Payment system integration requires additional security considerations and testing time.'
      });
    }

    if (priceRange.min < 500000) {
      recommendations.push({
        type: 'warning',
        message: 'Very low pricing might impact project quality. Consider value-based pricing.'
      });
    }

    return recommendations;
  }

  static _getMostCommon(array) {
    const frequency = {};
    array.forEach(item => {
      frequency[item] = (frequency[item] || 0) + 1;
    });
    
    return Object.keys(frequency).reduce((a, b) => frequency[a] > frequency[b] ? a : b);
  }
}

module.exports = PricingController;