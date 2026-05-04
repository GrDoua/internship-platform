const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { isAdmin } = require('../middleware/roleMiddleware');
const { uploadPhoto, uploadConventionPDF, handleMulterError } = require('../config/multer');

const {
  // Profil admin
  getAdminProfile,
  updateAdminProfile,
  uploadAdminPhoto,
  changeAdminPassword,
  // Statistiques
  getStatistics,
  // Gestion utilisateurs
  getAllStudents,
  getAllCompanies,
  toggleUserStatus,
  deleteOfferByAdmin,
  generateConvention,
  // Gestion candidatures
  getAllApplications,
  validateInternship,
  uploadConvention  // ← Ajoute cette fonction
} = require('../controllers/adminController');

// ========== PROFIL ADMIN ==========
router.get('/profile', protect, isAdmin, getAdminProfile);
router.put('/profile', protect, isAdmin, updateAdminProfile);
router.post('/upload-photo', protect, isAdmin, uploadPhoto, handleMulterError, uploadAdminPhoto);
router.put('/change-password', protect, isAdmin, changeAdminPassword);

// ========== STATISTIQUES ==========
router.get('/stats', protect, isAdmin, getStatistics);

// ========== GESTION CANDIDATURES ==========
router.get('/applications', protect, isAdmin, getAllApplications);
router.put('/validate/:applicationId', protect, isAdmin, validateInternship);
// Route pour uploader la convention
router.post('/applications/:applicationId/convention', protect, isAdmin, uploadConventionPDF, handleMulterError, uploadConvention);

// ========== GESTION UTILISATEURS ==========
router.get('/students', protect, isAdmin, getAllStudents);
router.get('/companies', protect, isAdmin, getAllCompanies);
router.put('/users/:userId/toggle-status', protect, isAdmin, toggleUserStatus);

// ========== GESTION OFFRES ==========
router.delete('/offers/:offerId', protect, isAdmin, deleteOfferByAdmin);
// Ajoute cette route après les autres routes de candidatures
router.post('/applications/:applicationId/generate-convention', protect, isAdmin, generateConvention);

module.exports = router;