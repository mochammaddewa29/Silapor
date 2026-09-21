const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');
const uploadModule = require('../middleware/upload');
const upload = (uploadModule && uploadModule.default) ? uploadModule.default : uploadModule;

router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/google', authController.googleLogin);
router.get('/me', authenticate, authController.getMe);
router.put('/profile', authenticate, authController.updateProfile);
router.post('/upload-avatar', authenticate, upload.single('avatar'), authController.uploadAvatar);

module.exports = router;
