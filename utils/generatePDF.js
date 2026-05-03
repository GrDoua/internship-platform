const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

// ============================================
// 1. GÉNÉRER UN PDF DE CONVENTION DE STAGE
// ============================================

// @desc    Générer une convention de stage en PDF
// @param   {object} data - { student, company, offer, startDate, endDate }
// @param   {string} outputPath - Chemin où sauvegarder le PDF
// @returns {Promise<string>} - Chemin du fichier généré
const generateInternshipAgreement = (data, outputPath) => {
  return new Promise((resolve, reject) => {
    const { student, company, offer, startDate, endDate } = data;
    
    const doc = new PDFDocument({ margin: 50 });
    const writeStream = fs.createWriteStream(outputPath);
    doc.pipe(writeStream);

    try {
      // ========== HEADER ==========
      doc.fontSize(22)
         .font('Helvetica-Bold')
         .fillColor('#10b981')
         .text('CONVENTION DE STAGE', { align: 'center' });
      
      doc.moveDown();
      doc.fontSize(12)
         .fillColor('#374151')
         .text(`Fait à Alger, le ${new Date().toLocaleDateString('fr-FR')}`, { align: 'center' });
      
      doc.moveDown(2);

      // ========== PRÉAMBULE ==========
      doc.font('Helvetica-Bold')
         .text('Entre les soussignés :', { underline: true });
      doc.moveDown();
      
      doc.font('Helvetica')
         .text(`L'entreprise "${company.nom}", située à ${company.wilaya || 'Alger'}, représentée par son responsable légal,`, { indent: 20 });
      
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

      // ========== ARTICLE 1 ==========
      doc.font('Helvetica-Bold')
         .fillColor('#10b981')
         .text('Article 1 : Objet du stage', { underline: true });
      doc.moveDown();
      
      doc.font('Helvetica')
         .fillColor('#374151')
         .text(`Le stage intitulé "${offer.titre}" d'une durée de ${offer.duree || '6 mois'} sera effectué au sein de l'organisme d'accueil.`, { indent: 20 });
      
      doc.moveDown();

      // ========== ARTICLE 2 ==========
      doc.font('Helvetica-Bold')
         .fillColor('#10b981')
         .text('Article 2 : Compétences et missions', { underline: true });
      doc.moveDown();
      
      doc.font('Helvetica')
         .fillColor('#374151')
         .text(`Compétences requises : ${offer.competencesRequises?.join(', ') || 'Non spécifiées'}`, { indent: 20 });
      doc.moveDown();
      doc.text(`Description des missions : ${offer.description || 'Stage académique'}`, { indent: 20 });
      
      doc.moveDown();

      // ========== ARTICLE 3 ==========
      doc.font('Helvetica-Bold')
         .fillColor('#10b981')
         .text('Article 3 : Période du stage', { underline: true });
      doc.moveDown();
      
      doc.font('Helvetica')
         .fillColor('#374151')
         .text(`Le stage se déroulera du ${startDate || 'à déterminer'} au ${endDate || 'à déterminer'}.`, { indent: 20 });
      
      doc.moveDown();

      // ========== ARTICLE 4 ==========
      doc.font('Helvetica-Bold')
         .fillColor('#10b981')
         .text('Article 4 : Encadrement et suivi', { underline: true });
      doc.moveDown();
      
      doc.font('Helvetica')
         .fillColor('#374151')
         .text(`Un tuteur pédagogique sera désigné par l'établissement universitaire.`, { indent: 20 });
      doc.text(`Un maître de stage sera désigné par l'organisme d'accueil.`, { indent: 20 });
      
      doc.moveDown();

      // ========== ARTICLE 5 ==========
      doc.font('Helvetica-Bold')
         .fillColor('#10b981')
         .text('Article 5 : Engagement des parties', { underline: true });
      doc.moveDown();
      
      doc.font('Helvetica')
         .fillColor('#374151')
         .text(`Le stagiaire s'engage à respecter le règlement intérieur de l'entreprise.`, { indent: 20 });
      doc.text(`L'organisme d'accueil s'engage à fournir les moyens nécessaires à la réalisation du stage.`, { indent: 20 });
      
      doc.moveDown(2);

      // ========== SIGNATURES ==========
      doc.font('Helvetica-Bold')
         .text('Fait en trois exemplaires originaux, chacun des parties reconnaît en avoir reçu un exemplaire.');
      
      doc.moveDown(3);
      
      const pageWidth = doc.page.width;
      const signatureY = doc.y;
      
      doc.text('Pour l\'Université :', 50, signatureY);
      doc.text('Pour l\'Entreprise :', pageWidth - 180, signatureY);
      
      doc.moveDown(2);
      doc.text('Signature et cachet', 50);
      doc.text('Signature et cachet', pageWidth - 180);
      
      doc.moveDown(2);
      doc.font('Helvetica')
         .fillColor('#9ca3af')
         .fontSize(8)
         .text(
           `Document généré le ${new Date().toLocaleString('fr-FR')} via Stag.io`,
           pageWidth / 2,
           doc.page.height - 30,
           { align: 'center' }
         );

      doc.end();

      writeStream.on('finish', () => resolve(outputPath));
      writeStream.on('error', reject);
    } catch (error) {
      reject(error);
    }
  });
};

// ============================================
// 2. GÉNÉRER UN PDF DE CV
// ============================================

// @desc    Générer un CV en PDF à partir des données étudiant
// @param   {object} student - Données de l'étudiant
// @param   {string} outputPath - Chemin où sauvegarder le PDF
// @returns {Promise<string>} - Chemin du fichier généré
const generateCV = (student, outputPath) => {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50 });
    const writeStream = fs.createWriteStream(outputPath);
    doc.pipe(writeStream);

    try {
      let yPos = 25;
      const pageWidth = doc.page.width;
      const marginX = 20;

      // Titre
      doc.fontSize(22)
         .font('Helvetica-Bold')
         .fillColor('#10b981')
         .text('CURRICULUM VITAE', pageWidth / 2, yPos, { align: 'center' });
      
      yPos += 10;
      doc.fontSize(14)
         .font('Helvetica-normal')
         .fillColor('#1f2937')
         .text(`${student.nom} ${student.prenom || ''}`, pageWidth / 2, yPos, { align: 'center' });
      
      yPos += 8;
      doc.strokeColor('#10b981')
         .lineWidth(1)
         .moveTo(marginX, yPos)
         .lineTo(pageWidth - marginX, yPos)
         .stroke();
      
      // Contact
      yPos += 10;
      doc.fontSize(12)
         .font('Helvetica-Bold')
         .fillColor('#10b981')
         .text('CONTACT', marginX, yPos);
      
      yPos += 6;
      doc.fontSize(10)
         .font('Helvetica-normal')
         .fillColor('#4b5563');
      
      doc.text(`Email : ${student.email || 'Non renseigné'}`, marginX + 5, yPos);
      yPos += 5;
      doc.text(`Téléphone : ${student.telephone || 'Non renseigné'}`, marginX + 5, yPos);
      yPos += 5;
      doc.text(`Adresse : ${student.adresse || 'Non renseignée'}`, marginX + 5, yPos);
      
      // Formation
      yPos += 12;
      doc.fontSize(12)
         .font('Helvetica-Bold')
         .fillColor('#10b981')
         .text('FORMATION', marginX, yPos);
      
      yPos += 6;
      doc.fontSize(10)
         .font('Helvetica-normal')
         .fillColor('#4b5563');
      
      doc.text(`Université : ${student.universite || 'Non renseignée'}`, marginX + 5, yPos);
      yPos += 5;
      doc.text(`Filière : ${student.filiere || 'Non renseignée'}`, marginX + 5, yPos);
      yPos += 5;
      doc.text(`Niveau : ${student.niveau || 'Non renseigné'}`, marginX + 5, yPos);
      
      // Compétences
      yPos += 12;
      if (yPos > 250) { doc.addPage(); yPos = 25; }
      
      doc.fontSize(12)
         .font('Helvetica-Bold')
         .fillColor('#10b981')
         .text('COMPETENCES', marginX, yPos);
      
      yPos += 6;
      doc.fontSize(10)
         .font('Helvetica-normal')
         .fillColor('#4b5563');
      
      if (student.competences && student.competences.length > 0) {
        let ligneCompetence = "";
        student.competences.forEach((comp, index) => {
          ligneCompetence += comp;
          if (index < student.competences.length - 1) ligneCompetence += "  |  ";
        });
        const lignes = doc.splitTextToSize(ligneCompetence, pageWidth - marginX - 10);
        doc.text(lignes, marginX + 5, yPos);
        yPos += (lignes.length * 5) + 5;
      } else {
        doc.text("Aucune compétence renseignée", marginX + 5, yPos);
        yPos += 8;
      }
      
      // Bio
      if (student.bio) {
        yPos += 12;
        if (yPos > 250) { doc.addPage(); yPos = 25; }
        
        doc.fontSize(12)
           .font('Helvetica-Bold')
           .fillColor('#10b981')
           .text('À PROPOS', marginX, yPos);
        
        yPos += 6;
        doc.fontSize(10)
           .font('Helvetica-normal')
           .fillColor('#4b5563');
        
        const bioLines = doc.splitTextToSize(student.bio, pageWidth - marginX - 10);
        doc.text(bioLines, marginX + 5, yPos);
      }
      
      doc.end();

      writeStream.on('finish', () => resolve(outputPath));
      writeStream.on('error', reject);
    } catch (error) {
      reject(error);
    }
  });
};

// ============================================
// 3. FONCTION UTILITAIRE POUR CRÉER LE DOSSIER
// ============================================

// @desc    Créer un dossier s'il n'existe pas
// @param   {string} dirPath - Chemin du dossier
const ensureDirectoryExists = (dirPath) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
    console.log(`📁 Dossier créé: ${dirPath}`);
  }
};

module.exports = {
  generateInternshipAgreement,
  generateCV,
  ensureDirectoryExists
};