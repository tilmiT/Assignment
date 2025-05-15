const Document = require('../models/Document');
const { preprocessText, calculateTermFrequency } = require('./preprocessor');

/**
 * Build an inverted index for a collection of documents
 * @returns {Object} - Global inverted index and IDF values
 */
const buildInvertedIndex = async () => {
  const invertedIndex = {};
  const documentCount = await Document.countDocuments();
  
  if (documentCount === 0) {
    return { invertedIndex: {}, idfValues: {} };
  }
  
  // Get all documents
  const documents = await Document.find({});
  
  // Build document-term index for each document
  for (const doc of documents) {
    // Update each document's term frequency
    const termFrequency = doc.termFrequency instanceof Map ? 
      doc.termFrequency : new Map(Object.entries(doc.termFrequency || {}));
    
    // Update global inverted index
    doc.terms.forEach(term => {
      if (!invertedIndex[term]) {
        invertedIndex[term] = new Set();
      }
      invertedIndex[term].add(doc._id.toString());
    });
  }
  
  // Calculate IDF for each term
  const idfValues = {};
  
  Object.keys(invertedIndex).forEach(term => {
    const docsWithTerm = invertedIndex[term].size;
    idfValues[term] = Math.log(documentCount / (docsWithTerm + 1)); // Add 1 to avoid division by zero
  });
  
  // Convert Set to Array for each term in the inverted index
  const serializedIndex = {};
  Object.keys(invertedIndex).forEach(term => {
    serializedIndex[term] = Array.from(invertedIndex[term]);
  });
  
  return { invertedIndex: serializedIndex, idfValues };
};

/**
 * Index a single document
 * @param {string} title - Document title
 * @param {string} content - Document content
 * @returns {Object} - Indexed document
 */
const indexDocument = async (title, content) => {
  try {
    // Preprocess document content
    const terms = preprocessText(content);
    
    // Calculate term frequency
    const termFrequency = calculateTermFrequency(terms);
    
    // Create new document
    const document = new Document({
      title,
      content,
      terms,
      termFrequency: Object.fromEntries(
        Object.entries(termFrequency)
      ) // Convert to format MongoDB can store
    });
    
    // Save document to database
    await document.save();
    
    return document;
  } catch (error) {
    console.error('Error indexing document:', error);
    throw error;
  }
};

/**
 * Index multiple documents
 * @param {Array} documents - Array of {title, content} objects
 * @returns {Array} - Array of indexed documents
 */
const indexMultipleDocuments = async (documents) => {
  try {
    const indexedDocs = [];
    
    for (const doc of documents) {
      const indexedDoc = await indexDocument(doc.title, doc.content);
      indexedDocs.push(indexedDoc);
    }
    
    return indexedDocs;
  } catch (error) {
    console.error('Error indexing multiple documents:', error);
    throw error;
  }
};

module.exports = {
  buildInvertedIndex,
  indexDocument,
  indexMultipleDocuments
};