const { Company, Application, Offer, Student } = require('../models/index');  // ✅ CommonJS + Student
const { Op } = require('sequelize');

// ========== 1. CRÉER OFFRE ==========
const createOffer = async (req, res) => {
  try {
    const company = await Company.findOne({ where: { userId: req.user.id } });
    if (!company) {
      return res.status(404).json({ message: 'Entreprise non trouvée' });
    }
    
    const offer = await Offer.create({
      companyId: company.id,
      titre: req.body.titre,
      description: req.body.description,
      competencesRequises: req.body.competencesRequises || [],
      typeStage: req.body.typeStage,
      duree: req.body.duree,
      localisation: req.body.localisation,
      wilaya: req.body.wilaya,
      salaire: req.body.salaire,
      estActive: true
    });
    
    res.status(201).json({ success: true, offer });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });  // ✅ error.message
  }
};

// ========== 2. RÉCUPÉRER TOUTES LES OFFRES ==========
const getAllOffers = async (req, res) => {
  try {
    console.log("📢 getAllOffers appelé");
    
    // Version simple sans jointure
    const offers = await Offer.findAll({
      where: { statut: 'active' },
      order: [['createdAt', 'DESC']]
    });
    
    console.log(`✅ ${offers.length} offres trouvées`);
    
    res.json({
      success: true,
      count: offers.length,
      offers: offers
    });
  } catch (error) {
    console.error("❌ Erreur dans getAllOffers:", error.message);
    res.status(500).json({ message: error.message });
  }
};
// ========== 3. RÉCUPÉRER OFFRE PAR ID ==========
const getOfferById = async (req, res) => {
  try {
    const offer = await Offer.findByPk(req.params.id, {
      include: [{ model: Company, attributes: ['nom', 'logoPath', 'description', 'wilaya'] }]
    });
    
    if (!offer) {
      return res.status(404).json({ message: 'Offre non trouvée' });
    }
    
    res.json({ success: true, offer });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

// ========== 4. MODIFIER OFFRE ==========
const updateOffer = async (req, res) => {
  try {
    const offer = await Offer.findByPk(req.params.id);
    if (!offer) {
      return res.status(404).json({ message: 'Offre non trouvée' });
    }
    
    const company = await Company.findOne({ where: { userId: req.user.id } });  // ✅ findOne
    if (offer.companyId !== company.id) {
      return res.status(403).json({ message: 'Non autorisé' });
    }
    
    await offer.update(req.body);
    res.json({ success: true, offer });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

// ========== 5. SUPPRIMER OFFRE ==========
const deleteOffer = async (req, res) => {
  try {
    const offer = await Offer.findByPk(req.params.id);
    if (!offer) {
      return res.status(404).json({ message: 'Offre non trouvée' });
    }

    const company = await Company.findOne({ where: { userId: req.user.id } });
    if (offer.companyId !== company.id) {
      return res.status(403).json({ message: 'Non autorisé' });
    }

    await offer.destroy();
    res.json({ success: true, message: 'Offre supprimée' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

// ========== 6. OFFRES DE MON ENTREPRISE ==========
const getMyCompanyOffers = async (req, res) => {
  try {
    const company = await Company.findOne({ where: { userId: req.user.id } });
    if (!company) {
      return res.status(404).json({ message: 'Entreprise non trouvée' });
    }

    const offers = await Offer.findAll({
      where: { companyId: company.id },
      include: [{ model: Application, include: [{ model: Student }] }]
    });

    res.json({ success: true, offers });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createOffer,
  getAllOffers,
  getOfferById,
  updateOffer,
  deleteOffer,
  getMyCompanyOffers
};