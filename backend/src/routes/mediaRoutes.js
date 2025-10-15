const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const mediaController = require('../controllers/mediaController');
const authMiddleware = require('../middlewares/authMiddleware');

const router = express.Router();

const uploadsDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const timestamp = Date.now();
    const ext = path.extname(file.originalname || '').toLowerCase() || '.mp4';
    cb(null, `tv-idle-${timestamp}${ext}`);
  },
});

const fileFilter = (req, file, cb) => {
  if (!file.mimetype.startsWith('video/')) {
    return cb(new Error('Arquivo enviado não é um vídeo válido'));
  }

  cb(null, true);
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 200 * 1024 * 1024 }, // 200MB
});

router.get('/tv-idle-video', mediaController.getIdleVideo);
router.post(
  '/tv-idle-video',
  authMiddleware,
  upload.single('video'),
  mediaController.uploadIdleVideo,
);
router.delete('/tv-idle-video', authMiddleware, mediaController.removerIdleVideo);

module.exports = router;
