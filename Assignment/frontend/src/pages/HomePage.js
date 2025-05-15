import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Alert } from 'react-bootstrap';
import SearchBar from '../components/SearchBar';
import SearchResults from '../components/SearchResults';
import LoadingSpinner from '../components/LoadingSpinner';
import apiService from '../services/api';

const HomePage = () => {
  const [searchResults, setSearchResults] = useState(null);
  const [relevanceScores, setRelevanceScores] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [query, setQuery] = useState('');
  const [error, setError] = useState('');
  const [isCached, setIsCached] = useState(false);
  const [documentCount, setDocumentCount] = useState(0);
  const [showDocumentAlert, setShowDocumentAlert] = useState(false);

  // Check if there are any documents in the system
  useEffect(() => {
    const checkDocuments = async () => {
      try {
        setIsLoading(true);
        const response = await apiService.getAllDocuments();
        setDocumentCount(response.count || 0);
        setShowDocumentAlert(response.count === 0);
      } catch (error) {
        console.error('Error checking documents:', error);
        setError('Error connecting to the server. Please make sure the backend is running.');
      } finally {
        setIsLoading(false);
      }
    };
    
    checkDocuments();
  }, []);

  const handleSearch = async (searchQuery) => {
    setIsLoading(true);
    setError('');
    setQuery(searchQuery);
    
    try {
      const response = await apiService.searchDocuments(searchQuery);
      
      setSearchResults(response.results || []);
      setRelevanceScores(response.scores || {});
      setIsCached(response.cached || false);
      
    } catch (error) {
      console.error('Search error:', error);
      setError('An error occurred while searching. Please try again.');
      setSearchResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoadSample = async () => {
    setIsLoading(true);
    setError('');
    
    try {
      const response = await apiService.loadSampleDocuments();
      setDocumentCount(response.count || 0);
      setShowDocumentAlert(false);
      alert(`Successfully loaded ${response.count} sample documents.`);
    } catch (error) {
      console.error('Error loading sample documents:', error);
      setError('An error occurred while loading sample documents.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Container className="py-4">
      <Row className="justify-content-center">
        <Col md={8}>
          <Card className="shadow-sm mb-4">
            <Card.Body>
              <h1 className="text-center mb-4">Document Retrieval System</h1>
              
              {showDocumentAlert && (
                <Alert variant="warning" className="mb-4">
                  <Alert.Heading>No documents found</Alert.Heading>
                  <p>
                    There are no documents in the system. Please load sample documents to get started.
                  </p>
                  <div className="d-flex justify-content-end">
                    <Button 
                      variant="outline-primary" 
                      onClick={handleLoadSample}
                      disabled={isLoading}
                    >
                      Load Sample Documents
                    </Button>
                  </div>
                </Alert>
              )}
              
              <SearchBar onSearch={handleSearch} isLoading={isLoading} />
              
              {error && <Alert variant="danger">{error}</Alert>}
              
              {isLoading ? (
                <LoadingSpinner />
              ) : (
                searchResults && (
                  <SearchResults 
                    results={searchResults} 
                    scores={relevanceScores} 
                    query={query}
                    isCached={isCached}
                  />
                )
              )}
            </Card.Body>
          </Card>
          
          {documentCount > 0 && (
            <div className="text-center text-muted">
              <small>
                {documentCount} documents in the system. 
                {!searchResults && 'Start searching by entering keywords above.'}
              </small>
            </div>
          )}
        </Col>
      </Row>
    </Container>
  );
};

export default HomePage;