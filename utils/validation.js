
// @desc    Valider un email
// @param   {string} email
// @returns {boolean}
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// @desc    Valider un mot de passe (min 6 caractères)
// @param   {string} password
// @returns {boolean}
const isValidPassword = (password) => {
  return password && password.length >= 6;
};

// @desc    Valider un numéro de téléphone algérien
// @param   {string} phone
// @returns {boolean}
const isValidPhoneNumber = (phone) => {
  const phoneRegex = /^(0|00213|\+213)[5-7][0-9]{8}$/;
  return phoneRegex.test(phone);
};

// @desc    Valider une URL
// @param   {string} url
// @returns {boolean}
const isValidUrl = (url) => {
  if (!url) return true; // Optionnel
  const urlRegex = /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/;
  return urlRegex.test(url);
};

// @desc    Valider le rôle utilisateur
// @param   {string} role
// @returns {boolean}
const isValidRole = (role) => {
  const roles = ['etudiant', 'entreprise', 'admin'];
  return roles.includes(role);
};

// @desc    Valider le niveau d'étude
// @param   {string} niveau
// @returns {boolean}
const isValidNiveau = (niveau) => {
  const niveaux = ['L1', 'L2', 'L3', 'M1', 'M2'];
  return niveaux.includes(niveau);
};

// @desc    Valider le type de stage
// @param   {string} type
// @returns {boolean}
const isValidStageType = (type) => {
  const types = ['PFE', 'Summer', 'Part-time', 'Full-time', 'Stage', 'Alternance'];
  return types.includes(type);
};

// @desc    Valider une wilaya algérienne
// @param   {string} wilaya
// @returns {boolean}
const isValidWilaya = (wilaya) => {
  const wilayas = [
    'Adrar', 'Chlef', 'Laghouat', 'Oum El Bouaghi', 'Batna', 'Béjaïa', 'Biskra', 'Béchar',
    'Blida', 'Bouira', 'Tamanrasset', 'Tébessa', 'Tlemcen', 'Tiaret', 'Tizi Ouzou', 'Alger',
    'Djelfa', 'Jijel', 'Sétif', 'Saïda', 'Skikda', 'Sidi Bel Abbès', 'Annaba', 'Guelma',
    'Constantine', 'Médéa', 'Mostaganem', 'M\'Sila', 'Mascara', 'Ouargla', 'Oran', 'El Bayadh',
    'Illizi', 'Bordj Bou Arréridj', 'Boumerdès', 'El Tarf', 'Tindouf', 'Tissemsilt', 'El Oued',
    'Khenchela', 'Souk Ahras', 'Tipaza', 'Mila', 'Aïn Defla', 'Naâma', 'Aïn Témouchent',
    'Ghardaïa', 'Relizane', 'Timimoun', 'Bordj Badji Mokhtar', 'Ouled Djellal', 'Béni Abbès',
    'In Salah', 'In Guezzam', 'Touggourt', 'Djanet', 'El M\'Ghair', 'El Meniaa'
  ];
  return wilayas.includes(wilaya);
};

// ============================================
// VALIDATION DES OBJETS COMPLETS
// ============================================

// @desc    Valider les données d'inscription étudiant
// @param   {object} data
// @returns {object} { isValid, errors }
const validateStudentRegister = (data) => {
  const errors = {};
  
  if (!data.nom || data.nom.trim() === '') {
    errors.nom = 'Le nom est requis';
  }
  
  if (!data.email || !isValidEmail(data.email)) {
    errors.email = 'Email invalide';
  }
  
  if (!data.password || !isValidPassword(data.password)) {
    errors.password = 'Le mot de passe doit contenir au moins 6 caractères';
  }
  
  if (!data.filiere || data.filiere.trim() === '') {
    errors.filiere = 'La filière est requise';
  }
  
  if (!data.universite || data.universite.trim() === '') {
    errors.universite = 'L\'université est requise';
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

// @desc    Valider les données d'inscription entreprise
// @param   {object} data
// @returns {object} { isValid, errors }
const validateCompanyRegister = (data) => {
  const errors = {};
  
  if (!data.nom || data.nom.trim() === '') {
    errors.nom = 'Le nom de l\'entreprise est requis';
  }
  
  if (!data.email || !isValidEmail(data.email)) {
    errors.email = 'Email invalide';
  }
  
  if (!data.password || !isValidPassword(data.password)) {
    errors.password = 'Le mot de passe doit contenir au moins 6 caractères';
  }
  
  if (!data.secteur || data.secteur.trim() === '') {
    errors.secteur = 'Le secteur d\'activité est requis';
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

// @desc    Valider les données d'une offre
// @param   {object} data
// @returns {object} { isValid, errors }
const validateOffer = (data) => {
  const errors = {};
  
  if (!data.titre || data.titre.trim() === '') {
    errors.titre = 'Le titre est requis';
  }
  
  if (!data.description || data.description.trim() === '') {
    errors.description = 'La description est requise';
  }
  
  if (!data.typeStage || !isValidStageType(data.typeStage)) {
    errors.typeStage = 'Type de stage invalide';
  }
  
  if (!data.duree || data.duree.trim() === '') {
    errors.duree = 'La durée est requise';
  }
  
  if (!data.wilaya || !isValidWilaya(data.wilaya)) {
    errors.wilaya = 'Wilaya invalide';
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

// @desc    Valider le changement de mot de passe
// @param   {object} data
// @returns {object} { isValid, errors }
const validatePasswordChange = (data) => {
  const errors = {};
  
  if (!data.ancienMotDePasse || data.ancienMotDePasse.trim() === '') {
    errors.ancienMotDePasse = 'L\'ancien mot de passe est requis';
  }
  
  if (!data.nouveauMotDePasse || !isValidPassword(data.nouveauMotDePasse)) {
    errors.nouveauMotDePasse = 'Le nouveau mot de passe doit contenir au moins 6 caractères';
  }
  
  if (data.nouveauMotDePasse !== data.confirmerMotDePasse) {
    errors.confirmerMotDePasse = 'Les mots de passe ne correspondent pas';
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

module.exports = {
  // Fonctions simples
  isValidEmail,
  isValidPassword,
  isValidPhoneNumber,
  isValidUrl,
  isValidRole,
  isValidNiveau,
  isValidStageType,
  isValidWilaya,
  // Validations complètes
  validateStudentRegister,
  validateCompanyRegister,
  validateOffer,
  validatePasswordChange
};