const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { isAdmin, isStudent, isCompany } = require('../middleware/roleMiddleware');
const { uploadConventionPDF, handleMulterError } = require('../config/multer');

const {
  generateAgreement,
  downloadPDF,
  uploadConvention,
  sendConventionToStudent,
  downloadConvention,
  checkAgreement
} = require('../controllers/pdfController');

// ============================================
// ROUTES POUR ADMIN (Gestion des conventions)
// ============================================

// @route   POST /api/pdf/generate/:applicationId
// @desc    Générer une convention automatiquement (PDF)
// @access  Private (Admin only)
router.post('/generate/:applicationId', protect, isAdmin, generateAgreement);

// @route   POST /api/pdf/upload-convention/:applicationId
// @desc    Uploader une convention PDF (quand l'admin accepte)
// @access  Private (Admin only)
router.post(
  '/upload-convention/:applicationId',
  protect,
  isAdmin,
  uploadConventionPDF,
  handleMulterError,
  uploadConvention
);

// @route   POST /api/pdf/send-convention/:applicationId
// @desc    Envoyer la convention par email à l'étudiant
// @access  Private (Admin only)
router.post('/send-convention/:applicationId', protect, isAdmin, sendConventionToStudent);

// ============================================
// ROUTES POUR TOUS LES UTILISATEURS
// ============================================

// @route   GET /api/pdf/download/:id
// @desc    Télécharger une convention par ID
// @access  Private (Admin, Student, Company)
router.get('/download/:id', protect, downloadPDF);

// @route   GET /api/pdf/download-convention/:agreementId
// @desc    Télécharger une convention par ID d'agreement
// @access  Private (Admin, Student, Company)
router.get('/download-convention/:agreementId', protect, downloadConvention);

// @route   GET /api/pdf/check/:applicationId
// @desc    Vérifier si une convention existe pour une candidature
// @access  Private (Admin, Student, Company)
router.get('/check/:applicationId', protect, checkAgreement);

module.exports = router;