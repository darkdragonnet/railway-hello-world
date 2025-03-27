async function sendMessage() {
  // Environment and context checking
  console.log('🔍 BROWSER INFO:', navigator.userAgent);
  console.log('🌐 NETWORK STATUS: Online =', navigator.onLine);
  console.log('⏱️ FUNCTION START TIME:', new Date().toISOString());
  console.log('📊 MEMORY USAGE:', performance.memory ? JSON.stringify(performance.memory) : 'Not available');
  
  // DOM element validation before starting
  console.log('🧪 DOM VALIDATION:');
  console.log('- chatMessages exists:', !!chatMessages, chatMessages);
  console.log('- userInput exists:', !!userInput, userInput);
  console.log('- citationsContainer exists:', !!citationsContainer, citationsContainer);
  console.log('- relatedQuestionsContainer exists:', !!relatedQuestionsContainer, relatedQuestionsContainer);
  console.log('- conversationHistory exists:', !!conversationHistory, typeof conversationHistory);
  
  // Function start
  console.log('🚀 FUNCTION START: sendMessage() called');
  console.time('sendMessage-total-execution');
  
  // User input processing
  const userMessage = userInput ? userInput.value.trim() : '';
  console.log('📝 INPUT: User message:', userMessage);
  console.log('📏 INPUT: Character count:', userMessage.length);
  console.log('📋 INPUT: Current input element value:', userInput ? userInput.value : 'userInput is null');
  
  if (!userMessage) {
    console.warn('⚠️ EARLY RETURN: Empty message detected');
    console.timeEnd('sendMessage-total-execution');
    return;
  }
  
  // UI Update: Add user message
  console.log('👤 UI UPDATE: Starting to add user message to chat UI');
  try {
    addMessageToChat('user', userMessage);
    console.log('✅ UI UPDATE: Successfully added user message');
  } catch (uiError) {
    console.error('💥 UI UPDATE ERROR: Failed to add user message', uiError);
    // Continue despite error - we can still try to send to API
  }
  
  // Clear input field
  console.log('🧹 UI UPDATE: Clearing input field');
  if (userInput) {
    userInput.value = '';
    console.log('✅ UI UPDATE: Input field cleared');
  } else {
    console.error('💥 UI UPDATE ERROR: Could not clear input field - userInput is null');
  }
  
  // Conversation history update
  console.log('📜 HISTORY: Adding user message to conversation history');
  console.log('📜 HISTORY: Before update -', JSON.stringify(conversationHistory));
  try {
    conversationHistory.push({
      role: 'user',
      content: userMessage
    });
    console.log('✅ HISTORY: Successfully updated conversation history');
    console.log('📜 HISTORY: After update -', JSON.stringify(conversationHistory));
    console.log('📊 HISTORY: Conversation length now', conversationHistory.length, 'messages');
  } catch (historyError) {
    console.error('💥 HISTORY ERROR: Failed to update conversation history', historyError);
    // Initialize if not exists
    conversationHistory = [{role: 'user', content: userMessage}];
    console.log('🔄 HISTORY: Reinitialized conversation history');
  }
  
  // Loading indicator
  console.log('⏳ UI UPDATE: Adding loading message');
  let loadingMessage;
  try {
    loadingMessage = addMessageToChat('system', 'Đang xử lý...');
    console.log('✅ UI UPDATE: Loading message added', loadingMessage);
  } catch (loadingError) {
    console.error('💥 UI UPDATE ERROR: Failed to add loading message', loadingError);
    // Continue without loading message
  }
  
  try {
    // API call preparation
    console.log('🌐 API: Preparing to call /api/chat endpoint');
    const apiPayload = {
      messages: conversationHistory
    };
    console.log('📤 API: Request payload (stringified):', JSON.stringify(apiPayload));
    console.log('📤 API: First message in payload:', apiPayload.messages[0]);
    console.log('📤 API: Last message in payload:', apiPayload.messages[apiPayload.messages.length - 1]);
    
    // Fetch timing measurements
    console.time('api-call-duration');
    console.log('🌐 API: Starting fetch call -', new Date().toISOString());
    
    // Perform API call
    let fetchAborted = false;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      controller.abort();
      fetchAborted = true;
      console.error('⏱️ API: Fetch aborted due to timeout after 30s');
    }, 30000); // 30-second timeout
    
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(apiPayload),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      console.timeEnd('api-call-duration');
      console.log('📥 API: Response received at', new Date().toISOString());
      console.log('📥 API: Response status:', response.status);
      console.log('📥 API: Response status text:', response.statusText);
      console.log('📥 API: Response headers:', Object.fromEntries([...response.headers]));
      
      console.time('response-json-parse');
      console.log('🔄 API: Beginning to parse JSON response');
      const data = await response.json();
      console.timeEnd('response-json-parse');
      
      console.log('📦 API: Response parsed successfully');
      console.log('📦 API: Response data keys:', Object.keys(data));
      console.log('📦 API: messageHtml exists:', !!data.messageHtml);
      console.log('📦 API: citationsHtml exists:', !!data.citationsHtml);
      console.log('📦 API: questionsHtml exists:', !!data.questionsHtml);
      console.log('📦 API: rawData exists:', !!data.rawData);
      
      // Response validation
      if (!response.ok) {
        console.error('❌ API ERROR: Response not OK:', response.status, response.statusText);
        console.error('❌ API ERROR: Error data:', data);
        throw new Error(data.error || `HTTP error! Status: ${response.status}`);
      }
      
      // Data structure validation
      let structureValid = true;
      
      if (!data.messageHtml) {
        console.error('❌ VALIDATION ERROR: Missing messageHtml in response!');
        console.log('VALIDATION: Server response format:', data);
        structureValid = false;
      }
      
      if (!data.rawData) {
        console.error('❌ VALIDATION ERROR: Missing rawData in response!');
        structureValid = false;
      } else if (!data.rawData.choices) {
        console.error('❌ VALIDATION ERROR: Missing rawData.choices in response!');
        console.log('VALIDATION: rawData structure:', data.rawData);
        structureValid = false;
      } else if (!data.rawData.choices[0]) {
        console.error('❌ VALIDATION ERROR: Empty choices array in response!');
        console.log('VALIDATION: choices array:', data.rawData.choices);
        structureValid = false;
      } else if (!data.rawData.choices[0].message) {
        console.error('❌ VALIDATION ERROR: Missing message in first choice!');
        console.log('VALIDATION: first choice:', data.rawData.choices[0]);
        structureValid = false;
      }
      
      if (!structureValid) {
        console.warn('⚠️ VALIDATION: Proceeding with response despite validation errors');
      }
      
      // UI Update: Remove loading message
      console.log('🗑️ UI UPDATE: Removing loading message');
      if (loadingMessage && loadingMessage.parentNode) {
        try {
          chatMessages.removeChild(loadingMessage);
          console.log('✅ UI UPDATE: Loading message removed successfully');
        } catch (removeError) {
          console.error('💥 UI UPDATE ERROR: Failed to remove loading message', removeError);
        }
      } else {
        console.warn('⚠️ UI UPDATE: Loading message not found or already removed');
        console.log('- loadingMessage:', loadingMessage);
        console.log('- Has parent node:', loadingMessage && !!loadingMessage.parentNode);
      }
      
      // UI Update: Add assistant message
      console.log('➕ UI UPDATE: Adding assistant message HTML');
      try {
        console.log('📏 UI UPDATE: messageHtml length:', data.messageHtml?.length || 0);
        console.log('🔍 UI UPDATE: messageHtml preview:', data.messageHtml?.substring(0, 100) + '...');
        
        if (chatMessages && data.messageHtml) {
          const beforeHeight = chatMessages.scrollHeight;
          const beforeChildCount = chatMessages.childElementCount;
          
          chatMessages.insertAdjacentHTML('beforeend', data.messageHtml);
          
          const afterHeight = chatMessages.scrollHeight;
          const afterChildCount = chatMessages.childElementCount;
          
          console.log('✅ UI UPDATE: Assistant message added to DOM');
          console.log('📊 UI UPDATE: Chat container height changed from', beforeHeight, 'to', afterHeight);
          console.log('📊 UI UPDATE: Child count changed from', beforeChildCount, 'to', afterChildCount);
        } else {
          console.error('💥 UI UPDATE ERROR: Could not add message - Missing DOM elements or HTML');
          console.log('- chatMessages exists:', !!chatMessages);
          console.log('- data.messageHtml exists:', !!data.messageHtml);
        }
      } catch (insertError) {
        console.error('💥 UI UPDATE ERROR: Failed to insert assistant message HTML', insertError);
      }
      
      // Conversation history update with assistant response
      console.log('📜 HISTORY: Processing assistant message for history');
      if (data.rawData && data.rawData.choices && data.rawData.choices[0] && data.rawData.choices[0].message) {
        const assistantMessage = data.rawData.choices[0].message.content;
        console.log('🤖 HISTORY: Assistant response length:', assistantMessage.length);
        console.log('🤖 HISTORY: Assistant response preview:', assistantMessage.substring(0, 100) + '...');
        
        try {
          conversationHistory.push({
            role: 'assistant',
            content: assistantMessage
          });
          console.log('✅ HISTORY: Updated conversation history with assistant message');
          console.log('📊 HISTORY: Conversation now has', conversationHistory.length, 'messages');
        } catch (historyError) {
          console.error('💥 HISTORY ERROR: Failed to add assistant message to history', historyError);
        }
      } else {
        console.error('❌ HISTORY ERROR: Could not extract assistant message from data');
        console.log('- data.rawData exists:', !!data.rawData);
        console.log('- data.rawData.choices exists:', !!(data.rawData && data.rawData.choices));
        if (data.rawData && data.rawData.choices) {
          console.log('- choices array length:', data.rawData.choices.length);
        }
      }
      
      // UI Update: Citations
      console.log('📚 UI UPDATE: Updating citations container');
      try {
        if (citationsContainer) {
          console.log('📏 UI UPDATE: citationsHtml length:', data.citationsHtml?.length || 0);
          citationsContainer.innerHTML = data.citationsHtml || '<p class="empty-state">Không có trích dẫn.</p>';
          console.log('✅ UI UPDATE: Citations container updated successfully');
          console.log('📊 UI UPDATE: Citations container now has', citationsContainer.childElementCount, 'children');
        } else {
          console.error('💥 UI UPDATE ERROR: Citations container element not found');
        }
      } catch (citationsError) {
        console.error('💥 UI UPDATE ERROR: Failed to update citations', citationsError);
      }
      
      // UI Update: Related questions
      console.log('❓ UI UPDATE: Updating related questions container');
      try {
        if (relatedQuestionsContainer) {
          console.log('📏 UI UPDATE: questionsHtml length:', data.questionsHtml?.length || 0);
          relatedQuestionsContainer.innerHTML = data.questionsHtml || '<p class="empty-state">Không có câu hỏi liên quan.</p>';
          console.log('✅ UI UPDATE: Related questions container updated successfully');
          console.log('📊 UI UPDATE: Related questions container now has', relatedQuestionsContainer.childElementCount, 'children');
        } else {
          console.error('💥 UI UPDATE ERROR: Related questions container element not found');
        }
      } catch (questionsError) {
        console.error('💥 UI UPDATE ERROR: Failed to update related questions', questionsError);
      }
      
      // Event listeners for related questions
      console.log('🔗 UI UPDATE: Adding click events to related question elements');
      try {
        const relatedQuestions = document.querySelectorAll('.related-question');
        console.log('📊 UI UPDATE: Found', relatedQuestions.length, 'related question elements');
        
        relatedQuestions.forEach((element, index) => {
          try {
            const question = element.getAttribute('data-question');
            console.log(`🔗 UI UPDATE: Setting up listener for question ${index + 1}:`, question);
            
            element.addEventListener('click', () => {
              console.log('👆 EVENT: Related question clicked:', question);
              if (userInput) {
                userInput.value = question;
                userInput.focus();
                console.log('✅ EVENT: Question set in input field and focused');
              } else {
                console.error('💥 EVENT ERROR: Could not set question - userInput is null');
              }
            });
            
            console.log(`✅ UI UPDATE: Added click listener to question ${index + 1}`);
          } catch (elementError) {
            console.error(`💥 UI UPDATE ERROR: Failed to add listener to question ${index + 1}`, elementError);
          }
        });
      } catch (listenersError) {
        console.error('💥 UI UPDATE ERROR: Failed to set up question listeners', listenersError);
      }
      
      // Scroll to bottom
      console.log('📜 UI UPDATE: Scrolling chat to latest message');
      try {
        if (chatMessages) {
          const beforeScroll = chatMessages.scrollTop;
          chatMessages.scrollTop = chatMessages.scrollHeight;
          console.log('✅ UI UPDATE: Chat scrolled from', beforeScroll, 'to', chatMessages.scrollTop);
        } else {
          console.error('💥 UI UPDATE ERROR: Cannot scroll - chatMessages is null');
        }
      } catch (scrollError) {
        console.error('💥 UI UPDATE ERROR: Failed to scroll chat', scrollError);
      }
      
      console.log('✅ FUNCTION END: Message exchange completed successfully');
      
    } catch (fetchError) {
      clearTimeout(timeoutId);
      
      if (fetchAborted) {
        console.error('⏱️ API ERROR: Fetch aborted due to timeout');
        throw new Error('Request timed out. Please try again.');
      } else {
        console.error('🌐 API ERROR: Fetch operation failed', fetchError);
        throw fetchError; // Re-throw to be caught by the outer try-catch
      }
    }
    
  } catch (error) {
    // Detailed error classification and handling
    console.error('💥 ERROR CAUGHT: In sendMessage function');
    console.error('💥 ERROR TYPE:', error.name);
    console.error('💥 ERROR MESSAGE:', error.message);
    console.error('💥 ERROR STACK:', error.stack);
    
    // Classify error type
    let errorType = 'unknown';
    if (error.name === 'AbortError') {
      errorType = 'timeout';
      console.error('⏱️ ERROR CLASSIFICATION: Request timeout');
    } else if (error.message && error.message.includes('NetworkError')) {
      errorType = 'network';
      console.error('📡 ERROR CLASSIFICATION: Network connectivity issue');
    } else if (error.message && error.message.includes('JSON')) {
      errorType = 'parsing';
      console.error('🔍 ERROR CLASSIFICATION: JSON parsing error');
    } else if (error.message && error.message.startsWith('HTTP error')) {
      errorType = 'api';
      console.error('🌐 ERROR CLASSIFICATION: API returned error status');
    } else {
      console.error('❓ ERROR CLASSIFICATION: Unclassified error');
    }
    
    // UI cleanup: Remove loading message
    console.log('🗑️ ERROR HANDLING: Attempting to remove loading message');
    if (loadingMessage && loadingMessage.parentNode) {
      try {
        chatMessages.removeChild(loadingMessage);
        console.log('✅ ERROR HANDLING: Successfully removed loading message');
      } catch (cleanupError) {
        console.warn('⚠️ ERROR HANDLING: Failed to remove loading message', cleanupError);
      }
    } else {
      console.warn('⚠️ ERROR HANDLING: Loading message not found or already removed');
    }
    
    // Add user-friendly error message
    console.log('⚠️ ERROR HANDLING: Adding error message to chat');
    try {
      let userMessage;
      
      switch (errorType) {
        case 'timeout':
          userMessage = 'Lỗi: Yêu cầu mất quá nhiều thời gian. Vui lòng thử lại.';
          break;
        case 'network':
          userMessage = 'Lỗi: Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối mạng của bạn.';
          break;
        case 'parsing':
          userMessage = 'Lỗi: Không thể phân tích phản hồi từ máy chủ.';
          break;
        case 'api':
          userMessage = `Lỗi từ API: ${error.message}`;
          break;
        default:
          userMessage = `Lỗi: ${error.message}`;
      }
      
      addMessageToChat('system', userMessage);
      console.log('✅ ERROR HANDLING: Error message added to chat');
    } catch (messageError) {
      console.error('💥 ERROR HANDLING ERROR: Failed to add error message', messageError);
    }
  } finally {
    // Function completion timing
    console.timeEnd('sendMessage-total-execution');
    console.log('🏁 FUNCTION: sendMessage completed at', new Date().toISOString());
    
    // Final state logging
    console.log('📊 FINAL STATE: Conversation history length:', conversationHistory?.length || 0);
    console.log('📊 FINAL STATE: Chat messages count:', chatMessages?.childElementCount || 0);
    console.log('📊 FINAL STATE: User input value:', userInput?.value || 'empty');
  }
}
