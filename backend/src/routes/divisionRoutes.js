const express = require('express');
const router = express.Router();
const divisionController = require('../controllers/divisionController');
const { authenticate, requireAdmin } = require('../middleware/auth');

// Public or user can view divisions
router.get('/', divisionController.getAll);

// Only admin can manage divisions
router.post('/', authenticate, requireAdmin, divisionController.create);
router.put('/:id', authenticate, requireAdmin, divisionController.update);
router.delete('/:id', authenticate, requireAdmin, divisionController.delete);

module.exports = router;
