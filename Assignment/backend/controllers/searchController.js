const Document = require('../models/Document');
const Cache = require('../models/Cache');
const { indexDocument, indexMultipleDocuments } = require('../utils/indexer');
const { getRelevantDocuments } = require('../utils/relevanceCalculator');
const fs = require('fs');
const path = require('path');

/**
 * Search for documents
 * @route GET /api/search
 */
const searchDocuments = async (req, res) => {
  try {
    const { query } = req.query;
    
    if (!query) {
      return res.status(400).json({ 
        success: false, 
        message: 'Search query is required' 
      });
    }
    
    // Check cache first
    const cachedResult = await Cache.findOne({ query });
    
    if (cachedResult) {
      // Get documents from cache
      const documents = await Document.find({
        _id: { $in: cachedResult.results }
      }).select('_id title content');
      
      // Convert Map to Object for response
      const scoresObject = {};
      cachedResult.relevanceScores.forEach((value, key) => {
        scoresObject[key] = value;
      });
      
      // Sort documents based on scores
      const sortedResults = cachedResult.results
        .map(id => documents.find(doc => doc._id.toString() === id.toString()))
        .filter(Boolean);
      
      console.log('Returning cached results');
      
      return res.json({
        success: true,
        results: sortedResults,
        scores: scoresObject,
        cached: true
      });
    }
    
    // Perform search
    const { results, scores } = await getRelevantDocuments(query);
    
    // Cache the results
    if (results.length > 0) {
      const resultIds = results.map(doc => doc._id);
      
      // Convert scores object to Map for MongoDB
      const scoresMap = new Map();
      Object.keys(scores).forEach(key => {
        scoresMap.set(key, scores[key]);
      });
      
      const newCache = new Cache({
        query,
        results: resultIds,
        relevanceScores: scoresMap
      });
      
      await newCache.save();
    }
    
    res.json({
      success: true,
      results,
      scores,
      cached: false
    });
  } catch (error) {
    console.error('Error searching documents:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Get document by ID
 * @route GET /api/documents/:id
 */
const getDocument = async (req, res) => {
  try {
    const document = await Document.findById(req.params.id);
    
    if (!document) {
      return res.status(404).json({ 
        success: false, 
        message: 'Document not found' 
      });
    }
    
    res.json({
      success: true,
      document
    });
  } catch (error) {
    console.error('Error getting document:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Upload and index a single document
 * @route POST /api/documents
 */
const uploadDocument = async (req, res) => {
  try {
    const { title, content } = req.body;
    
    if (!title || !content) {
      return res.status(400).json({ 
        success: false, 
        message: 'Title and content are required' 
      });
    }
    
    const document = await indexDocument(title, content);
    
    res.status(201).json({
      success: true,
      document
    });
  } catch (error) {
    console.error('Error uploading document:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Upload and index multiple documents from JSON file
 * @route POST /api/documents/upload-multiple
 */
const uploadMultipleDocuments = async (req, res) => {
  try {
    // Expected format: [{ title: string, content: string }, ...]
    const { documents } = req.body;
    
    if (!documents || !Array.isArray(documents)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid documents format' 
      });
    }
    
    const indexedDocuments = await indexMultipleDocuments(documents);
    
    res.status(201).json({
      success: true,
      count: indexedDocuments.length,
      documents: indexedDocuments
    });
  } catch (error) {
    console.error('Error uploading multiple documents:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Load documents from data directory
 * @route POST /api/documents/load-sample
 */
const loadSampleDocuments = async (req, res) => {
  try {
    const documentsDir = path.join(__dirname, '../data/documents');
    
    // Create directory if it doesn't exist
    if (!fs.existsSync(documentsDir)) {
      fs.mkdirSync(documentsDir, { recursive: true });
      
      // Create some sample documents
      const sampleDocs = [
        { 
          title: 'Sample Document 1', 
          content: 'This is a sample document about information retrieval systems. These systems are designed to retrieve information from a collection of documents.' 
        },
        { 
          title: 'Sample Document 2', 
          content: 'Search engines are examples of information retrieval systems that help users find relevant information on the web.' 
        },
        { 
          title: 'Sample Document 3', 
          content: 'Document retrieval is the process of matching and ranking documents based on their relevance to a user query.' 
        },
        { 
          title: 'Sample Document 4', 
          content: 'TF-IDF is a numerical statistic that reflects how important a word is to a document in a collection.' 
        },
        { 
          title: 'Sample Document 5', 
          content: 'Indexing is an important part of information retrieval systems as it allows for efficient searching.' 
        }
      ];
      
      // Write sample documents to files
      sampleDocs.forEach((doc, index) => {
        fs.writeFileSync(
          path.join(documentsDir, `sample-${index + 1}.txt`),
          doc.content
        );
      });
    }
    
    // Read all files in directory
    const files = fs.readdirSync(documentsDir);
    
    // Filter for text files
    const textFiles = files.filter(file => file.endsWith('.txt'));
    
    if (textFiles.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'No sample documents found' 
      });
    }
    
    // Read and parse all documents
    const documents = [];
    
    for (const file of textFiles) {
      const filePath = path.join(documentsDir, file);
      const content = fs.readFileSync(filePath, 'utf8');
      
      // Use filename as title (without extension)
      const title = file.replace(/\.txt$/, '');
      
      documents.push({ title, content });
    }
    
    // Index all documents
    const indexedDocuments = await indexMultipleDocuments(documents);
    
    res.status(201).json({
      success: true,
      count: indexedDocuments.length,
      documents: indexedDocuments
    });
  } catch (error) {
    console.error('Error loading sample documents:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Get all documents
 * @route GET /api/documents
 */
const getAllDocuments = async (req, res) => {
  try {
    const documents = await Document.find({}).select('_id title content');
    
    res.json({
      success: true,
      count: documents.length,
      documents
    });
  } catch (error) {
    console.error('Error getting all documents:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  searchDocuments,
  getDocument,
  uploadDocument,
  uploadMultipleDocuments,
  loadSampleDocuments,
  getAllDocuments
};