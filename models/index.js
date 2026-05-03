
const User = require('./User');
const Student = require('./Student');
const Company = require('./Company');
const Admin = require('./Admin');
const Offer = require('./Offer');
const Application = require('./Application');
const InternshipAgreement = require('./InternshipAgreement');
const Notification = require('./Notification');
const Favorite = require('./Favorite');

// ========== RELATIONS ==========

// User → Student (1-1)
User.hasOne(Student, { foreignKey: 'userId', onDelete: 'CASCADE' });
Student.belongsTo(User, { foreignKey: 'userId' });

// User → Company (1-1)
User.hasOne(Company, { foreignKey: 'userId', onDelete: 'CASCADE' });
Company.belongsTo(User, { foreignKey: 'userId' });

// User → Admin (1-1)
User.hasOne(Admin, { foreignKey: 'userId', onDelete: 'CASCADE' });
Admin.belongsTo(User, { foreignKey: 'userId' });

// Company → Offer (1-N)
Company.hasMany(Offer, { foreignKey: 'companyId', onDelete: 'CASCADE' });
Offer.belongsTo(Company, { foreignKey: 'companyId' });

// Student → Application (1-N)
Student.hasMany(Application, { foreignKey: 'studentId', onDelete: 'CASCADE' });
Application.belongsTo(Student, { foreignKey: 'studentId' });

// Offer → Application (1-N)
Offer.hasMany(Application, { foreignKey: 'offerId', onDelete: 'CASCADE' });
Application.belongsTo(Offer, { foreignKey: 'offerId' });

// Application → InternshipAgreement (1-1)
Application.hasOne(InternshipAgreement, { foreignKey: 'applicationId', onDelete: 'CASCADE' });
InternshipAgreement.belongsTo(Application, { foreignKey: 'applicationId' });

// User → Notification (1-N)
User.hasMany(Notification, { foreignKey: 'userId', onDelete: 'CASCADE' });
Notification.belongsTo(User, { foreignKey: 'userId' });
//favorite
Student.hasMany(Favorite, { foreignKey: 'studentId' });
Favorite.belongsTo(Student, { foreignKey: 'studentId' });

Offer.hasMany(Favorite, { foreignKey: 'offerId' });
Favorite.belongsTo(Offer, { foreignKey: 'offerId' });

// ========== EXPORT ==========
module.exports = {
  User,
  Student,
  Company,
  Admin,
  Offer,
  Application,
  InternshipAgreement,
  Notification,
  Favorite
};