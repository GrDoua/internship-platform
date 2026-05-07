const { User, Admin, Student, Company, Offer, Application } = require('../models');  // ← أضفنا Student, Company, Offer, Application
const bcrypt = require('bcryptjs');
const { Op } = require('sequelize');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

// ========== 1. RÉCUPÉRER PROFIL ADMIN ==========
// adminController.js - getAdminProfile
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
        photoPath: admin.photoPath,
        universite: admin.universite  // ← AJOUTE CETTE LIGNE
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

// adminController.js - updateAdminProfile
const updateAdminProfile = async (req, res) => {
  try {
    const { fullName, titre, email, telephone, bureau, bio, universite } = req.body;  // ← ajout universite
    const admin = await Admin.findOne({ where: { userId: req.user.id } });
    if (!admin) {
      return res.status(404).json({ message: 'Profil admin non trouvé' });
    }
    
    // Mettre à jour l'email dans User si changé
    if (email && email !== req.user.email) {
      await User.update({ email }, { where: { id: req.user.id } });
    }

    await admin.update({
      fullName: fullName || admin.fullName,
      titre: titre || admin.titre,
      telephone: telephone || admin.telephone,
      bureau: bureau || admin.bureau,
      bio: bio || admin.bio,
      universite: universite || admin.universite  // ← AJOUTE CETTE LIGNE
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
        bio: admin.bio,
        universite: admin.universite  // ← AJOUTE CETTE LIGNE
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
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
    // Récupérer l'admin connecté pour connaître son université
    const admin = await Admin.findOne({ where: { userId: req.user.id } });
    const adminUniversite = admin?.universite;
    
    let totalStudents, totalCompanies, totalOffers, totalApplications;
    let placedStudents, unplacedStudents;
    let pendingApplications, acceptedApplications, refusedApplications;
    let activeOffers, inactiveOffers;
    
    if (adminUniversite) {
      // Admin d'université : comptage filtré
      console.log(`📚 Statistiques filtrées pour: ${adminUniversite}`);
      
      // Étudiants de l'université
      totalStudents = await Student.count({ where: { universite: adminUniversite } });
      placedStudents = await Student.count({ where: { universite: adminUniversite, estPlace: true } });
      unplacedStudents = totalStudents - placedStudents;
      
      // Récupérer les IDs des étudiants de l'université
      const students = await Student.findAll({ 
        where: { universite: adminUniversite },
        attributes: ['id'] 
      });
      const studentIds = students.map(s => s.id);
      
      // Candidatures des étudiants de l'université
      totalApplications = await Application.count({ where: { studentId: studentIds } });
      pendingApplications = await Application.count({ where: { studentId: studentIds, statut: 'en_attente' } });
      acceptedApplications = await Application.count({ where: { studentId: studentIds, statut: 'acceptee' } });
      refusedApplications = await Application.count({ where: { studentId: studentIds, statut: 'refusee' } });
      
      // Toutes les offres (pas de filtre université car les offres sont des entreprises)
      totalOffers = await Offer.count();
      activeOffers = await Offer.count({ where: { statut: 'active' } });
      inactiveOffers = totalOffers - activeOffers;
      
      // Toutes les entreprises
      totalCompanies = await Company.count();
      
    } else {
      // Admin super : statistiques globales
      console.log(`🌍 Statistiques globales pour super admin`);
      
      totalStudents = await Student.count();
      totalCompanies = await Company.count();
      totalOffers = await Offer.count();
      totalApplications = await Application.count();
      
      placedStudents = await Student.count({ where: { estPlace: true } });
      unplacedStudents = totalStudents - placedStudents;
      
      pendingApplications = await Application.count({ where: { statut: 'en_attente' } });
      acceptedApplications = await Application.count({ where: { statut: 'acceptee' } });
      refusedApplications = await Application.count({ where: { statut: 'refusee' } });
      
      activeOffers = await Offer.count({ where: { statut: 'active' } });
      inactiveOffers = totalOffers - activeOffers;
    }
    
    res.json({
      success: true,
      stats: {
        students: { total: totalStudents, placed: placedStudents, unplaced: unplacedStudents },
        companies: totalCompanies,
        offers: { total: totalOffers, active: activeOffers, inactive: inactiveOffers },
        applications: { total: totalApplications, pending: pendingApplications, accepted: acceptedApplications, refused: refusedApplications },
        adminUniversite: adminUniversite // Optionnel : pour info
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

// ========== 6. RÉCUPÉRER TOUS LES ÉTUDIANTS ==========
// adminController.js - getAllStudents (version filtrée)
const getAllStudents = async (req, res) => {
  try {
    // Récupérer l'admin connecté pour connaître son université
    const admin = await Admin.findOne({ where: { userId: req.user.id } });
    const adminUniversite = admin?.universite;
    
    let whereCondition = {};
    
    // Si l'admin a une université assignée, filtrer les étudiants
    if (adminUniversite) {
      whereCondition = { universite: adminUniversite };
      console.log(`📚 Admin de l'université: ${adminUniversite} - Filtrage des étudiants`);
    } else {
      console.log(`🌍 Admin super - Voit tous les étudiants`);
    }
    
    const students = await Student.findAll({
      where: whereCondition,
      include: [{ 
        model: User, 
        as: 'user',
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

// adminController.js - getAllApplications (version complète corrigée)
const getAllApplications = async (req, res) => {
  try {
    console.log("========== getAllApplications ==========");
    console.log("req.user.id:", req.user.id);
    
    // 1. Récupérer l'admin avec son université
    const admin = await Admin.findOne({ 
      where: { userId: req.user.id }
    });
    
    if (!admin) {
      console.error("❌ Admin non trouvé pour userId:", req.user.id);
      return res.status(404).json({ message: 'Admin non trouvé' });
    }
    
    const adminUniversite = admin.universite;
    console.log("🏫 Admin université:", adminUniversite);
    
    let applications;
    
    // 2. Si l'admin a une université, filtrer
    if (adminUniversite && adminUniversite.trim() !== '') {
      console.log(`📚 Filtrage pour: ${adminUniversite}`);
      
      // Récupérer les IDs des étudiants de cette université
      const students = await Student.findAll({ 
        where: { universite: adminUniversite },
        attributes: ['id']
      });
      
      const studentIds = students.map(s => s.id);
      console.log(`👨‍🎓 Étudiants trouvés (${studentIds.length}):`, studentIds);
      
      if (studentIds.length === 0) {
        console.log("⚠️ Aucun étudiant trouvé");
        return res.json({ success: true, count: 0, applications: [] });
      }
      
      // Récupérer les candidatures de ces étudiants
      applications = await Application.findAll({
        where: { studentId: studentIds },
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
      
    } else {
      // Admin super - voit tout
      console.log("🌍 Admin super - pas de filtre");
      applications = await Application.findAll({
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
    }
    
    console.log(`📊 Candidatures trouvées: ${applications.length}`);
    
    // 3. Formater les données
    const formattedApplications = applications.map(app => ({
      id: app.id,
      studentId: app.studentId,
      offerId: app.offerId,
      etudiantNom: app.student ? `${app.student.prenom || ''} ${app.student.nom || ''}`.trim() : 'Étudiant inconnu',
      universite: app.student?.universite || 'Non renseignée',
      email: app.student?.user?.email || 'Email non renseigné',
      telephone: app.student?.telephone || 'Non renseigné',
      offreTitre: app.offer?.titre || 'Offre inconnue',
      entrepriseNom: app.offer?.company?.nom || 'Entreprise inconnue',
      statut: app.statut,
      date: app.createdAt,
      message: app.message || '',
      cvPath: app.cvPath,
      conventionPath: app.conventionPath,
      conventionName: app.conventionName
    }));
    
    console.log(`✅ ${formattedApplications.length} candidatures formatées`);
    
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
// adminController.js - validateInternship (admin valide avec convention)
// adminController.js - validateInternship (admin valide avec convention)
const validateInternship = async (req, res) => {
  try {
    const { applicationId } = req.params;
    
    const application = await Application.findByPk(applicationId);
    if (!application) {
      return res.status(404).json({ message: 'Candidature non trouvée' });
    }
    
    // ✅ Vérifier que l'entreprise a déjà accepté
    if (application.statut !== 'accepte_entreprise') {
      return res.status(400).json({ 
        message: 'L\'entreprise doit d\'abord accepter la candidature' 
      });
    }
    
    // ✅ Ici, il faut soit uploader un fichier, soit générer automatiquement
    let conventionPath = null;
    
    // Option 1: S'il y a un fichier uploadé (via multer)
    if (req.file) {
      conventionPath = req.file.filename;
      console.log("📁 Convention uploadée:", conventionPath);
    }
    
    // Option 2: Générer un nom de convention automatiquement
    const student = await Student.findByPk(application.studentId);
    const offer = await Offer.findByPk(application.offerId);
    const company = await Company.findByPk(offer?.entrepriseId);
    
    if (!conventionPath && student && offer && company) {
      // Générer un nom de fichier par défaut
      const date = new Date();
      conventionPath = `convention_${student.nom}_${student.prenom}_${company.nom}_${date.getFullYear()}.pdf`;
      console.log("📁 Convention générée automatiquement:", conventionPath);
    }
    
    // ✅ Mettre à jour avec le chemin de la convention
    await application.update({ 
      statut: 'accepte_universite',
      conventionPath: conventionPath,  // ← AJOUTE CETTE LIGNE !
      conventionName: `Convention_${student?.prenom || ''}_${student?.nom || ''}.pdf`,
      valideParAdmin: true,
      examineLe: new Date(),
      conventionUploadedAt: conventionPath ? new Date() : null
    });
    
    // Mettre à jour l'étudiant comme placé
    await Student.update(
      { estPlace: true },
      { where: { id: application.studentId } }
    );
    
    res.json({
      success: true,
      message: 'Stage validé par l\'université, convention acceptée',
      conventionPath: conventionPath
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



// ========== 13. GÉNÉRER CONVENTION PDF ==========
// adminController.js - Version complète avec toutes les infos du candidat
const generateConvention = async (req, res) => {
  try {
    const { applicationId } = req.params;
    console.log("📝 Génération convention personnalisée pour candidature:", applicationId);
    
    // Récupérer TOUTES les infos
    const application = await Application.findByPk(applicationId, {
      include: [
        { 
          model: Student, 
          as: 'student',
          include: [{ model: User, as: 'user' }]
        },
        { 
          model: Offer, 
          as: 'offer',
          include: [{ model: Company, as: 'company' }]
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
      return res.status(400).json({ 
        message: 'Informations manquantes', 
        details: { student: !!student, offer: !!offer, company: !!company }
      });
    }
    
    console.log("✅ Génération pour:", student.prenom, student.nom);
    console.log("   Entreprise:", company.nom);
    console.log("   Offre:", offer.titre);
    
    // Créer le dossier
    const conventionsDir = path.join(__dirname, '../uploads/conventions');
    if (!fs.existsSync(conventionsDir)) {
      fs.mkdirSync(conventionsDir, { recursive: true });
    }
    
    // Nom du fichier avec le nom du candidat
    const fileName = `convention_${student.nom}_${student.prenom}_${company.nom}_${Date.now()}.pdf`;
    const filePath = path.join(conventionsDir, fileName);
    
    // Créer le PDF personnalisé
    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    const writeStream = fs.createWriteStream(filePath);
    doc.pipe(writeStream);
    
    // ========== CONTENU PERSONNALISÉ ==========
    // En-tête
    doc.fontSize(20)
       .font('Helvetica-Bold')
       .fillColor('#1a365d')
       .text('CONVENTION DE STAGE', { align: 'center' });
    
    doc.moveDown();
    doc.fontSize(10)
       .font('Helvetica')
       .fillColor('black')
       .text(`Fait à ${company.localisation || 'Alger'}, le ${new Date().toLocaleDateString('fr-FR')}`, { align: 'right' });
    
    doc.moveDown(2);
    
    // ========== PARTIES ==========
    doc.fontSize(14)
       .font('Helvetica-Bold')
       .text('ENTRE LES SOUSSIGNÉS :', { underline: true });
    
    doc.moveDown();
    doc.fontSize(11)
       .font('Helvetica');
    
    // Entreprise
    doc.text(`La société ${company.nom},`);
    doc.text(`Dont le siège social est situé à : ${company.localisation || offer.lieu || 'Non spécifié'}`);
    doc.text(`Représentée par son représentant légal,`);
    doc.text(`Ci-après dénommée "L'Entreprise d'accueil"`);
    
    doc.moveDown(1.5);
    
    // Étudiant
    doc.text(`L'étudiant(e) ${student.prenom || ''} ${student.nom},`);
    doc.text(`Né(e) le : ${student.dateNaissance || '___/___/____'}`);
    doc.text(`Étudiant(e) à : ${student.universite || 'Université'}`);
    doc.text(`Email : ${student.user?.email || 'Non renseigné'}`);
    doc.text(`Téléphone : ${student.telephone || 'Non renseigné'}`);
    doc.text(`Ci-après dénommé(e) "Le/La Stagiaire"`);
    
    doc.moveDown(1.5);
    
    // Université
    doc.text(`L'établissement ${student.universite || 'Université'},`);
    doc.text(`Représenté par son responsable de stage,`);
    doc.text(`Ci-après dénommé "L'Établissement"`);
    
    doc.moveDown(2);
    
    // ========== ARTICLE 1 : OBJET ==========
    doc.fontSize(11)
       .font('Helvetica-Bold')
       .text('Article 1 : Objet du stage', { underline: true });
    
    doc.moveDown(0.5);
    doc.font('Helvetica')
       .text(`La présente convention a pour objet de définir les conditions dans lesquelles ${student.prenom || ''} ${student.nom} effectuera son stage au sein de ${company.nom}.`);
    
    doc.moveDown();
    
    // ========== ARTICLE 2 : DURÉE ==========
    doc.font('Helvetica-Bold')
       .text('Article 2 : Durée du stage', { underline: true });
    
    doc.moveDown(0.5);
    doc.font('Helvetica')
       .text(`Le stage d'une durée de ${offer.duree || 'à déterminer'} débutera le ${offer.dateDebut ? new Date(offer.dateDebut).toLocaleDateString('fr-FR') : '___/___/____'} et se terminera le ${offer.dateFin ? new Date(offer.dateFin).toLocaleDateString('fr-FR') : '___/___/____'}.`);
    
    doc.moveDown();
    
    // ========== ARTICLE 3 : MISSIONS ==========
    doc.font('Helvetica-Bold')
       .text('Article 3 : Missions confiées', { underline: true });
    
    doc.moveDown(0.5);
    doc.font('Helvetica')
       .text(offer.description || 'Description des missions à préciser par l\'entreprise.');
    
    doc.moveDown();
    
    // ========== ARTICLE 4 : GRATIFICATION ==========
    doc.font('Helvetica-Bold')
       .text('Article 4 : Gratification', { underline: true });
    
    doc.moveDown(0.5);
    const gratification = (offer.salaire && offer.salaire !== 'Non spécifié') ? offer.salaire : 'Stage non rémunéré';
    doc.font('Helvetica')
       .text(gratification);
    
    doc.moveDown(2);
    
    // ========== SIGNATURES ==========
    doc.fontSize(11)
       .font('Helvetica-Bold')
       .text('SIGNATURES', { align: 'center', underline: true });
    
    doc.moveDown(2);
    
    const pageWidth = doc.page.width - 100;
    const signatureY = doc.y;
    
    doc.fontSize(10)
       .font('Helvetica')
       .text('Pour l\'Entreprise :', 50, signatureY);
    doc.text('Pour l\'Établissement :', 50 + (pageWidth / 2), signatureY);
    
    doc.moveDown(3);
    doc.text('(Signature précédée de la mention "Lu et approuvé")', 50, doc.y);
    doc.text('(Signature précédée de la mention "Lu et approuvé")', 50 + (pageWidth / 2), doc.y - 24);
    
    doc.moveDown(2);
    doc.font('Helvetica-Bold')
       .text(`Cachet de l'entreprise`, 50, doc.y);
    
    // Finaliser
    doc.end();
    
    writeStream.on('finish', async () => {
      const stats = fs.statSync(filePath);
      console.log(`✅ PDF généré: ${fileName} (${stats.size} bytes)`);
      
      // Sauvegarder dans la base
      await application.update({
        conventionPath: fileName,
        conventionName: `Convention_${student.nom}_${student.prenom}.pdf`,
        conventionUploadedAt: new Date(),
        statut: 'accepte_universite'
      });
      
      await Student.update({ estPlace: true }, { where: { id: student.id } });
      
      // Envoyer le PDF
      const pdfBuffer = fs.readFileSync(filePath);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
      res.send(pdfBuffer);
    });
    
    writeStream.on('error', (error) => {
      console.error("❌ Erreur:", error);
      res.status(500).json({ message: error.message });
    });
    
  } catch (error) {
    console.error("❌ Erreur generateConvention:", error);
    res.status(500).json({ message: error.message });
  }
};
// ========== TÉLÉCHARGER CONVENTION EXISTANTE ==========
const downloadAdminConvention = async (req, res) => {
  try {
    const { applicationId } = req.params;
    console.log("📥 Téléchargement convention pour candidature:", applicationId);
    
    // 1. Vérifier que l'admin est connecté
    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: 'Non authentifié' });
    }
    
    // 2. Récupérer la candidature
    const application = await Application.findByPk(applicationId, {
      include: [
        { model: Student, as: 'student' },
        { model: Offer, as: 'offer' }
      ]
    });
    
    if (!application) {
      return res.status(404).json({ message: 'Candidature non trouvée' });
    }
    
    // 3. Vérifier que la convention existe dans la base
    if (!application.conventionPath) {
      return res.status(404).json({ message: 'Aucune convention générée pour cette candidature' });
    }
    
    // 4. Construire le chemin du fichier
    const conventionsDir = path.join(__dirname, '../uploads/conventions');
    const filePath = path.join(conventionsDir, application.conventionPath);
    
    console.log("📁 Chemin du fichier:", filePath);
    
    // 5. Vérifier que le fichier existe physiquement
    if (!fs.existsSync(filePath)) {
      console.error("❌ Fichier introuvable:", filePath);
      return res.status(404).json({ 
        message: 'Fichier convention introuvable sur le serveur',
        path: application.conventionPath
      });
    }
    
    // 6. Récupérer les infos pour le nom du fichier
    const student = application.student;
    const fileName = application.conventionName || `Convention_${student?.nom || 'Stagiaire'}_${student?.prenom || ''}.pdf`;
    
    console.log("✅ Fichier trouvé, envoi en cours...");
    
    // 7. Envoyer le fichier pour téléchargement
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(fileName)}"`);
    
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);
    
    fileStream.on('error', (error) => {
      console.error("❌ Erreur stream:", error);
      if (!res.headersSent) {
        res.status(500).json({ message: 'Erreur lors de l\'envoi du fichier' });
      }
    });
    
  } catch (error) {
    console.error("❌ Erreur downloadConvention:", error);
    res.status(500).json({ message: error.message });
  }
};



// adminController.js
// adminController.js - updateApplicationStatus (amélioré)
const updateApplicationStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const { id } = req.params;
    
    console.log(`🔄 Mise à jour candidature ${id} vers ${status}`);
    
    // Vérifier que le statut est valide
    const validStatus = ['en_attente', 'accepte_entreprise', 'accepte_universite', 'refusee'];
    if (!validStatus.includes(status)) {
      return res.status(400).json({ message: 'Statut invalide' });
    }
    
    const application = await Application.findByPk(id);
    if (!application) {
      return res.status(404).json({ message: 'Candidature non trouvée' });
    }
    
    // ✅ Ajoute la date d'examen
    await application.update({ 
      statut: status,
      examineLe: new Date()
    });
    
    console.log(`✅ Candidature ${id} mise à jour: ${status}`);
    
    // ✅ Message personnalisé selon le statut
    let message = 'Statut mis à jour';
    if (status === 'refusee') message = 'Candidature refusée avec succès';
    if (status === 'accepte_universite') message = 'Stage validé par l\'université';
    if (status === 'accepte_entreprise') message = 'Candidature acceptée par l\'entreprise';
    
    res.json({ success: true, message, application });
  } catch (error) {
    console.error('Erreur updateApplicationStatus:', error);
    res.status(500).json({ message: error.message });
  }
};
// adminController.js - Ajoute cette fonction
const refuseApplication = async (req, res) => {
  try {
    console.log("🚀 Refus de candidature par admin...");
    console.log("Application ID:", req.params.id);
    
    const applicationId = req.params.id;
    
    // Récupérer la candidature
    const application = await Application.findByPk(applicationId);
    if (!application) {
      return res.status(404).json({ message: 'Candidature non trouvée' });
    }
    
    // Mettre à jour le statut à 'refusee'
    await application.update({ 
      statut: 'refusee',
      examineLe: new Date()
    });
    
    console.log(`✅ Candidature ${applicationId} refusée par l'admin`);
    
    res.json({
      success: true,
      message: 'Candidature refusée avec succès',
      application
    });
  } catch (error) {
    console.error("❌ Erreur refuseApplication:", error);
    res.status(500).json({ message: error.message });
  }
};
// ========== EXPORT ==========
module.exports = {
  getAdminProfile,
  generateConvention,
  updateAdminProfile,
  uploadAdminPhoto,
  refuseApplication,
  changeAdminPassword,
  getStatistics,
  getAllStudents,
  getAllCompanies,
toggleUserStatus,
  deleteOfferByAdmin,
  uploadConvention,
  getAllApplications,
  validateInternship,
  updateApplicationStatus,
  downloadAdminConvention  // ✅ validateInternship (pas validateIntership)
};