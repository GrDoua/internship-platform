const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { isCompany } = require('../middleware/roleMiddleware');
const {
  createOffer,
  getAllOffers,
  getOfferById,
  updateOffer,
  deleteOffer,
  getMyCompanyOffers
} = require('../controllers/offerController');

// Routes publiques
router.get('/', getAllOffers);           // ✅ /api/offers
router.get('/:id', getOfferById);        // ✅ /api/offers/:id

// Routes protégées
router.get('/company/my-offers', protect, isCompany, getMyCompanyOffers);
router.post('/', protect, isCompany, createOffer);
router.put('/:id', protect, isCompany, updateOffer);
router.delete('/:id', protect, isCompany, deleteOffer);

module.exports = router;