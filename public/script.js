document.addEventListener('DOMContentLoaded', () => {
  const chatMessages = document.getElementById('chat-messages');
  const userInput = document.getElementById('user-input');
  const sendButton = document.getElementById('send-button');
  const citationsContainer = document.getElementById('citations-container');
  const relatedQuestionsContainer = document.getElementById('related-questions-container');
  
  let conversationHistory = [];
  
  // Xử lý sự kiện nhấn nút Gửi
  sendButton.addEventListener('click', sendMessage);
  
  // Xử lý phím Enter để gửi tin nhắn
  userInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  });
  
  async function sendMessage() {
    const userMessage = userInput.value.trim();
    if (!userMessage) return;
    
    // Hiển thị tin nhắn của người dùng
    addMessageToChat('user', userMessage);
    userInput.value = '';
    
    // Thêm vào lịch sử hội thoại
    conversationHistory.push({
      role: 'user',
      content: userMessage
    });
    
    // Hiển thị trạng thái đang tải
    const loadingMessage = addMessageToChat('system', 'Đang xử lý...');
    
    try {
      // Gọi API
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          messages: conversationHistory
        })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Lỗi khi gọi API');
      }
      
      // Xóa thông báo đang tải
      chatMessages.removeChild(loadingMessage);
      
      // Lấy tin nhắn từ assistant
      const assistantMessage = data.choices[0].message.content;
      
      // Hiển thị tin nhắn của assistant
      addMessageToChat('assistant', assistantMessage);
      
      // Thêm vào lịch sử hội thoại
      conversationHistory.push({
        role: 'assistant',
        content: assistantMessage
      });
      
      // Hiển thị citations nếu có
      displayCitations(data.citations);
      
      // Hiển thị câu hỏi liên quan nếu có
      displayRelatedQuestions(data.related_questions);
      
    } catch (error) {
      // Xóa thông báo đang tải
      chatMessages.removeChild(loadingMessage);
      
      // Hiển thị thông báo lỗi
      addMessageToChat('system', `Lỗi: ${error.message}`);
      console.error('Error:', error);
    }
  }
  
  function addMessageToChat(role, content) {
    const messageElement = document.createElement('div');
    messageElement.classList.add('message', role);
    messageElement.textContent = content;
    chatMessages.appendChild(messageElement);
    
    // Cuộn xuống tin nhắn mới nhất
    chatMessages.scrollTop = chatMessages.scrollHeight;
    
    return messageElement;
  }
  
  function displayCitations(citations) {
    citationsContainer.innerHTML = '';
    
    if (!citations || citations.length === 0) {
      const emptyState = document.createElement('p');
      emptyState.classList.add('empty-state');
      emptyState.textContent = 'Không có trích dẫn cho câu trả lời này.';
      citationsContainer.appendChild(emptyState);
      return;
    }
    
    citations.forEach(citation => {
      const citationItem = document.createElement('div');
      citationItem.classList.add('citation-item');
      
      const citationText = document.createElement('div');
      citationText.classList.add('citation-text');
      citationText.textContent = citation.cited_text;
      
      const citationSource = document.createElement('div');
      citationSource.classList.add('citation-source');
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
      citationSource.textContent = sourceText || 'Không có thông tin nguồn';
      
      citationItem.appendChild(citationText);
      citationItem.appendChild(citationSource);
      citationsContainer.appendChild(citationItem);
    });
  }
  
  function displayRelatedQuestions(questions) {
    relatedQuestionsContainer.innerHTML = '';
    
    if (!questions || questions.length === 0) {
      const emptyState = document.createElement('p');
      emptyState.classList.add('empty-state');
      emptyState.textContent = 'Không có câu hỏi liên quan.';
      relatedQuestionsContainer.appendChild(emptyState);
      return;
    }
    
    questions.forEach(question => {
      const questionElement = document.createElement('div');
      questionElement.classList.add('related-question');
      questionElement.textContent = question;
      
      // Thêm sự kiện click để đặt câu hỏi liên quan
      questionElement.addEventListener('click', () => {
        userInput.value = question;
        userInput.focus();
      });
      
      relatedQuestionsContainer.appendChild(questionElement);
    });
  }
});

