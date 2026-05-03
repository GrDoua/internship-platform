const { User, Student, Company, Admin } = require('../models');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// 🔐 Generate Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d'
  });
};

// ================= REGISTER =================
const register = async (req, res) => {
  try {
    const { email, password, role, nom, prenom, filiere, universite, matricule, secteur } = req.body;

    const userExists = await User.findOne({
      where: { email: email.toLowerCase() }
    });

    if (userExists) {
      return res.status(400).json({ message: 'Utilisateur déjà existant' });
    }

    // 🔥 HASH PASSWORD
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      email: email.toLowerCase(),
      password: hashedPassword,
      role: role || 'etudiant'
    });

    let profile;

    if (role === 'etudiant') {
      profile = await Student.create({
        userId: user.id,
        nom: nom || '',
        prenom: prenom || '',
        filiere: filiere || '',
        universite: universite || '',
        matricule: matricule || ''
      });
    } 
    else if (role === 'entreprise') {
      profile = await Company.create({
        userId: user.id,
        nom: nom || '',
        secteur: secteur || ''
      });
    }

    // ❌ ما كاش inscription admin هنا

    const token = generateToken(user.id);

    res.status(201).json({
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        profile
      }
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

// ================= LOGIN =================
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // 🔍 نبحث بالإيميل lowercase
    const user = await User.findOne({
      where: { email: email.toLowerCase() }
    });

    if (!user) {
      return res.status(401).json({ message: "Email ou mot de passe incorrect" });
    }

    // 🔐 Compare password
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({ message: "Email ou mot de passe incorrect" });
    }

    const token = generateToken(user.id);

    res.json({
      success: true,
      token,
      user
    });

  } catch (error) {
    console.error("❌ Erreur:", error);
    res.status(500).json({ message: error.message });
  }
};

// ================= CHANGE PASSWORD =================
const changePassword = async (req, res) => {
  try {
    const { ancienMotDePasse, nouveauMotDePasse } = req.body;

    const user = await User.findByPk(req.user.id);

    const isPasswordValid = await bcrypt.compare(ancienMotDePasse, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Ancien mot de passe incorrect' });
    }

    // 🔥 hash new password
    user.password = await bcrypt.hash(nouveauMotDePasse, 10);
    await user.save();

    res.json({
      success: true,
      message: 'Mot de passe changé avec succès'
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

// ================= GET ME =================
const getMe = async (req, res) => {
  try {
    const user = req.user;

    let profile;

    if (user.role === 'etudiant') {
      profile = await Student.findOne({ where: { userId: user.id } });
    } 
    else if (user.role === 'entreprise') {
      profile = await Company.findOne({ where: { userId: user.id } });
    } 
    else if (user.role === 'admin') {
      profile = await Admin.findOne({ where: { userId: user.id } });
    }

    res.json({
      id: user.id,
      email: user.email,
      role: user.role,
      profile
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { register, login, changePassword, getMe };