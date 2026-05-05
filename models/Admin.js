const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Admin = sequelize.define('Admin', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  fullName: {
    type: DataTypes.STRING,
    allowNull: false
  },
  titre: {                                    // ← AJOUTÉ (pour titre professionnel)
    type: DataTypes.STRING,
    allowNull: true
  },
  department: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: "Bureau des Stages"
  },
  telephone: {
    type: DataTypes.STRING,
    allowNull: true
  },
  bureau: {                                   // ← AJOUTÉ (numéro de bureau)
    type: DataTypes.STRING,
    allowNull: true
  },
  bio: {                                      // ← AJOUTÉ (biographie)
    type: DataTypes.TEXT,
    allowNull: true
  },
  photoPath: {                                // ← AJOUTÉ (photo de profil)
    type: DataTypes.STRING,
    allowNull: true
  },
  universite: {  // ← AJOUTE CETTE LIGNE
    type: DataTypes.STRING,
    allowNull: true  // Si null, l'admin voit tous les étudiants
  }
}, {
   tableName: 'Admins',
  timestamps: true
});

module.exports = Admin;