// @desc    Vérifier si l'utilisateur est ADMIN
const isAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ message: 'Accès refusé. Réservé aux administrateurs.' });
  }
};

// @desc    Vérifier si l'utilisateur est ENTREPRISE
const isCompany = (req, res, next) => {
  if (req.user && req.user.role === 'entreprise') {
    next();
  } else {
    res.status(403).json({ message: 'Accès refusé. Réservé aux entreprises.' });
  }
};

// @desc    Vérifier si l'utilisateur est ÉTUDIANT
const isStudent = (req, res, next) => {
  if (req.user && req.user.role === 'etudiant') {
    next();
  } else {
    res.status(403).json({ message: 'Accès refusé. Réservé aux étudiants.' });
  }
};

// @desc    Vérifier si l'utilisateur est ADMIN ou ENTREPRISE
const isAdminOrCompany = (req, res, next) => {
  if (req.user && (req.user.role === 'admin' || req.user.role === 'entreprise')) {
    next();
  } else {
    res.status(403).json({ message: 'Accès refusé.' });
  }
};

module.exports = { isAdmin, isCompany, isStudent, isAdminOrCompany };