const { Company, User, Offer, Application, Student } = require('../models');
const { Op } = require('sequelize');
// controllers/companyController.js - TOUT EN HAUT
const { sequelize } = require('../config/db');
const path = require('path');

// Le reste de ton code...
 

// ========== RÉCUPÉRER PROFIL ENTREPRISE ==========
const getCompanyProfile = async (req, res) => {
  try {
    const company = await Company.findOne({
      where: { userId: req.user.id },
      include: [{ model: User, attributes: ['email'] }]
    });
    
    if (!company) {
      return res.status(404).json({ message: 'Profil entreprise non trouvé' });
    }
    
    res.json({
      success: true,
      company: {
        id: company.id,
        nom: company.nom,
        email: company.User?.email,
        secteur: company.secteur,
        description: company.description,
        telephone: company.telephone,
        adresse: company.localisation,
        siteWeb: company.siteWeb,
        nbEmployes: company.nbEmployes,
        logoPath: company.logoPath
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

// ========== METTRE À JOUR LE PROFIL ENTREPRISE ==========
const updateCompanyProfile = async (req, res) => {
  try {
    const company = await Company.findOne({ where: { userId: req.user.id } });
    if (!company) {
      return res.status(404).json({ message: 'Profil entreprise non trouvé' });
    }
    
    const { nom, email, secteur, description, telephone, adresse, siteWeb, nbEmployes } = req.body;
    
    // Mettre à jour l'email dans User si changé
    if (email && email !== req.user.email) {  // ✅ corrigé: email && email !== req.user.email
      await User.update({ email }, { where: { id: req.user.id } });  // ✅ corrigé: User.update (u minuscule)
    }
    
    await company.update({
      nom: nom || company.nom,
      secteur: secteur || company.secteur,
      description: description || company.description,
      telephone: telephone || company.telephone,
      localisation: adresse || company.localisation,
      siteWeb: siteWeb || company.siteWeb,
      nbEmployes: nbEmployes || company.nbEmployes
    });
    
    res.json({ success: true, company });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

// ========== UPLOAD LOGO ENTREPRISE ==========
const uploadCompanyLogo = async (req, res) => {
  try {
    console.log("📤 Upload logo - req.file:", req.file);
    
    if (!req.file) {
      return res.status(400).json({ message: 'Aucun fichier uploadé' });
    }
    
    const company = await Company.findOne({ where: { userId: req.user.id } });
    if (!company) {
      return res.status(404).json({ message: 'Profil entreprise non trouvé' });
    }
    
    // 🔥 Sauvegarder le nom du fichier dans la base
    const logoFileName = req.file.filename;
    console.log("💾 Sauvegarde logoPath:", logoFileName);
    
    await company.update({ logoPath: logoFileName });
    
    // Vérifier que la mise à jour a fonctionné
    const updatedCompany = await Company.findByPk(company.id);
    console.log("✅ Après update - logoPath:", updatedCompany.logoPath);
    
    res.json({
      success: true,
      message: 'Logo uploadé avec succès',
      logoPath: logoFileName,
      logoUrl: `/uploads/${req.file.destination.split('uploads')[1]}/${logoFileName}`
    });
  } catch (error) {
    console.error("❌ Erreur uploadCompanyLogo:", error);
    res.status(500).json({ message: error.message });
  }
};

// ========== STATISTIQUES DE L'ENTREPRISE ==========
const getCompanyStats = async (req, res) => {
  try {
    const company = await Company.findOne({ where: { userId: req.user.id } });
    if (!company) {
      return res.status(404).json({ message: 'Profil entreprise non trouvé' });
    }
    
    const offers = await Offer.findAll({ where: { companyId: company.id } });
    const offerIds = offers.map(o => o.id);
    
    const applications = await Application.findAll({
      where: { offerId: { [Op.in]: offerIds } }
    });
    
    const offresActives = offers.filter(o => o.estActive === true).length;
    const candidaturesEnAttente = applications.filter(a => a.statut === 'en_attente').length;
    const candidaturesAcceptees = applications.filter(a => a.statut === 'acceptee').length;
    const candidaturesRefusees = applications.filter(a => a.statut === 'refusee').length;
    const tauxAcceptation = applications.length > 0
      ? Math.round((candidaturesAcceptees / applications.length) * 100)
      : 0;
    
    res.json({
      success: true,
      stats: {
        totalOffres: offers.length,
        offresActives,
        totalCandidatures: applications.length,
        candidaturesEnAttente,
        candidaturesAcceptees,
        candidaturesRefusees,
        tauxAcceptation
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};
// @desc    Créer une offre (entreprise)
// @route   POST /api/companies/offers
// @access  Private (Entreprise)
const createOffer = async (req, res) => {
  try {
    console.log("1. Récupération de l'entreprise...");
    const company = await Company.findOne({ where: { userId: req.user.id } });
    
    if (!company) {
      return res.status(404).json({ message: 'Profil entreprise non trouvé' });
    }
    
    console.log("2. Entreprise trouvée:", company.nom);
    
    const {
      titre,
      description,
      lieu,
      type,
      duree,
      salaire,
      competences,
      dateDebut,
      dateFin,
      niveauRequis,
      nombrePlaces,
      horaires,
      avantages
    } = req.body;
    
    console.log("3. Création de l'offre...");
    
    const offer = await Offer.create({
      titre,
      description,
      entrepriseId: company.id,
      entreprise: company.nom,
      lieu,
      type: type || "Stage",
      duree,
      salaire: salaire || "Non spécifié",
      competences: competences || [],
      dateDebut: dateDebut || new Date(),
      dateFin: dateFin || null,
      niveauRequis: niveauRequis || "Débutant",
      nombrePlaces: nombrePlaces || 1,
      horaires: horaires || "Temps plein",
      avantages: avantages || [],
      statut: "active",
      datePublication: new Date()
    });
    
    console.log("4. Offre créée avec succès, ID:", offer.id);
    
    res.status(201).json({
      success: true,
      message: 'Offre publiée avec succès',
      offer
    });
  } catch (error) {
    console.error("❌ Erreur détaillée:", error);
    res.status(500).json({ 
      message: error.message,
      stack: error.stack 
    });
  }
};

// @desc    Récupérer toutes les offres de l'entreprise connectée
// @route   GET /api/companies/offers
// @access  Private (Entreprise)
// companyController.js
// Dans getCompanyOffers - ajoute ces logs:
const getCompanyOffers = async (req, res) => {
  try {
    console.log("🔍 Récupération des offres entreprise...");
    console.log("📝 req.user:", req.user); // Debug: voir ce qu'il y a dans req.user
    console.log("🆔 User ID:", req.user?.id); // Debug: voir l'ID
    
    // Vérification explicite
    if (!req.user || !req.user.id) {
      console.error("❌ Utilisateur non authentifié ou ID manquant");
      return res.status(401).json({ message: 'Utilisateur non authentifié' });
    }
    
    const company = await Company.findOne({ where: { userId: req.user.id } });
    
    if (!company) {
      console.log("❌ Entreprise non trouvée pour userId:", req.user.id);
      return res.status(404).json({ message: 'Profil entreprise non trouvé' });
    }
    
    console.log("✅ Entreprise trouvée:", company.id, company.nom);
    
    const offers = await Offer.findAll({ 
      where: { entrepriseId: company.id },
      order: [['createdAt', 'DESC']]
    });
    
    console.log(`📊 ${offers.length} offres trouvées`);
    
    res.json({ 
      success: true, 
      count: offers.length, 
      offers: offers 
    });
  } catch (error) {
    console.error("❌ Erreur getCompanyOffers:", error);
    res.status(500).json({ message: error.message });
  }
};
// @desc    Récupérer une offre spécifique
// @route   GET /api/companies/offers/:id
// @access  Private (Entreprise)
const getOfferById = async (req, res) => {
  try {
    const company = await Company.findOne({ where: { userId: req.user.id } });
    
    if (!company) {
      return res.status(404).json({ message: 'Profil entreprise non trouvé' });
    }
    
    const offer = await Offer.findOne({
      where: { 
        id: req.params.id,
        entrepriseId: company.id
      }
    });
    
    if (!offer) {
      return res.status(404).json({ message: 'Offre non trouvée' });
    }
    
    res.json({
      success: true,
      offer
    });
  } catch (error) {
    console.error('Erreur récupération offre:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Modifier une offre
// @route   PUT /api/companies/offers/:id
// @access  Private (Entreprise)
const updateOffer = async (req, res) => {
  try {
    const company = await Company.findOne({ where: { userId: req.user.id } });
    
    if (!company) {
      return res.status(404).json({ message: 'Profil entreprise non trouvé' });
    }
    
    const offer = await Offer.findOne({
      where: { 
        id: req.params.id,
        entrepriseId: company.id
      }
    });
    
    if (!offer) {
      return res.status(404).json({ message: 'Offre non trouvée' });
    }
    
    const {
      titre,
      description,
      lieu,
      type,
      duree,
      salaire,
      competences,
      dateDebut,
      dateFin,
      niveauRequis,
      nombrePlaces,
      horaires,
      avantages,
      statut
    } = req.body;
    
    // Mise à jour des champs
    await offer.update({
      titre: titre || offer.titre,
      description: description || offer.description,
      lieu: lieu || offer.lieu,
      type: type || offer.type,
      duree: duree || offer.duree,
      salaire: salaire || offer.salaire,
      competences: competences || offer.competences,
      dateDebut: dateDebut || offer.dateDebut,
      dateFin: dateFin || offer.dateFin,
      niveauRequis: niveauRequis || offer.niveauRequis,
      nombrePlaces: nombrePlaces || offer.nombrePlaces,
      horaires: horaires || offer.horaires,
      avantages: avantages || offer.avantages,
      statut: statut || offer.statut
    });
    
    res.json({
      success: true,
      message: 'Offre modifiée avec succès',
      offer
    });
  } catch (error) {
    console.error('Erreur modification offre:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Supprimer une offre
// @route   DELETE /api/companies/offers/:id
// @access  Private (Entreprise)
const deleteOffer = async (req, res) => {
  try {
    const company = await Company.findOne({ where: { userId: req.user.id } });
    
    if (!company) {
      return res.status(404).json({ message: 'Profil entreprise non trouvé' });
    }
    
    const offer = await Offer.findOne({
      where: { 
        id: req.params.id,
        entrepriseId: company.id
      }
    });
    
    if (!offer) {
      return res.status(404).json({ message: 'Offre non trouvée' });
    }
    
    // Supprimer d'abord les candidatures liées à cette offre
    await Application.destroy({ where: { offreId: offer.id } });
    
    // Puis supprimer l'offre
    await offer.destroy();
    
    res.json({
      success: true,
      message: 'Offre supprimée avec succès'
    });
  } catch (error) {
    console.error('Erreur suppression offre:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Changer le statut d'une offre (activer/désactiver)
// @route   PATCH /api/companies/offers/:id/status
// @access  Private (Entreprise)
const updateOfferStatus = async (req, res) => {
  try {
    const company = await Company.findOne({ where: { userId: req.user.id } });
    
    if (!company) {
      return res.status(404).json({ message: 'Profil entreprise non trouvé' });
    }
    
    const offer = await Offer.findOne({
      where: { 
        id: req.params.id,
        entrepriseId: company.id
      }
    });
    
    if (!offer) {
      return res.status(404).json({ message: 'Offre non trouvée' });
    }
    
    const { statut } = req.body;
    await offer.update({ statut });
    
    res.json({
      success: true,
      message: `Offre ${statut === 'active' ? 'activée' : 'désactivée'} avec succès`,
      offer
    });
  } catch (error) {
    console.error('Erreur changement statut:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Récupérer les candidatures reçues pour les offres de l'entreprise
// @route   GET /api/companies/applications
// @access  Private (Entreprise)
// @desc    Récupérer les candidatures reçues pour les offres de l'entreprise
// @route   GET /api/companies/applications
// @access  Private (Entreprise)
const getCompanyApplications = async (req, res) => {
  try {
    console.log("🔍 Récupération des candidatures...");
    
    if (!req.user || !req.user.id) {
      console.error("❌ Utilisateur non authentifié");
      return res.status(401).json({ message: 'Utilisateur non authentifié' });
    }
    
    const company = await Company.findOne({ where: { userId: req.user.id } });
    
    if (!company) {
      return res.status(404).json({ message: 'Profil entreprise non trouvé' });
    }
    
    const offers = await Offer.findAll({ 
      where: { entrepriseId: company.id },
      attributes: ['id', 'titre', 'duree']
    });
    
    const offerIds = offers.map(o => o.id);
    console.log(`📊 Offres trouvées: ${offerIds.length}`);
    
    if (offerIds.length === 0) {
      return res.json({ success: true, count: 0, applications: [] });
    }
    
    const applications = await Application.findAll({
      where: { offerId: offerIds },
      order: [['createdAt', 'DESC']]
    });
    
    console.log(`📊 ${applications.length} candidatures trouvées`);
    
    // Récupérer les détails des étudiants + évaluations
    const applicationsWithDetails = await Promise.all(applications.map(async (app) => {
      const student = await Student.findOne({ where: { id: app.studentId } });
      const user = student ? await User.findOne({ where: { id: student.userId } }) : null;
      const offer = await Offer.findOne({ where: { id: app.offerId } });
      
      return {
        id: app.id,
        studentId: app.studentId,
        offerId: app.offerId,
        offreTitre: offer ? offer.titre : 'Offre inconnue',
        etudiantNom: student ? `${student.prenom} ${student.nom}` : 'Étudiant inconnu',
        email: user ? user.email : 'Non renseigné',
        telephone: student?.telephone || 'Non renseigné',
        statut: app.statut,
        message: app.message || '',
        date: app.createdAt,
        cvPath: app.cvPath,
        periode: offer?.duree || 'Non spécifiée',
        evaluation: app.evaluation || null  // ← AJOUTE CETTE LIGNE !
      };
    }));
    
    res.json({ 
      success: true, 
      count: applicationsWithDetails.length, 
      applications: applicationsWithDetails 
    });
  } catch (error) {
    console.error("❌ Erreur getCompanyApplications:", error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Mettre à jour le statut d'une candidature (accepter/refuser)
// @route   PUT /api/companies/applications/:id/status
// @access  Private (Entreprise)
// @desc    Mettre à jour le statut d'une candidature (accepter/refuser)
// @route   PUT /api/companies/applications/:id/status
// @access  Private (Entreprise)
const updateApplicationStatus = async (req, res) => {
  try {
    console.log("🔄 Mise à jour du statut de candidature...");
    console.log("Application ID:", req.params.id);
    console.log("User ID:", req.user?.id);
    
    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: 'Utilisateur non authentifié' });
    }
    
    const { status } = req.body;
    const applicationId = req.params.id;
    
    if (!status || !['en_attente', 'acceptee', 'refusee'].includes(status)) {
      return res.status(400).json({ message: 'Statut invalide' });
    }
    
    // 🔧 Version simplifiée - Vérifier étape par étape
    // 1. Récupérer la candidature
    const application = await Application.findByPk(applicationId);
    
    if (!application) {
      console.log("❌ Candidature non trouvée");
      return res.status(404).json({ message: 'Candidature non trouvée' });
    }
    
    console.log("✅ Candidature trouvée:", application.id);
    
    // 2. Récupérer l'offre liée
    const offer = await Offer.findByPk(application.offerId);
    
    if (!offer) {
      console.log("❌ Offre non trouvée");
      return res.status(404).json({ message: 'Offre non trouvée' });
    }
    
    console.log("✅ Offre trouvée:", offer.id, "EntrepriseId:", offer.entrepriseId);
    
    // 3. Vérifier que l'entreprise possède cette offre
    const company = await Company.findOne({ 
      where: { 
        id: offer.entrepriseId,
        userId: req.user.id 
      } 
    });
    
    if (!company) {
      console.log("❌ Entreprise non autorisée");
      return res.status(403).json({ message: 'Vous n\'êtes pas autorisé à modifier cette candidature' });
    }
    
    console.log("✅ Entreprise autorisée:", company.id);
    
    // 4. Mettre à jour le statut
    await application.update({ 
      statut: status,
      examineLe: new Date()
    });
    
    console.log(`✅ Candidature ${applicationId} mise à jour: ${status}`);
    
    res.json({
      success: true,
      message: `Candidature ${status === 'acceptee' ? 'acceptée' : 'refusée'} avec succès`,
      application
    });
  } catch (error) {
    console.error("❌ Erreur updateApplicationStatus:", error);
    res.status(500).json({ message: error.message });
  }
};

// controllers/companyController.js

// ============================================
// AJOUTE CETTE FONCTION
// ============================================
const saveEvaluation = async (req, res) => {
  // Éviter les réponses multiples
  if (res.headersSent) return;
  
  try {
    const { applicationId } = req.params;
    const { 
      studentId, 
      offreTitre, 
      entrepriseNom, 
      ponctualite, 
      qualiteTravail, 
      autonomie, 
      espritEquipe, 
      note, 
      commentaire, 
      progression, 
      dateEvaluation 
    } = req.body;
    
    const companyId = req.user.id;
    
    console.log("📝 Sauvegarde évaluation:", { applicationId, studentId, offreTitre, companyId });
    
    // Validation des données
    if (!applicationId || !studentId) {
      return res.status(400).json({ 
        success: false, 
        message: "applicationId et studentId sont requis" 
      });
    }
    
    // Vérifier si l'évaluation existe déjà
    const existingEval = await sequelize.query(
      `SELECT id FROM evaluations WHERE application_id = $1`,
      {
        bind: [parseInt(applicationId)],
        type: sequelize.QueryTypes.SELECT
      }
    );
    
    if (existingEval && existingEval.length > 0) {
      // Mettre à jour
      await sequelize.query(
        `UPDATE evaluations SET
          ponctualite = $1,
          qualite_travail = $2,
          autonomie = $3,
          esprit_equipe = $4,
          note = $5,
          commentaire = $6,
          progression = $7,
          date_evaluation = $8
        WHERE application_id = $9`,
        {
          bind: [
            parseInt(ponctualite) || 0,
            parseInt(qualiteTravail) || 0,
            parseInt(autonomie) || 0,
            parseInt(espritEquipe) || 0,
            parseInt(note) || 0,
            commentaire || null,
            progression || "moyenne",
            dateEvaluation || new Date(),
            parseInt(applicationId)
          ]
        }
      );
      
      return res.status(200).json({ 
        success: true, 
        message: "Évaluation mise à jour avec succès" 
      });
    } else {
      // Créer une nouvelle évaluation
      await sequelize.query(
        `INSERT INTO evaluations (
          student_id, 
          application_id, 
          offre_titre, 
          entreprise_nom,
          ponctualite, 
          qualite_travail, 
          autonomie, 
          esprit_equipe,
          note, 
          commentaire, 
          progression, 
          date_evaluation, 
          company_id
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
        {
          bind: [
            parseInt(studentId),
            parseInt(applicationId),
            offreTitre || "",
            entrepriseNom || "",
            parseInt(ponctualite) || 0,
            parseInt(qualiteTravail) || 0,
            parseInt(autonomie) || 0,
            parseInt(espritEquipe) || 0,
            parseInt(note) || 0,
            commentaire || null,
            progression || "moyenne",
            dateEvaluation || new Date(),
            parseInt(companyId)
          ]
        }
      );
      
      return res.status(201).json({ 
        success: true, 
        message: "Évaluation enregistrée avec succès" 
      });
    }
    
  } catch (error) {
    console.error("❌ Erreur saveEvaluation:", error);
    
    // Éviter d'envoyer une réponse si déjà envoyée
    if (res.headersSent) return;
    
    return res.status(500).json({ 
      success: false, 
      message: "Erreur lors de l'enregistrement de l'évaluation",
      error: error.message 
    });
  }
};
// @desc    Statistiques avancées pour entreprise
// @route   GET /api/companies/advanced-stats
// @access  Private (Entreprise)
const getAdvancedStats = async (req, res) => {
  try {
    console.log("📊 Récupération statistiques avancées...");
    
    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: 'Utilisateur non authentifié' });
    }
    
    const company = await Company.findOne({ where: { userId: req.user.id } });
    if (!company) {
      return res.status(404).json({ message: 'Profil entreprise non trouvé' });
    }
    
    // Récupérer toutes les offres
    const offers = await Offer.findAll({ 
      where: { entrepriseId: company.id },
      order: [['createdAt', 'ASC']]
    });
    
    const offerIds = offers.map(o => o.id);
    
    // Récupérer toutes les candidatures
    const applications = await Application.findAll({
      where: { offerId: offerIds }
    });
    
    // === 1. Statistiques par mois ===
    const statsParMois = {};
    const mois = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];
    
    applications.forEach(app => {
      const date = new Date(app.createdAt);
      const key = `${mois[date.getMonth()]} ${date.getFullYear()}`;
      if (!statsParMois[key]) {
        statsParMois[key] = { total: 0, acceptees: 0, refusees: 0, enAttente: 0 };
      }
      statsParMois[key].total++;
      if (app.statut === 'acceptee') statsParMois[key].acceptees++;
      else if (app.statut === 'refusee') statsParMois[key].refusees++;
      else statsParMois[key].enAttente++;
    });
    
    // === 2. Top offres avec le plus de candidatures ===
    const topOffres = offers.map(offer => ({
      titre: offer.titre,
      candidatures: applications.filter(a => a.offerId === offer.id).length,
      acceptees: applications.filter(a => a.offerId === offer.id && a.statut === 'acceptee').length,
      taux: applications.filter(a => a.offerId === offer.id).length > 0 
        ? Math.round((applications.filter(a => a.offerId === offer.id && a.statut === 'acceptee').length / 
           applications.filter(a => a.offerId === offer.id).length) * 100)
        : 0
    })).sort((a, b) => b.candidatures - a.candidatures).slice(0, 5);
    
    // === 3. Statistiques par type d'offre ===
    const statsParType = {};
    offers.forEach(offer => {
      const type = offer.type || 'Stage';
      if (!statsParType[type]) {
        statsParType[type] = { total: 0, acceptees: 0 };
      }
      statsParType[type].total++;
      const offreCandidatures = applications.filter(a => a.offerId === offer.id);
      statsParType[type].acceptees += offreCandidatures.filter(a => a.statut === 'acceptee').length;
    });
    
    // === 4. Tendance mensuelle (6 derniers mois) ===
    const tendanceMensuelle = [];
    const today = new Date();
    for (let i = 5; i >= 0; i--) {
      const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const monthName = mois[date.getMonth()];
      const year = date.getFullYear();
      const monthCandidatures = applications.filter(app => {
        const appDate = new Date(app.createdAt);
        return appDate.getMonth() === date.getMonth() && appDate.getFullYear() === year;
      });
      tendanceMensuelle.push({
        mois: `${monthName} ${year}`,
        candidatures: monthCandidatures.length,
        acceptees: monthCandidatures.filter(a => a.statut === 'acceptee').length
      });
    }
    
    // === 5. Performance globale ===
    const totalCandidatures = applications.length;
    const totalAcceptees = applications.filter(a => a.statut === 'acceptee').length;
    const totalRefusees = applications.filter(a => a.statut === 'refusee').length;
    const totalEnAttente = applications.filter(a => a.statut === 'en_attente').length;
    const tauxAcceptationGlobal = totalCandidatures > 0 ? Math.round((totalAcceptees / totalCandidatures) * 100) : 0;
    
    // === 6. Délai moyen de réponse ===
    let delaiTotal = 0;
    let reponsesCount = 0;
    applications.forEach(app => {
      if (app.examineLe && app.postuleLe) {
        const delai = (new Date(app.examineLe) - new Date(app.createdAt)) / (1000 * 60 * 60 * 24);
        delaiTotal += delai;
        reponsesCount++;
      }
    });
    const delaiMoyenReponse = reponsesCount > 0 ? (delaiTotal / reponsesCount).toFixed(1) : 0;
    
    res.json({
      success: true,
      stats: {
        global: {
          totalOffres: offers.length,
          offresActives: offers.filter(o => o.statut === 'active').length,
          totalCandidatures: totalCandidatures,
          tauxAcceptation: tauxAcceptationGlobal,
          delaiMoyenReponse: delaiMoyenReponse
        },
        parMois: Object.entries(statsParMois).map(([mois, data]) => ({ mois, ...data })),
        topOffres: topOffres,
        parType: Object.entries(statsParType).map(([type, data]) => ({ type, ...data })),
        tendanceMensuelle: tendanceMensuelle,
        details: {
          acceptees: totalAcceptees,
          refusees: totalRefusees,
          enAttente: totalEnAttente
        }
      }
    });
    
  } catch (error) {
    console.error("❌ Erreur getAdvancedStats:", error);
    res.status(500).json({ message: error.message });
  }
};
// ========== TÉLÉCHARGER LE CV D'UN CANDIDAT ==========
const getStudentCV = async (req, res) => {
  try {
    const { applicationId } = req.params;
    
    console.log("📥 Téléchargement CV - Application ID:", applicationId);
    
    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: 'Utilisateur non authentifié' });
    }
    
    // 1. Vérifier que l'entreprise existe
    const company = await Company.findOne({ where: { userId: req.user.id } });
    if (!company) {
      return res.status(404).json({ message: 'Profil entreprise non trouvé' });
    }
    
    // 2. Récupérer la candidature
    const application = await Application.findByPk(applicationId);
    if (!application) {
      return res.status(404).json({ message: 'Candidature non trouvée' });
    }
    
    // 3. Vérifier que cette candidature appartient bien à une offre de l'entreprise
    const offer = await Offer.findByPk(application.offerId);
    if (!offer || offer.entrepriseId !== company.id) {
      return res.status(403).json({ message: 'Accès non autorisé à ce CV' });
    }
    
    // 4. Récupérer l'étudiant et son CV
    const student = await Student.findByPk(application.studentId);
    if (!student || !student.cvPath) {
      return res.status(404).json({ message: 'CV non trouvé' });
    }
    
    console.log("📁 cvPath stocké dans Student:", student.cvPath);
    
    // 5. Construire le chemin complet du fichier en utilisant le même dossier que cvController
    const fs = require('fs');
    
    // Utiliser le même chemin que dans cvController
    const UPLOADS_DIR = path.join(__dirname, '../uploads/cvs');
    const cvFullPath = path.join(UPLOADS_DIR, student.cvPath);
    
    console.log("📁 Chemin complet du CV:", cvFullPath);
    console.log("📁 Le fichier existe?", fs.existsSync(cvFullPath));
    
    // 6. Vérifier si le fichier existe
    if (!fs.existsSync(cvFullPath)) {
      console.log("❌ Fichier introuvable au chemin:", cvFullPath);
      return res.status(404).json({ message: 'Fichier CV introuvable sur le serveur' });
    }
    
    // 7. Envoyer le fichier pour téléchargement
    const fileName = student.cvName || `CV_${student.prenom || 'Candidat'}_${student.nom || 'Inconnu'}.pdf`;
    
    res.download(cvFullPath, fileName, (err) => {
      if (err) {
        console.error("❌ Erreur lors du téléchargement:", err);
        if (!res.headersSent) {
          res.status(500).json({ message: 'Erreur lors du téléchargement du CV' });
        }
      } else {
        console.log("✅ CV téléchargé avec succès:", fileName);
      }
    });
    
  } catch (error) {
    console.error("❌ Erreur getStudentCV:", error);
    res.status(500).json({ message: error.message });
  }
};

// N'OUBLIE PAS D'EXPORTER LA FONCTION À LA FIN DU FICHIER
module.exports = {
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
  saveEvaluation,  // ← AJOUTE CETTE LIGNE
  getAdvancedStats,
  getStudentCV
};

