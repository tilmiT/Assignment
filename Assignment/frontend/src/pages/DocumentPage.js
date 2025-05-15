import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Alert } from 'react-bootstrap';
import { useParams, useLocation } from 'react-router-dom';
import DocumentPreview from '../components/DocumentPreview';
import LoadingSpinner from '../components/LoadingSpinner';
import apiService from '../services/api';

const DocumentPage = () => {
  const { id } = useParams();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const query = queryParams.get('query') || '';
  
  const [document, setDocument] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchDocument = async () => {
      setIsLoading(true);
      
      try {
        const response = await apiService.getDocument(id);
        setDocument(response.document);
      } catch (error) {
        console.error('Error fetching document:', error);
        setError('Unable to load the document. It may have been removed or the ID is invalid.');
      } finally {
        setIsLoading(false);
      }
    };

    if (id) {
      fetchDocument();
    }
  }, [id]);

  return (
    <Container className="py-4">
      <Row className="justify-content-center">
        <Col md={10}>
          {isLoading ? (
            <LoadingSpinner />
          ) : error ? (
            <Alert variant="danger">{error}</Alert>
          ) : (
            <DocumentPreview document={document} query={query} />
          )}
        </Col>
      </Row>
    </Container>
  );
};

export default DocumentPage;