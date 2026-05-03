const express = require('express');
const router = express.Router();
const { 
  register, 
  login, 
  changePassword, 
  getMe 
} = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

// ========== ROUTES PUBLIQUES ==========

// @route   POST /api/auth/register
// @desc    Inscription (étudiant, entreprise, admin)
// @access  Public
router.post('/register', register);

// @route   POST /api/auth/login
// @desc    Connexion
// @access  Public
router.post('/login', login);

// ========== ROUTES PROTÉGÉES ==========

// @route   GET /api/auth/me
// @desc    Récupérer l'utilisateur connecté
// @access  Private
router.get('/me', protect, getMe);

// @route   PUT /api/auth/change-password
// @desc    Changer le mot de passe
// @access  Private
router.put('/change-password', protect, changePassword);

module.exports = router;