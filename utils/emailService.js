 const nodemailer = require('nodemailer'); 
 //configuration
 const transporter = nodemailer.createTransport({
    service:'gmail',
    auth:{
        user: process.env.EMAIL_USER,
        pass:process.env.EMAIL_PASS
    }
});
//vérifier la connection au départ
const verifyConnection = async()=>{
    try{
     await transporter.verify();
    console.log('✅ Email service ready');
    }catch(error){
        console.error('❌ Email service error:', error.message);
    }
};

//envoyer email simple
const sendEmail = async(to,subject,html)=>{
    try{
        const mailOptions = {
        from :`"Stag.io" <${process.env.EMAIL_USER}>`,
        to,     //(ex:sarah@univ.dz)
        subject,   //(ex:bonjour)
        html  //(ex:<h1> bonjour sarah !!</h1>)
    };
     const info = await transporter.sendMail(mailOptions);
    console.log(`✅ Email envoyé à ${to}: ${info.messageId}`);
    return { success: true, messageId: info.messageId };

    }catch(error){
        console.error(`❌ Erreur envoi email à ${to}:`, error.message);
    throw error;
    }  
};

//envoyer un email avec un pdf
const sendEmailWithAttachment = async(to,subject,html,attachmentName,attachmentPath)=>{
    try{
       const mailOptions={
        from:`"Stag.io" <${process.env.EMAIL_USER}>`,
        to ,
        subject,
        html,
        attachments:[{
            filename: attachmentName,
            path:attachmentPath,
            contentType: 'application/pdf'   //type de fichier
        }]
    };
    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ Email avec pièce jointe envoyé à ${to}: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
    }catch(error){
        console.error(`❌ Erreur envoi email avec piece jointe  à ${to}:`, error.message);
    throw error;
    }
};

//envoyer un eamil de bienvenue aprés inscription selon le role
const sendWelcomeEmail = async(to, nom,role)=>{
    const roleText = {
    'etudiant': 'étudiant',
    'entreprise': 'entreprise partenaire',
    'admin': 'administrateur'
  }[role] || 'utilisateur';

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 16px;">
      <div style="text-align: center; margin-bottom: 20px;">
        <div style="display: inline-block; background: linear-gradient(135deg, #10b981, #059669); padding: 12px 24px; border-radius: 12px;">
          <span style="color: white; font-size: 24px; font-weight: bold;">Stag.io</span>
        </div>
      </div>
      
      <h2 style="color: #1f2937; text-align: center;">Bienvenue ${nom} ! 👋</h2>
      
      <p style="color: #4b5563; line-height: 1.6;">
        Nous sommes ravis de vous accueillir sur <strong>Stag.io</strong>, la plateforme de mise en relation entre étudiants et entreprises.
      </p>
      
      <p style="color: #4b5563; line-height: 1.6;">
        En tant que <strong>${roleText}</strong>, vous pouvez dès maintenant :
      </p>
      
      <ul style="color: #4b5563; line-height: 1.6;">
        ${role === 'etudiant' ? `
          <li>🔍 Parcourir les offres de stage disponibles</li>
          <li>📄 Créer et télécharger votre CV</li>
          <li>💼 Postuler aux offres qui vous intéressent</li>
          <li>❤️ Sauvegarder vos offres favorites</li>
        ` : role === 'entreprise' ? `
          <li>📢 Publier des offres de stage</li>
          <li>👥 Gérer les candidatures reçues</li>
          <li>⭐ Évaluer vos stagiaires</li>
          <li>📊 Suivre vos statistiques</li>
        ` : `
          <li>📋 Gérer toutes les candidatures</li>
          <li>✅ Valider les conventions de stage</li>
          <li>📊 Superviser les statistiques globales</li>
          <li>🏢 Gérer les étudiants et entreprises</li>
        `}
      </ul>
      
      <div style="background-color: #f3f4f6; padding: 16px; border-radius: 12px; margin: 20px 0;">
        <p style="color: #4b5563; margin: 0;">
          📧 <strong>Besoin d'aide ?</strong><br/>
          Contactez-nous à : <a href="mailto:support@stag.io" style="color: #10b981;">support@stag.io</a>
        </p>
      </div>
      
      <hr style="border-color: #e5e7eb; margin: 20px 0;" />
      
      <p style="color: #9ca3af; font-size: 12px; text-align: center;">
        © ${new Date().getFullYear()} Stag.io - Tous droits réservés
      </p>
    </div>
  `;

  return sendEmail(to, 'Bienvenue sur Stag.io ! 🎉',html);
};

//envoyer un email d'accetation de condidature
const sendCandidatureNotification = async (to, entrepriseNom, etudiantNom, offreTitre) => {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 16px;">
      <div style="text-align: center; margin-bottom: 20px;">
        <div style="display: inline-block; background: linear-gradient(135deg, #10b981, #059669); padding: 8px 16px; border-radius: 8px;">
          <span style="color: white; font-size: 20px; font-weight: bold;">Stag.io</span>
        </div>
      </div>
      
      <h2 style="color: #1f2937;">Nouvelle candidature ! 📝</h2>
      
      <p style="color: #4b5563; line-height: 1.6;">
        Bonjour <strong>${entrepriseNom}</strong>,
      </p>
      
      <p style="color: #4b5563; line-height: 1.6;">
        Vous avez reçu une nouvelle candidature de la part de :
      </p>
      
      <div style="background-color: #f3f4f6; padding: 16px; border-radius: 12px; margin: 16px 0;">
        <p style="margin: 4px 0;"><strong>👤 Étudiant :</strong> ${etudiantNom}</p>
        <p style="margin: 4px 0;"><strong>💼 Offre :</strong> ${offreTitre}</p>
      </div>
      
      <p style="color: #4b5563; line-height: 1.6;">
        Connectez-vous à votre espace entreprise pour consulter le CV du candidat et gérer sa candidature.
      </p>
      
      <div style="text-align: center; margin: 24px 0;">
        <a href="${process.env.FRONTEND_URL}/entreprise/candidatures" 
           style="background-color: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block;">
          Voir les candidatures
        </a>
      </div>
      
      <hr style="border-color: #e5e7eb; margin: 20px 0;" />
      
      <p style="color: #9ca3af; font-size: 12px; text-align: center;">
        © ${new Date().getFullYear()} Stag.io - Tous droits réservés
      </p>
    </div>
  `;

  return sendEmail(to, `📝 Nouvelle candidature pour ${offreTitre}`, html);
};

//envoyer une notification de convention
const sendConventionReadyNotification = async (to, etudiantNom, offreTitre, entrepriseNom) => {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 16px;">
      <div style="text-align: center; margin-bottom: 20px;">
        <div style="display: inline-block; background: linear-gradient(135deg, #10b981, #059669); padding: 8px 16px; border-radius: 8px;">
          <span style="color: white; font-size: 20px; font-weight: bold;">Stag.io</span>
        </div>
      </div>
      
      <h2 style="color: #1f2937;">Votre convention de stage est prête ! 📄</h2>
      
      <p style="color: #4b5563; line-height: 1.6;">
        Bonjour <strong>${etudiantNom}</strong>,
      </p>
      
      <p style="color: #4b5563; line-height: 1.6;">
        Félicitations ! Votre candidature pour le stage <strong>"${offreTitre}"</strong> chez <strong>${entrepriseNom}</strong> a été acceptée.
      </p>
      
      <p style="color: #4b5563; line-height: 1.6;">
        Votre convention de stage est maintenant disponible. Vous pouvez la télécharger depuis votre espace étudiant.
      </p>
      
      <div style="text-align: center; margin: 24px 0;">
        <a href="${process.env.FRONTEND_URL}/etudiant/mes-stages" 
           style="background-color: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block;">
          Télécharger ma convention
        </a>
      </div>
      
      <hr style="border-color: #e5e7eb; margin: 20px 0;" />
      
      <p style="color: #9ca3af; font-size: 12px; text-align: center;">
        © ${new Date().getFullYear()} Stag.io - Tous droits réservés
      </p>
    </div>
  `;

  return sendEmail(to, '📄 Votre convention de stage est disponible', html);
};

module.exports = {
  verifyConnection,
  sendEmail,
  sendEmailWithAttachment,
  sendWelcomeEmail,
  sendCandidatureNotification,
  sendConventionReadyNotification
};