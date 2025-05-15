const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const natural = require('natural');
const { removeStopwords } = require('stopword');
const fs = require('fs');
const path = require('path');

// Load environment variables
dotenv.config();

// Initialize express app
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB connection
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('MongoDB Connected'))
.catch(err => console.error('MongoDB Connection Error:', err));

// Define Document Schema
const DocumentSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  content: {
    type: String,
    required: true
  },
  terms: {
    type: [String],
    default: []
  },
  termFrequency: {
    type: Map,
    of: Number,
    default: {}
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const Document = mongoose.model('Document', DocumentSchema);

// Define Cache Schema
const CacheSchema = new mongoose.Schema({
  query: {
    type: String,
    required: true,
    trim: true,
    unique: true
  },
  results: {
    type: [mongoose.Schema.Types.ObjectId],
    ref: 'Document',
    default: []
  },
  relevanceScores: {
    type: Map,
    of: Number,
    default: {}
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 86400 // Cache expires after 24 hours (in seconds)
  }
});

const Cache = mongoose.model('Cache', CacheSchema);

// Text processing utilities
const tokenizer = new natural.WordTokenizer();
const stemmer = natural.PorterStemmer;

const preprocessText = (text) => {
  // Convert to lowercase
  const lowercaseText = text.toLowerCase();
  
  // Tokenize text
  const tokens = tokenizer.tokenize(lowercaseText);
  
  // Remove non-alphanumeric tokens and tokens with length < 2
  const filteredTokens = tokens.filter(token => 
    /^[a-z0-9]+$/i.test(token) && token.length > 1
  );
  
  // Remove stopwords
  const withoutStopwords = removeStopwords(filteredTokens);
  
  // Apply stemming
  const stemmed = withoutStopwords.map(term => stemmer.stem(term));
  
  return stemmed;
};

const calculateTermFrequency = (terms) => {
  const termFrequency = {};
  
  terms.forEach(term => {
    termFrequency[term] = (termFrequency[term] || 0) + 1;
  });
  
  return termFrequency;
};

// API Routes
// Get all documents
app.get('/api/documents', async (req, res) => {
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
});

// Get document by ID
app.get('/api/documents/:id', async (req, res) => {
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
});

// Load sample documents
app.post('/api/documents/load-sample', async (req, res) => {
  try {
    // Create sample documents
    const sampleDocs = [
      { 
        title: 'Introduction to Information Retrieval', 
        content: 'Information retrieval is the activity of obtaining information system resources that are relevant to an information need from a collection of those resources. Searches can be based on full-text or other content-based indexing.' 
      },
      { 
        title: 'Search Engines', 
        content: 'Search engines are software systems that are designed to carry out web searches. They search the World Wide Web in a systematic way for particular information specified in a textual web search query.' 
      },
      { 
        title: 'TF-IDF Ranking', 
        content: 'TF-IDF stands for term frequency-inverse document frequency. It is a numerical statistic that is intended to reflect how important a word is to a document in a collection or corpus.' 
      },
      { 
        title: 'Document Indexing', 
        content: 'Indexing in the context of search engines refers to the process of collecting, parsing, and storing data to facilitate fast and accurate information retrieval.' 
      },
      { 
        title: 'Query Processing', 
        content: 'Query processing is one of the most important tasks in a search engine. It involves transforming the user query into a form that the search engine can understand and use to retrieve relevant documents.' 
      }
    ];
    
    // Clear existing documents (for demo purposes)
    await Document.deleteMany({});
    await Cache.deleteMany({});
    
    // Index all documents
    const indexedDocuments = [];
    
    for (const doc of sampleDocs) {
      // Preprocess document content
      const terms = preprocessText(doc.content);
      
      // Calculate term frequency
      const termFrequency = calculateTermFrequency(terms);
      
      // Create new document
      const document = new Document({
        title: doc.title,
        content: doc.content,
        terms,
        termFrequency
      });
      
      // Save document to database
      await document.save();
      indexedDocuments.push(document);
    }
    
    res.status(201).json({
      success: true,
      count: indexedDocuments.length,
      documents: indexedDocuments
    });
  } catch (error) {
    console.error('Error loading sample documents:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Search for documents
app.get('/api/search', async (req, res) => {
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
    
    // Preprocess the query
    const queryTerms = preprocessText(query);
    
    // Count all documents
    const documentCount = await Document.countDocuments();
    
    // Build inverted index
    const invertedIndex = {};
    const idfValues = {};
    
    // Get all documents
    const allDocuments = await Document.find({});
    
    // Build document-term index for each document
    for (const doc of allDocuments) {
      doc.terms.forEach(term => {
        if (!invertedIndex[term]) {
          invertedIndex[term] = new Set();
        }
        invertedIndex[term].add(doc._id.toString());
      });
    }
    
    // Calculate IDF for each term
    Object.keys(invertedIndex).forEach(term => {
      const docsWithTerm = invertedIndex[term].size;
      idfValues[term] = Math.log(documentCount / (docsWithTerm + 1));
    });
    
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
      return res.json({
        success: true,
        results: [],
        scores: {},
        cached: false
      });
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
      
      queryTerms.forEach(term => {
        // Term frequency in document
        const tf = doc.termFrequency.get(term) || 0;
        
        // IDF value for term
        const idf = idfValues[term] || 0;
        
        // TF-IDF score for term
        score += tf * idf;
      });
      
      // Normalize by document length (number of terms)
      const normalizedScore = score / (doc.terms.length || 1);
      
      scores[doc._id.toString()] = normalizedScore;
    });
    
    // Get document IDs sorted by relevance score (descending)
    const sortedDocIds = Object.keys(scores).sort((a, b) => scores[b] - scores[a]);
    
    // Get the documents in order
    const results = await Document.find({ 
      _id: { $in: sortedDocIds } 
    }).select('_id title content');
    
    // Sort results based on calculated order
    const sortedResults = sortedDocIds.map(id => 
      results.find(doc => doc._id.toString() === id)
    ).filter(Boolean);
    
    // Cache the results
    if (sortedResults.length > 0) {
      const resultIds = sortedResults.map(doc => doc._id);
      
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
      results: sortedResults,
      scores,
      cached: false
    });
  } catch (error) {
    console.error('Error searching documents:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Define port
const PORT = process.env.PORT || 5000;

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;