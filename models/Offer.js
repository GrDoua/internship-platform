const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Offer = sequelize.define('Offer', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  titre: {
    type: DataTypes.STRING,
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  entrepriseId: {  // ← Utilise 'entrepriseId' (pas companyId)
    type: DataTypes.INTEGER,
    allowNull: false
  },
  entreprise: {
    type: DataTypes.STRING,
    allowNull: true
  },
  lieu: {
    type: DataTypes.STRING,
    allowNull: true
  },
  type: {
    type: DataTypes.STRING,
    defaultValue: 'Stage'
  },
  duree: {
    type: DataTypes.STRING,
    allowNull: true
  },
  salaire: {
    type: DataTypes.STRING,
    defaultValue: 'Non spécifié'
  },
  competences: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    defaultValue: []
  },
  dateDebut: {
    type: DataTypes.DATE,
    allowNull: true
  },
  estActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    field: 'estActive'  // ← Important : correspond au nom de colonne exact
  },
  dateFin: {
    type: DataTypes.DATE,
    allowNull: true
  },
  niveauRequis: {
    type: DataTypes.STRING,
    defaultValue: 'Débutant'
  },
  nombrePlaces: {
    type: DataTypes.INTEGER,
    defaultValue: 1
  },
  horaires: {
    type: DataTypes.STRING,
    defaultValue: 'Temps plein'
  },
  avantages: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    defaultValue: []
  },
  statut: {
    type: DataTypes.ENUM('active', 'inactive', 'expiree'),
    defaultValue: 'active'
  },
  datePublication: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'Offers',  // ← Important: nom exact de la table
  timestamps: true
});

module.exports = Offer;