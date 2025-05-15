import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';

function App() {
  const [documents, setDocuments] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    // Fetch all documents when component mounts
    const fetchDocuments = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/documents');
        setDocuments(response.data.documents || []);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching documents:', err);
        setError('Failed to connect to the server. Please ensure the backend is running.');
        setLoading(false);
      }
    };

    fetchDocuments();
  }, []);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setLoading(true);
    try {
      const response = await axios.get(`http://localhost:5000/api/search?query=${searchQuery}`);
      setSearchResults(response.data.results || []);
      setLoading(false);
    } catch (err) {
      console.error('Error searching:', err);
      setError('An error occurred while searching. Please try again.');
      setLoading(false);
    }
  };

  const handleLoadSamples = async () => {
    setLoading(true);
    try {
      await axios.post('http://localhost:5000/api/documents/load-sample');
      // Refresh documents after loading samples
      const response = await axios.get('http://localhost:5000/api/documents');
      setDocuments(response.data.documents || []);
      alert('Sample documents loaded successfully!');
      setLoading(false);
    } catch (err) {
      console.error('Error loading samples:', err);
      setError('Failed to load sample documents.');
      setLoading(false);
    }
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>Document Retrieval System</h1>
      </header>
      <main className="App-main">
        <div className="search-container">
          <form onSubmit={handleSearch}>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search for keywords..."
              className="search-input"
            />
            <button type="submit" className="search-button">Search</button>
          </form>
        </div>

        {error && <div className="error-message">{error}</div>}

        {loading ? (
          <div className="loading">Loading...</div>
        ) : (
          <div className="content">
            {documents.length === 0 ? (
              <div className="no-documents">
                <p>No documents found in the system.</p>
                <button onClick={handleLoadSamples} className="load-button">
                  Load Sample Documents
                </button>
              </div>
            ) : (
              <div className="document-info">
                <p>{documents.length} documents in the system.</p>
                {!searchResults && <p>Start searching by entering keywords above.</p>}
              </div>
            )}

            {searchResults && (
              <div className="search-results">
                <h2>Search Results ({searchResults.length})</h2>
                {searchResults.length === 0 ? (
                  <p>No results found for "{searchQuery}"</p>
                ) : (
                  <ul className="results-list">
                    {searchResults.map((doc) => (
                      <li key={doc._id} className="result-item">
                        <h3>{doc.title}</h3>
                        <p className="result-content">{doc.content.substring(0, 150)}...</p>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

export default App;