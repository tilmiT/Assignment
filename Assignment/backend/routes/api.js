const express = require('express');
const router = express.Router();
const {
  searchDocuments,
  getDocument,
  uploadDocument,
  uploadMultipleDocuments,
  loadSampleDocuments,
  getAllDocuments
} = require('../controllers/searchController');

// Search routes
router.get('/search', searchDocuments);

// Document routes
router.get('/documents', getAllDocuments);
router.get('/documents/:id', getDocument);
router.post('/documents', uploadDocument);
router.post('/documents/upload-multiple', uploadMultipleDocuments);
router.post('/documents/load-sample', loadSampleDocuments);

module.exports = router;