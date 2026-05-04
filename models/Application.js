const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Application = sequelize.define('Application', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  // ✅ AJOUTE CETTE FOREIGN KEY
  studentId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Students',  // Table des étudiants
      key: 'id'
    },
    onDelete: 'CASCADE'
  },
  // ✅ AJOUTE CETTE FOREIGN KEY
  offerId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Offers',    // Table des offres
      key: 'id'
    },
    onDelete: 'CASCADE'
  },
  statut: {
    type: DataTypes.ENUM('en_attente', 'acceptee', 'refusee'),
    defaultValue: 'en_attente'
  },
  message: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  cvPath: {               // ✅ AJOUTE aussi le CV path
    type: DataTypes.STRING,
    allowNull: true
  },
  valideParAdmin: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  postuleLe: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  evaluation: {
    type: DataTypes.JSON,  // ← Change STRING en JSON
   allowNull: true,
   defaultValue: null
},
conventionPath: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'conventionPath'
  },
  conventionName: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'conventionName'
  },
  conventionUploadedAt: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'conventionUploadedAt'
  },
  examineLe: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  tableName: 'Applications',
  timestamps: true,
  // ✅ AJOUTE LES INDEX
  indexes: [
    {
      fields: ['studentId']
    },
    {
      fields: ['offerId']
    }
  ]
});

// ✅ AJOUTE LES ASSOCIATIONS
Application.associate = (models) => {
  Application.belongsTo(models.Student, { foreignKey: 'studentId' });
  Application.belongsTo(models.Offer, { foreignKey: 'offerId' });
};

module.exports = Application;