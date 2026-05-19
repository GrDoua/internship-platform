const { Student } = require('../models');
const fs = require('fs');
const path = require('path');
// ⚠️ Corrige le chemin du dossier uploads
const UPLOADS_DIR = path.join(__dirname, '../uploads/cvs');

// @desc    Générer CV à partir des données du profil
// @route   POST /api/students/generate-cv
const generateStudentCV = async (req, res) => {
  try {
    const student = await Student.findOne({ where: { userId: req.user.id } });
    if (!student) {
      return res.status(404).json({ message: 'Profil étudiant non trouvé' });
    }
    
    const {
      nom,
      prenom,
      email,
      telephone,
      adresse,
      universite,
      filiere,
      niveau,
      competences,
      experiences,
      formations,
      langues,
      centresInteret,
      photoUrl
    } = req.body;
    
    // Utiliser les données du profil ou celles envoyées
    const finalData = {
      nom: nom || student.nom,
      prenom: prenom || student.prenom,
      email: email || student.email,
      telephone: telephone || student.telephone,
      adresse: adresse || student.adresse,
      universite: universite || student.universite,
      filiere: filiere || student.filiere,
      niveau: niveau || student.niveau,
      competences: competences || (student.competences ? (typeof student.competences === 'string' ? JSON.parse(student.competences) : student.competences) : []),
      experiences: experiences || [],
      formations: formations || [],
      langues: langues || [],
      centresInteret: centresInteret || [],
      photoUrl: photoUrl || (student.photoPath ? `/uploads/student-photos/${student.photoPath}` : null)
    };
    
    // Générer le PDF
    const PDFDocument = require('pdfkit');
    const { Buffer } = require('buffer');
    
    const doc = new PDFDocument({ margin: 50 });
    const buffers = [];
    
    doc.on('data', buffers.push.bind(buffers));
    doc.on('end', () => {
      const pdfData = Buffer.concat(buffers);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=CV_${finalData.nom}_${finalData.prenom}.pdf`);
      res.send(pdfData);
    });
    
    // === DÉBUT DE LA CONSTRUCTION DU PDF ===
    
    // 🔵 TITRE
    doc.fontSize(22).font('Helvetica-Bold').fillColor('#10b981')
      .text('CURRICULUM VITAE', { align: 'center' });
    
    doc.moveDown();
    
    // 🟢 SECTION PHOTO + NOM (côte à côte)
    let startY = doc.y;
    
    // Si une photo existe
    let photoBuffer = null;
    if (finalData.photoUrl && finalData.photoUrl.startsWith('http')) {
      // Si c'est une URL, il faudrait la télécharger... (optionnel)
      console.log("Photo URL:", finalData.photoUrl);
    } else if (photoUrl && photoUrl.startsWith('data:image')) {
      // Convertir base64 en buffer pour l'image
      const base64Data = photoUrl.split(',')[1];
      photoBuffer = Buffer.from(base64Data, 'base64');
    } else if (finalData.photoUrl && finalData.photoUrl.startsWith('/uploads/')) {
      // Lire le fichier depuis le serveur
      const photoPath = path.join(__dirname, '..', finalData.photoUrl);
      if (fs.existsSync(photoPath)) {
        photoBuffer = fs.readFileSync(photoPath);
      }
    }
    
    if (photoBuffer) {
      try {
        doc.image(photoBuffer, 50, startY, { width: 80, height: 80, fit: [80, 80] });
        // Ajuster la position du nom pour être à côté de la photo
        doc.fontSize(14).font('Helvetica').fillColor('#333')
          .text(`${finalData.nom} ${finalData.prenom}`, 150, startY + 25, { width: 400 });
      } catch (err) {
        console.log("Impossible d'ajouter la photo au PDF:", err);
        doc.fontSize(14).font('Helvetica').fillColor('#333')
          .text(`${finalData.nom} ${finalData.prenom}`, { align: 'center' });
      }
    } else {
      doc.fontSize(14).font('Helvetica').fillColor('#333')
        .text(`${finalData.nom} ${finalData.prenom}`, { align: 'center' });
    }
    
    doc.moveDown(0.5);
    doc.strokeColor('#10b981').lineWidth(1).moveTo(50, doc.y).lineTo(550, doc.y).stroke();
    
    // 📞 CONTACT
    doc.moveDown();
    doc.fontSize(12).font('Helvetica-Bold').fillColor('#10b981').text('CONTACT');
    doc.fontSize(10).font('Helvetica').fillColor('#666');
    doc.text(`Email : ${finalData.email}`, { indent: 10 });
    doc.text(`Téléphone : ${finalData.telephone || 'Non renseigné'}`, { indent: 10 });
    doc.text(`Adresse : ${finalData.adresse || 'Non renseignée'}`, { indent: 10 });
    
    // 🎓 FORMATION
    doc.moveDown();
    doc.fontSize(12).font('Helvetica-Bold').fillColor('#10b981').text('FORMATION');
    doc.fontSize(10).font('Helvetica').fillColor('#666');
    doc.text(`Université : ${finalData.universite || 'Non renseignée'}`, { indent: 10 });
    doc.text(`Filière : ${finalData.filiere || 'Non renseignée'}`, { indent: 10 });
    doc.text(`Niveau : ${finalData.niveau || 'Non renseigné'}`, { indent: 10 });
    
    // 💻 COMPÉTENCES
    doc.moveDown();
    doc.fontSize(12).font('Helvetica-Bold').fillColor('#10b981').text('COMPETENCES');
    doc.fontSize(10).font('Helvetica').fillColor('#666');
    if (finalData.competences && finalData.competences.length > 0) {
      const competencesText = Array.isArray(finalData.competences) 
        ? finalData.competences.join('  |  ') 
        : finalData.competences;
      doc.text(competencesText, { indent: 10 });
    } else {
      doc.text('Aucune compétence renseignée', { indent: 10 });
    }
    
    // 💼 EXPÉRIENCES
    if (finalData.experiences && finalData.experiences.length > 0) {
      doc.addPage();
      doc.moveDown();
      doc.fontSize(12).font('Helvetica-Bold').fillColor('#10b981').text('EXPERIENCES PROFESSIONNELLES');
      doc.fontSize(10).font('Helvetica').fillColor('#666');
      finalData.experiences.forEach(exp => {
        doc.text(`• ${exp}`, { indent: 10 });
        doc.moveDown(0.3);
      });
    }
    
    // 📚 FORMATIONS COMPLÉMENTAIRES
    if (finalData.formations && finalData.formations.length > 0) {
      doc.moveDown();
      doc.fontSize(12).font('Helvetica-Bold').fillColor('#10b981').text('FORMATIONS COMPLEMENTAIRES');
      doc.fontSize(10).font('Helvetica').fillColor('#666');
      finalData.formations.forEach(formation => {
        doc.text(`• ${formation}`, { indent: 10 });
        doc.moveDown(0.3);
      });
    }
    
    // 🗣️ LANGUES
    if (finalData.langues && finalData.langues.length > 0) {
      doc.moveDown();
      doc.fontSize(12).font('Helvetica-Bold').fillColor('#10b981').text('LANGUES');
      doc.fontSize(10).font('Helvetica').fillColor('#666');
      const languesText = Array.isArray(finalData.langues) 
        ? finalData.langues.join('  |  ') 
        : finalData.langues;
      doc.text(languesText, { indent: 10 });
    }
    
    // 🎯 CENTRES D'INTÉRÊT
    if (finalData.centresInteret && finalData.centresInteret.length > 0) {
      doc.moveDown();
      doc.fontSize(12).font('Helvetica-Bold').fillColor('#10b981').text('CENTRES D\'INTERET');
      doc.fontSize(10).font('Helvetica').fillColor('#666');
      const interetsText = Array.isArray(finalData.centresInteret) 
        ? finalData.centresInteret.join('  |  ') 
        : finalData.centresInteret;
      doc.text(interetsText, { indent: 10 });
    }
    
    // Terminer le PDF
    doc.end();
    
  } catch (error) {
    console.error('❌ Erreur generateStudentCV:', error);
    res.status(500).json({ message: error.message });
  }
};

// ============================================
// UPLOAD CV
// ============================================
const uploadStudentCV = async (req, res) => {
  try {
    console.log("📤 Upload CV - req.file:", req.file);
    
    if (!req.file) {
      return res.status(400).json({ message: 'Aucun fichier uploadé' });
    }
    
    const student = await Student.findOne({ where: { userId: req.user.id } });
    if (!student) {
      return res.status(404).json({ message: 'Profil étudiant non trouvé' });
    }
    
    // Supprimer l'ancien CV s'il existe
    if (student.cvPath) {
      const oldPath = path.join(__dirname, '../uploads/cvs', student.cvPath);
      if (fs.existsSync(oldPath)) {
        fs.unlinkSync(oldPath);
        console.log("🗑️ Ancien CV supprimé:", student.cvPath);
      }
    }
    
    // Sauvegarde dans la base de données
    await student.update({
      cvPath: req.file.filename,
      cvName: req.file.originalname
    });
    
    // Vérifier que la mise à jour a fonctionné
    const updatedStudent = await Student.findByPk(student.id);
    console.log("✅ CV sauvegardé dans DB - cvPath:", updatedStudent.cvPath);
    console.log("✅ CV sauvegardé dans DB - cvName:", updatedStudent.cvName);
    
    res.json({
      success: true,
      message: 'CV uploadé avec succès',
      cvPath: req.file.filename,
      cvName: req.file.originalname,
      cvUrl: `/uploads/cvs/${req.file.filename}`
    });
  } catch (error) {
    console.error("❌ Erreur uploadStudentCV:", error);
    res.status(500).json({ message: error.message });
  }
};

// ============================================
// TÉLÉCHARGER CV
// ============================================
const downloadStudentCV = async (req, res) => {
  try {
    const student = await Student.findOne({ where: { userId: req.user.id } });
    if (!student || !student.cvPath) {
      return res.status(404).json({ message: 'Aucun CV trouvé' });
    }
    
    const filePath = path.join(UPLOADS_DIR, student.cvPath);
    
    console.log("📄 Chemin du CV:", filePath);
    console.log("📄 Fichier existe?", fs.existsSync(filePath));
    
    if (!fs.existsSync(filePath)) {
      // Le fichier n'existe pas, nettoyer la base de données
      await student.update({ cvPath: null, cvName: null });
      return res.status(404).json({ 
        message: 'Fichier CV introuvable sur le serveur. Veuillez le réuploader.'
      });
    }
    
    res.download(filePath, student.cvName || 'cv.pdf');
  } catch (error) {
    console.error('❌ Erreur téléchargement CV:', error);
    res.status(500).json({ message: error.message });
  }
};

// ============================================
// SUPPRIMER CV
// ============================================
const deleteStudentCV = async (req, res) => {
  try {
    const student = await Student.findOne({ where: { userId: req.user.id } });
    if (!student) {
      return res.status(404).json({ message: 'Profil étudiant non trouvé' });
    }
    
    if (student.cvPath) {
      const filePath = path.join(UPLOADS_DIR, student.cvPath);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        console.log("🗑️ CV supprimé:", filePath);
      } else {
        console.log(`⚠️ Fichier non trouvé: ${filePath}`);
      }
      await student.update({ cvPath: null, cvName: null });
    }
    
    res.json({ success: true, message: 'CV supprimé avec succès' });
  } catch (error) {
    console.error('❌ Erreur suppression CV:', error);
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  generateStudentCV,
  uploadStudentCV,
  deleteStudentCV,
  downloadStudentCV
};