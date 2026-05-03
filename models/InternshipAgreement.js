const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');
const Application = require('./Application');
const Student = require('./Student');
const Company = require('./Company');

const InternshipAgreement = sequelize.define('InternshipAgreement', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  pdfPath: {
    type: DataTypes.STRING,
    allowNull: false
  },
  generatedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  status: {
    type: DataTypes.ENUM('pending', 'generated', 'signed'),
    defaultValue: 'pending'
  },
  startDate: {
    type: DataTypes.DATE,
    allowNull: true
  },
  endDate: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  timestamps: true
});
module.exports = InternshipAgreement;