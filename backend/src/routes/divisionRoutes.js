const express = require('express');
const router = express.Router();
const divisionController = require('../controllers/divisionController');
const { authenticate, authorizeAdmin } = require('../middleware/auth');

// Public or user can view divisions
router.get('/', divisionController.getAll);

// Only admin can manage divisions
router.post('/', authenticate, authorizeAdmin, divisionController.create);
router.put('/:id', authenticate, authorizeAdmin, divisionController.update);
router.delete('/:id', authenticate, authorizeAdmin, divisionController.delete);

module.exports = router;
