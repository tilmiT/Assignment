import React from 'react';
import { Card, Badge, ListGroup } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { createHighlightedPreview } from '../utils/highlighter';

const SearchResults = ({ results, scores, query, isCached }) => {
  if (!results || results.length === 0) {
    return (
      <Card className="mt-3 shadow-sm">
        <Card.Body>
          <p className="text-center mb-0">No results found for "{query}"</p>
        </Card.Body>
      </Card>
    );
  }

  return (
    <div className="my-3">
      <div className="d-flex justify-content-between align-items-center mb-2">
        <h5>Search Results ({results.length})</h5>
        {isCached && (
          <Badge bg="info" className="me-2">Cached Results</Badge>
        )}
      </div>
      
      <ListGroup className="shadow-sm">
        {results.map((doc) => {
          const docId = doc._id.toString();
          const relevanceScore = scores ? scores[docId] || 0 : 0;
          const relevancePercentage = Math.round(relevanceScore * 100);
          
          return (
            <ListGroup.Item key={docId} className="border-bottom">
              <div className="d-flex justify-content-between align-items-start">
                <div>
                  <h5>
                    <Link to={`/document/${docId}`} className="text-decoration-none">
                      {doc.title}
                    </Link>
                  </h5>
                  <div className="preview-text text-muted">
                    {createHighlightedPreview(doc.content, query, 100)}
                  </div>
                </div>
                <div>
                  <Badge 
                    bg={
                      relevancePercentage > 75 ? "success" : 
                      relevancePercentage > 50 ? "primary" : 
                      relevancePercentage > 25 ? "warning" : 
                      "secondary"
                    }
                    className="ms-2"
                  >
                    {relevancePercentage}%
                  </Badge>
                </div>
              </div>
            </ListGroup.Item>
          );
        })}
      </ListGroup>
    </div>
  );
};

export default SearchResults;