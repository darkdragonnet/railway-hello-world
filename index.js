// Fix for the escapeHtml function
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

// Fix for the next() middleware function
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

// Fix for function return statements
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
