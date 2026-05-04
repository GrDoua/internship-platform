const { User, Admin, Student, Company, Offer, Application } = require('../models');  // ← أضفنا Student, Company, Offer, Application
const bcrypt = require('bcryptjs');
const { Op } = require('sequelize');

// ========== 1. RÉCUPÉRER PROFIL ADMIN ==========
const getAdminProfile = async (req, res) => {
  try {
    const admin = await Admin.findOne({
      where: { userId: req.user.id },
      include: [{ model: User, attributes: ['email'] }]
    });
    if (!admin) {
      return res.status(404).json({ message: 'Profil admin non trouvé' });
    }
    res.json({
      success: true,
      admin: {
        id: admin.id,
        fullName: admin.fullName,
        titre: admin.titre,
        department: admin.department,
        email: admin.User?.email,
        telephone: admin.telephone,
        bureau: admin.bureau,
        bio: admin.bio,
        photoPath: admin.photoPath  // ← AJOUTE CETTE LIGNE
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

// ========== 2. METTRE À JOUR PROFIL ADMIN ==========
const updateAdminProfile = async (req, res) => {
  try {
    const { fullName, titre, email, telephone, bureau, bio } = req.body;
    const admin = await Admin.findOne({ where: { userId: req.user.id } });  // ✅ req.user.id (u صغيرة)
    if (!admin) {
      return res.status(404).json({ message: 'Profil admin non trouvé' });
    }
    
    // Mettre à jour l'email dans User si changé
    if (email && email !== req.user.email) {  // ✅ && (pas &)
      await User.update({ email }, { where: { id: req.user.id } });
    }

    await admin.update({
      fullName: fullName || admin.fullName,
      titre: titre || admin.titre,
      telephone: telephone || admin.telephone,
      bureau: bureau || admin.bureau,
      bio: bio || admin.bio
    });

    const updatedUser = await User.findByPk(req.user.id);
    res.json({
      success: true,
      admin: {
        id: admin.id,
        fullName: admin.fullName,
        titre: admin.titre,
        department: admin.department,
        email: updatedUser.email,
        telephone: admin.telephone,
        bureau: admin.bureau,
        bio: admin.bio
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });  // ✅ error.message
  }
};


// ========== 3. UPLOAD PHOTO ADMIN ==========
const uploadAdminPhoto = async (req, res) => {
  try {
    console.log("📤 Upload photo admin - req.file:", req.file);
    
    if (!req.file) {
      return res.status(400).json({ message: 'Aucun fichier uploadé' });
    }
    
    const admin = await Admin.findOne({ where: { userId: req.user.id } });
    if (!admin) {
      return res.status(404).json({ message: 'Profil admin non trouvé' });
    }

    // Supprimer l'ancienne photo si elle existe
    if (admin.photoPath) {
      const fs = require('fs');
      const path = require('path');
      const oldPath = path.join(__dirname, '../uploads/admin-photos', admin.photoPath);
      if (fs.existsSync(oldPath)) {
        fs.unlinkSync(oldPath);
        console.log("🗑️ Ancienne photo supprimée:", admin.photoPath);
      }
    }
    
    // Sauvegarder le nouveau chemin
    const photoPath = req.file.filename;
    await admin.update({ photoPath: photoPath });
    
    console.log("✅ Photo admin sauvegardée:", photoPath);
    
    res.json({
      success: true,
      message: 'Photo mise à jour avec succès',
      photoUrl: `/uploads/admin-photos/${photoPath}`
    });
  } catch (error) {
    console.error("❌ Erreur uploadAdminPhoto:", error);
    res.status(500).json({ message: error.message });
  }
};

// ========== 4. CHANGER MOT DE PASSE ADMIN ==========
const changeAdminPassword = async (req, res) => {
  try {
    const { ancienMotDePasse, nouveauMotDePasse } = req.body;
    const user = await User.findByPk(req.user.id);
    const isPasswordValid = await user.comparePassword(ancienMotDePasse);

    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Ancien mot de passe incorrect' });
    }
    
    user.password = nouveauMotDePasse;
    await user.save();
    res.json({ success: true, message: 'Mot de passe changé avec succès' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

// ========== 5. STATISTIQUES GLOBALES ==========
const getStatistics = async (req, res) => {
  try {
    const totalStudents = await Student.count();
    const totalCompanies = await Company.count();
    const totalOffers = await Offer.count();
    const totalApplications = await Application.count();
    
    const placedStudents = await Student.count({ where: { estPlace: true } });
    const unplacedStudents = totalStudents - placedStudents;
    
    const pendingApplications = await Application.count({ where: { statut: 'en_attente' } });
    const acceptedApplications = await Application.count({ where: { statut: 'acceptee' } });
    const refusedApplications = await Application.count({ where: { statut: 'refusee' } });

    const activeOffers = await Offer.count({ where: { estActive: true } });  // ← Utilise estActive
    const inactiveOffers = totalOffers - activeOffers;
    
    res.json({
      success: true,
      stats: {
        students: { total: totalStudents, placed: placedStudents, unplaced: unplacedStudents },
        companies: totalCompanies,
        offers: { total: totalOffers, active: activeOffers, inactive: inactiveOffers },
        applications: { total: totalApplications, pending: pendingApplications, accepted: acceptedApplications, refused: refusedApplications }
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

// ========== 6. RÉCUPÉRER TOUS LES ÉTUDIANTS ==========
const getAllStudents = async (req, res) => {
  try {
    const students = await Student.findAll({
      include: [{ 
        model: User, 
        as: 'user',  // ← Utilise l'alias 'user' au lieu de 'User'
        attributes: ['id', 'email', 'role', 'isActive']
      }]
    });
    res.json({ success: true, count: students.length, students });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

const getAllCompanies = async (req, res) => {
  try {
    const companies = await Company.findAll({
      include: [{ 
        model: User, 
        as: 'user',  // ← Utilise l'alias 'user'
        attributes: ['id', 'email', 'role', 'isActive']
      }]
    });
    res.json({ success: true, count: companies.length, companies });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};
// ========== 9. SUPPRIMER UNE OFFRE ==========
const deleteOfferByAdmin = async (req, res) => {
  try {
    const offer = await Offer.findByPk(req.params.offerId);
    if (!offer) {
      return res.status(404).json({ message: 'Offre non trouvée' });
    }
    await offer.destroy();
    res.json({ success: true, message: 'Offre supprimée par l\'administration' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

// ========== 10. RÉCUPÉRER TOUTES LES CANDIDATURES ==========
// ========== 10. RÉCUPÉRER TOUTES LES CANDIDATURES ==========
const getAllApplications = async (req, res) => {
  try {
    const applications = await Application.findAll({
      include: [
        { 
          model: Student, 
          as: 'student',
          include: [{ 
            model: User, 
            as: 'user',
            attributes: ['id', 'email']
          }]
        },
        { 
          model: Offer, 
          as: 'offer',
          include: [{ 
            model: Company, 
            as: 'company',
            attributes: ['id', 'nom']
          }]
        }
      ],
      order: [['createdAt', 'DESC']]
    });
    
    // Transformer les données pour le frontend avec les bons noms de champs
    const formattedApplications = applications.map(app => ({
      id: app.id,
      studentId: app.studentId,
      offerId: app.offerId,
      // Nom de l'étudiant
      etudiantNom: app.student ? `${app.student.prenom || ''} ${app.student.nom || ''}`.trim() : 'Étudiant inconnu',
      // Email
      email: app.student?.user?.email || 'Email non renseigné',
      // Téléphone
      telephone: app.student?.telephone || 'Non renseigné',
      // Titre de l'offre
      offreTitre: app.offer?.titre || 'Offre inconnue',
      // Nom de l'entreprise
      entrepriseNom: app.offer?.company?.nom || 'Entreprise inconnue',
      // Statut
      statut: app.statut,
      // Date
      date: app.createdAt,
      // Message
      message: app.message || '',
      // CV
      cvPath: app.cvPath,
      // Convention
      conventionPath: app.conventionPath,
      conventionName: app.conventionName
    }));
    
    console.log(`📊 ${formattedApplications.length} candidatures formatées`);
    console.log("📋 Première candidature:", formattedApplications[0]);
    
    res.json({ 
      success: true, 
      count: formattedApplications.length, 
      applications: formattedApplications 
    });
  } catch (error) {
    console.error("❌ Erreur getAllApplications:", error);
    res.status(500).json({ message: error.message });
  }
};
// ========== 11. VALIDER UN STAGE ==========
const validateInternship = async (req, res) => {  // ✅ validateInternship (s dans internship)
  try {
    const application = await Application.findByPk(req.params.applicationId, {
      include: [
        { model: Student },
        { model: Offer, include: [{ model: Company }] }
      ]
    });
    if (!application) {
      return res.status(404).json({ message: 'Candidature non trouvée' });
    }
    if (application.statut !== 'acceptee') {  // ✅ statut (pas status) و acceptee
      return res.status(400).json({ message: 'La candidature doit être acceptée d\'abord par l\'entreprise' });
    }
    if (application.valideParAdmin) {
      return res.status(400).json({ message: 'Déjà validée par l\'administration' });
    }
    await application.update({ valideParAdmin: true });
    await application.Student.update({ estPlace: true });
    res.json({
      success: true,
      message: 'Stage validé par l\'administration',
      application
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};
// ========== 8. ACTIVER/DÉSACTIVER UN UTILISATEUR ==========
const toggleUserStatus = async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }
    const newStatus = !user.isActive;
    await user.update({ isActive: newStatus });
    res.json({
      success: true,
      message: `Utilisateur ${newStatus ? 'activé' : 'désactivé'} avec succès`,
      isActive: newStatus
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};
// ========== 12. UPLOAD CONVENTION ==========
const uploadConvention = async (req, res) => {
  try {
    console.log("📤 Upload convention - req.file:", req.file);
    console.log("📝 Application ID:", req.params.applicationId);
    
    if (!req.file) {
      return res.status(400).json({ message: 'Aucun fichier uploadé' });
    }
    
    const { applicationId } = req.params;
    
    // Vérifier que la candidature existe
    const application = await Application.findByPk(applicationId);
    if (!application) {
      return res.status(404).json({ message: 'Candidature non trouvée' });
    }
    
    // Vérifier que l'admin a le droit (déjà fait par le middleware isAdmin)
    
    // Sauvegarder le chemin de la convention
    const conventionPath = req.file.filename;
    const conventionName = req.file.originalname;
    
    await application.update({
      conventionPath: conventionPath,
      conventionName: conventionName,
      conventionUploadedAt: new Date()
    });
    
    console.log("✅ Convention sauvegardée:", conventionName);
    
    res.json({
      success: true,
      message: 'Convention uploadée avec succès',
      conventionUrl: `/uploads/cvs/${conventionPath}`,
      conventionName: conventionName
    });
  } catch (error) {
    console.error("❌ Erreur uploadConvention:", error);
    res.status(500).json({ message: error.message });
  }
};

// En haut du fichier, ajoute les imports nécessaires
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

// ========== 13. GÉNÉRER CONVENTION PDF ==========
const generateConvention = async (req, res) => {
  try {
    const { applicationId } = req.params;
    console.log("📝 Génération convention pour candidature:", applicationId);
    
    // Récupérer la candidature avec toutes les infos
    const application = await Application.findByPk(applicationId, {
      include: [
        { 
          model: Student, 
          as: 'student',
          include: [{ 
            model: User, 
            as: 'user',
            attributes: ['id', 'email']
          }]
        },
        { 
          model: Offer, 
          as: 'offer',
          include: [{ 
            model: Company, 
            as: 'company'
          }]
        }
      ]
    });
    
    if (!application) {
      return res.status(404).json({ message: 'Candidature non trouvée' });
    }
    
    const student = application.student;
    const offer = application.offer;
    const company = offer?.company;
    
    if (!student || !offer || !company) {
      return res.status(400).json({ message: 'Informations manquantes pour générer la convention' });
    }
    
    // Créer le dossier conventions s'il n'existe pas
    const conventionsDir = path.join(__dirname, '../uploads/conventions');
    if (!fs.existsSync(conventionsDir)) {
      fs.mkdirSync(conventionsDir, { recursive: true });
    }
    
    // Nom du fichier
    const fileName = `convention_${student.nom}_${student.prenom}_${company.nom}_${Date.now()}.pdf`;
    const filePath = path.join(conventionsDir, fileName);
    
    // Créer le PDF
    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    const writeStream = fs.createWriteStream(filePath);
    doc.pipe(writeStream);
    
    // En-tête
    doc.fontSize(20).font('Helvetica-Bold').fillColor('#1a5f7a')
      .text('CONVENTION DE STAGE', { align: 'center' });
    
    doc.moveDown();
    doc.fontSize(12).font('Helvetica')
      .text('Entre les soussignés :', { align: 'left' });
    
    doc.moveDown();
    
    // Partie Entreprise
    doc.fontSize(11).font('Helvetica-Bold').fillColor('#333')
      .text('L\'entreprise :', { underline: true });
    doc.fontSize(10).font('Helvetica')
      .text(`${company.nom || '_________________________'}`, { indent: 20 })
      .text(`Secteur d'activité : ${company.secteur || '_________________________'}`, { indent: 20 })
      .text(`Adresse : ${company.localisation || '_________________________'}`, { indent: 20 })
      .text(`Téléphone : ${company.telephone || '_________________________'}`, { indent: 20 })
      .text(`Email : ${company.user?.email || '_________________________'}`, { indent: 20 });
    
    doc.moveDown();
    
    // Partie Étudiant
    doc.fontSize(11).font('Helvetica-Bold')
      .text('L\'étudiant :', { underline: true });
    doc.fontSize(10).font('Helvetica')
      .text(`Nom et prénom : ${student.nom || ''} ${student.prenom || ''}`, { indent: 20 })
      .text(`Filière : ${student.filiere || '_________________________'}`, { indent: 20 })
      .text(`Niveau : ${student.niveau || '_________________________'}`, { indent: 20 })
      .text(`Université : ${student.universite || '_________________________'}`, { indent: 20 })
      .text(`Email : ${student.user?.email || '_________________________'}`, { indent: 20 })
      .text(`Téléphone : ${student.telephone || '_________________________'}`, { indent: 20 });
    
    doc.moveDown();
    
    // Détails du stage
    doc.fontSize(11).font('Helvetica-Bold')
      .text('Objet du stage :', { underline: true });
    doc.fontSize(10).font('Helvetica')
      .text(`Intitulé du poste : ${offer.titre || '_________________________'}`, { indent: 20 })
      .text(`Description : ${offer.description || '_________________________'}`, { indent: 20 })
      .text(`Durée : ${offer.duree || '_________________________'}`, { indent: 20 })
      .text(`Date de début : ${offer.dateDebut ? new Date(offer.dateDebut).toLocaleDateString('fr-FR') : '_________________________'}`, { indent: 20 })
      .text(`Date de fin : ${offer.dateFin ? new Date(offer.dateFin).toLocaleDateString('fr-FR') : '_________________________'}`, { indent: 20 })
      .text(`Salaire : ${offer.salaire || 'Non spécifié'}`, { indent: 20 });
    
    doc.moveDown();
    
    // Compétences
    if (offer.competences && offer.competences.length > 0) {
      doc.fontSize(11).font('Helvetica-Bold')
        .text('Compétences requises :', { underline: true });
      doc.fontSize(10).font('Helvetica');
      offer.competences.forEach(comp => {
        doc.text(`• ${comp}`, { indent: 20 });
      });
      doc.moveDown();
    }
    
    // Avantages
    if (offer.avantages && offer.avantages.length > 0) {
      doc.fontSize(11).font('Helvetica-Bold')
        .text('Avantages :', { underline: true });
      doc.fontSize(10).font('Helvetica');
      offer.avantages.forEach(avantage => {
        doc.text(`• ${avantage}`, { indent: 20 });
      });
      doc.moveDown();
    }
    
    // Signatures
    doc.moveDown(2);
    doc.fontSize(10).font('Helvetica');
    
    // Ligne de signature
    const pageWidth = doc.page.width - 100;
    const signatureY = doc.y;
    
    doc.text('Fait à _________________, le ' + new Date().toLocaleDateString('fr-FR'), { align: 'center' });
    doc.moveDown();
    
    doc.text('Signature de l\'entreprise', 50, signatureY + 40);
    doc.text('Signature de l\'étudiant', pageWidth - 150, signatureY + 40);
    
    doc.moveDown(5);
    doc.text('Cachet de l\'entreprise', 50, doc.y);
    doc.text('Signature de l\'administration', pageWidth - 150, doc.y);
    
    // Finaliser le PDF
    doc.end();
    
    // Attendre que le PDF soit écrit
    writeStream.on('finish', async () => {
      // Sauvegarder le chemin dans la base de données
      await application.update({
        conventionPath: fileName,
        conventionName: `Convention_${student.nom}_${student.prenom}.pdf`,
        conventionUploadedAt: new Date()
      });
      
      // Envoyer le PDF en réponse
      const pdfBuffer = fs.readFileSync(filePath);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
      res.send(pdfBuffer);
    });
    
    writeStream.on('error', (error) => {
      console.error("❌ Erreur écriture PDF:", error);
      res.status(500).json({ message: 'Erreur lors de la génération du PDF' });
    });
    
  } catch (error) {
    console.error("❌ Erreur generateConvention:", error);
    res.status(500).json({ message: error.message });
  }
};
// ========== EXPORT ==========
module.exports = {
  getAdminProfile,
  generateConvention,
  updateAdminProfile,
  uploadAdminPhoto,
  changeAdminPassword,
  getStatistics,
  getAllStudents,
  getAllCompanies,
toggleUserStatus,
  deleteOfferByAdmin,
  uploadConvention,
  getAllApplications,
  validateInternship  // ✅ validateInternship (pas validateIntership)
};