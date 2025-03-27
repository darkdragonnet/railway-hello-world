// Thay đổi hàm sendMessage trong script.js
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
    
    // Thêm HTML đã được tạo sẵn từ server
    chatMessages.insertAdjacentHTML('beforeend', data.messageHtml);
    
    // Thêm vào lịch sử hội thoại - vẫn cần nội dung văn bản thuần
    const assistantMessage = data.rawData.choices[0].message.content;
    conversationHistory.push({
      role: 'assistant',
      content: assistantMessage
    });
    
    // Cập nhật các phần citations và related questions bằng HTML đã tạo sẵn
    citationsContainer.innerHTML = data.citationsHtml;
    relatedQuestionsContainer.innerHTML = data.questionsHtml;
    
    // Thêm event listener cho các câu hỏi liên quan
    document.querySelectorAll('.related-question').forEach(element => {
      element.addEventListener('click', () => {
        userInput.value = element.getAttribute('data-question');
        userInput.focus();
      });
    });
    
  } catch (error) {
    // Xóa thông báo đang tải
    chatMessages.removeChild(loadingMessage);
    
    // Hiển thị thông báo lỗi
    addMessageToChat('system', `Lỗi: ${error.message}`);
    console.error('Error:', error);
  }
}

// Các hàm hiện tại như addMessageToChat, displayCitations, displayRelatedQuestions
// có thể giữ nguyên để phục vụ các trường hợp khác
