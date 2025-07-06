const { AIMatching, Project, User, StudentProfile, UmkmProfile, Review, Application } = require('../database/models');
const { validationResult } = require('express-validator');
const { Op } = require('sequelize');
const logger = require('../utils/logger');

class AIMatchingController {
  /**
   * Calculate matching score between student and project
   * POST /api/matching/calculate
   */
  static async calculateMatching(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation errors',
          errors: errors.array()
        });
      }

      const { studentId, projectId } = req.body;

      // Get student profile with skills and experience
      const student = await User.findByPk(studentId, {
        include: [
          {
            model: StudentProfile,
            as: 'studentProfile',
            attributes: [
              'skills', 'experience_level', 'university', 'major', 
              'semester', 'availability', 'portfolio_url', 'rating'
            ]
          }
        ]
      });

      if (!student || student.user_type !== 'student') {
        return res.status(404).json({
          success: false,
          message: 'Student not found'
        });
      }

      // Get project details
      const project = await Project.findByPk(projectId, {
        include: [
          {
            model: User,
            as: 'umkm',
            include: [{ model: UmkmProfile, as: 'umkmProfile' }]
          }
        ]
      });

      if (!project || project.status !== 'open') {
        return res.status(404).json({
          success: false,
          message: 'Project not found or not available'
        });
      }

      // Calculate matching scores
      const matchingScores = await AIMatchingController._calculateDetailedScores(student, project);

      // Calculate overall matching score (weighted average)
      const weights = {
        skill_match: 0.35,        // 35% - Most important
        experience_match: 0.20,   // 20%
        budget_match: 0.15,       // 15%
        location_match: 0.10,     // 10%
        performance_match: 0.15,  // 15%
        availability_match: 0.05  // 5%
      };

      const overallScore = Object.keys(weights).reduce((sum, key) => {
        return sum + (matchingScores[key] * weights[key]);
      }, 0);

      // Determine confidence level
      let confidenceLevel = 'low';
      if (overallScore >= 0.8) confidenceLevel = 'very_high';
      else if (overallScore >= 0.65) confidenceLevel = 'high';
      else if (overallScore >= 0.45) confidenceLevel = 'medium';

      // Determine if recommended
      const isRecommended = overallScore >= 0.5 && matchingScores.skill_match >= 0.4;

      // Save or update matching data
      const [matchingRecord, created] = await AIMatching.findOrCreate({
        where: { student_id: studentId, project_id: projectId },
        defaults: {
          matching_score: overallScore,
          skill_match_score: matchingScores.skill_match,
          experience_match_score: matchingScores.experience_match,
          budget_match_score: matchingScores.budget_match,
          location_match_score: matchingScores.location_match,
          performance_match_score: matchingScores.performance_match,
          availability_match_score: matchingScores.availability_match,
          matching_factors: matchingScores.factors,
          confidence_level: confidenceLevel,
          is_recommended: isRecommended,
          algorithm_version: '1.0',
          calculated_at: new Date(),
          last_updated: new Date()
        }
      });

      if (!created) {
        // Update existing record
        await matchingRecord.update({
          matching_score: overallScore,
          skill_match_score: matchingScores.skill_match,
          experience_match_score: matchingScores.experience_match,
          budget_match_score: matchingScores.budget_match,
          location_match_score: matchingScores.location_match,
          performance_match_score: matchingScores.performance_match,
          availability_match_score: matchingScores.availability_match,
          matching_factors: matchingScores.factors,
          confidence_level: confidenceLevel,
          is_recommended: isRecommended,
          last_updated: new Date()
        });
      }

      logger.info('AI matching calculated', {
        studentId: studentId,
        projectId: projectId,
        overallScore: overallScore,
        confidenceLevel: confidenceLevel,
        isRecommended: isRecommended
      });

      res.json({
        success: true,
        data: {
          student_id: studentId,
          project_id: projectId,
          overall_score: Math.round(overallScore * 100) / 100,
          confidence_level: confidenceLevel,
          is_recommended: isRecommended,
          detailed_scores: {
            skill_match: Math.round(matchingScores.skill_match * 100) / 100,
            experience_match: Math.round(matchingScores.experience_match * 100) / 100,
            budget_match: Math.round(matchingScores.budget_match * 100) / 100,
            location_match: Math.round(matchingScores.location_match * 100) / 100,
            performance_match: Math.round(matchingScores.performance_match * 100) / 100,
            availability_match: Math.round(matchingScores.availability_match * 100) / 100
          },
          matching_factors: matchingScores.factors
        }
      });

    } catch (error) {
      logger.error('Error calculating AI matching', {
        error: error.message,
        stack: error.stack
      });

      res.status(500).json({
        success: false,
        message: 'Failed to calculate matching',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  /**
   * Get project recommendations for student
   * GET /api/matching/recommendations/:studentId
   */
  static async getRecommendations(req, res) {
    try {
      const { studentId } = req.params;
      const { limit = 10, min_score = 0.3 } = req.query;

      // Verify student exists
      const student = await User.findByPk(studentId, {
        include: [{ model: StudentProfile, as: 'studentProfile' }]
      });

      if (!student || student.user_type !== 'student') {
        return res.status(404).json({
          success: false,
          message: 'Student not found'
        });
      }

      // Get all open projects that student hasn't applied to
      const appliedProjectIds = await Application.findAll({
        where: { student_id: studentId },
        attributes: ['project_id']
      }).then(apps => apps.map(app => app.project_id));

      const availableProjects = await Project.findAll({
        where: {
          status: 'open',
          id: { [Op.notIn]: appliedProjectIds },
          deadline: { [Op.gt]: new Date() } // Not expired
        },
        include: [
          {
            model: User,
            as: 'umkm',
            include: [{ model: UmkmProfile, as: 'umkmProfile' }]
          }
        ]
      });

      // Calculate matching for projects that don't have recent matching data
      const recommendationsPromises = availableProjects.map(async (project) => {
        // Check if we have recent matching data (within 24 hours)
        const existingMatching = await AIMatching.findOne({
          where: {
            student_id: studentId,
            project_id: project.id,
            last_updated: { [Op.gte]: new Date(Date.now() - 24 * 60 * 60 * 1000) }
          }
        });

        if (existingMatching) {
          return {
            project: project,
            matching_score: existingMatching.matching_score,
            confidence_level: existingMatching.confidence_level,
            detailed_scores: {
              skill_match: existingMatching.skill_match_score,
              experience_match: existingMatching.experience_match_score,
              budget_match: existingMatching.budget_match_score,
              location_match: existingMatching.location_match_score,
              performance_match: existingMatching.performance_match_score,
              availability_match: existingMatching.availability_match_score
            }
          };
        }

        // Calculate new matching
        const matchingScores = await AIMatchingController._calculateDetailedScores(student, project);
        const weights = {
          skill_match: 0.35, experience_match: 0.20, budget_match: 0.15,
          location_match: 0.10, performance_match: 0.15, availability_match: 0.05
        };

        const overallScore = Object.keys(weights).reduce((sum, key) => {
          return sum + (matchingScores[key] * weights[key]);
        }, 0);

        let confidenceLevel = 'low';
        if (overallScore >= 0.8) confidenceLevel = 'very_high';
        else if (overallScore >= 0.65) confidenceLevel = 'high';
        else if (overallScore >= 0.45) confidenceLevel = 'medium';

        // Save matching data for future use
        await AIMatching.findOrCreate({
          where: { student_id: studentId, project_id: project.id },
          defaults: {
            matching_score: overallScore,
            skill_match_score: matchingScores.skill_match,
            experience_match_score: matchingScores.experience_match,
            budget_match_score: matchingScores.budget_match,
            location_match_score: matchingScores.location_match,
            performance_match_score: matchingScores.performance_match,
            availability_match_score: matchingScores.availability_match,
            matching_factors: matchingScores.factors,
            confidence_level: confidenceLevel,
            is_recommended: overallScore >= 0.5,
            algorithm_version: '1.0',
            calculated_at: new Date(),
            last_updated: new Date()
          }
        });

        return {
          project: project,
          matching_score: overallScore,
          confidence_level: confidenceLevel,
          detailed_scores: {
            skill_match: matchingScores.skill_match,
            experience_match: matchingScores.experience_match,
            budget_match: matchingScores.budget_match,
            location_match: matchingScores.location_match,
            performance_match: matchingScores.performance_match,
            availability_match: matchingScores.availability_match
          }
        };
      });

      const recommendations = await Promise.all(recommendationsPromises);

      // Filter and sort recommendations
      const filteredRecommendations = recommendations
        .filter(rec => rec.matching_score >= parseFloat(min_score))
        .sort((a, b) => b.matching_score - a.matching_score)
        .slice(0, parseInt(limit))
        .map(rec => ({
          project: {
            id: rec.project.id,
            title: rec.project.title,
            description: rec.project.description,
            category: rec.project.category,
            budget_min: rec.project.budget_min,
            budget_max: rec.project.budget_max,
            duration: rec.project.duration,
            deadline: rec.project.deadline,
            required_skills: rec.project.required_skills,
            experience_level: rec.project.experience_level,
            location_type: rec.project.location_type,
            umkm: {
              business_name: rec.project.umkm.umkmProfile?.business_name || rec.project.umkm.full_name,
              rating: rec.project.umkm.umkmProfile?.rating || 0
            }
          },
          matching_score: Math.round(rec.matching_score * 100) / 100,
          confidence_level: rec.confidence_level,
          detailed_scores: rec.detailed_scores,
          recommendation_strength: rec.matching_score >= 0.7 ? 'strong' : 
                                  rec.matching_score >= 0.5 ? 'moderate' : 'weak'
        }));

      res.json({
        success: true,
        data: {
          recommendations: filteredRecommendations,
          total_projects_analyzed: availableProjects.length,
          recommendations_count: filteredRecommendations.length,
          student_profile: {
            id: student.id,
            name: student.full_name,
            skills: student.studentProfile?.skills || [],
            experience_level: student.studentProfile?.experience_level || 'beginner'
          }
        }
      });

    } catch (error) {
      logger.error('Error getting recommendations', {
        error: error.message,
        studentId: req.params.studentId
      });

      res.status(500).json({
        success: false,
        message: 'Failed to get recommendations',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  /**
   * Get best candidate students for a project
   * GET /api/matching/candidates/:projectId
   */
  static async getCandidates(req, res) {
    try {
      const { projectId } = req.params;
      const { limit = 20, min_score = 0.3 } = req.query;

      // Verify project exists and is open
      const project = await Project.findByPk(projectId, {
        include: [
          {
            model: User,
            as: 'umkm',
            include: [{ model: UmkmProfile, as: 'umkmProfile' }]
          }
        ]
      });

      if (!project) {
        return res.status(404).json({
          success: false,
          message: 'Project not found'
        });
      }

      // Get students who haven't applied yet
      const appliedStudentIds = await Application.findAll({
        where: { project_id: projectId },
        attributes: ['student_id']
      }).then(apps => apps.map(app => app.student_id));

      const availableStudents = await User.findAll({
        where: {
          user_type: 'student',
          is_active: true,
          id: { [Op.notIn]: appliedStudentIds }
        },
        include: [
          {
            model: StudentProfile,
            as: 'studentProfile',
            where: { availability: { [Op.in]: ['available', 'part_time'] } }
          }
        ]
      });

      // Calculate matching scores
      const candidatesPromises = availableStudents.map(async (student) => {
        const existingMatching = await AIMatching.findOne({
          where: {
            student_id: student.id,
            project_id: projectId,
            last_updated: { [Op.gte]: new Date(Date.now() - 24 * 60 * 60 * 1000) }
          }
        });

        if (existingMatching) {
          return {
            student: student,
            matching_score: existingMatching.matching_score,
            confidence_level: existingMatching.confidence_level,
            detailed_scores: {
              skill_match: existingMatching.skill_match_score,
              experience_match: existingMatching.experience_match_score,
              budget_match: existingMatching.budget_match_score,
              location_match: existingMatching.location_match_score,
              performance_match: existingMatching.performance_match_score,
              availability_match: existingMatching.availability_match_score
            }
          };
        }

        // Calculate new matching
        const matchingScores = await AIMatchingController._calculateDetailedScores(student, project);
        const weights = {
          skill_match: 0.35, experience_match: 0.20, budget_match: 0.15,
          location_match: 0.10, performance_match: 0.15, availability_match: 0.05
        };

        const overallScore = Object.keys(weights).reduce((sum, key) => {
          return sum + (matchingScores[key] * weights[key]);
        }, 0);

        let confidenceLevel = 'low';
        if (overallScore >= 0.8) confidenceLevel = 'very_high';
        else if (overallScore >= 0.65) confidenceLevel = 'high';
        else if (overallScore >= 0.45) confidenceLevel = 'medium';

        return {
          student: student,
          matching_score: overallScore,
          confidence_level: confidenceLevel,
          detailed_scores: {
            skill_match: matchingScores.skill_match,
            experience_match: matchingScores.experience_match,
            budget_match: matchingScores.budget_match,
            location_match: matchingScores.location_match,
            performance_match: matchingScores.performance_match,
            availability_match: matchingScores.availability_match
          }
        };
      });

      const candidates = await Promise.all(candidatesPromises);

      // Filter and sort candidates
      const topCandidates = candidates
        .filter(cand => cand.matching_score >= parseFloat(min_score))
        .sort((a, b) => b.matching_score - a.matching_score)
        .slice(0, parseInt(limit))
        .map(cand => ({
          student: {
            id: cand.student.id,
            full_name: cand.student.full_name,
            avatar_url: cand.student.avatar_url,
            profile: {
              university: cand.student.studentProfile?.university,
              major: cand.student.studentProfile?.major,
              semester: cand.student.studentProfile?.semester,
              skills: cand.student.studentProfile?.skills || [],
              experience_level: cand.student.studentProfile?.experience_level,
              rating: cand.student.studentProfile?.rating || 0,
              portfolio_url: cand.student.studentProfile?.portfolio_url,
              availability: cand.student.studentProfile?.availability
            }
          },
          matching_score: Math.round(cand.matching_score * 100) / 100,
          confidence_level: cand.confidence_level,
          detailed_scores: cand.detailed_scores,
          recommendation_strength: cand.matching_score >= 0.7 ? 'strong' : 
                                  cand.matching_score >= 0.5 ? 'moderate' : 'weak'
        }));

      res.json({
        success: true,
        data: {
          candidates: topCandidates,
          total_students_analyzed: availableStudents.length,
          qualified_candidates: topCandidates.length,
          project_info: {
            id: project.id,
            title: project.title,
            category: project.category,
            required_skills: project.required_skills,
            experience_level: project.experience_level
          }
        }
      });

    } catch (error) {
      logger.error('Error getting candidates', {
        error: error.message,
        projectId: req.params.projectId
      });

      res.status(500).json({
        success: false,
        message: 'Failed to get candidates',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  /**
   * Calculate detailed matching scores
   * Private method
   */
  static async _calculateDetailedScores(student, project) {
    const studentProfile = student.studentProfile;
    const projectSkills = project.required_skills || [];
    const studentSkills = studentProfile?.skills || [];

    // 1. Skill Match Score (0-1)
    let skillMatchScore = 0;
    if (projectSkills.length > 0 && studentSkills.length > 0) {
      const matchingSkills = projectSkills.filter(skill => 
        studentSkills.some(studentSkill => 
          studentSkill.toLowerCase().includes(skill.toLowerCase()) ||
          skill.toLowerCase().includes(studentSkill.toLowerCase())
        )
      );
      skillMatchScore = matchingSkills.length / projectSkills.length;
    }

    // 2. Experience Level Match Score (0-1)
    const experienceLevels = { 'beginner': 1, 'intermediate': 2, 'advanced': 3, 'expert': 4 };
    const studentExp = experienceLevels[studentProfile?.experience_level] || 1;
    const projectExp = experienceLevels[project.experience_level] || 1;
    
    let experienceMatchScore = 0;
    if (studentExp >= projectExp) {
      experienceMatchScore = 1 - (studentExp - projectExp) * 0.2; // Slight penalty for overqualification
    } else {
      experienceMatchScore = Math.max(0, 1 - (projectExp - studentExp) * 0.3); // Higher penalty for underqualification
    }
    experienceMatchScore = Math.max(0, Math.min(1, experienceMatchScore));

    // 3. Budget Match Score (0-1)
    let budgetMatchScore = 0.7; // Default neutral score
    if (project.budget_min && project.budget_max) {
      const avgBudget = (parseFloat(project.budget_min) + parseFloat(project.budget_max)) / 2;
      // Simple heuristic: higher budgets get better scores for higher experience levels
      if (studentExp >= 3 && avgBudget >= 5000000) budgetMatchScore = 0.9; // Advanced/Expert + High budget
      else if (studentExp >= 2 && avgBudget >= 2000000) budgetMatchScore = 0.8; // Intermediate + Medium budget
      else if (studentExp === 1 && avgBudget <= 2000000) budgetMatchScore = 0.9; // Beginner + Low budget
    }

    // 4. Location Match Score (0-1)
    let locationMatchScore = 0.8; // Default good score for remote/flexibility
    if (project.location_type === 'remote') {
      locationMatchScore = 1.0; // Perfect for remote
    } else if (project.location_type === 'hybrid') {
      locationMatchScore = 0.7; // Good for hybrid
    } else if (project.location_type === 'onsite') {
      // Would need location comparison logic here
      locationMatchScore = 0.5; // Neutral for onsite
    }

    // 5. Performance Match Score based on student's historical ratings
    let performanceMatchScore = 0.6; // Default for new students
    if (studentProfile?.rating && studentProfile.rating > 0) {
      performanceMatchScore = Math.min(1.0, studentProfile.rating / 5.0);
    }

    // 6. Availability Match Score
    let availabilityMatchScore = 0.5; // Default
    const availability = studentProfile?.availability;
    if (availability === 'available') availabilityMatchScore = 1.0;
    else if (availability === 'part_time') availabilityMatchScore = 0.7;
    else if (availability === 'busy') availabilityMatchScore = 0.3;

    // Matching factors for explanation
    const factors = {
      matching_skills: projectSkills.filter(skill => 
        studentSkills.some(studentSkill => 
          studentSkill.toLowerCase().includes(skill.toLowerCase())
        )
      ),
      missing_skills: projectSkills.filter(skill => 
        !studentSkills.some(studentSkill => 
          studentSkill.toLowerCase().includes(skill.toLowerCase())
        )
      ),
      experience_gap: projectExp - studentExp,
      student_availability: availability,
      project_type: project.location_type,
      student_rating: studentProfile?.rating || 0
    };

    return {
      skill_match: skillMatchScore,
      experience_match: experienceMatchScore,
      budget_match: budgetMatchScore,
      location_match: locationMatchScore,
      performance_match: performanceMatchScore,
      availability_match: availabilityMatchScore,
      factors: factors
    };
  }
}

module.exports = AIMatchingController;