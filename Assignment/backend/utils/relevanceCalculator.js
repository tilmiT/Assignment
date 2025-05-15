const Document = require('../models/Document');
const { preprocessText } = require('./preprocessor');
const { buildInvertedIndex } = require('./indexer');

/**
 * Calculate TF-IDF scores for search results
 * @param {string} query - Search query
 * @param {Object} invertedIndex - Global inverted index
 * @param {Object} idfValues - IDF values for all terms
 * @returns {Object} - Document IDs with their relevance scores
 */
const calculateRelevance = async (query, invertedIndex, idfValues) => {
  // Preprocess the query
  const queryTerms = preprocessText(query);
  
  // Find documents containing query terms
  const matchingDocIds = new Set();
  
  queryTerms.forEach(term => {
    if (invertedIndex[term]) {
      invertedIndex[term].forEach(docId => {
        matchingDocIds.add(docId);
      });
    }
  });
  
  // If no matching documents found
  if (matchingDocIds.size === 0) {
    return {};
  }
  
  // Convert to array
  const docIds = Array.from(matchingDocIds);
  
  // Get matching documents
  const documents = await Document.find({ 
    _id: { $in: docIds } 
  });
  
  // Calculate TF-IDF scores for each document
  const scores = {};
  
  documents.forEach(doc => {
    let score = 0;
    
    // Convert termFrequency to regular object if it's stored as a Map
    const termFrequency = doc.termFrequency instanceof Map ? 
      doc.termFrequency : new Map(Object.entries(doc.termFrequency || {}));
    
    queryTerms.forEach(term => {
      // Term frequency in document
      const tf = termFrequency.get(term) || termFrequency[term] || 0;
      
      // IDF value for term
      const idf = idfValues[term] || 0;
      
      // TF-IDF score for term
      score += tf * idf;
    });
    
    // Normalize by document length (number of terms)
    const normalizedScore = score / (doc.terms.length || 1);
    
    scores[doc._id.toString()] = normalizedScore;
  });
  
  return scores;
};

/**
 * Get matching documents with relevance scores
 * @param {string} query - Search query
 * @returns {Object} - { results: Array of document objects, scores: Map of document IDs to scores }
 */
const getRelevantDocuments = async (query) => {
  try {
    // Build or get the inverted index
    const { invertedIndex, idfValues } = await buildInvertedIndex();
    
    // Calculate relevance scores
    const scores = await calculateRelevance(query, invertedIndex, idfValues);
    
    // Get document IDs sorted by relevance score (descending)
    const sortedDocIds = Object.keys(scores).sort((a, b) => scores[b] - scores[a]);
    
    // Get the documents
    const results = await Document.find({ 
      _id: { $in: sortedDocIds } 
    }).select('_id title content');
    
    // Sort results based on calculated order
    const sortedResults = sortedDocIds.map(id => 
      results.find(doc => doc._id.toString() === id)
    ).filter(Boolean);
    
    return { 
      results: sortedResults, 
      scores
    };
  } catch (error) {
    console.error('Error getting relevant documents:', error);
    throw error;
  }
};

module.exports = {
  calculateRelevance,
  getRelevantDocuments
};