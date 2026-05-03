const { Favorite, Student, Offer } = require('../models');

// @desc    Ajouter aux favoris
// @route   POST /api/students/favorites/:offerId
const addFavorite = async (req, res) => {
  try {
    const { offerId } = req.params;
    const student = await Student.findOne({ where: { userId: req.user.id } });
    
    if (!student) {
      return res.status(404).json({ message: 'Profil étudiant non trouvé' });
    }
    
    const existing = await Favorite.findOne({
      where: { studentId: student.id, offerId }
    });
    
    if (existing) {
      return res.status(400).json({ message: 'Déjà dans les favoris' });
    }
    
    const favorite = await Favorite.create({
      studentId: student.id,
      offerId
    });
    
    res.json({ success: true, favorite });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Retirer des favoris
// @route   DELETE /api/students/favorites/:offerId
const removeFavorite = async (req, res) => {
  try {
    const { offerId } = req.params;
    const student = await Student.findOne({ where: { userId: req.user.id } });
    
    if (!student) {
      return res.status(404).json({ message: 'Profil étudiant non trouvé' });
    }
    
    await Favorite.destroy({
      where: { studentId: student.id, offerId }
    });
    
    res.json({ success: true, message: 'Retiré des favoris' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Récupérer les favoris
// @route   GET /api/students/favorites
const getFavorites = async (req, res) => {
  try {
    const student = await Student.findOne({ where: { userId: req.user.id } });
    
    if (!student) {
      return res.status(404).json({ message: 'Profil étudiant non trouvé' });
    }
    
    const favorites = await Favorite.findAll({
      where: { studentId: student.id },
      include: [{ model: Offer, include: [{ model: Company }] }]
    });
    
    res.json({ success: true, favorites });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

module.exports = { addFavorite, removeFavorite, getFavorites };