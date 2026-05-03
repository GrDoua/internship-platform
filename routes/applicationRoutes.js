const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { isStudent, isCompany } = require('../middleware/roleMiddleware');
const {
  applyToOffer,
  getMyApplications,
  getCompanyApplications,
  updateApplicationStatus,
  deleteApplication,
  deleteMyApplication,
  getEvaluation,
} = require('../controllers/applicationController');
const{saveEvaluation}= require('../controllers/companyController');

// Routes pour étudiant
router.post('/', protect, isStudent, applyToOffer);                    
router.get('/my-applications', protect, isStudent, getMyApplications); 
router.delete('/my-applications/:id', protect, isStudent, deleteMyApplication);
router.get('/:id/evaluation', protect, isStudent, getEvaluation);

// Routes pour entreprise
router.get('/company-applications', protect, isCompany, getCompanyApplications);
router.put('/:id/status', protect, isCompany, updateApplicationStatus);
router.delete('/:id', protect, isCompany, deleteApplication);
router.post('/:id/evaluation', protect, isCompany, saveEvaluation);  // ← AJOUTER CETTE ROUTE

module.exports = router;