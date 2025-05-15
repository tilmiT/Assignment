const mongoose = require('mongoose');

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

module.exports = mongoose.model('Cache', CacheSchema);