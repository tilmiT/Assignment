Document Retrieval System - Frontend
A React-based frontend for the document retrieval system that provides a clean, intuitive interface for searching and viewing documents.
Features

Responsive search interface
Real-time search results with relevance indicators
Highlighted search terms in results and document views
Cached results indication for faster searches
Document preview with full content display

Setup Instructions

Ensure you have Node.js installed
Install dependencies:

bashnpm install

Create a .env file in the root directory with the following content:

REACT_APP_API_URL=http://localhost:5000/api

Start the development server:

bashnpm start
The application will be available at http://localhost:3000.
Implementation Details
Components Structure

SearchBar: Handles user input for queries
SearchResults: Displays search results with relevance indicators
DocumentPreview: Shows full document content with highlighted search terms
Navbar: Application header with navigation links
LoadingSpinner: Visual feedback during loading states

Pages

HomePage: Main search interface with results display
DocumentPage: Detailed view of a single document

Services

API Service: Handles communication with the backend API

Utilities

Highlighter: Provides text highlighting functionality for search terms

Technologies Used

React for UI components and state management
React Router for navigation
Bootstrap for responsive design
Axios for API requests
