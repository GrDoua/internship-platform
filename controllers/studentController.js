const { Student, User, Favorite, Offer } = require('../models');
const { Op } = require('sequelize');

// @desc    Récupérer le profil étudiant
// @route   GET /api/students/profile
const getStudentProfile = async (req, res) => {
  try {
    const student = await Student.findOne({
      where: { userId: req.user.id },
      include: [{ model: User, attributes: ['email'] }]
    });
    
    if (!student) {
      return res.status(404).json({ message: 'Profil étudiant non trouvé' });
    }
    
    // Récupérer les favoris
    const favorites = await Favorite.findAll({
      where: { studentId: student.id },
      attributes: ['offerId']
    });
    const favoriteIds = favorites.map(f => f.offerId);
    
    console.log("📁 CV Path from DB:", student.cvPath); // Debug
    console.log("📁 CV Name from DB:", student.cvName); // Debug
    
    res.json({
      success: true,
      student: {
        id: student.id,
        nom: student.nom,
        prenom: student.prenom,
        email: student.User?.email,
        matricule: student.matricule,
        filiere: student.filiere,
        universite: student.universite,
        niveau: student.niveau,
        telephone: student.telephone,
        adresse: student.adresse,
        bio: student.bio,
        competences: student.competences,
        github: student.github,
        portfolio: student.portfolio,
        cvPath: student.cvPath,     // ← Assure-toi que cette ligne existe
        cvName: student.cvName,     // ← Assure-toi que cette ligne existe
        estPlace: student.estPlace,
        photoPath: student.photoPath,
        favorites: favoriteIds
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Mettre à jour le profil étudiant
// @route   PUT /api/students/profile
const updateStudentProfile = async (req, res) => {
  try {
    const student = await Student.findOne({ where: { userId: req.user.id } });
    if (!student) {
      return res.status(404).json({ message: 'Profil étudiant non trouvé' });
    }
    
    const { 
      nom, prenom, email, matricule, filiere, universite, niveau,
      telephone, adresse, bio, competences, github, portfolio 
    } = req.body;
    
    // Mettre à jour l'email dans User si changé
    if (email && email !== req.user.email) {
      await User.update({ email }, { where: { id: req.user.id } });
    }
    
    // Convertir competences (string → array) si nécessaire
    let competencesArray = competences;
    if (typeof competences === 'string') {
      competencesArray = competences.split(',').map(c => c.trim()).filter(c => c);
    }
    
    await student.update({
      nom: nom || student.nom,
      prenom: prenom || student.prenom,
      matricule: matricule || student.matricule,
      filiere: filiere || student.filiere,
      universite: universite || student.universite,
      niveau: niveau || student.niveau,
      telephone: telephone || student.telephone,
      adresse: adresse || student.adresse,
      bio: bio || student.bio,
      competences: competencesArray || student.competences,
      github: github || student.github,
      portfolio: portfolio || student.portfolio
    });
    
    res.json({ success: true, student });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Mettre à jour les compétences
// @route   PUT /api/students/skills
const updateSkills = async (req, res) => {
  try {
    const { competences } = req.body;
    const student = await Student.findOne({ where: { userId: req.user.id } });
    
    if (!student) {
      return res.status(404).json({ message: 'Profil étudiant non trouvé' });
    }
    
    let competencesArray = competences;
    if (typeof competences === 'string') {
      competencesArray = competences.split(',').map(c => c.trim()).filter(c => c);
    }
    
    await student.update({ competences: competencesArray });
    
    res.json({ success: true, competences: student.competences });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Upload photo de profil
// @route   POST /api/students/upload-photo
const uploadStudentPhoto = async (req, res) => {
  try {
    console.log("=== DÉBUT UPLOAD PHOTO ===");
    console.log("Headers:", req.headers);
    console.log("Body:", req.body);
    console.log("File:", req.file);
    
    if (!req.file) {
      console.log("❌ Aucun fichier dans req.file");
      return res.status(400).json({ message: 'Aucun fichier uploadé' });
    }
    
    console.log("✅ Fichier reçu:", req.file.filename);
    
    const student = await Student.findOne({ where: { userId: req.user.id } });
    if (!student) {
      return res.status(404).json({ message: 'Profil étudiant non trouvé' });
    }
    
    await student.update({ photoPath: req.file.filename });
    console.log("💾 PhotoPath mis à jour:", req.file.filename);
    
    res.json({
      success: true,
      photoUrl: `/uploads/student-photos/${req.file.filename}`
    });
  } catch (error) {
    console.error('❌ Erreur:', error);
    res.status(500).json({ message: error.message });
  }
};


module.exports = {
  getStudentProfile,
  updateStudentProfile,
  updateSkills,
  uploadStudentPhoto,
  
};