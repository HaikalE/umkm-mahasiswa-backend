module.exports = (sequelize, DataTypes) => {
  const AIMatching = sequelize.define('ai_matching_data', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    student_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    project_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'projects',
        key: 'id'
      }
    },
    matching_score: {
      type: DataTypes.DECIMAL(5, 4),
      allowNull: false,
      validate: {
        min: 0,
        max: 1
      },
      comment: 'Skor kesesuaian (0-1)'
    },
    skill_match_score: {
      type: DataTypes.DECIMAL(5, 4),
      allowNull: false,
      comment: 'Skor kesesuaian skill'
    },
    experience_match_score: {
      type: DataTypes.DECIMAL(5, 4),
      allowNull: false,
      comment: 'Skor kesesuaian experience level'
    },
    budget_match_score: {
      type: DataTypes.DECIMAL(5, 4),
      allowNull: false,
      comment: 'Skor kesesuaian budget'
    },
    location_match_score: {
      type: DataTypes.DECIMAL(5, 4),
      allowNull: false,
      comment: 'Skor kesesuaian lokasi'
    },
    performance_match_score: {
      type: DataTypes.DECIMAL(5, 4),
      allowNull: false,
      comment: 'Skor berdasarkan performa historis'
    },
    availability_match_score: {
      type: DataTypes.DECIMAL(5, 4),
      allowNull: false,
      comment: 'Skor kesesuaian availability'
    },
    matching_factors: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: 'Detail faktor-faktor matching'
    },
    algorithm_version: {
      type: DataTypes.STRING,
      defaultValue: '1.0',
      comment: 'Versi algoritma yang digunakan'
    },
    recommendation_rank: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'Ranking rekomendasi untuk project ini'
    },
    is_recommended: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: 'Apakah direkomendasi oleh AI'
    },
    confidence_level: {
      type: DataTypes.ENUM('low', 'medium', 'high', 'very_high'),
      defaultValue: 'medium'
    },
    calculated_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    last_updated: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      comment: 'Apakah data ini masih aktif'
    }
  }, {
    indexes: [
      {
        fields: ['student_id']
      },
      {
        fields: ['project_id']
      },
      {
        fields: ['matching_score']
      },
      {
        fields: ['is_recommended']
      },
      {
        fields: ['recommendation_rank']
      },
      {
        fields: ['calculated_at']
      },
      {
        fields: ['confidence_level']
      },
      {
        unique: true,
        fields: ['student_id', 'project_id'],
        name: 'unique_student_project_matching'
      }
    ]
  });

  return AIMatching;
};