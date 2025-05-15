const natural = require('natural');
const { removeStopwords } = require('stopword');

// Initialize tokenizer
const tokenizer = new natural.WordTokenizer();

// Initialize stemmer
const stemmer = natural.PorterStemmer;

/**
 * Preprocess text by tokenizing, removing stopwords, and stemming
 * @param {string} text - The text to preprocess
 * @returns {string[]} - Array of processed terms
 */
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

/**
 * Calculate term frequency for a document
 * @param {string[]} terms - Array of preprocessed terms
 * @returns {Object} - Map of term to frequency count
 */
const calculateTermFrequency = (terms) => {
  const termFrequency = {};
  
  terms.forEach(term => {
    termFrequency[term] = (termFrequency[term] || 0) + 1;
  });
  
  return termFrequency;
};

module.exports = {
  preprocessText,
  calculateTermFrequency
};