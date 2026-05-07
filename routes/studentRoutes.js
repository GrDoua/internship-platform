const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { isStudent } = require('../middleware/roleMiddleware');
const { uploadCV, uploadPhoto, handleMulterError } = require('../config/multer');  // ✅ أضيفي uploadPhoto هنا

const {
  getStudentProfile,
  updateStudentProfile,
  updateSkills,
  uploadStudentPhoto,
  getStudentEvaluations ,
  downloadStudentConvention
} = require('../controllers/studentController');
const { 
  addFavorite, 
  removeFavorite, 
  getFavorites 
} = require('../controllers/favoriteController');

const {
  uploadStudentCV,
  deleteStudentCV,
  downloadStudentCV,
   generateStudentCV
} = require('../controllers/cvController');

// ========== PROFIL ==========
router.get('/profile', protect, isStudent, getStudentProfile);
router.put('/profile', protect, isStudent, updateStudentProfile);
router.put('/skills', protect, isStudent, updateSkills);

// ========== PHOTO ==========
router.post('/upload-photo', protect, isStudent, uploadPhoto, handleMulterError, uploadStudentPhoto);

// ========== CV ==========
router.post('/upload-cv', protect, isStudent, uploadCV, handleMulterError, uploadStudentCV);
router.delete('/cv', protect, isStudent, deleteStudentCV);
router.get('/download-cv', protect, isStudent, downloadStudentCV);
router.post('/generate-cv', protect, generateStudentCV);
// studentRoutes.js - Ajoute ces routes
router.get('/favorites', protect, isStudent, getFavorites);
router.post('/favorites/:offerId', protect, isStudent, addFavorite);
router.delete('/favorites/:offerId', protect, isStudent, removeFavorite);
router.get('/evaluations', protect, isStudent, getStudentEvaluations);

// Ajoute cette route
router.get('/applications/:applicationId/convention', protect, isStudent, downloadStudentConvention);

module.exports = router;