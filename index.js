require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
const path = require('path');

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(bodyParser.json());
app.use(express.static('public'));

// Route để phục vụ trang chính
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// API endpoint để gửi yêu cầu đến Magisterium API
app.post('/api/chat', async (req, res) => {
  try {
    const apiKey = process.env.MAGISTERIUM_API_KEY;
    
    if (!apiKey) {
      return res.status(400).json({ error: 'Missing API key' });
    }

    const response = await axios.post(
      'https://www.magisterium.com/api/v1/chat/completions',
      {
        model: "magisterium-1",
        messages: req.body.messages,
        return_related_questions: true
      },
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      }
    );

    res.json(response.data);
  } catch (error) {
    console.error('Error calling Magisterium API:', error.response?.data || error.message);
    res.status(error.response?.status || 500).json({
      error: error.response?.data?.error || 'Failed to communicate with Magisterium API'
    });
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
