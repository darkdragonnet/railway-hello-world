async function sendMessage() {
  // Bắt đầu hàm
  console.log('🚀 Send button clicked - function execution started');
  
  const userMessage = userInput.value.trim();
  console.log('📝 User message:', userMessage);
  
  if (!userMessage) {
    console.log('⚠️ Empty message detected, returning early');
    return;
  }
  
  // Hiển thị tin nhắn của người dùng
  console.log('👤 Adding user message to chat UI');
  addMessageToChat('user', userMessage);
  userInput.value = '';
  
  // Thêm vào lịch sử hội thoại
  conversationHistory.push({
    role: 'user',
    content: userMessage
  });
  console.log('🔄 Updated conversation history:', JSON.stringify(conversationHistory));
  
  // Hiển thị trạng thái đang tải
  console.log('⏳ Adding loading message');
  const loadingMessage = addMessageToChat('system', 'Đang xử lý...');
  
  try {
    // Chuẩn bị gọi API
    console.log('🌐 About to call API endpoint /api/chat');
    console.log('📤 Request payload:', JSON.stringify({
      messages: conversationHistory
    }));
    
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
    
    console.log('📥 API response received, status:', response.status);
    
    const data = await response.json();
    console.log('📦 Response data structure:', Object.keys(data));
    console.log('📦 Full response data:', data);
    
    if (!response.ok) {
      console.error('❌ API response not OK:', response.status, data);
      throw new Error(data.error || 'Lỗi khi gọi API');
    }
    
    // Kiểm tra cấu trúc data từ server
    if (!data.messageHtml) {
      console.error('❌ Missing messageHtml in response!');
      console.log('Server response format:', data);
    }
    
    if (!data.rawData || !data.rawData.choices || !data.rawData.choices[0]) {
      console.error('❌ Invalid rawData structure:', data.rawData);
    }
    
    // Xóa thông báo đang tải
    console.log('🗑️ Removing loading message');
    if (loadingMessage && loadingMessage.parentNode) {
      chatMessages.removeChild(loadingMessage);
    } else {
      console.error('⚠️ Loading message not found or already removed');
    }
    
    // Thêm HTML đã được tạo sẵn từ server
    console.log('➕ Adding assistant message HTML:', data.messageHtml);
    chatMessages.insertAdjacentHTML('beforeend', data.messageHtml);
    
    // Thêm vào lịch sử hội thoại - vẫn cần nội dung văn bản thuần
    if (data.rawData && data.rawData.choices && data.rawData.choices[0] && data.rawData.choices[0].message) {
      const assistantMessage = data.rawData.choices[0].message.content;
      console.log('🤖 Assistant response:', assistantMessage);
      
      conversationHistory.push({
        role: 'assistant',
        content: assistantMessage
      });
      console.log('🔄 Updated conversation history with assistant message');
    } else {
      console.error('❌ Could not extract assistant message from data');
    }
    
    // Cập nhật các phần citations và related questions bằng HTML đã tạo sẵn
    console.log('📚 Updating citations:', Boolean(data.citationsHtml));
    citationsContainer.innerHTML = data.citationsHtml || '<p class="empty-state">Không có trích dẫn.</p>';
    
    console.log('❓ Updating related questions:', Boolean(data.questionsHtml));
    relatedQuestionsContainer.innerHTML = data.questionsHtml || '<p class="empty-state">Không có câu hỏi liên quan.</p>';
    
    // Thêm event listener cho các câu hỏi liên quan
    console.log('🔗 Adding click events to related questions');
    document.querySelectorAll('.related-question').forEach(element => {
      element.addEventListener('click', () => {
        const question = element.getAttribute('data-question');
        console.log('👆 Related question clicked:', question);
        userInput.value = question;
        userInput.focus();
      });
    });
    
    console.log('✅ Message exchange completed successfully');
    
  } catch (error) {
    // Xử lý lỗi
    console.error('❌ Error caught in sendMessage:', error);
    console.error('Error details:', error.stack);
    
    // Xóa thông báo đang tải
    console.log('🗑️ Removing loading message (error case)');
    if (loadingMessage && loadingMessage.parentNode) {
      chatMessages.removeChild(loadingMessage);
    } else {
      console.warn('⚠️ Loading message not found or already removed');
    }
    
    // Hiển thị thông báo lỗi
    console.log('⚠️ Adding error message to chat');
    addMessageToChat('system', `Lỗi: ${error.message}`);
  }
}
