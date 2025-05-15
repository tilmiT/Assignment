import React from 'react';
import { Card, Button } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { highlightText } from '../utils/highlighter';

const DocumentPreview = ({ document, query }) => {
  if (!document) {
    return null;
  }

  return (
    <Card className="my-4 shadow">
      <Card.Header className="bg-primary text-white">
        <h4 className="mb-0">{document.title}</h4>
      </Card.Header>
      <Card.Body>
        <div className="document-content">
          {query ? (
            <p>{highlightText(document.content, query)}</p>
          ) : (
            <p>{document.content}</p>
          )}
        </div>
      </Card.Body>
      <Card.Footer className="text-end">
        <Link to="/">
          <Button variant="secondary">Back to Search</Button>
        </Link>
      </Card.Footer>
    </Card>
  );
};

export default DocumentPreview;