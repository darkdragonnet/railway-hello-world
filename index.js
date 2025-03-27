/**
 * Magisterium Chat API Server
 * A proxy service for interacting with the Magisterium AI API.
 */

// Import dependencies
require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
const path = require('path');
const fs = require('fs');
const cors = require('cors'); // Added CORS support

// Constants
const MAGISTERIUM_API_URL = 'https://www.magisterium.com/api/v1/chat/completions';
const PORT = process.env.PORT || 3000;
const API_TIMEOUT = 30000; // 30 seconds

// Initialize Express app
const app = express();

// Configure middleware
app.use(bodyParser.json());
app.use(express.static('public'));
app.use(cors()); // Enable CORS for all routes

// Add request logging
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Add global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ 
    error: 'Server error', 
    message: process.env.NODE_ENV === 'production' ? null : err.message 
  });
});

/**
 * Escapes HTML special characters to prevent XSS attacks
 * @param {string} unsafe - The potentially unsafe string
 * @return {string} Safely escaped HTML string
 */
function escapeHtml(unsafe) {
  if (unsafe === null || unsafe === undefined) {
    return '';
  }
  
  return String(unsafe)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/**
 * Validates API key and returns appropriate error response if invalid
 * @param {string} apiKey - The API key to validate
 * @param {object} res - Express response object
 * @return {boolean} Whether validation passed
 */
function validateApiKey(apiKey, res) {
  if (!apiKey) {
    res.status(400).json({ error: 'Missing API key. Please set MAGISTERIUM_API_KEY environment variable.' });
    return false;
  }
  return true;
}

/**
 * Validates chat request body
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 * @return {boolean} Whether validation passed
 */
function validateChatRequest(req, res) {
  if (!req.body || !req.body.messages || !Array.isArray(req.body.messages)) {
    res.status(400).json({ error: 'Invalid request format. Messages array is required.' });
    return false;
  }
  
  if (req.body.messages.length === 0) {
    res.status(400).json({ error: 'Messages array cannot be empty.' });
    return false;
  }
  
  return true;
}

// Route to serve the main page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  const apiKey = process.env.MAGISTERIUM_API_KEY;
  res.json({
    status: 'ok',
    serverTime: new Date().toISOString(),
    apiKeyConfigured: !!apiKey,
    apiKeyLength: apiKey ? apiKey.length : 0,
    environment: process.env.NODE_ENV || 'development'
  });
});

// Echo endpoint for testing
app.post('/api/echo', (req, res) => {
  console.log('Echo request received:', req.body);
  res.json({
    receivedAt: new Date().toISOString(),
    receivedData: req.body,
    echo: true
  });
});

// API endpoint to send requests to Magisterium API
app.post('/api/chat', async (req, res) => {
  try {
    console.log('Chat request received with messages:', 
      req.body.messages ? req.body.messages.length : 'none');
    
    // Validate request and API key
    const apiKey = process.env.MAGISTERIUM_API_KEY;
    if (!validateApiKey(apiKey, res) || !validateChatRequest(req, res)) {
      return;
    }

    console.log('Calling Magisterium API...');
    // Call the Magisterium API
    const response = await axios.post(
      MAGISTERIUM_API_URL,
      {
        model: "magisterium-1",
        messages: req.body.messages,
        return_related_questions: true
      },
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: API_TIMEOUT // Add timeout to prevent hanging requests
      }
    );
    
    const data = response.data;
    console.log('API response received:', {
      status: response.status,
      hasChoices: !!data.choices?.length,
      hasCitations: !!data.citations?.length,
      hasRelatedQuestions: !!data.related_questions?.length
    });
    
    // Validate the response structure
    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      console.error('Invalid response structure from Magisterium:', data);
      return res.status(500).json({ 
        error: 'Invalid response from Magisterium API' 
      });
    }

    const assistantMessage = data.choices[0].message.content;
    
    // Generate HTML content - Using template literals for better readability
    const messageHtml = `<div class="message assistant">${escapeHtml(assistantMessage)}</div>`;
    
    // Generate citations HTML
    let citationsHtml = '';
    if (data.citations && data.citations.length > 0) {
      citationsHtml = `<div class="citations-container">
        ${data.citations.map(citation => {
          let sourceText = [
            citation.document_title ? escapeHtml(citation.document_title) : '',
            citation.document_author ? `- ${escapeHtml(citation.document_author)}` : '',
            citation.document_year ? `(${escapeHtml(citation.document_year)})` : '',
            citation.document_reference ? `Ref: ${escapeHtml(citation.document_reference)}` : ''
          ].filter(Boolean).join(' ');
          
          return `
            <div class="citation-item">
              <div class="citation-text">${escapeHtml(citation.cited_text)}</div>
              <div class="citation-source">${sourceText || 'Không có thông tin nguồn'}</div>
            </div>
          `;
        }).join('')}
      </div>`;
    } else {
      citationsHtml = '<p class="empty-state">Không có trích dẫn cho câu trả lời này.</p>';
    }
    
    // Generate related questions HTML
    let questionsHtml = '';
    if (data.related_questions && data.related_questions.length > 0) {
      questionsHtml = `<div class="related-questions-container">
        ${data.related_questions.map(question => {
          const safeQuestion = escapeHtml(question);
          return `<div class="related-question" data-question="${safeQuestion}">${safeQuestion}</div>`;
        }).join('')}
      </div>`;
    } else {
      questionsHtml = '<p class="empty-state">Không có câu hỏi liên quan.</p>';
    }
    
    // Return the response with HTML content
    res.json({
      messageHtml,
      citationsHtml,
      questionsHtml,
      rawData: data // Include raw data for debugging
    });
    
  } catch (error) {
    console.error('Error calling Magisterium API:', error);
    
    // Detailed error response
    const errorResponse = {
      error: 'Failed to communicate with Magisterium API',
      details: null
    };
    
    // Add more details in non-production environments
    if (process.env.NODE_ENV !== 'production') {
      errorResponse.details = {
        message: error.message,
        response: error.response?.data
      };
    }
    
    res.status(error.response?.status || 500).json(errorResponse);
  }
});

// Documentation route (commented out but improved)
/*
app.get('/docs', (req, res) => {
  try {
    const markdownPath = path.join(__dirname, 'README.md');
    fs.readFile(markdownPath, 'utf8', (err, data) => {
      if (err) {
        console.error('Error reading documentation:', err);
        return res.status(404).send('Documentation not found');
      }
      
      // Process documentation here...
      res.send(`<!DOCTYPE html>
        <html>
        <head>
          <title>Magisterium API Documentation</title>
          <link rel="stylesheet" href="/styles.css">
        </head>
        <body>
          <div class="markdown-content">
            ${processMarkdown(data)}
          </div>
        </body>
        </html>
      `);
    });
  } catch (error) {
    console.error('Documentation error:', error);
    res.status(500).send('Error loading documentation');
  }
});
*/

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`API key configured: ${!!process.env.MAGISTERIUM_API_KEY}`);
});
