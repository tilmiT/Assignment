// Fix in apiService.js - getDocument function name mismatch
import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

const apiService = {
  getAllDocuments: async () => {
    const response = await axios.get(`${API_BASE_URL}/documents`);
    return response.data;
  },
  
  searchDocuments: async (query) => {
    const response = await axios.get(`${API_BASE_URL}/search`, {
      params: { query }
    });
    return response.data;
  },
  
  loadSampleDocuments: async () => {
    const response = await axios.post(`${API_BASE_URL}/documents/load-sample`);
    return response.data;
  },

  // Changed from getDocumentById to getDocument to match usage in DocumentPage
  getDocument: async (id) => {
    const response = await axios.get(`${API_BASE_URL}/documents/${id}`);
    return response.data;
  },
};

export default apiService;