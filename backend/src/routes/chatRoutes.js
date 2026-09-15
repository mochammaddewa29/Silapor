const express = require('express');
const router = express.Router();

const chatCtrlModule = require('../controllers/chatController');
const chatController = (chatCtrlModule && chatCtrlModule.default) ? chatCtrlModule.default : chatCtrlModule;

const authModule = require('../middleware/auth');
const auth = (authModule && authModule.default) ? authModule.default : authModule;
const { authenticate, requireAdmin } = auth;

// Get all chat users (admin only)
router.get('/users', authenticate, requireAdmin, chatController.getChatUsers);

// Send message to a specific user's room
router.post('/:userId', authenticate, chatController.sendDirectMessage);

module.exports = router;
