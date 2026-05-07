const { Application, Offer, Student, Company, User } = require('../models'); // ← أضفنا User
const { sendCandidatureNotification } = require('../utils/emailService'); // ← نضيفو هاد

// ========== POSTULER À UNE OFFRE ==========
const applyToOffer = async (req, res) => {
  try {
    const { offerId, message } = req.body;
    const student = await Student.findOne({ where: { userId: req.user.id } });

    if (!student) {
      return res.status(404).json({ message: 'Etudiant non trouvé' });
    }

    const offer = await Offer.findByPk(offerId, {
      include: [{ model: Company, include: [{ model: User, attributes: ['email'] }] }]
    });

    if (!offer) {
      return res.status(404).json({ message: 'Offre non trouvée' });
    }

    // vérifier si déjà postulé
    const existingApplication = await Application.findOne({
      where: { studentId: student.id, offerId }
    });

    if (existingApplication) {
      return res.status(400).json({ message: 'Vous avez déjà postulé à cette offre' });
    }

    const application = await Application.create({
      studentId: student.id,
      offerId,
      message,
      statut: 'en_attente'
    });

    // ========== إرسال إشعار للشركة ==========
    try {
      const companyEmail = offer.Company?.User?.email;
      if (companyEmail) {
        await sendCandidatureNotification(
          companyEmail,
          offer.Company.nom,
          `${student.nom} ${student.prenom || ''}`,
          offer.titre
        );
        console.log(`📧 Notification de candidature envoyée à ${companyEmail}`);
      }
    } catch (emailError) {
      console.error('❌ Erreur envoi email:', emailError.message);
    }

    res.status(201).json({ success: true, application });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message }); // ✅ corrigé: status (pas satatus)
  }
};

// ========== MES CANDIDATURES ==========
// @desc    Récupérer les candidatures de l'étudiant connecté
// @route   GET /api/applications/my-applications
// controllers/applicationController.js
const getMyApplications = async (req, res) => {
  try {
    console.log("📋 Récupération des candidatures pour étudiant...");
    
    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: 'Utilisateur non authentifié' });
    }
    
    // Récupérer l'étudiant
    const student = await Student.findOne({ where: { userId: req.user.id } });
    
    if (!student) {
      console.log("❌ Étudiant non trouvé pour userId:", req.user.id);
      return res.status(404).json({ message: 'Profil étudiant non trouvé' });
    }
    
    console.log("✅ Étudiant trouvé, ID:", student.id);
    
    // Récupérer les candidatures
    const applications = await Application.findAll({
      where: { studentId: student.id },
      order: [['createdAt', 'DESC']]
    });
    
    console.log(`📊 ${applications.length} candidatures trouvées`);
    
    // Pour chaque candidature, récupérer l'offre manuellement
    const formattedApplications = [];
    
    for (const app of applications) {
      const offer = await Offer.findByPk(app.offerId);
      
      formattedApplications.push({
        id: app.id,
        statut: app.statut,
        message: app.message,
        date: app.createdAt,
        conventionPath: app.conventionPath,
        offreTitre: offer ? offer.titre : 'Offre inconnue',
        entrepriseNom: offer ? offer.entreprise : 'Entreprise inconnue',
        lieu: offer ? offer.lieu : 'Non spécifié',
        type: offer ? offer.type : 'Stage',
        duree: offer ? offer.duree : 'Non spécifiée',
        salaire: offer ? offer.salaire : 'Non spécifié'
      });
    }
    
    console.log("✅ Candidatures formatées:", formattedApplications.length);
    
    res.json({ 
      success: true, 
      applications: formattedApplications 
    });
  } catch (error) {
    console.error("❌ Erreur getMyApplications:", error);
    res.status(500).json({ message: error.message });
  }
};

// ========== CANDIDATURES REÇUES (ENTREPRISE) ==========
const getCompanyApplications = async (req, res) => {
  try {
    const company = await Company.findOne({ where: { userId: req.user.id } });
    if (!company) {
      return res.status(404).json({ message: 'Profil entreprise non trouvé' });
    }

    const offers = await Offer.findAll({
      where: { companyId: company.id },
      include: [{
        model: Application,
        include: [{ model: Student, include: [{ model: User, attributes: ['email'] }] }]
      }]
    });

    const applications = offers.flatMap(offer => offer.Applications || []);

    res.json({ success: true, applications });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

// ========== CHANGER STATUT CANDIDATURE ==========
const updateApplicationStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const application = await Application.findByPk(req.params.id, {  // ✅ corrigé: application (singulier)
      include: [{ model: Offer, include: [{ model: Company }] }, { model: Student }]
    });

    if (!application) {
      return res.status(404).json({ message: 'Candidature non trouvée' });
    }

    const company = await Company.findOne({ where: { userId: req.user.id } });
    if (application.Offer.companyId !== company.id) {  // ✅ corrigé: application.Offer
      return res.status(403).json({ message: 'Non autorisé' });
    }

    await application.update({
      statut: status,
      examineLe: new Date()
    });

    if (status === 'acceptee') {
      await application.Student.update({ estPlace: true });
    }

    res.json({ success: true, application });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

// ========== ENREGISTRER ÉVALUATION D'UN STAGIAIRE ==========
const saveEvaluation = async (req, res) => {
  try {
    const { id } = req.params;
    const { ponctualite, qualiteTravail, autonomie, espritEquipe, note, commentaire, progression } = req.body;

    const application = await Application.findByPk(id, {
      include: [{ model: Offer, include: [{ model: Company }] }]
    });

    if (!application) {
      return res.status(404).json({ message: 'Candidature non trouvée' });
    }

    // vérifier que l'entreprise est propriétaire
    const company = await Company.findOne({ where: { userId: req.user.id } });
    if (application.Offer.companyId !== company.id) {
      return res.status(403).json({ message: 'Non autorisé' });
    }

    // vérifier que la candidature est acceptée
    if (application.statut !== 'acceptee') {  // ✅ corrigé: acceptee (pas accepte)
      return res.status(400).json({ message: 'Seul un stagiaire accepté peut être évalué' });
    }

    const evaluation = {
      ponctualite: ponctualite || 15,
      qualiteTravail: qualiteTravail || 15,
      autonomie: autonomie || 15,
      espritEquipe: espritEquipe || 15,
      note: note || 4,
      commentaire: commentaire || '',
      progression: progression || '',
      dateEvaluation: new Date().toLocaleDateString('fr-FR'),
      evaluateur: company.nom
    };

    await application.update({ evaluation });

    res.json({ success: true, message: 'Évaluation enregistrée', evaluation });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });  // ✅ corrigé: status
  }
};


// ========== SUPPRIMER UNE CANDIDATURE (ÉTUDIANT) ==========
// @desc    Supprimer une candidature de l'étudiant connecté
// @route   DELETE /api/applications/my-applications/:id
const deleteMyApplication = async (req, res) => {
  try {
    console.log(`🗑️ Suppression de la candidature ID: ${req.params.id}`);
    
    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: 'Utilisateur non authentifié' });
    }
    
    // Récupérer l'étudiant
    const student = await Student.findOne({ where: { userId: req.user.id } });
    
    if (!student) {
      console.log("❌ Étudiant non trouvé pour userId:", req.user.id);
      return res.status(404).json({ message: 'Profil étudiant non trouvé' });
    }
    
    // Récupérer la candidature
    const application = await Application.findOne({
      where: { 
        id: req.params.id,
        studentId: student.id
      }
    });
    
    if (!application) {
      return res.status(404).json({ message: 'Candidature non trouvée ou non autorisée' });
    }
    
    // Vérifier si la candidature est déjà traitée
    if (application.statut === 'acceptee') {
      return res.status(400).json({ 
        message: '❌ Impossible de supprimer une candidature déjà acceptée. Veuillez contacter l\'entreprise.' 
      });
    }
    
    if (application.statut === 'refusee') {
      return res.status(400).json({ 
        message: '❌ Impossible de supprimer une candidature déjà refusée.' 
      });
    }
    
    // Supprimer la candidature
    await application.destroy();
    
    console.log(`✅ Candidature ${req.params.id} supprimée avec succès`);
    
    res.json({ 
      success: true, 
      message: 'Candidature supprimée avec succès' 
    });
  } catch (error) {
    console.error("❌ Erreur deleteMyApplication:", error);
    res.status(500).json({ message: error.message });
  }
};

// ========== SUPPRIMER UNE CANDIDATURE (POUR ADMIN/ENTREPRISE - OPTIONNEL) ==========
// @desc    Supprimer une candidature (admin ou entreprise propriétaire)
// @route   DELETE /api/applications/:id
const deleteApplication = async (req, res) => {
  try {
    console.log(`🗑️ Suppression de la candidature ID: ${req.params.id} par ${req.user.role}`);
    
    // Récupérer la candidature avec l'offre
    const application = await Application.findByPk(req.params.id, {
      include: [{ model: Offer }]
    });
    
    if (!application) {
      return res.status(404).json({ message: 'Candidature non trouvée' });
    }
    
    // Vérifier les permissions
    if (req.user.role === 'entreprise') {
      const company = await Company.findOne({ where: { userId: req.user.id } });
      if (!company || application.Offer.companyId !== company.id) {
        return res.status(403).json({ message: 'Non autorisé à supprimer cette candidature' });
      }
    } else if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Non autorisé' });
    }
    
    // Supprimer la candidature
    await application.destroy();
    
    console.log(`✅ Candidature ${req.params.id} supprimée avec succès par ${req.user.role}`);
    
    res.json({ 
      success: true, 
      message: 'Candidature supprimée avec succès' 
    });
  } catch (error) {
    console.error("❌ Erreur deleteApplication:", error);
    res.status(500).json({ message: error.message });
  }
};
// ========== RÉCUPÉRER UNE ÉVALUATION SPÉCIFIQUE ==========
// @desc    Récupérer l'évaluation d'une candidature spécifique
// @route   GET /api/applications/:id/evaluation
const getEvaluation = async (req, res) => {
  try {
    const application = await Application.findByPk(req.params.id, {
      include: [{ model: Offer }]
    });

    if (!application) {
      return res.status(404).json({ message: 'Candidature non trouvée' });
    }

    // Vérifier les droits d'accès
    if (req.user.role === 'etudiant') {
      const student = await Student.findOne({ where: { userId: req.user.id } });
      if (!student || application.studentId !== student.id) {
        return res.status(403).json({ message: 'Non autorisé' });
      }
    }

    res.json({ 
      success: true, 
      evaluation: application.evaluation || null 
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  applyToOffer,
  getMyApplications,        // ✅ corrigé: getMyApplications
  getCompanyApplications,
  updateApplicationStatus,
  deleteApplication,
  deleteMyApplication,
  getEvaluation
};