// controllers/studentController.js

const { Student, User, Favorite, Offer,Application } = require('../models');
const { Op } = require('sequelize');
const { sequelize } = require('../config/db');  // ← AJOUTE CETTE LIGNE

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
        cvPath: student.cvPath,
        cvName: student.cvName,
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

const getStudentEvaluations = async (req, res) => {
  try {
    const student = await Student.findOne({ 
      where: { userId: req.user.id },
      attributes: ['id']
    });
    
    if (!student) {
      return res.status(404).json({ 
        success: false, 
        message: 'Profil étudiant non trouvé' 
      });
    }
    
    const studentId = student.id;
    console.log("📝 Récupération évaluations pour étudiant ID:", studentId);
    
    // Version avec jointure à Companies (avec guillemets)
    const evaluations = await sequelize.query(
      `SELECT 
        e.id,
        e.student_id,
        e.application_id,
        e.offre_titre,
        e.entreprise_nom,
        e.ponctualite,
        e.qualite_travail,
        e.autonomie,
        e.esprit_equipe,
        e.note,
        e.commentaire,
        e.progression,
        e.date_evaluation,
        e.company_id,
        e.created_at,
        c.nom as entreprise_nom_complete
      FROM "evaluations" e
      LEFT JOIN "Companies" c ON e.company_id = c.id
      WHERE e.student_id = $1
      ORDER BY e.date_evaluation DESC`,
      {
        bind: [studentId],
        type: sequelize.QueryTypes.SELECT
      }
    );
    
    console.log(`📊 ${evaluations.length} évaluations trouvées`);
    
    res.status(200).json({ 
      success: true, 
      evaluations: evaluations
    });
    
  } catch (error) {
    console.error("❌ Erreur getStudentEvaluations:", error);
    res.status(500).json({ 
      success: false, 
      message: "Erreur lors de la récupération des évaluations",
      error: error.message 
    });
  }
};
// ========== TÉLÉCHARGER LA CONVENTION ==========
// ========== TÉLÉCHARGER LA CONVENTION ==========
const downloadStudentConvention = async (req, res) => {
  try {
    const { applicationId } = req.params;
    const userId = req.user.id;
    
    console.log("📥 Téléchargement convention - Application ID:", applicationId);
    console.log("👤 User ID:", userId);
    
    // Récupérer l'étudiant à partir de l'utilisateur
    const student = await Student.findOne({ where: { userId: userId } });
    
    if (!student) {
      console.log("❌ Étudiant non trouvé pour userId:", userId);
      return res.status(404).json({ message: 'Profil étudiant non trouvé' });
    }
    
    console.log("✅ Étudiant trouvé - ID:", student.id);
    
    // Vérifier que la candidature appartient à l'étudiant
    const application = await Application.findOne({
      where: { 
        id: applicationId,
        studentId: student.id
      }
    });
    
    console.log("🔍 Recherche candidature avec studentId:", student.id, "et applicationId:", applicationId);
    console.log("📊 Résultat:", application);
    
    if (!application) {
      return res.status(404).json({ message: 'Candidature non trouvée pour cet étudiant' });
    }
    
    if (!application.conventionPath) {
      return res.status(404).json({ message: 'Aucune convention disponible pour cette candidature' });
    }
    
    // Chemin du fichier
    const fs = require('fs');
    const path = require('path');
    
    // Chercher le fichier dans différents dossiers
    const possiblePaths = [
      path.join(__dirname, '../uploads/conventions', application.conventionPath),
      path.join(__dirname, '../uploads/cvs', application.conventionPath),
      path.join(__dirname, '../uploads', application.conventionPath)
    ];
    
    let filePath = null;
    for (const p of possiblePaths) {
      if (fs.existsSync(p)) {
        filePath = p;
        console.log("✅ Fichier trouvé:", p);
        break;
      }
    }
    
    if (!filePath) {
      console.log("❌ Fichier non trouvé dans:", possiblePaths);
      return res.status(404).json({ message: 'Fichier convention introuvable sur le serveur' });
    }
    
    // Envoyer le fichier
    const fileName = application.conventionName || `convention_${applicationId}.pdf`;
    res.download(filePath, fileName);
    
  } catch (error) {
    console.error("❌ Erreur downloadConvention:", error);
    res.status(500).json({ message: error.message });
  }
};
// ============================================
// EXPORTS
// ============================================
module.exports = {
  getStudentProfile,
  updateStudentProfile,
  updateSkills,
  uploadStudentPhoto,
  downloadStudentConvention,
  getStudentEvaluations  // ← Assure-toi que cette ligne existe
};