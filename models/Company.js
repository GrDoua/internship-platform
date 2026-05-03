const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Company = sequelize.define('Company', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  nom: {                                    // ← name → nom
    type: DataTypes.STRING,
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  logoPath: {
    type: DataTypes.STRING,
    allowNull: true
  },
  localisation: {                           // ← location → localisation
    type: DataTypes.STRING,
    allowNull: true
  },
  wilaya: {
    type: DataTypes.STRING,
    allowNull: true
  },
  siteWeb: {                                // ← website → siteWeb
    type: DataTypes.STRING,
    allowNull: true
  },
  telephone: {                              // ← phone → telephone
    type: DataTypes.STRING,
    allowNull: true
  },
  secteur: {                                // ← sector → secteur
    type: DataTypes.STRING,
    allowNull: true
  }
}, {
  tableName: 'Companies',
  timestamps: true
});

module.exports = Company;