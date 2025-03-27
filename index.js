// Import các thư viện cần thiết
require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
const path = require('path');
const fs = require('fs');

// Khởi tạo Express app - PHẢI CÓ DÒNG NÀY
const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(bodyParser.json());
app.use(express.static('public'));

// Hàm escape HTML để phòng chống XSS
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
    
    // Biến đổi JSON thành HTML
    const data = response.data;
    const assistantMessage = data.choices[0].message.content;
    
    // Tạo HTML cho tin nhắn - với mã hóa phòng chống XSS
    let messageHtml = `<div class="message assistant">${escapeHtml(assistantMessage)}</div>`;
    
    // Tạo HTML cho citations
    let citationsHtml = '';
    if (data.citations && data.citations.length > 0) {
      citationsHtml = '<div class="citations-container">';
      data.citations.forEach(citation => {
        let sourceText = '';
        if (citation.document_title) {
          sourceText += escapeHtml(citation.document_title);
        }
        if (citation.document_author) {
          sourceText += ` - ${escapeHtml(citation.document_author)}`;
        }
        if (citation.document_year) {
          sourceText += ` (${escapeHtml(citation.document_year)})`;
        }
        if (citation.document_reference) {
          sourceText += `, Ref: ${escapeHtml(citation.document_reference)}`;
        }
        
        citationsHtml += `
          <div class="citation-item">
            <div class="citation-text">${escapeHtml(citation.cited_text)}</div>
            <div class="citation-source">${sourceText || 'Không có thông tin nguồn'}</div>
          </div>
        `;
      });
      citationsHtml += '</div>';
    } else {
      citationsHtml = '<p class="empty-state">Không có trích dẫn cho câu trả lời này.</p>';
    }
    
    // Tạo HTML cho related questions
    let questionsHtml = '';
    if (data.related_questions && data.related_questions.length > 0) {
      questionsHtml = '<div class="related-questions-container">';
      data.related_questions.forEach(question => {
        const safeQuestion = escapeHtml(question);
        questionsHtml += `<div class="related-question" data-question="${safeQuestion}">${safeQuestion}</div>`;
      });
      questionsHtml += '</div>';
    } else {
      questionsHtml = '<p class="empty-state">Không có câu hỏi liên quan.</p>';
    }
    
    // Trả về HTML thay vì JSON
    res.send({
      messageHtml: messageHtml,
      citationsHtml: citationsHtml,
      questionsHtml: questionsHtml,
      rawData: data // Vẫn gửi dữ liệu gốc để tiện cho việc debug
    });
    
  } catch (error) {
    console.error('Error calling Magisterium API:', error.response?.data || error.message);
    res.status(error.response?.status || 500).json({
      error: error.response?.data?.error || 'Failed to communicate with Magisterium API'
    });
  }
});

// Thêm route cho trang docs nếu đã thêm trước đó
/* 
app.get('/docs', (req, res) => {
  // Code cho trang docs
});
*/

// Khởi động server - PHẢI CÓ DÒNG NÀY
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
