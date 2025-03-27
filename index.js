// Thay đổi hàm xử lý route /api/chat trong index.js
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
    
    // Thay đổi từ đây - biến đổi JSON thành HTML
    const data = response.data;
    const assistantMessage = data.choices[0].message.content;
    
    // Tạo HTML cho tin nhắn
    let messageHtml = `<div class="message assistant">${assistantMessage}</div>`;
    
    // Tạo HTML cho citations
    let citationsHtml = '';
    if (data.citations && data.citations.length > 0) {
      citationsHtml = '<div class="citations-container">';
      data.citations.forEach(citation => {
        let sourceText = '';
        if (citation.document_title) {
          sourceText += citation.document_title;
        }
        if (citation.document_author) {
          sourceText += ` - ${citation.document_author}`;
        }
        if (citation.document_year) {
          sourceText += ` (${citation.document_year})`;
        }
        if (citation.document_reference) {
          sourceText += `, Ref: ${citation.document_reference}`;
        }
        
        citationsHtml += `
          <div class="citation-item">
            <div class="citation-text">${citation.cited_text}</div>
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
        questionsHtml += `<div class="related-question" data-question="${question}">${question}</div>`;
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
