Document Retrieval System - Backend
A Node.js and MongoDB-based document retrieval system that allows keyword-based searching through a collection of documents.
Features

Document indexing with an inverted index
Text preprocessing (tokenization, stop word removal, stemming)
TF-IDF relevance scoring
Search query caching
RESTful API endpoints

API Endpoints
Search

GET /api/search?query=<search_terms> - Search documents by keywords

Documents

GET /api/documents - Get all documents
GET /api/documents/:id - Get a document by ID
POST /api/documents - Upload and index a single document
POST /api/documents/upload-multiple - Upload and index multiple documents
POST /api/documents/load-sample - Load and index sample documents from data directory

Setup Instructions

Ensure MongoDB is installed and running on your system
Clone the repository
Install dependencies

bashnpm install

Create a .env file in the root directory with the following content:

PORT=5000
MONGO_URI=mongodb://localhost:27017/document-retrieval
NODE_ENV=development

Create a data/documents directory and add sample text documents (optional)
Start the server

bash# Production mode
npm start

# Development mode with auto-reload
npm run dev
Implementation Details
Indexing Process

Documents are preprocessed using tokenization, stop word removal, and stemming
An inverted index is built, mapping terms to document IDs
Term frequency is calculated for each document
IDF (Inverse Document Frequency) is calculated for each term

Search Process

The search query is preprocessed using the same steps as documents
Matching documents are retrieved using the inverted index
TF-IDF scores are calculated for each matching document
Results are sorted by relevance score
Search results are cached for future queries

Technologies Used

Node.js and Express for the backend server
MongoDB and Mongoose for the database
natural.js for NLP operations (tokenization, stemming)
stopword for stop word removal