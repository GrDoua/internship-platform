const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const { InternshipAgreement, Application, Student, Company, Offer, User } = require('../models');

// ========== 1. GÉNÉRER CONVENTION AUTO ==========
const generateAgreement = async (req, res) => {
  try {
    const application = await Application.findByPk(req.params.applicationId, {
      include: [
        { model: Student, include: [{ model: User, attributes: ['email'] }] },
        { model: Offer, include: [{ model: Company }] }
      ]
    });

    if (!application) {
      return res.status(404).json({ message: 'Candidature non trouvée' });
    }

    if (application.statut !== 'acceptee') {  // ✅ corrigé: statut (pas statu)
      return res.status(400).json({ message: 'La candidature doit être acceptée par l\'entreprise' });
    }

    if (!application.valideParAdmin) {
      return res.status(400).json({ message: 'Le stage doit être validé par l\'administration' });
    }

    const offer = application.Offer;  // ✅ corrigé: Offer (O grande)
    const student = application.Student;  // ✅ corrigé: Student (S grande)
    const company = offer.Company;

    const agreementsDir = './uploads/agreements';
    if (!fs.existsSync(agreementsDir)) {
      fs.mkdirSync(agreementsDir, { recursive: true });
    }

    const doc = new PDFDocument({ margin: 50 });
    const filename = `convention_${student.id}_${company.id}_${Date.now()}.pdf`;
    const filePath = path.join(agreementsDir, filename);

    const writeStream = fs.createWriteStream(filePath);
    doc.pipe(writeStream);

    // HEADER
    doc.fontSize(22).font('Helvetica-Bold').fillColor('#10b981').text('CONVENTION DE STAGE', { align: 'center' });
    doc.moveDown();
    doc.fontSize(12).fillColor('#374151').text(`Fait à Alger, le ${new Date().toLocaleDateString('fr-FR')}`, { align: 'center' });
    doc.moveDown(2);

    // PRÉAMBULE
    doc.font('Helvetica-Bold').text('Entre les soussignés :', { underline: true });
    doc.moveDown();
    doc.font('Helvetica').text(`L'entreprise "${company.nom}", située à ${company.wilaya || 'Alger'}, représentée par son responsable légal,`, { indent: 20 });
    doc.moveDown();
    doc.text(`Ci-après dénommée "L'Organisme d'Accueil",`, { indent: 20 });
    doc.moveDown();
    doc.text(`Et l'étudiant ${student.nom} ${student.prenom || ''}, inscrit(e) à l'université ${student.universite},`, { indent: 20 });
    doc.text(`département ${student.filiere}, niveau ${student.niveau || 'M1'}.`, { indent: 20 });
    doc.moveDown();
    doc.text(`Ci-après dénommé(e) "Le(La) Stagiaire",`, { indent: 20 });
    doc.moveDown(2);
    doc.text(`Il a été convenu ce qui suit :`, { align: 'center' });
    doc.moveDown(2);

    // ARTICLE 1
    doc.font('Helvetica-Bold').fillColor('#10b981').text('Article 1 : Objet du stage', { underline: true });
    doc.moveDown();
    doc.font('Helvetica').fillColor('#374151').text(`Le stage intitulé "${offer.titre}" d'une durée de ${offer.duree || '6 mois'} sera effectué au sein de l'organisme d'accueil.`, { indent: 20 });
    doc.moveDown();

    // ARTICLE 2
    doc.font('Helvetica-Bold').fillColor('#10b981').text('Article 2 : Compétences et missions', { underline: true });
    doc.moveDown();
    doc.font('Helvetica').fillColor('#374151').text(`Compétences requises : ${offer.competencesRequises?.join(', ') || 'Non spécifiées'}`, { indent: 20 });
    doc.moveDown();
    doc.text(`Description des missions : ${offer.description || 'Stage académique'}`, { indent: 20 });
    doc.moveDown();

    // ARTICLE 3
    doc.font('Helvetica-Bold').fillColor('#10b981').text('Article 3 : Encadrement et suivi', { underline: true });
    doc.moveDown();
    doc.font('Helvetica').fillColor('#374151').text(`Un tuteur pédagogique sera désigné par l'établissement universitaire.`, { indent: 20 });
    doc.text(`Un maître de stage sera désigné par l'organisme d'accueil.`, { indent: 20 });
    doc.moveDown();

    // ARTICLE 4
    doc.font('Helvetica-Bold').fillColor('#10b981').text('Article 4 : Engagement des parties', { underline: true });
    doc.moveDown();
    doc.font('Helvetica').fillColor('#374151').text(`Le stagiaire s'engage à respecter le règlement intérieur de l'entreprise.`, { indent: 20 });
    doc.text(`L'organisme d'accueil s'engage à fournir les moyens nécessaires à la réalisation du stage.`, { indent: 20 });
    doc.moveDown(2);

    // SIGNATURES
    doc.font('Helvetica-Bold').text('Fait en trois exemplaires originaux, chacun des parties reconnaît en avoir reçu un exemplaire.');
    doc.moveDown(3);

    const pageWidth = doc.page.width;
    const signatureY = doc.y;
    doc.text('Pour l\'Université :', 50, signatureY);
    doc.text('Pour l\'Entreprise :', pageWidth - 200, signatureY);
    doc.moveDown(2);
    doc.text('Signature et cachet', 50);
    doc.text('Signature et cachet', pageWidth - 200);
    doc.moveDown(2);
    doc.font('Helvetica').fillColor('#9ca3af').fontSize(8).text(
      `Document généré le ${new Date().toLocaleString('fr-FR')} via Stag.io`,
      pageWidth / 2,
      doc.page.height - 30,
      { align: 'center' }
    );

    doc.end();

    writeStream.on('finish', async () => {
      let agreement = await InternshipAgreement.findOne({
        where: { applicationId: application.id }
      });

      if (agreement) {
        await agreement.update({ pdfPath: filename, status: 'generated' });
      } else {
        agreement = await InternshipAgreement.create({
          applicationId: application.id,
          studentId: student.id,
          companyId: company.id,
          pdfPath: filename,
          status: 'generated'
        });
      }

      res.json({
        success: true,
        message: 'PDF généré avec succès',
        pdfUrl: `/uploads/agreements/${filename}`,
        agreement
      });
    });

    writeStream.on('error', (error) => {
      console.error(error);
      res.status(500).json({ message: error.message });
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

// ========== 2. TÉLÉCHARGER PDF ==========
const downloadPDF = async (req, res) => {  // ✅ corrigé: downloadPDF (P majuscule)
  try {
    const agreement = await InternshipAgreement.findByPk(req.params.id);
    if (!agreement) {
      return res.status(404).json({ message: 'Convention non trouvée' });
    }
    const filePath = path.join('./uploads/agreements', agreement.pdfPath);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: 'Fichier PDF non trouvé' });
    }
    res.download(filePath, `convention_stage_${agreement.id}.pdf`);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

// ========== 3. UPLOAD CONVENTION PAR ADMIN ==========
const uploadConvention = async (req, res) => {
  try {
    const { applicationId } = req.params;
    if (!req.file) {
      return res.status(400).json({ message: '❌ Veuillez télécharger un fichier PDF' });
    }
    if (req.file.mimetype !== 'application/pdf') {
      return res.status(400).json({ message: '❌ Format PDF uniquement' });
    }
    if (req.file.size > 5 * 1024 * 1024) {
      return res.status(400).json({ message: '❌ Fichier trop volumineux (max 5MB)' });
    }

    const application = await Application.findByPk(applicationId, {
      include: [
        { model: Student },
        { model: Offer, include: [{ model: Company }] }
      ]
    });

    if (!application) {
      return res.status(404).json({ message: 'Candidature non trouvée' });
    }

    if (application.statut !== 'en_attente') {
      return res.status(400).json({
        message: `❌ Impossible: la candidature est déjà ${application.statut === 'acceptee' ? 'acceptée' : 'refusée'}`
      });
    }

    await application.update({
      statut: 'acceptee',
      examineLe: new Date()
    });
    await application.Student.update({ estPlace: true });

    const agreementsDir = './uploads/agreements';
    if (!fs.existsSync(agreementsDir)) {
      fs.mkdirSync(agreementsDir, { recursive: true });
    }

    const finalFileName = `convention_${applicationId}_${Date.now()}.pdf`;
    const finalPath = path.join(agreementsDir, finalFileName);
    fs.copyFileSync(req.file.path, finalPath);
    fs.unlinkSync(req.file.path);

    let agreement = await InternshipAgreement.findOne({
      where: { applicationId: application.id }  // ✅ corrigé: applicationId: application.id
    });

    if (agreement) {
      await agreement.update({
        pdfPath: finalFileName,
        status: 'generated',
        generatedAt: new Date()
      });
    } else {
      agreement = await InternshipAgreement.create({
        applicationId: application.id,  // ✅ corrigé: applicationId: application.id
        studentId: application.studentId,
        companyId: application.Offer?.companyId,
        pdfPath: finalFileName,
        status: 'generated',
        generatedAt: new Date()
      });
    }

    res.json({
      success: true,
      message: '✅ Candidature acceptée et convention enregistrée',
      convention: {
        id: agreement.id,
        pdfUrl: `/uploads/agreements/${finalFileName}`,
        fileName: finalFileName
      }
    });
  } catch (error) {
    console.error(error);
    if (req.file && req.file.path && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ message: error.message });
  }
};

// ========== 4. ENVOYER CONVENTION PAR EMAIL ==========
const sendConventionToStudent = async (req, res) => {
  try {
    const { applicationId } = req.params;
    const agreement = await InternshipAgreement.findOne({
      where: { applicationId },
      include: [
        {
          model: Application,
          include: [
            { model: Student, include: [{ model: User, attributes: ['email'] }] },
            { model: Offer }
          ]
        }
      ]
    });

    if (!agreement) {
      return res.status(404).json({ message: '❌ Convention non trouvée' });
    }

    const student = agreement.Application.Student;
    const offer = agreement.Application.Offer;  // ✅ corrigé: Offer (O grande)
    const studentEmail = student.User?.email;

    const filePath = path.join('./uploads/agreements', agreement.pdfPath);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: '❌ Fichier PDF non trouvé' });
    }

    let emailSent = false;
    if (studentEmail) {
      try {
        const { sendEmailWithAttachment } = require('../utils/emailService');
        await sendEmailWithAttachment(
          studentEmail,
          '📄 Votre convention de stage',
          `
          <div style="font-family: Arial, sans-serif; max-width: 600px;">
            <h2 style="color: #10b981;">Félicitations ${student.nom} ${student.prenom || ''} !</h2>
            <p>Votre candidature pour le stage <strong>"${offer?.titre || 'Stage'}"</strong> a été acceptée.</p>
            <p>Vous trouverez ci-joint votre <strong>convention de stage</strong>.</p>
            <br/>
            <p>Cordialement,<br/>L'équipe Stag.io</p>
          </div>
          `,
          filePath,
          `Convention_Stage_${student.nom}.pdf`
        );
        emailSent = true;
      } catch (emailError) {
        console.error('Erreur envoi email:', emailError);
      }
    }

    await agreement.update({ status: 'signed' });
    res.json({
      success: true,
      message: emailSent
        ? '✅ Convention envoyée par email et disponible en téléchargement'
        : '⚠️ Convention disponible en téléchargement (email non envoyé)',
      convention: {
        id: agreement.id,
        pdfUrl: `/uploads/agreements/${agreement.pdfPath}`,
        fileName: agreement.pdfPath
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

// ========== 5. TÉLÉCHARGER CONVENTION PAR AGREEMENT ID ==========
const downloadConvention = async (req, res) => {
  try {
    const agreement = await InternshipAgreement.findByPk(req.params.agreementId);
    if (!agreement) {
      return res.status(404).json({ message: '❌ Convention non trouvée' });
    }
    const filePath = path.join('./uploads/agreements', agreement.pdfPath);  // ✅ corrigé: uploads (avec s)
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: '❌ Fichier PDF non trouvé' });
    }
    res.download(filePath, `convention_stage_${agreement.id}.pdf`);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

// ========== 6. VÉRIFIER SI CONVENTION EXISTE ==========
const checkAgreement = async (req, res) => {
  try {
    const agreement = await InternshipAgreement.findOne({
      where: { applicationId: req.params.applicationId }
    });
    res.json({
      success: true,
      exists: !!agreement,  // ✅ corrigé: exists (pas exits)
      agreement
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  generateAgreement,
  downloadPDF,           // ✅ corrigé: downloadPDF
  uploadConvention,
  sendConventionToStudent,
  downloadConvention,
  checkAgreement
};