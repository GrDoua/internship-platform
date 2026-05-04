const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { isCompany } = require('../middleware/roleMiddleware');
const { uploadLogo, handleMulterError } = require('../config/multer');

const {
  getCompanyProfile,
  updateCompanyProfile,
  uploadCompanyLogo,
  getCompanyStats,
  createOffer,
  getCompanyOffers,
  getOfferById,
  updateOffer,
  deleteOffer,
  updateOfferStatus,
  getCompanyApplications,
  updateApplicationStatus,
  saveEvaluation,
  getAdvancedStats,
  getStudentCV
} = require('../controllers/companyController');

// ========== PROFIL ==========
router.get('/profile', protect, isCompany, getCompanyProfile);
router.put('/profile', protect, isCompany, updateCompanyProfile);
router.post('/upload-logo', protect, isCompany, uploadLogo, handleMulterError, uploadCompanyLogo);

// ========== STATISTIQUES ==========
router.get('/stats', protect, isCompany, getCompanyStats);
router.get('/advanced-stats', protect, isCompany, getAdvancedStats);

// ========== OFFRES ==========
router.route('/offers')
  .post(protect, isCompany, createOffer)
  .get(protect, isCompany, getCompanyOffers);

router.route('/offers/:id')
  .get(protect, isCompany, getOfferById)
  .put(protect, isCompany, updateOffer)
  .delete(protect, isCompany, deleteOffer);

router.patch('/offers/:id/status', protect, isCompany, updateOfferStatus);

// ========== CANDIDATURES ==========
router.get('/applications', protect, isCompany, getCompanyApplications);
router.put('/applications/:id/status', protect, isCompany, updateApplicationStatus);

// ========== ÉVALUATIONS ==========
// ✅ Correction : utiliser 'applicationId' comme nom de paramètre
 router.post('/evaluations/:applicationId', protect, isCompany, saveEvaluation);

 router.get('/applications/:applicationId/cv', protect, isCompany, getStudentCV);

module.exports = router;