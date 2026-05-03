const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

// Load env
dotenv.config();

// DB
const { sequelize, testConnection } = require('./config/db');

// Routes
const authRoutes = require('./routes/authRoutes');
const studentRoutes = require('./routes/studentRoutes');
const companyRoutes = require('./routes/companyRoutes');
const adminRoutes = require('./routes/adminRoutes');
const offerRoutes = require('./routes/offerRoutes');
const applicationRoutes = require('./routes/applicationRoutes');
const pdfRoutes = require('./routes/pdfRoutes');

const app = express();

// ========== IMPORTANT: PATHS ==========
const uploadsPath = path.join(__dirname, 'uploads');

// create uploads folder if not exist
if (!fs.existsSync(uploadsPath)) {
  fs.mkdirSync(uploadsPath, { recursive: true });
}

// ========== MIDDLEWARE ==========

// ✅ Helmet FIX (مهم باش الصور و CV يخدمو)
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" }
  })
);

// ✅ CORS
app.use(cors({
  origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
  credentials: true
}));

// ✅ Rate limit
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100
});
app.use('/api', limiter);

// ✅ Body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ✅ STATIC FILES (IMPORTANT)
app.use('/uploads', express.static(uploadsPath));

// ========== ROUTES ==========

app.get('/api/health', (req, res) => {
  res.json({ status: 'OK' });
});

app.use('/api/auth', authRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/companies', companyRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/offers', offerRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/pdf', pdfRoutes);

// ========== 404 ==========
app.use('*', (req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// ========== ERROR HANDLER ==========
app.use((err, req, res, next) => {
  console.error("❌ ERROR:", err);
  res.status(500).json({
    message: err.message || "Internal Server Error"
  });
});

// ========== START ==========
const PORT = process.env.PORT || 5004;

const startServer = async () => {
  try {
    await testConnection();
    await sequelize.sync({ alter: true });

    app.listen(PORT, () => {
      console.log(`🚀 Server running: http://localhost:${PORT}`);
      console.log(`📂 Uploads: http://localhost:${PORT}/uploads`);
    });

  } catch (error) {
    console.error("❌ Failed:", error);
  }
};

startServer();