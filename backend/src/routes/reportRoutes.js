const express = require('express');
const router = express.Router();

const reportCtrlModule = require('../controllers/reportController');
const reportController = (reportCtrlModule && reportCtrlModule.default) ? reportCtrlModule.default : reportCtrlModule;

const authModule = require('../middleware/auth');
const auth = (authModule && authModule.default) ? authModule.default : authModule;
const { authenticate, requireAdmin } = auth;

const uploadModule = require('../middleware/upload');
const upload = (uploadModule && uploadModule.default) ? uploadModule.default : uploadModule;

// Dashboard stats (admin)
router.get('/stats/dashboard', authenticate, reportController.getDashboardStats);

// Export CSV & Excel (admin)
router.get('/export/csv', authenticate, requireAdmin, reportController.exportCSV);
router.get('/export/excel', authenticate, requireAdmin, reportController.exportExcel);
router.get('/export/xlsx', authenticate, requireAdmin, reportController.exportExcel);

// Direct Report (Instant account + report creation without prior login)
router.post('/direct', upload.single('photo'), reportController.directReport);

// Public Ticket Tracker (No auth required)
router.get('/track/:ticketId', reportController.trackReport);

// CRUD
router.post('/', authenticate, upload.single('photo'), reportController.createReport);
router.get('/', authenticate, reportController.getReports);
router.get('/:id', authenticate, reportController.getReport);

// Comments (Live Chat)
router.post('/:id/comments', authenticate, reportController.addComment);
router.get('/:id/comments', authenticate, reportController.getComments);

// Admin actions
router.put('/:id/status', authenticate, requireAdmin, reportController.updateStatus);
router.put('/:id/assign', authenticate, requireAdmin, reportController.assignTechnician);
router.put('/:id/notes', authenticate, requireAdmin, reportController.addRepairNotes);
router.delete('/:id', authenticate, requireAdmin, reportController.deleteReport);

module.exports = router;
