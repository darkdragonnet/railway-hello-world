/**
 * Magisterium Chat API Server
 * A proxy service for interacting with the Magisterium AI API.
 */

// Import dependencies
console.log('=== SERVER INITIALIZATION: Loading modules ===');
require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
const path = require('path');
const fs = require('fs');
const cors = require('cors'); // Added CORS support
console.log('=== SERVER INITIALIZATION: All modules loaded successfully ===');

// Constants
const MAGISTERIUM_API_URL = 'https://www.magisterium.com/api/v1/chat/completions';
const PORT = process.env.PORT || 3000;
const API_TIMEOUT = 30000; // 30 seconds
console.log('=== SERVER CONFIGURATION: Constants defined ===');
console.log('DEBUG - PORT:', PORT);
console.log('DEBUG - API_TIMEOUT:', API_TIMEOUT);
console.log('DEBUG - MAGISTERIUM_API_URL:', MAGISTERIUM_API_URL);

// Initialize Express app
console.log('=== SERVER INITIALIZATION: Creating Express app ===');
const app = express();
console.log('=== SERVER INITIALIZATION: Express app created ===');

// Configure middleware
console.log('=== SERVER CONFIGURATION: Setting up middleware ===');
app.use(bodyParser.json());
app.use(express.static('public'));
try {
  app.use(cors()); // Enable CORS for all routes
  console.log('DEBUG - CORS middleware enabled');
} catch (error) {
  console.error('ERROR - Failed to apply CORS middleware:', error);
}
console.log('=== SERVER CONFIGURATION: Middleware setup complete ===');

// Add request logging
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`=== REQUEST [${timestamp}]: ${req.method} ${req.url} ===`);
  console.log('DEBUG - Request headers:', JSON.stringify(req.headers));
  if (req.body && Object.keys(req.body).length > 0) {
    console.log('DEBUG - Request body:', JSON.stringify(req.body).substring(0, 300) + '...');
  }
  
  // Track response time
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`=== RESPONSE [${timestamp}]: ${req.method} ${req.url} - Status: ${res.statusCode} - Duration: ${duration}ms ===`);
  });
  
  next();
});

// Add global error handler
app.use((err, req, res, next) => {
  console.error('=== GLOBAL ERROR HANDLER ===');
  console.error('ERROR - Unhandled exception:', err);
  console.error('ERROR - Stack trace:', err.stack);
  console.error('ERROR - Request path:', req.path);
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
  console.log('FUNCTION - escapeHtml: Starting');
  console.log('DEBUG - escapeHtml input type:', typeof unsafe);
  console.log('DEBUG - escapeHtml input length:', unsafe ? unsafe.length : 0);
  
  if (unsafe === null || unsafe === undefined) {
    console.log('FUNCTION - escapeHtml: Input is null/undefined, returning empty string');
    return '';
  }
  
  const result = String(unsafe)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
    
  console.log('FUNCTION - escapeHtml: Completed');
  console.log('DEBUG - escapeHtml output length:', result.length);
  return result;
}

/**
 * Validates API key and returns appropriate error response if invalid
 * @param {string} apiKey - The API key to validate
 * @param {object} res - Express response object
 * @return {boolean} Whether validation passed
 */
function validateApiKey(apiKey, res) {
  console.log('FUNCTION - validateApiKey: Starting');
  console.log('DEBUG - API key exists:', !!apiKey);
  console.log('DEBUG - API key length:', apiKey ? apiKey.length : 0);
  
  if (!apiKey) {
    console.error('ERROR - API key is missing');
    res.status(400).json({ error: 'Missing API key. Please set MAGISTERIUM_API_KEY environment variable.' });
    console.log('FUNCTION - validateApiKey: Failed (missing API key)');
    return false;
  }
  
  console.log('FUNCTION - validateApiKey: Passed');
  return true;
}

/**
 * Validates chat request body
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 * @return {boolean} Whether validation passed
 */
function validateChatRequest(req, res) {
  console.log('FUNCTION - validateChatRequest: Starting');
  console.log('DEBUG - Request body exists:', !!req.body);
  console.log('DEBUG - Messages exists:', !!(req.body && req.body.messages));
  console.log('DEBUG - Messages is array:', !!(req.body && req.body.messages && Array.isArray(req.body.messages)));
  console.log('DEBUG - Messages length:', req.body && req.body.messages && Array.isArray(req.body.messages) ? req.body.messages.length : 0);
  
  if (!req.body || !req.body.messages || !Array.isArray(req.body.messages)) {
    console.error('ERROR - Invalid request format: missing messages array');
    res.status(400).json({ error: 'Invalid request format. Messages array is required.' });
    console.log('FUNCTION - validateChatRequest: Failed (invalid format)');
    return false;
  }
  
  if (req.body.messages.length === 0) {
    console.error('ERROR - Empty messages array');
    res.status(400).json({ error: 'Messages array cannot be empty.' });
    console.log('FUNCTION - validateChatRequest: Failed (empty messages)');
    return false;
  }
  
  console.log('FUNCTION - validateChatRequest: Passed');
  return true;
}

// Route to serve the main page
app.get('/', (req, res) => {
  console.log('ROUTE - GET /: Serving main page');
  const filePath = path.join(__dirname, 'public', 'index.html');
  console.log('DEBUG - Serving file from path:', filePath);
  console.log('DEBUG - File exists:', fs.existsSync(filePath));
  res.sendFile(filePath);
  console.log('ROUTE - GET /: Main page served');
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  console.log('ROUTE - GET /api/health: Starting health check');
  const apiKey = process.env.MAGISTERIUM_API_KEY;
  console.log('DEBUG - API key configured:', !!apiKey);
  
  const response = {
    status: 'ok',
    serverTime: new Date().toISOString(),
    apiKeyConfigured: !!apiKey,
    apiKeyLength: apiKey ? apiKey.length : 0,
    environment: process.env.NODE_ENV || 'development'
  };
  
  console.log('DEBUG - Health check response:', JSON.stringify(response));
  res.json(response);
  console.log('ROUTE - GET /api/health: Health check completed');
});

// Echo endpoint for testing
app.post('/api/echo', (req, res) => {
  console.log('ROUTE - POST /api/echo: Starting echo test');
  console.log('DEBUG - Echo request body:', JSON.stringify(req.body));
  
  const response = {
    receivedAt: new Date().toISOString(),
    receivedData: req.body,
    echo: true
  };
  
  console.log('DEBUG - Echo response:', JSON.stringify(response));
  res.json(response);
  console.log('ROUTE - POST /api/echo: Echo test completed');
});

// API endpoint to send requests to Magisterium API
app.post('/api/chat', async (req, res) => {
  console.log('ROUTE - POST /api/chat: Starting chat request processing');
  
  try {
    console.log('DEBUG - Request body:', JSON.stringify(req.body).substring(0, 300) + '...');
    console.log('DEBUG - Messages count:', req.body.messages ? req.body.messages.length : 'none');
    console.log('DEBUG - Last message in conversation:', req.body.messages && req.body.messages.length > 0 ? 
      JSON.stringify(req.body.messages[req.body.messages.length - 1]) : 'No messages');
    
    // Validate request and API key
    const apiKey = process.env.MAGISTERIUM_API_KEY;
    console.log('DEBUG - API key exists:', !!apiKey);
    console.log('DEBUG - API key first 5 chars:', apiKey ? apiKey.substring(0, 5) + '...' : 'N/A');
    
    if (!validateApiKey(apiKey, res) || !validateChatRequest(req, res)) {
      console.log('ROUTE - POST /api/chat: Validation failed, exiting early');
      return;
    }

    console.log('STEP - Preparing to call Magisterium API');
    const requestPayload = {
      model: "magisterium-1",
      messages: req.body.messages,
      return_related_questions: true
    };
    console.log('DEBUG - API request payload:', JSON.stringify(requestPayload).substring(0, 300) + '...');
    
    // Call the Magisterium API
    console.log('STEP - Sending request to Magisterium API...');
    console.time('magisterium-api-call');
    const response = await axios.post(
      MAGISTERIUM_API_URL,
      requestPayload,
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: API_TIMEOUT
      }
    );
    console.timeEnd('magisterium-api-call');
    
    console.log('STEP - Processing Magisterium API response');
    console.log('DEBUG - API response status:', response.status);
    console.log('DEBUG - API response headers:', JSON.stringify(response.headers));
    
    const data = response.data;
    console.log('DEBUG - API response data structure:', Object.keys(data));
    console.log('DEBUG - API response data preview:', JSON.stringify(data).substring(0, 300) + '...');
    console.log('DEBUG - Response contains choices:', !!data.choices?.length);
    console.log('DEBUG - Response contains citations:', !!data.citations?.length);
    console.log('DEBUG - Response contains related_questions:', !!data.related_questions?.length);
    console.log('DEBUG - Citations count:', data.citations?.length || 0);
    console.log('DEBUG - Related questions count:', data.related_questions?.length || 0);
    
    // Validate the response structure
    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      console.error('ERROR - Invalid response structure from Magisterium API');
      console.error('ERROR - Response data:', JSON.stringify(data));
      return res.status(500).json({ 
        error: 'Invalid response from Magisterium API' 
      });
    }

    console.log('STEP - Processing assistant message');
    const assistantMessage = data.choices[0].message.content;
    console.log('DEBUG - Assistant message length:', assistantMessage.length);
    console.log('DEBUG - Assistant message preview:', assistantMessage.substring(0, 100) + '...');
    
    // Generate HTML content
    console.log('STEP - Generating message HTML');
    const messageHtml = `<div class="message assistant">${escapeHtml(assistantMessage)}</div>`;
    console.log('DEBUG - Message HTML length:', messageHtml.length);
    
    // Generate citations HTML
    console.log('STEP - Generating citations HTML');
    let citationsHtml = '';
    if (data.citations && data.citations.length > 0) {
      console.log('DEBUG - Processing', data.citations.length, 'citations');
      citationsHtml = `<div class="citations-container">
        ${data.citations.map((citation, index) => {
          console.log(`DEBUG - Processing citation ${index + 1}/${data.citations.length}`);
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
      console.log('DEBUG - No citations to process');
      citationsHtml = '<p class="empty-state">Không có trích dẫn cho câu trả lời này.</p>';
    }
    console.log('DEBUG - Citations HTML length:', citationsHtml.length);
    
    // Generate related questions HTML
    console.log('STEP - Generating related questions HTML');
    let questionsHtml = '';
    if (data.related_questions && data.related_questions.length > 0) {
      console.log('DEBUG - Processing', data.related_questions.length, 'related questions');
      questionsHtml = `<div class="related-questions-container">
        ${data.related_questions.map((question, index) => {
          console.log(`DEBUG - Processing related question ${index + 1}/${data.related_questions.length}`);
          const safeQuestion = escapeHtml(question);
          return `<div class="related-question" data-question="${safeQuestion}">${safeQuestion}</div>`;
        }).join('')}
      </div>`;
    } else {
      console.log('DEBUG - No related questions to process');
      questionsHtml = '<p class="empty-state">Không có câu hỏi liên quan.</p>';
    }
    console.log('DEBUG - Related questions HTML length:', questionsHtml.length);
    
    // Prepare final response
    console.log('STEP - Preparing final response to client');
    const clientResponse = {
      messageHtml,
      citationsHtml,
      questionsHtml,
      rawData: data
    };
    console.log('DEBUG - Client response structure:', Object.keys(clientResponse));
    console.log('DEBUG - Client response size estimate:', JSON.stringify(clientResponse).length, 'bytes');
    
    // Return the response with HTML content
    console.log('STEP - Sending response to client');
    res.json(clientResponse);
    console.log('ROUTE - POST /api/chat: Chat request processing completed successfully');
    
  } catch (error) {
    console.error('=== ERROR IN CHAT ENDPOINT ===');
    console.error('ERROR - Message:', error.message);
    console.error('ERROR - Name:', error.name);
    console.error('ERROR - Stack:', error.stack);
    
    if (error.response) {
      console.error('ERROR - API Response Status:', error.response.status);
      console.error('ERROR - API Response Headers:', JSON.stringify(error.response.headers));
      console.error('ERROR - API Response Data:', JSON.stringify(error.response.data));
    } else if (error.request) {
      console.error('ERROR - No response received from API');
      console.error('ERROR - Request details:', JSON.stringify(error.request));
    } else {
      console.error('ERROR - Error setting up request:', error.message);
    }
    
    console.error('ERROR - Is timeout error:', error.code === 'ECONNABORTED');
    console.error('ERROR - Is network error:', error.message.includes('Network Error'));
    
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
    
    console.log('DEBUG - Error response to client:', JSON.stringify(errorResponse));
    res.status(error.response?.status || 500).json(errorResponse);
    console.log('ROUTE - POST /api/chat: Chat request processing failed');
  }
});

// Documentation route (commented out but improved)
/*
app.get('/docs', (req, res) => {
  console.log('ROUTE - GET /docs: Starting documentation request');
  try {
    const markdownPath = path.join(__dirname, 'README.md');
    console.log('DEBUG - Markdown path:', markdownPath);
    console.log('DEBUG - File exists:', fs.existsSync(markdownPath));
    
    fs.readFile(markdownPath, 'utf8', (err, data) => {
      if (err) {
        console.error('ERROR - Reading documentation file:', err);
        return res.status(404).send('Documentation not found');
      }
      
      console.log('DEBUG - Markdown content length:', data.length);
      // Process documentation here...
      console.log('STEP - Processing Markdown to HTML');
      
      const html = `<!DOCTYPE html>
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
      `;
      
      console.log('DEBUG - Generated HTML length:', html.length);
      res.send(html);
      console.log('ROUTE - GET /docs: Documentation served successfully');
    });
  } catch (error) {
    console.error('ERROR - Documentation error:', error);
    res.status(500).send('Error loading documentation');
    console.log('ROUTE - GET /docs: Documentation request failed');
  }
});
*/

// Start the server
console.log('=== SERVER INITIALIZATION: Starting server ===');
app.listen(PORT, () => {
  console.log(`=== SERVER STARTED: Running on port ${PORT} ===`);
  console.log(`=== SERVER CONFIGURATION: API key configured: ${!!process.env.MAGISTERIUM_API_KEY} ===`);
  console.log(`=== ENVIRONMENT VARIABLES ===`);
  console.log('DEBUG - NODE_ENV:', process.env.NODE_ENV || 'not set');
  console.log('DEBUG - PORT:', process.env.PORT || '3000 (default)');
  console.log('DEBUG - API_KEY configured:', !!process.env.MAGISTERIUM_API_KEY);
  console.log('=== SERVER READY ===');
});
