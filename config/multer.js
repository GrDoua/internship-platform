const multer = require('multer');
const path = require('path');
const fs = require('fs');

// ========== 1. CRÉER DOSSIERS SI MAWJOUDCH ==========
const ensureDirectoryExists = (dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`📁 Created directory: ${dir}`);
  }
};

// Créer les dossiers d'upload
const uploadsDir = path.join(__dirname, '../uploads');
const cvsDir = path.join(__dirname, '../uploads/cvs');
const logosDir = path.join(__dirname, '../uploads/companyLogos');
const studentPhotosDir = path.join(__dirname, '../uploads/student-photos');
const adminPhotosDir = path.join(__dirname, '../uploads/admin-photos');

ensureDirectoryExists(uploadsDir);
ensureDirectoryExists(cvsDir);
ensureDirectoryExists(logosDir);
ensureDirectoryExists(studentPhotosDir);
ensureDirectoryExists(adminPhotosDir);

// ========== 2. CONFIGURATION STOCKAGE ==========
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (file.fieldname === 'photo') {
      if (req.user && req.user.role === 'admin') {
        cb(null, adminPhotosDir);
      } else {
        cb(null, studentPhotosDir);
      }
    } else if (file.fieldname === 'cv' || file.fieldname === 'cVFile') {
      cb(null, cvsDir);
    } else if (file.fieldname === 'logo' || file.fieldname === 'companyLogo') {
      cb(null, logosDir);
    } else {
      cb(null, uploadsDir);
    }
  },
  
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    const baseName = path.basename(file.originalname, ext);
    const cleanName = baseName.replace(/\s+/g, '_');
    const finalName = `${uniqueSuffix}-${cleanName}${ext}`;
    cb(null, finalName);
  }
});

// ========== 3. FILTRES POUR VALIDER LES FICHIERS ==========
const fileFilter = (req, file, cb) => {
  const allowedTypes = {
    cv: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
    photo: ['image/jpeg', 'image/png', 'image/jpg', 'image/gif', 'image/webp'],
    logo: ['image/jpeg', 'image/png', 'image/jpg', 'image/gif', 'image/webp'],
    default: ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg']
  };
  
  let allowedMimeTypes = allowedTypes.default;
  if (file.fieldname === 'cv') {
    allowedMimeTypes = allowedTypes.cv;
  } else if (file.fieldname === 'photo') {
    allowedMimeTypes = allowedTypes.photo;
  } else if (file.fieldname === 'logo') {
    allowedMimeTypes = allowedTypes.logo;
  }
  
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Type de fichier non supporté pour ${file.fieldname}. Types acceptés: ${allowedMimeTypes.join(', ')}`), false);
  }
};

// ========== 4. CONFIGURATION MULTER ==========
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024,
    files: 5
  }
});

// ========== 5. MIDDLEWARES ==========
const uploadPhoto = upload.single('photo');
const uploadCV = upload.single('cv');
const uploadLogo = upload.single('logo');
const uploadMultiple = upload.array('files', 5);
const uploadCVAndLogo = upload.fields([
  { name: 'cv', maxCount: 1 },
  { name: 'logo', maxCount: 1 }
]);
const uploadConventionPDF = upload.single('convention');

// ========== 6. GESTION DES ERREURS ==========
const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    switch (err.code) {
      case 'LIMIT_FILE_SIZE':
        return res.status(400).json({ message: 'Fichier trop grand. Maximum 5MB.' });
      case 'LIMIT_FILE_COUNT':
        return res.status(400).json({ message: 'Trop de fichiers. Maximum 5.' });
      case 'LIMIT_UNEXPECTED_FILE':
        return res.status(400).json({ message: `Champ '${err.field}' non attendu.` });
      default:
        return res.status(400).json({ message: err.message });
    }
  }
  if (err) {
    return res.status(400).json({ message: err.message });
  }
  next();
};

// ========== 7. FONCTIONS UTILITAIRES ==========
const deleteFile = (filePath) => {
  if (filePath && fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
    console.log(`🗑️ Deleted file: ${filePath}`);
    return true;
  }
  return false;
};

const getFileUrl = (req, filename, subfolder = '') => {
  const baseUrl = `${req.protocol}://${req.get('host')}`;
  const folder = subfolder ? `${subfolder}/` : '';
  return `${baseUrl}/uploads/${folder}${filename}`;
};

// ========== 8. EXPORTATION ==========
module.exports = {
  upload,
  uploadCV,
  uploadConventionPDF,
  uploadPhoto,
  uploadLogo,
  uploadMultiple,
  uploadCVAndLogo,
  deleteFile,
  getFileUrl,
  handleMulterError  // ← UNE SEULE FOIS !!
};