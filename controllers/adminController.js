const { User, Admin, Student, Company, Offer, Application } = require('../models');  // ← أضفنا Student, Company, Offer, Application
const bcrypt = require('bcryptjs');
const { Op } = require('sequelize');

// ========== 1. RÉCUPÉRER PROFIL ADMIN ==========
const getAdminProfile = async (req, res) => {
  try {
    const admin = await Admin.findOne({
      where: { userId: req.user.id },
      include: [{ model: User, attributes: ['email'] }]
    });
    if (!admin) {
      return res.status(404).json({ message: 'Profil admin non trouvé' });
    }
    res.json({
      success: true,
      admin: {
        id: admin.id,
        fullName: admin.fullName,
        titre: admin.titre,
        department: admin.department,
        email: admin.User?.email,
        telephone: admin.telephone,
        bureau: admin.bureau,
        bio: admin.bio,
        photoPath: admin.photoPath
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

// ========== 2. METTRE À JOUR PROFIL ADMIN ==========
const updateAdminProfile = async (req, res) => {
  try {
    const { fullName, titre, email, telephone, bureau, bio } = req.body;
    const admin = await Admin.findOne({ where: { userId: req.user.id } });  // ✅ req.user.id (u صغيرة)
    if (!admin) {
      return res.status(404).json({ message: 'Profil admin non trouvé' });
    }
    
    // Mettre à jour l'email dans User si changé
    if (email && email !== req.user.email) {  // ✅ && (pas &)
      await User.update({ email }, { where: { id: req.user.id } });
    }

    await admin.update({
      fullName: fullName || admin.fullName,
      titre: titre || admin.titre,
      telephone: telephone || admin.telephone,
      bureau: bureau || admin.bureau,
      bio: bio || admin.bio
    });

    const updatedUser = await User.findByPk(req.user.id);
    res.json({
      success: true,
      admin: {
        id: admin.id,
        fullName: admin.fullName,
        titre: admin.titre,
        department: admin.department,
        email: updatedUser.email,
        telephone: admin.telephone,
        bureau: admin.bureau,
        bio: admin.bio
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });  // ✅ error.message
  }
};

// ========== 3. UPLOAD PHOTO ADMIN ==========
const uploadAdminPhoto = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Aucun fichier uploadé' });
    }
    const admin = await Admin.findOne({ where: { userId: req.user.id } });
    if (!admin) {
      return res.status(404).json({ message: 'Profil admin non trouvé' });
    }

    if (admin.photoPath) {
      const fs = require('fs');
      const path = require('path');
      const oldPath = path.join('./uploads/admin-photos', admin.photoPath);
      if (fs.existsSync(oldPath)) {
        fs.unlinkSync(oldPath);
      }
    }
    await admin.update({ photoPath: req.file.filename });
    
    res.json({
      success: true,
      photoUrl: `/uploads/admin-photos/${req.file.filename}`
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

// ========== 4. CHANGER MOT DE PASSE ADMIN ==========
const changeAdminPassword = async (req, res) => {
  try {
    const { ancienMotDePasse, nouveauMotDePasse } = req.body;
    const user = await User.findByPk(req.user.id);
    const isPasswordValid = await user.comparePassword(ancienMotDePasse);

    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Ancien mot de passe incorrect' });
    }
    
    user.password = nouveauMotDePasse;
    await user.save();
    res.json({ success: true, message: 'Mot de passe changé avec succès' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

// ========== 5. STATISTIQUES GLOBALES ==========
const getStatistics = async (req, res) => {
  try {
    const totalStudents = await Student.count();
    const totalCompanies = await Company.count();
    const totalOffers = await Offer.count();
    const totalApplications = await Application.count();
    
    const placedStudents = await Student.count({ where: { estPlace: true } });
    const unplacedStudents = totalStudents - placedStudents;
    
    const pendingApplications = await Application.count({ where: { statut: 'en_attente' } });
    const acceptedApplications = await Application.count({ where: { statut: 'acceptee' } });
    const refusedApplications = await Application.count({ where: { statut: 'refusee' } });

    const activeOffers = await Offer.count({ where: { estActive: true } });
    const inactiveOffers = totalOffers - activeOffers;
    
    res.json({
      success: true,
      stats: {
        students: { total: totalStudents, placed: placedStudents, unplaced: unplacedStudents },
        companies: totalCompanies,
        offers: { total: totalOffers, active: activeOffers, inactive: inactiveOffers },
        applications: { total: totalApplications, pending: pendingApplications, accepted: acceptedApplications, refused: refusedApplications }
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

// ========== 6. RÉCUPÉRER TOUS LES ÉTUDIANTS ==========
const getAllStudents = async (req, res) => {
  try {
    const students = await Student.findAll({
      include: [{ model: User, attributes: ['email', 'isActive'] }]
    });
    res.json({ success: true, count: students.length, students });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

// ========== 7. RÉCUPÉRER TOUTES LES ENTREPRISES ==========
const getAllCompanies = async (req, res) => {
  try {
    const companies = await Company.findAll({
      include: [{ model: User, attributes: ['email', 'isActive'] }]
    });
    res.json({ success: true, count: companies.length, companies });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

// ========== 8. ACTIVER/DÉSACTIVER UN UTILISATEUR ==========
const toggleUserStatus = async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }
    await user.update({ isActive: !user.isActive });
    res.json({
      success: true,
      message: `Utilisateur ${user.isActive ? 'activé' : 'désactivé'}`,
      isActive: user.isActive
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

// ========== 9. SUPPRIMER UNE OFFRE ==========
const deleteOfferByAdmin = async (req, res) => {
  try {
    const offer = await Offer.findByPk(req.params.offerId);
    if (!offer) {
      return res.status(404).json({ message: 'Offre non trouvée' });
    }
    await offer.destroy();
    res.json({ success: true, message: 'Offre supprimée par l\'administration' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

// ========== 10. RÉCUPÉRER TOUTES LES CANDIDATURES ==========
const getAllApplications = async (req, res) => {
  try {
    const applications = await Application.findAll({
      include: [
        { model: Student, include: [{ model: User, attributes: ['email'] }] },
        { model: Offer, include: [{ model: Company }] }
      ],
      order: [['createdAt', 'DESC']]
    });
    res.json({ success: true, count: applications.length, applications });
  } catch (error) {
    console.error(error);  // ✅ console.error (c في البداية)
    res.status(500).json({ message: error.message });
  }
};

// ========== 11. VALIDER UN STAGE ==========
const validateInternship = async (req, res) => {  // ✅ validateInternship (s dans internship)
  try {
    const application = await Application.findByPk(req.params.applicationId, {
      include: [
        { model: Student },
        { model: Offer, include: [{ model: Company }] }
      ]
    });
    if (!application) {
      return res.status(404).json({ message: 'Candidature non trouvée' });
    }
    if (application.statut !== 'acceptee') {  // ✅ statut (pas status) و acceptee
      return res.status(400).json({ message: 'La candidature doit être acceptée d\'abord par l\'entreprise' });
    }
    if (application.valideParAdmin) {
      return res.status(400).json({ message: 'Déjà validée par l\'administration' });
    }
    await application.update({ valideParAdmin: true });
    await application.Student.update({ estPlace: true });
    res.json({
      success: true,
      message: 'Stage validé par l\'administration',
      application
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

// ========== EXPORT ==========
module.exports = {
  getAdminProfile,
  updateAdminProfile,
  uploadAdminPhoto,
  changeAdminPassword,
  getStatistics,
  getAllStudents,
  getAllCompanies,
  toggleUserStatus,
  deleteOfferByAdmin,
  getAllApplications,
  validateInternship  // ✅ validateInternship (pas validateIntership)
};