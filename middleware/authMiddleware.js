// middleware/auth.js
const jwt = require('jsonwebtoken');
const { User } = require('../models');

const protect = async (req, res, next) => {
  let token;
  
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Get user (without password)
      req.user = await User.findByPk(decoded.id, {
        attributes: { exclude: ['password'] }
      });
      
      if (!req.user) {
        return res.status(401).json({ message: 'Utilisateur non trouvé' });
      }
      
      // Make sure user.id is available
      console.log('✅ Auth success - User ID:', req.user.id);
      next();
    } catch (error) {
      console.error('Auth error:', error);
      return res.status(401).json({ message: 'Token invalide ou expiré' });
    }
  }
  
  if (!token) {
    return res.status(401).json({ message: 'Accès non autorisé - Token manquant' });
  }
};

module.exports = { protect };